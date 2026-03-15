import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ArrowUpDown, ExternalLink, Award, Download, 
  RefreshCw, TrendingUp, Loader, AlertCircle, Play, 
  Table, BarChart2
} from 'lucide-react';

// --- 1. RECHARTS SE IMPORTS ADD KIYE GAYE ---
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  CartesianGrid,
  Legend,
  Cell, // <-- BUG FIX KE LIYE ADD KIYA
  LabelList // <-- LABELS KE LIYE ADD KIYA
} from 'recharts';

interface ModelResult {
  name: string;
  size: string;
  scores: { [task: string]: { [benchmark: string]: number } };
  task_scores: { [task: string]: number };
  average_score: number | null;
}

// --- 2. NAYA VISUALIZATION DASHBOARD COMPONENT ---
// (Updated with gradients and labels)
const VisualizationDashboard: React.FC<{ 
  selectedModel: ModelResult; 
  allModels: ModelResult[];
  onBack: () => void; 
}> = ({ selectedModel, allModels, onBack }) => {

  // Bar chart ke liye data (Task Scores)
  const taskScoreData = useMemo(() => {
    return Object.entries(selectedModel.task_scores).map(([name, score]) => ({
      name,
      score: parseFloat(score.toFixed(1)),
    }));
  }, [selectedModel]);

  // Radar chart ke liye data
  const radarData = useMemo(() => {
    const maxScore = 100; // Assuming 100 is the max
    return Object.entries(selectedModel.task_scores).map(([name, score]) => ({
      subject: name,
      score: parseFloat(score.toFixed(1)),
      fullMark: maxScore,
    }));
  }, [selectedModel]);

  // Comparison bar chart ke liye data
  const comparisonData = useMemo(() => {
    return allModels.map(model => ({
      name: model.name.split('/').pop(), // Shorten name
      score: model.average_score ?? 0,
      isCurrentUser: model.name === selectedModel.name,
    })).sort((a, b) => b.score - a.score);
  }, [allModels, selectedModel]);

  // Recharts tooltip ko dark theme ke liye style kiya
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-bold text-cyan-400">{label}</p>
          <p className="text-sm text-white">{`Score : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Bar ke upar label render karne ke liye
  const renderCustomBarLabel = ({ x, y, width, value }: any) => {
    return (
      <text x={x + width / 2} y={y} fill="#e5e7eb" dy={-6} fontSize={12} textAnchor="middle">
        {value}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white mb-2">
          Visualization for: <span className="text-cyan-400">{selectedModel.name}</span>
        </h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Table size={16} />
          Back to Table
        </button>
      </div>

      {/* --- Gradients Definition --- */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.8}/>
          </linearGradient>
          <linearGradient id="userBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#6d28d9" stopOpacity={0.9}/>
          </linearGradient>
          <radialGradient id="radarGradient">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.1} />
          </radialGradient>
        </defs>
      </svg>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Task Scores (Bar Chart) - STYLED */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-96"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Task Scores</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taskScoreData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} angle={-30} textAnchor="end" />
              <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(167, 139, 250, 0.1)' }} />
              <Bar dataKey="score" fill="url(#barGradient)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="score" content={renderCustomBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Chart 2: Score Dimensions (Radar Chart) - STYLED */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-96"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Score Dimensions</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" stroke="#e5e7eb" fontSize={12} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9ca3af" fontSize={10} />
              <Radar 
                name={selectedModel.name} 
                dataKey="score" 
                stroke="#a78bfa" 
                fill="url(#radarGradient)" 
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Chart 3: Overall Score Comparison (Bar Chart) - FIXED & STYLED */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 lg:col-span-2 h-96"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Overall Score Comparison</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 10, right: 0, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} angle={-30} textAnchor="end" />
              <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(167, 139, 250, 0.1)' }} />
              <Legend />
              <Bar dataKey="score" name="Overall Score" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="score" content={renderCustomBarLabel} />
                {/* --- BUG FIX: <cell> ko <Cell> kiya --- */}
                {comparisonData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isCurrentUser ? 'url(#userBarGradient)' : 'url(#barGradient)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};


const LeaderboardTable: React.FC = () => {
  // ... (Baaki saara code same hai)
  const [models, setModels] = useState<ModelResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'average_score' | 'name'>('average_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTask, setSelectedTask] = useState<string>('all');
  const [availableTasks, setAvailableTasks] = useState<string[]>([]);
  
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('table');
  const [selectedModel, setSelectedModel] = useState<ModelResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching results from API...');
      const response = await fetch('https://10.0.62.205:8001/api/v1/results');
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('No evaluation results found yet. Run some evaluations first!');
          setModels([]);
          setAvailableTasks([]);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Results data:', data);
      
      setModels(data.models || []);
      setAvailableTasks(data.task_groups || []);
      
      if (!data.models || data.models.length === 0) {
        setError('No evaluation results found yet. Run some evaluations first!');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load results';
      setError(errorMessage);
      console.error('Error fetching results:', err);
      setModels([]);
      setAvailableTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedModels = useMemo(() => {
    let filtered = models.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sortBy === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else {
        aVal = a.average_score ?? -1;
        bVal = b.average_score ?? -1;
      }
      
      const order = sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * order;
      }
      
      return (Number(aVal) - Number(bVal)) * order;
    });
  }, [models, searchTerm, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 55) return 'text-orange-400';
    return 'text-red-400';
  };

  const downloadCSV = async () => {
    try {
      const response = await fetch('https://10.0.62.205:8001/api/v1/results/download');
      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evaluation_results.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download CSV:', err);
      alert('Failed to download CSV. Please check if results are available.');
    }
  };

  const navigateToEvaluate = () => {
    window.location.href = '/dashboard/evaluate';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="animate-spin text-purple-500 mx-auto mb-4" size={48} />
          <p className="text-gray-400">Loading evaluation results...</p>
        </div>
      </div>
    );
  }

  if (error || models.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertCircle className="text-yellow-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Results Yet</h3>
          <p className="text-gray-400 mb-6">
            {error || 'No evaluation results found. Start by running your first evaluation!'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchResults}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <button
              onClick={navigateToEvaluate}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white rounded-lg flex items-center gap-2 transition-all"
            >
              <Play size={16} />
              Run Evaluation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Award className="text-yellow-400" size={32} />
            Model Leaderboard
          </h2>
          <p className="text-gray-400">
            Compare performance across {models.length} evaluated model{models.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Bar (Sirf Table View mein dikhega) */}
          <AnimatePresence>
            {viewMode === 'table' && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none w-64 transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View Toggle Buttons */}
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md flex items-center gap-2 text-sm ${
                viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Table size={16} />
              Table
            </button>
            <button
              onClick={() => {
                if (!selectedModel && models.length > 0) setSelectedModel(models[0]);
                setViewMode('charts');
              }}
              className={`px-3 py-1 rounded-md flex items-center gap-2 text-sm ${
                viewMode === 'charts' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'
              }`}
              disabled={models.length === 0}
            >
              <BarChart2 size={16} />
              Charts
            </button>
          </div>
          
          <button
            onClick={fetchResults}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white rounded-lg flex items-center gap-2 transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards (Yeh hamesha dikhenge) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Models</p>
              <p className="text-3xl font-bold text-white">{models.length}</p>
            </div>
            <TrendingUp className="text-purple-400" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Top Score</p>
              <p className="text-3xl font-bold text-white">
                {models.length > 0 
                  ? Math.max(...models.map(m => m.average_score || 0)).toFixed(1)
                  : '--'}
              </p>
            </div>
            <Award className="text-cyan-400" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Task Groups</p>
              <p className="text-3xl font-bold text-white">{availableTasks.length}</p>
            </div>
            <ExternalLink className="text-green-400" size={32} />
          </div>
        </motion.div>
      </div>

      {/* --- 6. CONDITIONAL RENDER: TABLE YA CHARTS --- */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-800/50">
                      <th className="text-left py-4 px-6 text-gray-400 text-sm font-medium">
                        Rank
                      </th>
                      <th className="text-left py-4 px-6">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                        >
                          Model
                          <ArrowUpDown size={16} />
                        </button>
                      </th>
                      <th className="text-center py-4 px-6">
                        <span className="text-gray-400 text-sm font-medium">Size</span>
                      </th>
                      <th className="text-center py-4 px-6">
                        <button
                          onClick={() => handleSort('average_score')}
                          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mx-auto"
                        >
                          Overall Score
                          <ArrowUpDown size={16} />
                        </button>
                      </th>
                      {selectedTask === 'all' ? (
                        availableTasks.slice(0, 5).map((task) => (
                          <th key={task} className="text-center py-4 px-6 text-gray-400 text-sm font-medium">
                            {task}
                          </th>
                        ))
                      ) : (
                        <th className="text-center py-4 px-6 text-gray-400 text-sm font-medium">
                          {selectedTask}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedModels.map((model, index) => (
                      <motion.tr
                        key={model.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        // --- 7. ROW KO CLICKABLE BANAYA ---
                        onClick={() => {
                          setSelectedModel(model);
                          setViewMode('charts');
                        }}
                        className="border-b border-gray-800 hover:bg-purple-800/20 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-mono text-sm">
                              #{index + 1}
                            </span>
                            {index === 0 && <Award size={16} className="text-yellow-400" />}
                            {index === 1 && <Award size={16} className="text-gray-300" />}
                            {index === 2 && <Award size={16} className="text-amber-600" />}
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div>
                            <h3 className="font-semibold text-white">{model.name}</h3>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6 text-center">
                          <span className="text-gray-400 text-sm">{model.size}</span>
                        </td>
                        
                        <td className="py-4 px-6 text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(model.average_score)}`}>
                            {model.average_score !== null 
                              ? model.average_score.toFixed(1) 
                              : '--'}
                          </div>
                        </td>
                        
                        {selectedTask === 'all' ? (
                          availableTasks.slice(0, 5).map((task) => (
                            <td key={task} className="py-4 px-6 text-center">
                              <span className={`font-medium ${getScoreColor(model.task_scores[task] || null)}`}>
                                {model.task_scores[task] 
                                  ? model.task_scores[task].toFixed(1) 
                                  : '--'}
                              </span>
                            </td>
                          ))
                        ) : (
                          <td className="py-4 px-6 text-center">
                            <span className={`font-medium ${getScoreColor(model.task_scores[selectedTask] || null)}`}>
                              {model.task_scores[selectedTask] 
                                ? model.task_scores[selectedTask].toFixed(1) 
                                : '--'}
                            </span>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {filteredAndSortedModels.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl text-center py-12"
              >
                <p className="text-gray-400 text-lg mb-4">No models found matching your search</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="charts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {selectedModel ? (
              <VisualizationDashboard 
                selectedModel={selectedModel} 
                allModels={filteredAndSortedModels} 
                onBack={() => setViewMode('table')} 
              />
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center max-w-md">
                  <AlertCircle className="text-yellow-500 mx-auto mb-4" size={48} />
                  <h3 className="text-xl font-semibold text-white mb-2">No Model Selected</h3>
                  <p className="text-gray-400 mb-6">
                    Please go back to the table and click on a model to see its visualizations.
                  </p>
                  <button
                    onClick={() => setViewMode('table')}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors mx-auto"
                  >
                    <Table size={16} />
                    Back to Table
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaderboardTable;