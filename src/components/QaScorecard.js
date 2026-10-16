import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Kpi, Pill, Bar, Empty, gridStyle, resultColor, scoreColor, bandColor, trendColor, ORANGE, GREEN, RED } from './qaUi';
import { ATTR_LABELS, MAX, pct, resultOf, fmtPct, mean, fmtDay, SETTINGS } from '../utils/qaStats';

// One agent's full QA picture: used as the Team Lead's drawer (agent = row from agentTable)
// and as the body of the agent's own page (via EvalList).

// QA comments are pasted from a template with **bold** markers and " / " separators
const tidy = t => String(t).replace(/\s+\/\s+(?=\*\*)/g, '\n').replace(/\*\*/g, '');
const fmtDur = s => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

export function defOf(rubric, attrIndex, reason) {
  const names = [ATTR_LABELS[attrIndex], attrIndex === 0 ? 'Greeting Script' : null].filter(Boolean).map(x => x.toLowerCase());
  const hit = (rubric || []).find(r => names.includes(String(r.attribute).toLowerCase()) && String(r.reason).toLowerCase() === String(reason).toLowerCase());
  return hit ? hit.definition : '';
}

export const ATTR_EMOJI = ['👋', '🪪', '👂', '📚', '💬', '🧩', '🏷️', '🎙️', '🎬', '🙂', '📞'];


// The agent confirms they read an evaluation and may dispute a score within a few days.
function AckBox({ th, r, ack, disputeDays, onChange }) {
  const [comment, setComment] = useState('');
  const [dispute, setDispute] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const left = r.ca ? Math.ceil(disputeDays - (Date.now() - Date.parse(r.ca)) / 86400000) : disputeDays;
  const canDispute = !(ack && ack.dispute_status) && left > 0;
  const say = e => toast.error(e?.response?.data?.error || 'Something went wrong');
  const confirm = async () => { setBusy(true); try { await api.post(`/qa/acks/${r.id}`, { comment }); onChange(); } catch (e) { say(e); } setBusy(false); };
  const send = async () => { setBusy(true); try { await api.post(`/qa/acks/${r.id}/dispute`, { text }); setDispute(false); toast.success('Dispute sent to the QA team'); onChange(); } catch (e) { say(e); } setBusy(false); };
  const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 11px', borderRadius: 9, border: `1px solid ${th.border}`, background: th.input || th.soft, color: th.text, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' };
  const b = (c, solid) => ({ border: `1px solid ${c}`, background: solid ? c : 'transparent', color: solid ? '#fff' : c, borderRadius: 10, padding: '7px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' });
  const st = ack && ack.dispute_status;
  return (
    <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, border: `1px solid ${ack && ack.acked_at ? th.border : ORANGE}`, background: ack && ack.acked_at ? th.soft : `${ORANGE}12` }}>
      {!(ack && ack.acked_at) ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 800, color: th.text, marginBottom: 6 }}>🆕 Please confirm you read this evaluation</div>
          <input style={{ ...inp, marginBottom: 8 }} placeholder="Optional: a short comment for the QA team" maxLength={600} value={comment} onChange={e => setComment(e.target.value)} />
          <button disabled={busy} onClick={confirm} style={b(GREEN, true)}>✅ I've read this</button>
        </>
      ) : (
        <div style={{ fontSize: 12.5, color: th.text }}>
          <strong style={{ color: GREEN }}>✔ You confirmed this evaluation</strong>
          <span style={{ color: th.sub }}> on {new Date(ack.acked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          {ack.comment && <div style={{ color: th.sub, marginTop: 3 }}>Your comment: {ack.comment}</div>}
        </div>
      )}
      {st && (
        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, background: st === 'open' ? '#f59e0b1c' : `${GREEN}18`, fontSize: 12.5, color: th.text }}>
          <strong>{st === 'open' ? '⏳ Your dispute is with the QA team' : st === 'score changed' ? '✅ Dispute reviewed: the score was changed' : '💬 Dispute reviewed: the score stays'}</strong>
          <div style={{ color: th.sub, marginTop: 3, whiteSpace: 'pre-wrap' }}>You wrote: {ack.dispute_text}</div>
          {ack.staff_reply && <div style={{ marginTop: 4 }}><strong>QA reply:</strong> {ack.staff_reply}</div>}
        </div>
      )}
      {canDispute && !dispute && <button onClick={() => setDispute(true)} style={{ ...b('#64748b'), marginTop: 10 }}>Disagree with a score? Send a dispute ({left} day{left === 1 ? '' : 's'} left)</button>}
      {canDispute && dispute && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12.5, color: th.sub, marginBottom: 4 }}>Say which part you disagree with and why. Be specific and polite. You can send one dispute per evaluation.</div>
          <textarea rows={3} style={inp} maxLength={1200} value={text} onChange={e => setText(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button disabled={busy || text.trim().length < 10} onClick={send} style={{ ...b(ORANGE, true), opacity: text.trim().length < 10 ? 0.5 : 1 }}>Send dispute</button>
            <button onClick={() => setDispute(false)} style={b('#64748b')}>Cancel</button>
          </div>
        </div>
      )}
      {!st && !canDispute && ack && ack.acked_at && <div style={{ fontSize: 11.5, color: th.sub, marginTop: 8 }}>The {disputeDays}-day dispute period has ended. Talk to your coordinator if you have a question.</div>}
    </div>
  );
}

