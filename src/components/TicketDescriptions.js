import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../utils/api';
import { buildIndex, searchFaqs } from '../utils/faqSearch';

// Ticket Descriptions (from the old "Agent Call Description Tool").
//  - TicketDescriptions       : agent page — find the right description, copy it, see the Kurdish reference
//  - TicketDescriptionsAdmin  : Admin Panel tab — edit categories, Excel import/export, flags, old-site backup import

const ORANGE = '#FF6B35';
const NAVY = '#0B1120';

const LV = ['#FF6B35', '#0ea5e9', '#10b981'];      // category / sub-category / third level colours
const VIOLET = '#8b5cf6';
const Hero = ({ icon, title, text, a, b }) => (
  <div style={{ background: `linear-gradient(120deg, ${a}, ${b})`, borderRadius: 20, padding: '18px 22px', color: '#fff', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14, boxShadow: `0 10px 28px ${a}44`, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', insetInlineEnd: -20, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.14)' }} />
    <div style={{ fontSize: 38, lineHeight: 1 }}>{icon}</div>
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: 20, fontWeight: 900 }}>{title}</div>
      <div style={{ fontSize: 13.5, opacity: 0.95, marginTop: 3, lineHeight: 1.5 }}>{text}</div>
    </div>
  </div>
);
const PathChips = ({ c, small }) => (
  <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
    {[c.level1, c.level2, c.level3].map((x, i) => x ? (
      <span key={i} style={{ background: `${LV[i]}1f`, color: LV[i], border: `1px solid ${LV[i]}55`, borderRadius: 999, padding: small ? '1px 8px' : '3px 11px', fontSize: small ? 11.5 : 12.5, fontWeight: 800 }}>{x}</span>
    ) : null)}
  </span>
);

const clean = v => (v == null ? '' : String(v).trim());
const pathOf = c => [c.level1, c.level2, c.level3].filter(Boolean).join(' › ');

// the shared search engine expects FAQ-shaped objects, so map each category onto one
const toDoc = c => ({
  ...c,
  question_en: [c.level1, c.level2, c.level3].filter(Boolean).join(' '),
  answer_en: c.english,
  answer_ku: c.kurdish,
  tags: c.keywords,
  category: c.level1,
  subcategory: c.level2,
  third_level: c.level3,
});

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch { return false; }
  }
}

