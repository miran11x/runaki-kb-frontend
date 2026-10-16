import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useTheme, Panel, Empty, GREEN, RED, AMBER, BLUE, ORANGE } from './qaUi';
import { EvalList, ATTR_EMOJI } from './QaScorecard';
import FocusThisWeek from './FocusThisWeek';
import { pct, mean, fmtPct, resultOf, fmtDay, ATTR_LABELS } from '../utils/qaStats';

// The agent's own evaluations: everything the QA team recorded about their calls, in a friendly, colourful layout.
const monthName = m => { try { return new Date(`${m}-01T00:00:00`).toLocaleString('en-GB', { month: 'long', year: 'numeric' }); } catch { return m; } };
const VIOLET = '#8b5cf6';

function mood(avg) {
  if (avg >= 0.9) return { emoji: '🏆', title: 'Outstanding work!', text: 'Your calls are setting the standard. Keep it up.', a: '#10b981', b: '#0ea5e9' };
  if (avg >= 0.8) return { emoji: '🌟', title: 'Great job!', text: 'You are above target. A few small details and you are at the top.', a: '#22c55e', b: '#38bdf8' };
  if (avg >= 0.6) return { emoji: '💪', title: 'You are getting there!', text: 'Check where points were lost below, then fix one thing at a time.', a: '#f59e0b', b: '#fb7185' };
  return { emoji: '🚀', title: 'Let us climb together', text: 'Every evaluation is a chance to learn. Read the comments and talk to your coordinator.', a: '#f97316', b: '#8b5cf6' };
}

function Ring({ value, color, size = 124, children }) {
  const r = size / 2 - 10, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{children}</div>
    </div>
  );
}