export function EvalCard({ th, r, rubric, showAgent, fun, acks }) {
  const [open, setOpen] = useState(false);
  const res = resultOf(r);
  const fails = (r.fl || []).map((f, i) => (f ? { i, f } : null)).filter(Boolean);
  return (
    <div style={{ border: `1px solid ${th.border}`, borderRadius: 14, background: th.card, overflow: 'hidden', ...(fun ? { borderInlineStart: `6px solid ${resultColor(res)}`, boxShadow: `0 4px 18px ${resultColor(res)}22` } : {}) }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: resultColor(res), lineHeight: 1 }}>{r.f}<span style={{ fontSize: 12, color: th.sub, fontWeight: 600 }}>/{MAX}</span></div>
          <div style={{ fontSize: 11.5, color: th.sub, marginTop: 2 }}>{fmtPct(pct(r), 0)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {acks && !acks.map[r.id]?.acked_at && <Pill color={ORANGE}>🆕 New</Pill>}
            <Pill color={resultColor(res)}>{res}</Pill>
            {r.cr && <Pill color={RED}>Critical: {r.cr}</Pill>}
            {showAgent && <strong style={{ fontSize: 13, color: th.text }}>{r.n}</strong>}
            <span style={{ fontSize: 13, color: th.text, fontWeight: 600 }}>{r.s || 'No subject'}</span>
          </div>
          <div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>
            Call {r.cd || fmtDay(r.d)} · Ref {r.t || '—'} · QA {r.q}{r.u ? ` · ${r.u}` : ''}
          </div>
        </div>
        <div style={{ fontSize: 12, color: th.sub }}>{fails.length ? `${fails.length} mistake${fails.length > 1 ? 's' : ''}` : 'No mistakes'} {open ? '▴' : '▾'}</div>
      </button>
      {open && (
        <div style={{ padding: '4px 14px 14px', borderTop: `1px solid ${th.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 8, margin: '12px 0', alignItems: 'start' }}>
            {ATTR_LABELS.map((label, i) => {
              const f = r.fl && r.fl[i];
              const p = (r.pt || [])[i] ?? 0;
              return (
                <div key={label} style={{ background: fun ? `${f ? (p === 0 ? RED : ORANGE) : GREEN}18` : th.soft, borderRadius: 10, padding: '8px 10px', borderInlineStart: `3px solid ${f ? (p === 0 ? RED : ORANGE) : GREEN}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: 700, color: th.text }}>
                    <span>{fun ? `${ATTR_EMOJI[i]} ` : ''}{label}</span><span style={fun ? { color: f ? (p === 0 ? RED : ORANGE) : GREEN } : undefined}>{fun ? (f ? `${p}/3` : '✓ 3/3') : `${p}/3`}</span>
                  </div>
                  <div style={{ fontSize: 12, color: f ? th.text : th.sub, marginTop: 2 }}>{f || 'Pass'}</div>
                  {f && defOf(rubric, i, f) && <div style={{ fontSize: 11.5, color: th.sub, marginTop: 4, lineHeight: 1.5 }}>{defOf(rubric, i, f)}</div>}
                </div>
              );
            })}
          </div>
          {r.cm && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: th.sub, marginBottom: 3 }}>QA comments</div>
              <div style={{ fontSize: 13, color: th.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{tidy(r.cm)}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, color: th.sub }}>
            <span>Evaluated {fmtDay(r.d)}</span>
            <span>Wait {fmtDur(r.ws)}</span>
            <span>Talk {fmtDur(r.ts)}</span>
            {r.bn && <span>Background noise: {r.bn}</span>}
            <span>Raw score {r.r}/{MAX}</span>
          </div>
          <div style={{ marginTop: 10, padding: '8px 10px', background: th.soft, borderRadius: 10, fontSize: 12.5, color: th.text }}>
            <strong>Coaching: </strong>{r.cs || (r.fn ? 'Feedback needed, not delivered yet' : 'No feedback needed')}
            {r.cdt ? ` · ${r.cdt}` : ''}
            {r.cn && <div style={{ color: th.sub, marginTop: 4, whiteSpace: 'pre-wrap' }}>{r.cn}</div>}
          </div>
          {acks && <AckBox th={th} r={r} ack={acks.map[r.id]} disputeDays={acks.days} onChange={acks.reload} />}
        </div>
      )}
    </div>
  );
}

