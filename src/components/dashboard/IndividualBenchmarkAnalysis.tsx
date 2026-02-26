// src/components/dashboard/IndividualBenchmarkAnalysis.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Brain, AlertCircle, CheckCircle2, XCircle,
  Sparkles, FileText, ChevronDown, Loader2, Target,
  TrendingUp, ThumbsUp, AlertTriangle,
} from 'lucide-react';

const F = '"Nunito", "Varela Round", sans-serif';
const C = {
  bg: '#f5f0e8', card: '#fdf9f4', ink: '#2c2416', muted: '#7a6e62', faint: '#b0a898',
  border: '#e0d8cc', borderMd: '#d0c8bc',
  sage: '#7a9e7e', sageLt: '#d4e8d6', sageBd: '#aed0b2', sageDeep: '#3d6b42', sagePill: '#eaf2eb',
  rose: '#c9867c', roseLt: '#f5dbd8', roseBd: '#ddb4ae', roseDeep: '#8f3d35', rosePill: '#faeeed',
  ochre: '#c9a96e', ochreLt: '#f5e8cc', ochreBd: '#e0c888', ochreDeep: '#7a5218', ochrePill: '#faf3e5',
  slate: '#6b7b8d', slateLt: '#d4dde8', slateBd: '#b0c0d0', slateDeep: '#3d5068', slatePill: '#edf1f5',
  mauve: '#a07ab8', mauveLt: '#e8d8f0', mauveBd: '#c8a8d8', mauveDeep: '#5c3a72', mauvePill: '#f4eef9',
  teal: '#7ab8b0', tealLt: '#d4ede8', tealBd: '#8ed4bc', tealDeep: '#2d6b62', tealPill: '#eaf7f4',
};

// ── API Keys ──────────────────────────────────────────────
const GROQ_API_KEY = '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';

const SPECIAL_CASE_MAPPINGS: Record<string, string> = {
  'indicmmlu-pro': 'IndicMMLU-Pro', 'indicmmlupro': 'IndicMMLU-Pro',
  'indicmmlu_pro': 'IndicMMLU-Pro', 'IndicMMLU-Pro': 'IndicMMLU-Pro',
  'flores': 'Flores', 'in22': 'IN22', 'piqa': 'piqa', 'PIQA': 'piqa',
};

interface DetailedResult {
  index?: number; question?: string; context?: string;
  prediction: string; ground_truths?: string[]; answer?: string;
  f1?: number; em?: number; is_correct?: boolean;
  goal?: string; sol1?: string; sol2?: string; label?: number;
  prediction_acc?: number; prediction_acc_norm?: number;
  is_correct_acc?: boolean; is_correct_acc_norm?: boolean; language?: string;
}

interface AnalysisData { summary: string; strengths: string[]; weaknesses: string[]; }
interface AnalysisProps { benchmarkName: string; modelName: string; onBack: () => void; }

// ── Metric pill ───────────────────────────────────────────
const MetricPill: React.FC<{ label: string; value: string; bg: string; border: string; text: string; icon: React.ReactNode }> = ({ label, value, bg, border, text, icon }) => (
  <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div>
      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: text, opacity: 0.7, margin: '0 0 5px', fontFamily: F }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: text, margin: 0, fontFamily: F }}>{value}</p>
    </div>
    <div style={{ color: text, opacity: 0.5 }}>{icon}</div>
  </div>
);

