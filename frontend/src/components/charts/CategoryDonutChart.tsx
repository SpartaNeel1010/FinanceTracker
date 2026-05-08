'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CATEGORY_COLORS } from '@/lib/constants';

interface Props {
  data: Record<string, number>;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="custom-tooltip">
      <p style={{ fontWeight: 600 }}>{item.name}</p>
      <p>${item.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
      <p style={{ opacity: 0.8, fontSize: '0.75rem' }}>{item.payload.pct}% of total</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) => {
  if (pct < 5) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 600 }}>
      {pct}%
    </text>
  );
};

export default function CategoryDonutChart({ data }: Props) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const chartData = Object.entries(data)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      pct: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (chartData.length === 0) {
    return (
      <div className="empty-state" style={{ height: 280 }}>
        <p>No expense data yet.</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#94A3B8'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 120, overflowY: 'auto' }}>
        {chartData.map((item) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[item.name] || '#94A3B8', flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>{item.name}</span>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)' }}>${item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
