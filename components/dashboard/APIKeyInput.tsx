// src/components/dashboard/APIKeyInput.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ShieldAlert, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface APIKeyInputProps {
  onBack: () => void;
  onConnect: (provider: string, model: string, apiKey: string) => Promise<void>;
}

const APIKeyInput: React.FC<APIKeyInputProps> = ({ onBack, onConnect }) => {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = [
    { 
      id: 'openai', 
      name: 'OpenAI', 
      icon: '🤖',
      models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4o']
    },
    { 
      id: 'gemini', 
      name: 'Google Gemini', 
      icon: '✨',
      models: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash']
    },
    { 
      id: 'claude', 
      name: 'Anthropic Claude', 
      icon: '🧠',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    }
  ];

  const handleConnect = async () => {
    if (!apiKey || !selectedModel) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onConnect(provider, selectedModel, apiKey);
    } catch (err: any) {
      setError(err.message || "Failed to connect");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-white">Configure API Access</h2>
          <p className="text-gray-400">Securely connect to external LLM providers</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-purple-500">
        <div className="space-y-6">
          
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Select Provider</label>
            <div className="grid grid-cols-3 gap-4">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setProvider(p.id);
                    setSelectedModel(p.models[0]); // Reset model when provider changes
                  }}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2
                    ${provider === p.id 
                      ? 'bg-purple-500/20 border-purple-500 text-white' 
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600'
                    }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
            >
              {providers.find(p => p.id === provider)?.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex justify-between">
              <span>API Key</span>
              <span className="text-xs text-purple-400 cursor-help" title="We verify this key by making a small test request.">How is this used?</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`sk-... (Enter your ${providers.find(p => p.id === provider)?.name} API Key)`}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Disclaimer Box */}
          <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200/80">
              <p className="font-semibold text-yellow-500 mb-1">Security Disclaimer</p>
              <p>
                Your API key is sent directly to your backend server for initialization. 
                While we do not store it permanently, please ensure you are running this on a secure network 
                (HTTPS) or localhost. <strong>Do not share this screen.</strong>
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleConnect}
            disabled={!apiKey || !selectedModel || isLoading}
            className="w-full py-4 text-lg font-medium shadow-lg shadow-purple-500/20"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" /> Verifying & Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 size={20} /> Connect & Initialize Model
              </span>
            )}
          </Button>

        </div>
      </Card>
    </motion.div>
  );
};

export default APIKeyInput;