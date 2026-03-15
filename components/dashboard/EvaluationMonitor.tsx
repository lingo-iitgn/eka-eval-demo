import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Activity, Clock, CheckCircle2, AlertCircle, 
  Terminal, ChevronDown, ChevronUp, Sparkles, Zap, TrendingUp,
  Download, ArrowRight
} from 'lucide-react';

interface WorkerStatus {
  id: string;
  gpuId: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentBenchmark: string;
  progress: number;
  logs: string[];
}

interface BenchmarkProgress {
  name: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  score?: number;
  samples?: { current: number; total: number };
}

interface EvaluationMonitorProps {
  config: any;
  onComplete: () => void;
  onBack: () => void;
}

const EvaluationMonitor: React.FC<EvaluationMonitorProps> = ({ config, onComplete, onBack }) => {
  const [status, setStatus] = useState<'pending' | 'running' | 'completed' | 'error'>('pending');
  const [logs, setLogs] = useState<string[]>(['🚀 Initializing evaluation...']);
  const [elapsed, setElapsed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [showConsole, setShowConsole] = useState(true);
  const [completedBenchmarks, setCompletedBenchmarks] = useState(0);
  const [finalResults, setFinalResults] = useState<any>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const startTime = useRef<number>(Date.now());
  const evaluationStarted = useRef<boolean>(false);

  useEffect(() => {
    console.log('EvaluationMonitor mounted with config:', config);
    
    // Initialize benchmarks from config
    const initialBenchmarks: BenchmarkProgress[] = (config.benchmarks || []).map((bm: string) => ({
      name: bm,
      progress: 0,
      status: 'pending' as const,
      samples: { current: 0, total: 0 }
    }));
    setBenchmarks(initialBenchmarks);

    // Initialize workers
    const gpuCount = config.advancedSettings?.gpuCount || 1;
    const initialWorkers: WorkerStatus[] = Array.from({ length: gpuCount }, (_, i) => ({
      id: `worker-${i}`,
      gpuId: i,
      status: 'idle' as const,
      currentBenchmark: 'Waiting...',
      progress: 0,
      logs: []
    }));
    setWorkers(initialWorkers);

    // Connect WebSocket FIRST
    connectWebSocket();

    // Then trigger evaluation after a short delay
    const triggerTimer = setTimeout(() => {
      if (!evaluationStarted.current) {
        startEvaluation();
      }
    }, 1000);

    // Timer for elapsed time
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    return () => {
      clearTimeout(triggerTimer);
      clearInterval(timer);
      ws.current?.close();
    };
  }, []);

  const connectWebSocket = () => {
    setLogs(prev => [...prev, '🔌 Connecting to evaluation server...']);
    
    ws.current = new WebSocket('wss://10.0.62.205:8001/ws/v1/evaluation-logs');

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setLogs(prev => [...prev, '✅ WebSocket connected']);
      setStatus('running');
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message:', message);

        if (message.type === 'log') {
          const logLine: string = message.payload;
          setLogs(prev => [...prev.slice(-150), logLine]);

     // Parse worker progress - Match actual log format: "[Worker 0 (GPU 0)]"
          const workerMatch = logLine.match(/\[Worker (\d+) \(GPU (\d+)\)\]/);
          if (workerMatch) {
            const workerId = parseInt(workerMatch[1], 10);
            
            setWorkers(prevWorkers => {
              const newWorkers = [...prevWorkers];
              if (newWorkers[workerId]) {
                // Extract benchmark name - Look for "PIQA Likelihood Eval" or "Wino Eval" etc
                const evalMatch = logLine.match(/P\d+\s*-\s*(\w+(?:\s+\w+)?)\s+(?:Likelihood\s+)?Eval/i);
                if (evalMatch) {
                  const benchmarkName = evalMatch[1].trim();
                  newWorkers[workerId].currentBenchmark = benchmarkName;
                  newWorkers[workerId].status = 'running';
                  
                  // Update benchmark status
                  setBenchmarks(prev => prev.map(bm => {
                    const matches = bm.name.toLowerCase().includes(benchmarkName.toLowerCase()) ||
                                  benchmarkName.toLowerCase().includes(bm.name.toLowerCase().split(' ')[0]);
                    return matches ? { ...bm, status: 'running' } : bm;
                  }));
                }

                // Parse sample progress - Match format like "1836/1838 [06:42<00:00, 4.57it/s]"
                const sampleMatch = logLine.match(/(\d+)\/(\d+)\s+\[/);
                if (sampleMatch) {
                  const current = parseInt(sampleMatch[1], 10);
                  const total = parseInt(sampleMatch[2], 10);
                  const sampleProgress = (current / total) * 100;
                  
                  newWorkers[workerId].progress = sampleProgress;
                  
                  // Update benchmark progress with sample info
                  if (evalMatch) {
                    const benchmarkName = evalMatch[1].trim();
                    setBenchmarks(prev => prev.map(bm => {
                      const matches = bm.name.toLowerCase().includes(benchmarkName.toLowerCase()) ||
                                    benchmarkName.toLowerCase().includes(bm.name.toLowerCase().split(' ')[0]);
                      return matches
                        ? { ...bm, status: 'running', progress: sampleProgress, samples: { current, total } }
                        : bm;
                    }));
                  }
                }

                // Check for completion - "Finished TG"
                if (logLine.includes('Finished TG')) {
                  newWorkers[workerId].status = 'completed';
                  newWorkers[workerId].progress = 100;
                  
                  // Mark current benchmark as completed
                  setBenchmarks(prev => prev.map(bm => 
                    bm.status === 'running' ? { ...bm, status: 'completed', progress: 100 } : bm
                  ));
                  
                  setCompletedBenchmarks(prev => prev + 1);
                }
              }
              return newWorkers;
            });
          }
          // Check for final results table
          if (logLine.includes('Consolidated Evaluation Results')) {
            console.log('Found results marker, will fetch results...');
            setTimeout(() => fetchResults(), 2000);
          }
        }

        if (message.type === 'status' && message.payload === 'completed') {
          console.log('Evaluation completed, fetching results...');
          fetchResults();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
      setLogs(prev => [...prev, `❌ WebSocket error`]);
    };

    ws.current.onclose = () => {
      console.log('WebSocket closed');
      setLogs(prev => [...prev, '🔌 Connection closed']);
    };
  };

  const fetchResults = async () => {
    try {
      console.log('Fetching results for model:', config.model.identifier);
      const response = await fetch(`https://10.0.62.205:8001/api/v1/results/latest/${encodeURIComponent(config.model.identifier)}`);
      const data = await response.json();
      
      console.log('Results fetched:', data);
      
      if (data.found) {
        setFinalResults(data);
        setStatus('completed');
        setCompletedBenchmarks(benchmarks.length);
        
        // Update benchmark scores
        data.results.forEach((taskResult: any) => {
          taskResult.benchmarks.forEach((bm: any) => {
            setBenchmarks(prev => prev.map(b => 
              b.name.toLowerCase().includes(bm.name.toLowerCase()) || bm.name.toLowerCase().includes(b.name.toLowerCase())
                ? { ...b, status: 'completed', progress: 100, score: bm.score }
                : b
            ));
          });
        });
        
        setLogs(prev => [...prev, '🎉 Results loaded successfully!']);
      } else {
        console.log('No results found yet, will retry...');
        setTimeout(() => fetchResults(), 3000);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setLogs(prev => [...prev, `⚠️ Could not fetch results: ${error}`]);
    }
  };

  const startEvaluation = async () => {
    if (evaluationStarted.current) {
      console.log('Evaluation already started, skipping');
      return;
    }
    
    evaluationStarted.current = true;
    console.log('Starting evaluation with config:', config);
    setLogs(prev => [...prev, '📡 Sending evaluation request to server...']);

    try {
      const response = await fetch('https://10.0.62.205:8001/api/v1/run-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          benchmarks: config.benchmarks,
          advancedSettings: config.advancedSettings
        }),
      });

      const data = await response.json();
      console.log('Evaluation response:', data);

      if (response.ok) {
        setLogs(prev => [...prev, `✅ Evaluation started: ${data.message}`]);
      } else {
        setStatus('error');
        setLogs(prev => [...prev, `❌ Error: ${data.detail || 'Failed to start evaluation'}`]);
      }
    } catch (error) {
      console.error('Error starting evaluation:', error);
      setStatus('error');
      setLogs(prev => [...prev, `❌ Failed to connect to server: ${error}`]);
    }
  };

  // Calculate overall progress
  useEffect(() => {
    if (benchmarks.length > 0) {
      const totalProgress = benchmarks.reduce((sum, bm) => sum + bm.progress, 0);
      const newProgress = totalProgress / benchmarks.length;
      setOverallProgress(newProgress);

      // Estimate time - more lenient threshold
      if (newProgress > 1 && elapsed > 5) {
        const timePerPercent = elapsed / newProgress;
        const remaining = (100 - newProgress) * timePerPercent;
        setEstimatedTime(Math.round(remaining));
      }
    }
  }, [benchmarks, elapsed]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsContainerRef.current && showConsole) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, showConsole]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="animate-spin" size={20} />;
      case 'completed': return <CheckCircle2 size={20} className="text-green-400" />;
      case 'error': return <AlertCircle size={20} className="text-red-400" />;
      default: return <Clock size={20} className="text-gray-400" />;
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await fetch('https://10.0.62.205:8001/api/v1/results/download');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evaluation_results.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Sparkles className="text-purple-400" size={24} />
            <span className="text-3xl font-bold text-white">{Math.round(overallProgress)}%</span>
          </div>
          <p className="text-sm text-gray-300">Overall Progress</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-cyan-400" size={24} />
            <span className="text-3xl font-bold text-white">{formatTime(elapsed)}</span>
          </div>
          <p className="text-sm text-gray-300">Time Elapsed</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="text-green-400" size={24} />
            <span className="text-3xl font-bold text-white">{completedBenchmarks}/{benchmarks.length}</span>
          </div>
          <p className="text-sm text-gray-300">Benchmarks Done</p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-orange-400" size={24} />
            <span className="text-3xl font-bold text-white">
              {estimatedTime ? formatTime(estimatedTime) : '--:--'}
            </span>
          </div>
          <p className="text-sm text-gray-300">Est. Remaining</p>
        </motion.div>
      </div>

      {/* Overall Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="text-yellow-400" size={20} />
            Evaluation Progress
          </h3>
          <span className="text-sm text-gray-400">
            {status === 'completed' ? '✅ Complete' : status === 'running' ? '🔄 Running' : '⏳ Pending'}
          </span>
        </div>
        
        <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-green-500"
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>

      {/* Benchmark Cards Grid */}
      {benchmarks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benchmarks.map((benchmark, index) => (
            <motion.div
              key={benchmark.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white text-lg">{benchmark.name}</h4>
                {getStatusIcon(benchmark.status)}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-cyan-400 font-mono">{Math.round(benchmark.progress)}%</span>
                </div>
                
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    animate={{ width: `${benchmark.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                
                {benchmark.samples && benchmark.samples.total > 0 && (
                  <div className="text-xs text-gray-500 font-mono">
                    {benchmark.samples.current} / {benchmark.samples.total} samples
                  </div>
                )}
                
                {benchmark.score !== undefined && benchmark.score !== null && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <span className="text-green-400 font-bold text-lg">
                      Score: {benchmark.score.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* GPU Workers */}
      {workers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu className="text-blue-400" size={20} />
            GPU Workers
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  worker.status === 'running' ? 'border-cyan-500 bg-cyan-500/10' :
                  worker.status === 'completed' ? 'border-green-500 bg-green-500/10' :
                  'border-gray-700 bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">GPU {worker.gpuId}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    worker.status === 'running' ? 'bg-cyan-500 text-white' :
                    worker.status === 'completed' ? 'bg-green-500 text-white' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {worker.status.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-400 mb-2 truncate">
                  {worker.currentBenchmark}
                </p>
                
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                    animate={{ width: `${worker.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Console Output (Collapsible) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden"
      >
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="text-cyan-400" size={20} />
            <h3 className="text-xl font-semibold text-white">Live Console Output</h3>
            <span className="text-sm text-gray-500">({logs.length} lines)</span>
          </div>
          {showConsole ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>
        
        <AnimatePresence>
          {showConsole && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div 
                ref={logsContainerRef}
                className="h-80 bg-gray-900/80 p-4 font-mono text-sm text-gray-300 overflow-y-auto border-t border-gray-700"
              >
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="py-0.5 hover:bg-gray-800/50 whitespace-pre-wrap break-all"
                  >
                    {log}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Display */}
      {status === 'completed' && finalResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="text-green-400" size={24} />
              Evaluation Complete!
            </h3>
            <button 
              onClick={downloadCSV}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
          
          <p className="text-gray-300 mb-4">
            Your model <span className="font-bold text-white">{finalResults.model}</span> has been evaluated across {benchmarks.length} benchmark(s).
          </p>
          
          {/* Results Summary */}
          <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-semibold text-white mb-3">Results Summary</h4>
            {finalResults.results.map((taskResult: any, idx: number) => (
              <div key={idx} className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400 font-semibold">{taskResult.task}</span>
                  {taskResult.average !== undefined && (
                    <span className="text-green-400 font-bold">
                      Avg: {taskResult.average.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {taskResult.benchmarks.map((bm: any, bmIdx: number) => (
                    <div key={bmIdx} className="flex justify-between text-sm">
                      <span className="text-gray-400">{bm.name}:</span>
                      <span className="text-white font-mono">
                        {bm.score !== null ? `${bm.score.toFixed(2)}%` : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => window.location.href = '/leaderboard'}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold rounded-lg flex items-center gap-2 transition-all"
          >
            View Full Leaderboard
            <ArrowRight size={20} />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default EvaluationMonitor;