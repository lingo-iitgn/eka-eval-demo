import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Activity, Clock, CheckCircle2, AlertCircle,
  Terminal, ChevronDown, ChevronUp, Zap, TrendingUp,
  Download, ArrowRight, BarChart2, Brain,
} from 'lucide-react';
import DetailedAnalysisDashboard from './DetailedAnalysisDashboard';
import IndividualBenchmarkAnalysis from './IndividualBenchmarkAnalysis';

const F = '"Nunito", "Varela Round", sans-serif';
const C = {
  bg: '#f5f0e8', card: '#fdf9f4', ink: '#2c2416', muted: '#7a6e62', faint: '#b0a898', border: '#e0d8cc',
  sage: '#7a9e7e', sageLt: '#d4e8d6', sageBd: '#aed0b2', sageDeep: '#3d6b42', sagePill: '#eaf2eb',
  rose: '#c9867c', roseLt: '#f5dbd8', roseBd: '#ddb4ae', roseDeep: '#8f3d35', rosePill: '#faeeed',
  ochre: '#c9a96e', ochreLt: '#f5e8cc', ochreBd: '#e0c888', ochreDeep: '#7a5218', ochrePill: '#faf3e5',
  slate: '#6b7b8d', slateLt: '#d4dde8', slateBd: '#b0c0d0', slateDeep: '#3d5068', slatePill: '#edf1f5',
  mauve: '#a07ab8', mauveLt: '#e8d8f0', mauveBd: '#c8a8d8', mauveDeep: '#5c3a72', mauvePill: '#f4eef9',
  teal: '#7ab8b0', tealLt: '#d4ede8', tealBd: '#8ed4bc', tealDeep: '#2d6b62', tealPill: '#eaf7f4',
};

interface WorkerStatus { id: string; gpuId: number; status: 'idle'|'running'|'completed'|'error'; currentBenchmark: string; progress: number; logs: string[]; }
interface BenchmarkProgress { name: string; progress: number; status: 'pending'|'running'|'completed'|'error'; score?: number; samples?: { current: number; total: number }; }
interface EvaluationMonitorProps { config: any; onComplete: () => void; onBack: () => void; }

const StatCard: React.FC<{ label: string; value: string; bg: string; border: string; textColor: string; icon: React.ReactNode }> = ({ label, value, bg, border, textColor, icon }) => (
  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
    className="rounded-2xl p-5 flex flex-col gap-2"
    style={{ background: bg, border: `1.5px solid ${border}` }}>
    <div className="flex items-center justify-between">
      {icon}
      <span className="text-3xl font-extrabold" style={{ color: textColor, fontFamily: F }}>{value}</span>
    </div>
    <p className="text-xs font-semibold" style={{ color: textColor, opacity: 0.7, fontFamily: F }}>{label}</p>
  </motion.div>
);

