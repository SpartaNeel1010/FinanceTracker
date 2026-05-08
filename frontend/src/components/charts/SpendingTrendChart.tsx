'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface Props {
  data: Record<string, { income: number; expense: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function SpendingTrendChart({ data }: Props) {
  const chartData = Object.entries(data).map(([month, vals]) => ({
    month: month.slice(0, 7), // YYYY-MM
    Income: Math.round(vals.income),
    Expenses: Math.round(vals.expense),
    Net: Math.round(vals.income - vals.expense),
  }));

  if (chartData.length === 0) {
    return (
      <div className="empty-state" style={{ height: 280 }}>
        <p>No data yet. Add transactions to see your spending trend.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0052FF" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#0052FF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v.toLocaleString()}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '0.8rem', paddingTop: '0.5rem' }}
        />
        <Area type="monotone" dataKey="Income" stroke="#10B981" strokeWidth={2} fill="url(#incomeGrad)" dot={false} />
        <Area type="monotone" dataKey="Expenses" stroke="#0052FF" strokeWidth={2} fill="url(#expenseGrad)" dot={false} />
        <Area type="monotone" dataKey="Net" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#netGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
