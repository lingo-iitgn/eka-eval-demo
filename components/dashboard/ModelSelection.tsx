import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Cloud, HardDrive, Globe, ChevronDown, Key, Search, AlertCircle, Loader2 } from 'lucide-react';

interface ModelSelectionProps {
  /**
   * Callback function that is triggered after a model
   * is successfully initialized by the backend.
   * It passes the full success response from the API.
   */
  onModelInitialized: (initResponse: any) => void;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ onModelInitialized }) => {
  const [selectedType, setSelectedType] = useState<'huggingface' | 'local' | 'api'>('huggingface');
  const [modelConfig, setModelConfig] = useState({
    identifier: '',
    apiKey: '',
    provider: 'openai'
  });
  
  // --- New States for API Interaction ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelTypes = [
    {
      id: 'huggingface' as const,
      title: 'Hugging Face Hub',
      description: 'Load models directly from the Hugging Face Model Hub',
      icon: Globe,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'local' as const,
      title: 'Local Model',
      description: 'Use a model stored on your local filesystem',
      icon: HardDrive,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'api' as const,
      title: 'API Model',
      description: 'Connect to models via API (OpenAI, Gemini, Claude)',
      icon: Cloud,
      color: 'from-purple-500 to-blue-500'
    }
  ];

  const apiProviders = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'] },
    { id: 'gemini', name: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision'] },
    { id: 'claude', name: 'Anthropic Claude', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] }
  ];

  const popularModels = [
    'microsoft/DialoGPT-medium',
    'google/gemma-2b',
    'meta-llama/Llama-2-7b-hf',
    'mistralai/Mixtral-8x7B-v0.1',
    'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO'
  ];

  /**
   * --- Updated handleNext function ---
   * This function now makes an asynchronous call to the FastAPI backend.
   */
  const handleNext = async () => {
    // 1. Start loading and clear previous errors
    setIsLoading(true);
    setError(null);

    // 2. Construct the payload matching the backend's Pydantic model
    const payload = {
      type: selectedType,
      identifier: modelConfig.identifier,
      apiKey: selectedType === 'api' ? modelConfig.apiKey : null,
      provider: selectedType === 'api' ? modelConfig.provider : null,
    };

    try {
    
      const response = await fetch('https://10.0.62.205:8001/api/v1/init-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // 4. Handle non-OK responses (e.g., 500, 404)
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `HTTP error! Status: ${response.status}`);
      }

      // 5. Handle successful response
      const result = await response.json();
      console.log('Model initialized:', result);
      
      // Call the onModelInitialized prop to notify the parent component
      onModelInitialized(result); 

    } catch (err) {
      // 6. Handle fetch errors or errors thrown from non-OK responses
      console.error("Failed to initialize model:", err);
      setError((err as Error).message);
    } finally {
      // 7. Stop loading, regardless of success or failure
      setIsLoading(false);
    }
  };

  const isButtonDisabled = 
    isLoading || 
    !modelConfig.identifier || 
    (selectedType === 'api' && !modelConfig.apiKey);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-white mb-4">Select Your Model</h2>
        <p className="text-gray-400">Choose how you want to load your model for evaluation</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modelTypes.map((type, index) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-500/10 shadow-2xl shadow-purple-500/20' 
                    : 'hover:border-gray-600'
                }`}
                hover={false}
                onClick={() => setSelectedType(type.id)}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{type.title}</h3>
                  <p className="text-gray-400 text-sm">{type.description}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          {/* ... (All the conditional rendering for 'huggingface', 'local', and 'api' inputs remain exactly the same) ... */}
          {selectedType === 'huggingface' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Globe size={20} />
                Hugging Face Model
              </h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="e.g., microsoft/DialoGPT-medium"
                  value={modelConfig.identifier}
                  onChange={(e) => setModelConfig({...modelConfig, identifier: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-3">Popular models:</p>
                <div className="flex flex-wrap gap-2">
                  {popularModels.map((model) => (
                    <button
                      key={model}
                      onClick={() => setModelConfig({...modelConfig, identifier: model})}
                      className="px-3 py-1 bg-gray-800 hover:bg-purple-500/20 border border-gray-600 hover:border-purple-500 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {model.split('/')[1] || model}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedType === 'local' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <HardDrive size={20} />
                Local Model Path
              </h3>
              
              <div>
                <input
                  type="text"
                  placeholder="/path/to/your/model"
                  value={modelConfig.identifier}
                  onChange={(e) => setModelConfig({...modelConfig, identifier: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Path should contain config.json, tokenizer files, and model weights
                </p>
              </div>
            </div>
          )}

          {selectedType === 'api' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Cloud size={20} />
                API Model Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Provider</label>
                  <div className="relative">
                    <select
                      value={modelConfig.provider}
                      onChange={(e) => setModelConfig({...modelConfig, provider: e.target.value, identifier: ''})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none appearance-none"
                    >
                      {apiProviders.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Model</label>
                  <div className="relative">
                    <select
                      value={modelConfig.identifier}
                      onChange={(e) => setModelConfig({...modelConfig, identifier: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none appearance-none"
                    >
                      <option value="">Select a model</option>
                      {apiProviders
                        .find(p => p.id === modelConfig.provider)?.models
                        .map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))
                      }
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2 flex items-center gap-2">
                  <Key size={16} />
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your API key"
                  value={modelConfig.apiKey}
                  onChange={(e) => setModelConfig({...modelConfig, apiKey: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Your API key is stored securely for this session only
                </p>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* --- New Error Display --- */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center gap-3"
        >
          <AlertCircle size={20} />
          <div>
            <span className="font-semibold">Initialization Failed:</span> {error}
          </div>
        </motion.div>
      )}

      {/* --- Updated Button with Loading State --- */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={isButtonDisabled}
          size="lg"
          className="flex items-center gap-2"
        >
          {isLoading && <Loader2 className="animate-spin" size={20} />}
          {isLoading ? 'Initializing Model...' : 'Continue to Benchmarks'}
        </Button>
      </div>
    </div>
  );
};

export default ModelSelection;