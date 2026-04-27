export default function TopPages({ pages = [] }) {
  const max = pages[0]?.views || 1;
  return (
    <div style={{ background: '#1e2130', borderRadius: 12, padding: '20px 24px', border: '1px solid #2d3148' }}>
      <h3 style={{ marginBottom: 16, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Top Pages
      </h3>
      {pages.length === 0 && <p style={{ color: '#64748b', fontSize: 13 }}>No data</p>}
      {pages.map((p) => (
        <div key={p.page_url} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 13 }}>
            <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}
              title={p.page_url}>
              {p.page_url}
            </span>
            <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{Number(p.views).toLocaleString()}</span>
          </div>
          <div style={{ height: 4, background: '#2d3148', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${(p.views / max) * 100}%`, background: '#6366f1', borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
