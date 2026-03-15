// src/components/dashboard/BenchmarkSelection.tsx (FINAL RENDERABLE VERSION)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, CheckCircle2, Circle, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { BenchmarkCategory } from '../../types'; // Assuming you have a types file

interface BenchmarkSelectionProps {
  onNext: (benchmarks: string[]) => void;
  onBack: () => void;
}

const BenchmarkSelection: React.FC<BenchmarkSelectionProps> = ({ onNext, onBack }) => {
  // --- STATE FOR FETCHING DATA ---
  const [benchmarkCategories, setBenchmarkCategories] = useState<BenchmarkCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]); // Start with none expanded
  const [showCustomModal, setShowCustomModal] = useState(false);

   useEffect(() => {
    const fetchBenchmarks = async () => {
      console.log("Starting benchmark fetch...");
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('https://10.0.62.205:8001/api/v1/benchmarks');
        console.log("Fetch response status:", response.status, response.statusText);

        if (!response.ok) {
          throw new Error('Failed to fetch benchmarks from the server.');
        }
        const data: BenchmarkCategory[] = await response.json();
        console.log("Data received from API:", data);

        if (Array.isArray(data)) {
          console.log(`Data is an array. Length: ${data.length}`);
          setBenchmarkCategories(data);
          
          if (data.length > 0 && data[0]?.id) {
            setExpandedCategories([data[0].id]);
          } else if (data.length === 0) {
            console.warn("API returned an empty array [].");
          }

        } else {
          console.error("Data received from server is NOT an array.", data);
          throw new Error("Invalid data format received from server.");
        }

      } catch (err) {
        console.error("Error in fetchBenchmarks:", (err as Error).message);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBenchmarks();
  }, []); // Empty dependency array means this runs once on mount
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  const toggleBenchmark = (benchmarkId: string) => {
    setSelectedBenchmarks(prev =>
      prev.includes(benchmarkId) ? prev.filter(id => id !== benchmarkId) : [...prev, benchmarkId]
    );
  };
  const toggleAllInCategory = (categoryId: string) => {
    const category = benchmarkCategories.find(c => c.id === categoryId);
    if (!category) return;
    const categoryBenchmarkIds = category.benchmarks.map(b => b.id);
    const allSelected = categoryBenchmarkIds.every(id => selectedBenchmarks.includes(id));
    if (allSelected) {
      setSelectedBenchmarks(prev => prev.filter(id => !categoryBenchmarkIds.includes(id)));
    } else {
      setSelectedBenchmarks(prev => [...new Set([...prev, ...categoryBenchmarkIds])]);
    }
  };

  // --- (Loading and Error states are unchanged) ---
  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-white">
            <Loader2 className="animate-spin h-12 w-12 mb-4" />
            <p className="text-xl">Loading available benchmarks...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-red-400 bg-red-900/30 rounded-lg">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">Failed to Load Benchmarks</p>
            <p className="text-red-300">{error}</p>
        </div>
    );
  }
  
  if (!isLoading && !error && benchmarkCategories.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center h-96 text-yellow-400 bg-yellow-900/30 rounded-lg">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">No Benchmarks Found</p>
            <p className="text-yellow-300">The server responded, but the list of benchmarks is empty.</p>
        </div>
    )
  }

  // --- (Header is unchanged) ---
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Select Benchmarks</h2>
        <p className="text-gray-400">Choose which evaluations to run on your model</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          
          {/* --- THIS IS THE START OF THE FIX --- */}
          {benchmarkCategories.map((category, index) => {
            const isExpanded = expandedCategories.includes(category.id);
            const selectedCount = category.benchmarks.filter(b => selectedBenchmarks.includes(b.id)).length;
            const totalCount = category.benchmarks.length;
            const allSelected = selectedCount === totalCount;

            return (
              <motion.div 
                key={category.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between cursor-pointer group p-4" onClick={() => toggleCategory(category.id)}>
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                        <span className="text-2xl" style={{ color: category.color }}>•</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">{category.name}</h3>
                        <p className="text-sm text-gray-400">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {selectedCount} / {totalCount}
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight size={20} className="text-gray-400" />
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-700/50 bg-gray-800/20"
                      >
                        {category.benchmarks.map((benchmark) => {
                          const isSelected = selectedBenchmarks.includes(benchmark.id);
                          
                          return (
                            <motion.div 
                              key={benchmark.id} 
                              className="flex items-center gap-3 p-4 border-b border-gray-700/30 last:border-b-0 cursor-pointer hover:bg-gray-700/50 transition-colors"
                              onClick={() => toggleBenchmark(benchmark.id)}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {isSelected ? (
                                <CheckCircle2 size={20} className="text-purple-400 flex-shrink-0" />
                              ) : (
                                <Circle size={20} className="text-gray-500 flex-shrink-0" />
                              )}
                              <div>
                                <h4 className="text-white font-medium">{benchmark.name}</h4>
                                <p className="text-sm text-gray-400">{benchmark.description}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
          {/* --- THIS IS THE END OF THE FIX --- */}

        </div>
        
        {/* --- (The summary/custom card is unchanged) --- */}
        <div className="lg:col-span-1 space-y-4">
          <Card glow>
            <h3 className="text-xl font-semibold text-white mb-4">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Categories:</span>
                <span className="font-medium text-white">{new Set(selectedBenchmarks.map(b => benchmarkCategories.flatMap(c => c.benchmarks).find(bm => bm.id === b)?.category)).size}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Benchmarks:</span>
                <span className="font-medium text-white">{selectedBenchmarks.length}</span>
              </div>
            </div>
            <hr className="my-4 border-gray-700" />
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowCustomModal(true)}
            >
              <Upload size={16} />
              Upload Custom
            </Button>
          </Card>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={() => onNext(selectedBenchmarks)} disabled={selectedBenchmarks.length === 0} size="lg">
          Continue ({selectedBenchmarks.length})
        </Button>
      </div>
      
      {/* --- (The modal is unchanged) --- */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Upload Custom Benchmark</h3>
              <p className="text-gray-400 mb-6">
                Drag and drop your custom evaluation file here, or browse to upload.
              </p>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-400 transition-colors">
                <Upload size={40} />
                <p className="mt-2">Drop file or click to upload</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowCustomModal(false)}>Cancel</Button>
                <Button>Upload</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BenchmarkSelection;