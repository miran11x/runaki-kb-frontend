import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../utils/api';

// From the old "Agent Call Description Tool":
//  - MyStats       : agent page — personal usage numbers (private to the agent)
//  - SendFeedback  : agent page — rate the tool, send a comment, request a missing ticket description
//  - FeedbackAdmin : Admin Panel tab — read and review what agents sent

const ORANGE = '#FF6B35';
const NAVY = '#0B1120';
const BADGES = [10, 50, 100, 250, 500, 1000, 2500];
const SECONDS_SAVED = 75; // rough estimate per action: manual lookup/typing vs one-click copy

const Stars = ({ value, size = 26, onPick }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <span key={n} onClick={onPick ? () => onPick(n === value ? 0 : n) : undefined}
        style={{ fontSize: size, lineHeight: 1, cursor: onPick ? 'pointer' : 'default', color: n <= value ? '#f59e0b' : '#cbd5e1', userSelect: 'none' }}>★</span>
    ))}
  </div>
);

const fmt = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };

/* ================================================================== */
export function MyStats({ DM }) {
  const [s, setS] = useState(null);
  useEffect(() => {
    api.get('/td/my-stats').then(r => setS(r.data)).catch(() => { setS(false); toast.error('Could not load your stats'); });
  }, []);

  if (s === null) return <div style={{ color: DM.subText }}>Loading…</div>;
  if (s === false) return null;

  const diff = s.thisWeek - s.lastWeek;
  const next = BADGES.find(b => s.total < b);
  const pct = next ? Math.min(100, Math.round((s.total / next) * 100)) : 100;
  const minutes = Math.round((s.thisWeek * SECONDS_SAVED) / 60);
  const max = Math.max(1, ...s.last14.map(d => d.n));

  const card = { background: DM.cardBg, border: `1px solid ${DM.border}`, borderRadius: 16, padding: 18, boxShadow: DM.shadow };
  const cap = { fontSize: 11, fontWeight: 800, color: DM.subText, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 };
  const big = { fontSize: 32, fontWeight: 900, color: DM.text, lineHeight: 1.1 };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ fontSize: 13, color: DM.subText, marginBottom: 14 }}>Just for you — not shared with anyone else.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 14 }}>
        <div style={card}>
          <div style={cap}>Last 7 days</div>
          <div style={big}>{s.thisWeek} <span style={{ fontSize: 13, fontWeight: 800, color: diff >= 0 ? '#10b981' : '#ef4444' }}>{diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}</span></div>
          <div style={{ fontSize: 12, color: DM.subText, marginTop: 6 }}>vs {s.lastWeek} the week before</div>
        </div>
        <div style={card}>
          <div style={cap}>🔥 Current streak</div>
          <div style={big}>{s.streak} {s.streak === 1 ? 'day' : 'days'}</div>
          <div style={{ fontSize: 12, color: DM.subText, marginTop: 6 }}>Days in a row you used the tools</div>
        </div>
        <div style={card}>
          <div style={cap}>⏱️ Time saved this week</div>
          <div style={big}>~{minutes}m</div>
          <div style={{ fontSize: 12, color: DM.subText, marginTop: 6 }}>vs. looking things up manually</div>
        </div>
      </div>

      <div style={{ ...card, marginBottom: 14 }}>
        <div style={cap}>Last 14 days</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
          {s.last14.map(d => (
            <div key={d.day} title={`${d.day}: ${d.n}`} style={{ flex: 1, height: `${Math.max(4, (d.n / max) * 100)}%`, background: d.n ? ORANGE : DM.border, borderRadius: 4 }} />
          ))}
        </div>
      </div>

      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={cap}>🏅 Milestones</div>
          <div style={{ fontSize: 12, color: DM.subText }}>{s.total} total actions</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {BADGES.map(b => (
            <span key={b} style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 800,
              border: `1px solid ${s.total >= b ? ORANGE : DM.border}`, color: s.total >= b ? ORANGE : DM.subText,
              background: s.total >= b ? `${ORANGE}18` : 'transparent',
            }}>{b}+</span>
          ))}
        </div>
        {next && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: DM.subText, marginBottom: 4 }}>
              <span>Next milestone: {next}</span><span>{s.total} / {next}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: DM.border, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: ORANGE }} />
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <div style={card}><div style={{ ...big, fontSize: 24 }}>{s.copies}</div><div style={{ fontSize: 12, color: DM.subText, marginTop: 4 }}>📋 Total descriptions copied</div></div>
        <div style={card}><div style={{ ...big, fontSize: 24 }}>{s.zones}</div><div style={{ fontSize: 12, color: DM.subText, marginTop: 4 }}>📍 Total zone lookups</div></div>
      </div>
    </div>
  );
}

