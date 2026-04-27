export default function StatCard({ label, value, sub, accent = false }) {
  return (
    <div style={{
      background: accent ? 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)' : '#1e2130',
      borderRadius: 12,
      padding: '20px 24px',
      border: '1px solid ' + (accent ? 'transparent' : '#2d3148'),
    }}>
      <div style={{ fontSize: 13, color: accent ? '#c4b5fd' : '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 12, color: accent ? '#c4b5fd' : '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
