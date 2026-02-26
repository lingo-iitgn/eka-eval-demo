// src/components/dashboard/BenchmarkSelection.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { BenchmarkCategory } from '../../types';

const F = '"Nunito", "Varela Round", sans-serif';
const C = {
  bg: '#f5f0e8', card: '#fdf9f4', ink: '#2c2416', muted: '#7a6e62', faint: '#b0a898', border: '#e0d8cc', borderMd: '#d0c8bc',
  sage: '#7a9e7e', sageLt: '#d4e8d6', sageBd: '#aed0b2', sageDeep: '#3d6b42', sagePill: '#eaf2eb',
  rose: '#c9867c', roseLt: '#f5dbd8', roseBd: '#ddb4ae', roseDeep: '#8f3d35', rosePill: '#faeeed',
  ochre: '#c9a96e', ochreLt: '#f5e8cc', ochreBd: '#e0c888', ochreDeep: '#7a5218', ochrePill: '#faf3e5',
  slate: '#6b7b8d', slateLt: '#d4dde8', slateBd: '#b0c0d0', slateDeep: '#3d5068', slatePill: '#edf1f5',
  mauve: '#a07ab8', mauveLt: '#e8d8f0', mauveBd: '#c8a8d8', mauveDeep: '#5c3a72', mauvePill: '#f4eef9',
  teal: '#7ab8b0', tealLt: '#d4ede8', tealBd: '#8ed4bc', tealDeep: '#2d6b62', tealPill: '#eaf7f4',
};

const ACCENTS = [
  { bg: C.sageLt, border: C.sageBd, text: C.sageDeep, pill: C.sagePill, dot: C.sage },
  { bg: C.slateLt, border: C.slateBd, text: C.slateDeep, pill: C.slatePill, dot: C.slate },
  { bg: C.roseLt, border: C.roseBd, text: C.roseDeep, pill: C.rosePill, dot: C.rose },
  { bg: C.mauveLt, border: C.mauveBd, text: C.mauveDeep, pill: C.mauvePill, dot: C.mauve },
  { bg: C.ochreLt, border: C.ochreBd, text: C.ochreDeep, pill: C.ochrePill, dot: C.ochre },
  { bg: C.tealLt, border: C.tealBd, text: C.tealDeep, pill: C.tealPill, dot: C.teal },
];

interface BenchmarkSelectionProps {
  onNext: (benchmarks: string[]) => void;
  onBack: () => void;
}

