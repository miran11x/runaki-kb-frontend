import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../utils/api';

// Admin Panel → Tool Reports: usage reports for Ticket Descriptions and Zone Lookup
// (Dashboard, Weekly Digest, Activity Log, Maintenance & Backup). Team lead only.

const ORANGE = '#FF6B35';
const NAVY = '#0B1120';
const COLORS = ['#FF6B35', '#22D3EE', '#34D399', '#818CF8', '#FB7185', '#FBBF24', '#38BDF8'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fmt = d => { try { return new Date(d).toLocaleString(); } catch { return ''; } };
const ymd = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function useTheme(dark) {
  return dark
    ? { card: '#111827', input: '#0b1220', border: 'rgba(255,255,255,0.12)', text: '#e2e8f0', sub: 'rgba(255,255,255,0.5)', grid: 'rgba(255,255,255,0.1)' }
    : { card: '#fff', input: '#f8fafc', border: '#e2e8f0', text: NAVY, sub: '#64748b', grid: '#e2e8f0' };
}

function RangeBar({ th, range, setRange }) {
  const preset = days => {
    const to = new Date(), from = new Date();
    from.setDate(from.getDate() - (days - 1));
    setRange({ from: ymd(from), to: ymd(to) });
  };
  const inp = { padding: '7px 10px', borderRadius: 8, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 12.5, fontFamily: 'inherit' };
  const btn = { padding: '7px 12px', borderRadius: 8, border: `1px solid ${th.border}`, background: 'transparent', color: th.text, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
      <button style={btn} onClick={() => setRange({ from: '', to: '' })}>All time</button>
      <button style={btn} onClick={() => preset(1)}>Today</button>
      <button style={btn} onClick={() => preset(7)}>7 days</button>
      <button style={btn} onClick={() => preset(30)}>30 days</button>
      <input type="date" style={inp} value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} />
      <span style={{ color: th.sub }}>→</span>
      <input type="date" style={inp} value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} />
    </div>
  );
}

const Card = ({ th, title, children, h }) => (
  <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 16 }}>
    <div style={{ fontSize: 12.5, fontWeight: 800, color: th.sub, marginBottom: 10 }}>{title}</div>
    {h ? <div style={{ width: '100%', height: h }}>{children}</div> : children}
  </div>
);
const Kpi = ({ th, label, value, color }) => (
  <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: '14px 16px' }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: th.sub, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color: color || th.text }}>{value}</div>
  </div>
);

