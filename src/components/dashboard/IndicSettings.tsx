// src/components/dashboard/IndicSettings.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const F = '"Nunito", "Varela Round", sans-serif';
const C = {
  bg: '#f5f0e8', card: '#fdf9f4', ink: '#2c2416', muted: '#7a6e62', faint: '#b0a898',
  border: '#e0d8cc',
  sage: '#7a9e7e', sageLt: '#d4e8d6', sageBd: '#aed0b2', sageDeep: '#3d6b42', sagePill: '#eaf2eb',
  rose: '#c9867c', roseLt: '#f5dbd8', roseBd: '#ddb4ae', roseDeep: '#8f3d35', rosePill: '#faeeed',
  ochre: '#c9a96e', ochreLt: '#f5e8cc', ochreBd: '#e0c888', ochreDeep: '#7a5218', ochrePill: '#faf3e5',
  slate: '#6b7b8d', slateLt: '#d4dde8', slateBd: '#b0c0d0', slateDeep: '#3d5068', slatePill: '#edf1f5',
  mauve: '#a07ab8', mauveLt: '#e8d8f0', mauveBd: '#c8a8d8', mauveDeep: '#5c3a72', mauvePill: '#f4eef9',
  teal: '#7ab8b0', tealLt: '#d4ede8', tealBd: '#8ed4bc', tealDeep: '#2d6b62', tealPill: '#eaf7f4',
};

// Language display names — ISO codes mapped to readable labels
const LANG_LABELS: Record<string, string> = {
  hi: 'Hindi', bn: 'Bengali', te: 'Telugu', mr: 'Marathi', ta: 'Tamil',
  gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi', ur: 'Urdu',
  or: 'Odia', as: 'Assamese', mai: 'Maithili', sa: 'Sanskrit', ne: 'Nepali',
  si: 'Sinhala', my: 'Burmese', km: 'Khmer', lo: 'Lao', th: 'Thai',
  en: 'English',
};

// Cycling accent colors per language chip
const CHIP_ACCENTS = [
  { bg: C.sageLt, border: C.sageBd, text: C.sageDeep, activeBg: C.sage },
  { bg: C.slateLt, border: C.slateBd, text: C.slateDeep, activeBg: C.slate },
  { bg: C.mauveLt, border: C.mauveBd, text: C.mauveDeep, activeBg: C.mauve },
  { bg: C.tealLt, border: C.tealBd, text: C.tealDeep, activeBg: C.teal },
  { bg: C.ochreLt, border: C.ochreBd, text: C.ochreDeep, activeBg: C.ochre },
  { bg: C.roseLt, border: C.roseBd, text: C.roseDeep, activeBg: C.rose },
];

interface IndicSettingsProps {
  benchmarkId: string;
  selectedLanguages: string[];
  onLanguageChange: (languages: string[]) => void;
}

const IndicSettings: React.FC<IndicSettingsProps> = ({
  benchmarkId, selectedLanguages, onLanguageChange,
}) => {
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLangs = async () => {
      setIsLoading(true); setError(null);
      try {
        const res = await fetch(`https://10.0.62.205:8001/api/v1/benchmark-languages/${benchmarkId}`);
        if (!res.ok) throw new Error('Could not fetch language options.');
        const data = await res.json();
        const langs: string[] = data.languages || [];
        setAvailableLangs(langs);
        if (langs.length && selectedLanguages.length === 0) onLanguageChange(langs);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLangs();
  }, [benchmarkId]);

  const toggle = (lang: string) => {
    onLanguageChange(
      selectedLanguages.includes(lang)
        ? selectedLanguages.filter(l => l !== lang)
        : [...selectedLanguages, lang]
    );
  };

  const toggleAll = () => {
    onLanguageChange(
      selectedLanguages.length === availableLangs.length ? [] : availableLangs
    );
  };

  const allSelected = selectedLanguages.length === availableLangs.length;

  // ── Loading ────────────────────────────────────────────
  if (isLoading) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0', color: C.muted, fontFamily: F, fontSize: 13 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: C.mauvePill, border: `1px solid ${C.mauveBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={14} color={C.mauve} className="animate-spin" />
      </div>
      Loading language options…
    </motion.div>
  );

  // ── Error ──────────────────────────────────────────────
  if (error) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: C.rosePill, border: `1px solid ${C.roseBd}`, fontFamily: F, fontSize: 13, color: C.roseDeep }}>
      <AlertCircle size={14} style={{ flexShrink: 0 }} />
      {error}
    </motion.div>
  );

  // ── Empty ──────────────────────────────────────────────
  if (!availableLangs.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ paddingTop: 24, borderTop: `1px solid ${C.border}`, marginTop: 8 }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.sageLt, border: `1px solid ${C.sageBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Languages size={15} color={C.sageDeep} />
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sage, margin: 0, fontFamily: F }}>
            Indic Languages
          </p>
          <h4 style={{ fontWeight: 800, fontSize: 15, color: C.ink, margin: 0, fontFamily: F }}>
            Language Selection for{' '}
            <span style={{ color: C.sageDeep }}>{benchmarkId}</span>
          </h4>
        </div>
      </div>

      {/* Selection summary pill */}
      {selectedLanguages.length > 0 && (
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={14} color={C.sageDeep} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.sageDeep, fontFamily: F }}>
            {selectedLanguages.length} / {availableLangs.length} language{selectedLanguages.length !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      {/* Language chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>

        {/* Select / Deselect All */}
        <motion.button
          onClick={toggleAll}
          style={{
            padding: '7px 16px', borderRadius: 999, fontSize: 12, fontWeight: 800,
            fontFamily: F, cursor: 'pointer', transition: 'all 0.15s',
            background: allSelected ? '#2c2416' : C.card,
            border: `1.5px solid ${allSelected ? '#2c2416' : C.border}`,
            color: allSelected ? '#fdf9f4' : C.muted,
          }}
          whileHover={{ background: allSelected ? '#3d6b42' : C.bg }}
          whileTap={{ scale: 0.96 }}>
          {allSelected ? '✓ All selected' : 'Select all'}
        </motion.button>

        {availableLangs.map((lang, i) => {
          const acc = CHIP_ACCENTS[i % CHIP_ACCENTS.length];
          const isSel = selectedLanguages.includes(lang);
          const label = LANG_LABELS[lang] || lang.toUpperCase();

          return (
            <motion.button
              key={lang}
              onClick={() => toggle(lang)}
              style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                fontFamily: F, cursor: 'pointer', transition: 'all 0.15s',
                background: isSel ? acc.bg : C.card,
                border: `1.5px solid ${isSel ? acc.border : C.border}`,
                color: isSel ? acc.text : C.muted,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              whileHover={{ borderColor: acc.border, background: acc.bg, color: acc.text }}
              whileTap={{ scale: 0.95 }}>

              {/* Checkmark dot */}
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: isSel ? acc.activeBg : C.border,
                transition: 'background 0.15s',
              }} />
              {label}
            </motion.button>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: C.faint, marginTop: 12, fontFamily: F }}>
        Select one or more languages to run this benchmark on. Scores will be averaged across selected languages.
      </p>
    </motion.div>
  );
};

export default IndicSettings;