'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import toast from 'react-hot-toast';

interface Budget {
  id: number;
  category: string;
  amount: number;
  period: string;
  month: number | null;
  year: number | null;
}

interface BudgetVsActual {
  category: string;
  budget: number;
  actual: number;
  remaining: number;
  percentage: number;
}

const NOW = new Date();

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [vsActual, setVsActual] = useState<BudgetVsActual[]>([]);
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year, setYear] = useState(NOW.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: CATEGORIES[0], amount: '', period: 'monthly', month: NOW.getMonth() + 1, year: NOW.getFullYear() });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [b, va] = await Promise.all([
        api.get('/budgets/'),
        api.get(`/budgets/vs-actual?month=${month}&year=${year}`),
      ]);
      setBudgets(b.data);
      setVsActual(va.data.data);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/budgets/', { ...form, amount: parseFloat(form.amount) });
      toast.success('Budget saved!');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem' }}>Budgets</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Set and track your spending limits by category
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Set Budget</button>
        </div>
      </div>

      <div className="page-body">
        {/* Month selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Comparing for:</span>
          <select className="input" style={{ maxWidth: '130px' }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="input" style={{ maxWidth: '100px' }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '5rem', borderRadius: '0.875rem' }} />
            ))}
          </div>
        ) : vsActual.length === 0 ? (
          <div className="empty-state">
            <div style={{ marginTop: '1rem' }}></div>
            <p>No budgets set for this period.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Set your first budget</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {vsActual.map((item) => {
              const pct = Math.min(item.percentage, 100);
              const isOver = item.actual > item.budget && item.budget > 0;
              const isWarning = pct > 80 && !isOver;

              return (
                <div key={item.category} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.category}
                        {isOver && <span className="badge severity-danger">Over Budget</span>}
                        {isWarning && <span className="badge severity-warning">Near Limit</span>}
                        {!isOver && !isWarning && item.budget > 0 && <span className="badge severity-success">On Track</span>}
                        {item.budget === 0 && <span className="badge badge-neutral">No Budget Set</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: isOver ? 'var(--danger)' : 'var(--foreground)' }}>
                        ${item.actual.toFixed(0)}
                      </span>
                      {item.budget > 0 && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                          {' '}/ ${item.budget.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.budget > 0 && (
                    <div>
                      <div className="progress" style={{ height: '8px', marginBottom: '0.375rem' }}>
                        <div
                          className={`progress-fill ${isOver ? 'danger' : isWarning ? '' : 'success'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        <span>{pct.toFixed(0)}% used</span>
                        <span>{isOver ? `$${Math.abs(item.remaining).toFixed(0)} over` : `$${item.remaining.toFixed(0)} remaining`}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Existing budgets list */}
        {budgets.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Manage Budgets</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Period</th>
                    <th>Month/Year</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((b) => (
                    <tr key={b.id}>
                      <td>{b.category}</td>
                      <td style={{ fontWeight: 600 }}>${b.amount.toFixed(0)}</td>
                      <td>{b.period}</td>
                      <td>{b.month && b.year ? `${months[b.month - 1]} ${b.year}` : 'All time'}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Set Budget</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Budget Amount ($)</label>
                  <input className="input" type="number" step="1" placeholder="e.g. 500" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Month</label>
                    <select className="input" value={form.month} onChange={(e) => setForm(f => ({ ...f, month: Number(e.target.value) }))}>
                      {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select className="input" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: Number(e.target.value) }))}>
                      {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
