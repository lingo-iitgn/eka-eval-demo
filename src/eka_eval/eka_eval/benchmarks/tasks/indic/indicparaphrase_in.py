# eka_eval/benchmarks/tasks/indic/indicparaphrase_in.py
import torch
import os
from datasets import load_dataset
from tqdm import tqdm
import json
import logging
from typing import Dict, List, Any, Optional
import evaluate as hf_evaluate
import numpy as np
from datetime import datetime
from collections import defaultdict

from eka_eval.utils.prompt_utils import get_prompt_template, format_prompt, format_few_shot_prompt, get_prompt_data

logger = logging.getLogger(__name__)

DEFAULT_DATASET_NAME = "ai4bharat/IndicParaphrase"
DEFAULT_TARGET_LANGUAGES = [
    "as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"
]
DEFAULT_SPLIT = 'test'
DEFAULT_MAX_NEW_TOKENS = 128
DEFAULT_GENERATION_BATCH_SIZE = 8
DEFAULT_FEW_SHOT_COUNT = 0
DEFAULT_PROMPT_TEMPLATE_KEY_ZERO_SHOT = "indicparaphrase_in_0shot"
DEFAULT_PROMPT_TEMPLATE_KEY_FEW_SHOT = "indicparaphrase_in_5shot"
PROMPT_FILE_BENCHMARK_KEY = "indicparaphrase_in"
PROMPT_FILE_CATEGORY = "indic"

