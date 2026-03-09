'use client';

import { useEffect, useState } from 'react';

const STATUS_CONFIG = {
  new:      { label: 'New',      color: 'var(--gold)',         bg: 'rgba(201,168,76,0.1)' },
  reviewed: { label: 'Reviewed', color: 'var(--text-secondary)',bg: 'rgba(138,154,181,0.1)' },
  booked:   { label: 'Booked',   color: 'var(--success-text)', bg: 'rgba(82,183,136,0.1)' },
  passed:   { label: 'Passed',   color: 'var(--text-muted)',   bg: 'rgba(74,85,104,0.1)' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}40`,
    }}>
      {cfg.label}
    </span>
  );
}

function LoadRow({ load, onClick }) {
  const [hovered, setHovered] = useState(false);
  const date = new Date(load.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <tr
      onClick={() => onClick(load)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        background: hovered ? 'rgba(201,168,76,0.04)' : 'transparent',
        borderBottom: '1px solid var(--navy-border)',
        transition: 'background 0.1s ease',
      }}
    >
      <td style={td}>
        <span style={{ color: 'var(--gold)', fontWeight: '600' }}>
          {load.pickup_location || '—'}
        </span>
        <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
        <span style={{ color: 'var(--text-primary)' }}>
          {load.delivery_location || '—'}
        </span>
      </td>
      <td style={td}>
        {load.rate
          ? <span style={{ color: 'var(--gold-light)', fontWeight: '600' }}>${Number(load.rate).toLocaleString()}</span>
          : <span style={{ color: 'var(--text-muted)' }}>TBD</span>
        }
      </td>
      <td style={td}>
        <span style={{ color: 'var(--text-secondary)' }}>{load.commodity || '—'}</span>
      </td>
      <td style={td}>
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px' }}>
          {load.broker_phone}
        </span>
      </td>
      <td style={td}>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{date}</span>
      </td>
      <td style={{ ...td, textAlign: 'right' }}>
        <StatusBadge status={load.status} />
      </td>
    </tr>
  );
}

const td = {
  padding: '14px 16px',
  fontSize: '14px',
  verticalAlign: 'middle',
};

const th = {
  padding: '10px 16px',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  textAlign: 'left',
  borderBottom: '1px solid var(--navy-border)',
  background: 'var(--navy-light)',
};

// ─── LOAD DETAIL PANEL ───────────────────────────────────────────
function LoadDetail({ load, onClose, onStatusChange }) {
  if (!load) return null;

  const fields = [
    { label: 'Pickup', value: load.pickup_location },
    { label: 'Delivery', value: load.delivery_location },
    { label: 'Pickup Time', value: load.pickup_time },
    { label: 'Delivery Time', value: load.delivery_time },
    { label: 'Commodity', value: load.commodity },
    { label: 'Rate', value: load.rate ? `$${Number(load.rate).toLocaleString()}` : load.rate_raw },
    { label: 'Broker', value: load.broker_name },
    { label: 'Company', value: load.broker_company },
    { label: 'Phone', value: load.broker_phone },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(10,15,30,0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '560px',
        maxHeight: '85vh',
        overflow: 'auto',
        background: 'var(--navy-light)',
        border: '1px solid var(--navy-border)',
        borderTop: '2px solid var(--gold)',
        borderRadius: '8px',
        padding: '28px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '16px', color: 'var(--gold)', marginBottom: '4px' }}>
              {load.pickup_location || 'Unknown'} → {load.delivery_location || 'Unknown'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {new Date(load.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: '20px', cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>

        <hr className="rune-divider" style={{ marginBottom: '24px' }} />

        {/* Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {fields.map(f => f.value && (
            <div key={f.label}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                {f.label}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{f.value}</div>
            </div>
          ))}
        </div>

        <hr className="rune-divider" style={{ marginBottom: '24px' }} />

        {/* SMS Thread */}
        {load.raw_conversation && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
              SMS Thread
            </div>
            <div style={{
              background: 'var(--navy)',
              border: '1px solid var(--navy-border)',
              borderRadius: '6px',
              padding: '16px',
              fontSize: '13px',
              lineHeight: '1.8',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflow: 'auto',
            }}>
              {load.raw_conversation}
            </div>
          </div>
        )}

        {/* Status actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['new', 'reviewed', 'booked', 'passed'].map(s => (
            <button key={s} onClick={() => onStatusChange(load.id, s)} style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: `1px solid ${load.status === s ? STATUS_CONFIG[s].color : 'var(--navy-border)'}`,
              background: load.status === s ? STATUS_CONFIG[s].bg : 'transparent',
              color: load.status === s ? STATUS_CONFIG[s].color : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}>
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function DashboardPage() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [error, setError] = useState(null);

  const fetchLoads = async () => {
    try {
      const res = await fetch('/api/loads');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLoads(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoads(); }, []);

  const handleStatusChange = async (loadId, newStatus) => {
    await fetch(`/api/loads/${loadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoads(prev => prev.map(l => l.id === loadId ? { ...l, status: newStatus } : l));
    setSelectedLoad(prev => prev?.id === loadId ? { ...prev, status: newStatus } : prev);
  };

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter);
  const newCount = loads.filter(l => l.status === 'new').length;

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '22px', color: 'var(--text-primary)' }}>Load Opportunities</h1>
          {newCount > 0 && (
            <span style={{
              background: 'var(--red)',
              color: 'var(--text-primary)',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: '700',
              fontFamily: 'Outfit, sans-serif',
            }}>
              {newCount} new
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Loads captured by AI from missed broker calls
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--navy-border)', paddingBottom: '0' }}>
        {['all', 'new', 'reviewed', 'booked', 'passed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            borderBottom: filter === f ? '2px solid var(--gold)' : '2px solid transparent',
            color: filter === f ? 'var(--gold)' : 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: filter === f ? '600' : '400',
            cursor: 'pointer',
            textTransform: 'capitalize',
            marginBottom: '-1px',
            transition: 'color 0.15s ease',
          }}>
            {f === 'all' ? `All (${loads.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${loads.filter(l => l.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--navy-light)',
        border: '1px solid var(--navy-border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="rune-spinner" style={{ margin: '0 auto 16px' }} />
            Loading loads...
          </div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--red-bright)' }}>
            Error: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <p style={{ color: 'var(--text-secondary)', fontFamily: 'Cinzel, serif', fontSize: '14px' }}>
              No loads captured yet
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
              Loads will appear here when brokers respond to missed call SMS
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Route</th>
                <th style={th}>Rate</th>
                <th style={th}>Commodity</th>
                <th style={th}>Broker</th>
                <th style={th}>Captured</th>
                <th style={{ ...th, textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(load => (
                <LoadRow key={load.id} load={load} onClick={setSelectedLoad} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel */}
      <LoadDetail
        load={selectedLoad}
        onClose={() => setSelectedLoad(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
