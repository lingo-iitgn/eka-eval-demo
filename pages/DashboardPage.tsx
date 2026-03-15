// src/pages/DashboardPage.tsx (CORRECTED)

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ModelSelection from '../components/dashboard/ModelSelection';
import BenchmarkSelection from '../components/dashboard/BenchmarkSelection';
import AdvancedSettings from '../components/dashboard/AdvancedSettings';
import EvaluationMonitor from '../components/dashboard/EvaluationMonitor';
// Assuming you have this types file, if not you can remove it or create it
// import { EvaluationConfig } from '../types'; 

type Step = 'model' | 'benchmarks' | 'settings' | 'review' | 'monitor' | 'results';

// You can define this type if it's not in a separate file
interface EvaluationConfig {
  model: any;
  benchmarks: string[];
  advancedSettings: any;
}

const DashboardPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('model');
  const [config, setConfig] = useState<Partial<EvaluationConfig>>({});

  const steps = [
    { id: 'model', label: 'Model Selection', description: 'Choose your model' },
    { id: 'benchmarks', label: 'Benchmarks', description: 'Select evaluations' },
    { id: 'settings', label: 'Settings', description: 'Configure parameters' },
    { id: 'monitor', label: 'Monitoring', description: 'Track progress' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  // FIX #1: Renamed function for clarity
  const handleModelInitialized = (initResponse: any) => {
    // We get the full response, which has a 'config' property inside
    setConfig(prev => ({ ...prev, model: initResponse.config }));
    setCurrentStep('benchmarks');
  };

  const handleBenchmarksNext = (benchmarks: string[]) => {
    setConfig(prev => ({ ...prev, benchmarks }));
    setCurrentStep('settings');
  };

  const handleSettingsNext = (settings: any) => {
    setConfig(prev => ({ ...prev, advancedSettings: settings }));
    setCurrentStep('monitor');
  };

  const handleEvaluationComplete = () => {
    setCurrentStep('results');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 transition-colors duration-300">
      <div className="container mx-auto px-6 py-8">
        {/* Progress Steps (no changes here) */}
        <div className="mb-12">
          {/* ... */}
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* FIX #2: Changed prop name from 'onNext' to 'onModelInitialized' */}
          {currentStep === 'model' && (
            <ModelSelection onModelInitialized={handleModelInitialized} />
          )}
          
          {currentStep === 'benchmarks' && (
            <BenchmarkSelection
              onNext={handleBenchmarksNext}
              onBack={() => setCurrentStep('model')}
            />
          )}
          
          {/* ... (rest of the component is unchanged) ... */}
          {currentStep === 'settings' && (
            <AdvancedSettings
              onNext={handleSettingsNext}
              onBack={() => setCurrentStep('benchmarks')}
            />
          )}
          
          {currentStep === 'monitor' && (
            <EvaluationMonitor
              config={config}
              onComplete={handleEvaluationComplete}
            />
          )}
          
          {currentStep === 'results' && (
            <div className="text-center space-y-8">
              {/* ... */}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;