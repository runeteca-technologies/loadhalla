'use client';

import { useEffect, useState } from 'react';

// ─── STATUS CONFIG ────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:    { label: 'Active',     color: 'var(--gold)',         bg: 'rgba(201,168,76,0.1)' },
  completed: { label: 'Completed',  color: 'var(--success-text)', bg: 'rgba(82,183,136,0.1)' },
  abandoned: { label: 'Abandoned',  color: 'var(--text-muted)',   bg: 'rgba(74,85,104,0.1)' },
};

const AI_STATE_CONFIG = {
  greeting:   { label: 'Greeting',   color: 'var(--gold)' },
  collecting: { label: 'Collecting', color: '#2980b9' },
  completed:  { label: 'Completed',  color: 'var(--success-text)' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
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

// ─── SMS BUBBLE ───────────────────────────────────────────────────
function SMSBubble({ message }) {
  const isInbound = message.direction === 'inbound';
  const time = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isInbound ? 'flex-start' : 'flex-end',
      marginBottom: '12px',
    }}>
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: isInbound ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
        background: isInbound ? 'var(--navy-mid)' : 'rgba(201,168,76,0.15)',
        border: isInbound ? '1px solid var(--navy-border)' : '1px solid rgba(201,168,76,0.3)',
        fontSize: '14px',
        lineHeight: '1.5',
        color: isInbound ? 'var(--text-primary)' : 'var(--text-primary)',
      }}>
        {message.body}
      </div>
      <div style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        marginTop: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span>{isInbound ? '📱 Broker' : '🤖 AI'}</span>
        <span>{time}</span>
      </div>
    </div>
  );
}

// ─── CONVERSATION DETAIL PANEL ────────────────────────────────────
function ConversationDetail({ conversationId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    fetch(`/api/conversations/${conversationId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [conversationId]);

  if (!conversationId) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(10,15,30,0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '520px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--navy-light)',
        border: '1px solid var(--navy-border)',
        borderTop: '2px solid var(--gold)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="rune-spinner" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--navy-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '4px' }}>
                  {data.broker_phone}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <StatusBadge status={data.status} />
                  {data.ai_state && (
                    <span style={{
                      fontSize: '11px',
                      color: AI_STATE_CONFIG[data.ai_state]?.color || 'var(--text-muted)',
                      letterSpacing: '0.06em',
                    }}>
                      {AI_STATE_CONFIG[data.ai_state]?.label || data.ai_state}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Started {new Date(data.created_at).toLocaleString()}
                </div>
              </div>
              <button onClick={onClose} style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: '20px',
                cursor: 'pointer', lineHeight: 1,
              }}>✕</button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {data.messages?.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                  No messages yet
                </div>
              ) : (
                data.messages?.map(msg => (
                  <SMSBubble key={msg.id} message={msg} />
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--navy-border)',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {data.messages?.length || 0} messages
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Last updated {new Date(data.updated_at).toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CONVERSATION ROW ─────────────────────────────────────────────
function ConversationRow({ conversation, onClick }) {
  const [hovered, setHovered] = useState(false);
  const messageCount = conversation.messages?.[0]?.count || 0;
  const date = new Date(conversation.updated_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <tr
      onClick={() => onClick(conversation.id)}
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
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px' }}>
          {conversation.broker_phone}
        </span>
      </td>
      <td style={td}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {conversation.broker_name || '—'}
        </span>
      </td>
      <td style={td}>
        <StatusBadge status={conversation.status} />
      </td>
      <td style={td}>
        <span style={{
          color: messageCount > 0 ? 'var(--gold)' : 'var(--text-muted)',
          fontWeight: messageCount > 0 ? '600' : '400',
          fontSize: '13px',
        }}>
          {messageCount} {messageCount === 1 ? 'msg' : 'msgs'}
        </span>
      </td>
      <td style={td}>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{date}</span>
      </td>
    </tr>
  );
}

const td = { padding: '14px 16px', fontSize: '14px', verticalAlign: 'middle' };
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

// ─── MAIN PAGE ────────────────────────────────────────────────────
export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setConversations(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? conversations
    : conversations.filter(c => c.status === filter);

  const counts = {
    all: conversations.length,
    active: conversations.filter(c => c.status === 'active').length,
    completed: conversations.filter(c => c.status === 'completed').length,
    abandoned: conversations.filter(c => c.status === 'abandoned').length,
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '6px' }}>
          Conversations
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          All SMS threads between brokers and the AI dispatcher
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '20px',
        borderBottom: '1px solid var(--navy-border)',
      }}>
        {['all', 'active', 'completed', 'abandoned'].map(f => (
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
            {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
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
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="rune-spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading conversations...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--red-bright)' }}>
            Error: {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
            <p style={{ color: 'var(--text-secondary)', fontFamily: 'Cinzel, serif', fontSize: '14px' }}>
              No conversations yet
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
              Conversations will appear when brokers respond to missed call SMS
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Broker Phone</th>
                <th style={th}>Broker Name</th>
                <th style={th}>Status</th>
                <th style={th}>Messages</th>
                <th style={th}>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(convo => (
                <ConversationRow
                  key={convo.id}
                  conversation={convo}
                  onClick={setSelectedId}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel */}
      <ConversationDetail
        conversationId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