// ── Main component ────────────────────────────────────────
const IndividualBenchmarkAnalysis: React.FC<AnalysisProps> = ({ benchmarkName, modelName, onBack }) => {
  const [results, setResults] = useState<DetailedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const [overallAnalysis, setOverallAnalysis] = useState<AnalysisData | null>(null);
  const [rawFallback, setRawFallback] = useState<string | null>(null);
  const [analyzingOverall, setAnalyzingOverall] = useState(false);
  const [questionAnalyses, setQuestionAnalyses] = useState<Record<number, string>>({});
  const [analyzingQuestion, setAnalyzingQuestion] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  const getApiBase = () => {
    if (window.location.hostname.includes('lingo.iitgn.ac.in')) return 'https://lingo.iitgn.ac.in/eka-eval/api';
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:8000');
    return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
  };

  const addLog = (msg: string) => { console.log(`[Analysis] ${msg}`); setDebugLog(p => [...p, msg]); };

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null); setDebugLog([]);
      const base = getApiBase();
      addLog(`Fetching: ${modelName} / ${benchmarkName}`);
      const mapped = SPECIAL_CASE_MAPPINGS[benchmarkName] || SPECIAL_CASE_MAPPINGS[benchmarkName.toLowerCase()];
      const names = [mapped, benchmarkName.toLowerCase(), benchmarkName].filter((n, i, s) => n && s.indexOf(n) === i);
      let data: DetailedResult[] | null = null;
      for (const name of names) {
        if (!name) continue;
        try {
          const url = `${base}/v1/results/detailed/${encodeURIComponent(modelName)}/${encodeURIComponent(name)}`;
          addLog(`Trying: ${url}`);
          const res = await fetch(url);
          if (res.ok) {
            const raw = await res.json();
            const list = Array.isArray(raw) ? raw : (raw?.detailed_results || raw?.results || []);
            if (list.length) { data = list; addLog(`✅ ${list.length} results loaded.`); break; }
          }
        } catch (e: any) { addLog(`Error: ${e.message}`); }
      }
      data ? setResults(data) : setError('Could not load results. See debug log.');
      setLoading(false);
    };
    load();
  }, [benchmarkName, modelName]);

  const stats = useMemo(() => {
    if (!results.length) return { acc: 0, correct: 0, total: 0 };
    const isPiqa = 'goal' in results[0];
    const correct = results.filter(r => isPiqa ? r.is_correct_acc_norm === true : (r.em === 1 || r.is_correct === true)).length;
    return { acc: (correct / results.length) * 100, correct, total: results.length };
  }, [results]);

  const callGroq = async (prompt: string, json = false): Promise<string> => {
    if (!GROQ_API_KEY) return json ? '{"summary":"No API key","strengths":[],"weaknesses":[]}' : 'No API key.';
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5, max_tokens: 1000,
          response_format: json ? { type: 'json_object' } : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Groq ${res.status}`);
      const d = await res.json();
      return d.choices?.[0]?.message?.content || '';
    } catch (e: any) { return json ? `{"summary":"Error: ${e.message}","strengths":[],"weaknesses":[]}` : `Failed: ${e.message}`; }
  };

  const generateOverall = async () => {
    setAnalyzingOverall(true); setOverallAnalysis(null); setRawFallback(null);
    const sample = results.slice(0, 5).map(r => ({ q: r.question || r.goal, pred: r.prediction || r.prediction_acc_norm, ok: r.is_correct || r.is_correct_acc_norm }));
    const resp = await callGroq(`Analyze ${modelName} on ${benchmarkName}. Accuracy: ${stats.acc.toFixed(2)}%. Sample: ${JSON.stringify(sample)}\n\nRespond ONLY with JSON:\n{"summary":"...","strengths":["..."],"weaknesses":["..."]}`, true);
    try { const p = JSON.parse(resp); if (p.summary) setOverallAnalysis(p); else setRawFallback(resp); }
    catch { setRawFallback(resp); }
    setAnalyzingOverall(false);
  };

  const analyzeQuestion = async (idx: number) => {
    setAnalyzingQuestion(idx);
    const r = results[idx];
    const resp = await callGroq(`Question: "${r.question || r.goal}"\nTruth: "${r.ground_truths?.[0] || r.label}"\nPrediction: "${r.prediction || r.prediction_acc_norm}"\nBriefly explain why model succeeded or failed.`);
    setQuestionAnalyses(p => ({ ...p, [idx]: resp }));
    setSelectedQuestion(idx);
    setAnalyzingQuestion(null);
  };

  // ── Loading ────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: F }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 52, height: 52, borderRadius: 16, background: C.mauvePill, border: `1.5px solid ${C.mauveBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={22} color={C.mauve} />
      </motion.div>
      <p style={{ color: C.muted, fontWeight: 700, fontSize: 14 }}>Loading detailed results…</p>
    </div>
  );

  // ── Error ──────────────────────────────────────────────
  if (error) return (
    <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, fontFamily: F }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: C.rosePill, border: `1.5px solid ${C.roseBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={28} color={C.roseDeep} />
      </div>
      <h2 style={{ fontWeight: 800, fontSize: 22, color: C.ink, margin: 0 }}>Data Not Found</h2>
      <div style={{ width: '100%', maxWidth: 560, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, fontFamily: 'monospace', fontSize: 11, color: C.muted, maxHeight: 200, overflowY: 'auto' }}>
        {debugLog.map((l, i) => <div key={i} style={{ marginBottom: 4 }}>{l}</div>)}
      </div>
      <motion.button onClick={onBack}
        style={{ padding: '11px 24px', borderRadius: 12, background: '#2c2416', color: '#fdf9f4', fontFamily: F, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}
        whileHover={{ background: '#3d6b42' }}>
        Return to Dashboard
      </motion.button>
    </div>
  );

  // ── Main view ──────────────────────────────────────────
  return (
    <div style={{ fontFamily: F, background: C.bg, minHeight: '100vh' }}>

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: C.card, borderBottom: `1.5px solid ${C.border}`,
        padding: '16px 24px', backdropFilter: 'blur(8px)',
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <motion.button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 700 }}
            whileHover={{ color: C.ink }}>
            <ArrowLeft size={15} /> Back
          </motion.button>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontWeight: 800, fontSize: 20, color: C.ink, margin: 0 }}>{benchmarkName}</h1>
            <p style={{ fontSize: 11, color: C.faint, margin: '2px 0 0', fontFamily: 'monospace' }}>{modelName}</p>
          </div>

          {(!overallAnalysis && !rawFallback) ? (
            <motion.button onClick={generateOverall} disabled={analyzingOverall}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: analyzingOverall ? C.border : '#2c2416', color: analyzingOverall ? C.muted : '#fdf9f4', fontFamily: F, fontWeight: 800, fontSize: 12, border: 'none', cursor: analyzingOverall ? 'not-allowed' : 'pointer' }}
              whileHover={!analyzingOverall ? { background: '#3d6b42' } : {}}>
              {analyzingOverall ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {analyzingOverall ? 'Analyzing…' : 'Generate Report'}
            </motion.button>
          ) : <div style={{ width: 130 }} />}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 760, margin: '0 auto' }}>
          <MetricPill label="Accuracy" value={`${stats.acc.toFixed(1)}%`} bg={stats.acc >= 70 ? C.sagePill : C.rosePill} border={stats.acc >= 70 ? C.sageBd : C.roseBd} text={stats.acc >= 70 ? C.sageDeep : C.roseDeep} icon={<Target size={22} />} />
          <MetricPill label="Correct" value={`${stats.correct}/${stats.total}`} bg={C.slatePill} border={C.slateBd} text={C.slateDeep} icon={<CheckCircle2 size={22} />} />
          <MetricPill label="Error Rate" value={`${(100 - stats.acc).toFixed(1)}%`} bg={C.ochrePill} border={C.ochreBd} text={C.ochreDeep} icon={<AlertCircle size={22} />} />
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

        {/* ── AI Report ── */}
        <AnimatePresence>
          {(overallAnalysis || rawFallback) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>

              {/* Executive summary — full width */}
              <div style={{ gridColumn: '1 / -1', background: C.mauvePill, border: `1.5px solid ${C.mauveBd}`, borderRadius: 18, padding: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: C.mauveLt, opacity: 0.5 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <TrendingUp size={15} color={C.mauveDeep} />
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.mauve, margin: 0, fontFamily: F }}>Executive Summary</p>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: C.ink, margin: 0, fontFamily: F }}>
                  {overallAnalysis?.summary || rawFallback}
                </p>
              </div>

              {/* Strengths */}
              {overallAnalysis?.strengths?.length > 0 && (
                <div style={{ background: C.sagePill, border: `1.5px solid ${C.sageBd}`, borderRadius: 18, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <ThumbsUp size={14} color={C.sageDeep} />
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sage, margin: 0, fontFamily: F }}>Observed Strengths</p>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {overallAnalysis.strengths.map((s, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: C.ink, fontFamily: F }}>
                        <CheckCircle2 size={15} color={C.sage} style={{ flexShrink: 0, marginTop: 1 }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {overallAnalysis?.weaknesses?.length > 0 && (
                <div style={{ background: C.rosePill, border: `1.5px solid ${C.roseBd}`, borderRadius: 18, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <AlertTriangle size={14} color={C.roseDeep} />
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.rose, margin: 0, fontFamily: F }}>Potential Weaknesses</p>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {overallAnalysis.weaknesses.map((w, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: C.ink, fontFamily: F }}>
                        <XCircle size={15} color={C.rose} style={{ flexShrink: 0, marginTop: 1 }} />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results list ── */}
        <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
          {/* List header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 20px', background: C.bg, borderBottom: `1px solid ${C.border}`,
            position: 'sticky', top: 0, zIndex: 5,
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.faint, margin: 0, fontFamily: F }}>
              Detailed Response Breakdown
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.faint, margin: 0, fontFamily: F }}>{results.length} items</p>
          </div>

          {results.map((item, idx) => {
            const isPiqa = 'goal' in item;
            const questionText = isPiqa ? item.goal : item.question;
            const isCorrect = isPiqa ? item.is_correct_acc_norm === true : (item.em === 1 || item.is_correct === true);
            const answerText = isPiqa ? (item.label === 0 ? item.sol1 : item.sol2) : (item.ground_truths?.[0] || item.answer);
            const predText = isPiqa ? (item.prediction_acc_norm === 0 ? item.sol1 : item.sol2) : item.prediction;
            const isOpen = selectedQuestion === idx;

            return (
              <div key={idx} style={{ borderBottom: idx < results.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                {/* Row */}
                <motion.button
                  onClick={() => setSelectedQuestion(isOpen ? null : idx)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 20px',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: F,
                  }}
                  whileHover={{ background: C.bg }}>

                  {/* Status icon */}
                  <div style={{ flexShrink: 0, marginTop: 1 }}>
                    {isCorrect
                      ? <CheckCircle2 size={18} color={C.sageDeep} />
                      : <XCircle size={18} color={C.roseDeep} />}
                  </div>

                  {/* Question text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: C.faint }}>#{idx + 1}</span>
                      {item.language && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: C.mauvePill, border: `1px solid ${C.mauveBd}`, color: C.mauveDeep, fontFamily: F }}>
                          {item.language}
                        </span>
                      )}
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '1px 8px', borderRadius: 999,
                        background: isCorrect ? C.sagePill : C.rosePill,
                        border: `1px solid ${isCorrect ? C.sageBd : C.roseBd}`,
                        color: isCorrect ? C.sageDeep : C.roseDeep, fontFamily: F,
                      }}>
                        {isCorrect ? '✓ Correct' : '✗ Wrong'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: isOpen ? C.ink : C.muted, margin: 0, fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isOpen ? 'normal' : 'nowrap' }}>
                      {questionText}
                    </p>
                  </div>

                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
                    <ChevronDown size={16} color={C.faint} />
                  </motion.div>
                </motion.button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', borderTop: `1px solid ${C.border}` }}>
                      <div style={{ padding: 20, background: `${C.bg}88` }}>

                        {/* PIQA options */}
                        {isPiqa && (
                          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.faint, margin: '0 0 10px', fontFamily: F }}>Options</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              {[{ label: 'Option 1', text: item.sol1, correct: item.label === 0 },
                                { label: 'Option 2', text: item.sol2, correct: item.label === 1 }].map(opt => (
                                <div key={opt.label} style={{ padding: '10px 14px', borderRadius: 12, background: opt.correct ? C.sagePill : C.bg, border: `1px solid ${opt.correct ? C.sageBd : C.border}` }}>
                                  <p style={{ fontSize: 10, fontWeight: 800, color: opt.correct ? C.sageDeep : C.faint, margin: '0 0 4px', fontFamily: F }}>{opt.label}</p>
                                  <p style={{ fontSize: 13, color: C.ink, margin: 0, fontFamily: F }}>{opt.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ground truth / prediction grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                          <div style={{ padding: '14px 16px', borderRadius: 14, background: C.sagePill, border: `1px solid ${C.sageBd}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <FileText size={13} color={C.sageDeep} />
                              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.sage, margin: 0, fontFamily: F }}>Ground Truth</p>
                            </div>
                            <p style={{ fontSize: 13, color: C.ink, margin: 0, fontFamily: F, lineHeight: 1.6 }}>{answerText}</p>
                          </div>
                          <div style={{ padding: '14px 16px', borderRadius: 14, background: isCorrect ? C.tealPill : C.rosePill, border: `1px solid ${isCorrect ? C.tealBd : C.roseBd}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <Target size={13} color={isCorrect ? C.tealDeep : C.roseDeep} />
                              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: isCorrect ? C.teal : C.rose, margin: 0, fontFamily: F }}>Model Prediction</p>
                            </div>
                            <p style={{ fontSize: 13, color: C.ink, margin: 0, fontFamily: F, lineHeight: 1.6 }}>{predText}</p>
                          </div>
                        </div>

                        {/* AI explanation */}
                        {questionAnalyses[idx] ? (
                          <div style={{ padding: '14px 16px', borderRadius: 14, background: C.mauvePill, border: `1px solid ${C.mauveBd}`, borderLeft: `3px solid ${C.mauve}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <Brain size={13} color={C.mauveDeep} />
                              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.mauve, margin: 0, fontFamily: F }}>AI Analysis</p>
                            </div>
                            <p style={{ fontSize: 13, color: C.ink, margin: 0, fontFamily: F, lineHeight: 1.6 }}>{questionAnalyses[idx]}</p>
                          </div>
                        ) : (
                          <motion.button
                            onClick={() => analyzeQuestion(idx)}
                            disabled={analyzingQuestion === idx}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 7,
                              padding: '7px 14px', borderRadius: 10,
                              background: C.mauvePill, border: `1px solid ${C.mauveBd}`,
                              color: C.mauveDeep, fontFamily: F, fontWeight: 700, fontSize: 12,
                              cursor: analyzingQuestion === idx ? 'not-allowed' : 'pointer',
                              opacity: analyzingQuestion === idx ? 0.6 : 1,
                            }}
                            whileHover={analyzingQuestion !== idx ? { background: C.mauveLt } : {}}>
                            {analyzingQuestion === idx
                              ? <><Loader2 size={12} className="animate-spin" /> Analyzing…</>
                              : <><Sparkles size={12} /> Explain this result</>}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default IndividualBenchmarkAnalysis;