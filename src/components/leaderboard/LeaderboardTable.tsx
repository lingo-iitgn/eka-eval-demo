import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowUpDown, ExternalLink, Award, Download,
  RefreshCw, TrendingUp, Loader, AlertCircle, Play,
  Table, BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  CartesianGrid, Cell, LabelList,
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

interface ModelResult {
  name: string; size: string;
  scores: { [task: string]: { [benchmark: string]: number } };
  task_scores: { [task: string]: number };
  average_score: number | null;
}

const scoreColor = (s: number | null) => {
  if (s == null) return C.faint;
  if (s >= 85) return C.sageDeep;
  if (s >= 70) return C.tealDeep;
  if (s >= 55) return C.ochreDeep;
  return C.roseDeep;
};

const scoreBg = (s: number | null) => {
  if (s == null) return C.bg;
  if (s >= 85) return C.sagePill;
  if (s >= 70) return C.tealPill;
  if (s >= 55) return C.ochrePill;
  return C.rosePill;
};

// Tooltip shared
const WarmTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl text-sm"
      style={{ background: C.card, border: `1.5px solid ${C.border}`, fontFamily: F }}>
      <p className="font-bold mb-0.5" style={{ color: C.ochre }}>{label}</p>
      <p className="font-mono font-bold" style={{ color: C.ink }}>{payload[0].value}</p>
    </div>
  );
};

// Chart bar label
const BarLabel = ({ x, y, width, value }: any) => (
  <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fontWeight="700"
    fontFamily={F} fill={C.ink}>{Number(value).toFixed(1)}</text>
);

