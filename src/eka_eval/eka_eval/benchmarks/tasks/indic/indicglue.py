# eka_eval/benchmarks/tasks/indic/indicglue.py
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

DEFAULT_DATASET_NAME = "ai4bharat/indic_glue"
DEFAULT_TASKS = [
    "actsa-sc.bn", "actsa-sc.gu", "actsa-sc.hi", "actsa-sc.kn", 
    "actsa-sc.ml", "actsa-sc.mr", "actsa-sc.or", "actsa-sc.pa",
    "actsa-sc.ta", "actsa-sc.te"
]
DEFAULT_SPLIT = 'test'
DEFAULT_MAX_NEW_TOKENS = 10
DEFAULT_FEW_SHOT_COUNT = 0
DEFAULT_PROMPT_TEMPLATE_KEY_ZERO_SHOT = "indicglue_0shot"
DEFAULT_PROMPT_TEMPLATE_KEY_FEW_SHOT = "indicglue_5shot"
PROMPT_FILE_BENCHMARK_KEY = "indicglue"
PROMPT_FILE_CATEGORY = "indic"

# Language code to full name mapping
LANGUAGE_MAP = {
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

def save_detailed_indicglue_results(
    results_data: List[Dict],
    model_name: str,
    dataset_name: str,
    task_name: str,
    accuracy: float,
    results_dir: str,
    process_id: int = 0
) -> str:
    """Save detailed IndicGLUE results to JSON file."""
    detailed_dir = os.path.join(results_dir, "detailed_results")
    os.makedirs(detailed_dir, exist_ok=True)
    
    model_clean = model_name.replace("/", "_").replace(":", "_")
    dataset_clean = dataset_name.replace("/", "_")
    task_clean = task_name.replace(".", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"indicglue_{model_clean}_{task_clean}_p{process_id}_{timestamp}.json"
    filepath = os.path.join(detailed_dir, filename)
    
    summary = {
        "model_name": model_name,
        "dataset_name": dataset_name,
        "task_name": task_name,
        "total_samples": len(results_data),
        "correct_predictions": sum(1 for r in results_data if r["is_correct"]),
        "accuracy": accuracy,
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
        logger.info(f"Detailed IndicGLUE results saved to: {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Failed to save detailed IndicGLUE results: {e}")
        return ""

def _get_indicglue_fewshot_examples(num_few_shot: int, task_name: str) -> List[Dict]:
    """Load few-shot examples from prompt configuration"""
    if num_few_shot <= 0:
        return []
    
    # Try to get task-specific examples first
    data_key = f"few_shot_examples_{task_name.replace('.', '_')}"
    loaded_examples = get_prompt_data(
        benchmark_name=PROMPT_FILE_BENCHMARK_KEY,
        data_key=data_key,
        specific_task_group=PROMPT_FILE_CATEGORY
    )
    
    # Fall back to default examples
    if not loaded_examples:
        loaded_examples = get_prompt_data(
            benchmark_name=PROMPT_FILE_BENCHMARK_KEY,
            data_key="default_few_shot_examples_indicglue",
            specific_task_group=PROMPT_FILE_CATEGORY
        )
    
    if loaded_examples and isinstance(loaded_examples, list):
        logger.info(f"Loaded {len(loaded_examples)} few-shot examples for IndicGLUE {task_name}")
        return loaded_examples[:num_few_shot]
    
    logger.warning(f"Could not load few-shot examples for IndicGLUE {task_name}")
    return []

def _get_label_mapping(prompt_template_dict: Dict, task_name: str) -> Dict[str, str]:
    """Get label to letter mapping from config."""
    task_mappings = prompt_template_dict.get("task_label_mappings", {})
    
    # Get task type (e.g., "actsa-sc" from "actsa-sc.hi")
    task_type = task_name.split('.')[0] if '.' in task_name else task_name
    
    if task_type in task_mappings:
        return task_mappings[task_type]
    
    # Default mapping for sentiment classification
    return prompt_template_dict.get("default_label_mapping", {
        "negative": "A",
        "neutral": "B", 
        "positive": "C"
    })

def _create_indicglue_prompt(
    text: str,
    language_code: str,
    task_name: str,
    prompt_template_dict: Dict,
    few_shot_examples: List[Dict] = None
) -> str:
    """Create language-specific prompt for IndicGLUE using templates."""
    language = LANGUAGE_MAP.get(language_code, language_code)
    
    # Get label options for this task
    label_mapping = _get_label_mapping(prompt_template_dict, task_name)
    labels = list(label_mapping.keys())
    choices_str = "\n".join([f"{label_mapping[label]}. {label}" for label in labels])
    
    main_q_data = {
        "text": text,
        "choices_str": choices_str
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

def _parse_predicted_label(
    generated_text: str,
    label_mapping: Dict[str, str]
) -> Optional[str]:
    """Parse predicted label from generated text."""
    if not generated_text:
        return None
    
    first_line = generated_text.split('\n')[0].strip()
    if not first_line:
        return None
    
    logger.debug(f"IndicGLUE extraction input: '{first_line[:100]}'")
    
    # Reverse mapping: letter -> label
    letter_to_label = {v: k for k, v in label_mapping.items()}
    valid_letters = list(letter_to_label.keys())
    
    # Try to find letter at start
    pattern = f"([{''.join(valid_letters)}])(?:[.)\s]|$)"
    match = re.match(pattern, first_line, re.IGNORECASE)
    
    if match:
        letter = match.group(1).upper()
        if letter in letter_to_label:
            result = letter_to_label[letter]
            logger.debug(f"IndicGLUE: Found letter '{letter}' -> label '{result}'")
            return result
    
    # Fallback: search for any valid letter
    for letter in valid_letters:
        if re.search(rf"\b{letter}\b", first_line, re.IGNORECASE):
            result = letter_to_label[letter]
            logger.debug(f"IndicGLUE: Fallback found '{letter}' -> '{result}'")
            return result
    
    # Try to find label words directly
    first_line_lower = first_line.lower()
    for label in label_mapping.keys():
        if label.lower() in first_line_lower:
            logger.debug(f"IndicGLUE: Found label word '{label}'")
            return label
    
    logger.debug(f"IndicGLUE: No pattern matched")
    return None

def evaluate_indicglue(
    pipe: Any,
    tokenizer: Any,
    model_name_for_logging: str,
    device: Any,
    dataset_name: str = DEFAULT_DATASET_NAME,
    target_tasks: List[str] = None,
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
    **kwargs
) -> Dict[str, float]:
    """
    Evaluate model on IndicGLUE benchmark.
    
    IndicGLUE contains sentiment classification tasks for 10 Indian languages.
    """
    if target_tasks is None:
        target_tasks = DEFAULT_TASKS
    
    logger.info(f"Starting IndicGLUE ({num_few_shot}-shot): {model_name_for_logging}")
    logger.info(f"Target tasks: {target_tasks}")
    
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
            "IndicGLUE": 0.0,
            "error_message": f"PromptTemplate '{current_prompt_template_name}' NotFound"
        }
    
    try:
        accuracy_metric = hf_evaluate.load("accuracy")
    except Exception as e:
        logger.error(f"Failed to load accuracy metric: {e}")
        return {"IndicGLUE": 0.0, "error_message": "AccuracyMetricLoadFailed"}
    
    task_accuracies = {}
    all_accuracies = []
    
    for task_name in target_tasks:
        logger.info(f"--- Evaluating Task: {task_name} ---")
        
        try:
            # Load dataset for specific task
            dataset = load_dataset(dataset_name, name=task_name, split=dataset_split)
            
            if len(dataset) == 0:
                logger.warning(f"No samples for {task_name}")
                task_accuracies[task_name] = None
                continue
            
            logger.info(f"Evaluating on {len(dataset)} samples for '{task_name}'")
            
            # Extract language code
            lang_code = task_name.split('.')[-1] if '.' in task_name else 'hi'
            
            # Load few-shot examples
            few_shot_examples = []
            if num_few_shot > 0:
                few_shot_examples = _get_indicglue_fewshot_examples(num_few_shot, task_name)
            
            label_mapping = _get_label_mapping(prompt_template_dict, task_name)
            predictions = []
            references = []
            detailed_results = []
            
            for example_idx, example in enumerate(tqdm(dataset, desc=f"Eval {task_name}")):
                text = example.get("text", "")
                label = example.get("label", -1)
                
                if not text or label == -1:
                    logger.warning(f"Skipping example {example_idx} due to missing data")
                    continue
                
                # Create prompt
                prompt = _create_indicglue_prompt(
                    text, lang_code, task_name, 
                    prompt_template_dict, few_shot_examples
                )
                
                # Generate prediction
                try:
                    gen_config = {
                        "max_new_tokens": max_new_tokens,
                        "num_beams": 1,
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
                
                # Parse prediction
                predicted_label = _parse_predicted_label(generated_text, label_mapping)
                
                # Convert label to index
                label_names = list(label_mapping.keys())
                if predicted_label and predicted_label in label_names:
                    pred_idx = label_names.index(predicted_label)
                else:
                    # Random wrong answer if extraction failed
                    import random
                    pred_idx = random.choice([i for i in range(len(label_names)) if i != label])
                
                is_correct = pred_idx == label
                predictions.append(pred_idx)
                references.append(label)
                
                if save_detailed:
                    detailed_results.append({
                        "example_id": example_idx,
                        "text": text,
                        "true_label": label_names[label] if 0 <= label < len(label_names) else "unknown",
                        "true_label_index": label,
                        "predicted_label": predicted_label or "UNKNOWN",
                        "predicted_index": pred_idx,
                        "is_correct": is_correct,
                        "prompt_used": prompt,
                        "generated_text": generated_text,
                        "extraction_successful": predicted_label is not None
                    })
            
            # Calculate accuracy
            if predictions and references:
                acc_results = accuracy_metric.compute(
                    predictions=predictions,
                    references=references
                )
                task_accuracy = acc_results['accuracy']
                task_accuracies[task_name] = task_accuracy
                all_accuracies.append(task_accuracy)
                logger.info(f"Accuracy for {task_name}: {task_accuracy:.4f}")
                
                # Save detailed results
                if save_detailed and detailed_results:
                    save_detailed_indicglue_results(
                        detailed_results,
                        model_name_for_logging,
                        dataset_name,
                        task_name,
                        task_accuracy,
                        results_dir,
                        process_id
                    )
            else:
                task_accuracies[task_name] = 0.0
                all_accuracies.append(0.0)
        
        except Exception as e:
            logger.error(f"Error processing task {task_name}: {e}")
            task_accuracies[task_name] = None
    
    # Calculate overall average
    overall_average = np.mean(all_accuracies) if all_accuracies else 0.0
    
    final_scores = {"IndicGLUE": overall_average}
    
    # Add per-task scores
    for task, acc in task_accuracies.items():
        task_key = f"IndicGLUE_{task.replace('.', '_')}"
        final_scores[task_key] = acc if acc is not None else 0.0
    
    logger.info(f"Overall IndicGLUE Average: {overall_average:.4f}")
    return final_scores