export function EvalList({ th, rows, rubric, showAgent, fun, acks }) {
  const sorted = useMemo(() => [...rows].sort((a, b) => (a.d < b.d ? 1 : -1)), [rows]);
  if (!sorted.length) return <Empty th={th}>No evaluations to show.</Empty>;
  return <div style={{ display: 'grid', gap: 10 }}>{sorted.map(r => <EvalCard key={r.id} th={th} r={r} rubric={rubric} showAgent={showAgent} fun={fun} acks={acks} />)}</div>;
}

export function AttributeBars({ th, rows }) {
  const n = rows.length || 1;
  const counts = ATTR_LABELS.map((label, i) => ({ label, c: rows.filter(r => r.fl && r.fl[i]).length }));
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {counts.map(a => (
        <div key={a.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px,160px) 1fr 70px', gap: 10, alignItems: 'center', fontSize: 12.5, color: th.text }}>
          <span>{a.label}</span>
          <Bar value={a.c / n} color={a.c >= SETTINGS.repeatAt ? RED : a.c ? ORANGE : GREEN} th={th} />
          <span style={{ color: a.c >= SETTINGS.repeatAt ? RED : th.sub, fontWeight: a.c >= SETTINGS.repeatAt ? 800 : 500 }}>{a.c}{a.c >= SETTINGS.repeatAt ? ' repeated' : ''}</span>
        </div>
      ))}
    </div>
  );
}

export default function AgentScorecard({ th, agent, rubric, onClose }) {
  const chart = useMemo(() => (agent ? agent.list.map((r, i) => ({ i: i + 1, day: fmtDay(r.d), score: Math.round(pct(r) * 100) })) : []), [agent]);
  if (!agent) return null;
  const a = agent;
  return (
    <div role="dialog" aria-label={`${a.name} scorecard`} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', width: 'min(760px,100%)', height: '100%', overflowY: 'auto', background: th.soft === 'rgba(255,255,255,0.04)' ? '#0b1220' : '#f1f5f9', padding: 18, boxShadow: '-12px 0 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: th.text }}>{a.name}</h2>
            <div style={{ fontSize: 12.5, color: th.sub, marginTop: 3 }}>Wave {a.wave || '—'} · {a.queue || 'No queue'} · Coordinator {a.coordinator || '—'} · QA {a.qa}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: th.card, color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={gridStyle(130)}>
          <Kpi th={th} label="Average score" value={fmtPct(a.avg)} color={scoreColor(a.avg)} />
          <Kpi th={th} label="Evaluations" value={a.evals} sub={`target ${a.target}`} />
          <Kpi th={th} label="Zero scores" value={fmtPct(a.zeroRate, 0)} color={a.zeroRate >= 0.2 ? RED : th.text} />
          <Kpi th={th} label="Trend" value={a.trend} color={trendColor(a.trend)} sub={a.change != null ? `${a.change > 0 ? '+' : ''}${(a.change * 100).toFixed(1)} pp` : ''} />
          <Kpi th={th} label="Risk" value={a.risk} color={bandColor(a.band)} sub={a.band} />
        </div>
        {a.why && <div style={{ fontSize: 12.5, color: th.sub, margin: '-4px 0 14px' }}>Why: {a.why}</div>}

        <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 14, color: th.text }}>Score per evaluation</h3>
          {chart.length < 2 ? <Empty th={th}>Needs at least two evaluations.</Empty> : (
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={chart} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={th.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="i" tick={{ fontSize: 11, fill: th.sub }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: th.sub }} unit="%" />
                  <Tooltip contentStyle={{ background: th.card, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8 }} labelFormatter={(_, p) => (p[0] ? p[0].payload.day : '')} />
                  <ReferenceLine y={SETTINGS.targetScore * 100} stroke={GREEN} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="score" stroke={ORANGE} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 14, color: th.text }}>Mistakes by attribute</h3>
          <div style={{ fontSize: 12, color: th.sub, marginBottom: 10 }}>A mistake that happens {SETTINGS.repeatAt} or more times is a repeated mistake.</div>
          <AttributeBars th={th} rows={a.list} />
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: 14, color: th.text }}>All evaluations ({a.list.length}) · avg {fmtPct(mean(a.list.map(pct)))}</h3>
        <EvalList th={th} rows={a.list} rubric={rubric} />
      </div>
    </div>
  );
}