// ── Visualization Dashboard ────────────────────────────────
const VisualizationDashboard: React.FC<{
  selectedModel: ModelResult; allModels: ModelResult[]; onBack: () => void;
}> = ({ selectedModel, allModels, onBack }) => {
  const taskData = useMemo(() => Object.keys(selectedModel.task_scores).sort().map(n => ({
    name: n, score: parseFloat(selectedModel.task_scores[n].toFixed(1)),
  })), [selectedModel]);

  const radarData = useMemo(() => Object.keys(selectedModel.task_scores).sort().map(n => ({
    subject: n, score: parseFloat(selectedModel.task_scores[n].toFixed(1)), fullMark: 100,
  })), [selectedModel]);

  const compData = useMemo(() => allModels.map(m => ({
    name: m.name.split('/').pop(),
    score: m.average_score ?? 0,
    isUser: m.name === selectedModel.name,
  })).sort((a, b) => b.score - a.score), [allModels, selectedModel]);

  // Accent colors cycling for bars
  const BAR_COLORS = [C.sage, C.teal, C.slate, C.mauve, C.ochre, C.rose];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: C.sage, fontFamily: F }}>Visualizations</p>
          <h2 className="text-2xl font-extrabold" style={{ color: C.ink, fontFamily: F }}>
            {selectedModel.name.split('/').pop()}
          </h2>
        </div>
        <motion.button onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: C.card, border: `1.5px solid ${C.border}`, color: C.muted, fontFamily: F }}
          whileHover={{ color: C.ink }}>
          <Table size={14} /> Back to Table
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Task scores bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-6" style={{ background: C.card, border: `1.5px solid ${C.sageBd}`, height: 420 }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.sage, fontFamily: F }}>Task Scores</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={taskData} margin={{ top: 24, right: 8, left: -20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" stroke={C.muted} fontSize={10} fontFamily={F}
                angle={-40} textAnchor="end" interval={0} height={80} />
              <YAxis stroke={C.muted} fontSize={11} domain={[0, 100]} />
              <Tooltip content={<WarmTooltip />} cursor={{ fill: C.sagePill }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="score" content={BarLabel} />
                {taskData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-6" style={{ background: C.card, border: `1.5px solid ${C.mauveBd}`, height: 420 }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.mauve, fontFamily: F }}>Score Dimensions</p>
          <ResponsiveContainer width="100%" height="90%">
            <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="subject" fontSize={10} fontFamily={F} tick={{ fill: C.muted }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={C.border} fontSize={9} />
              <Radar name={selectedModel.name} dataKey="score" stroke={C.mauve}
                fill={C.mauveLt} fillOpacity={0.5} strokeWidth={2} />
              <Tooltip content={<WarmTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-6 lg:col-span-2" style={{ background: C.card, border: `1.5px solid ${C.ochreBd}`, height: 420 }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.ochre, fontFamily: F }}>Overall Score Comparison</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={compData} margin={{ top: 24, right: 8, left: -20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="name" stroke={C.muted} fontSize={10} fontFamily={F}
                angle={-30} textAnchor="end" interval={0} height={60} />
              <YAxis stroke={C.muted} fontSize={11} domain={[0, 100]} />
              <Tooltip content={<WarmTooltip />} cursor={{ fill: C.ochrePill }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} name="Overall Score">
                <LabelList dataKey="score" content={BarLabel} />
                {compData.map((entry, i) => (
                  <Cell key={i} fill={entry.isUser ? C.ochre : C.slateLt}
                    stroke={entry.isUser ? C.ochreBd : C.slateBd} strokeWidth={entry.isUser ? 2 : 0} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ── Leaderboard Table ──────────────────────────────────────
const LeaderboardTable: React.FC = () => {
  const [models, setModels] = useState<ModelResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'average_score'|'name'>('average_score');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  const [availableTasks, setAvailableTasks] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table'|'charts'>('table');
  const [selectedModel, setSelectedModel] = useState<ModelResult | null>(null);

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/results`);
      if (!res.ok) { if (res.status === 404) { setError('No results yet. Run an evaluation first!'); setModels([]); return; } throw new Error(`HTTP ${res.status}`); }
      const data = await res.json();
      setModels(data.models || []);
      setAvailableTasks((data.task_groups || []).sort());
      if (!data.models?.length) setError('No results found. Run some evaluations first!');
    } catch (err) { setError((err as Error).message); setModels([]); }
    finally { setLoading(false); }
  };

  const sorted = useMemo(() => {
    return [...models]
      .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const av = sortBy === 'name' ? a.name : (a.average_score ?? -1);
        const bv = sortBy === 'name' ? b.name : (b.average_score ?? -1);
        const o = sortOrder === 'asc' ? 1 : -1;
        return typeof av === 'string' ? av.localeCompare(bv as string) * o : (Number(av) - Number(bv)) * o;
      });
  }, [models, searchTerm, sortBy, sortOrder]);

  const handleSort = (col: typeof sortBy) => { if (sortBy === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortOrder('desc'); } };

  const downloadCSV = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/v1/results/download`);
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='evaluation_results.csv'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { alert('Failed to download CSV.'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80 gap-4" style={{ fontFamily: F }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
        style={{ background: C.ochrePill, border: `1.5px solid ${C.ochreBd}` }}>
        <Loader size={24} color={C.ochre} className="animate-spin" />
      </div>
      <p className="text-sm font-semibold" style={{ color: C.muted }}>Loading results…</p>
    </div>
  );

  if (error || !models.length) return (
    <div className="flex flex-col items-center justify-center h-80 gap-5 rounded-2xl p-10"
      style={{ background: C.card, border: `1.5px solid ${C.border}`, fontFamily: F }}>
      <AlertCircle size={36} color={C.ochre} />
      <div className="text-center">
        <p className="font-extrabold text-lg mb-1" style={{ color: C.ink }}>No results yet</p>
        <p className="text-sm" style={{ color: C.muted }}>{error || 'Run some evaluations to see results here.'}</p>
      </div>
      <div className="flex gap-3">
        <motion.button onClick={fetchResults}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: C.bg, border: `1.5px solid ${C.border}`, color: C.muted, fontFamily: F }}
          whileHover={{ color: C.ink }}>
          <RefreshCw size={14} /> Retry
        </motion.button>
        <motion.button onClick={() => window.location.href = '/dashboard/evaluate'}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: '#2c2416', color: '#f5f0e8', fontFamily: F }}
          whileHover={{ background: '#2d5a78' }}>
          <Play size={14} /> Run Evaluation
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex items-center justify-end flex-wrap gap-3">
          <AnimatePresence>
            {viewMode === 'table' && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-3" color={C.muted} />
                  <input type="text" placeholder="Search models…" value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2.5 text-sm focus:outline-none rounded-xl"
                    style={{ background: C.card, border: `1.5px solid ${C.border}`, color: C.ink, fontFamily: F, width: 220 }}
                    onFocus={e => (e.target.style.borderColor = C.ochreBd)}
                    onBlur={e => (e.target.style.borderColor = C.border)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.border}`, background: C.bg }}>
            {(['table', 'charts'] as const).map(mode => (
              <button key={mode} onClick={() => { if (mode === 'charts' && !selectedModel && models.length) setSelectedModel(models[0]); setViewMode(mode); }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all"
                style={{
                  background: viewMode === mode ? '#2c2416' : 'transparent',
                  color: viewMode === mode ? '#f5f0e8' : C.muted,
                  fontFamily: F,
                }}>
                {mode === 'table' ? <Table size={13} /> : <BarChart2 size={13} />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <motion.button onClick={fetchResults}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: C.card, border: `1.5px solid ${C.border}`, color: C.muted, fontFamily: F }}
            whileHover={{ color: C.ink }}>
            <RefreshCw size={14} /> Refresh
          </motion.button>

          <motion.button onClick={downloadCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: C.ochreLt, border: `1.5px solid ${C.ochreBd}`, color: C.ochreDeep, fontFamily: F }}
            whileHover={{ background: C.ochre, color: '#fdf9f4' }}>
            <Download size={14} /> Export CSV
          </motion.button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Models', value: models.length, bg: C.slatePill, border: C.slateBd, text: C.slateDeep, icon: <TrendingUp size={20} color={C.slate} /> },
          { label: 'Top Score', value: models.length ? Math.max(...models.map(m => m.average_score || 0)).toFixed(1) : '--', bg: C.ochrePill, border: C.ochreBd, text: C.ochreDeep, icon: <Award size={20} color={C.ochre} /> },
          { label: 'Task Groups', value: availableTasks.length, bg: C.sagePill, border: C.sageBd, text: C.sageDeep, icon: <ExternalLink size={20} color={C.sage} /> },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: s.text, opacity: 0.7, fontFamily: F }}>{s.label}</p>
              <p className="text-3xl font-extrabold" style={{ color: s.text, fontFamily: F }}>{s.value}</p>
            </div>
            {s.icon}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div key="table" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1.5px solid ${C.border}` }}>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr style={{ borderBottom: `1.5px solid ${C.border}`, background: C.bg }}>
                      {/* Rank */}
                      <th className="py-3.5 px-5 text-left sticky left-0 z-10" style={{ background: C.bg, fontFamily: F, width: 80, minWidth: 80 }}>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.faint }}>Rank</span>
                      </th>
                      {/* Model */}
                      <th className="py-3.5 px-5 text-left sticky z-10" style={{ background: C.bg, left: 80, minWidth: 200 }}>
                        <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 transition-opacity hover:opacity-70">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted, fontFamily: F }}>Model</span>
                          <ArrowUpDown size={12} color={C.faint} />
                        </button>
                      </th>
                      {/* Size */}
                      <th className="py-3.5 px-5 text-center" style={{ fontFamily: F, minWidth: 100 }}>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.faint, fontFamily: F }}>Size</span>
                      </th>
                      {/* Overall */}
                      <th className="py-3.5 px-5 text-center" style={{ minWidth: 140 }}>
                        <button onClick={() => handleSort('average_score')} className="flex items-center gap-1.5 mx-auto transition-opacity hover:opacity-70">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted, fontFamily: F }}>Overall</span>
                          <ArrowUpDown size={12} color={C.faint} />
                        </button>
                      </th>
                      {availableTasks.map(t => (
                        <th key={t} className="py-3.5 px-5 text-center" style={{ minWidth: 140 }}>
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.faint, fontFamily: F }}>{t}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((model, i) => (
                      <motion.tr key={model.name}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => { setSelectedModel(model); setViewMode('charts'); }}
                        className="cursor-pointer transition-colors border-b"
                        style={{ borderColor: C.border + '88' }}
                        onMouseEnter={e => (e.currentTarget.style.background = C.sagePill + '66')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                        {/* Rank */}
                        <td className="py-4 px-5 sticky left-0 z-10" style={{ background: C.card, width: 80, minWidth: 80 }}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold" style={{ color: C.faint }}>#{i + 1}</span>
                            {i === 0 && <span style={{ color: C.ochre }}>🥇</span>}
                            {i === 1 && <span style={{ color: C.faint }}>🥈</span>}
                            {i === 2 && <span style={{ color: '#c9a96e' }}>🥉</span>}
                          </div>
                        </td>

                        {/* Model name */}
                        <td className="py-4 px-5 sticky z-10" style={{ background: C.card, left: 80, minWidth: 200 }}>
                          <p className="font-bold text-sm" style={{ color: C.ink, fontFamily: F, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>{model.name}</p>
                        </td>

                        {/* Size */}
                        <td className="py-4 px-5 text-center" style={{ minWidth: 100 }}>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: C.slatePill, color: C.slateDeep, fontFamily: F }}>{model.size}</span>
                        </td>

                        {/* Overall score */}
                        <td className="py-4 px-5 text-center" style={{ minWidth: 140, whiteSpace: 'nowrap' }}>
                          <span className="text-xl font-extrabold px-3 py-1 rounded-xl"
                            style={{ color: scoreColor(model.average_score), background: scoreBg(model.average_score), fontFamily: F }}>
                            {model.average_score != null ? model.average_score.toFixed(1) : '--'}
                          </span>
                        </td>

                        {availableTasks.map(t => (
                          <td key={t} className="py-4 px-5 text-center" style={{ minWidth: 140 }}>
                            <span className="text-sm font-bold"
                              style={{ color: scoreColor(model.task_scores[t] || null), fontFamily: F }}>
                              {model.task_scores[t] ? model.task_scores[t].toFixed(1) : '--'}
                            </span>
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!sorted.length && (
                <div className="text-center py-16">
                  <p className="text-sm font-semibold mb-4" style={{ color: C.muted, fontFamily: F }}>No models match your search</p>
                  <motion.button onClick={() => setSearchTerm('')}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: C.sageLt, border: `1.5px solid ${C.sageBd}`, color: C.sageDeep, fontFamily: F }}
                    whileHover={{ background: C.sage, color: '#fdf9f4' }}>
                    Clear Search
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="charts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {selectedModel ? (
              <VisualizationDashboard selectedModel={selectedModel} allModels={sorted} onBack={() => setViewMode('table')} />
            ) : (
              <div className="flex flex-col items-center justify-center h-72 gap-4 rounded-2xl"
                style={{ background: C.card, border: `1.5px solid ${C.border}`, fontFamily: F }}>
                <AlertCircle size={32} color={C.ochre} />
                <p className="font-bold" style={{ color: C.ink }}>No model selected</p>
                <motion.button onClick={() => setViewMode('table')}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: C.bg, border: `1.5px solid ${C.border}`, color: C.muted, fontFamily: F }}
                  whileHover={{ color: C.ink }}>
                  <Table size={14} /> Back to Table
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeaderboardTable;