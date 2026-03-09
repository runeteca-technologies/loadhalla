'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace('/dashboard');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--navy)',
      padding: '24px',
    }}>
      {/* Background rune pattern */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(201,168,76,0.04) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(139,26,26,0.06) 0%, transparent 40%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--gold)',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}>
            ᚱ LOADHALLA
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', letterSpacing: '0.05em' }}>
            Dispatch Console
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--navy-light)',
          border: '1px solid var(--navy-border)',
          borderTop: '2px solid var(--gold)',
          borderRadius: '8px',
          padding: '32px',
        }}>
          <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '24px' }}>
            Sign In
          </h2>

          {error && (
            <div style={{
              background: 'rgba(139,26,26,0.15)',
              border: '1px solid var(--red)',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#e07070',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="dispatcher@yourcompany.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--navy)',
                border: '1px solid var(--navy-border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
              onBlur={e => e.target.style.borderColor = 'var(--navy-border)'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--navy)',
                border: '1px solid var(--navy-border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
              onBlur={e => e.target.style.borderColor = 'var(--navy-border)'}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? 'var(--gold-dim)' : 'var(--gold)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--navy)',
              fontSize: '14px',
              fontWeight: '700',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.08em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            {loading ? 'Signing in...' : 'Enter the Hall'}
          </button>
        </div>
      </div>
    </div>
  );
}