def save_detailed_indicparaphrase_results(
    results_data: List[Dict],
    model_name: str,
    dataset_name: str,
    language: str,
    bleu_score: float,
    rouge_scores: Dict[str, float],
    meteor_score: float,
    results_dir: str,
    process_id: int = 0
) -> str:
    """Save detailed IndicParaphrase results to JSON file."""
    detailed_dir = os.path.join(results_dir, "detailed_results")
    os.makedirs(detailed_dir, exist_ok=True)
    
    model_clean = model_name.replace("/", "_").replace(":", "_")
    dataset_clean = dataset_name.replace("/", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"indicparaphrase_{model_clean}_{dataset_clean}_{language}_p{process_id}_{timestamp}.json"
    filepath = os.path.join(detailed_dir, filename)
    
    summary = {
        "model_name": model_name,
        "dataset_name": dataset_name,
        "language": language,
        "total_samples": len(results_data),
        "bleu_score": bleu_score,
        "rouge_scores": rouge_scores,
        "meteor_score": meteor_score,
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
        logger.info(f"Detailed IndicParaphrase results saved to: {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Failed to save detailed IndicParaphrase results: {e}")
        return ""

def _get_indicparaphrase_fewshot_examples_from_config(num_few_shot: int, prompt_file_category: str) -> List[Dict]:
    """Load few-shot examples from prompt configuration"""
    if num_few_shot <= 0:
        return []
    
    loaded_examples_list = get_prompt_data(
        benchmark_name=PROMPT_FILE_BENCHMARK_KEY,
        data_key="default_few_shot_examples_indicparaphrase",
        specific_task_group=prompt_file_category
    )
    
    if loaded_examples_list and isinstance(loaded_examples_list, list):
        logger.info(f"Successfully loaded {len(loaded_examples_list)} few-shot examples from JSON for IndicParaphrase.")
        return loaded_examples_list[:num_few_shot]
    
    logger.warning(f"Could not load default_few_shot_examples_indicparaphrase from prompts/{prompt_file_category}/{PROMPT_FILE_BENCHMARK_KEY}.json")
    return []

def _create_indicparaphrase_prompt(input_text: str, language: str, prompt_template_dict: Dict, few_shot_examples: List[Dict] = None) -> str:
    """Create language-specific prompt for IndicParaphrase using templates."""
    main_q_data = {"input_text": input_text}
    
    if few_shot_examples and len(few_shot_examples) > 0:
        lang_prompts = prompt_template_dict.get("language_specific_prompts", {})
        if language in lang_prompts and isinstance(lang_prompts[language], dict):
            lang_config = lang_prompts[language]
        else:
            lang_config = lang_prompts.get("default", {
                "few_shot_example_template": prompt_template_dict.get("few_shot_example_template", "इनपुट: {input_text}\n\nपैराफ्रेज: {paraphrase}"),
                "template_suffix": prompt_template_dict.get("template_suffix", "इनपुट: {input_text}\n\nपैराफ्रेज:")
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
                template = lang_prompts[language].get("template", prompt_template_dict.get("template", "इनपुट: {input_text}\n\nपैराफ्रेज:"))
        else:
            template = lang_prompts.get("default", prompt_template_dict.get("template", "इनपुट: {input_text}\n\nपैराफ्रेज:"))
        
        return template.format(**main_q_data)

def evaluate_indicparaphrase(
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
    max_samples: int = None,
    **kwargs
) -> Dict[str, float]:

    if target_languages is None:
        target_languages = DEFAULT_TARGET_LANGUAGES

    logger.info(f"Starting IndicParaphrase ({num_few_shot}-shot): {model_name_for_logging}")
    logger.info(f"Target languages: {target_languages}")

    # Get prompt template
    current_prompt_template_name = prompt_template_name_fewshot if num_few_shot > 0 else prompt_template_name_zeroshot
    prompt_template_dict = get_prompt_template(
        benchmark_name=prompt_file_benchmark_key,
        template_name=current_prompt_template_name,
        specific_task_group=prompt_file_category
    )
    
    if not prompt_template_dict:
        logger.error(f"Prompt template '{current_prompt_template_name}' not found")
        return {"IndicParaphrase": 0.0, "error_message": f"PromptTemplate '{current_prompt_template_name}' NotFound"}

    # Load few-shot examples
    few_shot_examples_to_use = []
    if num_few_shot > 0:
        few_shot_examples_to_use = _get_indicparaphrase_fewshot_examples_from_config(num_few_shot, prompt_file_category)
        if not few_shot_examples_to_use:
            logger.warning("IndicParaphrase: Failed to load few-shot examples from JSON, falling back to 0-shot.")
            num_few_shot = 0
            current_prompt_template_name = prompt_template_name_zeroshot
            prompt_template_dict = get_prompt_template(prompt_file_benchmark_key, current_prompt_template_name, prompt_file_category)
            if not prompt_template_dict:
                return {"IndicParaphrase": 0.0, "error_message": "ZeroShotPromptTemplateNotFound"}

    try:
        bleu_metric = hf_evaluate.load("bleu")
        rouge_metric = hf_evaluate.load("rouge")
        meteor_metric = hf_evaluate.load("meteor")
    except Exception as e:
        logger.error(f"Failed to load metrics: {e}")
        return {"IndicParaphrase": 0.0, "error_message": "MetricLoadFailed"}

    language_bleu_scores = {}
    language_rouge_scores = {}
    language_meteor_scores = {}
    all_individual_bleu_scores = []

    for lang_config_name in target_languages:
        logger.info(f"--- Evaluating Language: {lang_config_name} ---")
        
        try:
            # Load dataset for specific language config
            dataset = load_dataset(dataset_name, name=lang_config_name, split=dataset_split)
            
            if len(dataset) == 0:
                logger.warning(f"No samples for {lang_config_name}")
                language_bleu_scores[lang_config_name] = None
                language_rouge_scores[lang_config_name] = None
                language_meteor_scores[lang_config_name] = None
                continue

            # Limit samples if specified
            if max_samples and len(dataset) > max_samples:
                dataset = dataset.select(range(max_samples))
                logger.info(f"Limited to {max_samples} samples for '{lang_config_name}'.")
            else:
                logger.info(f"Evaluating on {len(dataset)} samples for '{lang_config_name}'.")

            all_predictions = []
            all_references = []
            detailed_results = []

            for example_idx, example in enumerate(tqdm(dataset, desc=f"Eval {lang_config_name}")):
                input_text = example.get("input", "")
                target = example.get("target", "")
                references = example.get("references", [target])

                if not input_text or not target:
                    logger.warning(f"Skipping example in '{lang_config_name}' due to missing data.")
                    continue

                prompt = _create_indicparaphrase_prompt(input_text, lang_config_name, prompt_template_dict, few_shot_examples_to_use)

                try:
                    gen_config = {
                        "max_new_tokens": max_new_tokens,
                        "num_beams": 4,
                        "do_sample": False,
                        "eos_token_id": tokenizer.eos_token_id,
                        "pad_token_id": tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id,
                        "return_full_text": False
                    }
                    
                    with torch.no_grad():
                        outputs = pipe(prompt, **gen_config)
                    
                    generated_text = ""
                    if outputs and isinstance(outputs, list) and outputs[0]:
                        generated_text = outputs[0].get('generated_text', "").strip()

                except Exception as e:
                    logger.debug(f"Generation error: {e}")
                    generated_text = ""

                # Collect predictions and references
                all_predictions.append(generated_text if generated_text else input_text)
                all_references.append(references)

                if save_detailed:
                    detailed_results.append({
                        "sample_id": f"item_{example_idx}",
                        "input": input_text[:200],
                        "target": target[:200],
                        "references": [ref[:200] for ref in references[:3]],
                        "generated_paraphrase": generated_text[:200],
                        "prompt_used": prompt[:500],
                        "language": lang_config_name
                    })

            # Calculate metrics
            if all_predictions and all_references:
                # BLEU score
                try:
                    bleu_results = bleu_metric.compute(
                        predictions=all_predictions,
                        references=all_references
                    )
                    bleu_score = bleu_results['bleu'] * 100  # Convert to percentage
                except Exception as e:
                    logger.error(f"BLEU calculation error: {e}")
                    bleu_score = 0.0
                
                # ROUGE scores
                try:
                    # For ROUGE, we need to flatten references (use first reference)
                    rouge_refs = [refs[0] if refs else "" for refs in all_references]
                    rouge_results = rouge_metric.compute(
                        predictions=all_predictions,
                        references=rouge_refs
                    )
                    rouge_l = rouge_results.get('rougeL', 0.0) * 100
                    rouge_1 = rouge_results.get('rouge1', 0.0) * 100
                    rouge_2 = rouge_results.get('rouge2', 0.0) * 100
                except Exception as e:
                    logger.error(f"ROUGE calculation error: {e}")
                    rouge_l = rouge_1 = rouge_2 = 0.0
                
                # METEOR score
                try:
                    meteor_refs = [refs[0] if refs else "" for refs in all_references]
                    meteor_results = meteor_metric.compute(
                        predictions=all_predictions,
                        references=meteor_refs
                    )
                    meteor_score = meteor_results.get('meteor', 0.0) * 100
                except Exception as e:
                    logger.error(f"METEOR calculation error: {e}")
                    meteor_score = 0.0
                
                language_bleu_scores[lang_config_name] = bleu_score
                language_rouge_scores[lang_config_name] = {
                    'rouge1': rouge_1,
                    'rouge2': rouge_2,
                    'rougeL': rouge_l
                }
                language_meteor_scores[lang_config_name] = meteor_score
                all_individual_bleu_scores.append(bleu_score)
                
                logger.info(f"BLEU Score for {lang_config_name}: {bleu_score:.4f}")
                logger.info(f"ROUGE-L Score for {lang_config_name}: {rouge_l:.4f}")
                logger.info(f"METEOR Score for {lang_config_name}: {meteor_score:.4f}")
                
                # Save detailed results for this language
                if save_detailed and detailed_results:
                    save_detailed_indicparaphrase_results(
                        detailed_results,
                        model_name_for_logging,
                        dataset_name,
                        lang_config_name,
                        bleu_score,
                        {'rouge1': rouge_1, 'rouge2': rouge_2, 'rougeL': rouge_l},
                        meteor_score,
                        results_dir,
                        process_id
                    )
            else:
                language_bleu_scores[lang_config_name] = 0.0
                language_rouge_scores[lang_config_name] = {'rouge1': 0.0, 'rouge2': 0.0, 'rougeL': 0.0}
                language_meteor_scores[lang_config_name] = 0.0
                all_individual_bleu_scores.append(0.0)

        except Exception as e:
            logger.error(f"Error processing language {lang_config_name}: {e}")
            language_bleu_scores[lang_config_name] = None
            language_rouge_scores[lang_config_name] = None
            language_meteor_scores[lang_config_name] = None

    overall_average = np.mean(all_individual_bleu_scores) if all_individual_bleu_scores else 0.0

    final_scores = {"IndicParaphrase": overall_average}
    for lang, bleu in language_bleu_scores.items():
        final_scores[f"IndicParaphrase_{lang}_BLEU"] = bleu if bleu is not None else 0.0
    for lang, rouge in language_rouge_scores.items():
        if rouge:
            final_scores[f"IndicParaphrase_{lang}_ROUGE-L"] = rouge.get('rougeL', 0.0)
    for lang, meteor in language_meteor_scores.items():
        final_scores[f"IndicParaphrase_{lang}_METEOR"] = meteor if meteor is not None else 0.0

    logger.info(f"Overall IndicParaphrase Average BLEU: {overall_average:.4f}")
    return final_scores