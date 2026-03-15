// src/components/dashboard/ResultsDisplay.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// This component shows the final results summary after an evaluation.
// It's based on the excellent UI from your LeaderboardTable.

const getScoreColor = (score: number | null) => {
  if (score === null || score === undefined) return 'text-gray-400';
  if (score >= 85) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  if (score >= 55) return 'text-orange-400';
  return 'text-red-400';
};

const ResultsDisplay: React.FC<{ finalResults: any }> = ({ finalResults }) => {
  const navigate = useNavigate();

  const downloadCSV = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/api/v1/results/download');
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
    }
  };

  if (!finalResults || !finalResults.found) {
    return (
      <div className="text-center text-gray-400">
        Could not load final results.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="text-yellow-400" size={24} />
            Evaluation Complete!
          </h3>
          <p className="text-gray-300 mt-1">
            Results for <span className="font-bold text-white">{finalResults.model}</span>
          </p>
        </div>
        <button 
          onClick={downloadCSV}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Download size={16} />
          Export All Results
        </button>
      </div>

      {/* Results Summary Table */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        {finalResults.results.map((taskResult: any, idx: number) => (
          <div key={idx} className="py-3 border-b border-gray-700 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-400 font-semibold text-lg">{taskResult.task}</span>
              {taskResult.average !== undefined && (
                <div className="text-right">
                  <span className="text-xs text-gray-400">Task Average</span>
                  <span className={`block font-bold text-lg ${getScoreColor(taskResult.average)}`}>
                    {taskResult.average.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {taskResult.benchmarks.map((bm: any, bmIdx: number) => (
                <div key={bmIdx} className="flex justify-between text-sm">
                  <span className="text-gray-400">{bm.name}:</span>
                  <span className={`font-mono ${getScoreColor(bm.score)}`}>
                    {bm.score !== null ? `${bm.score.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/leaderboard')}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
      >
        View Full Leaderboard
        <ArrowRight size={20} />
      </button>
    </motion.div>
  );
};

export default ResultsDisplay;