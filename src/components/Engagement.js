import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { track } from '../utils/track';
import { NAV_ITEMS, STAFF_NAV, searchNav } from '../utils/navItems';
import { useTheme, Panel, Kpi, Empty, Pill, gridStyle, ORANGE, GREEN, RED, AMBER, BLUE } from './qaUi';

const errMsg = e => e?.response?.data?.error || 'Something went wrong';
const dayShort = d => { try { return new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short' }); } catch { return d; } };
const ago = d => { const n = Math.floor((Date.now() - Date.parse(d)) / 86400000); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; };

/* ───────────────────────── Daily check-in (agents) ───────────────────────── */
export function DailyCheckIn({ onOpenChat, unread }) {
  const { user } = useAuth();
  const [done, setDone] = useState(true); // assume done until we know, so the banner never flashes
  const [busy, setBusy] = useState(false);
  const [thanks, setThanks] = useState(false);
  useEffect(() => { api.get('/checkin/today').then(r => setDone(!!r.data.done)).catch(() => setDone(true)); }, []);
  const go = async () => {
    setBusy(true);
    try { await api.post('/checkin'); setDone(true); setThanks(true); setTimeout(() => setThanks(false), 3500); } catch { toast.error('Could not save. Please try again.'); }
    setBusy(false);
  };
  const name = (user?.name || '').split(' ')[0];
  if (thanks) {
    return <div style={{ marginBottom: 14, background: `${GREEN}18`, border: `1px solid ${GREEN}66`, borderRadius: 16, padding: '12px 16px', fontWeight: 800, color: '#047857', fontSize: 14 }}>✅ Thank you{name ? `, ${name}` : ''}. You are ready for your shift.</div>;
  }
  if (done) return null;
  return (
    <div style={{ marginBottom: 16, background: 'linear-gradient(120deg,#FF6B35,#ff9a6c)', borderRadius: 18, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', color: '#fff', boxShadow: '0 10px 26px rgba(255,107,53,.35)' }}>
      <div style={{ fontSize: 30 }}>☀️</div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>Before your shift{name ? `, ${name}` : ''}</div>
        <div style={{ fontSize: 13, opacity: 0.95, marginTop: 2, lineHeight: 1.55 }}>Read today's updates{unread ? ` (${unread} new)` : ''}, then confirm below.</div>
      </div>
      {onOpenChat && <button onClick={onOpenChat} style={{ background: 'rgba(255,255,255,.22)', color: '#fff', border: '1px solid rgba(255,255,255,.55)', borderRadius: 12, padding: '9px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>💬 Open Updates Chat</button>}
      <button onClick={go} disabled={busy} style={{ background: '#fff', color: '#d9531f', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 900, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 0 rgba(0,0,0,.18)' }}>✅ I've checked today's updates</button>
    </div>
  );
}

/* ───────────────────────── "Go to" search (pages and sections, not FAQ answers) ───────────────────────── */
export function NavSearch({ darkMode, onGo }) {
  const { user } = useAuth();
  const isStaff = ['team_lead', 'qa_officer'].includes(String(user?.role || '').toLowerCase());
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [extra, setExtra] = useState([]);
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [sheet, setSheet] = useState(false);
  const loaded = useRef(false);
  const input = useRef(null);
  const box = useRef(null);

  useEffect(() => { const f = () => setMobile(window.innerWidth <= 768); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  useEffect(() => {
    const onKey = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (mobile) setSheet(true); else input.current && input.current.focus(); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [mobile]);
  useEffect(() => {
    const away = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', away); return () => document.removeEventListener('mousedown', away);
  }, []);

  // folders, files, SMS and links can be found by their names too (loaded the first time the box is used)
  const loadExtra = useCallback(() => {
    if (loaded.current) return; loaded.current = true;
    const add = [];
    Promise.all([
      api.get(isStaff ? '/folders?all=1' : '/folders').then(r => (r.data || []).forEach(f => {
        add.push({ key: `_folder_${f.id}`, icon: f.icon || '📁', label: f.name, group: 'Folders', words: 'folder files' });
        (f.links || []).forEach(l => add.push({ key: `_folder_${f.id}`, icon: '📄', label: l.title, group: `In folder ${f.name}`, words: f.name }));
      })).catch(() => {}),
      api.get('/sms').then(r => (r.data || []).forEach(t => (t.templates || []).forEach(x => add.push({ key: '_sms', icon: '✉️', label: x.title, group: 'SMS Templates', words: `sms ${t.name}` })))).catch(() => {}),
      api.get('/external-tools').then(r => (r.data || []).forEach(t => add.push({ key: '_extlinks', icon: '🔗', label: t.name, group: 'External Links', words: 'link open' }))).catch(() => {}),
    ]).then(() => setExtra(add));
  }, [isStaff]);

  const items = useMemo(() => [...NAV_ITEMS, ...(isStaff ? STAFF_NAV : []), ...extra], [isStaff, extra]);
  const hits = useMemo(() => searchNav(items, q), [items, q]);

  const choose = it => { if (!it) return; track('navsearch', q.trim(), hits.length); onGo(it.key); setQ(''); setOpen(false); setSheet(false); };
  // remember searches that found nothing, so the team can see what agents look for
  useEffect(() => {
    if (!q.trim() || hits.length) return;
    const t = setTimeout(() => track('navsearch', q.trim(), 0), 1400);
    return () => clearTimeout(t);
  }, [q, hits.length]);

  const onKey = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(hits.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(hits[sel] || hits[0]); }
    else if (e.key === 'Escape') { setOpen(false); setSheet(false); input.current && input.current.blur(); }
  };
  const dm = darkMode;
  const field = { background: dm ? 'rgba(255,255,255,.08)' : '#f1f5f9', color: dm ? '#f1f5f9' : '#0B1120', border: `1.5px solid ${dm ? 'rgba(255,255,255,.15)' : '#cbd5e1'}`, borderRadius: 12, padding: '9px 12px 9px 34px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const list = (
    <div style={{ background: dm ? '#0d1526' : '#fff', border: `1px solid ${dm ? 'rgba(255,255,255,.12)' : '#e2e8f0'}`, borderRadius: 14, boxShadow: '0 16px 40px rgba(15,23,42,.22)', overflow: 'hidden' }}>
      {hits.length ? hits.map((it, i) => (
        <button key={`${it.key}-${it.label}-${i}`} onMouseEnter={() => setSel(i)} onClick={() => choose(it)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'start', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '9px 12px', background: i === sel ? (dm ? 'rgba(255,107,53,.18)' : '#fff1ea') : 'transparent', color: dm ? '#f1f5f9' : '#0B1120' }}>
          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{it.icon}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
            <span style={{ display: 'block', fontSize: 11.5, color: dm ? 'rgba(255,255,255,.5)' : '#64748b' }}>{it.group}</span>
          </span>
          {i === sel && <span style={{ fontSize: 11, color: ORANGE, fontWeight: 800 }}>Enter ↵</span>}
        </button>
      )) : (
        <div style={{ padding: '12px 14px', fontSize: 13, color: dm ? 'rgba(255,255,255,.6)' : '#64748b', lineHeight: 1.6 }}>
          No page called “{q}”. To look for an answer to a customer question, use the orange search box on the left.
        </div>
      )}
    </div>
  );

  if (mobile) {
    return (
      <>
        <button onClick={() => { setSheet(true); loadExtra(); setTimeout(() => input.current && input.current.focus(), 50); }} aria-label="Go to a page"
          style={{ background: dm ? 'rgba(255,255,255,.1)' : '#f8fafc', border: `1px solid ${dm ? 'rgba(255,255,255,.15)' : '#e2e8f0'}`, borderRadius: 12, width: 40, height: 40, cursor: 'pointer', fontSize: 17 }}>🧭</button>
        {sheet && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,.45)' }} onClick={() => setSheet(false)}>
            <div style={{ margin: '12px 12px 0' }} onClick={e => e.stopPropagation()}>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <span style={{ position: 'absolute', left: 11, top: 9, fontSize: 15 }}>🧭</span>
                <input ref={input} autoFocus value={q} onChange={e => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} placeholder="Go to a page…" style={field} />
              </div>
              {q.trim() ? list : <div style={{ color: '#fff', fontSize: 13, padding: '4px 6px' }}>Type a page name, for example “zones” or “evaluations”.</div>}
            </div>
          </div>
        )}
      </>
    );
  }
  return (
    <div ref={box} style={{ position: 'relative', width: 'min(340px, 28vw)', minWidth: 210 }}>
      <span style={{ position: 'absolute', left: 11, top: 9, fontSize: 15, pointerEvents: 'none' }}>🧭</span>
      <input ref={input} value={q} onFocus={() => { setOpen(true); loadExtra(); }} onChange={e => { setQ(e.target.value); setSel(0); setOpen(true); }} onKeyDown={onKey}
        placeholder="Go to a page…  (Ctrl+K)" aria-label="Go to a page" style={field} />
      {open && q.trim() && <div style={{ position: 'absolute', top: 46, left: 0, right: 0, zIndex: 1100 }}>{list}</div>}
    </div>
  );
}

/* ───────────────────────── Admin: Engagement ───────────────────────── */
function Tabs({ th, tab, setTab, tabs }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
      {tabs.map(([k, label]) => (
        <button key={k} onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: 100, border: `1px solid ${tab === k ? ORANGE : th.border}`, background: tab === k ? ORANGE : th.card, color: tab === k ? '#fff' : th.text, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
      ))}
    </div>
  );
}

function CheckIns({ th }) {
  const [d, setD] = useState(null);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { api.get('/admin/engagement/checkins').then(r => setD(r.data)).catch(() => setD({ agents: [], days: [], total: 0, done: 0 })); }, []);
  if (!d) return <Empty th={th}>Loading…</Empty>;
  const not = d.agents.filter(a => !a.today);
  const pct = d.total ? Math.round((d.done / d.total) * 100) : 0;
  const list = showAll ? d.agents : not;
  return (
    <>
      <div style={gridStyle(150)}>
        <Kpi th={th} label="Checked in today" value={`${d.done} / ${d.total}`} sub={`${pct}% of agents`} color={pct >= 90 ? GREEN : pct >= 60 ? AMBER : RED} />
        <Kpi th={th} label="Not yet today" value={not.length} color={not.length ? RED : GREEN} />
        <Kpi th={th} label="Checked in every day" value={d.agents.filter(a => a.count === d.days.length).length} sub={`last ${d.days.length} days`} color={BLUE} />
      </div>
      <Panel th={th} title={showAll ? 'All agents' : 'Agents who have not checked in today'} hint="An agent checks in with one tap on the banner at the top of their page. Times are Erbil time."
        right={<button onClick={() => setShowAll(!showAll)} style={{ border: `1px solid ${th.border}`, background: 'transparent', color: th.text, borderRadius: 10, padding: '5px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{showAll ? 'Show only missing' : 'Show everyone'}</button>}>
        {!list.length ? <Empty th={th}>Everyone has checked in today 🎉</Empty> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ textAlign: 'start', color: th.sub }}>
                <th style={{ padding: '6px 8px', textAlign: 'start' }}>Agent</th><th style={{ padding: '6px 8px', textAlign: 'start' }}>Wave</th>
                {d.days.map(x => <th key={x} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 600 }}>{dayShort(x)}</th>)}
                <th style={{ padding: '6px 8px' }}>Today</th>
              </tr></thead>
              <tbody>
                {list.map(a => (
                  <tr key={a.id} style={{ borderTop: `1px solid ${th.border}`, color: th.text }}>
                    <td style={{ padding: '7px 8px', fontWeight: 700 }}>{a.name}</td><td style={{ padding: '7px 8px', color: th.sub }}>{a.wave_id || '-'}</td>
                    {a.marks.map((m, i) => <td key={i} style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: m ? GREEN : `${RED}33` }} /></td>)}
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: a.today ? GREEN : RED, fontWeight: 800 }}>{a.today || 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function DisputeCard({ th, x, onDone }) {
  const [reply, setReply] = useState('');
  const [outcome, setOutcome] = useState('kept');
  const [busy, setBusy] = useState(false);
  const send = async () => { setBusy(true); try { await api.post(`/admin/engagement/disputes/${x.eval_id}/${x.user_id}/resolve`, { reply, outcome }); toast.success('Reply sent to the agent'); onDone(); } catch (e) { toast.error(errMsg(e)); } setBusy(false); };
  const open = x.dispute_status === 'open';
  const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 11px', borderRadius: 9, border: `1px solid ${th.border}`, background: th.input || th.soft, color: th.text, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' };
  return (
    <div style={{ border: `1px solid ${open ? AMBER : th.border}`, borderRadius: 14, padding: '12px 14px', marginBottom: 10, background: th.card }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        <strong style={{ color: th.text }}>{x.name}</strong><span style={{ color: th.sub, fontSize: 12.5 }}>Wave {x.wave_id || '-'}</span>
        <Pill color={open ? AMBER : GREEN}>{open ? 'Open' : x.dispute_status}</Pill>
        <span style={{ marginInlineStart: 'auto', fontSize: 12, color: th.sub }}>sent {ago(x.disputed_at)}</span>
      </div>
      <div style={{ fontSize: 12.5, color: th.sub, marginBottom: 6 }}>Call {x.call_date ? String(x.call_date).slice(0, 10) : '-'} · Ref {x.ticket_ref || '-'} · {x.subject || 'No subject'} · Score {x.final_score}/33 · QA {x.qa_officer || '-'}</div>
      <div style={{ background: th.soft, borderRadius: 10, padding: '8px 10px', fontSize: 13.5, color: th.text, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{x.dispute_text}</div>
      {open ? (
        <div style={{ marginTop: 10 }}>
          <textarea rows={2} style={inp} placeholder="Your reply to the agent (explain the decision)" maxLength={800} value={reply} onChange={e => setReply(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={outcome} onChange={e => setOutcome(e.target.value)} style={{ ...inp, width: 'auto' }}>
              <option value="kept">Score stays</option><option value="changed">Score changed</option>
            </select>
            <button disabled={busy || !reply.trim()} onClick={send} style={{ border: 'none', background: ORANGE, color: '#fff', borderRadius: 10, padding: '8px 16px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: reply.trim() ? 1 : 0.5 }}>Send reply</button>
          </div>
          <div style={{ fontSize: 11.5, color: th.sub, marginTop: 4 }}>“Score changed” only tells the agent. Change the score itself in the QA workbook and upload it again.</div>
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 13, color: th.text }}><strong>Reply by {x.resolved_by}:</strong> {x.staff_reply}</div>
      )}
    </div>
  );
}

function EvalAcks({ th }) {
  const [d, setD] = useState(null);
  const load = useCallback(() => api.get('/admin/engagement/evals').then(r => setD(r.data)).catch(() => setD({ agents: [], disputes: [], totals: { evals: 0, acked: 0 } })), []);
  useEffect(() => { load(); }, [load]);
  if (!d) return <Empty th={th}>Loading…</Empty>;
  const withUnread = d.agents.filter(a => a.unread > 0);
  const pct = d.totals.evals ? Math.round((d.totals.acked / d.totals.evals) * 100) : 0;
  const open = d.disputes.filter(x => x.dispute_status === 'open');
  return (
    <>
      <div style={gridStyle(150)}>
        <Kpi th={th} label="Evaluations confirmed" value={`${pct}%`} sub={`${d.totals.acked} of ${d.totals.evals}`} color={pct >= 80 ? GREEN : pct >= 50 ? AMBER : RED} />
        <Kpi th={th} label="Agents with unread" value={withUnread.length} color={withUnread.length ? AMBER : GREEN} />
        <Kpi th={th} label="Open disputes" value={open.length} color={open.length ? RED : GREEN} sub={`agents have ${d.disputeDays} days to dispute`} />
      </div>
      <Panel th={th} title="⚖️ Disputes" hint="Agents can dispute a score within a few days of the evaluation being posted. Open ones first.">
        {!d.disputes.length ? <Empty th={th}>No disputes yet.</Empty> : d.disputes.map(x => <DisputeCard key={`${x.eval_id}-${x.user_id}`} th={th} x={x} onDone={load} />)}
      </Panel>
      <Panel th={th} title="👀 Agents who have not confirmed their evaluations" hint="“I've read this” is tapped by the agent on each evaluation. Most unread first.">
        {!withUnread.length ? <Empty th={th}>Everyone has confirmed all their evaluations 🎉</Empty> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ color: th.sub }}><th style={{ padding: '6px 8px', textAlign: 'start' }}>Agent</th><th style={{ padding: '6px 8px', textAlign: 'start' }}>Wave</th><th style={{ padding: '6px 8px' }}>Unread</th><th style={{ padding: '6px 8px' }}>Confirmed</th><th style={{ padding: '6px 8px' }}>Waiting since</th></tr></thead>
              <tbody>{withUnread.map(a => (
                <tr key={a.id} style={{ borderTop: `1px solid ${th.border}`, color: th.text }}>
                  <td style={{ padding: '7px 8px', fontWeight: 700 }}>{a.name}</td><td style={{ padding: '7px 8px', color: th.sub }}>{a.wave_id || '-'}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'center', color: a.unread >= 3 ? RED : AMBER, fontWeight: 800 }}>{a.unread}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'center' }}>{a.acked} / {a.total}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'center', color: th.sub }}>{a.oldest_unread ? `${ago(a.oldest_unread)}` : '-'}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}

function UsageList({ th, title, rows, empty, unit = 'times' }) {
  const max = Math.max(1, ...rows.map(r => r.n));
  return (
    <Panel th={th} title={title}>
      {!rows.length ? <Empty th={th}>{empty}</Empty> : rows.map(r => (
        <div key={r.item || r.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,1fr) 1.2fr 64px', gap: 10, alignItems: 'center', padding: '4px 0', fontSize: 13, color: th.text }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.item}>{r.item}</span>
          <span style={{ height: 8, borderRadius: 4, background: th.soft, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${(r.n / max) * 100}%`, background: ORANGE, borderRadius: 4 }} /></span>
          <span style={{ color: th.sub, textAlign: 'end' }}>{r.n} {unit === 'times' ? '' : unit}</span>
        </div>
      ))}
    </Panel>
  );
}

function Usage({ th }) {
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);
  useEffect(() => { setD(null); api.get(`/admin/engagement/usage?days=${days}`).then(r => setD(r.data)).catch(() => setD({ pages: [], links: [], files: [], navSearches: [], navMisses: [], faqs: [], navTotal: 0 })); }, [days]);
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, color: th.sub, fontWeight: 700 }}>Period</span>
        {[7, 30, 90].map(n => <button key={n} onClick={() => setDays(n)} style={{ padding: '5px 12px', borderRadius: 100, border: `1px solid ${days === n ? th.text : th.border}`, background: days === n ? th.text : 'transparent', color: days === n ? th.card : th.text, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{n} days</button>)}
      </div>
      {!d ? <Empty th={th}>Loading…</Empty> : (
        <>
          <Panel th={th} title="🧭 “Go to” searches that found nothing" hint={`Agents searched the page finder ${d.navTotal} time${d.navTotal === 1 ? '' : 's'}. These words found no page: add them as names for an existing page, or build the missing page.`}>
            {!d.navMisses.length ? <Empty th={th}>Nothing missed. Every search found a page.</Empty> : d.navMisses.map(m => (
              <div key={m.item} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderTop: `1px solid ${th.border}`, color: th.text, fontSize: 13.5 }}>
                <strong style={{ flex: 1 }}>{m.item}</strong><span style={{ color: th.sub, fontSize: 12.5 }}>{m.n} search{m.n === 1 ? '' : 'es'} · {m.people} agent{m.people === 1 ? '' : 's'}</span>
              </div>))}
          </Panel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
            <UsageList th={th} title="📄 Most visited pages" rows={d.pages} empty="No visits recorded yet. Data appears as agents use the site." />
            <UsageList th={th} title="🔗 Most used external links" rows={d.links} empty="No link clicks yet." />
            <UsageList th={th} title="📁 Most opened folder files" rows={d.files} empty="No file opens yet." />
            <UsageList th={th} title="🧭 What agents look for with “Go to”" rows={d.navSearches} empty="No searches yet." />
          </div>
          <Panel th={th} title="❓ Most viewed FAQs (all time)" style={{ marginTop: 14 }}>
            {!d.faqs.length ? <Empty th={th}>No FAQ views yet.</Empty> : d.faqs.map(f => (
              <div key={f.id} style={{ display: 'flex', gap: 10, padding: '5px 0', borderTop: `1px solid ${th.border}`, fontSize: 13, color: th.text }}>
                <span style={{ flex: 1 }}>{f.question_en}</span><span style={{ color: th.sub }}>{f.category}</span><strong>{f.views}</strong>
              </div>))}
          </Panel>
        </>
      )}
    </>
  );
}

export default function EngagementAdmin({ darkMode }) {
  const th = useTheme(darkMode);
  const [tab, setTab] = useState('checkins');
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ color: th.sub, fontSize: 13, marginBottom: 12 }}>Are agents reading what we send? Chat read receipts (“Seen by …”) are shown under each message in the Updates Chat.</div>
      <Tabs th={th} tab={tab} setTab={setTab} tabs={[['checkins', '☀️ Daily check-in'], ['evals', '⭐ Evaluations & disputes'], ['usage', '📊 Usage']]} />
      {tab === 'checkins' && <CheckIns th={th} />}
      {tab === 'evals' && <EvalAcks th={th} />}
      {tab === 'usage' && <Usage th={th} />}
    </div>
  );
}
