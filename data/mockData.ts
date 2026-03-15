import { Model, BenchmarkCategory, Benchmark } from '../types';

export const benchmarkCategories: BenchmarkCategory[] = [
  {
    id: 'code',
    name: 'CODE GENERATION',
    description: 'Programming and code generation capabilities',
    color: '#00BFFF',
    benchmarks: [
      { id: 'humaneval', name: 'HumanEval', category: 'code', description: 'Python code generation', difficulty: 'medium' },
      { id: 'mbpp', name: 'MBPP', category: 'code', description: 'Mostly Basic Python Problems', difficulty: 'medium' },
      { id: 'codexglue', name: 'CodeXGLUE', category: 'code', description: 'Code understanding', difficulty: 'hard' },
      { id: 'apps', name: 'APPS', category: 'code', description: 'Automated Programming Progress Standard', difficulty: 'hard' }
    ]
  },
  {
    id: 'math',
    name: 'MATH',
    description: 'Mathematical reasoning and problem-solving',
    color: '#00FFFF',
    benchmarks: [
      { id: 'gsm8k', name: 'GSM8K', category: 'math', description: 'Grade school math problems', difficulty: 'medium' },
      { id: 'math', name: 'MATH', category: 'math', description: 'Mathematical reasoning', difficulty: 'hard' },
      { id: 'gpqa', name: 'GPQA', category: 'math', description: 'Graduate-level problems', difficulty: 'hard' },
      { id: 'arc-challenge', name: 'ARC-Challenge', category: 'math', description: 'Abstract reasoning challenge', difficulty: 'hard' }
    ]
  },
  {
    id: 'reasoning',
    name: 'REASONING',
    description: 'Logical reasoning and problem-solving capabilities',
    color: '#FFD700',
    benchmarks: [
      { id: 'arc', name: 'ARC', category: 'reasoning', description: 'Abstract Reasoning Corpus', difficulty: 'hard' },
      { id: 'hellaswag', name: 'HellaSwag', category: 'reasoning', description: 'Commonsense reasoning', difficulty: 'medium' },
      { id: 'piqa', name: 'PIQA', category: 'reasoning', description: 'Physical reasoning', difficulty: 'medium' },
      { id: 'winogrande', name: 'WinoGrande', category: 'reasoning', description: 'Commonsense reasoning', difficulty: 'medium' }
    ]
  },
  {
    id: 'longcontext',
    name: 'LONG CONTEXT',
    description: 'Long sequence understanding and processing',
    color: '#FF8C00',
    benchmarks: [
      { id: 'longbench', name: 'LongBench', category: 'longcontext', description: 'Long context understanding', difficulty: 'hard' },
      { id: 'needle', name: 'Needle in Haystack', category: 'longcontext', description: 'Information retrieval', difficulty: 'medium' },
      { id: 'lcc', name: 'LCC', category: 'longcontext', description: 'Long Context Comprehension', difficulty: 'hard' }
    ]
  },
  {
    id: 'indic',
    name: 'INDIC BENCHMARKS',
    description: 'Indian language specific evaluations',
    color: '#9D4EDD',
    benchmarks: [
      { id: 'mmlu-in', name: 'MMLU-IN', category: 'indic', description: 'Massive Multitask Language Understanding - Indian', language: 'multi', difficulty: 'hard' },
      { id: 'milu', name: 'MILU', category: 'indic', description: 'Massive Indic Language Understanding', language: 'multi', difficulty: 'hard' },
      { id: 'indicglue', name: 'IndicGLUE', category: 'indic', description: 'Indic language tasks', language: 'multi', difficulty: 'medium' },
      { id: 'flores-in', name: 'Flores-IN', category: 'indic', description: 'Machine translation for Indian languages', language: 'multi', difficulty: 'medium' },
      { id: 'ai4bharat', name: 'AI4Bharat', category: 'indic', description: 'Bharat-specific NLP tasks', language: 'multi', difficulty: 'medium' }
    ]
  },
  {
    id: 'reading',
    name: 'READING COMPREHENSION',
    description: 'Text understanding and comprehension tasks',
    color: '#00C9A7',
    benchmarks: [
      { id: 'squad', name: 'SQuAD', category: 'reading', description: 'Stanford Question Answering Dataset', difficulty: 'medium' },
      { id: 'race', name: 'RACE', category: 'reading', description: 'Reading Comprehension from Examinations', difficulty: 'medium' },
      { id: 'boolq', name: 'BoolQ', category: 'reading', description: 'Boolean Questions', difficulty: 'easy' },
      { id: 'openbookqa', name: 'OpenBookQA', category: 'reading', description: 'Open Book Question Answering', difficulty: 'medium' }
    ]
  },
  {
    id: 'knowledge',
    name: 'WORLD KNOWLEDGE',
    description: 'Factual knowledge and information retrieval',
    color: '#FFFFFF',
    benchmarks: [
      { id: 'mmlu', name: 'MMLU', category: 'knowledge', description: 'Massive Multitask Language Understanding', difficulty: 'hard' },
      { id: 'truthfulqa', name: 'TruthfulQA', category: 'knowledge', description: 'Truthfulness in question answering', difficulty: 'hard' },
      { id: 'naturalqa', name: 'NaturalQA', category: 'knowledge', description: 'Natural Questions', difficulty: 'medium' }
    ]
  },
  {
    id: 'general',
    name: 'GENERAL',
    description: 'General language understanding and generation',
    color: '#D3D3D3',
    benchmarks: [
      { id: 'glue', name: 'GLUE', category: 'general', description: 'General Language Understanding Evaluation', difficulty: 'medium' },
      { id: 'superglue', name: 'SuperGLUE', category: 'general', description: 'More challenging language understanding', difficulty: 'hard' },
      { id: 'lambada', name: 'LAMBADA', category: 'general', description: 'Language modeling evaluation', difficulty: 'medium' }
    ]
  }
];

export const mockModels: Model[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'api',
    averageScore: 89.2,
    lastEvaluated: '2024-01-15',
    parameters: '1.76T',
    scores: {
      'code': 85.7,
      'math': 87.3,
      'reasoning': 91.5,
      'longcontext': 88.4,
      'indic': 92.1,
      'reading': 89.2,
      'knowledge': 90.1,
      'general': 88.7
    }
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'api',
    averageScore: 87.8,
    lastEvaluated: '2024-01-14',
    parameters: 'Unknown',
    scores: {
      'code': 82.3,
      'math': 84.6,
      'reasoning': 89.2,
      'longcontext': 92.1,
      'indic': 90.7,
      'reading': 87.4,
      'knowledge': 88.9,
      'general': 86.2
    }
  },
  {
    id: 'gemma-2-27b',
    name: 'Gemma 2 27B',
    provider: 'huggingface',
    averageScore: 78.4,
    lastEvaluated: '2024-01-13',
    parameters: '27B',
    scores: {
      'code': 79.1,
      'math': 74.2,
      'reasoning': 76.8,
      'longcontext': 80.6,
      'indic': 81.3,
      'reading': 78.9,
      'knowledge': 77.5,
      'general': 79.3
    }
  },
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B',
    provider: 'huggingface',
    averageScore: 82.1,
    lastEvaluated: '2024-01-12',
    parameters: '70B',
    scores: {
      'code': 84.2,
      'math': 78.9,
      'reasoning': 80.3,
      'longcontext': 87.3,
      'indic': 79.8,
      'reading': 82.1,
      'knowledge': 81.7,
      'general': 83.4
    }
  }
];

