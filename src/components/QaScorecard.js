import React, { useMemo, useState } from 'react';
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

export function EvalCard({ th, r, rubric, showAgent, fun }) {
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
        </div>
      )}
    </div>
  );
}

export function EvalList({ th, rows, rubric, showAgent, fun }) {
  const sorted = useMemo(() => [...rows].sort((a, b) => (a.d < b.d ? 1 : -1)), [rows]);
  if (!sorted.length) return <Empty th={th}>No evaluations to show.</Empty>;
  return <div style={{ display: 'grid', gap: 10 }}>{sorted.map(r => <EvalCard key={r.id} th={th} r={r} rubric={rubric} showAgent={showAgent} fun={fun} />)}</div>;
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
