import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../utils/api';
import { buildIndex, searchFaqs, normalizeText } from '../utils/faqSearch';

// Zone lookup (from the old "Agent Call Description Tool").
//  - ZoneLookup  : agent page — pick a city, search a neighborhood, get its zone
//  - ZonesAdmin  : Admin Panel tab — add / edit / hide / delete zones, Excel import / export

const ORANGE = '#FF6B35';
const NAVY = '#0B1120';
const clean = v => (v == null ? '' : String(v).trim());

const toDoc = z => ({ ...z, question_en: z.neighborhood, tags: z.keywords, category: z.city, answer_en: z.zone });

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok;
    } catch { return false; }
  }
}

/* ================================================================== */
/*  AGENT PAGE                                                         */
/* ================================================================== */
export function ZoneLookup({ DM, darkMode }) {
  const [zones, setZones] = useState(null);
  const [city, setCity] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/td/zones').then(r => setZones(r.data || [])).catch(() => { setZones([]); toast.error('Could not load zones'); });
  }, []);

  const cities = useMemo(() => [...new Set((zones || []).map(z => z.city))].sort(), [zones]);
  const index = useMemo(() => buildIndex((zones || []).map(toDoc)), [zones]);

  const results = useMemo(() => {
    if (!zones || !query.trim()) return [];
    let found = searchFaqs(index, query, { limit: 60, minScore: 1 }).map(r => r.faq);
    if (!found.length) {
      // plain "contains" fallback for partial words
      const q = normalizeText(query);
      found = zones.filter(z => normalizeText(z.neighborhood + ' ' + (z.keywords || '')).includes(q));
    }
    if (city) found = found.filter(z => z.city === city);
    // an exact neighborhood name first, then names that start with the search, then the rest
    const nq = normalizeText(query);
    const rank = z => { const n = normalizeText(z.neighborhood); return n === nq ? 0 : n.startsWith(nq) ? 1 : 2; };
    found = found.map((z, i) => [z, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]);
    return found.slice(0, 10);
  }, [zones, index, query, city]);

  const pick = z => {
    setSelected(z); setQuery(''); setCopied(false);
    api.post('/td/zone-lookup', { zone_id: z.id }).catch(() => {});
  };
  const doCopy = async () => {
    const ok = await copyText(selected.zone);
    if (!ok) return toast.error('Copy failed');
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const input = { padding: '11px 14px', borderRadius: 10, border: `1px solid ${DM.border}`, background: DM.cardBg, color: DM.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' };

  if (zones === null) return <div style={{ color: DM.subText }}>Loading…</div>;
  if (!zones.length) return <div style={{ color: DM.subText }}>No zones have been added yet.</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <select style={{ ...input, flex: '1 1 160px' }} value={city} onChange={e => { setCity(e.target.value); setSelected(null); }}>
          <option value="">All cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          style={{ ...input, flex: '3 1 280px' }}
          value={query}
          onChange={e => { setQuery(e.target.value); if (e.target.value) setSelected(null); }}
          placeholder="🔍 Search a neighborhood — English or Kurdish…"
        />
      </div>

      {query.trim() && (
        <div style={{ background: DM.cardBg, border: `1px solid ${DM.border}`, borderRadius: 14, padding: 8, marginBottom: 14, boxShadow: DM.shadow }}>
          {results.length === 0 ? (
            <div style={{ padding: 12, fontSize: 13.5, color: DM.subText }}>No neighborhood matches “{query}”. Check the spelling or try the Kurdish name.</div>
          ) : results.map(z => (
            <button key={z.id} onClick={() => pick(z)} style={{ display: 'block', width: '100%', textAlign: 'start', border: 'none', borderBottom: `1px solid ${DM.border}`, background: 'transparent', padding: '10px 12px', cursor: 'pointer', color: DM.text, fontFamily: 'inherit' }}>
              <span style={{ fontWeight: 800, fontSize: 13.5 }}>{z.neighborhood}</span>
              <span style={{ color: DM.subText, fontSize: 12.5 }}> · {z.city}</span>
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <div style={{ background: DM.cardBg, border: `1px solid ${ORANGE}66`, borderRadius: 18, padding: '28px 20px', textAlign: 'center', boxShadow: DM.shadow }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: DM.text }}>📍 {selected.neighborhood}</div>
          <div style={{ fontSize: 13, color: DM.subText, marginTop: 4, marginBottom: 22 }}>{selected.city}</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: DM.subText, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Zone</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: DM.text }}>{selected.zone}</div>
            <button onClick={doCopy} title="Copy zone" style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: copied ? '#10b981' : ORANGE, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>
      ) : !query.trim() && (
        <div style={{ textAlign: 'center', padding: '50px 0', color: DM.subText, fontSize: 14 }}>Search a neighborhood to find its zone.</div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  ADMIN TAB                                                          */
/* ================================================================== */
function useTheme(dark) {
  return dark
    ? { card: '#111827', input: '#0b1220', border: 'rgba(255,255,255,0.12)', text: '#e2e8f0', sub: 'rgba(255,255,255,0.5)' }
    : { card: '#fff', input: '#f8fafc', border: '#e2e8f0', text: NAVY, sub: '#64748b' };
}
const pickCol = (row, names) => {
  const k = Object.keys(row).find(x => names.includes(x.trim().toLowerCase()));
  return k ? row[k] : '';
};
const EMPTY = { city: '', neighborhood: '', zone: '', keywords: '', is_active: true };

export function ZonesAdmin({ darkMode }) {
  const th = useTheme(darkMode);
  const [zones, setZones] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [sel, setSel] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try { setZones((await api.get('/td/zones?all=1')).data || []); }
    catch { toast.error('Could not load zones'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const inp = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' };
  const card = { background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 18, marginBottom: 16 };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return zones;
    return zones.filter(z => [z.city, z.neighborhood, z.zone, z.keywords].some(v => (v || '').toLowerCase().includes(s)));
  }, [zones, q]);
  const visible = filtered.slice(0, 300);

  const save = async () => {
    if (!clean(form.city) || !clean(form.neighborhood) || !clean(form.zone)) return toast.error('City, neighborhood and zone are required');
    try {
      if (form.id) await api.put(`/td/zones/${form.id}`, form); else await api.post('/td/zones', form);
      toast.success('Saved'); setForm(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Could not save'); }
  };
  const remove = async z => {
    if (!window.confirm(`Delete "${z.neighborhood}"?`)) return;
    try { await api.delete(`/td/zones/${z.id}`); load(); } catch { toast.error('Could not delete'); }
  };
  const toggle = async z => {
    try { await api.put(`/td/zones/${z.id}`, { ...z, is_active: !z.is_active }); load(); } catch { toast.error('Could not update'); }
  };
  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${sel.size} selected zones? This cannot be undone.`)) return;
    try { await api.post('/td/zones/bulk-delete', { ids: [...sel] }); setSel(new Set()); load(); }
    catch { toast.error('Could not delete'); }
  };
  const toggleSel = id => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allVisibleSelected = visible.length > 0 && visible.every(z => sel.has(z.id));
  const toggleAll = () => setSel(s => { const n = new Set(s); visible.forEach(z => allVisibleSelected ? n.delete(z.id) : n.add(z.id)); return n; });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(zones.map(z => ({ City: z.city, Neighborhood: z.neighborhood, Zone: z.zone, Keywords: z.keywords || '' })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Zones');
    XLSX.writeFile(wb, `zones-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const importExcel = async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const rows = raw.map(r => ({
        city: clean(pickCol(r, ['city'])), neighborhood: clean(pickCol(r, ['neighborhood', 'neighbourhood'])),
        zone: clean(pickCol(r, ['zone'])), keywords: clean(pickCol(r, ['keywords'])),
      }));
      const good = rows.filter(r => r.city && r.neighborhood && r.zone);
      if (!good.length) { toast.error('No usable rows (need City, Neighborhood, Zone)'); setBusy(false); return; }
      let imported = 0;
      for (let i = 0; i < good.length; i += 400) {
        const r = await api.post('/td/zones/import', { rows: good.slice(i, i + 400) });
        imported += r.data.imported || 0;
      }
      toast.success(`Imported ${imported} new zones. ${rows.length - imported} skipped (already exist or incomplete).`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: th.text, marginBottom: 4 }}>📍 Zones</div>
      <div style={{ fontSize: 13, color: th.sub, marginBottom: 16, lineHeight: 1.7 }}>
        Neighborhood → zone list used by the Zone Lookup tool. Keywords hold alternate spellings or the Kurdish name, so agents can find it either way.
      </div>

      <div style={{ ...card, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search city, neighborhood or zone…" style={{ ...inp, flex: '1 1 220px', width: 'auto' }} />
        <button onClick={() => setForm({ ...EMPTY })} style={primary}>＋ Add zone</button>
        <button onClick={() => fileRef.current.click()} disabled={busy} style={ghost(th)}>{busy ? 'Importing…' : '⬆ Import Excel'}</button>
        <button onClick={exportExcel} style={ghost(th)}>⬇ Export Excel</button>
        {sel.size > 0 && <button onClick={bulkDelete} style={{ ...primary, background: '#ef4444' }}>Delete {sel.size} selected</button>}
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} style={{ display: 'none' }} />
      </div>
      <div style={{ fontSize: 11.5, color: th.sub, margin: '-8px 4px 14px' }}>Excel columns: City · Neighborhood · Zone · Keywords (optional). Existing zones are skipped.</div>

      {form && (
        <div style={{ ...card, borderColor: `${ORANGE}66` }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: th.text, marginBottom: 10 }}>{form.id ? 'Edit zone' : 'New zone'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
            <input style={inp} placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <input style={inp} placeholder="Neighborhood" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} />
            <input style={inp} placeholder="Zone" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} />
          </div>
          <input style={{ ...inp, marginTop: 10 }} placeholder="Keywords / Kurdish spelling (comma separated)" value={form.keywords || ''} onChange={e => setForm({ ...form, keywords: e.target.value })} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 13, color: th.text }}>
            <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Visible to agents
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={save} style={primary}>Save</button>
            <button onClick={() => setForm(null)} style={ghost(th)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, color: th.sub, marginBottom: 8 }}>
        {filtered.length} of {zones.length} zones{filtered.length > 300 ? ' — showing the first 300, search to narrow down' : ''}
      </div>
      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'start', color: th.sub, fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: 10, width: 30 }}><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} /></th>
              <th style={{ padding: 10, textAlign: 'start' }}>City</th>
              <th style={{ padding: 10, textAlign: 'start' }}>Neighborhood</th>
              <th style={{ padding: 10, textAlign: 'start' }}>Zone</th>
              <th style={{ padding: 10 }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(z => (
              <tr key={z.id} style={{ borderTop: `1px solid ${th.border}`, opacity: z.is_active ? 1 : 0.5, color: th.text }}>
                <td style={{ padding: 10 }}><input type="checkbox" checked={sel.has(z.id)} onChange={() => toggleSel(z.id)} /></td>
                <td style={{ padding: 10 }}>{z.city}</td>
                <td style={{ padding: 10, fontWeight: 700 }}>{z.neighborhood}</td>
                <td style={{ padding: 10 }}>{z.zone}</td>
                <td style={{ padding: 10, whiteSpace: 'nowrap', textAlign: 'end' }}>
                  <button onClick={() => toggle(z)} style={mini(z.is_active ? '#10b981' : '#64748b')}>{z.is_active ? 'Visible' : 'Hidden'}</button>{' '}
                  <button onClick={() => setForm({ ...z })} style={mini('#3b82f6')}>Edit</button>{' '}
                  <button onClick={() => remove(z)} style={mini('#ef4444')}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const primary = { padding: '9px 20px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const ghost = th => ({ padding: '9px 16px', borderRadius: 10, border: `1px solid ${th.border}`, background: 'transparent', color: th.text, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
const mini = color => ({ border: `1px solid ${color}55`, background: `${color}14`, color, borderRadius: 8, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' });
