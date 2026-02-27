// src/components/dashboard/AdvancedSettings.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Cpu, Zap, RefreshCw, FileText,
  Edit3, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';

const F = '"Nunito", "Varela Round", sans-serif';
const C = {
  bg: '#f5f0e8', card: '#fdf9f4', ink: '#2c2416', muted: '#7a6e62', faint: '#b0a898',
  border: '#e0d8cc', borderMd: '#d0c8bc',
  sage: '#6b9ab8', sageLt: '#d4e5f2', sageBd: '#a8c5de', sageDeep: '#2d5a78', sagePill: '#eaf3fa',
  rose: '#c9867c', roseLt: '#f5dbd8', roseBd: '#ddb4ae', roseDeep: '#8f3d35', rosePill: '#faeeed',
  ochre: '#c9a96e', ochreLt: '#f5e8cc', ochreBd: '#e0c888', ochreDeep: '#7a5218', ochrePill: '#faf3e5',
  slate: '#6b7b8d', slateLt: '#d4dde8', slateBd: '#b0c0d0', slateDeep: '#3d5068', slatePill: '#edf1f5',
  mauve: '#a07ab8', mauveLt: '#e8d8f0', mauveBd: '#c8a8d8', mauveDeep: '#5c3a72', mauvePill: '#f4eef9',
  teal: '#7ab8b0', tealLt: '#d4ede8', tealBd: '#8ed4bc', tealDeep: '#2d6b62', tealPill: '#eaf7f4',
};

// ── Fallback prompt data ──────────────────────────────────
const FALLBACK_PROMPTS: Record<string, any> = {
  piqa: {
    piqa_likelihood: {
      template: 'Question: {goal}\\nAnswer: {solution}',
      description: 'Likelihood-based PIQA prompt',
    },
    piqa_generation: {
      template: 'Choose the most appropriate solution (0 or 1):\\n\\nQuestion: {goal}\\n0) {sol1}\\n1) {sol2}\\nAnswer:',
      description: 'Generation-based PIQA prompt',
    },
    piqa_generation_simple: {
      template: 'Question: {goal}\\n0) {sol1}\\n1) {sol2}\\nAnswer:',
      description: 'Simple generation-based PIQA prompt',
    },
  },
};

interface AdvancedSettingsProps {
  onNext: (settings: any) => void;
  onBack: () => void;
  config: any;
}

interface PromptTemplate {
  template?: string;
  description: string;
  template_prefix?: string;
  few_shot_example_template?: string;
  few_shot_separator?: string;
  template_suffix?: string;
  [key: string]: any;
}

// ── Shared primitives ─────────────────────────────────────
const SectionLabel: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.mauve }) => (
  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color, fontFamily: F, marginBottom: 8 }}>
    {children}
  </p>
);

const Card: React.FC<{ children: React.ReactNode; accentBorder?: string; style?: React.CSSProperties }> = ({ children, accentBorder, style }) => (
  <div style={{ background: C.card, border: `1.5px solid ${accentBorder || C.border}`, borderRadius: 20, padding: 24, ...style }}>
    {children}
  </div>
);

// ── Warm slider (CSS injected once) ──────────────────────
const SLIDER_CSS = `
  .warm-slider { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 99px; outline: none; cursor: pointer; background: ${C.border}; }
  .warm-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: ${C.ochre}; border: 2.5px solid ${C.card}; box-shadow: 0 2px 8px ${C.ochreBd}; cursor: pointer; }
  .warm-slider::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: ${C.ochre}; border: 2.5px solid ${C.card}; box-shadow: 0 2px 8px ${C.ochreBd}; cursor: pointer; border: none; }
  .warm-slider::-webkit-slider-runnable-track { border-radius: 99px; }
`;

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
  accent?: string;
}

