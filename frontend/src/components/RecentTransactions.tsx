'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatDate } from '@/lib/constants';
import Link from 'next/link';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
  merchant: string | null;
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/transactions/?limit=8')
      .then(({ data }) => setTransactions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="chart-container">
      <div className="chart-title">
        <span>Recent Transactions</span>
        <Link href="/dashboard/transactions" className="btn btn-ghost btn-sm">View all </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '3rem', borderRadius: '0.5rem' }} />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions yet. <Link href="/dashboard/transactions" style={{ color: 'var(--accent)' }}>Add one!</Link></p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {transactions.map((tx) => (
            <div key={tx.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.625rem 0.75rem', borderRadius: '0.625rem',
              transition: 'background 0.15s', cursor: 'default',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2rem', height: '2rem', borderRadius: '0.5rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                  background: tx.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(0,82,255,0.08)',
                }}>
                  {tx.type === 'income' ? '' : getCategoryEmoji(tx.category)}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{tx.description}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                    {tx.category}  {formatDate(tx.date)}
                  </div>
                </div>
              </div>
              <div style={{
                fontWeight: 700, fontSize: '0.9rem',
                color: tx.type === 'income' ? 'var(--success)' : 'var(--foreground)',
              }}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Housing': '', 'Food & Dining': '', 'Transportation': '',
    'Shopping': '', 'Entertainment': '', 'Healthcare': '',
    'Education': '', 'Travel': '', 'Utilities': '',
    'Insurance': '', 'Personal Care': '', 'Fitness': '',
    'Subscriptions': '', 'Gifts & Donations': '', 'Investments': '',
  };
  return map[category] || '';
}
