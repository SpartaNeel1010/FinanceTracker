'use client';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { CATEGORIES, SAMPLE_TRANSACTIONS } from '@/lib/constants';
import toast from 'react-hot-toast';

function parseCSV(text: string) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });

    // Normalize to our schema
    return {
      amount: parseFloat(obj.amount || obj.debit || obj.credit || '0') || 0,
      type: obj.type || (parseFloat(obj.credit || '0') > 0 ? 'income' : 'expense'),
      category: CATEGORIES.includes(obj.category) ? obj.category : 'Other',
      description: obj.description || obj.memo || obj.name || 'Imported',
      merchant: obj.merchant || obj.payee || null,
      date: obj.date || new Date().toISOString().slice(0, 10),
      notes: obj.notes || null,
      is_recurring: false,
      tags: null,
    };
  }).filter(t => t.amount > 0);
}

export default function ImportPage() {
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(0);

  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
      toast.success(`Parsed ${parsed.length} transactions from CSV`);
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleImport = async (data: any[]) => {
    setImporting(true);
    try {
      const { data: res } = await api.post('/transactions/import/bulk', { transactions: data });
      setSuccess(res.imported);
      setPreview([]);
      toast.success(`Successfully imported ${res.imported} transactions!`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const loadSample = async () => {
    try {
      const { data } = await api.post('/transactions/import/bulk', { transactions: SAMPLE_TRANSACTIONS });
      toast.success(`Loaded ${data.imported} sample transactions!`);
    } catch (err: any) {
      toast.error('Failed to load sample data');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '1.75rem' }}>Import Data</h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Upload your transaction history or load sample data to explore
        </p>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Upload CSV */}
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '1rem' }}> Upload CSV File</h3>
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '0.875rem',
                  padding: '2.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragActive ? 'rgba(0,82,255,0.04)' : 'var(--muted)',
                  transition: 'all 0.2s',
                }}
              >
                <input {...getInputProps()} />
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                  {isDragActive ? '' : ''}
                </div>
                <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                  {isDragActive ? 'Drop your CSV here' : 'Drag & drop a CSV file'}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                  or click to browse  .csv files only
                </p>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--muted)', borderRadius: '0.625rem', fontSize: '0.8rem', lineHeight: 1.6 }}>
                <strong>Expected columns:</strong> date, description, amount, category, type, merchant<br />
                <span style={{ color: 'var(--muted-foreground)' }}>
                  Compatible with most bank exports and Mint, YNAB, Personal Capital CSV formats.
                </span>
              </div>
            </div>

            {preview.length > 0 && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Preview  {preview.length} transactions</h3>
                  <button className="btn btn-primary" onClick={() => handleImport(preview)} disabled={importing}>
                    {importing ? 'Importing...' : `Import ${preview.length}`}
                  </button>
                </div>
                <div className="table-wrap" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 20).map((t, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: '0.8rem' }}>{t.date}</td>
                          <td style={{ fontSize: '0.875rem' }}>{t.description}</td>
                          <td><span className="tag">{t.category}</span></td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${t.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                      {preview.length > 20 && (
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>...and {preview.length - 20} more</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sample Data */}
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}> Load Sample Data</h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Don&apos;t have a CSV? Load our pre-built sample dataset with realistic transactions across multiple categories and months.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {[
                  ['24 transactions', 'Across multiple months'],
                  ['Multiple categories', 'Housing, Food, Travel & more'],
                  ['Recurring charges', 'Rent, Netflix, Spotify'],
                  ['Income entries', 'Salary + freelance'],
                ].map(([a, b]) => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                    <span style={{ fontWeight: 500 }}>{a}</span>
                    <span style={{ color: 'var(--muted-foreground)' }}> {b}</span>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={loadSample}>
                 Load Sample Dataset
              </button>
            </div>

            <div className="card" style={{ background: 'var(--foreground)', color: 'white' }}>
              <h3 style={{ color: 'white', marginBottom: '0.75rem' }}> CSV Format Guide</h3>
              <pre style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.7)', lineHeight: 1.7,
                background: 'rgba(255,255,255,0.05)', padding: '0.875rem',
                borderRadius: '0.5rem', overflow: 'auto',
              }}>
{`date,description,amount,type,category,merchant
2024-01-01,Monthly Rent,1200,expense,Housing,Landlord
2024-01-05,Salary,5000,income,Income,Employer
2024-01-10,Netflix,15,expense,Subscriptions,Netflix
2024-01-12,Groceries,85,expense,Food & Dining,Whole Foods`}
              </pre>
            </div>
          </div>
        </div>

        {success > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(16,185,129,0.08)', borderRadius: '0.875rem', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Success</div>
            <p style={{ fontWeight: 600, color: 'var(--success)' }}>
              Successfully imported {success} transactions!
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
              Head to <a href="/dashboard" style={{ color: 'var(--accent)' }}>Dashboard</a> or{' '}
              <a href="/dashboard/ai" style={{ color: 'var(--accent)' }}>AI Insights</a> to analyze your data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
