import React from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// Shared by every report in the admin panel:
//   <DateRange value onChange darkMode />  presets + any custom dates
//   rangeParams(value)                      -> {days} | {days:'all'} | {from,to}   (query string for the API)
//   exportSheets(fileName, sheets)          -> downloads an Excel file ([{name, rows:[{col: value}]}])
//   <ExportButton onClick />               -> the standard "Export to Excel" button
const ORANGE = '#FF6B35';
const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const defaultRange = (days = 7) => ({ kind: 'days', days });
export function rangeParams(r) {
  if (!r) return { days: 7 };
  if (r.kind === 'all') return { days: 'all' };
  if (r.kind === 'custom') { const p = {}; if (r.from) p.from = r.from; if (r.to) p.to = r.to; return p.from || p.to ? p : { days: 'all' }; }
  if (r.kind === 'span') return { from: r.from, to: r.to };
  return { days: r.days || 7 };
}
export const rangeQuery = r => new URLSearchParams(rangeParams(r)).toString();
export function rangeLabel(r) {
  if (!r) return '';
  if (r.kind === 'all') return 'all time';
  if (r.kind === 'custom' || r.kind === 'span') return `${r.from || 'start'} to ${r.to || 'today'}`;
  return r.days === 1 ? 'today' : `last ${r.days} days`;
}
export const rangeFile = r => (r.kind === 'all' ? 'all-time' : r.kind === 'custom' || r.kind === 'span' ? `${r.from || 'start'}_to_${r.to || ymd(new Date())}` : `${r.days}d`);
// does a date (string / Date) fall inside the chosen range? (for reports that filter data already loaded in the browser)
export function inRange(r, value) {
  if (!r || r.kind === 'all' || !value) return true;
  const day = typeof value === 'string' ? value.slice(0, 10) : ymd(new Date(value));
  const p = rangeParams(r);
  if (p.from || p.to) return (!p.from || day >= p.from) && (!p.to || day <= p.to);
  const from = ymd(addDays(new Date(), -((p.days || 7) - 1)));
  return day >= from;
}

export function DateRange({ value, onChange, darkMode, presets = true, style }) {
  const v = value || defaultRange(7);
  const c = darkMode
    ? { border: 'rgba(255,255,255,0.14)', text: '#e2e8f0', sub: 'rgba(255,255,255,0.5)', input: '#0b1220' }
    : { border: '#e2e8f0', text: '#0B1120', sub: '#64748b', input: '#f8fafc' };
  const on = (kind, days) => v.kind === kind && (kind !== 'days' || v.days === days);
  const b = active => ({ padding: '7px 13px', borderRadius: 9, border: `1px solid ${active ? ORANGE : c.border}`, background: active ? `${ORANGE}22` : 'transparent', color: active ? ORANGE : c.text, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' });
  const inp = { padding: '7px 10px', borderRadius: 9, border: `1px solid ${c.border}`, background: c.input, color: c.text, fontSize: 12.5, fontFamily: 'inherit' };
  const today = new Date();
  const span = (from, to) => onChange({ kind: 'span', from, to });
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastStart = new Date(today.getFullYear(), today.getMonth() - 1, 1), lastEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const isSpan = (f, t) => v.kind === 'span' && v.from === f && v.to === t;
  const yest = ymd(addDays(today, -1));
  const custom = v.kind === 'custom' || (v.kind === 'span' && !isSpan(yest, yest) && !isSpan(ymd(monthStart), ymd(today)) && !isSpan(ymd(lastStart), ymd(lastEnd)));
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', ...style }}>
      {presets && (
        <>
          <button style={b(on('days', 1))} onClick={() => onChange({ kind: 'days', days: 1 })}>Today</button>
          <button style={b(isSpan(yest, yest))} onClick={() => span(yest, yest)}>Yesterday</button>
          <button style={b(on('days', 7))} onClick={() => onChange({ kind: 'days', days: 7 })}>7 days</button>
          <button style={b(on('days', 30))} onClick={() => onChange({ kind: 'days', days: 30 })}>30 days</button>
          <button style={b(on('days', 90))} onClick={() => onChange({ kind: 'days', days: 90 })}>90 days</button>
          <button style={b(isSpan(ymd(monthStart), ymd(today)))} onClick={() => span(ymd(monthStart), ymd(today))}>This month</button>
          <button style={b(isSpan(ymd(lastStart), ymd(lastEnd)))} onClick={() => span(ymd(lastStart), ymd(lastEnd))}>Last month</button>
          <button style={b(on('all'))} onClick={() => onChange({ kind: 'all' })}>All time</button>
        </>
      )}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: custom ? '3px 8px' : 0, borderRadius: 10, border: custom ? `1px solid ${ORANGE}` : '1px solid transparent' }}>
        <span style={{ fontSize: 12, color: c.sub, fontWeight: 700 }}>From</span>
        <input type="date" style={inp} value={v.kind === 'custom' || v.kind === 'span' ? (v.from || '') : ''} max={ymd(today)} onChange={e => onChange({ kind: 'custom', from: e.target.value, to: (v.kind === 'custom' || v.kind === 'span') ? v.to || '' : '' })} />
        <span style={{ fontSize: 12, color: c.sub, fontWeight: 700 }}>to</span>
        <input type="date" style={inp} value={v.kind === 'custom' || v.kind === 'span' ? (v.to || '') : ''} max={ymd(today)} onChange={e => onChange({ kind: 'custom', from: (v.kind === 'custom' || v.kind === 'span') ? v.from || '' : '', to: e.target.value })} />
      </span>
    </div>
  );
}

const safeName = s => String(s).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || 'Sheet';
export function exportSheets(fileName, sheets) {
  try {
    const wb = XLSX.utils.book_new();
    const used = new Set();
    (sheets || []).forEach((sh, i) => {
      const rows = sh.rows && sh.rows.length ? sh.rows : [{ Info: 'No data for this period' }];
      const ws = XLSX.utils.json_to_sheet(rows);
      const keys = Object.keys(rows[0] || {});
      ws['!cols'] = keys.map(k => ({ wch: Math.min(60, Math.max(String(k).length, ...rows.slice(0, 200).map(r => String(r[k] == null ? '' : r[k]).length)) + 2) }));
      let name = safeName(sh.name || `Sheet ${i + 1}`), n = 2;
      while (used.has(name.toLowerCase())) name = safeName(`${sh.name} ${n++}`);
      used.add(name.toLowerCase());
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
    XLSX.writeFile(wb, /\.xlsx$/i.test(fileName) ? fileName : `${fileName}.xlsx`);
    toast.success('Excel file downloaded');
    return true;
  } catch (e) { toast.error('Could not create the Excel file'); return false; }
}

export function ExportButton({ onClick, label = 'Export to Excel', busy, style }) {
  return (
    <button onClick={onClick} disabled={busy} style={{ padding: '8px 15px', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 800, fontSize: 12.5, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.7 : 1, ...style }}>
      📤 {busy ? 'Preparing…' : label}
    </button>
  );
}

export const fmtDT = v => (v ? new Date(v).toLocaleString('en-GB', { hour12: false }) : '');
