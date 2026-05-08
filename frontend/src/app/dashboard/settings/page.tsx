'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    currency: user?.currency || 'USD',
    monthly_budget: String(user?.monthly_budget || ''),
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser({
        name: form.name,
        currency: form.currency,
        monthly_budget: form.monthly_budget ? parseFloat(form.monthly_budget) : null,
      });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'MXN'];

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem' }}>Settings</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Manage your profile and preferences
        </p>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Profile */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               Profile Settings
            </h3>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '4rem', height: '4rem', borderRadius: '50%',
                background: 'var(--gradient)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'white',
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 600 }}>{user?.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{user?.email}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '0.15rem' }}>
                  Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="input" value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}>
                  {currencies.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Budget ($)  optional</label>
                <input className="input" type="number" placeholder="e.g. 3000" value={form.monthly_budget} onChange={(e) => setForm(f => ({ ...f, monthly_budget: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}> Account Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  ['Email', user?.email || ''],
                  ['Account ID', `#${user?.id}`],
                  ['Currency', user?.currency || 'USD'],
                  ['Monthly Budget', user?.monthly_budget ? `$${user.monthly_budget.toLocaleString()}` : 'Not set'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              <h3 style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}> Danger Zone</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1rem', lineHeight: 1.6 }}>
                Signing out will clear your local session. Your data remains safe in the database.
              </p>
              <button className="btn btn-danger" style={{ width: '100%' }} onClick={logout}>
                 Sign Out
              </button>
            </div>

            <div className="card" style={{ background: 'var(--foreground)', color: 'white' }}>
              <h3 style={{ color: 'white', marginBottom: '0.75rem' }}> Data Privacy</h3>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                All your financial data is stored securely in a PostgreSQL database. Your transactions are private and never shared. AI analysis is performed using temporary context  no data is retained by OpenAI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
