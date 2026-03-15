// src/components/dashboard/IndicSettings.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Languages, Loader2, AlertCircle } from 'lucide-react';

interface IndicSettingsProps {
  benchmarkId: string;
  selectedLanguages: string[];
  onLanguageChange: (languages: string[]) => void;
}

const IndicSettings: React.FC<IndicSettingsProps> = ({ benchmarkId, selectedLanguages, onLanguageChange }) => {
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLangs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- CRITICAL FIX HERE ---
        // Changed http://127.0.0.1:8001 to your server's HTTPS address
        const response = await fetch(`https://10.0.62.205:8001/api/v1/benchmark-languages/${benchmarkId}`);
        // --- END FIX ---
        
        if (!response.ok) throw new Error("Could not fetch language options.");
        
        const data = await response.json();
        setAvailableLangs(data.languages || []);
        
        // Default to selecting all available languages if none are pre-selected
        if (data.languages && selectedLanguages.length === 0) {
          onLanguageChange(data.languages);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLangs();
  }, [benchmarkId]);

  const toggleLanguage = (lang: string) => {
    onLanguageChange(
      selectedLanguages.includes(lang)
        ? selectedLanguages.filter(l => l !== lang)
        : [...selectedLanguages, lang]
    );
  };

  const toggleAll = () => {
    if (selectedLanguages.length === availableLangs.length) {
      onLanguageChange([]); // Deselect all
    } else {
      onLanguageChange(availableLangs); // Select all
    }
  };

  if (isLoading) {
    return <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" size={16} /><span>Loading languages...</span></div>;
  }
  if (error) {
    return <div className="text-red-400 flex items-center gap-2"><AlertCircle size={16} /><span>{error}</span></div>;
  }
  if (availableLangs.length === 0) {
    return null; // Don't render if it's not a multi-language benchmark
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-gray-700/50 pt-6">
      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Languages size={18} className="text-green-400" />
        {/* We can get the benchmark name from the ID for a nicer title */}
        Language Selection for <span className="text-cyan-400">{benchmarkId}</span>
      </h4>
      <div className="flex flex-wrap gap-3">
        {/* Select/Deselect All Button */}
        <button
          type="button"
          onClick={toggleAll}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
            selectedLanguages.length === availableLangs.length
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {selectedLanguages.length === availableLangs.length ? 'Deselect All' : 'Select All'}
        </button>
        
        {/* Individual Language Buttons */}
        {availableLangs.map(lang => (
          <button
            key={lang}
            type="button"
            onClick={() => toggleLanguage(lang)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors border ${
              selectedLanguages.includes(lang)
                ? 'bg-cyan-500/20 border-cyan-500 text-white'
                : 'bg-gray-800 border-gray-700 hover:border-gray-600 text-gray-400'
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">Select one or more languages to run this benchmark on.</p>
    </motion.div>
  );
};

export default IndicSettings;