'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  category: string | null;
  color: string;
}

const COLORS = ['#0052FF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444', '#06B6D4'];

const EMPTY = { name: '', target_amount: '', current_amount: '0', target_date: '', color: '#0052FF' };

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/goals/');
      setGoals(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const openAdd = () => { setEditGoal(null); setForm({ ...EMPTY }); setShowModal(true); };
  const openEdit = (g: Goal) => {
    setEditGoal(g);
    setForm({ name: g.name, target_amount: String(g.target_amount), current_amount: String(g.current_amount), target_date: g.target_date || '', color: g.color });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount) };
    try {
      if (editGoal) {
        await api.patch(`/goals/${editGoal.id}`, payload);
        toast.success('Goal updated');
      } else {
        await api.post('/goals/', payload);
        toast.success('Goal created! ');
      }
      setShowModal(false);
      fetchGoals();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this goal?')) return;
    await api.delete(`/goals/${id}`);
    toast.success('Goal deleted');
    fetchGoals();
  };

  const daysLeft = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem' }}>Savings Goals</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Track progress toward your financial milestones
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ New Goal</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '1rem' }} />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>No goals</div>
            <h3 style={{ fontFamily: 'var(--font-ui)' }}>No savings goals yet</h3>
            <p>Create your first goal  emergency fund, vacation, down payment...</p>
            <button className="btn btn-primary" onClick={openAdd}>Create a Goal</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {goals.map((goal) => {
              const pct = Math.min(100, goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0);
              const days = daysLeft(goal.target_date);
              const remaining = goal.target_amount - goal.current_amount;

              return (
                <div key={goal.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{
                        width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                        background: goal.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '0.625rem', fontSize: '1.25rem',
                      }}>
                        
                      </div>
                      <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{goal.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(goal)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(goal.id)}>Delete</button>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: goal.color }}>${goal.current_amount.toLocaleString()}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', alignSelf: 'flex-end' }}>of ${goal.target_amount.toLocaleString()}</span>
                    </div>

                    <div className="progress" style={{ height: '10px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: goal.color }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      <span>{pct.toFixed(0)}% complete</span>
                      <span>${remaining.toLocaleString()} to go</span>
                    </div>
                  </div>

                  {days !== null && (
                    <div style={{
                      padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                      background: days < 0 ? 'rgba(239,68,68,0.08)' : days < 30 ? 'rgba(245,158,11,0.08)' : 'var(--muted)',
                      fontSize: '0.78rem',
                      color: days < 0 ? 'var(--danger)' : days < 30 ? 'var(--warning)' : 'var(--muted-foreground)',
                    }}>
                      {days < 0 ? ` Deadline passed ${Math.abs(days)} days ago` : ` ${days} days remaining`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editGoal ? 'Edit Goal' : 'Create Savings Goal'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="form-group">
                  <label className="form-label">Goal Name *</label>
                  <input className="input" placeholder="e.g. Emergency Fund, Vacation" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Target Amount ($) *</label>
                    <input className="input" type="number" step="1" placeholder="10000" value={form.target_amount} onChange={(e) => setForm(f => ({ ...f, target_amount: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current Amount ($)</label>
                    <input className="input" type="number" step="1" placeholder="0" value={form.current_amount} onChange={(e) => setForm(f => ({ ...f, current_amount: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Date (optional)</label>
                  <input className="input" type="date" value={form.target_date} onChange={(e) => setForm(f => ({ ...f, target_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                        style={{
                          width: '2rem', height: '2rem', borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--foreground)' : '2px solid transparent',
                          cursor: 'pointer', transition: 'transform 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editGoal ? 'Update Goal' : 'Create Goal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
