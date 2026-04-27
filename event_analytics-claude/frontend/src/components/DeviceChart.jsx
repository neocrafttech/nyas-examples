import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { desktop: '#6366f1', mobile: '#22d3ee', tablet: '#f59e0b' };
const DEFAULT_COLOR = '#94a3b8';

export default function DeviceChart({ devices = [] }) {
  const data = devices.map((d) => ({
    name: d.device_type,
    value: parseInt(d.count),
    fill: COLORS[d.device_type] || DEFAULT_COLOR,
  }));

  return (
    <div style={{ background: '#1e2130', borderRadius: 12, padding: '20px 24px', border: '1px solid #2d3148' }}>
      <h3 style={{ marginBottom: 4, fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Device Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
            {data.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#0f1117', border: '1px solid #2d3148', borderRadius: 8, fontSize: 13 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
