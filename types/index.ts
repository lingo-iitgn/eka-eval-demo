export interface Model {
  id: string;
  name: string;
  provider: 'huggingface' | 'local' | 'api';
  scores: Record<string, number>;
  averageScore: number;
  lastEvaluated: string;
  parameters?: string;
}

export interface Benchmark {
  id: string;
  name: string;
  category: string;
  description: string;
  language?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface BenchmarkCategory {
  id: string;
  name: string;
  description: string;
  benchmarks: Benchmark[];
  color: string;
}

export interface EvaluationConfig {
  model: {
    type: 'huggingface' | 'local' | 'api';
    identifier: string;
    apiKey?: string;
    provider?: string;
  };
  benchmarks: string[];
  advancedSettings: {
    batchSize: number;
    maxNewTokens: number;
    gpuCount: number;
    customPrompts?: Record<string, any>;
  };
}

export interface WorkerStatus {
  id: string;
  gpuId: number;
  currentBenchmark: string;
  progress: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  logs: string[];
}

export interface EvaluationResult {
  modelId: string;
  benchmarkId: string;
  score: number;
  details: any;
  timestamp: string;
}