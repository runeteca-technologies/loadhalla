'use client';

import { useEffect, useState } from 'react';

const PLAN_CONFIG = {
  starter: { label: 'Starter', color: 'var(--text-secondary)' },
  growth:  { label: 'Growth',  color: 'var(--gold)' },
  scale:   { label: 'Scale',   color: 'var(--success-text)' },
};

// ─── SECTION WRAPPER ──────────────────────────────────────────────
function Section({ title, description, children }) {
  return (
    <div style={{
      background: 'var(--navy-light)',
      border: '1px solid var(--navy-border)',
      borderRadius: '8px',
      marginBottom: '24px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--navy-border)',
      }}>
        <h2 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{description}</p>
        )}
      </div>
      <div style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── INPUT FIELD ──────────────────────────────────────────────────
function Field({ label, value, onChange, disabled, type = 'text', hint }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '6px',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange && onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '10px 14px',
          background: disabled ? 'var(--navy)' : 'var(--navy)',
          border: '1px solid var(--navy-border)',
          borderRadius: '6px',
          color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = 'var(--gold-dim)'; }}
        onBlur={e => e.target.style.borderColor = 'var(--navy-border)'}
      />
      {hint && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{hint}</p>
      )}
    </div>
  );
}

// ─── PHONE NUMBER ROW ─────────────────────────────────────────────
function PhoneNumberRow({ number, onToggle }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(number.id, !number.is_active);
    setToggling(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: '1px solid var(--navy-border)',
    }}>
      <div>
        <div style={{
          fontSize: '15px',
          color: 'var(--text-primary)',
          fontFamily: 'monospace',
          marginBottom: '4px',
        }}>
          {number.phone_number}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {number.twilio_sid && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              SID: {number.twilio_sid}
            </span>
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Added {new Date(number.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: number.is_active ? 'var(--success-text)' : 'var(--text-muted)',
        }}>
          {number.is_active ? 'Active' : 'Inactive'}
        </span>
        <button
          onClick={handleToggle}
          disabled={toggling}
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            background: number.is_active ? 'var(--gold)' : 'var(--navy-border)',
            cursor: toggling ? 'not-allowed' : 'pointer',
            position: 'relative',
            transition: 'background 0.2s ease',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '3px',
            left: number.is_active ? '23px' : '3px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s ease',
          }} />
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function SettingsPage() {
  const [org, setOrg] = useState(null);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/settings/phone-numbers').then(r => r.json()),
    ]).then(([orgData, phoneData]) => {
      setOrg(orgData);
      setForm({ name: orgData.name || '', email: orgData.email || '', phone: orgData.phone || '' });
      setPhoneNumbers(phoneData);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: org.id, ...form }),
    });
    const updated = await res.json();
    setOrg(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePhoneToggle = async (id, is_active) => {
    await fetch('/api/settings/phone-numbers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active }),
    });
    setPhoneNumbers(prev => prev.map(n => n.id === id ? { ...n, is_active } : n));
  };

  const hasChanges = org && (
    form.name !== (org.name || '') ||
    form.email !== (org.email || '') ||
    form.phone !== (org.phone || '')
  );

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="rune-spinner" />
        <span style={{ color: 'var(--text-secondary)' }}>Loading settings...</span>
      </div>
    );
  }

  const plan = PLAN_CONFIG[org?.subscription_plan] || PLAN_CONFIG.starter;

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '6px' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Manage your organization and phone numbers
        </p>
      </div>

      {/* Organization */}
      <Section title="Organization" description="Your carrier account details">
        <Field
          label="Company Name"
          value={form.name}
          onChange={v => setForm(p => ({ ...p, name: v }))}
        />
        <Field
          label="Email"
          value={form.email}
          type="email"
          onChange={v => setForm(p => ({ ...p, email: v }))}
        />
        <Field
          label="Dispatcher Phone"
          value={form.phone}
          onChange={v => setForm(p => ({ ...p, phone: v }))}
          hint="New load alerts will be sent to this number"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              padding: '10px 24px',
              background: hasChanges ? 'var(--gold)' : 'var(--navy-border)',
              border: 'none',
              borderRadius: '6px',
              color: hasChanges ? 'var(--navy)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: '700',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.06em',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span style={{ fontSize: '13px', color: 'var(--success-text)' }}>
              ✓ Saved
            </span>
          )}
        </div>
      </Section>

      {/* Subscription */}
      <Section title="Subscription" description="Your current plan and status">
        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Plan
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: plan.color, fontFamily: 'Cinzel, serif' }}>
              {plan.label}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Status
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: org?.subscription_status === 'active' ? 'var(--success-text)' : 'var(--red-bright)',
              textTransform: 'capitalize',
            }}>
              {org?.subscription_status || 'Unknown'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Member Since
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {new Date(org?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </Section>

      {/* Phone Numbers */}
      <Section
        title="Phone Numbers"
        description="Twilio numbers that receive broker calls and send SMS"
      >
        {phoneNumbers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <p>No phone numbers configured yet.</p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>
              Add a Twilio number to start capturing missed calls.
            </p>
          </div>
        ) : (
          <div>
            {phoneNumbers.map(number => (
              <PhoneNumberRow
                key={number.id}
                number={number}
                onToggle={handlePhoneToggle}
              />
            ))}
          </div>
        )}
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
          To add a new number, configure it in your Twilio console and update your webhook URLs.
        </p>
      </Section>

    </div>
  );
}
