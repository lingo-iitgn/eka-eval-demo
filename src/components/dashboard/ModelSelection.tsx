// src/components/dashboard/ModelSelection.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, HardDrive, Globe, ChevronDown, ChevronLeft,
  Key, Search, AlertCircle, Loader2, ShieldAlert, Terminal, Cpu,
} from 'lucide-react';

const F = '"Nunito", "Varela Round", sans-serif';
const C = {
  bg: '#f5f0e8', card: '#fdf9f4', ink: '#2c2416', muted: '#7a6e62', faint: '#b0a898', border: '#e0d8cc',
  sage: '#6b9ab8', sageLt: '#d4e5f2', sageBd: '#a8c5de', sageDeep: '#2d5a78', sagePill: '#eaf3fa',
  rose: '#c9867c', roseLt: '#f5dbd8', roseBd: '#ddb4ae', roseDeep: '#8f3d35', rosePill: '#faeeed',
  ochre: '#c9a96e', ochreLt: '#f5e8cc', ochreBd: '#e0c888', ochreDeep: '#7a5218', ochrePill: '#faf3e5',
  slate: '#6b7b8d', slateLt: '#d4dde8', slateBd: '#b0c0d0', slateDeep: '#3d5068', slatePill: '#edf1f5',
  mauve: '#a07ab8', mauveLt: '#e8d8f0', mauveBd: '#c8a8d8', mauveDeep: '#5c3a72', mauvePill: '#f4eef9',
};

const MODEL_TYPES = [
  { id: 'huggingface' as const, title: 'Hugging Face Hub', desc: 'Load models directly from the HF Model Hub', icon: Globe, bg: C.sageLt, border: C.sageBd, icon_c: C.sageDeep, accent: C.sage },
  { id: 'local' as const,       title: 'Local Model',      desc: 'Use a model stored on your local filesystem',   icon: HardDrive, bg: C.ochreLt, border: C.ochreBd, icon_c: C.ochreDeep, accent: C.ochre },
  { id: 'api' as const,         title: 'API Provider',     desc: 'Connect via OpenAI, Gemini, or Claude',         icon: Cloud, bg: C.slateLt, border: C.slateBd, icon_c: C.slateDeep, accent: C.slate },
];

const API_PROVIDERS = [
  { id: 'openai',  name: 'OpenAI',          emoji: '⚡', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],            bg: C.sageLt,  border: C.sageBd,  text: C.sageDeep },
  { id: 'gemini',  name: 'Google Gemini',   emoji: '✦',  models: ['gemini-1.5-pro', 'gemini-pro', 'gemini-pro-vision'],            bg: C.slateLt, border: C.slateBd, text: C.slateDeep },
  { id: 'claude',  name: 'Anthropic',       emoji: '◈',  models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'], bg: C.roseLt, border: C.roseBd, text: C.roseDeep },
];

const POPULAR_MODELS = ['google/gemma-2-2b', 'google/gemma-2b', 'meta-llama/Meta-Llama-3-8B', 'sarvamai/sarvam-1'];

interface ModelSelectionProps { onModelInitialized: (r: any) => void; }

const SectionLabel: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.mauve }) => (
  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color, fontFamily: F, marginBottom: 8 }}>{children}</p>
);

const inputBase = { background: C.bg, border: `1.5px solid ${C.border}`, color: C.ink, fontFamily: F, borderRadius: 12, padding: '11px 14px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const };

const PrimaryBtn: React.FC<{ onClick: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }> = ({ onClick, disabled, loading, children }) => (
  <motion.button onClick={onClick} disabled={disabled}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 14, background: disabled ? '#d0c8bc' : '#2c2416', color: '#fdf9f4', fontFamily: F, fontWeight: 800, fontSize: 14, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
    whileHover={!disabled ? { background: '#2d5a78', y: -1 } : {}} whileTap={!disabled ? { y: 0 } : {}}>
    {loading && <Loader2 size={15} className="animate-spin" />}
    {loading ? 'Initializing…' : children}
  </motion.button>
);

const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.button onClick={onClick}
    style={{ padding: 8, borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer', display: 'flex' }}
    whileHover={{ borderColor: C.sageBd, color: C.ink }}>
    <ChevronLeft size={20} />
  </motion.button>
);

const ErrorBox: React.FC<{ msg: string }> = ({ msg }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 12, background: C.rosePill, border: `1.5px solid ${C.roseBd}`, fontFamily: F }}>
    <AlertCircle size={16} color={C.roseDeep} style={{ flexShrink: 0, marginTop: 1 }} />
    <p style={{ fontSize: 13, fontWeight: 600, color: C.roseDeep, margin: 0 }}>Initialization failed: {msg}</p>
  </motion.div>
);

