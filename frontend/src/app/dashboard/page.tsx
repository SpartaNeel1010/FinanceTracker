'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/constants';
import SpendingTrendChart from '@/components/charts/SpendingTrendChart';
import CategoryDonutChart from '@/components/charts/CategoryDonutChart';
import CalendarHeatmap from '@/components/charts/CalendarHeatmap';
import RecentTransactions from '@/components/RecentTransactions';
import InsightCards from '@/components/InsightCards';

interface Summary {
  total_income: number;
  total_expense: number;
  net_savings: number;
  savings_rate: number;
  transaction_count: number;
  category_breakdown: Record<string, number>;
  monthly_totals: Record<string, { income: number; expense: number }>;
  daily_spending: Record<string, number>;
  weekday_vs_weekend: { weekday: number; weekend: number };
  avg_daily_spend: number;
  recurring_charges: Array<{ description: string; amount: number; category: string }>;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/transactions/stats/summary');
      setSummary(data);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const currency = user?.currency || 'USD';
  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-badge" style={{ marginBottom: '0.75rem' }}>
              <div className="dot" />
              <span>Live Overview</span>
            </div>
            <h1 style={{ fontSize: '1.75rem' }}>
              Good {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 
            </h1>
            <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              Here's your financial picture at a glance.
            </p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Stats Row */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard
            label="Total Income"
            value={loading ? null : fmt(summary?.total_income || 0)}
            icon=""
            color="var(--success)"
            bg="rgba(16,185,129,0.1)"
            sub={`${summary?.transaction_count || 0} transactions`}
          />
          <StatCard
            label="Total Expenses"
            value={loading ? null : fmt(summary?.total_expense || 0)}
            icon=""
            color="var(--danger)"
            bg="rgba(239,68,68,0.1)"
            sub={`avg ${fmt(summary?.avg_daily_spend || 0)}/day`}
          />
          <StatCard
            label="Net Savings"
            value={loading ? null : fmt(summary?.net_savings || 0)}
            icon=""
            color="var(--accent)"
            bg="rgba(0,82,255,0.1)"
            sub={`${summary?.savings_rate || 0}% savings rate`}
            gradient
          />
          <StatCard
            label="Weekly Avg"
            value={loading ? null : fmt((summary?.avg_daily_spend || 0) * 7)}
            icon=""
            color="var(--warning)"
            bg="rgba(245,158,11,0.1)"
            sub={`weekend: ${fmt(summary?.weekday_vs_weekend?.weekend || 0)}`}
          />
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="chart-container">
            <div className="chart-title">
              <span>Spending Over Time</span>
              <div className="section-badge"><span>Monthly</span></div>
            </div>
            {loading ? <ChartSkeleton height={280} /> : (
              <SpendingTrendChart data={summary?.monthly_totals || {}} />
            )}
          </div>
          <div className="chart-container">
            <div className="chart-title">
              <span>Category Breakdown</span>
            </div>
            {loading ? <ChartSkeleton height={280} /> : (
              <CategoryDonutChart data={summary?.category_breakdown || {}} />
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="chart-container">
            <div className="chart-title">
              <span>Daily Spending Heatmap</span>
              <div className="section-badge"><span>30 Days</span></div>
            </div>
            {loading ? <ChartSkeleton height={200} /> : (
              <CalendarHeatmap data={summary?.daily_spending || {}} />
            )}
          </div>
          <div className="chart-container">
            <div className="chart-title"><span>Weekday vs Weekend Spending</span></div>
            <WeekdayChart data={summary?.weekday_vs_weekend} />
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem' }}>
          <RecentTransactions />
          <InsightCards />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg, sub, gradient }: {
  label: string; value: string | null; icon: string;
  color: string; bg: string; sub?: string; gradient?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      </div>
      <div>
        <div className="stat-label">{label}</div>
        {value === null ? (
          <div className="skeleton" style={{ height: '1.75rem', width: '8rem', marginTop: '0.25rem' }} />
        ) : (
          <div className="stat-value" style={gradient ? { background: 'var(--gradient-horizontal)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color }}>
            {value}
          </div>
        )}
        {sub && <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{sub}</div>}
      </div>
    </div>
  );
}

function ChartSkeleton({ height }: { height: number }) {
  return <div className="skeleton" style={{ height, borderRadius: '0.5rem' }} />;
}

function WeekdayChart({ data }: { data?: { weekday: number; weekend: number } }) {
  if (!data) return <ChartSkeleton height={200} />;
  const total = data.weekday + data.weekend;
  const wdPct = total > 0 ? Math.round(data.weekday / total * 100) : 50;
  const wePct = 100 - wdPct;

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{wdPct}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Weekdays</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>${data.weekday.toFixed(0)}</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{wePct}%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Weekends</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>${data.weekend.toFixed(0)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', borderRadius: '0.5rem', overflow: 'hidden', height: '0.75rem' }}>
        <div style={{ width: `${wdPct}%`, background: 'var(--gradient)' }} />
        <div style={{ flex: 1, background: 'rgba(245,158,11,0.6)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>Mon  Fri</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>Sat  Sun</span>
      </div>

      <div style={{ marginTop: '1.5rem', padding: '0.875rem', background: 'var(--muted)', borderRadius: '0.75rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
          {wePct > 40
            ? ` You spend ${wePct}% of your budget on weekends  consider setting a weekend limit.`
            : ` Good balance  weekend spending is under control at ${wePct}%.`}
        </p>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
