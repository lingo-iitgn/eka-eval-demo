# eka_eval/benchmarks/tasks/indic/indicqg.py
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

from eka_eval.utils.prompt_utils import get_prompt_template, format_prompt, format_few_shot_prompt, get_prompt_data

logger = logging.getLogger(__name__)

DEFAULT_DATASET_NAME = "ai4bharat/IndicQuestionGeneration"
DEFAULT_LANGUAGES = ["as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"]
DEFAULT_SPLIT = 'test'
DEFAULT_MAX_NEW_TOKENS = 128
DEFAULT_FEW_SHOT_COUNT = 0
DEFAULT_PROMPT_TEMPLATE_KEY_ZERO_SHOT = "indicqg_0shot"
DEFAULT_PROMPT_TEMPLATE_KEY_FEW_SHOT = "indicqg_5shot"
PROMPT_FILE_BENCHMARK_KEY = "indicqg"
PROMPT_FILE_CATEGORY = "indic"

LANGUAGE_MAP = {
    "as": "Assamese",
    "bn": "Bengali",
    "gu": "Gujarati",
    "hi": "Hindi",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "or": "Odia",
    "pa": "Punjabi",
    "ta": "Tamil",
    "te": "Telugu"
}

def save_detailed_indicqg_results(
    results_data: List[Dict],
    model_name: str,
    dataset_name: str,
    language: str,
    rouge_scores: Dict,
    bleu_score: float,
    results_dir: str,
    process_id: int = 0
) -> str:
    """Save detailed IndicQuestionGeneration results to JSON file."""
    detailed_dir = os.path.join(results_dir, "detailed_results")
    os.makedirs(detailed_dir, exist_ok=True)
    
    model_clean = model_name.replace("/", "_").replace(":", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"indicqg_{model_clean}_{language}_p{process_id}_{timestamp}.json"
    filepath = os.path.join(detailed_dir, filename)
    
    summary = {
        "model_name": model_name,
        "dataset_name": dataset_name,
        "language": language,
        "total_samples": len(results_data),
        "rouge_scores": rouge_scores,
        "bleu_score": bleu_score,
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
        logger.info(f"Detailed IndicQuestionGeneration results saved to: {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Failed to save detailed IndicQuestionGeneration results: {e}")
        return ""

def _get_indicqg_fewshot_examples(num_few_shot: int, language: str) -> List[Dict]:
    """Load few-shot examples from prompt configuration"""
    if num_few_shot <= 0:
        return []
    
    data_key = f"few_shot_examples_{language}"
    loaded_examples = get_prompt_data(
        benchmark_name=PROMPT_FILE_BENCHMARK_KEY,
        data_key=data_key,
        specific_task_group=PROMPT_FILE_CATEGORY
    )
    
    if not loaded_examples:
        loaded_examples = get_prompt_data(
            benchmark_name=PROMPT_FILE_BENCHMARK_KEY,
            data_key="default_few_shot_examples_indicqg",
            specific_task_group=PROMPT_FILE_CATEGORY
        )
    
    if loaded_examples and isinstance(loaded_examples, list):
        logger.info(f"Loaded {len(loaded_examples)} few-shot examples for IndicQG {language}")
        return loaded_examples[:num_few_shot]
    
    logger.warning(f"Could not load few-shot examples for IndicQG {language}")
    return []

def _create_indicqg_prompt(
    context: str,
    answer: str,
    language_code: str,
    prompt_template_dict: Dict,
    few_shot_examples: List[Dict] = None
) -> str:
    """Create language-specific prompt for IndicQuestionGeneration."""
    language = LANGUAGE_MAP.get(language_code, language_code)
    
    main_q_data = {
        "context": context,
        "answer": answer
    }
    
    if few_shot_examples and len(few_shot_examples) > 0:
        lang_prompts = prompt_template_dict.get("language_specific_prompts", {})
        lang_config = lang_prompts.get(language, lang_prompts.get("default", {}))
        
        custom_template_dict = {
            "template_prefix": prompt_template_dict.get("template_prefix", ""),
            "few_shot_example_template": lang_config.get(
                "few_shot_example_template",
                prompt_template_dict.get("few_shot_example_template", "")
            ),
            "few_shot_separator": prompt_template_dict.get("few_shot_separator", "\n\n"),
            "template_suffix": lang_config.get(
                "template_suffix",
                prompt_template_dict.get("template_suffix", "")
            )
        }
        
        return format_few_shot_prompt(custom_template_dict, few_shot_examples, main_q_data)
    else:
        lang_prompts = prompt_template_dict.get("language_specific_prompts", {})
        template = lang_prompts.get(
            language,
            lang_prompts.get("default", prompt_template_dict.get("template", ""))
        )
        
        return template.format(**main_q_data)

def evaluate_indicqg(
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
    generation_batch_size: int = 8,
    process_id: int = 0,
    gpu_id: int = 0,
    num_gpus: int = 1,
    results_dir: str = "results_output",
    save_detailed: bool = True,
    max_samples: Optional[int] = None,
    **kwargs
) -> Dict[str, float]:
    """
    Evaluate model on IndicQuestionGeneration benchmark.
    
    Task: Generate a question given context and answer.
    Metrics: ROUGE-L, BLEU
    """
    if target_languages is None:
        target_languages = DEFAULT_LANGUAGES
    
    logger.info(f"Starting IndicQuestionGeneration ({num_few_shot}-shot): {model_name_for_logging}")
    logger.info(f"Target languages: {target_languages}")
    
    # Get prompt template
    current_prompt_template_name = (
        prompt_template_name_fewshot if num_few_shot > 0
        else prompt_template_name_zeroshot
    )
    prompt_template_dict = get_prompt_template(
        benchmark_name=prompt_file_benchmark_key,
        template_name=current_prompt_template_name,
        specific_task_group=prompt_file_category
    )
    
    if not prompt_template_dict:
        logger.error(f"Prompt template '{current_prompt_template_name}' not found")
        return {
            "IndicQG": 0.0,
            "error_message": f"PromptTemplate '{current_prompt_template_name}' NotFound"
        }
    
    try:
        rouge_metric = hf_evaluate.load("rouge")
        bleu_metric = hf_evaluate.load("bleu")
    except Exception as e:
        logger.error(f"Failed to load metrics: {e}")
        return {"IndicQG": 0.0, "error_message": "MetricLoadFailed"}
    
    language_scores = {}
    all_rouge_l_scores = []
    all_bleu_scores = []
    
    for lang_code in target_languages:
        logger.info(f"--- Evaluating Language: {lang_code} ({LANGUAGE_MAP.get(lang_code, lang_code)}) ---")
        
        try:
            # Load dataset
            dataset = load_dataset(dataset_name, name=lang_code, split=dataset_split)
            
            if len(dataset) == 0:
                logger.warning(f"No samples for {lang_code}")
                language_scores[lang_code] = None
                continue
            
            # Limit samples if specified
            if max_samples and len(dataset) > max_samples:
                dataset = dataset.select(range(max_samples))
            
            logger.info(f"Evaluating on {len(dataset)} samples for '{lang_code}'")
            
            # Load few-shot examples
            few_shot_examples = []
            if num_few_shot > 0:
                few_shot_examples = _get_indicqg_fewshot_examples(num_few_shot, lang_code)
            
            predictions = []
            references = []
            detailed_results = []
            
            for example_idx, example in enumerate(tqdm(dataset, desc=f"Eval {lang_code}")):
                # Get fields - handle different possible field names
                context = example.get("context", "") or example.get("passage", "")
                answer = example.get("answer", "") or example.get("answer_text", "")
                question = example.get("question", "") or example.get("target", "")
                
                if not context or not answer or not question:
                    logger.warning(f"Skipping example {example_idx} due to missing data")
                    continue
                
                # Create prompt
                prompt = _create_indicqg_prompt(
                    context, answer, lang_code,
                    prompt_template_dict, few_shot_examples
                )
                
                # Generate
                try:
                    gen_config = {
                        "max_new_tokens": max_new_tokens,
                        "num_beams": 4,
                        "do_sample": False,
                        "eos_token_id": tokenizer.eos_token_id,
                        "pad_token_id": (
                            tokenizer.pad_token_id
                            if tokenizer.pad_token_id is not None
                            else tokenizer.eos_token_id
                        ),
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
                
                # Store for metrics
                if generated_text:
                    predictions.append(generated_text)
                    references.append(question)
                    
                    if save_detailed:
                        detailed_results.append({
                            "example_id": example_idx,
                            "context": context[:200] + "..." if len(context) > 200 else context,
                            "answer": answer,
                            "reference_question": question,
                            "generated_question": generated_text,
                            "prompt_used": prompt[:500] + "..." if len(prompt) > 500 else prompt
                        })
            
            # Calculate metrics
            if predictions and references:
                # ROUGE scores
                rouge_results = rouge_metric.compute(
                    predictions=predictions,
                    references=references,
                    use_stemmer=True
                )
                
                # BLEU score
                bleu_results = bleu_metric.compute(
                    predictions=predictions,
                    references=[[ref] for ref in references]
                )
                
                rouge_l = rouge_results['rougeL']
                bleu = bleu_results['bleu']
                
                language_scores[lang_code] = {
                    "rouge_l": rouge_l,
                    "bleu": bleu,
                    "rouge_1": rouge_results.get('rouge1', 0),
                    "rouge_2": rouge_results.get('rouge2', 0)
                }
                
                all_rouge_l_scores.append(rouge_l)
                all_bleu_scores.append(bleu)
                
                logger.info(f"Results for {lang_code}:")
                logger.info(f"  ROUGE-L: {rouge_l:.4f}")
                logger.info(f"  BLEU: {bleu:.4f}")
                
                # Save detailed results
                if save_detailed and detailed_results:
                    save_detailed_indicqg_results(
                        detailed_results,
                        model_name_for_logging,
                        dataset_name,
                        lang_code,
                        {
                            "rouge_l": rouge_l,
                            "rouge_1": rouge_results.get('rouge1', 0),
                            "rouge_2": rouge_results.get('rouge2', 0)
                        },
                        bleu,
                        results_dir,
                        process_id
                    )
            else:
                language_scores[lang_code] = None
        
        except Exception as e:
            logger.error(f"Error processing language {lang_code}: {e}", exc_info=True)
            language_scores[lang_code] = None
    
    # Calculate overall averages
    overall_rouge_l = np.mean(all_rouge_l_scores) if all_rouge_l_scores else 0.0
    overall_bleu = np.mean(all_bleu_scores) if all_bleu_scores else 0.0
    
    # Use ROUGE-L as primary metric (scaled to 0-100)
    primary_score = overall_rouge_l * 100
    
    final_scores = {
        "IndicQG": primary_score,
        "IndicQG_ROUGE-L": overall_rouge_l * 100,
        "IndicQG_BLEU": overall_bleu * 100
    }
    
    # Add per-language scores
    for lang, scores in language_scores.items():
        if scores:
            final_scores[f"IndicQG_{lang}_ROUGE-L"] = scores["rouge_l"] * 100
            final_scores[f"IndicQG_{lang}_BLEU"] = scores["bleu"] * 100
    
    logger.info(f"Overall IndicQG ROUGE-L: {overall_rouge_l:.4f}")
    logger.info(f"Overall IndicQG BLEU: {overall_bleu:.4f}")
    return final_scores