'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { CATEGORIES, CATEGORY_COLORS, formatDate } from '@/lib/constants';
import toast from 'react-hot-toast';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  category: string;
  description: string;
  merchant: string | null;
  date: string;
  notes: string | null;
  is_recurring: boolean;
  tags: string | null;
}

const EMPTY_FORM = {
  amount: '', type: 'expense', category: 'Food & Dining',
  description: '', merchant: '', date: new Date().toISOString().slice(0, 10),
  notes: '', is_recurring: false, tags: '',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ category: '', type: '', search: '' });
  const [scanning, setScanning] = useState(false);
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params: any = { limit: 100 };
    if (filters.category) params.category = filters.category;
    if (filters.type) params.type = filters.type;
    if (filters.search) params.search = filters.search;
    try {
      const { data } = await api.get('/transactions/', { params });
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const openAdd = () => {
    setEditTx(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setForm({
      amount: String(tx.amount), type: tx.type, category: tx.category,
      description: tx.description, merchant: tx.merchant || '',
      date: tx.date, notes: tx.notes || '', is_recurring: tx.is_recurring, tags: tx.tags || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount) };
    try {
      if (editTx) {
        await api.patch(`/transactions/${editTx.id}`, payload);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions/', payload);
        toast.success('Transaction added');
      }
      setShowModal(false);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.loading('Analyzing receipt...', { id: 'scan-toast' });
      const { data } = await api.post('/transactions/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setForm(f => ({
        ...f,
        amount: String(data.amount),
        merchant: data.merchant || f.merchant,
        date: data.date || f.date,
        category: data.category || f.category,
        description: data.description || f.description,
      }));
      toast.success('Receipt parsed successfully!', { id: 'scan-toast' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to parse receipt', { id: 'scan-toast' });
    } finally {
      setScanning(false);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const updateForm = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem' }}>Transactions</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {transactions.length} records  Income ${totalIncome.toFixed(0)}  Expenses ${totalExpense.toFixed(0)}
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Transaction
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ maxWidth: '220px' }}
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
          <select className="input" style={{ maxWidth: '180px' }} value={filters.category}
            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input" style={{ maxWidth: '140px' }} value={filters.type}
            onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {(filters.search || filters.category || filters.type) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ category: '', type: '', search: '' })}>
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '3rem' }} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>No Transactions</div>
              <p>No transactions found.</p>
              <button className="btn btn-primary" onClick={openAdd}>Add your first transaction</button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatDate(tx.date)}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tx.description}</div>
                      {tx.merchant && <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{tx.merchant}</div>}
                      {tx.is_recurring && <span className="badge badge-neutral" style={{ marginTop: '0.2rem' }}> Recurring</span>}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500,
                        background: `${CATEGORY_COLORS[tx.category] || '#94A3B8'}18`,
                        color: CATEGORY_COLORS[tx.category] || '#64748B',
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: CATEGORY_COLORS[tx.category] || '#94A3B8', flexShrink: 0 }} />
                        {tx.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'income' ? 'var(--success)' : 'var(--foreground)' }}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(tx)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tx.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editTx ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Close</button>
            </div>

            {!editTx && (
              <div style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
                <div style={{ 
                  background: 'var(--muted)', padding: '1rem', borderRadius: '0.75rem', 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px dashed var(--border)' 
                }}>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Scan Receipt</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Auto-fill from a photo using AI</p>
                  </div>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    {scanning ? 'Scanning...' : 'Upload Image'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleScanReceipt} disabled={scanning} />
                  </label>
                </div>
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount *</label>
                  <input className="input" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={updateForm('amount')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="input" value={form.type} onChange={updateForm('type')}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description *</label>
                  <input className="input" placeholder="What was this for?" value={form.description} onChange={updateForm('description')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input" value={form.category} onChange={updateForm('category')}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="input" type="date" value={form.date} onChange={updateForm('date')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Merchant</label>
                  <input className="input" placeholder="Where?" value={form.merchant} onChange={updateForm('merchant')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input className="input" placeholder="work, reimbursable" value={form.tags} onChange={updateForm('tags')} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="input" placeholder="Optional notes" value={form.notes} onChange={updateForm('notes')} rows={2} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="recurring" checked={form.is_recurring} onChange={updateForm('is_recurring')} style={{ width: '1rem', height: '1rem' }} />
                  <label htmlFor="recurring" style={{ fontSize: '0.875rem', cursor: 'pointer' }}> Recurring transaction (subscription, bill)</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editTx ? 'Update' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