function Tile({ th, emoji, label, value, sub, color }) {
  return (
    <div style={{ background: th.card, border: `1px solid ${color}44`, borderRadius: 16, padding: '14px 16px', position: 'relative', overflow: 'hidden', boxShadow: `0 6px 20px ${color}1f` }}>
      <div style={{ position: 'absolute', top: -18, insetInlineEnd: -18, width: 70, height: 70, borderRadius: '50%', background: `${color}22` }} />
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: th.text, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: th.sub, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

export default function MyQaEvaluations({ darkMode, faqs, onOpen, onSearch }) {
  const th = useTheme(darkMode);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [month, setMonth] = useState('');
  const [ackData, setAckData] = useState({ acks: [], disputeDays: 7 });
  const loadAcks = useCallback(() => api.get('/qa/acks').then(r => { setAckData(r.data); try { window.dispatchEvent(new Event('rk-eval-ack')); } catch {} }).catch(() => {}), []);

  useEffect(() => {
    api.get('/qa/mine').then(r => setData(r.data)).catch(e => setErr(e.response?.data?.error || 'Could not load your evaluations.'));
    loadAcks();
  }, [loadAcks]);
  const acks = useMemo(() => ({ map: Object.fromEntries(ackData.acks.map(a => [a.eval_id, a])), days: ackData.disputeDays, reload: loadAcks }), [ackData, loadAcks]);

  const months = useMemo(() => (data ? [...new Set(data.rows.map(r => r.mo || r.d.slice(0, 7)))].sort().reverse() : []), [data]);
  const rows = useMemo(() => (data ? data.rows.filter(r => !month || (r.mo || r.d.slice(0, 7)) === month) : []), [data, month]);

  if (err) return <Empty th={th}>{err}</Empty>;
  if (!data) return <Empty th={th}>Loading…</Empty>;
  if (!data.rows.length) {
    return (
      <div style={{ maxWidth: 640, margin: '30px auto', textAlign: 'center', background: th.card, border: `1px solid ${th.border}`, borderRadius: 20, padding: '36px 24px' }}>
        <div style={{ fontSize: 48 }}>⭐</div>
        <h2 style={{ margin: '8px 0 6px', color: th.text }}>No evaluations yet</h2>
        <div style={{ fontSize: 14, color: th.sub, lineHeight: 1.7 }}>When the QA team evaluates your calls, they will appear here with your score, comments and coaching.<br />If you expected to see some, ask your coordinator to check your Wave ID.</div>
      </div>
    );
  }

  const avg = mean(rows.map(pct));
  const zero = rows.filter(r => resultOf(r) === 'Zero').length;
  const full = rows.filter(r => resultOf(r) === 'Full').length;
  const pending = rows.filter(r => r.fn && !/deliver/i.test(r.cs || '')).length;
  const m = mood(avg);

  // strongest and weakest parts of the call
  const per = ATTR_LABELS.map((label, i) => ({ i, label, lost: rows.filter(r => r.fl && r.fl[i]).length }));
  const best = per.filter(a => a.lost === 0);
  const worst = [...per].sort((a, b) => b.lost - a.lost)[0];
  const chart = [...rows].sort((a, b) => (a.d < b.d ? -1 : 1)).map((r, i) => ({ i: i + 1, day: fmtDay(r.d), score: Math.round(pct(r) * 100) }));

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <select value={month} onChange={e => setMonth(e.target.value)} aria-label="Month"
          style={{ background: th.input, color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontSize: 13 }}>
          <option value="">All months</option>
          {months.map(x => <option key={x} value={x}>{monthName(x)}</option>)}
        </select>
      </div>

      <div style={{ background: `linear-gradient(120deg, ${m.a}, ${m.b})`, borderRadius: 22, padding: '22px 24px', display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', color: '#fff', boxShadow: `0 12px 34px ${m.a}55`, marginBottom: 16 }}>
        <Ring value={avg}>
          <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1 }}>{fmtPct(avg, 0)}</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>average</div>
        </Ring>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 26, fontWeight: 900 }}>{m.emoji} {m.title}</div>
          <div style={{ fontSize: 14, opacity: 0.95, marginTop: 4, lineHeight: 1.6 }}>{m.text}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 800 }}>📞 {rows.length} evaluated call{rows.length === 1 ? '' : 's'}</span>
            {full > 0 && <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 800 }}>💯 {full} perfect score{full === 1 ? '' : 's'}</span>}
            {best.length > 0 && best.length < ATTR_LABELS.length && <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 800 }}>✅ {best.length} criteria with no mistakes</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
        <Tile th={th} emoji="📞" label="Evaluated calls" value={rows.length} color={BLUE} />
        <Tile th={th} emoji="💯" label="Full scores" value={full} sub="33 out of 33" color={GREEN} />
        <Tile th={th} emoji={zero ? '⚠️' : '🛡️'} label="Zero scores" value={zero} sub={zero ? 'read the comments' : 'none, well done'} color={zero ? RED : VIOLET} />
        <Tile th={th} emoji="💬" label="Feedback waiting" value={pending} sub={pending ? 'ask your coordinator' : 'all delivered'} color={pending ? AMBER : ORANGE} />
      </div>

      <FocusThisWeek th={th} rows={data.rows} faqs={faqs} onOpen={onOpen} onSearch={onSearch} />

      {chart.length > 1 && (
        <Panel th={th} title="📈 Your scores over time" hint="Each point is one evaluated call." style={{ marginBottom: 16 }}>
          <div style={{ height: 190 }}>
            <ResponsiveContainer>
              <AreaChart data={chart} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="myScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={m.a} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={m.a} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={th.grid} strokeDasharray="3 3" />
                <XAxis dataKey="i" tick={{ fontSize: 11, fill: th.sub }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: th.sub }} unit="%" />
                <Tooltip contentStyle={{ background: th.card, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8 }} labelFormatter={(_, p) => (p[0] ? p[0].payload.day : '')} formatter={v => [`${v}%`, 'Score']} />
                <Area type="monotone" dataKey="score" stroke={m.a} strokeWidth={3} fill="url(#myScore)" dot={{ r: 4, fill: m.b, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      <Panel th={th} title="🎯 Your call, part by part" hint={worst && worst.lost ? `Most points were lost in ${worst.label}. Start there.` : 'No points lost in any part of the call. Fantastic!'} style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
          {per.map(a => {
            const c = a.lost === 0 ? GREEN : a.lost >= 2 ? RED : AMBER;
            return (
              <div key={a.label} style={{ background: `${c}16`, border: `1px solid ${c}55`, borderRadius: 14, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>{ATTR_EMOJI[a.i]}</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: th.text, marginTop: 2 }}>{a.label}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: c, marginTop: 3 }}>{a.lost === 0 ? '✓ Perfect' : `${a.lost} mistake${a.lost > 1 ? 's' : ''}`}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      {(() => { const unread = rows.filter(r => !acks.map[r.id]?.acked_at).length; return unread > 0 ? (
        <div style={{ background: `${ORANGE}18`, border: `1px solid ${ORANGE}66`, borderRadius: 14, padding: '10px 14px', marginBottom: 12, fontSize: 13.5, fontWeight: 700, color: th.text }}>
          🆕 {unread} evaluation{unread === 1 ? '' : 's'} waiting for you. Open {unread === 1 ? 'it' : 'each one'}, read the feedback, then tap “I've read this”.
        </div>) : null; })()}
      <h3 style={{ margin: '0 0 8px', fontSize: 15, color: th.text }}>⭐ Your evaluations</h3>
      <EvalList th={th} rows={rows} rubric={data.rubric} fun acks={acks} />
    </div>
  );
}
