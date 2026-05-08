'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  type Subscription,
  BILLING_PERIOD_OPTIONS,
  emptySubscriptionForm,
  subscriptionToForm,
  type SubscriptionFormState,
} from '@/types/subscription';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSub, setNewSub] = useState<SubscriptionFormState>(emptySubscriptionForm());
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState<SubscriptionFormState>(emptySubscriptionForm());

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data } = await api.get<Subscription[]>('/subscriptions');
      setSubscriptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions', {
        name: newSub.name,
        amount: parseFloat(newSub.amount),
        billing_period: newSub.billing_period,
        next_billing_date: newSub.next_billing_date,
        category: newSub.category || null,
      });
      setShowModal(false);
      setNewSub(emptySubscriptionForm());
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
    }
  };

  const openEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setEditForm(subscriptionToForm(sub));
  };

  const handleDelete = async (sub: Subscription) => {
    if (!window.confirm(`Delete subscription “${sub.name}”? This cannot be undone.`)) return;
    try {
      await api.delete(`/subscriptions/${sub.id}`);
      if (editingSub?.id === sub.id) setEditingSub(null);
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    try {
      await api.put(`/subscriptions/${editingSub.id}`, {
        name: editForm.name,
        amount: parseFloat(editForm.amount),
        billing_period: editForm.billing_period,
        next_billing_date: editForm.next_billing_date,
        is_active: editForm.is_active,
        category: editForm.category || null,
      });
      setEditingSub(null);
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
    }
  };

  const totalMonthly = subscriptions.filter((s) => s.is_active).reduce((acc, curr) => {
    const a = curr.amount;
    if (curr.billing_period === 'yearly') return acc + a / 12;
    if (curr.billing_period === 'weekly') return acc + (a * 52) / 12;
    return acc + a;
  }, 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Subscriptions Tracker</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Manage your recurring payments and bills</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Subscription
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Monthly Cost</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>${totalMonthly.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Subscriptions</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {subscriptions.filter((s) => s.is_active).length}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Amount</th>
                <th>Billing</th>
                <th>Next Bill</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600 }}>{sub.name}</td>
                  <td>${sub.amount.toFixed(2)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{sub.billing_period}</td>
                  <td>{new Date(sub.next_billing_date).toLocaleDateString()}</td>
                  <td>
                    <span
                      className="badge"
                      style={{ background: sub.is_active ? 'var(--success)' : 'var(--muted-foreground)' }}
                    >
                      {sub.is_active ? 'Active' : 'Cancelled'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(sub)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: '0.35rem' }}
                      onClick={() => handleDelete(sub)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Add Subscription</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <input
                type="text"
                className="input"
                placeholder="Service Name (e.g. Netflix)"
                value={newSub.name}
                onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                required
              />
              <input
                type="number"
                className="input"
                placeholder="Amount"
                step="0.01"
                value={newSub.amount}
                onChange={(e) => setNewSub({ ...newSub, amount: e.target.value })}
                required
              />
              <select
                className="input"
                value={newSub.billing_period}
                onChange={(e) =>
                  setNewSub({ ...newSub, billing_period: e.target.value as SubscriptionFormState['billing_period'] })
                }
              >
                {BILLING_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="input"
                value={newSub.next_billing_date}
                onChange={(e) => setNewSub({ ...newSub, next_billing_date: e.target.value })}
                required
              />
              <input
                type="text"
                className="input"
                placeholder="Category (e.g. Entertainment)"
                value={newSub.category}
                onChange={(e) => setNewSub({ ...newSub, category: e.target.value })}
              />

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save
                </button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSub && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Edit subscription</h2>
            <form
              onSubmit={handleEditSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}
            >
              <input
                type="text"
                className="input"
                placeholder="Service Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
              <input
                type="number"
                className="input"
                placeholder="Amount"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                required
              />
              <select
                className="input"
                value={editForm.billing_period}
                onChange={(e) =>
                  setEditForm({ ...editForm, billing_period: e.target.value as SubscriptionFormState['billing_period'] })
                }
              >
                {BILLING_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="input"
                value={editForm.next_billing_date}
                onChange={(e) => setEditForm({ ...editForm, next_billing_date: e.target.value })}
                required
              />
              <input
                type="text"
                className="input"
                placeholder="Category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                />
                Active subscription
              </label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save changes
                </button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingSub(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