const SliderRow: React.FC<SliderRowProps> = ({ label, value, min, max, step = 1, onChange, unit = '', accent = C.ochre }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.muted, fontFamily: F }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.ink, fontFamily: F, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '1px 8px' }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ position: 'relative' }}>
        {/* Filled track overlay */}
        <div style={{
          position: 'absolute', top: '50%', left: 0,
          width: `${pct}%`, height: 6, background: accent,
          borderRadius: 99, transform: 'translateY(-50%)',
          pointerEvents: 'none', zIndex: 1, opacity: 0.7,
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(step % 1 !== 0 ? parseFloat(e.target.value) : parseInt(e.target.value))}
          className="warm-slider"
          style={{ width: '100%', position: 'relative', zIndex: 2 }}
        />
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────
const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ onNext, onBack, config }) => {
  const [settings, setSettings] = useState({
    batchSize: 8,
    maxNewTokens: 512,
    gpuCount: 1,
    temperature: 0.7,
    customPrompts: false,
    indicLanguages: {} as Record<string, string[]>,
  });

  const [promptConfigs, setPromptConfigs] = useState<Record<string, Record<string, PromptTemplate>>>({});
  const [selectedPrompts, setSelectedPrompts] = useState<Record<string, string>>({});
  const [expandedBenchmarks, setExpandedBenchmarks] = useState<Record<string, boolean>>({});
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (settings.customPrompts) loadPromptConfigurations();
  }, [settings.customPrompts]);

  const loadPromptConfigurations = async () => {
    setLoadingPrompts(true);
    let benchmarks: any[] = [];
    if (Array.isArray(config)) benchmarks = config;
    else if (config?.benchmarks) benchmarks = config.benchmarks;
    else if (config?.selectedBenchmarks) benchmarks = config.selectedBenchmarks;
    if (!benchmarks.length) { benchmarks = ['piqa']; setUseFallback(true); }

    const newConfigs: Record<string, Record<string, PromptTemplate>> = {};
    const newSelected: Record<string, string> = {};

    let baseUrl = 'https://lingo.iitgn.ac.in/eka-eval';
    if (!window.location.hostname.includes('lingo.iitgn.ac.in')) {
      baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '').replace(/\/api$/, '');
    }

    for (const item of benchmarks) {
      const id = typeof item === 'string' ? item : item?.id || item?.value;
      if (!id) continue;
      if (FALLBACK_PROMPTS[id]) {
        newConfigs[id] = FALLBACK_PROMPTS[id];
        newSelected[id] = Object.keys(FALLBACK_PROMPTS[id])[0];
        continue;
      }
      try {
        const res = await fetch(`${baseUrl}/api/v1/prompts/${id}`);
        if (res.ok) {
          const data = await res.json();
          newConfigs[id] = data;
          newSelected[id] = Object.keys(data)[0];
        } else if (id.includes('piqa')) {
          newConfigs[id] = FALLBACK_PROMPTS.piqa;
          newSelected[id] = Object.keys(FALLBACK_PROMPTS.piqa)[0];
        }
      } catch {}
    }

    setPromptConfigs(newConfigs);
    setSelectedPrompts(newSelected);
    setLoadingPrompts(false);
  };

  const startEdit = (benchmarkId: string) => {
    const key = selectedPrompts[benchmarkId];
    const p = promptConfigs[benchmarkId]?.[key];
    setEditedContent(p?.template || p?.template_suffix || JSON.stringify(p, null, 2));
    setEditingPrompt(benchmarkId);
  };

  const saveEdit = (benchmarkId: string) => {
    const key = selectedPrompts[benchmarkId];
    setPromptConfigs(prev => ({
      ...prev,
      [benchmarkId]: {
        ...prev[benchmarkId],
        [key]: { ...prev[benchmarkId][key], template: editedContent, description: `${prev[benchmarkId][key].description} (Custom)` },
      },
    }));
    setEditingPrompt(null);
  };

  const set = (k: string, v: any) => setSettings(p => ({ ...p, [k]: v }));

  return (
    <div style={{ fontFamily: F, maxWidth: 1000, margin: '0 auto' }}>
      <style>{SLIDER_CSS}</style>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.mauve, marginBottom: 8 }}>Step 3</p>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: C.ink, margin: '0 0 6px' }}>Advanced Configuration</h2>
        <p style={{ fontSize: 14, color: C.muted }}>Fine-tune evaluation parameters for optimal performance</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── Performance Card ── */}
        <Card accentBorder={C.ochreBd}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.ochreLt, border: `1px solid ${C.ochreBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color={C.ochreDeep} />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ochre, margin: 0 }}>Performance</p>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: C.ink, margin: 0 }}>Inference Settings</h3>
            </div>
          </div>
          <SliderRow label="Batch Size" value={settings.batchSize} min={1} max={32} onChange={v => set('batchSize', v)} accent={C.ochre} />
          <SliderRow label="Max New Tokens" value={settings.maxNewTokens} min={128} max={2048} step={128} onChange={v => set('maxNewTokens', v)} accent={C.teal} />
          <SliderRow label="Temperature" value={settings.temperature} min={0} max={2} step={0.1} onChange={v => set('temperature', v)} accent={C.mauve} />
        </Card>

        {/* ── GPU Card ── */}
        <Card accentBorder={C.slateBd}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.slateLt, border: `1px solid ${C.slateBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={16} color={C.slateDeep} />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.slate, margin: 0 }}>Resources</p>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: C.ink, margin: 0 }}>GPU Management</h3>
            </div>
          </div>
          <SliderRow label="GPU Count" value={settings.gpuCount} min={1} max={8} onChange={v => set('gpuCount', v)} accent={C.slate} />

          {/* Resource summary table */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginTop: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.faint, marginBottom: 14 }}>Estimated Resources</p>
            {[
              { label: 'Memory per GPU', value: '~12 GB' },
              { label: 'Total VRAM', value: `${settings.gpuCount * 12} GB` },
              { label: 'Parallel workers', value: `${settings.gpuCount}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: C.muted, fontFamily: F }}>{r.label}</span>
                <span style={{ fontWeight: 800, color: C.ink, fontFamily: F }}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Prompt Editor Card ── */}
      <Card accentBorder={C.mauveBd} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.mauveLt, border: `1px solid ${C.mauveBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={16} color={C.mauveDeep} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.mauve, margin: 0 }}>Optional</p>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: C.ink, margin: 0 }}>Prompt Customization</h3>
          </div>
        </div>

        {/* Toggle */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', marginBottom: 4 }}>
          <div
            onClick={() => set('customPrompts', !settings.customPrompts)}
            style={{
              width: 44, height: 24, borderRadius: 12, flexShrink: 0, marginTop: 1,
              background: settings.customPrompts ? C.mauve : C.border,
              position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
            }}>
            <div style={{
              position: 'absolute', top: 3, left: settings.customPrompts ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fdf9f4',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(44,36,22,0.2)',
            }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: '0 0 2px', fontFamily: F }}>Enable prompt customization</p>
            <p style={{ fontSize: 12, color: C.muted, margin: 0, fontFamily: F }}>Modify templates and few-shot examples for each benchmark</p>
          </div>
        </label>

        <AnimatePresence>
          {settings.customPrompts && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ marginTop: 20 }}>
                {useFallback && (
                  <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 12, background: C.slatePill, border: `1px solid ${C.slateBd}`, marginBottom: 14 }}>
                    <AlertCircle size={14} color={C.slate} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: C.slateDeep, fontFamily: F, margin: 0 }}>Using static prompt templates — network bypass active.</p>
                  </div>
                )}

                {loadingPrompts ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, color: C.muted, fontFamily: F, fontSize: 14 }}>
                    <RefreshCw size={18} color={C.mauve} className="animate-spin" /> Loading configurations…
                  </div>
                ) : Object.keys(promptConfigs).length === 0 ? (
                  <div style={{ display: 'flex', gap: 12, padding: 16, borderRadius: 14, background: C.ochrePill, border: `1px solid ${C.ochreBd}` }}>
                    <AlertCircle size={16} color={C.ochreDeep} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: C.ochreDeep, fontFamily: F, margin: 0 }}>No prompt configurations found. Check console for details.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {Object.entries(promptConfigs).map(([benchmarkId, prompts]) => (
                      <div key={benchmarkId} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>

                        {/* Benchmark row header */}
                        <div
                          onClick={() => setExpandedBenchmarks(p => ({ ...p, [benchmarkId]: !p[benchmarkId] }))}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.mauvePill, border: `1px solid ${C.mauveBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileText size={13} color={C.mauveDeep} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: 13, color: C.ink, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: F }}>{benchmarkId}</span>
                            <span style={{ fontSize: 11, color: C.faint, fontFamily: F }}>{Object.keys(prompts).length} templates</span>
                          </div>
                          <motion.div animate={{ rotate: expandedBenchmarks[benchmarkId] ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={16} color={C.muted} />
                          </motion.div>
                        </div>

                        <AnimatePresence>
                          {expandedBenchmarks[benchmarkId] && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              style={{ borderTop: `1px solid ${C.border}`, overflow: 'hidden' }}>
                              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                                {/* Template select */}
                                <div>
                                  <SectionLabel color={C.mauveDeep}>Template</SectionLabel>
                                  <div style={{ position: 'relative' }}>
                                    <select
                                      value={selectedPrompts[benchmarkId] || ''}
                                      onChange={e => setSelectedPrompts(p => ({ ...p, [benchmarkId]: e.target.value }))}
                                      style={{ width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 36px 10px 14px', color: C.ink, fontFamily: F, fontSize: 13, appearance: 'none', outline: 'none', cursor: 'pointer' }}>
                                      {Object.entries(prompts).map(([key, p]) => (
                                        <option key={key} value={key}>{key} — {p.description}</option>
                                      ))}
                                    </select>
                                    <ChevronDown size={14} color={C.muted} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                  </div>
                                </div>

                                {/* Prompt preview / editor */}
                                {selectedPrompts[benchmarkId] && (
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                      <SectionLabel color={C.mauveDeep}>Prompt Template</SectionLabel>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        {editingPrompt !== benchmarkId ? (
                                          <motion.button onClick={() => startEdit(benchmarkId)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: C.mauvePill, border: `1px solid ${C.mauveBd}`, color: C.mauveDeep, fontFamily: F, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                                            whileHover={{ background: C.mauveLt }}>
                                            <Edit3 size={12} /> Edit
                                          </motion.button>
                                        ) : (
                                          <>
                                            <motion.button onClick={() => saveEdit(benchmarkId)}
                                              style={{ padding: '5px 12px', borderRadius: 8, background: C.sagePill, border: `1px solid ${C.sageBd}`, color: C.sageDeep, fontFamily: F, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                                              whileHover={{ background: C.sageLt }}>
                                              Save
                                            </motion.button>
                                            <motion.button onClick={() => { setEditingPrompt(null); setEditedContent(''); }}
                                              style={{ padding: '5px 12px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, color: C.muted, fontFamily: F, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                                              whileHover={{ color: C.ink }}>
                                              Cancel
                                            </motion.button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {editingPrompt === benchmarkId ? (
                                      <textarea
                                        value={editedContent}
                                        onChange={e => setEditedContent(e.target.value)}
                                        rows={8}
                                        style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.mauveBd}`, borderRadius: 12, padding: '12px 14px', color: C.ink, fontFamily: 'monospace', fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                                        onFocus={e => (e.target.style.borderColor = C.mauve)}
                                        onBlur={e => (e.target.style.borderColor = C.mauveBd)}
                                      />
                                    ) : (
                                      <pre style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: C.muted, overflowX: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>
                                        {prompts[selectedPrompts[benchmarkId]]?.template || JSON.stringify(prompts[selectedPrompts[benchmarkId]], null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Footer nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <motion.button onClick={onBack}
          style={{ padding: '11px 22px', borderRadius: 13, background: C.card, border: `1.5px solid ${C.border}`, color: C.muted, fontFamily: F, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          whileHover={{ color: C.ink, borderColor: C.ochre }}>
          ← Back to Benchmarks
        </motion.button>
        <motion.button
          onClick={() => onNext({ ...settings, customPromptConfigs: settings.customPrompts ? { selectedPrompts, promptConfigs } : null })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 14, background: '#2c2416', color: '#fdf9f4', fontFamily: F, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}
          whileHover={{ background: '#2d5a78', y: -1 }} whileTap={{ y: 0 }}>
          Review & Launch →
        </motion.button>
      </div>
    </div>
  );
};

export default AdvancedSettings;