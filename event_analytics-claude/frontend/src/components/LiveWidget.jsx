import { useLive } from '../hooks/useAnalytics.js';

export default function LiveWidget() {
  const { events, active_sessions } = useLive(10_000);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 24,
      background: '#1e2130', borderRadius: 12, padding: '14px 24px',
      border: '1px solid #2d3148',
    }}>
      <Dot />
      <span style={{ fontSize: 13, color: '#94a3b8' }}>Last 60s</span>
      <div>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#22d3ee' }}>{active_sessions}</span>
        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>active sessions</span>
      </div>
      <div>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#6366f1' }}>{events}</span>
        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>events</span>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <div style={{ position: 'relative', width: 10, height: 10 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', animation: 'ping 1.5s infinite' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e' }} />
      <style>{`@keyframes ping { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(2);opacity:0} }`}</style>
    </div>
  );
}
