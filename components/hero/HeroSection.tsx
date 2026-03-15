import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Loader2,
  Rocket,
  Sparkles,
  BarChart3,
  Target,
  Cloud,
  BarChart,
  AlertCircle, // <-- 1. ERROR HANDLING KE LIYE ADD KIYA
} from 'lucide-react';

// Aapki file structure ke hisaab se imports
// --- FIX: File extensions (.tsx) hata diye gaye hain taaki Vite unhein resolve kar sake ---
import TreeOfKnowledge from './TreeOfKnowledge';
import Button from '../ui/Button';

// --- Aapka HeroSection Component (Working form ke saath) ---
const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null); // <-- 2. ERROR STATE ADD KIYA

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  // --- 3. FORM SUBMIT HANDLER KO UPDATE KIYA ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !feedback) return; // Khaali form submit na karein

    setIsSubmitting(true);
    setError(null); // Purana error clear karein

    try {
      // Yeh hai aapka real API call
      const response = await fetch('https://10.0.62.205:8001/api/v1/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email || 'anonymous', // Agar email khaali hai
          feedback: feedback,
        }),
      });

      if (!response.ok) {
        // Server se error response
        throw new Error('Failed to submit feedback. Please try again.');
      }

      // Success
      setIsSuccess(true);
    } catch (err) {
      // Network ya doosra error
      console.error('Feedback submission error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 dark:from-gray-950 dark:via-purple-950/10 dark:to-gray-950 relative overflow-hidden transition-colors duration-300">
        
        {/* --- Aapki Stars Animation --- */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 bg-purple-600/30 dark:bg-purple-400/30 rounded-full"
              style={{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Hero Section with Two-Column Layout */}
        <div className="container mx-auto px-6 py-20 relative z-10">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]"
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {/* Left Column - Text and CTAs */}
            <motion.div variants={itemVariants} className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">
                    The Definitive Benchmark for Indian Language AI
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Evaluate, Compare, and Analyze Large Language Models with a
                  Global + India-First Framework.
                </p>
              </div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  className="group"
                >
                  <Rocket
                    className="group-hover:rotate-12 transition-transform duration-200"
                    size={20}
                  />
                  Launch Evaluation
                  <Sparkles
                    size={16}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/leaderboard')}
                  className="group"
                >
                  <BarChart3
                    className="group-hover:scale-110 transition-transform duration-200"
                    size={20}
                  />
                  View Leaderboard
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Column - Tree Animation */}
            <motion.div variants={itemVariants} className="flex justify-center">
              {/* Aapka TreeOfKnowledge component yahaan import ho gaya hai */}
              <TreeOfKnowledge />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              A Framework Built for Power and Precision
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comprehensive evaluation capabilities designed for modern AI
              research and development
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Target,
                title: 'Comprehensive & Extensible Benchmarks',
                description:
                  'Evaluate across 30+ global and Indic benchmarks, from mathematical reasoning with GSM8K to multilingual translation with Flores-IN. Easily add your own custom tests via simple JSON configuration.',
                color: 'text-purple-600 dark:text-purple-400',
              },
              {
                icon: Rocket,
                title: 'High-Performance Evaluation Engine',
                description:
                  'Achieve maximum throughput by running benchmarks in parallel across multiple GPUs. Automatic 4-bit quantization and intelligent resource management handle even the largest models with ease.',
                color: 'text-blue-600 dark:text-blue-400',
              },
              {
                icon: Cloud,
                title: 'Flexible Model Support',
                description:
                  'Test any model, anywhere. Seamlessly evaluate public models from Hugging Face, private fine-tunes from a local path, or powerful proprietary models via APIs like OpenAI and Gemini.',
                color: 'text-teal-600 dark:text-teal-400',
              },
              {
                icon: BarChart,
                title: 'Rich Analytics & Reporting',
                description:
                  'Go beyond simple scores. Dive deep with detailed per-language metrics, analyze results on our interactive leaderboard, and export raw JSON outputs for granular error analysis.',
                color: 'text-green-600 dark:text-green-400',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <div
                    className={`w-16 h-16 ${feature.color} bg-opacity-10 rounded-xl flex items-center justify-center mb-6`}
                  >
                    <Icon size={32} className={feature.color} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- NEW FEEDBACK SECTION (Working) --- */}
      <section className="py-24 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl mb-6">
              <MessageSquare size={32} />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Have Feedback or a Suggestion?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              We're constantly improving Eka-Eval. Help us make it better by
              sharing your thoughts or contributing to the project.
            </p>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8">
              {isSuccess ? (
                // Success message
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-10"
                >
                  <h3 className="text-2xl font-bold text-green-500 mb-4">
                    Thank You!
                  </h3>
                  <p className="text-lg text-gray-700 dark:text-gray-300">
                    Your feedback has been sent.
                  </p>
                </motion.div>
              ) : (
                // Form
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <textarea
                    placeholder="Share your ideas, report a bug, or suggest a new benchmark..."
                    className="w-full h-32 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500 focus:outline-none transition-colors"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={isSubmitting}
                  ></textarea>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="email"
                      placeholder="Your email (optional)"
                      className="flex-grow w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500 focus:outline-none transition-colors"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="submit"
                      size="lg"
                      className="group w-full sm:w-auto"
                      disabled={isSubmitting || !feedback}
                    >
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send
                          size={18}
                          className="group-hover:-rotate-12 transition-transform"
                        />
                      )}
                      {isSubmitting ? 'Sending...' : 'Send Feedback'}
                    </Button>
                  </div>
                  
                  {/* --- 4. ERROR MESSAGE DISPLAY --- */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 text-red-400"
                    >
                      <AlertCircle size={16} />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>
      {/* Extra </section> tag removed */}
    </>
  );
};

export default HeroSection;