/* ================================================================== */
/*  AGENT PAGE                                                         */
/* ================================================================== */
export function TicketDescriptions({ DM, darkMode }) {
  const [cats, setCats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [query, setQuery] = useState('');
  const [l1, setL1] = useState('');
  const [l2, setL2] = useState('');
  const [l3, setL3] = useState('');
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [note, setNote] = useState('');

  const loadRecent = useCallback(() => {
    api.get('/td/recent').then(r => setRecent(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/td/categories').then(r => setCats(r.data || [])).catch(() => { setCats([]); toast.error('Could not load descriptions'); });
    loadRecent();
  }, [loadRecent]);

  const index = useMemo(() => buildIndex((cats || []).map(toDoc)), [cats]);
  const results = useMemo(() => {
    if (!query.trim() || !cats) return [];
    return searchFaqs(index, query, { limit: 8, minScore: 1 }).map(r => r.faq);
  }, [index, query, cats]);

  const level1s = useMemo(() => [...new Set((cats || []).map(c => c.level1))], [cats]);
  const level2s = useMemo(() => [...new Set((cats || []).filter(c => c.level1 === l1 && c.level2).map(c => c.level2))], [cats, l1]);
  const level3s = useMemo(() => [...new Set((cats || []).filter(c => c.level1 === l1 && c.level2 === l2 && c.level3).map(c => c.level3))], [cats, l1, l2]);

  // when the dropdowns point at exactly one description, select it
  useEffect(() => {
    if (!cats || !l1) return;
    const hit = cats.find(c => c.level1 === l1 && (c.level2 || '') === l2 && (c.level3 || '') === l3);
    if (hit) setSelected(hit);
    else setSelected(null);
  }, [l1, l2, l3, cats]);

  const choose = c => {
    setSelected(c);
    setL1(c.level1); setL2(c.level2 || ''); setL3(c.level3 || '');
    setCopied(false); setFlagging(false);
  };
  const clearAll = () => { setQuery(''); setL1(''); setL2(''); setL3(''); setSelected(null); setCopied(false); setFlagging(false); };

  const doCopy = async () => {
    if (!selected) return;
    const ok = await copyText(selected.english || '');
    if (!ok) return toast.error('Copy failed — select the text and copy it manually');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    api.post('/td/copy', { category_id: selected.id }).then(loadRecent).catch(() => {});
  };
  const togglePin = async id => {
    try { await api.post(`/td/recent/${id}/pin`); loadRecent(); }
    catch { toast.error('Could not update pin'); }
  };
  const sendFlag = async () => {
    try {
      await api.post('/td/flags', { category_id: selected.id, note });
      toast.success('Thanks — the team lead will review it');
      setFlagging(false); setNote('');
    } catch { toast.error('Could not send'); }
  };

  const input = {
    padding: '10px 12px', borderRadius: 10, border: `1px solid ${DM.border}`, background: DM.cardBg,
    color: DM.text, fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const card = { background: DM.cardBg, border: `1px solid ${DM.border}`, borderRadius: 16, padding: 18, marginBottom: 14, boxShadow: DM.shadow };

  if (cats === null) return <div style={{ color: DM.subText }}>Loading…</div>;
  if (cats.length === 0) return <div style={{ color: DM.subText }}>No ticket descriptions have been added yet.</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <Hero icon="🎫" title="Ticket Descriptions" text="Find the right description, copy it, and paste it straight into the ticket." a="#FF6B35" b="#ec4899" />
      <div style={{ ...card, borderTop: `4px solid ${ORANGE}` }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null); setL1(''); setL2(''); setL3(''); }}
          placeholder="🔍 Search a description — e.g. smart meter outage, billing, KYC…"
          style={{ ...input, width: '100%', fontSize: 14.5, padding: '12px 14px' }}
        />
        <div style={{ fontSize: 12.5, fontWeight: 800, color: DM.subText, margin: '14px 0 8px' }}>🧭 or choose step by step</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}>
          <select style={{ ...input, borderColor: `${LV[0]}88`, borderWidth: 2 }} value={l1} onChange={e => { setL1(e.target.value); setL2(''); setL3(''); setQuery(''); }}>
            <option value="">1 · Category…</option>
            {level1s.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
          <select style={{ ...input, borderColor: `${LV[1]}88`, borderWidth: 2, opacity: level2s.length ? 1 : 0.5 }} value={l2} disabled={!level2s.length} onChange={e => { setL2(e.target.value); setL3(''); }}>
            <option value="">2 · Sub-category…</option>
            {level2s.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
          <select style={{ ...input, borderColor: `${LV[2]}88`, borderWidth: 2, opacity: level3s.length ? 1 : 0.5 }} value={l3} disabled={!level3s.length} onChange={e => setL3(e.target.value)}>
            <option value="">3 · Third level…</option>
            {level3s.map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        {(query || l1) && <button onClick={clearAll} style={{ ...btn(DM, '#64748b'), marginTop: 10 }}>✕ Clear</button>}
      </div>

      {recent.length > 0 && !query && !selected && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: DM.text, marginBottom: 8 }}>📌 Pinned &amp; recently used</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recent.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', border: `1px solid ${VIOLET}55`, background: `${VIOLET}12`, borderRadius: 999, overflow: 'hidden' }}>
                <button onClick={() => choose(r)} style={{ border: 'none', background: 'transparent', color: DM.text, padding: '7px 12px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {pathOf(r)}
                </button>
                <button onClick={() => togglePin(r.id)} title={r.pinned ? 'Unpin' : 'Pin'} style={{ border: 'none', background: r.pinned ? `${ORANGE}22` : 'transparent', cursor: 'pointer', padding: '7px 9px', fontSize: 12 }}>
                  {r.pinned ? '📌' : '📍'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {query && !selected && (
        <div style={card}>
          {results.length === 0 ? (
            <div style={{ color: DM.subText, fontSize: 13.5 }}>No description matches “{query}”. Try another word, or use the steps above.</div>
          ) : results.map(c => (
            <button key={c.id} onClick={() => choose(c)} style={{
              display: 'block', width: '100%', textAlign: 'start', border: `1px solid ${DM.border}`, borderInlineStart: `5px solid ${LV[0]}`, background: darkMode ? 'rgba(255,255,255,0.03)' : '#fffaf7',
              borderRadius: 12, padding: '10px 14px', marginBottom: 8, cursor: 'pointer', color: DM.text, fontFamily: 'inherit',
            }}>
              <div><PathChips c={c} small /></div>
              <div style={{ fontSize: 12, color: DM.subText, marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.english}</div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ ...card, borderColor: `${ORANGE}66`, borderTop: `4px solid ${ORANGE}`, boxShadow: `0 10px 30px ${ORANGE}22` }}>
          <div style={{ marginBottom: 10 }}><PathChips c={selected} /></div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0ea5e9', marginBottom: 6 }}>✍️ English: paste this into the ticket</div>
          <div style={{ background: darkMode ? 'rgba(14,165,233,0.08)' : '#f0f9ff', border: `1px solid #0ea5e944`, borderRadius: 12, padding: '14px 16px', fontSize: 14.5, lineHeight: 1.8, color: DM.text, whiteSpace: 'pre-wrap' }}>
            {selected.english}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button onClick={doCopy} style={{ padding: '11px 26px', borderRadius: 12, border: 'none', background: copied ? 'linear-gradient(120deg,#10b981,#22c55e)' : 'linear-gradient(120deg,#FF6B35,#ec4899)', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 16px rgba(255,107,53,0.35)' }}>
              {copied ? '✅ Copied! Paste it in the ticket' : '📋 Copy description'}
            </button>
            <button onClick={async () => { await togglePin(selected.id); toast.success('Pin updated — see “Pinned & recently used”'); }} style={btn(DM, '#64748b')}>📌 Pin / unpin</button>
            <button onClick={() => setFlagging(!flagging)} style={btn(DM, '#ef4444')}>🚩 Report as outdated</button>
          </div>
          {flagging && (
            <div style={{ marginTop: 12 }}>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="What is wrong or outdated? (optional)" style={{ ...input, width: '100%', resize: 'vertical' }} />
              <button onClick={sendFlag} style={{ ...btn(DM, '#ef4444'), marginTop: 6 }}>Send to team lead</button>
            </div>
          )}
          {selected.kurdish && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: VIOLET, marginBottom: 6 }}>🌿 Kurdish: to help you understand</div>
              <div dir="rtl" style={{ border: `1px dashed ${VIOLET}77`, background: darkMode ? 'rgba(139,92,246,0.08)' : '#faf5ff', borderRadius: 12, padding: '12px 16px', fontSize: 15, lineHeight: 2, color: DM.text, whiteSpace: 'pre-wrap' }}>
                {selected.kurdish}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const btn = (DM, color) => ({
  padding: '9px 16px', borderRadius: 10, border: `1px solid ${color}55`, background: `${color}14`, color,
  fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
});

/* ================================================================== */
/*  ADMIN TAB                                                          */
/* ================================================================== */
const EMPTY = { level1: '', level2: '', level3: '', english: '', kurdish: '', keywords: '', is_active: true };

function useTheme(dark) {
  return dark
    ? { card: '#111827', input: '#0b1220', border: 'rgba(255,255,255,0.12)', text: '#e2e8f0', sub: 'rgba(255,255,255,0.5)' }
    : { card: '#fff', input: '#f8fafc', border: '#e2e8f0', text: NAVY, sub: '#64748b' };
}

// find a column by several possible header names
const pickCol = (row, names) => {
  const keys = Object.keys(row);
  for (const n of names) {
    const k = keys.find(x => x.trim().toLowerCase() === n);
    if (k) return row[k];
  }
  return '';
};

export function TicketDescriptionsAdmin({ darkMode }) {
  const th = useTheme(darkMode);
  const [cats, setCats] = useState([]);
  const [flags, setFlags] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState('');
  const fileRef = useRef(null);
  const backupRef = useRef(null);
  const [progress, setProgress] = useState([]);

  const load = useCallback(async () => {
    try {
      const [c, f] = await Promise.all([api.get('/td/categories?all=1'), api.get('/td/flags')]);
      setCats(c.data || []); setFlags(f.data || []);
    } catch { toast.error('Could not load ticket descriptions'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const inp = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' };
  const label = { fontSize: 11, fontWeight: 800, color: th.sub, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4, marginTop: 10 };
  const card = { background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 18, marginBottom: 16 };

  const shown = cats.filter(c => !q || (pathOf(c) + ' ' + (c.english || '') + ' ' + (c.keywords || '')).toLowerCase().includes(q.toLowerCase()));

  const save = async () => {
    if (!clean(form.level1) || !clean(form.english)) return toast.error('Category and English description are required');
    try {
      if (form.id) await api.put(`/td/categories/${form.id}`, form);
      else await api.post('/td/categories', form);
      toast.success('Saved');
      setForm(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Could not save'); }
  };
  const remove = async c => {
    if (!window.confirm(`Delete "${pathOf(c)}"? Copy history for it is kept.`)) return;
    try { await api.delete(`/td/categories/${c.id}`); load(); } catch { toast.error('Could not delete'); }
  };
  const toggle = async c => {
    try { await api.put(`/td/categories/${c.id}`, { ...c, is_active: !c.is_active }); load(); } catch { toast.error('Could not update'); }
  };

  const exportExcel = () => {
    const rows = cats.map(c => ({ Category: c.level1, 'Sub-category': c.level2 || '', 'Third-level': c.level3 || '', English: c.english, Kurdish: c.kurdish || '', Keywords: c.keywords || '' }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Descriptions');
    XLSX.writeFile(wb, `ticket-descriptions-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const importExcel = async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy('excel');
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const rows = raw.map(r => ({
        level1: clean(pickCol(r, ['category', 'level1', 'a'])),
        level2: clean(pickCol(r, ['sub-category', 'subcategory', 'sub category', 'level2', 'b'])),
        level3: clean(pickCol(r, ['third-level', 'third level', 'level3', 'c'])),
        english: clean(pickCol(r, ['english', 'description', 'd'])),
        kurdish: clean(pickCol(r, ['kurdish', 'e'])),
        keywords: clean(pickCol(r, ['keywords', 'key terms', 'f'])),
      })).filter(r => r.level1 && r.english);
      if (!rows.length) { toast.error('No usable rows found (need Category and English columns)'); setBusy(''); return; }
      let imported = 0, skipped = 0;
      for (let i = 0; i < rows.length; i += 100) {
        const r = await api.post('/td/categories/import', { rows: rows.slice(i, i + 100) });
        imported += r.data.imported || 0; skipped += (r.data.skipped || []).length;
      }
      toast.success(`Imported ${imported}, skipped ${skipped} that already exist`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
    setBusy('');
  };

  const resolveFlag = async f => {
    try { await api.patch(`/td/flags/${f.id}`, { status: f.status === 'open' ? 'resolved' : 'open' }); load(); } catch { toast.error('Could not update'); }
  };

  /* ---- one-time import of the old site's full backup ---- */
  const importBackup = async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm('Import data from the old site backup? It is safe to run twice — existing items are skipped.')) return;
    setBusy('backup'); setProgress([]);
    const log = (line) => setProgress(p => [...p, line]);
    try {
      const data = JSON.parse(await file.text());
      const waveOf = new Map((data.accounts || []).map(a => [a.id, a.wave_id]));
      const steps = [
        ['categories', 'Ticket descriptions', data.categories || [], 100, r => r],
        ['copy_log', 'Copy history', data.copy_log || [], 150, r => ({ ...r, wave_id: waveOf.get(r.account_id) || null })],
        ['flags', 'Outdated flags', data.flags || [], 100, r => r],
        ['zones', 'Zones', data.zones || [], 400, r => r],
        ['zone_lookup_log', 'Zone lookup history', data.zone_lookup_log || [], 150, r => ({ ...r, wave_id: waveOf.get(r.account_id) || null })],
      ];
      for (const [table, name, rows, size, map] of steps) {
        let done = 0;
        for (let i = 0; i < rows.length; i += size) {
          const r = await api.post('/td/import-backup', { table, rows: rows.slice(i, i + size).map(map) });
          done += r.data.done || 0;
          setProgress(p => [...p.filter(x => !x.startsWith(name + ':')), `${name}: ${Math.min(i + size, rows.length)} / ${rows.length}`]);
        }
        log(`✓ ${name}: ${done} new of ${rows.length}`);
      }
      toast.success('Backup imported');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Import failed');
      log('✗ Stopped: ' + (err.response?.data?.error || err.message));
    }
    setBusy('');
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: th.text, marginBottom: 4 }}>🎫 Ticket Descriptions</div>
      <div style={{ fontSize: 13, color: th.sub, marginBottom: 16, lineHeight: 1.7 }}>
        The descriptions agents copy into tickets. Each one has an English text (copied) and a Kurdish text (reference only).
      </div>

      <div style={{ ...card, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ ...inp, flex: '1 1 200px', width: 'auto' }} />
        <button onClick={() => setForm({ ...EMPTY })} style={primary}>＋ Add</button>
        <button onClick={() => fileRef.current.click()} disabled={busy === 'excel'} style={ghost(th)}>{busy === 'excel' ? 'Importing…' : '⬆ Import Excel'}</button>
        <button onClick={exportExcel} style={ghost(th)}>⬇ Export Excel</button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importExcel} style={{ display: 'none' }} />
      </div>
      <div style={{ fontSize: 11.5, color: th.sub, margin: '-8px 4px 14px' }}>
        Excel columns: Category · Sub-category · Third-level · English · Kurdish · Keywords. Rows that already exist are skipped, never overwritten.
      </div>

      {form && (
        <div style={{ ...card, borderColor: `${ORANGE}66` }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: th.text }}>{form.id ? 'Edit description' : 'New description'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
            {[['level1', 'Category *'], ['level2', 'Sub-category'], ['level3', 'Third level']].map(([k, l]) => (
              <div key={k}><div style={label}>{l}</div><input style={inp} value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>
            ))}
          </div>
          <div style={label}>English description * (copied by agents)</div>
          <textarea rows={5} style={{ ...inp, lineHeight: 1.7 }} value={form.english || ''} onChange={e => setForm({ ...form, english: e.target.value })} />
          <div style={label}>Kurdish (reference only)</div>
          <textarea rows={5} dir="rtl" style={{ ...inp, lineHeight: 1.9 }} value={form.kurdish || ''} onChange={e => setForm({ ...form, kurdish: e.target.value })} />
          <div style={label}>Keywords (comma separated, help the search)</div>
          <input style={inp} value={form.keywords || ''} onChange={e => setForm({ ...form, keywords: e.target.value })} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 13, color: th.text }}>
            <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Visible to agents
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={save} style={primary}>Save</button>
            <button onClick={() => setForm(null)} style={ghost(th)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, color: th.sub, marginBottom: 8 }}>{shown.length} of {cats.length} descriptions</div>
      {shown.map(c => (
        <div key={c.id} style={{ ...card, padding: '12px 16px', marginBottom: 10, opacity: c.is_active ? 1 : 0.55 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, fontSize: 13.5, fontWeight: 800, color: th.text }}>{pathOf(c)}</div>
            <button onClick={() => toggle(c)} style={mini(c.is_active ? '#10b981' : '#64748b')}>{c.is_active ? 'Visible' : 'Hidden'}</button>
            <button onClick={() => setForm({ ...c })} style={mini('#3b82f6')}>Edit</button>
            <button onClick={() => remove(c)} style={mini('#ef4444')}>✕</button>
          </div>
          <div style={{ fontSize: 12.5, color: th.sub, marginTop: 6, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.english}</div>
        </div>
      ))}

      <div style={{ ...card, marginTop: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: th.text, marginBottom: 8 }}>🚩 Reported as outdated ({flags.filter(f => f.status === 'open').length} open)</div>
        {flags.length === 0 ? <div style={{ fontSize: 13, color: th.sub }}>Nothing reported.</div> : flags.map(f => (
          <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${th.border}`, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: th.text }}>{[f.level1, f.level2, f.level3].filter(Boolean).join(' › ') || '(deleted description)'}</div>
              <div style={{ fontSize: 12, color: th.sub }}>{f.user_name || 'Someone'}{f.note ? ` — ${f.note}` : ''} · {new Date(f.created_at).toLocaleDateString()}</div>
            </div>
            <button onClick={() => resolveFlag(f)} style={mini(f.status === 'open' ? '#10b981' : '#64748b')}>{f.status === 'open' ? 'Mark resolved' : 'Reopen'}</button>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 800, color: th.text, marginBottom: 6 }}>📦 Import from the old site (one time)</div>
        <div style={{ fontSize: 13, color: th.sub, lineHeight: 1.7, marginBottom: 10 }}>
          Choose the <b>runaki-full-backup-….json</b> file downloaded from the old site. It brings in the descriptions, copy history (matched to KB accounts by Wave ID), outdated flags, zones (duplicates are merged) and zone lookup history.
          Running it twice does not create duplicates.
        </div>
        <button onClick={() => backupRef.current.click()} disabled={busy === 'backup'} style={primary}>{busy === 'backup' ? 'Importing… keep this page open' : 'Choose backup file'}</button>
        <input ref={backupRef} type="file" accept=".json,application/json" onChange={importBackup} style={{ display: 'none' }} />
        {progress.length > 0 && <pre style={{ marginTop: 12, fontSize: 12.5, color: th.text, background: th.input, borderRadius: 10, padding: 12, whiteSpace: 'pre-wrap' }}>{progress.join('\n')}</pre>}
      </div>
    </div>
  );
}

const primary = { padding: '9px 20px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const ghost = th => ({ padding: '9px 16px', borderRadius: 10, border: `1px solid ${th.border}`, background: 'transparent', color: th.text, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
const mini = color => ({ border: `1px solid ${color}55`, background: `${color}14`, color, borderRadius: 8, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' });
