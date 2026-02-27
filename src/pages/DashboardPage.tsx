// src/pages/DashboardPage.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ModelSelection from '../components/dashboard/ModelSelection';
import BenchmarkSelection from '../components/dashboard/BenchmarkSelection';
import AdvancedSettings from '../components/dashboard/AdvancedSettings';
import EvaluationMonitor from '../components/dashboard/EvaluationMonitor';

type Step = 'model' | 'benchmarks' | 'settings' | 'review' | 'monitor' | 'results';

interface EvaluationConfig {
  model: any;
  benchmarks: string[];
  advancedSettings: any;
}

const STEPS = [
  {
    id: 'model',
    label: 'Model Selection',
    bg: '#d4e5f2', border: '#a8c5de', text: '#2d5a78', activeBg: '#eaf3fa',
  },
  {
    id: 'benchmarks',
    label: 'Benchmarks',
    bg: '#d4dde8', border: '#b0c0d0', text: '#3d5068', activeBg: '#edf1f5',
  },
  {
    id: 'settings',
    label: 'Settings',
    bg: '#f5e8cc', border: '#e0c888', text: '#7a5218', activeBg: '#faf3e5',
  },
  {
    id: 'monitor',
    label: 'Evaluation',
    bg: '#e8d8f0', border: '#c8a8d8', text: '#5c3a72', activeBg: '#f4eef9',
  },
];

const DashboardPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('model');
  const [config, setConfig] = useState<Partial<EvaluationConfig>>({});
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleModelInitialized = (r: any) => {
    setConfig((p) => ({ ...p, model: r.config }));
    setCurrentStep('benchmarks');
  };
  const handleBenchmarksNext = (benchmarks: string[]) => {
    setConfig((p) => ({ ...p, benchmarks }));
    setCurrentStep('settings');
  };
  const handleSettingsNext = (settings: any) => {
    setConfig((p) => ({ ...p, advancedSettings: settings }));
    setCurrentStep('monitor');
  };
  const handleEvaluationComplete = () => setCurrentStep('results');

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: '#ffffff', fontFamily: '"DM Sans", sans-serif' }}
    >
      {/* Step bar */}
      <div
        className="border-b mt-3"
        style={{ background: '#ffffff', borderColor: '#e0d8cc' }}
      >
        <div className="max-w-[1440px] mx-auto px-10">
          <div className="flex overflow-x-auto">
            {STEPS.map((step, i) => {
              const isDone   = i < currentStepIndex;
              const isActive = step.id === currentStep;
              const isFuture = i > currentStepIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => isDone && setCurrentStep(step.id as Step)}
                  disabled={isFuture}
                  className="relative flex items-center gap-3 px-7 py-4 text-sm font-medium transition-all duration-200 border-r last:border-r-0 whitespace-nowrap"
                  style={{
                    borderColor: '#e8e0d4',
                    background: isActive ? step.activeBg : 'transparent',
                    color: isActive ? step.text : isDone ? '#7a6e62' : '#c0b8b0',
                    cursor: isDone ? 'pointer' : isActive ? 'default' : 'not-allowed',
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 leading-none"
                    style={{
                      background: isActive ? step.bg : isDone ? '#d4e5f2' : '#ede8e0',
                      color: isActive ? step.text : isDone ? '#2d5a78' : '#b8b0a8',
                      border: `1px solid ${isActive ? step.border : isDone ? '#a8c5de' : '#ddd8d0'}`,
                    }}
                  >
                    {isDone ? '✓' : i + 1}
                  </span>
                  {step.label}

                  {isActive && (
                    <motion.div
                      layoutId="stepIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: step.border }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-10 py-12">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {currentStep === 'model'      && <ModelSelection onModelInitialized={handleModelInitialized} />}
          {currentStep === 'benchmarks' && <BenchmarkSelection onNext={handleBenchmarksNext} onBack={() => setCurrentStep('model')} />}
          {currentStep === 'settings'   && <AdvancedSettings onNext={handleSettingsNext} onBack={() => setCurrentStep('benchmarks')} config={config} />}
          {currentStep === 'monitor'    && <EvaluationMonitor config={config} onComplete={handleEvaluationComplete} onBack={() => setCurrentStep('settings')} />}

          {currentStep === 'results' && (
            <div className="flex flex-col items-center text-center py-20 gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: '#d4e5f2', border: '1.5px solid #a8c5de' }}
              >
                <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                  <path d="M1.5 9L8.5 16L22.5 1.5" stroke="#2d5a78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p
                className="text-xl font-semibold"
                style={{ color: '#2c2416', fontFamily: '"Fraunces", serif' }}
              >
                Evaluation complete.
              </p>
              <p
                className="text-sm"
                style={{ color: '#9a8e82', fontFamily: '"DM Sans", sans-serif' }}
              >
                Results saved · Check the leaderboard to compare models
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;