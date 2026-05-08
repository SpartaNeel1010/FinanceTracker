'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { CATEGORY_COLORS } from '@/lib/constants';
import CategoryDonutChart from '@/components/charts/CategoryDonutChart';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: ${p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/transactions/stats/summary'),
      api.get('/transactions/stats/trends?months=6'),
    ]).then(([s, t]) => {
      setSummary(s.data);
      setTrends(t.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Monthly stacked bar data
  const monthlyBar = summary?.monthly_totals
    ? Object.entries(summary.monthly_totals).map(([month, vals]: any) => ({
        month, Income: Math.round(vals.income), Expenses: Math.round(vals.expense),
      }))
    : [];

  // Category comparison for radar
  const categories = Object.keys(CATEGORY_COLORS).slice(0, 8);
  const radarData = categories.map((cat) => ({
    category: cat.split(' ')[0],
    value: Math.round(summary?.category_breakdown?.[cat] || 0),
  }));

  // Top merchants
  const merchantData = summary?.top_merchant ? [{ name: summary.top_merchant, value: 100 }] : [];

  if (loading) {
    return (
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '1rem' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem' }}>Analytics</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Deep dive into your financial patterns
        </p>
      </div>

      <div className="page-body">
        {/* Row 1: Bar + Donut */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="chart-container">
            <div className="chart-title"><span>Monthly Income vs Expenses</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyBar} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#0052FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <div className="chart-title"><span>Expense Categories</span></div>
            <CategoryDonutChart data={summary?.category_breakdown || {}} />
          </div>
        </div>

        {/* Row 2: Radar + Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="chart-container">
            <div className="chart-title"><span>Category Radar</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar name="Spending" dataKey="value" stroke="#0052FF" fill="#0052FF" fillOpacity={0.2} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <div className="chart-title"><span>Financial Health Score</span></div>
            <HealthScore summary={summary} />
          </div>
        </div>

        {/* Row 3: Recurring + Day-of-week */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="chart-container">
            <div className="chart-title"><span>Recurring Charges</span></div>
            <RecurringList items={summary?.recurring_charges || []} />
          </div>
          <div className="chart-container">
            <div className="chart-title"><span>Weekday vs Weekend Breakdown</span></div>
            <WeekdayBreakdown data={summary?.weekday_vs_weekend} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthScore({ summary }: { summary: any }) {
  if (!summary) return null;
  const savingsRate = summary.savings_rate || 0;
  const score = Math.min(100, Math.max(0,
    savingsRate * 1.5 + (summary.transaction_count > 10 ? 20 : 0) - (summary.avg_daily_spend > 100 ? 10 : 0)
  ));
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--accent)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';

  const metrics = [
    { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, good: savingsRate >= 20 },
    { label: 'Avg Daily Spend', value: `$${summary.avg_daily_spend?.toFixed(0)}`, good: summary.avg_daily_spend < 80 },
    { label: 'Income Coverage', value: summary.total_income > summary.total_expense ? '' : '', good: summary.total_income > summary.total_expense },
    { label: 'Has Recurring', value: summary.recurring_charges?.length > 0 ? `${summary.recurring_charges.length} found` : 'None', good: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color, lineHeight: 1 }}>{Math.round(score)}</div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color, marginTop: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Financial Health Score</div>
        <div className="progress" style={{ marginTop: '0.75rem', height: '8px' }}>
          <div className="progress-fill" style={{
            width: `${score}%`,
            background: score >= 80 ? 'linear-gradient(to right, #10B981, #059669)' :
                        score >= 60 ? 'var(--gradient)' :
                        score >= 40 ? 'linear-gradient(to right, #F59E0B, #D97706)' :
                        'linear-gradient(to right, #F59E0B, #EF4444)',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--muted)', borderRadius: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{m.label}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: m.good ? 'var(--success)' : 'var(--warning)' }}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecurringList({ items }: { items: Array<{ description: string; amount: number; category: string }> }) {
  if (items.length === 0) return <div className="empty-state"><p>No recurring charges found</p></div>;
  const total = items.reduce((s, i) => s + i.amount, 0);
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: 'var(--muted)', borderRadius: '0.625rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.description}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{item.category}</div>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>${item.amount.toFixed(2)}/mo</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.875rem', padding: '0.75rem', background: 'rgba(0,82,255,0.05)', borderRadius: '0.625rem', border: '1px solid rgba(0,82,255,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Total recurring/month</span>
          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function WeekdayBreakdown({ data }: { data?: { weekday: number; weekend: number } }) {
  if (!data) return <div className="empty-state"><p>No data</p></div>;
  const total = data.weekday + data.weekend;
  if (total === 0) return <div className="empty-state"><p>No spending data</p></div>;

  const days = [
    { label: 'MonFri', amount: data.weekday, pct: Math.round(data.weekday / total * 100), color: '#0052FF' },
    { label: 'SatSun', amount: data.weekend, pct: Math.round(data.weekend / total * 100), color: '#F59E0B' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
      {days.map((d) => (
        <div key={d.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{d.label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>${d.amount.toFixed(0)} ({d.pct}%)</span>
          </div>
          <div className="progress">
            <div className="progress-fill" style={{ width: `${d.pct}%`, background: d.color }} />
          </div>
        </div>
      ))}
      <div style={{ padding: '0.875rem', background: 'var(--muted)', borderRadius: '0.75rem', fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
        {data.weekend / total > 0.4
          ? ' You tend to overspend on weekends. Consider setting a weekend spending cap.'
          : ' Great discipline  your weekend spending is well-balanced.'}
      </div>
    </div>
  );
}
