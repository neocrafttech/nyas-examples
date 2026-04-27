import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export default function TimeseriesChart({ data, loading }) {
  if (loading) return <ChartSkeleton />;

  const formatted = data.map((d) => ({
    ...d,
    time: format(parseISO(d.bucket), 'HH:mm'),
    events: parseInt(d.events),
    sessions: parseInt(d.sessions),
  }));

  return (
    <div style={{ background: '#1e2130', borderRadius: 12, padding: '20px 24px', border: '1px solid #2d3148' }}>
      <h3 style={{ marginBottom: 16, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Events &amp; Sessions Over Time
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="gEvents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
          <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: 8, fontSize: 13 }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          <Area type="monotone" dataKey="events" stroke="#6366f1" fill="url(#gEvents)" strokeWidth={2} dot={false} />
          <Area type="monotone" dataKey="sessions" stroke="#22d3ee" fill="url(#gSessions)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div style={{ background: '#1e2130', borderRadius: 12, padding: 24, border: '1px solid #2d3148', height: 300 }}>
      <div style={{ height: 14, width: 180, background: '#2d3148', borderRadius: 4, marginBottom: 16 }} />
      <div style={{ height: 240, background: '#151826', borderRadius: 8 }} />
    </div>
  );
}
