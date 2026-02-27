// src/components/dashboard/ResultsDisplay.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Award, Download, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList,
} from 'recharts';

const F = '"Nunito", "Varela Round", sans-serif';
const C = {
  bg: '#f5f0e8', card: '#fdf9f4', ink: '#2c2416', muted: '#7a6e62', faint: '#b0a898', border: '#e0d8cc',
  sage: '#6b9ab8', sageLt: '#d4e5f2', sageBd: '#a8c5de', sageDeep: '#2d5a78', sagePill: '#eaf3fa',
  rose: '#c9867c', roseLt: '#f5dbd8', roseBd: '#ddb4ae', roseDeep: '#8f3d35', rosePill: '#faeeed',
  ochre: '#c9a96e', ochreLt: '#f5e8cc', ochreBd: '#e0c888', ochreDeep: '#7a5218', ochrePill: '#faf3e5',
  slate: '#6b7b8d', slateLt: '#d4dde8', slateBd: '#b0c0d0', slateDeep: '#3d5068', slatePill: '#edf1f5',
  mauve: '#a07ab8', mauveLt: '#e8d8f0', mauveBd: '#c8a8d8', mauveDeep: '#5c3a72', mauvePill: '#f4eef9',
  teal: '#7ab8b0', tealLt: '#d4ede8', tealBd: '#8ed4bc', tealDeep: '#2d6b62', tealPill: '#eaf7f4',
};

const BAR_COLORS = [C.sage, C.teal, C.slate, C.mauve, C.ochre, C.rose, C.sageDeep, C.tealDeep];

const scoreStyle = (s: number | null) => {
  if (s == null) return { color: C.faint, bg: C.bg };
  if (s >= 85) return { color: C.sageDeep, bg: C.sagePill };
  if (s >= 70) return { color: C.tealDeep, bg: C.tealPill };
  if (s >= 55) return { color: C.ochreDeep, bg: C.ochrePill };
  return { color: C.roseDeep, bg: C.rosePill };
};

const WarmTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.ochreBd}`, borderRadius: 12, padding: '10px 14px', fontFamily: F }}>
      <p style={{ fontWeight: 700, color: C.ochre, fontSize: 12, marginBottom: 3 }}>{label}</p>
      <p style={{ fontWeight: 800, color: C.ink, fontSize: 15, margin: 0 }}>{Number(payload[0].value).toFixed(1)}%</p>
    </div>
  );
};

const BarLabel = ({ x, y, width, value }: any) => (
  <text x={x + width / 2} y={y - 7} textAnchor="middle" fontSize={11} fontWeight="800" fontFamily={F} fill={C.muted}>
    {Number(value).toFixed(1)}
  </text>
);

const ResultsDisplay: React.FC<{ finalResults: any }> = ({ finalResults }) => {
  const navigate = useNavigate();

  const downloadCSV = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/results/download`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'evaluation_results.csv';
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch (err) { console.error('Failed to download CSV:', err); }
  };

  if (!finalResults?.found) return (
    <div style={{ textAlign: 'center', color: C.muted, fontFamily: F, padding: 40 }}>Could not load final results.</div>
  );

  // Flatten all benchmarks for chart
  const chartData = finalResults.results.flatMap((tr: any) =>
    tr.benchmarks.map((bm: any) => ({ name: bm.name, score: bm.score ?? 0 }))
  );

  // Compute overall average
  const scores = chartData.map((d: any) => d.score).filter((s: number) => s > 0);
  const avg = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: F }}>

      {/* ── Celebration header ── */}
      <div style={{
        background: C.sagePill, border: `1.5px solid ${C.sageBd}`,
        borderRadius: 20, padding: '24px 28px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.sageLt, border: `1.5px solid ${C.sageBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} color={C.sageDeep} />
          </div>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 20, color: C.sageDeep, margin: '0 0 3px' }}>Evaluation Complete</h3>
            <p style={{ fontSize: 13, color: C.sage, margin: 0 }}>
              Results for <strong style={{ color: C.sageDeep }}>{finalResults.model}</strong>
            </p>
          </div>
        </div>
        <motion.button onClick={downloadCSV}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, background: C.card, border: `1.5px solid ${C.sageBd}`, color: C.sageDeep, fontFamily: F, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          whileHover={{ background: C.sageLt }}>
          <Download size={14} /> Export CSV
        </motion.button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Tasks Run', value: finalResults.results.length, bg: C.slatePill, border: C.slateBd, text: C.slateDeep },
          { label: 'Benchmarks', value: chartData.length, bg: C.ochrePill, border: C.ochreBd, text: C.ochreDeep },
          { label: 'Avg Score', value: avg ? `${avg.toFixed(1)}%` : '--', bg: C.mauvePill, border: C.mauveBd, text: C.mauveDeep },
        ].map(s => (
          <motion.div key={s.label} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: s.text, opacity: 0.7, margin: '0 0 3px' }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: s.text, margin: 0 }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Bar chart ── */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '20px 20px 8px', marginBottom: 20, height: 280 }}>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ochre, marginBottom: 12, fontFamily: F }}>Score Overview</p>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={chartData} margin={{ top: 24, right: 8, left: -24, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" stroke={C.faint} fontSize={10} fontFamily={F} angle={-30} textAnchor="end" interval={0} height={44} />
              <YAxis stroke={C.faint} fontSize={11} domain={[0, 100]} />
              <Tooltip content={<WarmTooltip />} cursor={{ fill: C.ochrePill }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="score" content={BarLabel} />
                {chartData.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Per-task results ── */}
      <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '20px 24px', marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.slate, marginBottom: 16, fontFamily: F }}>Detailed Results</p>
        {finalResults.results.map((tr: any, idx: number) => (
          <div key={idx} style={{ marginBottom: idx < finalResults.results.length - 1 ? 20 : 0 }}>
            {/* Task header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10, paddingBottom: 8,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: C.ink }}>{tr.task}</span>
              {tr.average !== undefined && (
                <span style={{
                  ...scoreStyle(tr.average),
                  fontWeight: 800, fontSize: 13,
                  padding: '3px 10px', borderRadius: 999,
                  fontFamily: F,
                }}>
                  {tr.average.toFixed(1)}% avg
                </span>
              )}
            </div>
            {/* Benchmarks grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {tr.benchmarks.map((bm: any, bi: number) => {
                const ss = scoreStyle(bm.score);
                return (
                  <div key={bi} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', borderRadius: 12,
                    background: C.bg, border: `1px solid ${C.border}`,
                    fontFamily: F,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{bm.name}</span>
                    <span style={{
                      fontWeight: 800, fontSize: 13, color: ss.color,
                      background: ss.bg, borderRadius: 8, padding: '1px 8px',
                    }}>
                      {bm.score != null ? `${bm.score.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <motion.button
        onClick={() => navigate('/leaderboard')}
        style={{
          width: '100%', padding: '14px 24px', borderRadius: 14,
          background: '#2c2416', color: '#fdf9f4',
          fontFamily: F, fontWeight: 800, fontSize: 15,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        whileHover={{ background: '#2d5a78' }}
        whileTap={{ scale: 0.98 }}>
        <TrendingUp size={16} /> View Full Leaderboard <ArrowRight size={16} />
      </motion.button>
    </motion.div>
  );
};

export default ResultsDisplay;