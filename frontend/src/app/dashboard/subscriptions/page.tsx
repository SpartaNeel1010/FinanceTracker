'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  type Subscription,
  BILLING_PERIOD_OPTIONS,
  emptySubscriptionForm,
  subscriptionToForm,
  type SubscriptionFormState,
} from '@/types/subscription';

function apiErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((d: { msg?: string }) => d.msg).filter(Boolean);
    if (parts.length) return parts.join(', ');
  }
  return fallback;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSub, setNewSub] = useState<SubscriptionFormState>(emptySubscriptionForm());
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState<SubscriptionFormState>(emptySubscriptionForm());
  const [savingAdd, setSavingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<number | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (savingAdd || savingEdit || rowBusyId != null) return;
      if (editingSub) setEditingSub(null);
      else if (showModal) setShowModal(false);
    };
    if (showModal || editingSub) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [showModal, editingSub, savingAdd, savingEdit, rowBusyId]);

  const fetchSubscriptions = async () => {
    try {
      const { data } = await api.get<Subscription[]>('/subscriptions');
      setSubscriptions(data);
    } catch (error) {
      console.error(error);
      toast.error(apiErrorMessage(error, 'Failed to load subscriptions'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdd(true);
    try {
      await api.post('/subscriptions', {
        name: newSub.name,
        amount: parseFloat(newSub.amount),
        billing_period: newSub.billing_period,
        next_billing_date: newSub.next_billing_date,
        category: newSub.category || null,
      });
      toast.success('Subscription added');
      setShowModal(false);
      setNewSub(emptySubscriptionForm());
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error(apiErrorMessage(error, 'Failed to add subscription'));
    } finally {
      setSavingAdd(false);
    }
  };

  const openEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setEditForm(subscriptionToForm(sub));
  };

  const handleToggleActive = async (sub: Subscription) => {
    setRowBusyId(sub.id);
    try {
      await api.put(`/subscriptions/${sub.id}`, { is_active: !sub.is_active });
      toast.success(sub.is_active ? 'Subscription paused' : 'Subscription resumed');
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error(apiErrorMessage(error, 'Failed to update status'));
    } finally {
      setRowBusyId(null);
    }
  };

  const handleDelete = async (sub: Subscription) => {
    if (!window.confirm(`Delete subscription “${sub.name}”? This cannot be undone.`)) return;
    setRowBusyId(sub.id);
    try {
      await api.delete(`/subscriptions/${sub.id}`);
      toast.success('Subscription deleted');
      if (editingSub?.id === sub.id) setEditingSub(null);
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error(apiErrorMessage(error, 'Failed to delete'));
    } finally {
      setRowBusyId(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setSavingEdit(true);
    try {
      await api.put(`/subscriptions/${editingSub.id}`, {
        name: editForm.name,
        amount: parseFloat(editForm.amount),
        billing_period: editForm.billing_period,
        next_billing_date: editForm.next_billing_date,
        is_active: editForm.is_active,
        category: editForm.category || null,
      });
      toast.success('Subscription updated');
      setEditingSub(null);
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
      toast.error(apiErrorMessage(error, 'Failed to update subscription'));
    } finally {
      setSavingEdit(false);
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
        <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)} aria-haspopup="dialog">
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
        ) : subscriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              No subscriptions yet. Add recurring bills and services to track monthly cost.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setShowModal(true)} aria-haspopup="dialog">
              Add your first subscription
            </button>
          </div>
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
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={rowBusyId === sub.id}
                      onClick={() => handleToggleActive(sub)}
                      aria-label={sub.is_active ? `Pause ${sub.name}` : `Resume ${sub.name}`}
                    >
                      {rowBusyId === sub.id ? '…' : sub.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={rowBusyId === sub.id}
                      onClick={() => openEdit(sub)}
                      aria-label={`Edit ${sub.name}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: '0.35rem' }}
                      disabled={rowBusyId === sub.id}
                      onClick={() => handleDelete(sub)}
                      aria-label={`Delete ${sub.name}`}
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
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-add-title"
          >
            <h2 id="subscription-add-title">Add Subscription</h2>
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
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingAdd}>
                  {savingAdd ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  disabled={savingAdd}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSub && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-edit-title"
          >
            <h2 id="subscription-edit-title">Edit subscription</h2>
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
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingEdit}>
                  {savingEdit ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  disabled={savingEdit}
                  onClick={() => setEditingSub(null)}
                >
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
