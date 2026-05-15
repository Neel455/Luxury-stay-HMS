import { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(val) {
  if (val == null) return '—';
  if (val >= 1_000_000) return `€${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000)     return `€${(val / 1_000).toFixed(1)}k`;
  return `€${Number(val).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
}

function fmtPct(val) {
  if (val == null) return '—';
  return `${Number(val).toFixed(1)}%`;
}

function currentQuarter() {
  const m = new Date().getMonth();
  return `Q${Math.floor(m / 3) + 1} ${new Date().getFullYear()}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Mini({ label, value }) {
  return (
    <div style={{ background: 'var(--paper)', padding: '20px 24px' }}>
      <div className="label" style={{ marginBottom: 8 }}>{label}</div>
      <div className="display numeral" style={{ fontSize: 36, lineHeight: 1 }}>{value ?? '—'}</div>
    </div>
  );
}

function SectionHead({ title, caption }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 className="display" style={{ fontSize: 28, margin: 0 }}>{title}</h2>
      {caption && <span className="eyebrow">{caption}</span>}
    </div>
  );
}

function Legend({ color, label, dashed }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-3)' }}>
      <div style={{ width: 24, height: 2, background: dashed ? 'transparent' : color, borderTop: dashed ? `1px dashed ${color}` : 'none' }} />
      <span>{label}</span>
    </div>
  );
}

// ─── Revenue Bar Chart ────────────────────────────────────────────────────────

function RevenueBarChart({ series }) {
  const max = Math.max(...series.map(d => d.revenue || 0), 1);
  const labels = series.map(d => {
    const date = new Date(d.date || d.period || '');
    return isNaN(date) ? (d.period || '') : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  });
  return (
    <div style={{ padding: 28 }}>
      <div className="bar-row" style={{ height: 140 }}>
        {series.map((d, i) => {
          const h = (d.revenue || 0) > 0 ? Math.max(((d.revenue || 0) / max) * 100, 4) : 1;
          return (
            <div key={i} className="bar" style={{ height: `${h}%` }}
              title={`${labels[i]}: ${fmtCurrency(d.revenue)}`} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--mute)', letterSpacing: '0.1em' }}>
        <span>{labels[0]}</span>
        <span>{labels[Math.floor(labels.length / 2)]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}

// ─── Occupancy SVG Line Chart ─────────────────────────────────────────────────

function OccupancyLineChart({ series }) {
  const w = 600, h = 180;
  if (!series.length) return <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mute)', fontSize: 12 }}>No data</div>;

  const vals = series.map(d => d.occupancyPct || 0);
  const path = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / Math.max(vals.length - 1, 1)) * w} ${h - (v / 100) * h}`).join(' ');
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;

  const gridLines = [25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="180" preserveAspectRatio="none">
      {gridLines.map(g => (
        <line key={g} x1="0" x2={w} y1={h - (g / 100) * h} y2={h - (g / 100) * h}
          stroke="var(--hairline-2)" strokeWidth="1" strokeDasharray="2 4" />
      ))}
      <path d={area} fill="var(--brass)" opacity="0.08" />
      <path d={path} stroke="var(--ink)" strokeWidth="2" fill="none" />
      {vals.map((v, i) => (
        <circle key={i} cx={(i / Math.max(vals.length - 1, 1)) * w} cy={h - (v / 100) * h} r="3" fill="var(--ink)" />
      ))}
    </svg>
  );
}

// ─── Bar row ──────────────────────────────────────────────────────────────────

function BarRow({ label, value, pct, color = 'var(--brass)', suffix = '' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 13 }}>{label}</span>
        <span className="numeral" style={{ fontSize: 16 }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 4, background: 'var(--hairline-2)', position: 'relative', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function TableRow({ label, values, border = true }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: border ? '1px solid var(--hairline-2)' : 'none', fontSize: 12 }}>
      <span style={{ color: 'var(--ink)', flex: 2 }}>{label}</span>
      {values.map((v, i) => (
        <span key={i} className="numeral" style={{ flex: 1, textAlign: 'right', color: i === 0 ? 'var(--ink)' : 'var(--mute)' }}>{v}</span>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month');

  // Parallel API calls
  const { data: dashData, loading: dashLoading }   = useApi('/api/reports/dashboard');
  const { data: revData,  loading: revLoading }    = useApi(`/api/reports/revenue?period=${period}`, { deps: [period] });
  const { data: occData,  loading: occLoading }    = useApi(`/api/reports/occupancy?period=${period}`, { deps: [period] });
  const { data: roomData, loading: roomLoading }   = useApi('/api/reports/room-performance');
  const { data: guestData, loading: guestLoading } = useApi('/api/reports/guests');

  const metrics    = dashData?.metrics    || {};
  const revSeries  = revData?.series      || [];
  const occSeries  = occData?.series      || [];
  const roomPerf   = roomData?.performance || [];
  const guestStats = guestData            || {};

  const revByCategory = revData?.byCategory || [];
  const sources       = guestStats.sources       || [];
  const nationalities = guestStats.nationalities || [];

  const loading = dashLoading || revLoading;

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Analytics · {currentQuarter()}</div>
          <h1 className="display">Patterns, <em>by season.</em></h1>
          <p className="sub">
            {metrics.occupancyPct != null
              ? `Current occupancy ${metrics.occupancyPct}% · ADR ${fmtCurrency(metrics.adr)} · RevPAR ${fmtCurrency(metrics.revpar)}.`
              : 'Loading performance metrics…'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="switch">
            {[{ id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }, { id: 'year', label: 'Year' }].map(p => (
              <button key={p.id} className={period === p.id ? 'active' : ''} onClick={() => setPeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--hairline)', border: '1px solid var(--hairline)', marginBottom: 32 }}>
        {dashLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ background: 'var(--paper)', padding: '20px 24px', height: 88 }} />)
        ) : (
          <>
            <Mini label="Total revenue · YTD" value={fmtCurrency(metrics.revenueYTD)} />
            <Mini label="Avg. occupancy"       value={fmtPct(metrics.occupancyPct)} />
            <Mini label="ADR"                  value={fmtCurrency(metrics.adr)} />
            <Mini label="RevPAR"               value={fmtCurrency(metrics.revpar)} />
          </>
        )}
      </div>

      {/* ── Revenue chart + category breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, marginBottom: 36 }}>
        <div>
          <SectionHead title="Revenue trend" caption={`by ${period}`} />
          <div className="card" style={{ minHeight: 220 }}>
            {revLoading
              ? <div style={{ padding: 60 }}><Spinner page /></div>
              : revSeries.length
                ? <RevenueBarChart series={revSeries} />
                : <div style={{ padding: '40px 28px', textAlign: 'center', color: 'var(--mute)', fontSize: 12 }}>No revenue data for this period.</div>
            }
          </div>
        </div>

        <div>
          <SectionHead title="Revenue by category" caption="this period" />
          <div className="card" style={{ padding: 28 }}>
            {revLoading
              ? <Spinner />
              : revByCategory.length
                ? revByCategory.map((row, i) => (
                    <BarRow
                      key={i}
                      label={row.label}
                      value={fmtCurrency(row.amount)}
                      pct={row.pct}
                      color={['var(--ink)', 'var(--brass)', 'var(--sage)', 'var(--terracotta)', 'var(--mute-2)'][i % 5]}
                    />
                  ))
                : <div style={{ fontSize: 12, color: 'var(--mute)', paddingTop: 8 }}>No data for this period.</div>
            }
          </div>
        </div>
      </div>

      {/* ── Occupancy line chart ── */}
      <div style={{ marginBottom: 36 }}>
        <SectionHead title="Occupancy trend" caption={`by ${period}`} />
        <div className="card" style={{ padding: 28 }}>
          {occLoading
            ? <div style={{ padding: 40 }}><Spinner page /></div>
            : occSeries.length
              ? (
                <>
                  <OccupancyLineChart series={occSeries} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--mute)', letterSpacing: '0.1em' }}>
                    {occSeries.length > 0 && <span>{occSeries[0]?.date || occSeries[0]?.period || ''}</span>}
                    {occSeries.length > 1 && <span>{occSeries[occSeries.length - 1]?.date || occSeries[occSeries.length - 1]?.period || ''}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hairline-2)' }}>
                    <Legend color="var(--ink)" label={`${period} occupancy`} />
                  </div>
                </>
              )
              : <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--mute)', fontSize: 12 }}>No occupancy data for this period.</div>
          }
        </div>
      </div>

      {/* ── Bottom 3 cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>

        {/* Room performance */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Top room types</div>
          {roomLoading
            ? <Spinner />
            : roomPerf.length
              ? roomPerf.slice(0, 5).map((r, i) => (
                  <TableRow
                    key={i}
                    label={r.type?.replace('_', ' ') || r.roomType || '—'}
                    values={[fmtPct(r.occupancyPct || r.occupancy), fmtCurrency(r.adr || r.avgRate)]}
                    border={i < Math.min(roomPerf.length, 5) - 1}
                  />
                ))
              : <div style={{ fontSize: 12, color: 'var(--mute)', paddingTop: 8 }}>No stay data for this period.</div>
          }
        </div>

        {/* Booking sources */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Booking source</div>
          {guestLoading
            ? <Spinner />
            : sources.length
              ? sources.map((s, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>{s.label}</span>
                      <span className="mono">{s.pct != null ? `${s.pct}%` : s.count}</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--hairline-2)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${s.pct || 0}%`, background: 'var(--brass)', borderRadius: 2 }} />
                    </div>
                  </div>
                ))
              : <div style={{ fontSize: 12, color: 'var(--mute)', paddingTop: 8 }}>No booking data yet.</div>
          }
        </div>

        {/* Guest origin */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Guest origin</div>
          {guestLoading
            ? <Spinner />
            : nationalities.length
              ? nationalities.slice(0, 5).map((n, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < Math.min(nationalities.length, 5) - 1 ? '1px solid var(--hairline-2)' : 'none', fontSize: 12 }}>
                    <span>{n.nationality || '—'}</span>
                    <span className="mono">{n.pct != null ? `${n.pct}%` : n.count}</span>
                  </div>
                ))
              : <div style={{ fontSize: 12, color: 'var(--mute)', paddingTop: 8 }}>No nationality data yet.</div>
          }
        </div>
      </div>
    </div>
  );
}
