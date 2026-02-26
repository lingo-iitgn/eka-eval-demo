# eka_eval/config/benchmark_config.py (CORRECTED)

BENCHMARK_CONFIG = {
   "CODE GENERATION": {
        "HumanEval": {
            "description": "Pass@k accuracy for HumanEval (Chen et al., 2021)",
            "evaluation_function": "code.humaneval.evaluate_humaneval",  
            "task_args": {
                "dataset_name": "openai_humaneval",
                "dataset_split": "test",
                "num_samples_per_task": 1,
                "use_fewshot": False,
                "max_new_tokens_completion": 384
            }
        },
        "MBPP": {
            "description": "Pass@k accuracy for MBPP (Austin et al., 2021)",
            "evaluation_function": "code.mbpp.evaluate_mbpp",
            "task_args": {
                "dataset_name_primary": "google-research-datasets/mbpp",
                "dataset_config_primary": "full",
                "dataset_name_fallback": "mbpp",
                "dataset_config_fallback": "sanitized",
                "dataset_split": "test",
                "num_samples_per_task": 1,
                "include_tests_in_prompt": False,
                "max_new_tokens_completion": 512
            }
        },
        "HumanEval+": {
            "description": "Pass@k accuracy for HumanEval+ (Liu et al., 2024a)",
            "evaluation_function": "code.humanevalplus.evaluate_humanevalplus",
            "task_args": {
                "dataset_name": "evalplus/humanevalplus",
                "dataset_split": "test",
                "num_samples_per_task": 1,
                "max_new_tokens_completion": 384
            }
        },
        "MBPP EvalPlus": {
            "description": "Pass@k accuracy for MBPP EvalPlus (Liu et al., 2024a)",
            "evaluation_function": "code.mbppplus.evaluate_mbpp_plus",
            "task_args": {
                "dataset_name_primary": "evalplus/mbppplus",
                "dataset_config_primary": None,
                "dataset_split": "test",
                "num_samples_per_task": 1,
                "max_new_tokens_completion": 512
            }
        }
   },
        
    "Tool use": {
        "API-Bank": {
        "description": "API function calling accuracy on API-Bank dataset",
        "evaluation_function": "tool_use.apibank.evaluate_apibank",
        "task_args": {
            "dataset_name": "liminghao1630/API-Bank",
            "dataset_split": "test",
            "max_new_tokens": 512,
            "generation_batch_size": 1,
            "num_few_shot": 0,
            "save_outputs": True,
            "resume": False
        }
    },
    "APIBench": {
        "description": "API call generation accuracy on APIBench dataset",
        "evaluation_function": "tool_use.apibench.evaluate_apibench",
        "task_args": {
            "dataset_name": "gorilla-llm/APIBench",
            "dataset_split": "test",
            "max_new_tokens": 256,
            "generation_batch_size": 1,
            "num_few_shot": 0,
            "save_outputs": True,
            "resume": False
        }
    }
    },
        
    # --- FIX #2: Merged the two "MATH" blocks into one ---
    "MATH": {
        "GSM8K": {
            "evaluation_function": "math_eval.gsm8k.evaluate_gsm8k",
            "task_args": {
                "dataset_name": "openai/gsm8k",
                "dataset_split": "test", 
                "num_few_shot": 5,
                "max_new_tokens": 384,
                "generation_batch_size": 8
            },
        },
        "MATH": {
            "description": "Accuracy on Hendrycks MATH (Hendrycks et al., 2021b)",
            "evaluation_function": "math_eval.math.evaluate_math",
            "task_args": {
                "dataset_name": "nlile/hendrycks-MATH-benchmark",
                "dataset_split": "test",
                "num_few_shot": 4,
                "max_new_tokens": 512,
                "generation_batch_size": 4
            }
        },
        "GPQA": {
            "description": "Accuracy on GPQA (Rein et al., 2023)",
            "evaluation_function": "math_eval.gpqa.evaluate_gpqa",
            "task_args": {
                "dataset_name": "Idavidrein/gpqa",
                "dataset_config": "gpqa_main",
                "dataset_split": "test",
                "num_few_shot": 3,
                "max_new_tokens": 10,
                "generation_batch_size": 8
            }
        },
        "ARC-Challenge": {
            "description": "Accuracy on ARC-Challenge (Clark et al., 2018)",
            "evaluation_function": "reasoning.arc_challenge.evaluate_arc_challenge",
            "task_args": {
                "dataset_name": "ai2_arc",
                "dataset_config_name": "ARC-Challenge",
                "dataset_split": "test",
                "max_new_tokens": 5,
                "generation_batch_size": 8
            }
        }
    },
    
    "READING COMPREHENSION": {
        "SQuAD": {
            "description": "F1 / Exact Match on SQuAD (Rajpurkar et al., 2018)",
            "evaluation_function": "reading_comprehension.squad.evaluate_squad",
            "task_args": {
                "dataset_name": "squad",
                "dataset_split": "validation[:5]",
                "max_new_tokens": 64,
                "generation_batch_size": 8,
                "checkpoint_dir": "checkpoints/squad_checkpoints",
                "resume": True,
                "checkpoint_save_interval_batches": 50
            }
        },
        "QuAC": {
            "description": "F1 / Exact Match on QuAC (Choi et al., 2018)",
            "evaluation_function": "reading_comprehension.quac.evaluate_quac",
            "task_args": {
                "dataset_name": "allenai/quac",
                "dataset_split": "validation",
                "max_new_tokens": 64,
                "generation_batch_size": 8,
                "checkpoint_dir": "checkpoints/quac_checkpoints",
                "resume": True,
                "checkpoint_save_interval_batches": 50
            }
        },
        "BoolQ": {
            "description": "Accuracy on BoolQ (Clark et al., 2019)",
            "evaluation_function": "reading_comprehension.boolq.evaluate_boolq",
            "task_args": {
                "dataset_name": "google/boolq",
                "dataset_split": "validation",
                "max_new_tokens": 10,
                "generation_batch_size": 16,
                "checkpoint_dir": "checkpoints/boolq_checkpoints",
                "resume": True,
                "checkpoint_save_interval_batches": 100
            }
        }
    },
    
    "COMMONSENSE REASONING": {
        "PIQA": {
        "description": "Accuracy on PIQA (Bisk et al., 2020)",
        "evaluation_function": "commonsense_reasoning.piqa.evaluate_piqa",
        "task_args": {
            "dataset_name": "piqa",
            "dataset_split": "validation",
            "max_new_tokens": 10,
            "generation_batch_size": 16,
            "num_few_shot": 5,
            "evaluation_method": "likelihood", 
            "save_outputs": False,
            "disable_progress_bar": False,
            "prompt_template_key_likelihood": "piqa_likelihood",
            "prompt_template_key_generation": "piqa_generation", 
            "prompt_template_key_few_shot_likelihood": "piqa_5shot_likelihood",
            "prompt_template_key_few_shot_generation": "piqa_5shot_generation",
            "prompt_file_benchmark_key": "piqa",
            "prompt_file_category": "reasoning"
        }
        },
        "SIQA": {
            "description": "Accuracy on SIQA (Sap et al., 2019)",
            "evaluation_function": "commonsense_reasoning.siqa.evaluate_siqa",
            "task_args": {
                "dataset_name": "allenai/social_i_qa",
                "dataset_split": "validation",
                "max_new_tokens": 5,
                "generation_batch_size": 16
            }
        },
        "HellaSwag": {
            "description": "Accuracy on HellaSwag (Zellers et al., 2019a)",
            "evaluation_function": "commonsense_reasoning.hellaswag.evaluate_hellaswag",
            "task_args": {
                "dataset_name": "hellaswag",
                "dataset_split": "validation",
                "max_new_tokens": 50,
                "generation_batch_size": 8
            }
        },
        "ARC-Easy": {
            "description": "Accuracy on ARC-Easy (Clark et al., 2018)",
            "evaluation_function": "commonsense_reasoning.arc-e.evaluate_arc_easy",
            "task_args": {
                "dataset_name": "ai2_arc",
                "dataset_config_name": "ARC-Easy",
                "dataset_split": "test",
                "max_new_tokens": 5,
                "generation_batch_size": 8
            }
        },
        "WinoGrande": {
            "description": "Accuracy on WinoGrande (Sakaguchi et al., 2021)",
            "evaluation_function": "commonsense_reasoning.winogrande.evaluate_winogrande",
            "task_args": {
                "dataset_name": "winogrande",
                "dataset_config_name": "winogrande_xl",
                "dataset_split": "validation",
                "max_new_tokens": 5,
                "generation_batch_size": 16
            }
        },
        "CommonSenseQA": {
            "description": "Accuracy on CommonSenseQA (Talmor et al., 2018)",
            "evaluation_function": "commonsense_reasoning.commonsenseqa.evaluate_commonsenseqa",
            "task_args": {
                "dataset_name": "commonsense_qa",
                "dataset_split": "validation",
                "num_few_shot": 7,
                "max_new_tokens": 5,
                "generation_batch_size": 8
            }
        },
        "OpenBookQA": {
            "description": "Accuracy on OpenBookQA (Mihaylov et al., 2018)",
            "evaluation_function": "commonsense_reasoning.openbookqa.evaluate_openbookqa",
            "task_args": {
                "dataset_name": "allenai/openbookqa",
                "dataset_config_name": "main",
                "dataset_split": "test",
                "max_new_tokens": 5,
                "generation_batch_size": 8
            }
        }
    },
    
    "WORLD KNOWLEDGE": {
        "TriviaQA": {
            "description": "Accuracy on TriviaQA (Joshi et al., 2017)",
            "evaluation_function": "knowledge.triviaqa.evaluate_triviaqa",
            "task_args": {
                "dataset_name": "trivia_qa",
                "dataset_config_name": "rc.nocontext",
                "dataset_split": "validation",
                "num_few_shot": 5,
                "max_new_tokens": 50,
                "generation_batch_size": 8
            }
        },
        "NaturalQuestions": {
            "description": "Accuracy on NaturalQuestions (Kwiatkowski et al., 2019)",
            "evaluation_function": "knowledge.nq.evaluate_nq",
            "task_args": {
                "dataset_name": "nq_open",
                "dataset_split": "validation",
                "num_few_shot": 5,
                "max_new_tokens": 50,
                "generation_batch_size": 8
            }
        }
    },
    
    "LONG CONTEXT": {
        "ZeroSCROLLS": {
            "description": "Aggregated score on selected ZeroSCROLLS sub-tasks",
            "evaluation_function": "long_context.zeroscrolls.evaluate_zeroscrolls",
            "task_args": {
                "sub_tasks_to_run": ["gov_report", "summ_screen_fd"],
                "num_samples_per_task": 50,
                "max_new_tokens": 512
            }
        },
        "NeedleInAHaystack": {
            "description": "Retrieval accuracy on Needle-in-a-Haystack",
            "evaluation_function": "long_context.niah.evaluate_niah",
            "task_args": {
                "context_lengths": [4000, 8000, 16000],
                "depth_percents": [0, 25, 50, 75, 100],
                "max_new_tokens": 50,
                "save_outputs": True 
            }
        },
        "InfiniteBench": {
            "description": "Task accuracy on InfiniteBench long context tasks",
            "evaluation_function": "long_context.infinitebench.evaluate_infinitebench",
            "task_args": {
                "dataset_split": "test", 
                "max_new_tokens": 100,
                "num_few_shot": 3,
                "generation_batch_size": 1, 
                "save_outputs": True
            }
        }
    },
    
    # --- FIX #1: Moved the opening brace { to this line ---
    "General": {
        "MMLU": {
            "description": "5-shot Accuracy on MMLU (Hendrycks et al., 2021a)",
            "evaluation_function": "general.mmlu.evaluate_mmlu",
            "task_args": {
                "dataset_name": "cais/mmlu",
                "dataset_config_name": "all",
                "dataset_split": "test",
                "num_few_shot": 5,
                "max_new_tokens": 5,
                "generation_batch_size": 8
            }
        },
        "MMLU-Pro": {
            "description": "5-shot Accuracy on MMLU-Pro (Wang et al., 2024b)",
            "evaluation_function": "general.mmlu_pro.evaluate_mmlu_pro",
            "task_args": {
                "dataset_name": "TIGER-Lab/MMLU-Pro",
                "dataset_split": "test",
                "num_few_shot": 5,
                "max_new_tokens": 5,
                "generation_batch_size": 8
            }
        },
        "CNN_DailyMail": {
            "description": "ROUGE scores on CNN/DailyMail Summarization (Hermann et al., 2015)",
            "evaluation_function": "general.cnn_daily_mail.evaluate_cnn_dailymail",
            "task_args": {
                "dataset_name": "abisee/cnn_dailymail",
                "dataset_config_name": "3.0.0",
                "dataset_split": "validation",
                "max_new_tokens": 150,
                "generation_batch_size": 4,
                "save_outputs": False
            }
        },
        "WMT14_EN_FR": {
            "description": "BLEU score on WMT14 English to French Translation",
            "evaluation_function": "general.wmt.evaluate_wmt14_en_fr",
            "task_args": {
                "dataset_name": "presencesw/wmt14_fr_en",
                "dataset_split": "validation",
                "translation_direction": "en_fr",
                "max_new_tokens": 200,
                "generation_batch_size": 4,
                "save_outputs": False
            }
        },
        "WMT14_FR_EN": {
            "description": "BLEU score on WMT14 French to English Translation",
            "evaluation_function": "general.wmt.evaluate_wmt14_fr_en",
            "task_args": {
                "dataset_name": "presencesw/wmt14_fr_en",
                "dataset_split": "validation",
                "translation_direction": "fr_en",
                "max_new_tokens": 200,
                "generation_batch_size": 4,
                "save_outputs": False
            }
        },
        "IFEval": {
            "description": "Instruction Following Accuracy on IFEval (Zhou et al., 2023)",
            "evaluation_function": "general.ifeval.evaluate_ifeval",
            "task_args": {
                "dataset_name": "google/ifeval",
                "dataset_split": "test"
            }
        },
        "BBH": {
            "description": "3-shot Accuracy on a BBH subtask (Suzgun et al., 2022)",
            "evaluation_function": "general.bbh.evaluate_bbh",
            "task_args": {
                "dataset_name": "lukaemon/bbh",
                "dataset_config_name": "boolean_expressions",
                "dataset_split": "test",
                "num_few_shot": 3,
                "max_new_tokens": 10,
                "generation_batch_size": 8
            }
        },
        "AGIEval": {
            "description": "3–5 shot Accuracy on an AGIEval subtask (Zhong et al., 2023)",
            "evaluation_function": "general.agieval.evaluate_agieval",
            "task_args": {
                "dataset_name": "hails/agieval",
                "dataset_config_name": "aqua-rat",
                "dataset_split": "test",
                "num_few_shot": 3,
                "max_new_tokens": 10,
                "generation_batch_size": 8
            }
        } 
    },
    
    "MULTILINGUAL BENCHMARKS": {
        
"IndicSentenceSummarization": {
    "description": "ROUGE and BLEU scores on Indic Sentence Summarization benchmark",
    "evaluation_function": "indic.indic_sentence_summarization.evaluate_indic_sentence_summarization",
    "task_args": {
        "dataset_name": "ai4bharat/IndicSentenceSummarization",
        "target_languages": ["as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
        "dataset_split": "test",
        "num_few_shot": 0,
        "max_new_tokens": 128,
        "generation_batch_size": 8,
        "save_detailed": False,
        "prompt_template_name_zeroshot": "indic_sentence_summarization_0shot",
        "prompt_template_name_fewshot": "indic_sentence_summarization_5shot",
        "prompt_file_benchmark_key": "indic_sentence_summarization",
        "prompt_file_category": "indic"
    }
},

"IndicHeadlineGeneration": {
    "description": "ROUGE and BLEU scores on Indic Headline Generation benchmark",
    "evaluation_function": "indic.indic_headline_generation.evaluate_indic_headline_generation",
    "task_args": {
        "dataset_name": "ai4bharat/IndicHeadlineGeneration",
        "target_languages": ["as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
        "dataset_split": "test",
        "num_few_shot": 0,
        "max_new_tokens": 64,
        "generation_batch_size": 8,
        "save_detailed": False,
        "prompt_template_name_zeroshot": "indic_headline_generation_0shot",
        "prompt_template_name_fewshot": "indic_headline_generation_5shot",
        "prompt_file_benchmark_key": "indic_headline_generation",
        "prompt_file_category": "indic"
    }
},
"IndicQuestionGeneration": {
    "description": "Question generation from context and answer using ROUGE-L and BLEU metrics (11 Indian languages)",
    "evaluation_function": "indic.indicquestiongeneration.evaluate_indicquestiongeneration",
    "task_args": {
        "dataset_name": "ai4bharat/IndicQuestionGeneration",
        "target_languages": ["as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
        "dataset_split": "test",
        "max_new_tokens": 128,
        "save_detailed": False,
        "max_samples": None,  # Set to integer to limit samples (e.g., 100 for testing)
        "prompt_file_benchmark_key": "indicquestiongeneration"
    }
},

"IndicSentenceSummarization": {
    "description": "Document summarization using ROUGE metrics (11 Indian languages)",
    "evaluation_function": "indic.indicsentencesummarization.evaluate_indicsentencesummarization",
    "task_args": {
        "dataset_name": "ai4bharat/IndicSentenceSummarization",
        "target_languages": ["as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
        "dataset_split": "test",
        "max_new_tokens": 256,
        "save_detailed": False,
        "max_samples": None,  # Set to integer to limit samples
        "prompt_file_benchmark_key": "indicsentencesummarization"
    }
},

"IndicHeadlineGeneration": {
    "description": "News headline generation using ROUGE and BLEU metrics (11 Indian languages)",
    "evaluation_function": "indic.indicheadlinegeneration.evaluate_indicheadlinegeneration",
    "task_args": {
        "dataset_name": "ai4bharat/IndicHeadlineGeneration",
        "target_languages": ["as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
        "dataset_split": "test",
        "max_new_tokens": 64,
        "save_detailed": False,
        "max_samples": None,  # Set to integer to limit samples
        "prompt_file_benchmark_key": "indicheadlinegeneration"
    }
},
         "IndicMMLU-Pro": {
        "description": "Accuracy on the IndicMMLU-Pro benchmark for multilingual language understanding in Indic languages",
        "evaluation_function": "indic.indicmmlu_pro_in.evaluate_indicmmlu_pro",
        "task_args": {
            "dataset_name": "LinguaLift/IndicMMLU-Pro",
            "target_languages": [
                "Hindi", "Bengali", "Telugu", "Marathi", "Tamil",
                "Gujarati", "Urdu", "Kannada", "Punjabi"
            ],
            "dataset_split": "test",
            "max_new_tokens": 10,
            "save_detailed": False,
            "prompt_file_benchmark_key": "indicmmlu_pro_in"
        }
    },

    "IndicNER": {
        "description": "F1 score on the IndicNER (Naamapadam) benchmark for named entity recognition in Indic languages",
        "evaluation_function": "indic.indicner_in.evaluate_indicner",
        "task_args": {
            "dataset_name": "ai4bharat/naamapadam",
            "target_languages": [
                "as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"
            ],
            "dataset_split": "test",
            "max_new_tokens": 512,
            "generation_batch_size": 4,
            "save_detailed": False,
            "max_samples": 500,  # Limit for faster evaluation
            "prompt_file_benchmark_key": "indicner_in"
        }
    },

    "IndicParaphrase": {
        "description": "BLEU score on the IndicParaphrase benchmark for paraphrase generation in Indic languages",
        "evaluation_function": "indic.indicparaphrase_in.evaluate_indicparaphrase",
        "task_args": {
            "dataset_name": "ai4bharat/IndicParaphrase",
            "target_languages": [
                "as", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"
            ],
            "dataset_split": "test",
            "max_new_tokens": 128,
            "generation_batch_size": 8,
            "save_detailed": False,
            "max_samples": 1000,  # Limit for faster evaluation
            "prompt_file_benchmark_key": "indicparaphrase_in"
        }
    },
        
"IndicSentiment": {
    "description": "Sentiment analysis accuracy on the IndicSentiment benchmark for Indic languages",
    "evaluation_function": "indic.indicsentiment_in.evaluate_indicsentiment",
    "task_args": {
        "dataset_name": "ai4bharat/IndicSentiment",
        "target_languages": [
            "Assamese", "Bengali", "Gujarati", "Hindi", "Kannada",
            "Malayalam", "Marathi", "Oriya", "Punjabi", "Tamil", "Telugu", "Urdu", "English"
        ],
        "dataset_split": "test",
        "max_new_tokens": 10,
        "save_detailed": False,
        "prompt_file_benchmark_key": "indicsentiment_in"
    }
},
                "IndicGLUE": {
    "description": "Accuracy on the IndicGLUE sentiment classification benchmark (10 Indian languages)",
    "evaluation_function": "indic.indicglue.evaluate_indicglue",
    "task_args": {
        "dataset_name": "ai4bharat/indic_glue",
        "target_tasks": [
            "actsa-sc.bn", "actsa-sc.gu", "actsa-sc.hi", "actsa-sc.kn",
            "actsa-sc.ml", "actsa-sc.mr", "actsa-sc.or", "actsa-sc.pa",
            "actsa-sc.ta", "actsa-sc.te"
        ],
        "dataset_split": "test",
        "max_new_tokens": 10,
        "save_detailed": False,
        "prompt_file_benchmark_key": "indicglue"
    }
},
        "MMLU-IN": {
            "description": "Accuracy on MMLU-Indic",
            "evaluation_function": "indic.mmlu_in.evaluate_mmlu_in",
            "task_args": {
                "dataset_name": "sarvamai/mmlu-indic",
                "target_languages": ["hi", "bn"],
                "dataset_split": "validation",
                "num_few_shot": 0,
                "max_new_tokens": 10,
                "save_detailed": False,
                "prompt_file_benchmark_key": "mmlu_in"
            }
        },
        "TriviaQA-IN": {
            "description": "Accuracy on TriviaQA-Indic-MCQ",
            "evaluation_function": "indic.triviaqa_in.evaluate_triviaqa_indic_mcq",
            "task_args": {
                "dataset_name": "sarvamai/trivia-qa-indic-mcq",
                "target_languages": ["bn", "te"],
                "dataset_split": "validation",
                "num_few_shot": 0,
                "max_new_tokens": 10,
                "save_detailed": False,
                "prompt_file_benchmark_key": "triviaqa_in"
            }
        },
        "GSM-8K-IN": {
            "description": "Accuracy on Indic GSM-8K",
            "evaluation_function": "indic.gsm8k_in.evaluate_gsm8k_in",
            "task_args": {
                "dataset_name": "sarvamai/gsm8k-indic",
                "target_languages": ["as", "bn"],
                "dataset_split": "test",
                "max_new_tokens": 256
            }
        },
        "CROSS SUM": {
            "description": "ROUGE-1 score on IndicGenBench CrossSum",
            "evaluation_function": "indic.cross_sum.evaluate_cross_sum",
            "task_args": {
                "dataset_name": "google/IndicGenBench_crosssum_in",
                "target_languages": ["bn", "en", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
                "dataset_split": "test",
                "num_samples_per_lang": 100, 
                "max_new_tokens": 256
            }
        },
        "BOOLQ-IN": {
            "description": "Accuracy on Indic BoolQ dataset",
            "evaluation_function": "indic.boolq_in.evaluate_boolq_in",
            "task_args": {
                "dataset_name": "sarvamai/boolq-indic",
                "target_languages": ["en", "bn", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
                "dataset_split": "validation",
                "max_new_tokens": 10
            }
        },

        "ARC-Challenge-Indic": {
            "description": "Zero-shot ARC-Challenge-Indic evaluation across 11 languages",
            "evaluation_function": "indic.arc_c_in.evaluate_arc_c_in",
            "task_args": {
                "dataset_name": "sarvamai/arc-challenge-indic",
                "target_languages": ["bn", "en", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
                "dataset_split": "validation",
                "num_few_shot": 0,
                "max_new_tokens": 10,
                "generation_batch_size": 8,
                "prompt_template_name_zeroshot": "arc_c_in_0shot",
                "prompt_template_name_fewshot": "arc_c_in_5shot",
                "prompt_file_benchmark_key": "arc_c_in",
                "prompt_file_category": "indic",
            }
        },
        # --- FIX #3: Removed the duplicate "MMLU-IN" block that was here ---
        "MILU": {
            "description": "Accuracy on the Massive Indic Language Understanding benchmark",
            "evaluation_function": "indic.milu_in.evaluate_milu_in",
            "task_args": {
                "dataset_name": "ai4bharat/MILU",
                "target_languages": ["Bengali", "English"],
                "dataset_split": "test",
                "max_new_tokens": 5,
                "save_detailed": False,
                "prompt_file_benchmark_key": "milu_in"
            }
        },
        "XQuAD-IN": {
            "description": "F1 / Exact Match on IndicGenBench XQuAD",
            "evaluation_function": "indic.xquad_in.evaluate_xquad_in",
            "task_args": {
                "dataset_name": "google/IndicGenBench_xquad_in",
                "target_languages": [ "bn", "en", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
                "dataset_split": "test",
                "num_samples_per_lang": 100, # For quick testing
                "max_new_tokens": 128
            }
        },
        "XorQA-IN": {
            "description": "F1 / Exact Match on IndicGenBench XorQA",
            "evaluation_function": "indic.xorqa_in.evaluate_xorqa_in",
            "task_args": {
                "dataset_name": "google/IndicGenBench_xorqa_in",
                "target_languages": ["bn", "en", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te"],
                "dataset_split": "test",
                "num_samples_per_lang": 100, 
                "max_new_tokens": 256,
                "generation_batch_size":4
            }
        },
        "Flores-IN": {
            "description": "chrF++ score for en->indic translation on Flores",
            "evaluation_function": "indic.flores_in.evaluate_flores_in",
            "task_args": {
                "dataset_name": "google/IndicGenBench_flores_in",
                "translation_direction": "enxx",
                "target_languages": ["as", "bn"],
                "num_samples_per_lang": 100,
                "batch_size": 4,
                "max_new_tokens": 128,
                "use_few_shot": True,
                "num_few_shot_examples": 3,
                 "dataset_split": "test[:10]"
            }
        }
    }
}