const ModelSelection: React.FC<ModelSelectionProps> = ({ onModelInitialized }) => {
  const [selectedType, setSelectedType] = useState<'huggingface' | 'local' | 'api' | null>(null);
  const [config, setConfig] = useState({ identifier: '', apiKey: '', provider: 'openai', hfToken: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLargeModel = (id: string) => { const m = id.toLowerCase().match(/(\d+(?:\.\d+)?)\s*b(?:\b|[-_]|$)/); return m ? parseFloat(m[1]) > 5 : false; };

  const handleNext = async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/init-model`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, identifier: config.identifier, apiKey: selectedType === 'api' ? config.apiKey : null, provider: selectedType === 'api' ? config.provider : null, hfToken: selectedType === 'huggingface' ? config.hfToken : null }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || `HTTP ${res.status}`); }
      onModelInitialized(await res.json());
    } catch (err) { setError((err as Error).message); }
    finally { setIsLoading(false); }
  };

  const isDisabled = isLoading || !config.identifier || (selectedType === 'api' && !config.apiKey);

  // ── Type selection ────────────────────────────────────────
  if (!selectedType) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.sage, fontFamily: F, marginBottom: 10 }}>Step 1</p>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: C.ink, fontFamily: F, margin: '0 0 8px' }}>Select your model source</h2>
        <p style={{ fontSize: 14, color: C.muted, fontFamily: F }}>Choose how you want to load your model for evaluation</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {MODEL_TYPES.map((type, i) => {
          const Icon = type.icon;
          return (
            <motion.button key={type.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedType(type.id)}
              style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: '28px 24px', textAlign: 'left', cursor: 'pointer', fontFamily: F }}
              whileHover={{ y: -5, borderColor: type.border, boxShadow: `0 10px 28px ${type.bg}aa` }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: type.bg, border: `1px solid ${type.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <Icon size={20} color={type.icon_c} strokeWidth={1.8} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 6 }}>{type.title}</h3>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 16 }}>{type.desc}</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: type.icon_c }}>Select →</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );

  // ── API config ────────────────────────────────────────────
  if (selectedType === 'api') {
    const activeP = API_PROVIDERS.find(p => p.id === config.provider)!;
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <BackBtn onClick={() => setSelectedType(null)} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.slate, fontFamily: F, marginBottom: 3 }}>Step 1 · API Model</p>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: C.ink, fontFamily: F, margin: 0 }}>Configure API Access</h2>
          </div>
        </div>

        <div style={{ background: C.card, border: `1.5px solid ${activeP.border}`, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <SectionLabel color={activeP.text}>Provider</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {API_PROVIDERS.map(p => (
                <motion.button key={p.id}
                  onClick={() => setConfig({ ...config, provider: p.id, identifier: p.models[0] })}
                  style={{ padding: '14px 10px', borderRadius: 12, border: `1.5px solid ${config.provider === p.id ? p.border : C.border}`, background: config.provider === p.id ? p.bg : C.bg, color: config.provider === p.id ? p.text : C.muted, fontFamily: F, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
                  whileHover={{ borderColor: p.border, background: p.bg, color: p.text }}>
                  <span style={{ fontSize: 20 }}>{p.emoji}</span>{p.name}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel color={activeP.text}>Model</SectionLabel>
            <div style={{ position: 'relative' }}>
              <select value={config.identifier} onChange={e => setConfig({ ...config, identifier: e.target.value })}
                style={{ ...inputBase, appearance: 'none', paddingRight: 36 }}
                onFocus={e => (e.target.style.borderColor = activeP.border)}
                onBlur={e => (e.target.style.borderColor = C.border)}>
                <option value="">Select a model</option>
                {API_PROVIDERS.find(p => p.id === config.provider)?.models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={16} color={C.muted} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <SectionLabel color={activeP.text}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Key size={11} /> API Key</span></SectionLabel>
            <input type="password" placeholder="Enter your API key…" value={config.apiKey}
              onChange={e => setConfig({ ...config, apiKey: e.target.value })}
              style={{ ...inputBase, fontFamily: 'monospace', fontSize: 13 }}
              onFocus={e => (e.target.style.borderColor = activeP.border)}
              onBlur={e => (e.target.style.borderColor = C.border)} />
          </div>

          <div style={{ display: 'flex', gap: 10, padding: 14, borderRadius: 12, background: C.ochrePill, border: `1px solid ${C.ochreBd}` }}>
            <ShieldAlert size={15} color={C.ochreDeep} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: C.ochreDeep, fontFamily: F, margin: 0 }}>
              <strong>Security notice:</strong> Avoid using production keys. Keys should be encrypted in production.
            </p>
          </div>
        </div>

        {error && <ErrorBox msg={error} />}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PrimaryBtn onClick={handleNext} disabled={isDisabled} loading={isLoading}>Continue to Benchmarks</PrimaryBtn>
        </div>
      </motion.div>
    );
  }

  // ── HF / Local config ─────────────────────────────────────
  const typeInfo = MODEL_TYPES.find(t => t.id === selectedType)!;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <BackBtn onClick={() => setSelectedType(null)} />
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: typeInfo.icon_c, fontFamily: F, marginBottom: 3 }}>
            Step 1 · {selectedType === 'huggingface' ? 'Hugging Face' : 'Local Model'}
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: C.ink, fontFamily: F, margin: 0 }}>
            {selectedType === 'huggingface' ? 'Load from Hub' : 'Local Model Path'}
          </h2>
        </div>
      </div>

      <div style={{ background: C.card, border: `1.5px solid ${typeInfo.border}`, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {selectedType === 'huggingface' && (<>
          <div>
            <SectionLabel color={typeInfo.icon_c}>Model Identifier</SectionLabel>
            <div style={{ position: 'relative' }}>
              <Search size={14} color={C.muted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" placeholder="e.g., google/gemma-2b" value={config.identifier}
                onChange={e => setConfig({ ...config, identifier: e.target.value })}
                style={{ ...inputBase, paddingLeft: 36 }}
                onFocus={e => (e.target.style.borderColor = typeInfo.border)}
                onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
          </div>

          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.muted, fontFamily: F, marginBottom: 10 }}>Popular models</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POPULAR_MODELS.map(m => (
                <motion.button key={m}
                  onClick={() => setConfig({ ...config, identifier: m })}
                  style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, fontFamily: F, cursor: 'pointer', background: config.identifier === m ? typeInfo.bg : C.bg, border: `1px solid ${config.identifier === m ? typeInfo.border : C.border}`, color: config.identifier === m ? typeInfo.icon_c : C.muted }}
                  whileHover={{ borderColor: typeInfo.border, background: typeInfo.bg, color: typeInfo.icon_c }}>
                  {m.split('/')[1] || m}
                </motion.button>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <SectionLabel color={typeInfo.icon_c}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Key size={11} /> HF Access Token (optional)</span></SectionLabel>
            <input type="password" placeholder="hf_…" value={config.hfToken}
              onChange={e => setConfig({ ...config, hfToken: e.target.value })}
              style={{ ...inputBase, fontFamily: 'monospace', fontSize: 13 }}
              onFocus={e => (e.target.style.borderColor = C.ochreBd)}
              onBlur={e => (e.target.style.borderColor = C.border)} />
            <p style={{ fontSize: 11, color: C.faint, fontFamily: F, marginTop: 5 }}>Generate at huggingface.co/settings/tokens with read access</p>
          </div>
        </>)}

        {selectedType === 'local' && (
          <div>
            <SectionLabel color={typeInfo.icon_c}>Model Path</SectionLabel>
            <input type="text" placeholder="/path/to/your/model" value={config.identifier}
              onChange={e => setConfig({ ...config, identifier: e.target.value })}
              style={inputBase}
              onFocus={e => (e.target.style.borderColor = typeInfo.border)}
              onBlur={e => (e.target.style.borderColor = C.border)} />
            <p style={{ fontSize: 12, color: C.muted, fontFamily: F, marginTop: 6 }}>Path should contain config.json, tokenizer files, and model weights</p>
          </div>
        )}
      </div>

      {/* Large model proactive warning */}
      <AnimatePresence>
        {isLargeModel(config.identifier) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ borderRadius: 16, padding: 20, background: C.ochrePill, border: `1.5px solid ${C.ochreBd}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: C.ochreDeep, fontFamily: F }}>
              <Cpu size={18} /> Larger models are currently not able to run
            </div>
            <p style={{ fontSize: 13, color: C.ochreDeep, fontFamily: F, margin: 0 }}>
              Models above 5B parameters cannot run on the hosted instance. You can run them through the CLI or the open-source UI code.
            </p>
            <div style={{ padding: '10px 14px', borderRadius: 12, background: C.card, border: `1px solid ${C.ochreBd}`, display: 'flex', gap: 10 }}>
              <Terminal size={14} color={C.sage} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 800, fontSize: 13, color: C.ink, fontFamily: F, margin: '0 0 3px' }}>Run via CLI or open-source UI</p>
                <a href="https://github.com/lingo-iitgn/eka-eval-demo" target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'monospace', fontSize: 12, color: C.sage, textDecoration: 'none' }}>
                  github.com/lingo-iitgn/eka-eval-demo
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {error && <ErrorBox msg={error} />}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryBtn onClick={handleNext} disabled={isDisabled} loading={isLoading}>Continue to Benchmarks</PrimaryBtn>
      </div>
    </motion.div>
  );
};

export default ModelSelection;