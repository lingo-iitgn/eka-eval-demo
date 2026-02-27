import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Loader2, Rocket, BarChart3,
  Target, Cloud, BarChart, AlertCircle, ArrowUpRight,
} from 'lucide-react';
import TreeOfKnowledge from './TreeOfKnowledge';

/*
  Palette — Japandi research poster:
  Cream bg:   #f5f0e8
  Warm white: #fdf9f4
  Ink:        #2c2416
  Muted:      #7a6e62
  Sage:       #7a9e7e  /  sage-lt: #d4e8d6  /  sage-pill: #eaf2eb
  Rose:       #c9867c  /  rose-lt: #f5dbd8  /  rose-pill: #faeeed
  Ochre:      #c9a96e  /  ochre-lt: #f5e8cc /  ochre-pill: #faf3e5
  Slate:      #6b7b8d  /  slate-lt: #d4dde8 /  slate-pill: #edf1f5
  Mauve:      #a07ab8  /  mauve-lt: #e8d8f0 /  mauve-pill: #f4eef9
*/

const FONT_DISPLAY = '"Nunito", "Varela Round", sans-serif';
const FONT_BODY    = '"Nunito", "Varela Round", sans-serif';

const FEATURE_PALETTES = [
  { bg: '#eaf2eb', border: '#b8d9bc', icon: '#3d6b42', tag: '#7a9e7e' },   // sage
  { bg: '#edf1f5', border: '#b0c0d0', icon: '#3d5068', tag: '#6b7b8d' },   // slate
  { bg: '#faeeed', border: '#ddb4ae', icon: '#8f3d35', tag: '#c9867c' },   // rose
  { bg: '#f4eef9', border: '#c8a8d8', icon: '#5c3a72', tag: '#a07ab8' },   // mauve
];

