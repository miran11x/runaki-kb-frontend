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
  const exportDash = () => {
    const wb = XLSX.utils.book_new();
    const add = (name, rows) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No data' }]), name);
    add('Summary', [{ From: range.from || 'All time', To: range.to || 'Today', Agents: d.agents, 'Used the tools': d.activeAgents, 'Descriptions copied': d.copies, 'Zone lookups': d.zones }]);
    add('Categories', (d.topCategories || []).map(x => ({ Category: x.name, Copies: x.count })));
    add('Agent leaderboard', (d.leaderboard || []).map(x => ({ Agent: x.name, Copies: x.count })));
    add('Neighborhoods', (d.topZones || []).map(x => ({ Neighborhood: x.name, Lookups: x.count })));
    add('Daily', (d.trend || []).map(x => ({ Day: x.day, Copies: x.copies, 'Zone lookups': x.zones })));
    add('Heatmap', DAYS.map((day, i) => Object.fromEntries([['Day', day], ...(d.heatmap[i] || []).map((v, h) => [`${h}:00`, v])])));
    XLSX.writeFile(wb, `tools-dashboard-${range.from || 'all'}_${range.to || 'now'}.xlsx`);
  };
  const tick = { fontSize: 11, fill: th.sub };
  const tip = { background: th.card, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8 };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <RangeBar th={th} range={range} setRange={setRange} />
        {d && <button onClick={exportDash} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>⬇ Export to Excel</button>}
      </div>
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

