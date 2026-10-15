import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

// Admin Panel → Overview: what the agents are doing, in one place (team lead only).

const ORANGE = '#FF6B35';
const NAVY = '#0B1120';
const GREEN = '#10b981';
const RED = '#ef4444';
const BLUE = '#38bdf8';

const fmt = d => { try { return new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); } catch { return ''; } };
const ago = d => {
  if (!d) return 'never';
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
};
const shortDay = d => (d || '').slice(5);

function useTheme(dark) {
  return dark
    ? { card: '#111827', soft: 'rgba(255,255,255,0.04)', input: '#0b1220', border: 'rgba(255,255,255,0.12)', text: '#e2e8f0', sub: 'rgba(255,255,255,0.55)', grid: 'rgba(255,255,255,0.1)' }
    : { card: '#fff', soft: '#f8fafc', input: '#f8fafc', border: '#e2e8f0', text: NAVY, sub: '#64748b', grid: '#e2e8f0' };
}

const Panel = ({ th, title, hint, right, children, style }) => (
  <section style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 16, minWidth: 0, ...style }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: th.text }}>{title}</h3>
        {hint && <div style={{ fontSize: 12, color: th.sub, marginTop: 2 }}>{hint}</div>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

const Kpi = ({ th, label, value, sub, color, warn }) => (
  <div style={{ background: th.card, border: `1px solid ${warn ? `${RED}66` : th.border}`, borderRadius: 14, padding: '12px 14px', minWidth: 0 }}>
    <div style={{ fontSize: 12, color: th.sub, fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color: color || th.text, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: th.sub, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Empty = ({ th, children }) => <div style={{ padding: '14px 4px', fontSize: 13, color: th.sub }}>{children}</div>;

const MiniList = ({ th, rows, empty, render }) =>
  rows && rows.length ? (
    <div>
      {rows.map((r, i) => (
        <div key={r.id || i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${th.border}`, fontSize: 13, color: th.text }}>
          {render(r)}
        </div>
      ))}
    </div>
  ) : <Empty th={th}>{empty}</Empty>;

/* ------------------------------------------------------------------ */
/*  Agent detail                                                       */
/* ------------------------------------------------------------------ */
function AgentDetail({ th, id, onClose }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    api.get(`/admin/agents/${id}?days=30`).then(r => setD(r.data)).catch(() => { toast.error('Could not load this agent'); onClose(); });
  }, [id, onClose]);

  const sec = { fontSize: 12.5, fontWeight: 800, color: th.sub, margin: '16px 0 6px' };
  const line = { padding: '6px 0', borderBottom: `1px solid ${th.border}`, fontSize: 13, color: th.text, display: 'flex', justifyContent: 'space-between', gap: 10 };
  const path = c => [c.level1, c.level2, c.level3].filter(Boolean).join(' › ');

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(560px,100%)', height: '100%', overflowY: 'auto', background: th.card, borderInlineStart: `1px solid ${th.border}`, padding: 20, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 900, color: th.text }}>{d ? d.user.name : 'Loading…'}</div>
            {d && <div style={{ fontSize: 12.5, color: th.sub, marginTop: 2 }}>Wave ID {d.user.wave_id || '—'} · last seen {ago(d.user.last_seen)} · last 30 days</div>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ border: `1px solid ${th.border}`, background: 'transparent', color: th.text, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
        </div>

        {d && (
          <>
            <div style={sec}>Logins per day</div>
            {d.logins.length === 0 ? <Empty th={th}>No logins in the last 30 days.</Empty> : (
              <div style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.logins} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 10, fill: th.sub }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: th.sub }} />
                    <Tooltip contentStyle={{ background: th.card, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8 }} />
                    <Bar dataKey="logins" fill={ORANGE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={sec}>Evaluations (latest 10)</div>
            {d.evaluations.length === 0 ? <Empty th={th}>No evaluations yet.</Empty> : d.evaluations.map((e, i) => (
              <div key={i} style={line}>
                <span>{e.day} · <strong>{e.score == null ? '—' : e.score}</strong>{e.qa_officer ? ` · ${e.qa_officer}` : ''}</span>
                <span style={{ color: th.sub }}>{e.coaching_status || ''}</span>
              </div>
            ))}

            <div style={sec}>Ticket descriptions copied</div>
            {d.copies.length === 0 ? <Empty th={th}>None.</Empty> : d.copies.map((c, i) => <div key={i} style={line}><span>{path(c)}</span><span style={{ color: th.sub, whiteSpace: 'nowrap' }}>{ago(c.copied_at)}</span></div>)}

            <div style={sec}>Zone lookups</div>
            {d.zones.length === 0 ? <Empty th={th}>None.</Empty> : d.zones.map((z, i) => <div key={i} style={line}><span>{z.neighborhood} · {z.city} → <strong>{z.zone}</strong></span><span style={{ color: th.sub, whiteSpace: 'nowrap' }}>{ago(z.looked_up_at)}</span></div>)}

            <div style={sec}>Searches</div>
            {d.searches.length === 0 ? <Empty th={th}>None logged.</Empty> : d.searches.map((s, i) => (
              <div key={i} style={line}><span>{s.query}</span><span style={{ color: s.results ? th.sub : RED, whiteSpace: 'nowrap' }}>{s.results ? `${s.results} results` : 'no result'}</span></div>
            ))}

            <div style={sec}>Feedback sent</div>
            {d.feedback.length === 0 ? <Empty th={th}>None.</Empty> : d.feedback.map((f, i) => <div key={i} style={line}><span>{f.rating ? `${'★'.repeat(f.rating)} ` : ''}{f.message || '—'}</span><span style={{ color: th.sub, whiteSpace: 'nowrap' }}>{f.status}</span></div>)}

            <div style={sec}>Recent account activity</div>
            {d.activity.length === 0 ? <Empty th={th}>None.</Empty> : d.activity.map((a, i) => <div key={i} style={line}><span>{a.action}{a.details && a.details !== 'Login' ? ` · ${a.details}` : ''}</span><span style={{ color: th.sub, whiteSpace: 'nowrap' }}>{ago(a.created_at)}</span></div>)}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */
const COLS = [
  ['name', 'Agent'], ['online', 'Now'], ['last_seen', 'Last seen'], ['logins', 'Logins'], ['copies', 'Tickets'], ['zones', 'Zones'],
  ['searches', 'Searches'], ['faqs_viewed', 'FAQs read'], ['bookmarks', 'Saved'], ['feedback', 'Feedback'], ['avg_score', 'Avg score'], ['evals', 'Evals'],
];

export function AdminDashboard({ darkMode }) {
  const th = useTheme(darkMode);
  const [days, setDays] = useState(7);
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: 'logins', dir: 'desc' });
  const [openId, setOpenId] = useState(null);
  const [loadedAt, setLoadedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/admin/dashboard?days=${days}`);
      setD(r.data); setErr(false); setLoadedAt(new Date());
    } catch { setErr(true); }
  }, [days]);

  useEffect(() => { setD(null); load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  const rows = useMemo(() => {
    if (!d) return [];
    const s = q.trim().toLowerCase();
    let list = d.agents.filter(a => !s || `${a.name} ${a.wave_id || ''}`.toLowerCase().includes(s));
    const { key, dir } = sort;
    list = [...list].sort((a, b) => {
      let x = a[key], y = b[key];
      if (key === 'last_seen') { x = x ? new Date(x).getTime() : 0; y = y ? new Date(y).getTime() : 0; }
      else if (key === 'avg_score') { x = x == null ? -1 : Number(x); y = y == null ? -1 : Number(y); }
      else if (key === 'online') { x = x ? 1 : 0; y = y ? 1 : 0; }
      if (typeof x === 'string') return dir === 'asc' ? x.localeCompare(y) : y.localeCompare(x);
      return dir === 'asc' ? x - y : y - x;
    });
    return list;
  }, [d, q, sort]);

  const exportXlsx = () => {
    const data = rows.map(a => ({
      Agent: a.name, 'Wave ID': a.wave_id, 'Last seen': a.last_seen ? fmt(a.last_seen) : '', [`Logins (${days}d)`]: a.logins,
      'Ticket descriptions copied': a.copies, 'Zone lookups': a.zones, Searches: a.searches, 'FAQs read (all time)': a.faqs_viewed,
      Bookmarks: a.bookmarks, 'Feedback sent': a.feedback, 'Avg evaluation score': a.avg_score, Evaluations: a.evals,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Agents');
    XLSX.writeFile(wb, `agent-activity-${days}d.xlsx`);
  };

  const closeDetail = useCallback(() => setOpenId(null), []);

  if (err && !d) return <div style={{ color: th.sub }}>Could not load the dashboard. <button onClick={load} style={{ marginInlineStart: 8, cursor: 'pointer' }}>Try again</button></div>;
  if (!d) return <div style={{ color: th.sub }}>Loading…</div>;

  const k = d.kpis;
  const tick = { fontSize: 11, fill: th.sub };
  const tip = { background: th.card, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8 };
  const pct = k.agents ? Math.round((k.activeAgents / k.agents) * 100) : 0;
  const rangeBtn = on => ({ padding: '7px 14px', borderRadius: 9, border: `1px solid ${on ? ORANGE : th.border}`, background: on ? `${ORANGE}22` : 'transparent', color: th.text, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
  const grid = (min, extra) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 12, marginBottom: 14, ...extra });
  const th2 = { textAlign: 'start', padding: '8px 10px', fontSize: 12, color: th.sub, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', borderBottom: `1px solid ${th.border}` };
  const td = { padding: '9px 10px', fontSize: 13, color: th.text, whiteSpace: 'nowrap', borderBottom: `1px solid ${th.border}` };
  const needs = k.inactive7 + k.feedbackNew + k.flagsOpen + k.coachingPending;

  return (
    <div>
      {/* toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[[1, 'Today'], [7, '7 days'], [30, '30 days'], [90, '90 days']].map(([n, l]) => (
            <button key={n} style={rangeBtn(days === n)} onClick={() => setDays(n)}>{l}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: th.sub }}>
          {loadedAt ? `Updated ${loadedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · refreshes every minute` : ''}
          <button onClick={load} style={{ marginInlineStart: 10, padding: '5px 12px', borderRadius: 8, border: `1px solid ${th.border}`, background: 'transparent', color: th.text, cursor: 'pointer', fontFamily: 'inherit' }}>Refresh</button>
        </div>
      </div>

      {/* KPIs */}
      <style>{`.ad-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}@media (max-width:900px){.ad-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}`}</style>
      <div className="ad-kpis">
        <Kpi th={th} label="Agents" value={k.agents} sub="active accounts" />
        <Kpi th={th} label="Online now" value={k.online} color={GREEN} sub="seen in the last 5 minutes" />
        <Kpi th={th} label="Agents who logged in" value={`${k.activeAgents}`} sub={`${pct}% of agents`} />
        <Kpi th={th} label="Logins" value={k.logins} sub={`in ${days === 1 ? 'the last day' : `${days} days`}`} />
        <Kpi th={th} label="Ticket descriptions copied" value={k.copies} color={ORANGE} />
        <Kpi th={th} label="Zone lookups" value={k.zones} color={BLUE} />
        <Kpi th={th} label="Searches" value={k.searches} sub={k.searches ? `${k.noResult} found nothing` : 'logging started'} />
        <Kpi th={th} label="Needs attention" value={needs} color={needs ? RED : GREEN} warn={needs > 0} sub="see the list below" />
      </div>

      {/* needs attention */}
      <Panel th={th} title="Needs attention" hint="Things that are waiting for you" style={{ marginBottom: 14 }}>
        <div style={grid(220, { marginBottom: 0 })}>
          <div style={{ background: th.soft, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.inactive7 ? RED : GREEN }}>{k.inactive7}</div>
            <div style={{ fontSize: 13, color: th.text, fontWeight: 700 }}>Agents with no login for 7 days</div>
            <div style={{ fontSize: 12, color: th.sub, marginTop: 6, lineHeight: 1.5 }}>
              {d.attention.inactive.slice(0, 6).map(a => a.name).join(', ') || 'Everyone has logged in this week.'}{d.attention.inactive.length > 6 ? '…' : ''}
            </div>
          </div>
          <div style={{ background: th.soft, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.feedbackNew ? ORANGE : GREEN }}>{k.feedbackNew}</div>
            <div style={{ fontSize: 13, color: th.text, fontWeight: 700 }}>New agent feedback</div>
            <div style={{ fontSize: 12, color: th.sub, marginTop: 6 }}>Open Quality → Agent Feedback.</div>
          </div>
          <div style={{ background: th.soft, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.flagsOpen ? ORANGE : GREEN }}>{k.flagsOpen}</div>
            <div style={{ fontSize: 13, color: th.text, fontWeight: 700 }}>Open flags on ticket descriptions</div>
            <div style={{ fontSize: 12, color: th.sub, marginTop: 6 }}>Agents reported a wrong or missing text.</div>
          </div>
          <div style={{ background: th.soft, borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.coachingPending ? ORANGE : GREEN }}>{k.coachingPending}</div>
            <div style={{ fontSize: 13, color: th.text, fontWeight: 700 }}>Coaching not marked done</div>
            <div style={{ fontSize: 12, color: th.sub, marginTop: 6 }}>Evaluations with a pending coaching status.</div>
          </div>
        </div>
      </Panel>

      {/* charts */}
      <div style={grid(340)}>
        <Panel th={th} title="Logins per day" hint="Total logins and different agents">
          {d.series.logins.length === 0 ? <Empty th={th}>No logins in this period.</Empty> : (
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.series.logins} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={th.grid} />
                  <XAxis dataKey="day" tickFormatter={shortDay} tick={tick} />
                  <YAxis allowDecimals={false} tick={tick} />
                  <Tooltip contentStyle={tip} />
                  <Area type="monotone" dataKey="logins" name="Logins" stroke={ORANGE} fill={`${ORANGE}33`} strokeWidth={2} />
                  <Area type="monotone" dataKey="people" name="Agents" stroke={BLUE} fill={`${BLUE}22`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel th={th} title="Tool use per day" hint="Ticket descriptions copied and zones looked up">
          {d.series.tools.length === 0 ? <Empty th={th}>No tool use in this period.</Empty> : (
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.series.tools} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={th.grid} />
                  <XAxis dataKey="day" tickFormatter={shortDay} tick={tick} />
                  <YAxis allowDecimals={false} tick={tick} />
                  <Tooltip contentStyle={tip} />
                  <Bar dataKey="copies" name="Tickets" stackId="a" fill={ORANGE} />
                  <Bar dataKey="zones" name="Zones" stackId="a" fill={BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel th={th} title="When agents log in" hint="By hour, Erbil time">
          {d.series.peak.length === 0 ? <Empty th={th}>No logins in this period.</Empty> : (
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.series.peak} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={th.grid} />
                  <XAxis dataKey="hour" tick={tick} />
                  <YAxis allowDecimals={false} tick={tick} />
                  <Tooltip contentStyle={tip} labelFormatter={h => `${h}:00`} />
                  <Bar dataKey="logins" name="Logins" fill={GREEN} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      {/* agents table */}
      <Panel
        th={th}
        title="Every agent"
        hint={`Activity in the last ${days === 1 ? 'day' : `${days} days`}. Click a column to sort, click an agent to see everything they did.`}
        style={{ marginBottom: 14 }}
        right={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find an agent…" style={{ padding: '7px 12px', borderRadius: 9, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' }} />
            <button onClick={exportXlsx} style={{ padding: '7px 12px', borderRadius: 9, border: `1px solid ${th.border}`, background: 'transparent', color: th.text, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Export Excel</button>
          </div>
        )}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {COLS.map(([key, label]) => (
                  <th key={key} style={th2} onClick={() => setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))}>
                    {label}{sort.key === key ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(a => (
                <tr key={a.id} onClick={() => setOpenId(a.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ ...td, fontWeight: 700 }}>{a.name}<span style={{ color: th.sub, fontWeight: 400 }}> {a.wave_id ? `· ${a.wave_id}` : ''}</span></td>
                  <td style={td}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: a.online ? GREEN : th.grid }} title={a.online ? 'Online' : 'Offline'} /></td>
                  <td style={{ ...td, color: a.last_seen && Date.now() - new Date(a.last_seen).getTime() < 7 * 864e5 ? th.text : RED }}>{ago(a.last_seen)}</td>
                  <td style={td}>{a.logins}</td>
                  <td style={td}>{a.copies}</td>
                  <td style={td}>{a.zones}</td>
                  <td style={td}>{a.searches}</td>
                  <td style={td}>{a.faqs_viewed}</td>
                  <td style={td}>{a.bookmarks}</td>
                  <td style={td}>{a.feedback}</td>
                  <td style={td}>{a.avg_score == null ? '—' : a.avg_score}</td>
                  <td style={td}>{a.evals}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={COLS.length} style={{ ...td, color: th.sub }}>No agents match.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* content health */}
      <div style={grid(340)}>
        <Panel th={th} title="Most-read FAQs" hint="All time">
          <MiniList th={th} rows={d.content.topFaqs} empty="No FAQ views yet." render={f => (<><span>{f.question_en}</span><strong>{f.views}</strong></>)} />
        </Panel>
        <Panel th={th} title="FAQs nobody has opened" hint="Newest first. Check they are findable, or remove them.">
          <MiniList th={th} rows={d.content.neverViewed} empty="Every published FAQ has been opened." render={f => (<><span>{f.question_en}</span><span style={{ color: th.sub }}>{f.category}</span></>)} />
        </Panel>
        <Panel th={th} title="FAQs agents marked unhelpful" hint="Worth rewriting">
          <MiniList th={th} rows={d.content.unhelpful} empty="No unhelpful ratings." render={f => (<><span>{f.question_en}</span><span style={{ color: RED, whiteSpace: 'nowrap' }}>👎 {f.down}{f.up ? ` · 👍 ${f.up}` : ''}</span></>)} />
        </Panel>
        <Panel th={th} title="Searches that found nothing" hint="Add these as Key terms or new FAQs">
          <MiniList th={th} rows={d.content.noResult} empty="Nothing yet. Searches are logged from now on." render={s => (<><span>{s.query}</span><span style={{ color: th.sub, whiteSpace: 'nowrap' }}>{s.times}× · {s.people} agent{s.people === 1 ? '' : 's'}</span></>)} />
        </Panel>
      </div>

      {/* quality */}
      <div style={grid(340)}>
        <Panel th={th} title="Evaluation score over time" hint="Average per day">
          {d.quality.daily.length === 0 ? <Empty th={th}>No evaluations in this period.</Empty> : (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.quality.daily.map(x => ({ ...x, avg: Number(x.avg) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={th.grid} />
                  <XAxis dataKey="day" tickFormatter={shortDay} tick={tick} />
                  <YAxis domain={['auto', 'auto']} tick={tick} />
                  <Tooltip contentStyle={tip} />
                  <Line type="monotone" dataKey="avg" name="Average score" stroke={ORANGE} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel th={th} title="Lowest average scores" hint="Agents who may need coaching">
          <MiniList th={th} rows={d.quality.lowest} empty="No evaluations in this period." render={a => (<><span>{a.agent_name}</span><span style={{ whiteSpace: 'nowrap' }}><strong>{a.avg == null ? '—' : a.avg}</strong><span style={{ color: th.sub }}> · {a.n} eval{a.n === 1 ? '' : 's'}</span></span></>)} />
        </Panel>
        <Panel th={th} title="Newest agent feedback" hint="Not yet reviewed">
          <MiniList th={th} rows={d.attention.feedback} empty="No new feedback." render={f => (<><span>{f.rating ? `${'★'.repeat(f.rating)} ` : ''}{f.message || '—'}</span><span style={{ color: th.sub, whiteSpace: 'nowrap' }}>{f.user_name || ''}</span></>)} />
        </Panel>
      </div>

      {openId && <AgentDetail th={th} id={openId} onClose={closeDetail} />}
    </div>
  );
}