const FeatureCard: React.FC<{
  icon: React.ElementType;
  num: string;
  title: string;
  desc: string;
  pal: typeof FEATURE_PALETTES[0];
  delay: number;
}> = ({ icon: Icon, num, title, desc, pal, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="rounded-2xl p-7 group"
    style={{
      background: '#fdf9f4',
      border: `1.5px solid ${pal.border}`,
      boxShadow: `0 1px 16px ${pal.bg}`,
    }}
  >
    <div className="flex items-start justify-between mb-5">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: pal.bg, border: `1px solid ${pal.border}` }}
      >
        <Icon size={18} color={pal.icon} strokeWidth={1.7} />
      </div>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: pal.bg, color: pal.tag, fontFamily: FONT_BODY }}
      >
        {num}
      </span>
    </div>
    <h3
      className="font-bold text-[15px] mb-2 leading-snug"
      style={{ color: '#2c2416', fontFamily: FONT_DISPLAY }}
    >
      {title}
    </h3>
    <p
      className="text-sm leading-relaxed"
      style={{ color: '#8a7e72', fontFamily: FONT_BODY, fontWeight: 500 }}
    >
      {desc}
    </p>
  </motion.div>
);

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !feedback) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('https://lingo.iitgn.ac.in/eka-eval/api/v1/submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || 'anonymous', feedback }),
      });
      if (!res.ok) throw new Error('Submission failed. Please try again.');
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ── HERO ────────────────────────────────────────────── */}
      <section
        className="min-h-screen relative overflow-hidden"
        style={{ background: '#ffffff' }}
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
            opacity: 0.5,
          }}
        />

        {/* Soft ambient gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute"
            style={{
              width: 520, height: 520,
              top: -120, right: -80,
              borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
              background: 'radial-gradient(ellipse, #d4e5f240 0%, transparent 68%)',
            }}
          />
          <div
            className="absolute"
            style={{
              width: 380, height: 380,
              bottom: 40, left: -80,
              borderRadius: '40% 60% 30% 70% / 60% 40% 70% 30%',
              background: 'radial-gradient(ellipse, #f5dbd840 0%, transparent 68%)',
            }}
          />
          <div
            className="absolute"
            style={{
              width: 280, height: 280,
              top: '35%', left: '40%',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, #f5e8cc28 0%, transparent 70%)',
            }}
          />
        </div>

        <div className="container mx-auto px-8 pt-24 pb-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-[76vh]">
            {/* Left column */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1
                  className="text-[2.5rem] leading-[1.08] font-extrabold mb-5 tracking-tight"
                  style={{
                    color: '#2c2416',
                    fontFamily: FONT_DISPLAY,
                  }}
                >
                  The Framework for{' '}
                  <em
                    className="not-italic px-2 rounded-xl inline-block"
                    style={{ background: '#f5dbd8', color: '#9e4a42' }}
                  >
                    Low-Resource
                  </em>{' '}
                  <br />Language Evaluation.
                </h1>
                <p
                  className="text-[15px] leading-relaxed max-w-[420px]"
                  style={{ color: '#7a6e62', fontFamily: FONT_BODY, fontWeight: 500 }}
                >
                  Evaluate, compare, and analyze large language models with a
                  multilingual-first benchmark suite built for languages the
                  mainstream ignores.
                </p>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap gap-3"
              >
                {[
                  { n: '55+', l: 'Global benchmarks', bg: '#d4e5f2', border: '#a8c5de', c: '#2d5a78' },
                  { n: '120+', l: 'Low-resource langs', bg: '#f5dbd8', border: '#ddb4ae', c: '#8f3d35' },
                  { n: '8',   l: 'Task categories',   bg: '#f5e8cc', border: '#e0c888', c: '#7a5218' },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="flex items-baseline gap-2 px-4 py-2.5 rounded-xl"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}
                  >
                    <span
                      className="text-2xl font-bold leading-none"
                      style={{ color: s.c, fontFamily: FONT_DISPLAY }}
                    >
                      {s.n}
                    </span>
                    <span
                      className="text-xs leading-tight font-semibold"
                      style={{ color: s.c, opacity: 0.75, fontFamily: FONT_BODY }}
                    >
                      {s.l}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex flex-wrap gap-3"
              >
                <motion.button
                  onClick={() => navigate('/dashboard')}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: '#2c2416',
                    color: '#f5f0e8',
                    fontFamily: FONT_BODY,
                    boxShadow: '0 2px 12px #2c241628',
                  }}
                  whileHover={{ background: '#2d5a78', y: -2, boxShadow: '0 8px 20px #2d5a7840' }}
                  whileTap={{ y: 0 }}
                >
                  <Rocket size={14} strokeWidth={2} />
                  Launch Evaluation
                  <ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                <motion.button
                  onClick={() => navigate('/leaderboard')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: '#fdf9f4',
                    color: '#4a3e32',
                    fontFamily: FONT_BODY,
                    border: '1.5px solid #ddd4c8',
                  }}
                  whileHover={{ background: '#d4e5f2', borderColor: '#a8c5de', color: '#1d3a58', y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <BarChart3 size={14} strokeWidth={1.8} />
                  View Leaderboard
                </motion.button>
              </motion.div>
            </div>

            {/* Right column — tree */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center"
            >
              <TreeOfKnowledge />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#ffffff' }}>
        <div className="container mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div
                className="w-3.5 h-3.5 rounded-sm rotate-45"
                style={{ background: '#d4e5f2', border: '1px solid #a8c5de' }}
              />
              <span
                className="text-[11px] font-bold uppercase tracking-[0.2em]"
                style={{ color: '#6b9ab8', fontFamily: FONT_BODY }}
              >
                Capabilities
              </span>
              <div
                className="w-3.5 h-3.5 rounded-sm rotate-45"
                style={{ background: '#d4e5f2', border: '1px solid #a8c5de' }}
              />
            </div>
            <h2
              className="text-3xl font-extrabold tracking-tight leading-snug mb-3"
              style={{ color: '#2c2416', fontFamily: FONT_DISPLAY }}
            >
              Precision tools for rigorous multilingual research.
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: '#9a8e82', fontFamily: FONT_BODY, fontWeight: 500 }}
            >
              Every component designed for research reproducibility and
              cross-linguistic fairness.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            <FeatureCard
              icon={Target} num="01"
              title="Comprehensive & Extensible Benchmarks"
              desc="32+ global and 23+ low-resource multilingual benchmarks — from GSM8K to Flores-IN. Extend with custom tests via simple JSON configuration."
              pal={FEATURE_PALETTES[0]} delay={0}
            />
            <FeatureCard
              icon={Rocket} num="02"
              title="High-Performance Evaluation Engine"
              desc="Parallel GPU execution with automatic 4-bit quantization. Intelligent resource management handles the largest models without manual overhead."
              pal={FEATURE_PALETTES[1]} delay={0.09}
            />
            <FeatureCard
              icon={Cloud} num="03"
              title="Flexible Model Support"
              desc="Public Hugging Face models, private fine-tunes from local paths, or proprietary APIs like OpenAI and Gemini — all from one interface."
              pal={FEATURE_PALETTES[2]} delay={0.18}
            />
            <FeatureCard
              icon={BarChart} num="04"
              title="Rich Analytics & Reporting"
              desc="Per-language breakdowns, interactive leaderboard comparisons, and raw JSON export for granular error analysis beyond aggregated scores."
              pal={FEATURE_PALETTES[3]} delay={0.27}
            />
          </div>
        </div>
      </section>

      {/* ── FEEDBACK ────────────────────────────────────────── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: '#f5f0e8' }}
      >
        {/* Decorative blob */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 400, height: 400,
            right: -100, bottom: -80,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, #e8d8f030 0%, transparent 70%)',
          }}
        />

        <div className="container mx-auto px-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: '#e8d8f0', border: '1px solid #c8a8d8' }}
              >
                <MessageSquare size={17} color="#6c3d88" strokeWidth={1.8} />
              </div>
              <h2
                className="text-3xl font-extrabold mb-2 tracking-tight"
                style={{ color: '#2c2416', fontFamily: FONT_DISPLAY }}
              >
                Share your feedback.
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#8a7e72', fontFamily: FONT_BODY, fontWeight: 500 }}
              >
                Suggest a benchmark, report a bug, or tell us which language
                we should add next. The team reads everything.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#fdf9f4',
                border: '1.5px solid #e0d4f0',
                boxShadow: '0 4px 28px #e8d8f030',
              }}
            >
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-8 py-12 text-center"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: '#d4e5f2', border: '1px solid #a8c5de' }}
                  >
                    <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                      <path d="M1.5 8L7.5 14L18.5 1.5" stroke="#2d5a78" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p
                    className="font-bold text-base"
                    style={{ color: '#2c2416', fontFamily: FONT_DISPLAY }}
                  >
                    Received, thank you.
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: '#9a8e82', fontFamily: FONT_BODY }}
                  >
                    We'll review it shortly.
                  </p>
                </motion.div>
              ) : (
                <form className="px-8 py-7 space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label
                      className="block text-[10px] font-bold uppercase tracking-[0.18em] mb-2"
                      style={{ color: '#a07ab8', fontFamily: FONT_BODY }}
                    >
                      Message <span style={{ color: '#c9867c' }}>*</span>
                    </label>
                    <textarea
                      placeholder="Describe a bug, suggest a benchmark, share ideas..."
                      className="w-full h-28 p-3.5 rounded-xl resize-none text-sm leading-relaxed focus:outline-none transition-all duration-200"
                      style={{
                        background: '#f5f0e8',
                        border: '1.5px solid #e0d4c8',
                        color: '#2c2416',
                        fontFamily: FONT_BODY,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#c8a8d8')}
                      onBlur={(e) => (e.target.style.borderColor = '#e0d4c8')}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-[10px] font-bold uppercase tracking-[0.18em] mb-2"
                      style={{ color: '#a07ab8', fontFamily: FONT_BODY }}
                    >
                      Email{' '}
                      <span
                        style={{ color: '#b0a898', fontVariant: 'normal', textTransform: 'none', letterSpacing: 0, fontSize: 11 }}
                      >
                        (optional)
                      </span>
                    </label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all duration-200"
                      style={{
                        background: '#f5f0e8',
                        border: '1.5px solid #e0d4c8',
                        color: '#2c2416',
                        fontFamily: FONT_BODY,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#c8a8d8')}
                      onBlur={(e) => (e.target.style.borderColor = '#e0d4c8')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {error ? (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: '#c9867c', fontFamily: FONT_BODY }}
                      >
                        <AlertCircle size={12} />
                        {error}
                      </motion.span>
                    ) : <span />}

                    <motion.button
                      type="submit"
                      disabled={isSubmitting || !feedback}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: '#2c2416',
                        color: '#f5f0e8',
                        fontFamily: FONT_BODY,
                      }}
                      whileHover={{ background: '#2d5a78', y: -1 }}
                      whileTap={{ y: 0 }}
                    >
                      {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      {isSubmitting ? 'Sending…' : 'Send feedback'}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;