/* ---------------- Full report (one Excel file with everything) ---------------- */
const pathStr = c => [c.level1, c.level2, c.level3].filter(Boolean).join(' › ');
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
function FullReport({ th }) {
  const [range, setRange] = useState({ from: '', to: '' });
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState(null);

  const build = async () => {
    setBusy(true);
    try {
      const qs = new URLSearchParams();
      if (range.from) qs.set('from', range.from);
      if (range.to) qs.set('to', range.to);
      const d = (await api.get(`/td/reports/full?${qs}`)).data;
      const day = x => (x.at || '').slice(0, 10);
      const hour = x => (x.at || '').slice(11, 13);
      const dow = x => DAYS[new Date((x.at || '').slice(0, 10) + 'T12:00:00').getDay()];

      // by day
      const days = {};
      const bump = (x, k) => { const r = (days[day(x)] = days[day(x)] || { Date: day(x), Weekday: dow(x), 'Description copies': 0, 'Zone lookups': 0, _a: new Set() }); r[k]++; if (x.user_id) r._a.add(x.user_id); };
      d.copies.forEach(x => bump(x, 'Description copies')); d.lookups.forEach(x => bump(x, 'Zone lookups'));
      const byDay = Object.values(days).sort((a, b) => a.Date.localeCompare(b.Date)).map(r => ({ Date: r.Date, Weekday: r.Weekday, 'Description copies': r['Description copies'], 'Zone lookups': r['Zone lookups'], Total: r['Description copies'] + r['Zone lookups'], 'Agents active': r._a.size }));

      // by agent (every active agent, including those with no use)
      const ag = new Map(d.agents.map(a => [a.id, { Agent: a.name, 'Wave ID': a.wave_id, Title: a.title || '', 'Last seen on the site': a.last_seen || '', 'Description copies': 0, 'Zone lookups': 0, _d: new Set(), _first: '', _last: '' }]));
      const touch = (x, k) => {
        let r = ag.get(x.user_id);
        if (!r) { r = { Agent: x.agent || '(unknown)', 'Wave ID': x.wave_id || '', Title: x.title || '', 'Last seen on the site': '', 'Description copies': 0, 'Zone lookups': 0, _d: new Set(), _first: '', _last: '' }; ag.set(x.user_id ?? 'u' + x.agent, r); }
        r[k]++; r._d.add(day(x)); if (!r._first || x.at < r._first) r._first = x.at; if (!r._last || x.at > r._last) r._last = x.at;
      };
      d.copies.forEach(x => touch(x, 'Description copies')); d.lookups.forEach(x => touch(x, 'Zone lookups'));
      const byAgent = [...ag.values()].map(r => ({ Agent: r.Agent, 'Wave ID': r['Wave ID'], Title: r.Title, 'Description copies': r['Description copies'], 'Zone lookups': r['Zone lookups'], Total: r['Description copies'] + r['Zone lookups'], 'Days used': r._d.size, 'First use': r._first, 'Last use': r._last, 'Last seen on the site': r['Last seen on the site'] }))
        .sort((a, b) => b.Total - a.Total || a.Agent.localeCompare(b.Agent));
      const users = byAgent.filter(r => r.Total > 0), never = byAgent.filter(r => r.Total === 0);

      // by title, category, hour, zone
      const team = {};
      byAgent.forEach(r => { const t = team[r.Title || '(none)'] = team[r.Title || '(none)'] || { Title: r.Title || '(none)', Agents: 0, 'Agents who used the tools': 0, 'Description copies': 0, 'Zone lookups': 0 }; t.Agents++; if (r.Total) t['Agents who used the tools']++; t['Description copies'] += r['Description copies']; t['Zone lookups'] += r['Zone lookups']; });
      const cnt = (arr, key) => { const m = new Map(); arr.forEach(x => { const k = key(x); m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
      const byCat = cnt(d.copies, x => x.level1 || '(deleted)').map(([k, n]) => ({ Category: k, Copies: n, 'Share %': pct(n, d.copies.length) }));
      const bySub = cnt(d.copies, x => pathStr(x) || '(deleted)').map(([k, n]) => ({ Description: k, Copies: n, 'Share %': pct(n, d.copies.length) }));
      const byHour = Array.from({ length: 24 }, (_, h) => { const k = String(h).padStart(2, '0'); return { Hour: k + ':00', 'Description copies': d.copies.filter(x => hour(x) === k).length, 'Zone lookups': d.lookups.filter(x => hour(x) === k).length }; });
      const byCity = cnt(d.lookups, x => x.city || '(unknown)').map(([k, n]) => ({ City: k, Lookups: n, 'Share %': pct(n, d.lookups.length) }));
      const byHood = cnt(d.lookups, x => `${x.neighborhood} (${x.city}) → ${x.zone}`).map(([k, n]) => ({ 'Neighborhood (city) → zone': k, Lookups: n }));

      const summary = [
        ['Report generated', new Date().toLocaleString()],
        ['Period', `${d.from || 'start'} to ${d.to || 'today'} (Iraq time)`],
        ['Active agents on the site', d.agents.length],
        ['Agents who used at least one tool', users.length],
        ['Agents who used neither', never.length],
        ['Adoption %', pct(users.length, d.agents.length)],
        ['Description copies', d.copies.length],
        ['Zone lookups', d.lookups.length],
        ['Days with activity', byDay.length],
        ['Active ticket descriptions', d.categories.filter(c => c.is_active).length],
        ['Zone rows', d.zones.reduce((n, z) => n + z.rows, 0)],
        ['Cities with zones', d.zones.length],
      ].map(([Item, Value]) => ({ Item, Value }));

      const wb = XLSX.utils.book_new();
      const add = (name, rows, widths) => { const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No data' }]); if (widths) ws['!cols'] = widths.map(w => ({ wch: w })); XLSX.utils.book_append_sheet(wb, ws, name); };
      add('Summary', summary, [36, 40]);
      add('By day', byDay, [12, 10, 18, 14, 10, 14]);
      add('By agent', byAgent, [28, 12, 12, 18, 14, 10, 10, 20, 20, 22]);
      add('By title', Object.values(team), [14, 10, 24, 18, 14]);
      add('Agents never used', never.map(r => ({ Agent: r.Agent, 'Wave ID': r['Wave ID'], Title: r.Title, 'Last seen on the site': r['Last seen on the site'] })), [28, 12, 12, 22]);
      add('By category', byCat, [34, 10, 10]);
      add('By description', bySub, [60, 10, 10]);
      add('By hour', byHour, [10, 18, 14]);
      add('Zone lookups by city', byCity, [18, 10, 10]);
      add('Zone lookups by area', byHood, [60, 10]);
      add('Copy log', d.copies.map(x => ({ When: x.at, Date: day(x), Weekday: dow(x), Agent: x.agent, 'Wave ID': x.wave_id || '', Title: x.title || '', Category: x.level1, 'Sub-category': x.level2 || '', 'Third level': x.level3 || '' })), [20, 12, 9, 26, 10, 12, 26, 34, 20]);
      add('Zone lookup log', d.lookups.map(x => ({ When: x.at, Date: day(x), Weekday: dow(x), Agent: x.agent, 'Wave ID': x.wave_id || '', Title: x.title || '', City: x.city, Neighborhood: x.neighborhood, Zone: x.zone })), [20, 12, 9, 26, 10, 12, 16, 28, 18]);
      add('Ticket descriptions', d.categories.map(c => ({ Category: c.level1, 'Sub-category': c.level2 || '', 'Third level': c.level3 || '', Active: c.is_active ? 'yes' : 'no', 'English text': c.has_en ? 'yes' : 'no', 'Kurdish text': c.has_ku ? 'yes' : 'no', 'Last updated': c.updated })), [26, 34, 14, 8, 12, 12, 14]);
      add('Zones by city', d.zones.map(z => ({ City: z.city, 'Zone rows': z.rows, Neighborhoods: z.neighborhoods, 'Different zones': z.zones, Active: z.active })), [18, 11, 14, 15, 9]);

      XLSX.writeFile(wb, `tools-full-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setInfo({ copies: d.copies.length, lookups: d.lookups.length, agents: d.agents.length, used: users.length, days: byDay.length });
      toast.success('Report downloaded');
    } catch (err) { toast.error(err.response?.data?.error || 'Could not build the report'); }
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: th.text, marginBottom: 6 }}>📥 Full report of both tools</div>
        <div style={{ fontSize: 13, color: th.sub, lineHeight: 1.7, marginBottom: 12 }}>
          One Excel file for Ticket Descriptions and Zone Lookup: a summary, usage by day, by agent, by title, by category, by hour, by city and area,
          the agents who never used the tools, the full copy log and zone lookup log (every action, with agent, Wave ID, date and time), plus the list of descriptions and zones.
          Times are Iraq time. Pick a period, or leave it on All time.
        </div>
        <RangeBar th={th} range={range} setRange={setRange} />
        <button onClick={build} disabled={busy} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Building the report…' : '⬇ Download the full report'}
        </button>
        {info && <div style={{ fontSize: 13, color: th.text, marginTop: 12 }}>Downloaded: {info.copies} copies and {info.lookups} zone lookups over {info.days} days; {info.used} of {info.agents} agents used the tools.</div>}
      </div>
    </div>
  );
}

/* ---------------- Wrapper ---------------- */
export function ToolReports({ darkMode }) {
  const th = useTheme(darkMode);
  const [view, setView] = useState('dashboard');
  const tabs = [['dashboard', '📊 Dashboard'], ['digest', '🗓️ Weekly digest'], ['activity', '📜 Activity log'], ['maintenance', '🛠️ Maintenance'], ['full', '📥 Full report']];
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
      {view === 'full' && <FullReport th={th} />}
    </div>
  );
}
