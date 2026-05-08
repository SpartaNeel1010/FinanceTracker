'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Subscription {
  id: number;
  name: string;
  amount: number;
  billing_period: string;
  next_billing_date: string;
  is_active: boolean;
  category: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', amount: '', billing_period: 'monthly', next_billing_date: '', category: '' });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data } = await api.get('/subscriptions');
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
        ...newSub,
        amount: parseFloat(newSub.amount)
      });
      setShowModal(false);
      fetchSubscriptions();
    } catch (error) {
      console.error(error);
    }
  };

  const totalMonthly = subscriptions
    .filter(s => s.is_active)
    .reduce((acc, curr) => acc + (curr.billing_period === 'yearly' ? curr.amount / 12 : curr.amount), 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Subscriptions Tracker</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Manage your recurring payments and bills</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Subscription</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Monthly Cost</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>${totalMonthly.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Subscriptions</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{subscriptions.filter(s => s.is_active).length}</div>
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
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 600 }}>{sub.name}</td>
                  <td>${sub.amount.toFixed(2)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{sub.billing_period}</td>
                  <td>{new Date(sub.next_billing_date).toLocaleDateString()}</td>
                  <td>
                    <span className="badge" style={{ background: sub.is_active ? 'var(--success)' : 'var(--muted-foreground)' }}>
                      {sub.is_active ? 'Active' : 'Cancelled'}
                    </span>
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
              <input type="text" className="input" placeholder="Service Name (e.g. Netflix)" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} required />
              <input type="number" className="input" placeholder="Amount" step="0.01" value={newSub.amount} onChange={e => setNewSub({...newSub, amount: e.target.value})} required />
              <select className="input" value={newSub.billing_period} onChange={e => setNewSub({...newSub, billing_period: e.target.value})}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
              <input type="date" className="input" value={newSub.next_billing_date} onChange={e => setNewSub({...newSub, next_billing_date: e.target.value})} required />
              <input type="text" className="input" placeholder="Category (e.g. Entertainment)" value={newSub.category} onChange={e => setNewSub({...newSub, category: e.target.value})} />
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