/* ================================================================== */
export function SendFeedback({ DM }) {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [request, setRequest] = useState('');
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState([]);

  const loadMine = useCallback(() => {
    api.get('/td/feedback/mine').then(r => setMine(r.data || [])).catch(() => {});
  }, []);
  useEffect(() => { loadMine(); }, [loadMine]);

  const empty = !rating && !message.trim() && !request.trim();
  const submit = async () => {
    if (empty) return;
    setSending(true);
    try {
      await api.post('/td/feedback', { rating, message, category_request: request });
      toast.success('Thanks — your feedback was sent');
      setRating(0); setMessage(''); setRequest(''); loadMine();
    } catch { toast.error('Could not send'); }
    setSending(false);
  };

  const input = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: `1px solid ${DM.border}`, background: DM.bg, color: DM.text, fontSize: 14, fontFamily: 'inherit', resize: 'vertical' };
  const lab = { fontSize: 13, fontWeight: 800, color: DM.text, margin: '16px 0 6px', display: 'block' };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontSize: 13, color: DM.subText, marginBottom: 14, lineHeight: 1.7 }}>
        Tell us how the tools are working for you, or ask for a ticket description that isn't covered yet. This goes straight to the team lead.
      </div>
      <div style={{ background: DM.cardBg, border: `1px solid ${DM.border}`, borderRadius: 16, padding: 20, boxShadow: DM.shadow }}>
        <div style={{ ...lab, marginTop: 0 }}>How helpful are the tools for you?</div>
        <Stars value={rating} onPick={setRating} />
        <label style={lab}>Anything you'd like to tell us?</label>
        <textarea rows={4} style={input} value={message} onChange={e => setMessage(e.target.value)} placeholder="What's working well, what's frustrating, anything at all…" />
        <label style={lab}>Need a ticket description that isn't in the system yet?</label>
        <textarea rows={3} style={input} value={request} onChange={e => setRequest(e.target.value)} placeholder="Describe the case — we'll review and add it if needed" />
        <button onClick={submit} disabled={sending || empty} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', opacity: sending || empty ? 0.5 : 1 }}>
          {sending ? 'Sending…' : 'Send feedback'}
        </button>
      </div>

      {mine.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: DM.subText, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Your recent feedback</div>
          {mine.map(f => (
            <div key={f.id} style={{ background: DM.cardBg, border: `1px solid ${DM.border}`, borderRadius: 12, padding: '10px 14px', marginBottom: 8, fontSize: 13.5, color: DM.text }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                {f.rating ? <Stars value={f.rating} size={14} /> : <span />}
                <span style={{ fontSize: 11.5, color: DM.subText }}>{fmt(f.created_at)}{f.status === 'reviewed' ? ' · ✓ reviewed' : ''}</span>
              </div>
              {f.message && <div style={{ lineHeight: 1.6 }}>{f.message}</div>}
              {f.category_request && <div style={{ color: DM.subText, marginTop: 4 }}><b style={{ fontSize: 11, textTransform: 'uppercase' }}>Requested: </b>{f.category_request}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
export function FeedbackAdmin({ darkMode }) {
  const th = darkMode
    ? { card: '#111827', input: '#0b1220', border: 'rgba(255,255,255,0.12)', text: '#e2e8f0', sub: 'rgba(255,255,255,0.5)' }
    : { card: '#fff', input: '#f8fafc', border: '#e2e8f0', text: NAVY, sub: '#64748b' };
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try { setRows((await api.get('/td/feedback')).data || []); } catch { toast.error('Could not load feedback'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const newCount = rows.filter(r => r.status === 'new').length;
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(r => (filter === 'all' || r.status === filter) &&
      (!s || [r.user_name, r.message, r.category_request].some(v => (v || '').toLowerCase().includes(s))));
  }, [rows, q, filter]);

  const setStatus = async (r, status) => {
    try { await api.patch(`/td/feedback/${r.id}`, { status }); load(); } catch { toast.error('Could not update'); }
  };
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(shown.map(r => ({ Name: r.user_name, Rating: r.rating || '', Message: r.message || '', 'Category request': r.category_request || '', Status: r.status, Submitted: fmt(r.created_at) })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Feedback');
    XLSX.writeFile(wb, `feedback-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const inp = { padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };
  const pill = on => ({ padding: '8px 14px', borderRadius: 10, border: `1px solid ${on ? ORANGE : th.border}`, background: on ? ORANGE : 'transparent', color: on ? '#fff' : th.text, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' });

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: th.text, marginBottom: 4 }}>💬 Agent Feedback</div>
      <div style={{ fontSize: 13, color: th.sub, marginBottom: 16 }}>Ratings, comments and missing-description requests sent by agents.</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <input style={{ ...inp, flex: '1 1 220px' }} placeholder="Search by agent or message…" value={q} onChange={e => setQ(e.target.value)} />
        <button style={pill(filter === 'all')} onClick={() => setFilter('all')}>All</button>
        <button style={pill(filter === 'new')} onClick={() => setFilter('new')}>New ({newCount})</button>
        <button style={pill(filter === 'reviewed')} onClick={() => setFilter('reviewed')}>Reviewed</button>
        <button style={{ ...pill(false) }} onClick={exportExcel}>⬇ Export</button>
      </div>
      {shown.length === 0 && <div style={{ color: th.sub, fontSize: 13, padding: '30px 0', textAlign: 'center' }}>No feedback yet.</div>}
      {shown.map(r => (
        <div key={r.id} style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, opacity: r.status === 'reviewed' ? 0.65 : 1 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: th.text }}>{r.user_name || 'Unknown'}</div>
              <div style={{ fontSize: 11.5, color: th.sub }}>{fmt(r.created_at)}</div>
            </div>
            {r.rating ? <Stars value={r.rating} size={15} /> : null}
            <button onClick={() => setStatus(r, r.status === 'new' ? 'reviewed' : 'new')} style={{
              border: `1px solid ${r.status === 'new' ? '#10b981' : '#64748b'}55`, background: `${r.status === 'new' ? '#10b981' : '#64748b'}14`,
              color: r.status === 'new' ? '#10b981' : '#64748b', borderRadius: 8, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>{r.status === 'new' ? '✓ Mark reviewed' : 'Reopen'}</button>
          </div>
          {r.message && <div style={{ fontSize: 13.5, color: th.text, lineHeight: 1.7 }}>{r.message}</div>}
          {r.category_request && <div style={{ fontSize: 13.5, color: th.sub, marginTop: 4, lineHeight: 1.7 }}><b style={{ fontSize: 11, textTransform: 'uppercase' }}>Description request: </b>{r.category_request}</div>}
        </div>
      ))}
    </div>
  );
}
