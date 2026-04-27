import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EventBreakdown({ data = [] }) {
  const formatted = data.map((d) => ({ ...d, count: parseInt(d.count) }));
  return (
    <div style={{ background: '#1e2130', borderRadius: 12, padding: '20px 24px', border: '1px solid #2d3148' }}>
      <h3 style={{ marginBottom: 16, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Event Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} layout="vertical" margin={{ left: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="event_type" tick={{ fill: '#cbd5e1', fontSize: 12 }} tickLine={false} axisLine={false} width={100} />
          <Tooltip
            contentStyle={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: 8, fontSize: 13 }}
          />
          <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