/* ---------------- Dashboard ---------------- */
function Dashboard({ th }) {
  const [range, setRange] = useState({ from: '', to: '' });
  const [d, setD] = useState(null);
  useEffect(() => {
    setD(null);
    const qs = new URLSearchParams();
    if (range.from) qs.set('from', range.from);
    if (range.to) qs.set('to', range.to);
    api.get(`/td/reports/dashboard?${qs}`).then(r => setD(r.data)).catch(() => toast.error('Could not load the dashboard'));
  }, [range]);

  const max = useMemo(() => (d ? Math.max(1, ...d.heatmap.flat()) : 1), [d]);
  const tick = { fontSize: 11, fill: th.sub };
  const tip = { background: th.card, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8 };

  return (
    <div>
      <RangeBar th={th} range={range} setRange={setRange} />
      {!d ? <div style={{ color: th.sub }}>Loading…</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 14 }}>
            <Kpi th={th} label="Agents" value={d.agents} />
            <Kpi th={th} label="Used the tools" value={d.activeAgents} color="#10b981" />
            <Kpi th={th} label="Descriptions copied" value={d.copies} />
            <Kpi th={th} label="Zone lookups" value={d.zones} color="#22D3EE" />
            <Kpi th={th} label="Top category" value={<span style={{ fontSize: 16 }}>{d.topCategories[0]?.name || '—'}</span>} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 14 }}>
            <Card th={th} title="Most-copied categories" h={260}>
              <ResponsiveContainer><BarChart data={d.topCategories} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke={th.grid} horizontal={false} /><XAxis type="number" tick={tick} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={130} tick={tick} /><Tooltip contentStyle={tip} />
                <Bar dataKey="count" fill={ORANGE} radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
            </Card>
            <Card th={th} title="Category share" h={260}>
              <ResponsiveContainer><PieChart>
                <Pie data={d.share} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={2}>
                  {d.share.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip contentStyle={tip} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>
            </Card>
            <Card th={th} title="Agent leaderboard (copies)" h={280}>
              <ResponsiveContainer><BarChart data={d.leaderboard}>
                <CartesianGrid stroke={th.grid} /><XAxis dataKey="name" tick={{ fontSize: 9, fill: th.sub }} interval={0} angle={-35} textAnchor="end" height={70} />
                <YAxis tick={tick} allowDecimals={false} /><Tooltip contentStyle={tip} />
                <Bar dataKey="count" fill="#22D3EE" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            </Card>
            <Card th={th} title="Most-searched neighborhoods" h={280}>
              <ResponsiveContainer><BarChart data={d.topZones} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke={th.grid} horizontal={false} /><XAxis type="number" tick={tick} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: th.sub }} /><Tooltip contentStyle={tip} />
                <Bar dataKey="count" fill="#22D3EE" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
            </Card>
            <div style={{ gridColumn: '1 / -1' }}>
              <Card th={th} title="Daily activity" h={260}>
                <ResponsiveContainer><LineChart data={d.trend}>
                  <CartesianGrid stroke={th.grid} /><XAxis dataKey="day" tick={{ fontSize: 10, fill: th.sub }} /><YAxis tick={tick} allowDecimals={false} />
                  <Tooltip contentStyle={tip} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="copies" name="Copies" stroke={ORANGE} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="zones" name="Zone lookups" stroke="#22D3EE" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
              </Card>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Card th={th} title="Activity by hour and weekday (Erbil time)">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr><th></th>{Array.from({ length: 24 }, (_, h) => <th key={h} style={{ padding: 2, color: th.sub, fontWeight: 400 }}>{h}</th>)}</tr></thead>
                  <tbody>{DAYS.map((day, di) => (
                    <tr key={day}><td style={{ paddingInlineEnd: 8, color: th.sub }}>{day}</td>
                      {d.heatmap[di].map((v, hi) => (
                        <td key={hi} style={{ padding: 2 }}><div title={`${v}`} style={{ width: 16, height: 16, borderRadius: 3, background: `rgba(255,107,53,${v === 0 ? 0.07 : 0.2 + 0.75 * (v / max)})` }} /></td>
                      ))}</tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Weekly digest ---------------- */
function Digest({ th }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/td/reports/digest').then(r => setD(r.data)).catch(() => toast.error('Could not load the digest')); }, []);
  if (!d) return <div style={{ color: th.sub }}>Loading…</div>;

  const delta = (a, b) => (a - b === 0 ? 'same as last week' : `${a - b > 0 ? '▲' : '▼'} ${Math.abs(a - b)} vs last week`);
  const exportIt = () => {
    const rows = [
      ...d.topCategories.map((r, i) => ({ Section: 'Top category', Rank: i + 1, Name: r.name, Count: r.count })),
      ...d.topZones.map((r, i) => ({ Section: 'Top zone search', Rank: i + 1, Name: r.name, Count: r.count })),
      ...d.inactive.map(a => ({ Section: 'No login for 7+ days', Rank: '', Name: a.name, Count: a.last_seen ? `Last seen ${fmt(a.last_seen)}` : 'Never logged in' })),
      ...d.idle.map(a => ({ Section: 'Logged in but did not use the tools', Rank: '', Name: a.name, Count: '' })),
    ];
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Digest');
    XLSX.writeFile(wb, 'weekly-digest.xlsx');
  };
  const List = ({ rows, empty, render }) => rows.length === 0
    ? <div style={{ fontSize: 13, color: th.sub }}>{empty}</div>
    : <div style={{ maxHeight: 300, overflow: 'auto' }}>{rows.map((r, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '5px 0', color: th.text, borderTop: i ? `1px solid ${th.border}` : 'none' }}>{render(r, i)}</div>)}</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ flex: 1, fontSize: 13, color: th.sub }}>Summary of the last 7 days</div>
        <button onClick={exportIt} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${th.border}`, background: 'transparent', color: th.text, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>⬇ Export digest</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 14 }}>
        <Kpi th={th} label="Descriptions copied" value={<>{d.totals.copies} <span style={{ fontSize: 12, color: th.sub, fontWeight: 700 }}>{delta(d.totals.copies, d.totals.copies_prev)}</span></>} />
        <Kpi th={th} label="Zone lookups" value={<>{d.totals.zones} <span style={{ fontSize: 12, color: th.sub, fontWeight: 700 }}>{delta(d.totals.zones, d.totals.zones_prev)}</span></>} color="#22D3EE" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        <Card th={th} title="📈 Top categories">
          <List rows={d.topCategories} empty="No copy activity this week." render={(r, i) => <><span>{i + 1}. {r.name}</span><b>{r.count}</b></>} />
        </Card>
        <Card th={th} title="📍 Most-searched zones">
          <List rows={d.topZones} empty="No zone searches this week." render={(r, i) => <><span>{i + 1}. {r.name}</span><b>{r.count}</b></>} />
        </Card>
        <Card th={th} title={`🚫 No login for 7+ days (${d.inactive.length})`}>
          <List rows={d.inactive} empty="Everyone logged in this week." render={a => <><span>{a.name}</span><span style={{ color: th.sub, fontSize: 12 }}>{a.last_seen ? new Date(a.last_seen).toLocaleDateString() : 'Never'}</span></>} />
        </Card>
        <Card th={th} title={`💤 Logged in but did not use the tools (${d.idle.length})`}>
          <List rows={d.idle} empty="Everyone who logged in used the tools." render={a => <span>{a.name}</span>} />
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Activity log ---------------- */
function ActivityLog({ th }) {
  const [range, setRange] = useState({ from: '', to: '' });
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [data, setData] = useState({ rows: [], total: 0 });

  const load = useCallback(() => {
    const qs = new URLSearchParams({ type, q, limit: '500' });
    if (range.from) qs.set('from', range.from);
    if (range.to) qs.set('to', range.to);
    api.get(`/td/reports/activity?${qs}`).then(r => setData(r.data)).catch(() => toast.error('Could not load the log'));
  }, [range, type, q]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const exportIt = async () => {
    try {
      const qs = new URLSearchParams({ type, q, limit: '5000' });
      if (range.from) qs.set('from', range.from);
      if (range.to) qs.set('to', range.to);
      const r = await api.get(`/td/reports/activity?${qs}`);
      const ws = XLSX.utils.json_to_sheet(r.data.rows.map(x => ({ Type: x.type === 'copy' ? 'Description copy' : 'Zone lookup', Agent: x.user_name, Detail: x.detail, When: fmt(x.at) })));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Activity');
      XLSX.writeFile(wb, 'tool-activity.xlsx');
    } catch { toast.error('Export failed'); }
  };
  const pill = on => ({ padding: '8px 14px', borderRadius: 10, border: `1px solid ${on ? ORANGE : th.border}`, background: on ? ORANGE : 'transparent', color: on ? '#fff' : th.text, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' });

  return (
    <div>
      <RangeBar th={th} range={range} setRange={setRange} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search agent, category or neighborhood…" style={{ flex: '1 1 240px', padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' }} />
        {[['all', 'All'], ['copy', 'Copies'], ['zone', 'Zone lookups']].map(([k, l]) => <button key={k} style={pill(type === k)} onClick={() => setType(k)}>{l}</button>)}
        <button style={pill(false)} onClick={exportIt}>⬇ Export</button>
      </div>
      <div style={{ fontSize: 12, color: th.sub, marginBottom: 8 }}>{data.total} entries{data.total > 500 ? ' — showing the newest 500, export for more' : ''}</div>
      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ color: th.sub, fontSize: 11, textTransform: 'uppercase' }}>
            {['Type', 'Agent', 'Detail', 'When'].map(h => <th key={h} style={{ padding: 10, textAlign: 'start' }}>{h}</th>)}</tr></thead>
          <tbody>{data.rows.map((r, i) => (
            <tr key={i} style={{ borderTop: `1px solid ${th.border}`, color: th.text }}>
              <td style={{ padding: 10 }}><span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: r.type === 'copy' ? `${ORANGE}1f` : '#22D3EE22', color: r.type === 'copy' ? ORANGE : '#0891b2' }}>{r.type === 'copy' ? '📋 Copy' : '📍 Zone'}</span></td>
              <td style={{ padding: 10, fontWeight: 700 }}>{r.user_name || '—'}</td>
              <td style={{ padding: 10, color: th.sub }}>{r.detail}</td>
              <td style={{ padding: 10, color: th.sub, whiteSpace: 'nowrap' }}>{fmt(r.at)}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Maintenance & backup ---------------- */
function Maintenance({ th }) {
  const [scan, setScan] = useState(null);
  const [busy, setBusy] = useState('');
  const card = { background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 18, marginBottom: 14 };
  const btn = c => ({ padding: '9px 18px', borderRadius: 10, border: 'none', background: c, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 });

  const backup = async () => {
    setBusy('backup');
    try {
      const r = await api.get('/td/export');
      const blob = new Blob([JSON.stringify(r.data)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `runaki-tools-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(a.href);
    } catch { toast.error('Backup failed'); }
    setBusy('');
  };
  const doScan = async () => {
    setBusy('scan');
    try { setScan((await api.post('/td/maintenance/duplicates', { dry: true })).data); } catch { toast.error('Scan failed'); }
    setBusy('');
  };
  const doClean = async () => {
    if (!window.confirm(`Delete ${scan.copies} duplicate copies and ${scan.zones} duplicate zone lookups? Download a backup first.`)) return;
    setBusy('clean');
    try {
      const r = (await api.post('/td/maintenance/duplicates', { dry: false })).data;
      toast.success(`Removed ${r.copies} duplicate copies and ${r.zones} duplicate zone lookups`);
      setScan(null);
    } catch { toast.error('Cleanup failed'); }
    setBusy('');
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, color: th.text, marginBottom: 6 }}>💾 Backup of the tools data</div>
        <div style={{ fontSize: 13, color: th.sub, lineHeight: 1.7, marginBottom: 12 }}>Downloads ticket descriptions, zones, copy and zone-lookup history, outdated flags and agent feedback as one JSON file. Keep it somewhere safe before big imports.</div>
        <button onClick={backup} disabled={!!busy} style={btn(ORANGE)}>{busy === 'backup' ? 'Preparing…' : 'Download backup'}</button>
      </div>
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, color: th.text, marginBottom: 6 }}>🧹 Remove duplicate history</div>
        <div style={{ fontSize: 13, color: th.sub, lineHeight: 1.7, marginBottom: 12 }}>Finds rows where the same agent copied the same description (or looked up the same zone) more than once within the same minute and keeps only the first. Scan first — nothing is deleted until you confirm.</div>
        {scan && <div style={{ fontSize: 13.5, color: th.text, marginBottom: 12 }}>Found <b>{scan.copies}</b> duplicate copies and <b>{scan.zones}</b> duplicate zone lookups.</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={doScan} disabled={!!busy} style={btn(ORANGE)}>{busy === 'scan' ? 'Scanning…' : 'Scan for duplicates'}</button>
          {scan && scan.copies + scan.zones > 0 && <button onClick={doClean} disabled={!!busy} style={btn('#ef4444')}>Delete them</button>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Wrapper ---------------- */
export function ToolReports({ darkMode }) {
  const th = useTheme(darkMode);
  const [view, setView] = useState('dashboard');
  const tabs = [['dashboard', '📊 Dashboard'], ['digest', '🗓️ Weekly digest'], ['activity', '📜 Activity log'], ['maintenance', '🛠️ Maintenance']];
  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: th.text, marginBottom: 4 }}>📈 Tool Reports</div>
      <div style={{ fontSize: 13, color: th.sub, marginBottom: 14 }}>How agents use Ticket Descriptions and Zone Lookup.</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${view === k ? ORANGE : th.border}`, background: view === k ? ORANGE : 'transparent', color: view === k ? '#fff' : th.text, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
        ))}
      </div>
      {view === 'dashboard' && <Dashboard th={th} />}
      {view === 'digest' && <Digest th={th} />}
      {view === 'activity' && <ActivityLog th={th} />}
      {view === 'maintenance' && <Maintenance th={th} />}
    </div>
  );
}
