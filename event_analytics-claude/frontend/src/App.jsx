import { useState } from 'react';
import StatCard from './components/StatCard.jsx';
import TimeseriesChart from './components/TimeseriesChart.jsx';
import TopPages from './components/TopPages.jsx';
import DeviceChart from './components/DeviceChart.jsx';
import EventBreakdown from './components/EventBreakdown.jsx';
import LiveWidget from './components/LiveWidget.jsx';
import FunnelView from './components/FunnelView.jsx';
import { useOverview, useTimeseries, useBreakdown, useReferrers } from './hooks/useAnalytics.js';

const RANGES = [
  { label: '1h',  value: '-1h' },
  { label: '24h', value: '-24h' },
  { label: '7d',  value: '-7d' },
  { label: '30d', value: '-30d' },
];

export default function App() {
  const [range, setRange] = useState('-24h');
  const { data, loading, refresh } = useOverview(range);
  const { data: series, loading: seriesLoading } = useTimeseries(range);
  const breakdown = useBreakdown(range);
  const referrers = useReferrers(range);

  const ev = data?.events || {};
  const sess = data?.sessions || {};

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Event Analytics</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Powered by nyas.io · PostgreSQL</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LiveWidget />
          <div style={{ display: 'flex', background: '#1e2130', borderRadius: 8, border: '1px solid #2d3148', overflow: 'hidden' }}>
            {RANGES.map((r) => (
              <button key={r.value} onClick={() => setRange(r.value)} style={{
                padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: range === r.value ? '#6366f1' : 'transparent',
                color: range === r.value ? '#fff' : '#94a3b8',
              }}>{r.label}</button>
            ))}
          </div>
          <button onClick={refresh} disabled={loading} style={{
            background: '#1e2130', border: '1px solid #2d3148', color: '#94a3b8',
            borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13,
          }}>
            {loading ? '⟳' : '↺ Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard accent label="Pageviews" value={Number(ev.pageviews || 0).toLocaleString()} sub={`${Number(ev.total_events || 0).toLocaleString()} total events`} />
        <StatCard label="Sessions" value={Number(ev.unique_sessions || 0).toLocaleString()} sub={`${Number(sess.total_sessions || 0).toLocaleString()} total`} />
        <StatCard label="Avg Duration" value={formatDuration(sess.avg_duration_sec)} sub={`${sess.avg_pages || 0} pages/session`} />
        <StatCard label="Bounce Rate" value={sess.bounce_rate ? `${Number(sess.bounce_rate).toFixed(1)}%` : '—'} sub="single-page sessions" />
      </div>

      {/* Timeseries */}
      <div style={{ marginBottom: 20 }}>
        <TimeseriesChart data={series} loading={seriesLoading} />
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <TopPages pages={data?.top_pages || []} />
        <DeviceChart devices={data?.devices || []} />
        <EventBreakdown data={breakdown} />
      </div>

      {/* Third row: funnel + referrers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FunnelView range={range} />
        <Referrers referrers={referrers} />
      </div>
    </div>
  );
}

function Referrers({ referrers }) {
  return (
    <div style={{ background: '#1e2130', borderRadius: 12, padding: '20px 24px', border: '1px solid #2d3148' }}>
      <h3 style={{ marginBottom: 14, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Top Referrers
      </h3>
      {referrers.length === 0 && <p style={{ color: '#64748b', fontSize: 13 }}>No referrer data</p>}
      {referrers.map((r) => (
        <div key={r.referrer} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1f35', fontSize: 13 }}>
          <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{r.referrer}</span>
          <span style={{ color: '#6366f1', fontWeight: 600 }}>{Number(r.sessions).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function formatDuration(sec) {
  if (!sec) return '—';
  const s = parseInt(sec);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}
