'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.replace('/login');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--navy)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="rune-spinner" />
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'Cinzel, serif', fontSize: '12px', letterSpacing: '0.15em', marginTop: '16px' }}>
            LOADHALLA
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Loads', icon: '⚡' },
    { href: '/dashboard/conversations', label: 'Conversations', icon: '💬' },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--navy)', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--navy-light)',
        borderRight: '1px solid var(--navy-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
      }}>

        {/* Logo */}
        <div style={{
          padding: '28px 24px 24px',
          borderBottom: '1px solid var(--navy-border)',
        }}>
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--gold)',
            letterSpacing: '0.08em',
          }}>
            ᚱ LOADHALLA
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', letterSpacing: '0.05em' }}>
            Dispatch Console
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(201, 168, 76, 0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Sign out */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--navy-border)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button onClick={handleSignOut} style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px solid var(--navy-border)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--red-bright)'; e.target.style.color = 'var(--red-bright)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--navy-border)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--navy)',
      }}>
        {children}
      </main>

      <style jsx global>{`
        .rune-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid var(--navy-border);
          border-top-color: var(--gold);
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
