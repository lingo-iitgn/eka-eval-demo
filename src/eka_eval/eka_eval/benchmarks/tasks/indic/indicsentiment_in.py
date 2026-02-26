# eka_eval/benchmarks/tasks/indic/indicsentiment_in.py
import torch
import re
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

DEFAULT_DATASET_NAME = "ai4bharat/IndicSentiment"
DEFAULT_TARGET_LANGUAGES = [
    "Assamese", "Bengali", "Gujarati", "Hindi", "Kannada",
    "Malayalam", "Marathi", "Oriya", "Punjabi", "Tamil", "Telugu", "Urdu", "English"
]
DEFAULT_SPLIT = 'test'
DEFAULT_MAX_NEW_TOKENS = 10
DEFAULT_GENERATION_BATCH_SIZE = 8
DEFAULT_FEW_SHOT_COUNT = 0
DEFAULT_PROMPT_TEMPLATE_KEY_ZERO_SHOT = "indicsentiment_in_0shot"
DEFAULT_PROMPT_TEMPLATE_KEY_FEW_SHOT = "indicsentiment_in_5shot"
PROMPT_FILE_BENCHMARK_KEY = "indicsentiment_in"
PROMPT_FILE_CATEGORY = "indic"

def save_detailed_indicsentiment_results(
    results_data: List[Dict],
    model_name: str,
    dataset_name: str,
    language: str,
    accuracy: float,
    f1_score: float,
    results_dir: str,
    process_id: int = 0
) -> str:
    """Save detailed IndicSentiment results to JSON file."""
    detailed_dir = os.path.join(results_dir, "detailed_results")
    os.makedirs(detailed_dir, exist_ok=True)
    
    model_clean = model_name.replace("/", "_").replace(":", "_")
    dataset_clean = dataset_name.replace("/", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"indicsentiment_{model_clean}_{dataset_clean}_{language}_p{process_id}_{timestamp}.json"
    filepath = os.path.join(detailed_dir, filename)
    
    summary = {
        "model_name": model_name,
        "dataset_name": dataset_name,
        "language": language,
        "total_samples": len(results_data),
        "correct_predictions": sum(1 for r in results_data if r["is_correct"]),
        "accuracy": accuracy,
        "f1_score": f1_score,
        "timestamp": datetime.now().isoformat(),
        "process_id": process_id,
        "generation_failures": sum(1 for r in results_data if not r.get("extraction_successful", True))
    }
    
    full_data = {
        "summary": summary,
        "detailed_results": results_data
    }
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(full_data, f, indent=2, ensure_ascii=False)
        logger.info(f"Detailed IndicSentiment results saved to: {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Failed to save detailed IndicSentiment results: {e}")
        return ""

def _get_indicsentiment_fewshot_examples_from_config(num_few_shot: int, prompt_file_category: str) -> List[Dict]:
    """Load few-shot examples from prompt configuration"""
    if num_few_shot <= 0:
        return []
    
    loaded_examples_list = get_prompt_data(
        benchmark_name=PROMPT_FILE_BENCHMARK_KEY,
        data_key="default_few_shot_examples_indicsentiment",
        specific_task_group=prompt_file_category
    )
    
    if loaded_examples_list and isinstance(loaded_examples_list, list):
        logger.info(f"Successfully loaded {len(loaded_examples_list)} few-shot examples from JSON for IndicSentiment.")
        return loaded_examples_list[:num_few_shot]
    
    logger.warning(f"Could not load default_few_shot_examples_indicsentiment from prompts/{prompt_file_category}/{PROMPT_FILE_BENCHMARK_KEY}.json")
    return []

def _get_sentiment_mapping(prompt_template_dict: Dict) -> Dict[str, int]:
    """Get sentiment label to index mapping from config."""
    return prompt_template_dict.get("sentiment_mapping", {
        "Positive": 0,
        "Negative": 1,
        "Neutral": 2
    })

def _get_hindi_sentiment_mapping(prompt_template_dict: Dict) -> Dict[str, str]:
    """Get Hindi sentiment to English mapping from config."""
    return prompt_template_dict.get("hindi_sentiment_mapping", {
        "सकारात्मक": "Positive",
        "नकारात्मक": "Negative",
        "तटस्थ": "Neutral"
    })

def _create_indicsentiment_prompt(text: str, language: str, prompt_template_dict: Dict, few_shot_examples: List[Dict] = None) -> str:
    """Create language-specific prompt for IndicSentiment using templates."""
    main_q_data = {"text": text}
    
    if few_shot_examples and len(few_shot_examples) > 0:
        lang_prompts = prompt_template_dict.get("language_specific_prompts", {})
        if language in lang_prompts and isinstance(lang_prompts[language], dict):
            lang_config = lang_prompts[language]
        else:
            lang_config = lang_prompts.get("default", {
                "few_shot_example_template": prompt_template_dict.get("few_shot_example_template", "पाठ: {text}\n\nभावना: {sentiment}"),
                "template_suffix": prompt_template_dict.get("template_suffix", "पाठ: {text}\n\nभावना:")
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
                template = lang_prompts[language].get("template", prompt_template_dict.get("template", "पाठ: {text}\n\nभावना:"))
        else:
            template = lang_prompts.get("default", prompt_template_dict.get("template", "पाठ: {text}\n\nभावना:"))
        
        return template.format(**main_q_data)

def _parse_sentiment(generated_text: str, language: str, hindi_mapping: Dict[str, str]) -> Optional[str]:
    """Parse sentiment from generated text."""
    if not generated_text:
        return None
    
    first_line = generated_text.split('\n')[0].strip()
    if not first_line:
        return None
    
    logger.debug(f"IndicSentiment extraction input for {language}: '{first_line[:100]}'")
    
    # Try exact matches first
    sentiment_keywords = {
        "positive": "Positive",
        "negative": "Negative", 
        "neutral": "Neutral",
        "सकारात्मक": "Positive",
        "नकारात्मक": "Negative",
        "तटस्थ": "Neutral"
    }
    
    first_line_lower = first_line.lower()
    for keyword, sentiment in sentiment_keywords.items():
        if keyword in first_line_lower:
            logger.debug(f"IndicSentiment: Found '{keyword}' -> '{sentiment}'")
            return sentiment
    
    # Check Hindi mapping
    if language.lower() == "hindi":
        for hindi_word, english_sentiment in hindi_mapping.items():
            if hindi_word in first_line:
                logger.debug(f"IndicSentiment: Mapped Hindi '{hindi_word}' to '{english_sentiment}'")
                return english_sentiment
    
    logger.debug(f"IndicSentiment: No sentiment pattern matched for: '{first_line[:50]}'")
    return None

def _sentiment_to_index(sentiment_str: str, sentiment_mapping: Dict[str, int]) -> int:
    """Convert sentiment string to index."""
    if not sentiment_str:
        return -1
    
    # Direct mapping
    if sentiment_str in sentiment_mapping:
        return sentiment_mapping[sentiment_str]
    
    # Case insensitive search
    sentiment_lower = sentiment_str.lower()
    for key, value in sentiment_mapping.items():
        if key.lower() == sentiment_lower:
            return value
    
    return -1

def evaluate_indicsentiment(
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

    logger.info(f"Starting IndicSentiment ({num_few_shot}-shot): {model_name_for_logging}")
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
        return {"IndicSentiment": 0.0, "error_message": f"PromptTemplate '{current_prompt_template_name}' NotFound"}

    # Load few-shot examples
    few_shot_examples_to_use = []
    if num_few_shot > 0:
        few_shot_examples_to_use = _get_indicsentiment_fewshot_examples_from_config(num_few_shot, prompt_file_category)
        if not few_shot_examples_to_use:
            logger.warning("IndicSentiment: Failed to load few-shot examples from JSON, falling back to 0-shot.")
            num_few_shot = 0
            current_prompt_template_name = prompt_template_name_zeroshot
            prompt_template_dict = get_prompt_template(prompt_file_benchmark_key, current_prompt_template_name, prompt_file_category)
            if not prompt_template_dict:
                return {"IndicSentiment": 0.0, "error_message": "ZeroShotPromptTemplateNotFound"}

    hindi_mapping = _get_hindi_sentiment_mapping(prompt_template_dict)
    sentiment_mapping = _get_sentiment_mapping(prompt_template_dict)

    try:
        accuracy_metric = hf_evaluate.load("accuracy")
        f1_metric = hf_evaluate.load("f1")
    except Exception as e:
        logger.error(f"Failed to load metrics: {e}")
        return {"IndicSentiment": 0.0, "error_message": "MetricLoadFailed"}

    language_accuracies = {}
    language_f1_scores = {}
    all_individual_accuracies = []

    for lang_config_name in target_languages:
        logger.info(f"--- Evaluating Language: {lang_config_name} ---")
        
        try:
            # Load dataset for specific language config
            dataset = load_dataset(dataset_name, name=lang_config_name, split=dataset_split)
            
            if len(dataset) == 0:
                logger.warning(f"No samples for {lang_config_name}")
                language_accuracies[lang_config_name] = None
                language_f1_scores[lang_config_name] = None
                continue

            logger.info(f"Evaluating on {len(dataset)} samples for '{lang_config_name}'.")

            predictions_indices = []
            reference_indices = []
            detailed_results = []

            for example_idx, example in enumerate(tqdm(dataset, desc=f"Eval {lang_config_name}")):
                text = example.get("INDIC REVIEW", example.get("ENGLISH REVIEW", ""))
                label_str = example.get("LABEL", "")

                if not text or not label_str:
                    logger.warning(f"Skipping example in '{lang_config_name}' due to missing data.")
                    predictions_indices.append(-1)
                    reference_indices.append(_sentiment_to_index(label_str, sentiment_mapping))
                    if save_detailed:
                        detailed_results.append({
                            "sample_id": f"item_{example_idx}",
                            "text": text,
                            "true_label": label_str,
                            "predicted_sentiment": "SKIP",
                            "is_correct": False,
                            "extraction_successful": False,
                            "skip_reason": "Missing data"
                        })
                    continue

                prompt = _create_indicsentiment_prompt(text, lang_config_name, prompt_template_dict, few_shot_examples_to_use)

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
                    
                    generated_text = ""
                    if outputs and isinstance(outputs, list) and outputs[0]:
                        generated_text = outputs[0].get('generated_text', "").strip()

                except Exception as e:
                    logger.debug(f"Generation error: {e}")
                    generated_text = ""

                predicted_sentiment = _parse_sentiment(generated_text, lang_config_name, hindi_mapping)
                
                pred_idx = _sentiment_to_index(predicted_sentiment, sentiment_mapping) if predicted_sentiment else -1
                ref_idx = _sentiment_to_index(label_str, sentiment_mapping)
                
                extraction_successful = predicted_sentiment is not None
                if pred_idx == -1:
                    import random
                    pred_idx = random.choice([i for i in range(3) if i != ref_idx]) if ref_idx != -1 else 0
                
                is_correct = pred_idx == ref_idx
                predictions_indices.append(pred_idx)
                reference_indices.append(ref_idx)

                if save_detailed:
                    detailed_results.append({
                        "sample_id": f"item_{example_idx}",
                        "text": text[:200],
                        "true_label": label_str,
                        "true_label_index": ref_idx,
                        "predicted_sentiment": predicted_sentiment or "UNKNOWN",
                        "predicted_index": pred_idx,
                        "is_correct": is_correct,
                        "prompt_used": prompt[:500],
                        "generated_text": generated_text,
                        "extraction_successful": extraction_successful,
                        "language": lang_config_name
                    })

            # Calculate metrics
            valid_pairs = [(p, r) for p, r in zip(predictions_indices, reference_indices) if r != -1]
            
            if valid_pairs:
                valid_predictions = [p for p, r in valid_pairs]
                valid_references = [r for p, r in valid_pairs]
                
                acc_results = accuracy_metric.compute(predictions=valid_predictions, references=valid_references)
                f1_results = f1_metric.compute(predictions=valid_predictions, references=valid_references, average='macro')
                
                lang_accuracy = acc_results['accuracy']
                lang_f1 = f1_results['f1']
                
                language_accuracies[lang_config_name] = lang_accuracy
                language_f1_scores[lang_config_name] = lang_f1
                all_individual_accuracies.append(lang_accuracy)
                
                logger.info(f"Accuracy for {lang_config_name}: {lang_accuracy:.4f}")
                logger.info(f"F1 Score for {lang_config_name}: {lang_f1:.4f}")
                
                # Save detailed results for this language
                if save_detailed and detailed_results:
                    save_detailed_indicsentiment_results(
                        detailed_results,
                        model_name_for_logging,
                        dataset_name,
                        lang_config_name,
                        lang_accuracy,
                        lang_f1,
                        results_dir,
                        process_id
                    )
            else:
                language_accuracies[lang_config_name] = 0.0
                language_f1_scores[lang_config_name] = 0.0
                all_individual_accuracies.append(0.0)

        except Exception as e:
            logger.error(f"Error processing language {lang_config_name}: {e}")
            language_accuracies[lang_config_name] = None
            language_f1_scores[lang_config_name] = None

    overall_average = np.mean(all_individual_accuracies) if all_individual_accuracies else 0.0

    final_scores = {"IndicSentiment": overall_average}
    for lang, acc in language_accuracies.items():
        final_scores[f"IndicSentiment_{lang}"] = acc if acc is not None else 0.0
    for lang, f1 in language_f1_scores.items():
        final_scores[f"IndicSentiment_{lang}_F1"] = f1 if f1 is not None else 0.0

    logger.info(f"Overall IndicSentiment Average: {overall_average:.4f}")
    return final_scores