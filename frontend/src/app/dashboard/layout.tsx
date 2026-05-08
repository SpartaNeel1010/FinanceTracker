'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dashboard/transactions', label: 'Transactions', icon: '📝' },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: '🔄' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/budgets', label: 'Budgets', icon: '📊' },
  { href: '/dashboard/goals', label: 'Savings Goals', icon: '🎯' },
  { href: '/dashboard/achievements', label: 'Achievements', icon: '🏆' },
  { href: '/dashboard/ai', label: 'AI Insights', icon: '✨' },
  { href: '/dashboard/chat', label: 'AI Chat', icon: '💬' },
  { href: '/dashboard/import', label: 'Import Data', icon: '📥' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, fetchMe } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      fetchMe();
    }
  }, []);

  if (!user) return null;

  return (
    <div style={{ display: 'flex' }}>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>SpendSense</h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginTop: '0.1rem' }}>
            AI FINANCE ANALYZER
          </p>
        </div>

        <div className="sidebar-nav">
          <p style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', padding: '0 0.875rem', marginBottom: '0.5rem' }}>
            NAVIGATION
          </p>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '50%',
              background: 'var(--gradient)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem' }} onClick={logout}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        {/* Mobile top bar */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
          position: 'sticky', top: 0, zIndex: 50,
        }} className="mobile-header">
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(true)}>
            Menu
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }} className="gradient-text">SpendSense</span>
        </div>

        {children}
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-header { display: flex !important; gap: 0.75rem; }
        }
      `}</style>
    </div>
  );
}