const BenchmarkSelection: React.FC<BenchmarkSelectionProps> = ({ onNext, onBack }) => {
  const [benchmarkCategories, setBenchmarkCategories] = useState<BenchmarkCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      setIsLoading(true); setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/benchmarks`);
        if (!res.ok) throw new Error('Failed to fetch benchmarks from the server.');
        const data: BenchmarkCategory[] = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid data format received from server.');
        setBenchmarkCategories(data);
        if (data.length > 0) setExpandedCategories([data[0].id]);
      } catch (err) { setError((err as Error).message); }
      finally { setIsLoading(false); }
    };
    fetchBenchmarks();
  }, []);

  const toggleCategory = (id: string) =>
    setExpandedCategories(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleBenchmark = (id: string) =>
    setSelectedBenchmarks(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAllInCategory = (categoryId: string) => {
    const cat = benchmarkCategories.find(c => c.id === categoryId);
    if (!cat) return;
    const ids = cat.benchmarks.map(b => b.id);
    const allSel = ids.every(id => selectedBenchmarks.includes(id));
    setSelectedBenchmarks(p => allSel ? p.filter(id => !ids.includes(id)) : [...new Set([...p, ...ids])]);
  };

  const uniqueCatCount = new Set(selectedBenchmarks.map(b =>
    benchmarkCategories.find(c => c.benchmarks.some(bm => bm.id === b))?.id).filter(Boolean)).size;

  // ── Loading state
  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16, fontFamily: F }}>
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
        style={{ width: 56, height: 56, borderRadius: 16, background: C.sagePill, border: `1.5px solid ${C.sageBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} color={C.sage} className="animate-spin" />
      </motion.div>
      <p style={{ color: C.muted, fontWeight: 700, fontSize: 14 }}>Loading benchmarks…</p>
    </div>
  );

  // ── Error state
  if (error || (!isLoading && benchmarkCategories.length === 0)) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 14, borderRadius: 18, background: C.ochrePill, border: `1.5px solid ${C.ochreBd}`, padding: 32, fontFamily: F }}>
      <AlertTriangle size={32} color={C.ochre} />
      <p style={{ fontWeight: 800, fontSize: 17, color: C.ochreDeep, margin: 0 }}>
        {benchmarkCategories.length === 0 ? 'No benchmarks found' : 'Failed to load benchmarks'}
      </p>
      <p style={{ fontSize: 13, color: C.ochreDeep, margin: 0 }}>{error || 'The server responded, but the benchmark list is empty.'}</p>
    </div>
  );

  return (
    <div style={{ fontFamily: F }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 36 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.sage, marginBottom: 8 }}>Step 2</p>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: C.ink, margin: '0 0 6px' }}>Select Benchmarks</h2>
        <p style={{ fontSize: 14, color: C.muted }}>Choose which evaluations to run on your model</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Left: categories */}
        <div style={{ gridColumn: '1 / 3', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {benchmarkCategories.map((category, index) => {
            const acc = ACCENTS[index % ACCENTS.length];
            const isExpanded = expandedCategories.includes(category.id);
            const selCount = category.benchmarks.filter(b => selectedBenchmarks.includes(b.id)).length;
            const allSel = selCount === category.benchmarks.length && category.benchmarks.length > 0;

            return (
              <motion.div key={category.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ borderRadius: 16, overflow: 'hidden', background: C.card, border: `1.5px solid ${isExpanded ? acc.border : C.border}`, boxShadow: isExpanded ? `0 4px 16px ${acc.bg}88` : 'none', transition: 'all 0.2s' }}>

                {/* Category header */}
                <div onClick={() => toggleCategory(category.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: acc.bg, border: `1px solid ${acc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: acc.dot }} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: 14, color: C.ink, margin: '0 0 2px' }}>{category.name}</h3>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{category.description}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selCount > 0 && (
                      <span style={{ background: acc.bg, border: `1px solid ${acc.border}`, color: acc.text, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 800 }}>
                        {selCount}/{category.benchmarks.length}
                      </span>
                    )}
                    {selCount === 0 && <span style={{ fontSize: 11, color: C.faint }}>{category.benchmarks.length} tasks</span>}
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight size={16} color={C.muted} />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', borderTop: `1px solid ${acc.border}66` }}>

                      {/* Select all */}
                      <button onClick={() => toggleAllInCategory(category.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', background: `${acc.bg}88`, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 11, fontWeight: 800, color: acc.text }}>
                        <div style={{ width: 16, height: 16, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: allSel ? acc.dot : 'transparent', border: `1.5px solid ${acc.dot}` }}>
                          {allSel && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        {allSel ? 'Deselect all' : `Select all (${category.benchmarks.length})`}
                      </button>

                      {category.benchmarks.map((bm) => {
                        const isSel = selectedBenchmarks.includes(bm.id);
                        return (
                          <motion.div key={bm.id}
                            onClick={() => toggleBenchmark(bm.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer', borderTop: `1px solid ${C.border}44`, background: isSel ? `${acc.bg}55` : 'transparent' }}
                            whileHover={{ background: `${acc.bg}88` }}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSel ? acc.dot : 'transparent', border: `1.5px solid ${isSel ? acc.dot : C.borderMd}` }}>
                              {isSel && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 13, color: C.ink, margin: '0 0 2px' }}>{bm.name}</p>
                              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{bm.description}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Right: summary */}
        <div>
          <div style={{ position: 'sticky', top: 96, background: C.card, border: `1.5px solid ${C.mauveBd}`, borderRadius: 18, padding: 22, boxShadow: `0 4px 20px ${C.mauveLt}88` }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.mauve, marginBottom: 16 }}>Selection</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              {[{ label: 'Categories', value: uniqueCatCount, color: C.sageDeep, bg: C.sagePill, border: C.sageBd },
                { label: 'Benchmarks', value: selectedBenchmarks.length, color: C.mauveDeep, bg: C.mauvePill, border: C.mauveBd }
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: C.muted }}>{s.label}</span>
                  <span style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

            <motion.button onClick={() => setShowCustomModal(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: C.mauvePill, border: `1.5px solid ${C.mauveBd}`, color: C.mauveDeep, fontFamily: F, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
              whileHover={{ background: C.mauveLt }}>
              <Upload size={13} /> Upload Custom
            </motion.button>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
        <motion.button onClick={onBack}
          style={{ padding: '10px 20px', borderRadius: 12, background: C.card, border: `1.5px solid ${C.border}`, color: C.muted, fontFamily: F, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          whileHover={{ color: C.ink, borderColor: C.ochre }}>
          ← Back
        </motion.button>
        <motion.button onClick={() => onNext(selectedBenchmarks)} disabled={selectedBenchmarks.length === 0}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 14, background: selectedBenchmarks.length === 0 ? '#d0c8bc' : '#2c2416', color: '#fdf9f4', fontFamily: F, fontWeight: 800, fontSize: 14, border: 'none', cursor: selectedBenchmarks.length === 0 ? 'not-allowed' : 'pointer' }}
          whileHover={selectedBenchmarks.length > 0 ? { background: '#3d6b42', y: -1 } : {}}>
          Continue ({selectedBenchmarks.length}) →
        </motion.button>
      </div>

      {/* Custom upload modal */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,22,0.45)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setShowCustomModal(false)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 440, background: C.card, border: `1.5px solid ${C.mauveBd}`, borderRadius: 20, padding: 32 }}>
              <h3 style={{ fontWeight: 800, fontSize: 20, color: C.ink, margin: '0 0 8px', fontFamily: F }}>Upload Custom Benchmark</h3>
              <p style={{ fontSize: 13, color: C.muted, fontFamily: F, marginBottom: 24 }}>Drag and drop your evaluation file, or click to browse.</p>
              <div style={{ border: `2px dashed ${C.mauveBd}`, borderRadius: 16, padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: C.mauve, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = C.mauvePill; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                <Upload size={32} />
                <p style={{ fontSize: 13, fontWeight: 700, fontFamily: F, margin: 0 }}>Drop file or click to upload</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <motion.button onClick={() => setShowCustomModal(false)}
                  style={{ padding: '9px 18px', borderRadius: 12, background: C.bg, border: `1.5px solid ${C.border}`, color: C.muted, fontFamily: F, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  whileHover={{ color: C.ink }}>
                  Cancel
                </motion.button>
                <motion.button
                  style={{ padding: '9px 18px', borderRadius: 12, background: '#2c2416', color: '#fdf9f4', fontFamily: F, fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer' }}
                  whileHover={{ background: '#3d6b42' }}>
                  Upload
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BenchmarkSelection;