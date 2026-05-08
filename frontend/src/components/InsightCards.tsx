'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Insight {
  type: string;
  icon: string;
  title: string;
  description: string;
  severity: 'success' | 'warning' | 'danger' | 'info';
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

export default function InsightCards() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/insights/behavioral')
      .then(({ data }) => setInsights(data.insights || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="chart-container">
      <div className="chart-title">
        <span>Behavioral Insights</span>
        <Link href="/dashboard/ai" className="btn btn-ghost btn-sm">Full Analysis </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '4rem', borderRadius: '0.75rem' }} />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="empty-state">
          <p>Add transactions to unlock behavioral insights</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {insights.map((insight, i) => (
            <div key={i} className="insight-card">
              <div className="insight-icon">{insight.icon}</div>
              <div className="insight-content">
                <div className="insight-title">{insight.title}</div>
                <div className="insight-desc">{insight.description}</div>
              </div>
              <div>
                <span className={`badge severity-${insight.severity}`}>{insight.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
