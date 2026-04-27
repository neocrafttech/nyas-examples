import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';

const DEFAULT_STEPS = ['pageview', 'click', 'signup', 'purchase'];

export default function FunnelView({ range }) {
  const [steps, setSteps] = useState(DEFAULT_STEPS.join('\n'));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const parsed = steps.split('\n').map((s) => s.trim()).filter(Boolean);
    if (parsed.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/analytics/funnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: parsed, from: range }),
      });
      setResult(await res.json());
    } finally { setLoading(false); }
  };

  return (
    <div style={{ background: '#1e2130', borderRadius: 12, padding: '20px 24px', border: '1px solid #2d3148' }}>
      <h3 style={{ marginBottom: 14, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Funnel Analysis
      </h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="One event type per line"
          style={{
            flex: 1, background: '#151826', border: '1px solid #2d3148', borderRadius: 8,
            color: '#e2e8f0', padding: '8px 12px', fontSize: 13, resize: 'vertical', minHeight: 90,
          }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{
            background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          {loading ? '...' : 'Run'}
        </button>
      </div>
      {Array.isArray(result) && result.map((step, i) => (
        <div key={step.step} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
            <span style={{ color: '#cbd5e1' }}>{i + 1}. {step.step}</span>
            <span style={{ color: '#94a3b8' }}>{step.sessions.toLocaleString()} ({step.conversion_rate})</span>
          </div>
          <div style={{ height: 6, background: '#2d3148', borderRadius: 3 }}>
            <div style={{
              height: '100%',
              width: step.conversion_rate,
              background: `hsl(${240 - i * 30}, 80%, 65%)`,
              borderRadius: 3,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
