import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Cpu, Zap, RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface AdvancedSettingsProps {
  onNext: (settings: any) => void;
  onBack: () => void;
  config: any; // We need the full config to know which benchmarks were selected
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ onNext, onBack }) => {
  const [settings, setSettings] = useState({
    batchSize: 8,
    maxNewTokens: 512,
    gpuCount: 1,
    temperature: 0.7,
    customPrompts: false,
    // NEW: State to hold language selections for each Indic benchmark
    indicLanguages: {} as Record<string, string[]> 
  });

  const handleSliderChange = (key: string, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Advanced Configuration</h2>
        <p className="text-gray-400">Fine-tune evaluation parameters for optimal performance</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            Performance Settings
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-300 mb-3">
                Batch Size: {settings.batchSize}
              </label>
              <input
                type="range"
                min="1"
                max="32"
                value={settings.batchSize}
                onChange={(e) => handleSliderChange('batchSize', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1</span>
                <span>32</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-3">
                Max New Tokens: {settings.maxNewTokens}
              </label>
              <input
                type="range"
                min="128"
                max="2048"
                step="128"
                value={settings.maxNewTokens}
                onChange={(e) => handleSliderChange('maxNewTokens', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>128</span>
                <span>2048</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-3">
                Temperature: {settings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => handleSliderChange('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.0</span>
                <span>2.0</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Cpu size={20} className="text-blue-400" />
            Resource Management
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-300 mb-3">
                GPU Count: {settings.gpuCount}
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={settings.gpuCount}
                onChange={(e) => handleSliderChange('gpuCount', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 GPU</span>
                <span>8 GPUs</span>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Estimated Resources</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Memory per GPU:</span>
                  <span>~12GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Total VRAM:</span>
                  <span>{settings.gpuCount * 12}GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Parallel workers:</span>
                  <span>{settings.gpuCount}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Settings size={20} className="text-purple-400" />
            Prompt Customization
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.customPrompts}
                onChange={(e) => setSettings(prev => ({ ...prev, customPrompts: e.target.checked }))}
                className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <div>
                <span className="text-white font-medium">Enable prompt customization</span>
                <p className="text-sm text-gray-400">
                  Modify prompts and few-shot examples for specific benchmarks
                </p>
              </div>
            </label>

            {settings.customPrompts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-gray-800/50 rounded-lg"
              >
                <p className="text-sm text-gray-400 mb-3">
                  You'll be able to customize prompts for each benchmark during the next step.
                </p>
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <RefreshCw size={14} />
                  <span>Reset to defaults available for all prompts</span>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back to Benchmarks
        </Button>
        <Button onClick={() => onNext(settings)} size="lg">
          Review & Launch
        </Button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #9D4EDD, #00FFFF);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(157, 78, 221, 0.5);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #9D4EDD, #00FFFF);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(157, 78, 221, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AdvancedSettings;