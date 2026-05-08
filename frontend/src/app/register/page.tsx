'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to SpendSense ');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
            <span className="gradient-text">SpendSense</span>
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
            AI-Powered Financial Behavior Analyzer
          </p>
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>
            Create your account
          </h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="input" placeholder="Alex Johnson" value={form.name} onChange={update('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={update('password')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className={`input ${error.includes('match') ? 'input-error' : ''}`}
              type="password"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={update('confirm')}
              required
            />
          </div>

          {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '3rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />Creating account...</>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textAlign: 'center', marginTop: '1.25rem' }}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
