# eka_eval/benchmarks/tasks/indic/indic_headline_generation.py
import torch
import os
from datasets import load_dataset
from tqdm import tqdm
import json
import logging
from typing import Dict, List, Any
import numpy as np
from datetime import datetime
import evaluate as hf_evaluate

from eka_eval.utils.prompt_utils import get_prompt_template, format_few_shot_prompt, get_prompt_data

logger = logging.getLogger(__name__)

DEFAULT_DATASET_NAME = "ai4bharat/IndicHeadlineGeneration"
DEFAULT_TARGET_LANGUAGES = [
    "as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"
]
DEFAULT_SPLIT = 'test'
DEFAULT_MAX_NEW_TOKENS = 64
DEFAULT_GENERATION_BATCH_SIZE = 8
DEFAULT_FEW_SHOT_COUNT = 0
DEFAULT_PROMPT_TEMPLATE_KEY_ZERO_SHOT = "indic_headline_generation_0shot"
DEFAULT_PROMPT_TEMPLATE_KEY_FEW_SHOT = "indic_headline_generation_5shot"
PROMPT_FILE_BENCHMARK_KEY = "indic_headline_generation"
PROMPT_FILE_CATEGORY = "indic"

def save_detailed_results(
    results_data: List[Dict],
    model_name: str,
    dataset_name: str,
    language: str,
    rouge1: float,
    rouge2: float,
    rougeL: float,
    bleu: float,
    results_dir: str,
    process_id: int = 0
) -> str:
    """Save detailed results to JSON file."""
    detailed_dir = os.path.join(results_dir, "detailed_results")
    os.makedirs(detailed_dir, exist_ok=True)
    
    model_clean = model_name.replace("/", "_").replace(":", "_")
    dataset_clean = dataset_name.replace("/", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"indic_headline_{model_clean}_{dataset_clean}_{language}_p{process_id}_{timestamp}.json"
    filepath = os.path.join(detailed_dir, filename)
    
    summary = {
        "model_name": model_name,
        "dataset_name": dataset_name,
        "language": language,
        "total_samples": len(results_data),
        "rouge1": rouge1,
        "rouge2": rouge2,
        "rougeL": rougeL,
        "bleu": bleu,
        "timestamp": datetime.now().isoformat(),
        "process_id": process_id
    }
    
    full_data = {
        "summary": summary,
        "detailed_results": results_data
    }
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(full_data, f, indent=2, ensure_ascii=False)
        logger.info(f"Detailed results saved to: {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Failed to save detailed results: {e}")
        return ""

def _get_fewshot_examples_from_config(num_few_shot: int, prompt_file_category: str, language: str) -> List[Dict]:
    """Load few-shot examples from prompt configuration"""
    if num_few_shot <= 0:
        return []
    
    loaded_examples_list = get_prompt_data(
        benchmark_name=PROMPT_FILE_BENCHMARK_KEY,
        data_key=f"default_few_shot_examples_{language}",
        specific_task_group=prompt_file_category
    )
    
    if loaded_examples_list and isinstance(loaded_examples_list, list):
        logger.info(f"Successfully loaded {len(loaded_examples_list)} few-shot examples for {language}.")
        return loaded_examples_list[:num_few_shot]
    
    logger.warning(f"Could not load examples for {language}, trying default")
    loaded_examples_list = get_prompt_data(
        benchmark_name=PROMPT_FILE_BENCHMARK_KEY,
        data_key="default_few_shot_examples",
        specific_task_group=prompt_file_category
    )
    
    if loaded_examples_list and isinstance(loaded_examples_list, list):
        return loaded_examples_list[:num_few_shot]
    
    return []

def _create_prompt(article: str, language: str, prompt_template_dict: Dict, few_shot_examples: List[Dict] = None) -> str:
    """Create language-specific prompt using templates."""
    main_q_data = {"article": article}
    
    if few_shot_examples and len(few_shot_examples) > 0:
        lang_prompts = prompt_template_dict.get("language_specific_prompts", {})
        if language in lang_prompts and isinstance(lang_prompts[language], dict):
            lang_config = lang_prompts[language]
        else:
            lang_config = lang_prompts.get("default", {
                "few_shot_example_template": prompt_template_dict.get("few_shot_example_template", "लेख: {article}\n\nशीर्षक: {headline}"),
                "template_suffix": prompt_template_dict.get("template_suffix", "लेख: {article}\n\nशीर्षक:")
            })
        
        custom_template_dict = {
            "template_prefix": prompt_template_dict.get("template_prefix", ""),
            "few_shot_example_template": lang_config.get("few_shot_example_template"),
            "few_shot_separator": prompt_template_dict.get("few_shot_separator", "\n\n"),
            "template_suffix": lang_config.get("template_suffix")
        }
        
        return format_few_shot_prompt(custom_template_dict, few_shot_examples, main_q_data)
    else:
        lang_prompts = prompt_template_dict.get("language_specific_prompts", {})
        if language in lang_prompts:
            if isinstance(lang_prompts[language], str):
                template = lang_prompts[language]
            else:
                template = lang_prompts[language].get("template", prompt_template_dict.get("template", "लेख: {article}\n\nशीर्षक:"))
        else:
            template = lang_prompts.get("default", prompt_template_dict.get("template", "लेख: {article}\n\nशीर्षक:"))
        
        return template.format(**main_q_data)

def evaluate_indic_headline_generation(
    pipe: Any, 
    tokenizer: Any, 
    model_name_for_logging: str, 
    device: Any,
    dataset_name: str = DEFAULT_DATASET_NAME,
    target_languages: List[str] = None,
    dataset_split: str = DEFAULT_SPLIT,
    num_few_shot: int = DEFAULT_FEW_SHOT_COUNT,
    prompt_template_name_zeroshot: str = DEFAULT_PROMPT_TEMPLATE_KEY_ZERO_SHOT,
    prompt_template_name_fewshot: str = DEFAULT_PROMPT_TEMPLATE_KEY_FEW_SHOT,
    prompt_file_benchmark_key: str = PROMPT_FILE_BENCHMARK_KEY,
    prompt_file_category: str = PROMPT_FILE_CATEGORY,
    max_new_tokens: int = DEFAULT_MAX_NEW_TOKENS,
    generation_batch_size: int = DEFAULT_GENERATION_BATCH_SIZE,
    process_id: int = 0,
    gpu_id: int = 0,
    num_gpus: int = 1,
    results_dir: str = "results_output",
    save_detailed: bool = True,
    **kwargs
) -> Dict[str, float]:

    if target_languages is None:
        target_languages = DEFAULT_TARGET_LANGUAGES

    logger.info(f"Starting IndicHeadlineGeneration ({num_few_shot}-shot): {model_name_for_logging}")
    logger.info(f"Target languages: {target_languages}")

    current_prompt_template_name = prompt_template_name_fewshot if num_few_shot > 0 else prompt_template_name_zeroshot
    prompt_template_dict = get_prompt_template(
        benchmark_name=prompt_file_benchmark_key,
        template_name=current_prompt_template_name,
        specific_task_group=prompt_file_category
    )
    
    if not prompt_template_dict:
        logger.error(f"Prompt template '{current_prompt_template_name}' not found")
        return {"IndicHeadlineGeneration": 0.0, "error_message": f"PromptTemplate '{current_prompt_template_name}' NotFound"}

    try:
        rouge_metric = hf_evaluate.load("rouge")
        bleu_metric = hf_evaluate.load("bleu")
    except Exception as e:
        logger.error(f"Failed to load metrics: {e}")
        return {"IndicHeadlineGeneration": 0.0, "error_message": "MetricsLoadFailed"}

    language_scores = {}
    all_rouge1 = []
    all_rouge2 = []
    all_rougeL = []
    all_bleu = []

    for lang_code in target_languages:
        logger.info(f"--- Evaluating Language: {lang_code} ---")
        
        try:
            dataset = load_dataset(dataset_name, name=lang_code, split=dataset_split)
            
            if len(dataset) == 0:
                logger.warning(f"No samples for {lang_code}")
                language_scores[lang_code] = None
                continue

            logger.info(f"Evaluating on {len(dataset)} samples for '{lang_code}'.")

            few_shot_examples_to_use = []
            if num_few_shot > 0:
                few_shot_examples_to_use = _get_fewshot_examples_from_config(num_few_shot, prompt_file_category, lang_code)

            predictions = []
            references = []
            detailed_results = []

            for example_idx, example in enumerate(tqdm(dataset, desc=f"Eval {lang_code}")):
                article = example.get("input", "")
                reference = example.get("target", "")

                if not article or not reference:
                    logger.warning(f"Skipping example {example_idx} in '{lang_code}' due to missing data.")
                    if save_detailed:
                        detailed_results.append({
                            "example_id": example_idx,
                            "input": article,
                            "reference": reference,
                            "prediction": "",
                            "skip_reason": "Missing data"
                        })
                    continue

                prompt = _create_prompt(article, lang_code, prompt_template_dict, few_shot_examples_to_use)

                try:
                    gen_config = {
                        "max_new_tokens": max_new_tokens,
                        "num_beams": 1,
                        "do_sample": False,
                        "eos_token_id": tokenizer.eos_token_id,
                        "pad_token_id": tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id,
                        "return_full_text": False
                    }
                    
                    with torch.no_grad():
                        outputs = pipe(prompt, **gen_config)
                    
                    prediction = ""
                    if outputs and isinstance(outputs, list) and outputs[0]:
                        prediction = outputs[0].get('generated_text', "").strip()

                except Exception as e:
                    logger.debug(f"Generation error: {e}")
                    prediction = ""

                predictions.append(prediction if prediction else "")
                references.append(reference)

                if save_detailed:
                    detailed_results.append({
                        "example_id": example_idx,
                        "input": article,
                        "reference": reference,
                        "prediction": prediction,
                        "language": lang_code
                    })

            if predictions and references:
                # Calculate ROUGE scores
                rouge_results = rouge_metric.compute(predictions=predictions, references=references)
                lang_rouge1 = rouge_results['rouge1']
                lang_rouge2 = rouge_results['rouge2']
                lang_rougeL = rouge_results['rougeL']
                
                # Calculate BLEU score
                bleu_results = bleu_metric.compute(predictions=predictions, references=[[ref] for ref in references])
                lang_bleu = bleu_results['bleu']
                
                language_scores[lang_code] = {
                    "rouge1": lang_rouge1,
                    "rouge2": lang_rouge2,
                    "rougeL": lang_rougeL,
                    "bleu": lang_bleu
                }
                
                all_rouge1.append(lang_rouge1)
                all_rouge2.append(lang_rouge2)
                all_rougeL.append(lang_rougeL)
                all_bleu.append(lang_bleu)
                
                logger.info(f"Scores for {lang_code} - ROUGE-1: {lang_rouge1:.4f}, ROUGE-2: {lang_rouge2:.4f}, ROUGE-L: {lang_rougeL:.4f}, BLEU: {lang_bleu:.4f}")
                
                if save_detailed and detailed_results:
                    save_detailed_results(
                        detailed_results,
                        model_name_for_logging,
                        dataset_name,
                        lang_code,
                        lang_rouge1,
                        lang_rouge2,
                        lang_rougeL,
                        lang_bleu,
                        results_dir,
                        process_id
                    )

        except Exception as e:
            logger.error(f"Error processing language {lang_code}: {e}")
            language_scores[lang_code] = None

    overall_rouge1 = np.mean(all_rouge1) if all_rouge1 else 0.0
    overall_rouge2 = np.mean(all_rouge2) if all_rouge2 else 0.0
    overall_rougeL = np.mean(all_rougeL) if all_rougeL else 0.0
    overall_bleu = np.mean(all_bleu) if all_bleu else 0.0

    final_scores = {
        "IndicHeadlineGeneration_ROUGE1": overall_rouge1,
        "IndicHeadlineGeneration_ROUGE2": overall_rouge2,
        "IndicHeadlineGeneration_ROUGEL": overall_rougeL,
        "IndicHeadlineGeneration_BLEU": overall_bleu
    }
    
    for lang, scores in language_scores.items():
        if scores:
            final_scores[f"IndicHeadlineGeneration_{lang}_ROUGE1"] = scores["rouge1"]
            final_scores[f"IndicHeadlineGeneration_{lang}_ROUGE2"] = scores["rouge2"]
            final_scores[f"IndicHeadlineGeneration_{lang}_ROUGEL"] = scores["rougeL"]
            final_scores[f"IndicHeadlineGeneration_{lang}_BLEU"] = scores["bleu"]

    logger.info(f"Overall Average - ROUGE-1: {overall_rouge1:.4f}, ROUGE-2: {overall_rouge2:.4f}, ROUGE-L: {overall_rougeL:.4f}, BLEU: {overall_bleu:.4f}")
    return final_scores