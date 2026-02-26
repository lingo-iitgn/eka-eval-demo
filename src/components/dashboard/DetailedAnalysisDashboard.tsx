import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie
} from 'recharts';
import { 
  Trophy, AlertTriangle, Target, ArrowLeft, 
  BrainCircuit, Share2, Download, FileText, Sparkles,
  MessageSquare, ThumbsUp, ThumbsDown, Send, ChevronRight, Bot
} from 'lucide-react';

// --- Configuration ---
// Note: In production, move this to an environment variable via a backend proxy to secure it.
const GEMINI_API_KEY = "AIzaSyCK3Nt4Xc2hI4ShMi-35yTXaOGNN2CxHoE"; 

interface DashboardProps {
  results: any;
  onBack: () => void;
}

// --- Helper Component: LLM Analysis Card ---
const LLMAnalysisCard = ({ benchmarkName, score, task }: { benchmarkName: string, score: number, task: string }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `
        Analyze the evaluation results for an LLM model.
        Benchmark: ${benchmarkName}
        Task Category: ${task}
        Score: ${score.toFixed(2)}%
        
        Please provide:
        1. A one-sentence summary of what this benchmark measures.
        2. An assessment of the model's performance (Excellent, Good, Average, or Poor) based on the score.
        3. Potential strengths or weaknesses implied by this score.
        Keep it concise and professional.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate analysis.";
      setAnalysis(text);
    } catch (error) {
      setAnalysis("Failed to connect to AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-gray-900 border border-purple-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bot className="text-purple-400" size={20} />
          AI Insight
        </h3>
        {!analysis && !loading && (
          <button 
            onClick={generateAnalysis}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
          >
            <Sparkles size={14} /> Generate Analysis
          </button>
        )}
      </div>

      <div className="min-h-[100px] text-sm text-gray-300 leading-relaxed">
        {loading ? (
          <div className="flex items-center gap-2 text-purple-300 animate-pulse">
            <Sparkles size={16} className="animate-spin" /> Analyzing performance metrics...
          </div>
        ) : analysis ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="whitespace-pre-line">{analysis}</p>
          </div>
        ) : (
          <p className="text-gray-500 italic">
            Click generate to get a Gemini-powered breakdown of this specific benchmark result.
          </p>
        )}
      </div>
    </div>
  );
};

// --- Helper Component: Human Feedback ---
const FeedbackCard = () => {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <MessageSquare className="text-cyan-400" size={20} />
        Human Feedback
      </h3>
      {submitted ? (
        <div className="text-green-400 flex items-center gap-2 bg-green-500/10 p-4 rounded-lg">
          <ThumbsUp size={18} /> Thanks for your feedback!
        </div>
      ) : (
        <div className="space-y-3">
          <textarea 
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
            rows={3}
            placeholder="Add your notes about this result (e.g., 'Unexpectedly low score on logic')..."
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setSubmitted(true)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-red-400 transition-colors"><ThumbsDown size={18} /></button>
            <button onClick={() => setSubmitted(true)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-green-400 transition-colors"><ThumbsUp size={18} /></button>
            <button 
              onClick={() => setSubmitted(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Send size={14} /> Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
const DetailedAnalysisDashboard: React.FC<DashboardProps> = ({ results, onBack }) => {
  const [selectedBenchmark, setSelectedBenchmark] = useState<any | null>(null);

  // Process data for visualizations
  const processedData = useMemo(() => {
    const flatBenchmarks: any[] = [];
    let totalScore = 0;
    let count = 0;

    results.results.forEach((task: any) => {
      task.benchmarks.forEach((bm: any) => {
        if (bm.score !== null && bm.score !== undefined) {
          flatBenchmarks.push({
            subject: bm.name,
            score: bm.score,
            task: task.task,
            fullMark: 100
          });
          totalScore += bm.score;
          count++;
        }
      });
    });

    const sorted = [...flatBenchmarks].sort((a, b) => b.score - a.score);
    const average = count > 0 ? totalScore / count : 0;

    return {
      chartData: flatBenchmarks,
      strengths: sorted.slice(0, 3),
      weaknesses: sorted.slice(-3).reverse().filter(item => item.score < 70),
      average
    };
  }, [results]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl z-50">
          <p className="text-gray-200 font-semibold mb-1">{label}</p>
          <p className="text-cyan-400 font-mono">Score: {payload[0].value.toFixed(2)}%</p>
          <p className="text-xs text-gray-500 mt-1">Task Group: {payload[0].payload.task}</p>
        </div>
      );
    }
    return null;
  };

  // --- VIEW: INDIVIDUAL BENCHMARK DETAIL ---
  if (selectedBenchmark) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        {/* Navigation */}
        <button 
          onClick={() => setSelectedBenchmark(null)}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Overview
        </button>

        {/* Benchmark Header */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300 font-mono">
                  {selectedBenchmark.task}
                </span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">{selectedBenchmark.subject}</h2>
              <p className="text-gray-400">Detailed performance analysis and model insights.</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-gray-400 uppercase tracking-widest">Final Score</div>
                <div className={`text-5xl font-bold font-mono ${
                  selectedBenchmark.score >= 80 ? 'text-green-400' :
                  selectedBenchmark.score >= 60 ? 'text-cyan-400' : 'text-red-400'
                }`}>
                  {selectedBenchmark.score.toFixed(2)}%
                </div>
              </div>
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: selectedBenchmark.score }, { value: 100 - selectedBenchmark.score }]}
                      innerRadius={35}
                      outerRadius={45}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill={selectedBenchmark.score >= 80 ? '#10b981' : selectedBenchmark.score >= 60 ? '#06b6d4' : '#ef4444'} />
                      <Cell fill="#374151" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 blur-3xl rounded-full pointer-events-none" />
        </div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Gemini Analysis */}
            <LLMAnalysisCard 
              benchmarkName={selectedBenchmark.subject} 
              score={selectedBenchmark.score} 
              task={selectedBenchmark.task} 
            />
            
            {/* Mock Instances Table (Since we don't have raw instances from CSV) */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sample Instances</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-900/50 rounded border border-gray-700/50 flex gap-3">
                  <div className="mt-1"><AlertTriangle size={16} className="text-yellow-500" /></div>
                  <div className="text-sm text-gray-400">
                    Detailed instance logs (Questions/Answers) are stored in the backend checkpoints. 
                    <br/>
                    <span className="text-xs opacity-50 italic">Log visualization coming soon. Currently viewing aggregate data.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Context Stats */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Relative Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Vs Average</span>
                    <span className="text-white">{selectedBenchmark.score > processedData.average ? '+' : ''}{(selectedBenchmark.score - processedData.average).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-500" 
                      style={{ width: `${processedData.average}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <FeedbackCard />
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: OVERVIEW DASHBOARD ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Monitor
          </button>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="text-purple-400" size={32} />
            {results.model} <span className="text-gray-500 font-normal">Analysis</span>
          </h2>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors border border-gray-700">
            <Share2 size={16} /> Share
          </button>
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-cyan-500/20">
            <Download size={16} /> Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Target size={100} /></div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Average Score</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${processedData.average >= 80 ? 'text-green-400' : 'text-cyan-400'}`}>
              {processedData.average.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">/ 100</span>
          </div>
        </motion.div>

        {/* Top Perf */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={100} /></div>
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Top Performance</h3>
          <div className="mt-2">
            <div className="text-xl font-bold text-white truncate pr-8">{processedData.strengths[0]?.subject || 'N/A'}</div>
            <div className="text-sm text-green-400 font-mono mt-1">{processedData.strengths[0]?.score.toFixed(2)}% Accuracy</div>
          </div>
        </motion.div>

        {/* Scope */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Evaluation Scope</h3>
          <div className="mt-2 flex items-center gap-4">
            <div><span className="text-4xl font-bold text-purple-400">{processedData.chartData.length}</span><span className="text-sm text-gray-500 ml-2">Benchmarks</span></div>
            <div className="h-8 w-px bg-gray-700"></div>
            <div><span className="text-4xl font-bold text-blue-400">{results.results.length}</span><span className="text-sm text-gray-500 ml-2">Task Groups</span></div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-1 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><BrainCircuit size={18} className="text-purple-400" />Capability Profile</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={processedData.chartData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 10 }} />
                <Radar name={results.model} dataKey="score" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.25} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl p-6 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><FileText size={18} className="text-cyan-400" />Benchmark Performance</h3>
          <p className="text-xs text-gray-400 mb-4">Click on a bar to view detailed analysis for that benchmark.</p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" domain={[0, 100]} />
                <YAxis dataKey="subject" type="category" width={100} stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Bar 
                  dataKey="score" 
                  radius={[0, 4, 4, 0]} 
                  barSize={30}
                  onClick={(data) => setSelectedBenchmark(data)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {processedData.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score > 80 ? '#10b981' : entry.score > 60 ? '#06b6d4' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-gradient-to-br from-green-900/20 to-gray-900 border border-green-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="text-green-400" size={20} />Key Strengths</h3>
          <div className="space-y-3">
            {processedData.strengths.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedBenchmark(item)}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-green-500/30 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col">
                  <span className="text-gray-200 font-medium group-hover:text-green-400 transition-colors">{item.subject}</span>
                  <span className="text-xs text-gray-500">{item.task}</span>
                </div>
                <span className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-bold font-mono">{item.score.toFixed(1)}%</span>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-green-400" />
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-gradient-to-br from-red-900/20 to-gray-900 border border-red-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle className="text-red-400" size={20} />Areas for Improvement</h3>
          {processedData.weaknesses.length > 0 ? (
            <div className="space-y-3">
              {processedData.weaknesses.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedBenchmark(item)}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-red-500/30 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col">
                    <span className="text-gray-200 font-medium group-hover:text-red-400 transition-colors">{item.subject}</span>
                    <span className="text-xs text-gray-500">{item.task}</span>
                  </div>
                  <span className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-bold font-mono">{item.score.toFixed(1)}%</span>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-red-400" />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 italic p-4 border border-dashed border-gray-700 rounded-lg">
              <Trophy size={40} className="mb-2 text-gray-600" />
              <p>No significant weaknesses detected.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DetailedAnalysisDashboard;