'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Debt {
  id: number;
  name: string;
  balance: number;
  interest_rate: number;
  minimum_payment: number;
  color: string;
}

export default function DebtManagerPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDebt, setNewDebt] = useState({ name: '', balance: '', interest_rate: '', minimum_payment: '', color: '#EF4444' });

  // Payoff scenario
  const [strategy, setStrategy] = useState('avalanche');
  const [extraPayment, setExtraPayment] = useState('0');
  const [scenario, setScenario] = useState<{ months: number, total_interest: number, schedule: any[] } | null>(null);

  useEffect(() => {
    fetchDebts();
  }, []);

  useEffect(() => {
    if (debts.length > 0) {
      calculatePayoff();
    }
  }, [debts, strategy, extraPayment]);

  const fetchDebts = async () => {
    try {
      const { data } = await api.get('/debts');
      setDebts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayoff = async () => {
    try {
      const { data } = await api.get(`/debts/payoff-strategy?strategy=${strategy}&extra_payment=${parseFloat(extraPayment) || 0}`);
      setScenario(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/debts', {
        ...newDebt,
        balance: parseFloat(newDebt.balance),
        interest_rate: parseFloat(newDebt.interest_rate),
        minimum_payment: parseFloat(newDebt.minimum_payment)
      });
      setShowModal(false);
      fetchDebts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this debt?')) return;
    try {
      await api.delete(`/debts/${id}`);
      fetchDebts();
    } catch (error) {
      console.error(error);
    }
  };

  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Debt Payoff Manager</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Visualize the fastest path to becoming debt-free.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Debt</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Balance</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>${totalBalance.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Time to Debt-Free</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {scenario ? `${Math.floor(scenario.months / 12)}y ${scenario.months % 12}m` : 'N/A'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Interest to Pay</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>
            ${scenario?.total_interest.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="chart-title">
            <span>Payoff Trajectory</span>
          </div>
          {scenario && scenario.schedule.length > 0 ? (
            <div style={{ height: 300, marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scenario.schedule}>
                  <XAxis dataKey="month" tickFormatter={val => `Mo ${val}`} stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" tickFormatter={val => `$${val}`} />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    labelFormatter={label => `Month ${label}`}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} 
                  />
                  <Area type="monotone" dataKey="total_balance" stroke="var(--danger)" fill="rgba(239, 68, 68, 0.2)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
              No debts added yet.
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Strategy Controls</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Payoff Method</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`btn ${strategy === 'avalanche' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setStrategy('avalanche')}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
              >
                Avalanche (Highest APR)
              </button>
              <button 
                className={`btn ${strategy === 'snowball' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setStrategy('snowball')}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
              >
                Snowball (Lowest Bal)
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
              {strategy === 'avalanche' 
                ? 'Avalanche saves the most money on interest by tackling highest rates first.' 
                : 'Snowball builds psychological momentum by eliminating small debts first.'}
            </p>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Extra Monthly Payment</label>
            <input 
              type="number" 
              className="input" 
              placeholder="e.g. 100" 
              value={extraPayment} 
              onChange={e => setExtraPayment(e.target.value)} 
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
              How much extra can you put towards debt each month on top of minimums?
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Your Debts</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Balance</th>
                <th>Interest Rate (APR)</th>
                <th>Min Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {debts.map(debt => (
                <tr key={debt.id}>
                  <td style={{ fontWeight: 600 }}>{debt.name}</td>
                  <td>${debt.balance.toFixed(2)}</td>
                  <td>{debt.interest_rate}%</td>
                  <td>${debt.minimum_payment.toFixed(2)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(debt.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {debts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                    No debts tracked. You're doing great!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Add Debt</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <input type="text" className="input" placeholder="Account Name (e.g. Chase Sapphire)" value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} required />
              <input type="number" className="input" placeholder="Current Balance" step="0.01" value={newDebt.balance} onChange={e => setNewDebt({...newDebt, balance: e.target.value})} required />
              <input type="number" className="input" placeholder="Interest Rate (%)" step="0.01" value={newDebt.interest_rate} onChange={e => setNewDebt({...newDebt, interest_rate: e.target.value})} required />
              <input type="number" className="input" placeholder="Minimum Monthly Payment" step="0.01" value={newDebt.minimum_payment} onChange={e => setNewDebt({...newDebt, minimum_payment: e.target.value})} required />
              
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
