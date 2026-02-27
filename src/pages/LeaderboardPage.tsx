import React from 'react';
import { motion } from 'framer-motion';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

const SERIF = '"Fraunces", Georgia, serif';
const SANS  = '"DM Sans", "Nunito", sans-serif';

const LeaderboardPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: SANS }}>

      {/* ── Page header ─────────────────────────────────────── */}
      <section style={{ background: '#ffffff', paddingTop: '5.5rem', paddingBottom: '1.6rem' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 40px' }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Title row + description card side by side */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 40,
              flexWrap: 'wrap', marginBottom: 24,
            }}>
              <h1 style={{
                fontSize: 48, fontWeight: 600, color: '#1e1a14', margin: 0,
                lineHeight: 1.0, letterSpacing: '-0.02em', fontFamily: SERIF,
                fontVariationSettings: '"SOFT" 0, "WONK" 0',
              }}>
                Model Leaderboard
              </h1>

              {/* Description card */}
              <div style={{
                background: '#f5f2ee', border: '1px solid #e4ddd5',
                borderRadius: 12, padding: '12px 18px', maxWidth: 380, flexShrink: 0,
              }}>
                <p style={{
                  fontSize: 13.5, color: '#6b6258', lineHeight: 1.65,
                  margin: 0, fontWeight: 400, fontFamily: SANS,
                }}>
                  Aggregated averages across multiple benchmarks and through live
                  evaluation — scores update in real time as models complete.
                </p>
              </div>
            </div>

            {/* Stats strip + Live Rankings badge — same row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, borderTop: '1px solid #e8e2da', paddingTop: 20 }}>

              {/* Stats */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                {[
                  { value: '55+',  label: 'Benchmarks',     accent: '#6b9ab8' },
                  { value: '120+', label: 'Languages',       accent: '#c9867c' },
                  { value: '8',    label: 'Task categories', accent: '#c9a96e' },
                ].map((s, i, arr) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      paddingRight: i < arr.length - 1 ? 32 : 0,
                      paddingLeft: i > 0 ? 32 : 0,
                      borderRight: i < arr.length - 1 ? '1px solid #e8e2da' : 'none',
                    }}
                  >
                    <div style={{ fontSize: 36, fontWeight: 600, color: s.accent, fontFamily: SERIF, lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#9a8e82', fontFamily: SANS, marginTop: 4 }}>
                      {s.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Live Rankings badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 10, fontWeight: 600, padding: '5px 12px',
                borderRadius: 999, background: '#d4e5f2',
                border: '1px solid #a8c5de', color: '#2d5a78',
                letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: SANS,
                flexShrink: 0,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6b9ab8', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Live Rankings
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Table area ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 40px 60px' }}>
        <LeaderboardTable />
      </div>

    </div>
  );
};

export default LeaderboardPage;