const EvaluationMonitor: React.FC<EvaluationMonitorProps> = ({ config, onComplete, onBack }) => {
  const [status, setStatus] = useState<'pending'|'running'|'completed'|'error'>('pending');
  const [logs, setLogs] = useState<string[]>(['🚀 Initializing evaluation…']);
  const [elapsed, setElapsed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number|null>(null);
  const [workers, setWorkers] = useState<WorkerStatus[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [showConsole, setShowConsole] = useState(true);
  const [completedBenchmarks, setCompletedBenchmarks] = useState(0);
  const [finalResults, setFinalResults] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedBenchmarkForAnalysis, setSelectedBenchmarkForAnalysis] = useState<string|null>(null);

  const logsRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket|null>(null);
  const startTime = useRef(Date.now());
  const evaluationStarted = useRef(false);

  const getApiBaseUrl = () => {
    if (window.location.hostname.includes('lingo.iitgn.ac.in')) return 'https://lingo.iitgn.ac.in/eka-eval/api';
    let url = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
    return url.endsWith('/api') ? url : url + '/api';
  };

  useEffect(() => {
    setBenchmarks((config.benchmarks || []).map((bm: string) => ({ name: bm, progress: 0, status: 'pending', samples: { current: 0, total: 0 } })));
    const gpuCount = config.advancedSettings?.gpuCount || 1;
    setWorkers(Array.from({ length: gpuCount }, (_, i) => ({ id: `worker-${i}`, gpuId: i, status: 'idle', currentBenchmark: 'Waiting…', progress: 0, logs: [] })));
    connectWebSocket();
    const t = setTimeout(() => { if (!evaluationStarted.current) startEvaluation(); }, 1000);
    const timer = setInterval(() => { if (status !== 'completed') setElapsed(Math.floor((Date.now() - startTime.current) / 1000)); }, 1000);
    return () => { clearTimeout(t); clearInterval(timer); ws.current?.close(); };
  }, []);

  const connectWebSocket = () => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = window.location.hostname.includes('lingo.iitgn.ac.in')
      ? `${proto}//${window.location.host}/eka-eval/ws/v1/evaluation-logs`
      : window.location.port === '5173' ? 'ws://localhost:8000/ws/v1/evaluation-logs'
      : `${proto}//${window.location.host}/ws/v1/evaluation-logs`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onopen = () => { setStatus('running'); setLogs(p => [...p, '✅ Connected']); };
    ws.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'log') { setLogs(p => [...p.slice(-150), msg.payload]); processLogLine(msg.payload); if (msg.payload.includes('Consolidated Evaluation Results')) setTimeout(() => fetchResults(), 2000); }
        if (msg.type === 'status' && msg.payload === 'completed') setTimeout(() => fetchResults(), 1000);
      } catch {}
    };
    ws.current.onclose = () => setLogs(p => [...p, '🔌 Connection closed']);
  };

  const processLogLine = (line: string) => {
    const scoreMatch = line.match(/\|\s*(\S+)\s*\|\s*[\d.]+\s*\|\s*([\d.]+)\s*\|/);
    if (scoreMatch) { const [, name, scoreStr] = scoreMatch; const score = parseFloat(scoreStr); setBenchmarks(p => p.map(bm => (bm.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(bm.name.toLowerCase())) ? { ...bm, score, progress: 100, status: 'completed' } : bm)); }
    const wm = line.match(/\[Worker (\d+) \(GPU (\d+)\)\]/);
    if (wm) {
      const wid = parseInt(wm[1], 10);
      setWorkers(pw => { const nw = [...pw]; if (nw[wid]) { const em = line.match(/P\d+\s*-\s*(\w+(?:\s+\w+)?)\s+(?:Likelihood\s+)?Eval/i); if (em) { nw[wid].currentBenchmark = em[1].trim(); nw[wid].status = 'running'; setBenchmarks(p => p.map(bm => (bm.name.toLowerCase().includes(em[1].trim().toLowerCase())) ? { ...bm, status: 'running' } : bm)); } const sm = line.match(/(\d+)\/(\d+)\s+\[/); if (sm) { const cur = parseInt(sm[1]); const tot = parseInt(sm[2]); const prog = (cur/tot)*100; nw[wid].progress = prog; } if (line.includes('Finished TG')) { nw[wid].status = 'completed'; nw[wid].progress = 100; setCompletedBenchmarks(p => p+1); } } return nw; });
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/results/latest/${encodeURIComponent(config.model.identifier)}`);
      const data = await res.json();
      if (data.found) {
        setFinalResults(data); setStatus('completed'); setCompletedBenchmarks(benchmarks.length); setOverallProgress(100);
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g,'');
        const scores = new Map<string,number>();
        data.results.forEach((tr: any) => tr.benchmarks.forEach((b: any) => scores.set(norm(b.name), b.score)));
        setBenchmarks(p => p.map(bm => { const k = norm(bm.name); let sc; for (const [ak, av] of scores.entries()) { if (k.includes(ak)||ak.includes(k)) { sc=av; break; } } return sc!==undefined ? { ...bm, status:'completed', progress:100, score:sc } : bm; }));
        setLogs(p => [...p, '🎉 Results synced from server.']);
      } else { setTimeout(() => fetchResults(), 3000); }
    } catch {}
  };

  const startEvaluation = async () => {
    if (evaluationStarted.current) return;
    evaluationStarted.current = true;
    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/run-evaluation`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ model: config.model, benchmarks: config.benchmarks, advancedSettings: config.advancedSettings }) });
      const data = await res.json();
      if (res.ok) setLogs(p => [...p, `✅ ${data.message}`]);
      else { setStatus('error'); setLogs(p => [...p, `❌ ${data.detail || 'Failed to start'}`]); }
    } catch (err) { setStatus('error'); setLogs(p => [...p, `❌ Network error: ${err}`]); }
  };

  useEffect(() => {
    if (benchmarks.length > 0 && status !== 'completed') {
      const prog = benchmarks.reduce((s,b) => s+b.progress,0)/benchmarks.length;
      setOverallProgress(prog);
      if (prog > 1 && elapsed > 5) setEstimatedTime(Math.round((100-prog)*(elapsed/prog)));
    }
  }, [benchmarks, elapsed, status]);

  useEffect(() => { if (logsRef.current && showConsole) logsRef.current.scrollTop = logsRef.current.scrollHeight; }, [logs, showConsole]);

  const fmt = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const downloadCSV = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/results/download`);
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='evaluation_results.csv'; document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch {}
  };

  if (selectedBenchmarkForAnalysis && finalResults) return <IndividualBenchmarkAnalysis benchmarkName={selectedBenchmarkForAnalysis} modelName={finalResults.model} onBack={() => setSelectedBenchmarkForAnalysis(null)} />;
  if (showAnalysis && finalResults) return <DetailedAnalysisDashboard results={finalResults} onBack={() => setShowAnalysis(false)} />;

  const statusBadge = { pending: { bg: C.ochrePill, border: C.ochreBd, text: C.ochreDeep, label: '⏳ Pending' }, running: { bg: C.sagePill, border: C.sageBd, text: C.sageDeep, label: '🔄 Running' }, completed: { bg: C.sageLt, border: C.sageBd, text: C.sageDeep, label: '✅ Complete' }, error: { bg: C.rosePill, border: C.roseBd, text: C.roseDeep, label: '❌ Error' } }[status];

  const getBmColor = (s: string) => ({ running: { bg: C.sagePill, border: C.sageBd, bar: C.sage }, completed: { bg: C.slatePill, border: C.slateBd, bar: C.slate }, error: { bg: C.rosePill, border: C.roseBd, bar: C.rose }, pending: { bg: C.bg, border: C.border, bar: C.faint } }[s] || { bg: C.bg, border: C.border, bar: C.faint });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Stats row ───────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Overall Progress" value={`${Math.round(overallProgress)}%`} bg={C.sagePill} border={C.sageBd} textColor={C.sageDeep} icon={<Zap size={18} color={C.sage} />} />
        <StatCard label="Time Elapsed" value={fmt(elapsed)} bg={C.slatePill} border={C.slateBd} textColor={C.slateDeep} icon={<Clock size={18} color={C.slate} />} />
        <StatCard label="Benchmarks Done" value={`${completedBenchmarks}/${benchmarks.length}`} bg={C.ochrePill} border={C.ochreBd} textColor={C.ochreDeep} icon={<CheckCircle2 size={18} color={C.ochre} />} />
        <StatCard label="Est. Remaining" value={estimatedTime ? fmt(estimatedTime) : '--:--'} bg={C.mauvePill} border={C.mauveBd} textColor={C.mauveDeep} icon={<TrendingUp size={18} color={C.mauve} />} />
      </div>

      {/* ── Progress bar ────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6" style={{ background: C.card, border: `1.5px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ color: C.ink, fontFamily: F }}>Evaluation Progress</h3>
          <span className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: statusBadge.bg, border: `1px solid ${statusBadge.border}`, color: statusBadge.text, fontFamily: F }}>
            {statusBadge.label}
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: C.bg }}>
          <motion.div className="h-full rounded-full relative overflow-hidden"
            style={{ background: `linear-gradient(90deg, ${C.sage}, ${C.teal})` }}
            animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}>
            {status === 'running' && (
              <motion.div className="absolute inset-0"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
                animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* ── Benchmark cards ─────────────────────────── */}
      {benchmarks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benchmarks.map((bm, i) => {
            const col = getBmColor(bm.status);
            return (
              <motion.div key={bm.name}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-5"
                style={{ background: col.bg, border: `1.5px solid ${col.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm" style={{ color: C.ink, fontFamily: F }}>{bm.name}</h4>
                  <div style={{ color: col.bar }}>
                    {bm.status === 'running' && <Activity size={16} className="animate-pulse" />}
                    {bm.status === 'completed' && <CheckCircle2 size={16} />}
                    {bm.status === 'error' && <AlertCircle size={16} />}
                    {bm.status === 'pending' && <Clock size={16} color={C.faint} />}
                  </div>
                </div>

                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: C.muted, fontFamily: F }}>Progress</span>
                  <span className="font-mono font-bold" style={{ color: col.bar }}>{Math.round(bm.progress)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                  <motion.div className="h-full rounded-full" style={{ background: col.bar }}
                    animate={{ width: `${bm.progress}%` }} transition={{ duration: 0.3 }} />
                </div>

                {bm.samples && bm.samples.total > 0 && (
                  <p className="text-xs font-mono mt-1.5" style={{ color: C.faint }}>
                    {bm.samples.current} / {bm.samples.total} samples
                  </p>
                )}
                {bm.score !== undefined && bm.score !== null && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: col.border + '88' }}>
                    <span className="font-extrabold text-lg" style={{ color: col.bar, fontFamily: F }}>
                      {bm.score.toFixed(2)}%
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── GPU Workers ─────────────────────────────── */}
      {workers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl p-6" style={{ background: C.card, border: `1.5px solid ${C.slateBd}` }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2"
            style={{ color: C.ink, fontFamily: F }}>
            <Cpu size={16} color={C.slate} /> GPU Workers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {workers.map(w => (
              <div key={w.id} className="rounded-xl p-4"
                style={{
                  background: w.status === 'running' ? C.sagePill : w.status === 'completed' ? C.slatePill : C.bg,
                  border: `1.5px solid ${w.status === 'running' ? C.sageBd : w.status === 'completed' ? C.slateBd : C.border}`,
                }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm" style={{ color: C.ink, fontFamily: F }}>GPU {w.gpuId}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                    style={{ background: w.status === 'running' ? C.sageBd : C.border, color: w.status === 'running' ? C.sageDeep : C.muted, fontFamily: F }}>
                    {w.status}
                  </span>
                </div>
                <p className="text-xs truncate mb-2" style={{ color: C.muted, fontFamily: F }}>{w.currentBenchmark}</p>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
                  <motion.div className="h-full rounded-full" style={{ background: C.sage }}
                    animate={{ width: `${w.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Console ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1.5px solid ${C.border}` }}>
        <button onClick={() => setShowConsole(!showConsole)}
          className="w-full flex items-center justify-between px-6 py-4 transition-colors"
          style={{ fontFamily: F }}
          onMouseEnter={e => (e.currentTarget.style.background = C.bg)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div className="flex items-center gap-2.5">
            <Terminal size={16} color={C.teal} />
            <span className="font-bold text-sm" style={{ color: C.ink }}>Live Console</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: C.tealPill, color: C.tealDeep, border: `1px solid ${C.tealBd}` }}>
              {logs.length} lines
            </span>
          </div>
          {showConsole ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
        </button>

        <AnimatePresence>
          {showConsole && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              transition={{ duration: 0.25 }} className="overflow-hidden">
              <div ref={logsRef}
                className="h-72 p-4 font-mono text-xs overflow-y-auto border-t"
                style={{ background: '#1e1a14', borderColor: C.border, color: '#b8a888' }}>
                {logs.map((log, i) => (
                  <div key={i} className="py-0.5 hover:opacity-80 whitespace-pre-wrap break-all">{log}</div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Results ─────────────────────────────────── */}
      {status === 'completed' && finalResults && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-7"
          style={{ background: C.sagePill, border: `1.5px solid ${C.sageBd}`, boxShadow: `0 6px 28px ${C.sageLt}` }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
            <h3 className="text-xl font-extrabold flex items-center gap-2.5" style={{ color: C.sageDeep, fontFamily: F }}>
              <CheckCircle2 size={22} /> Evaluation Complete!
            </h3>
            <div className="flex gap-3 flex-wrap">
              <motion.button onClick={downloadCSV}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: C.card, border: `1.5px solid ${C.sageBd}`, color: C.sageDeep, fontFamily: F }}
                whileHover={{ background: C.sageLt }}>
                <Download size={14} /> Export CSV
              </motion.button>
              <motion.button onClick={() => setShowAnalysis(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#2c2416', color: '#f5f0e8', fontFamily: F }}
                whileHover={{ background: '#3d6b42' }}>
                <BarChart2 size={14} /> Detailed Analysis
              </motion.button>
            </div>
          </div>

          <p className="text-sm mb-5" style={{ color: C.sageDeep, fontFamily: F }}>
            <strong>{finalResults.model}</strong> evaluated across {benchmarks.length} benchmark{benchmarks.length !== 1 ? 's' : ''}.
          </p>

          <div className="rounded-xl p-5" style={{ background: C.card, border: `1.5px solid ${C.sageBd}` }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: C.sage, fontFamily: F }}>Results Summary</p>
            {finalResults.results.map((tr: any, idx: number) => {
              const filtered = tr.benchmarks.filter((bm: any) => (config.benchmarks||[]).some((s: string) => bm.name.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(bm.name.toLowerCase())));
              if (!filtered.length) return null;
              return (
                <div key={idx} className="mb-4 last:mb-0">
                  <p className="text-xs font-bold mb-2" style={{ color: C.slate, fontFamily: F }}>{tr.task}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {filtered.map((bm: any, bi: number) => (
                      <button key={bi}
                        onClick={() => setSelectedBenchmarkForAnalysis(bm.name)}
                        className="flex items-center justify-between text-sm p-3 rounded-xl text-left group transition-all"
                        style={{ background: C.bg, border: `1px solid ${C.border}`, fontFamily: F }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.sageBd; (e.currentTarget as HTMLButtonElement).style.background = C.sagePill; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.background = C.bg; }}>
                        <span className="flex items-center gap-2" style={{ color: C.muted }}>
                          <Brain size={13} color={C.faint} />
                          {bm.name}
                        </span>
                        <span className="font-mono font-bold" style={{ color: C.sageDeep }}>
                          {bm.score != null ? `${bm.score.toFixed(2)}%` : 'N/A'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={() => window.location.href = '/eka-eval/leaderboard'}
              className="flex items-center gap-2 text-sm font-bold transition-all hover:translate-x-1"
              style={{ color: C.sageDeep, fontFamily: F }}>
              Go to Leaderboard <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EvaluationMonitor;