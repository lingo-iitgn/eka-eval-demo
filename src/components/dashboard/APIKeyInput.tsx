// src/components/dashboard/APIKeyInput.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldAlert, Key, ChevronDown, Loader2 } from 'lucide-react';

const F = '"Nunito", "Varela Round", sans-serif';
const C = {
  bg: '#f5f0e8', card: '#fdf9f4', ink: '#2c2416', muted: '#7a6e62', faint: '#b0a898', border: '#e0d8cc',
  sage: '#7a9e7e', sageLt: '#d4e8d6', sageBd: '#aed0b2', sageDeep: '#3d6b42', sagePill: '#eaf2eb',
  rose: '#c9867c', roseLt: '#f5dbd8', roseBd: '#ddb4ae', roseDeep: '#8f3d35', rosePill: '#faeeed',
  ochre: '#c9a96e', ochreLt: '#f5e8cc', ochreBd: '#e0c888', ochreDeep: '#7a5218', ochrePill: '#faf3e5',
  slate: '#6b7b8d', slateLt: '#d4dde8', slateBd: '#b0c0d0', slateDeep: '#3d5068', slatePill: '#edf1f5',
  mauve: '#a07ab8', mauveLt: '#e8d8f0', mauveBd: '#c8a8d8', mauveDeep: '#5c3a72', mauvePill: '#f4eef9',
};

interface Props {
  onBack: () => void;
  onConnect: (provider: string, model: string, key: string) => void;
}

const PROVIDERS = [
  { id: 'openai',  name: 'OpenAI',            emoji: '⚡', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],                     bg: C.sageLt,  border: C.sageBd,  text: C.sageDeep,  activeBg: C.sageLt },
  { id: 'gemini',  name: 'Google Gemini',      emoji: '✦',  models: ['gemini-1.5-pro', 'gemini-1.5-flash'],                         bg: C.slateLt, border: C.slateBd, text: C.slateDeep, activeBg: C.slateLt },
  { id: 'claude',  name: 'Anthropic Claude',   emoji: '◈',  models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],         bg: C.roseLt,  border: C.roseBd,  text: C.roseDeep,  activeBg: C.roseLt },
];

const SectionLabel: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.mauve }) => (
  <p style={{ fontFamily: F, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color, marginBottom: 8 }}>
    {children}
  </p>
);

const APIKeyInput: React.FC<Props> = ({ onBack, onConnect }) => {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  useEffect(() => {
    const def = PROVIDERS.find(p => p.id === provider)?.models[0];
    setModel(def || '');
  }, [provider]);

  const inputStyle = {
    background: C.bg, border: `1.5px solid ${C.border}`,
    color: C.ink, fontFamily: F, borderRadius: 12,
    padding: '12px 16px', width: '100%', fontSize: 14,
    outline: 'none', boxSizing: 'border-box' as const,
  };

  const activeProvider = PROVIDERS.find(p => p.id === provider)!;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ maxWidth: 680, margin: '0 auto', fontFamily: F }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
        <motion.button
          onClick={onBack}
          style={{
            padding: 8, borderRadius: 12,
            background: C.card, border: `1px solid ${C.border}`,
            color: C.muted, cursor: 'pointer', display: 'flex',
          }}
          whileHover={{ color: C.ink, borderColor: C.ochre }}
        >
          <ChevronLeft size={20} />
        </motion.button>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.slate, marginBottom: 2 }}>
            Step 1 · API Model
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.ink, margin: 0 }}>Connect via API</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Choose a provider and enter your temporary key</p>
        </div>
      </div>

      <div style={{ background: C.card, border: `1.5px solid ${activeProvider.border}`, borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Provider selection */}
        <div>
          <SectionLabel color={activeProvider.text}>Provider</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {PROVIDERS.map(p => (
              <motion.button
                key={p.id}
                onClick={() => setProvider(p.id)}
                style={{
                  padding: '16px 12px',
                  borderRadius: 14,
                  border: `1.5px solid ${provider === p.id ? p.border : C.border}`,
                  background: provider === p.id ? p.activeBg : C.bg,
                  color: provider === p.id ? p.text : C.muted,
                  fontFamily: F, fontWeight: 700, fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                whileHover={{ borderColor: p.border, background: p.activeBg, color: p.text }}
                whileTap={{ scale: 0.97 }}
              >
                <span style={{ fontSize: 22 }}>{p.emoji}</span>
                <span>{p.name}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Model select */}
        <div>
          <SectionLabel color={activeProvider.text}>Model</SectionLabel>
          <div style={{ position: 'relative' }}>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{ ...inputStyle, appearance: 'none', paddingRight: 40 }}
              onFocus={e => (e.target.style.borderColor = activeProvider.border)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            >
              {PROVIDERS.find(p => p.id === provider)?.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={16} color={C.muted} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* API key */}
        <div>
          <SectionLabel color={activeProvider.text}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Key size={12} style={{ display: 'inline' }} /> API Key
            </span>
          </SectionLabel>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter your API key…"
            style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 13 }}
            onFocus={e => (e.target.style.borderColor = activeProvider.border)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
        </div>

        {/* Security notice */}
        <div style={{
          display: 'flex', gap: 12, padding: 14, borderRadius: 12,
          background: C.ochrePill, border: `1px solid ${C.ochreBd}`,
        }}>
          <ShieldAlert size={16} color={C.ochreDeep} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: C.ochreDeep, fontFamily: F, margin: 0 }}>
            <strong>Security notice:</strong> Your key is used only to initialize the model and is not stored. Use a temporary key for safety.
          </p>
        </div>

        {/* Submit */}
        <motion.button
          onClick={() => onConnect(provider, model, apiKey)}
          disabled={!apiKey}
          style={{
            width: '100%', padding: '13px 24px', borderRadius: 14,
            background: apiKey ? '#2c2416' : '#d0c8bc',
            color: '#fdf9f4', fontFamily: F, fontWeight: 800, fontSize: 15,
            border: 'none', cursor: apiKey ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          whileHover={apiKey ? { background: '#3d6b42' } : {}}
          whileTap={apiKey ? { scale: 0.98 } : {}}
        >
          Connect Model →
        </motion.button>
      </div>
    </motion.div>
  );
};

export default APIKeyInput;