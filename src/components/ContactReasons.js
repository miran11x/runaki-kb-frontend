import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { normalizeText } from '../utils/faqSearch';

// Contact Reasons tree: Level 1 (category) → Level 2 (reason) → Level 3 (detail).
//  - ContactReasons       : agent page — walk the levels, copy the full path
//  - ContactReasonsAdmin  : Admin Panel tab — add / rename / reorder / hide / delete

const ORANGE = '#FF6B35';
const NAVY = '#0B1120';
const LEVEL_NAMES = ['Level 1', 'Level 2', 'Level 3'];

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

function buildTree(rows) {
  const byParent = new Map();
  rows.forEach(r => {
    const k = r.parent_id || 0;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(r);
  });
  byParent.forEach(list => list.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
  const kids = id => byParent.get(id) || [];
  const byId = new Map(rows.map(r => [r.id, r]));
  const pathOf = id => {
    const out = []; let n = byId.get(id);
    while (n) { out.unshift(n); n = n.parent_id ? byId.get(n.parent_id) : null; }
    return out;
  };
  return { kids, byId, pathOf };
}

/* ================================================================== */
/*  AGENT PAGE — the whole tree is visible, nothing to expand           */
/* ================================================================== */
const TREE_CSS = `
.cr-grid{display:flex;gap:14px;align-items:flex-start}
.cr-col{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:14px}
.cr-kids{list-style:none;margin:0;padding:0;margin-inline-start:12px}
.cr-kids>li{position:relative;padding-inline-start:18px}
.cr-kids>li::before{content:"";position:absolute;inset-inline-start:0;top:0;bottom:0;border-inline-start:2px solid var(--cr-line)}
.cr-kids>li:last-child::before{bottom:auto;height:12px}
.cr-kids>li::after{content:"";position:absolute;inset-inline-start:0;top:12px;width:12px;border-top:2px solid var(--cr-line)}
.cr-node{display:block;width:100%;text-align:start;border:none;background:transparent;font-family:inherit;color:inherit;cursor:pointer;border-radius:8px;padding:3px 8px;line-height:1.4}
.cr-node:hover{background:var(--cr-hover)}
.cr-node:focus-visible{outline:2px solid #FF6B35;outline-offset:1px}
`;

export function ContactReasons({ DM }) {
  const [rows, setRows] = useState(null);
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [cols, setCols] = useState(3);
  const wrapRef = useRef(null);

  // as many columns as fit (about 290px each), so every category stays on one screen
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const fit = () => setCols(Math.max(1, Math.min(5, Math.floor(el.clientWidth / 290))));
    fit();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit); }
    const ro = new ResizeObserver(fit); ro.observe(el);
    return () => ro.disconnect();
  }, [rows]);

  useEffect(() => {
    api.get('/contact-reasons').then(r => setRows(r.data || [])).catch(() => { setRows([]); toast.error('Could not load contact reasons'); });
  }, []);

  const tree = useMemo(() => buildTree(rows || []), [rows]);
  const q = normalizeText(query);

  // with a search: keep a node if it matches or has a matching descendant
  const keep = useMemo(() => {
    if (!q) return null;
    const set = new Set();
    (rows || []).forEach(r => {
      if (normalizeText(r.name).includes(q)) tree.pathOf(r.id).forEach(n => set.add(n.id));
    });
    return set;
  }, [rows, q, tree]);

  const doCopy = async node => {
    const text = tree.pathOf(node.id).map(n => n.name).join(' › ');
    const ok = await copyText(text);
    if (!ok) return toast.error('Copy failed');
    setCopiedId(node.id); setTimeout(() => setCopiedId(null), 1400);
  };

  if (rows === null) return <div style={{ color: DM.subText }}>Loading…</div>;
  if (!rows.length) return <div style={{ color: DM.subText }}>No contact reasons have been added yet.</div>;

  const renderKids = (parent, level) => {
    const list = tree.kids(parent.id).filter(n => !keep || keep.has(n.id));
    if (!list.length) return null;
    return (
      <ul className="cr-kids">
        {list.map(n => (
          <li key={n.id}>
            <button className="cr-node" onClick={() => doCopy(n)} title="Click to copy the full path"
              style={{ fontSize: level === 1 ? 13.5 : 13, fontWeight: level === 1 ? 700 : 500 }}>
              {n.name}
              {copiedId === n.id && <span style={{ color: '#10b981', fontWeight: 800, fontSize: 12 }}>  ✓ copied</span>}
              {n.note && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 400, color: DM.subText, marginTop: 2 }}>{n.note}</span>}
            </button>
            {renderKids(n, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  const tops = tree.kids(0).filter(n => !keep || keep.has(n.id));
  // biggest categories first, each into the shortest column, so the columns end up about the same height
  const weight = n => 2 + (function count(id) { return tree.kids(id).filter(k => !keep || keep.has(k.id)).reduce((t, k) => t + 1 + count(k.id), 0); })(n.id);
  const columns = Array.from({ length: cols }, () => ({ h: 0, items: [] }));
  [...tops].sort((x, y) => weight(y) - weight(x)).forEach(c => { const col = columns.reduce((a, b) => (b.h < a.h ? b : a)); col.items.push(c); col.h += weight(c); });
  const vars = { '--cr-line': DM.border === '#e2e8f0' ? '#cbd5e1' : 'rgba(255,255,255,0.22)', '--cr-hover': DM.border === '#e2e8f0' ? '#f1f5f9' : 'rgba(255,255,255,0.06)' };

  return (
    <div ref={wrapRef} style={{ maxWidth: 1500, ...vars }}>
      <style>{TREE_CSS}</style>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="🔍 Search a reason, e.g. “bill not received”…"
        style={{ width: '100%', maxWidth: 520, boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: `1px solid ${DM.border}`, background: DM.cardBg, color: DM.text, fontSize: 14, fontFamily: 'inherit', marginBottom: 6 }}
      />
      <div style={{ fontSize: 12.5, color: DM.subText, margin: '0 2px 12px' }}>
        Click any item to copy its full path, for example “General Complaints › Outage (cutoff) › Meter Trip”.
      </div>

      {tops.length === 0
        ? <div style={{ padding: '20px 4px', color: DM.subText, fontSize: 13.5 }}>Nothing matches “{query}”.</div>
        : (
          <div className="cr-grid">
            {columns.filter(col => col.items.length).map((col, ci) => (
              <div key={ci} className="cr-col">
              {col.items.map(c => (
              <div key={c.id} style={{ background: DM.cardBg, border: `1px solid ${DM.border}`, borderRadius: 16, padding: '10px 10px 8px', boxShadow: DM.shadow, color: DM.text }}>
                <button className="cr-node" onClick={() => doCopy(c)} title="Click to copy"
                  style={{ fontSize: 15, fontWeight: 800, borderInlineStart: `4px solid ${ORANGE}`, borderRadius: 4, paddingInlineStart: 10, marginBottom: 4 }}>
                  {c.name}
                  {copiedId === c.id && <span style={{ color: '#10b981', fontWeight: 800, fontSize: 12 }}>  ✓ copied</span>}
                  {c.note && <span style={{ display: 'block', fontSize: 12.5, fontWeight: 400, color: DM.subText, marginTop: 2 }}>{c.note}</span>}
                </button>
                {renderKids(c, 1)}
              </div>
              ))}
              </div>
            ))}
          </div>
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

export function ContactReasonsAdmin({ darkMode }) {
  const th = useTheme(darkMode);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(new Set());
  const [form, setForm] = useState(null); // {id?, parent_id, name, note, level}
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setRows((await api.get('/contact-reasons?all=1')).data || []); }
    catch { toast.error('Could not load contact reasons'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const tree = useMemo(() => buildTree(rows), [rows]);
  const countBelow = id => tree.kids(id).reduce((n, k) => n + 1 + countBelow(k.id), 0);

  const inp = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' };
  const iconBtn = { border: `1px solid ${th.border}`, background: 'transparent', color: th.text, borderRadius: 8, padding: '4px 9px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' };

  const toggleOpen = id => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const save = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setBusy(true);
    try {
      if (form.id) await api.put(`/contact-reasons/${form.id}`, { name: form.name, note: form.note, is_active: form.is_active });
      else {
        await api.post('/contact-reasons', { parent_id: form.parent_id, name: form.name, note: form.note });
        if (form.parent_id) setOpen(s => new Set(s).add(form.parent_id));
      }
      toast.success('Saved'); setForm(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Could not save'); }
    setBusy(false);
  };
  const remove = async n => {
    const below = countBelow(n.id);
    const msg = below ? `Delete "${n.name}" and the ${below} item${below > 1 ? 's' : ''} under it?` : `Delete "${n.name}"?`;
    if (!window.confirm(msg)) return;
    try { await api.delete(`/contact-reasons/${n.id}`); load(); } catch { toast.error('Could not delete'); }
  };
  const toggleActive = async n => {
    try { await api.put(`/contact-reasons/${n.id}`, { name: n.name, note: n.note, is_active: !n.is_active }); load(); } catch { toast.error('Could not update'); }
  };
  const move = async (n, direction) => {
    try { await api.post(`/contact-reasons/${n.id}/move`, { direction }); load(); } catch { toast.error('Could not move'); }
  };

  const Row = ({ n, level, index, total }) => {
    const kids = tree.kids(n.id);
    const isOpen = open.has(n.id);
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginInlineStart: level * 22, borderBottom: `1px solid ${th.border}`, opacity: n.is_active ? 1 : 0.5, flexWrap: 'wrap' }}>
          <button onClick={() => toggleOpen(n.id)} disabled={!kids.length && level === 2}
            style={{ ...iconBtn, width: 26, padding: 0, visibility: level === 2 ? 'hidden' : 'visible' }} aria-label={isOpen ? 'Collapse' : 'Expand'}>
            {isOpen ? '▾' : '▸'}
          </button>
          <span style={{ flex: '1 1 200px', minWidth: 0, color: th.text, fontSize: 13.5, fontWeight: level === 0 ? 800 : 600 }}>
            {n.name}
            {!n.is_active && <span style={{ color: th.sub, fontWeight: 500 }}> (hidden)</span>}
            {kids.length > 0 && <span style={{ color: th.sub, fontWeight: 500 }}> · {kids.length}</span>}
            {n.note && <span style={{ color: th.sub, fontWeight: 500 }}> · has note</span>}
          </span>
          <button style={iconBtn} disabled={index === 0} onClick={() => move(n, 'up')} title="Move up">↑</button>
          <button style={iconBtn} disabled={index === total - 1} onClick={() => move(n, 'down')} title="Move down">↓</button>
          {level < 2 && <button style={iconBtn} onClick={() => setForm({ parent_id: n.id, name: '', note: '', level: level + 1 })}>+ Add {LEVEL_NAMES[level + 1]}</button>}
          <button style={iconBtn} onClick={() => setForm({ id: n.id, parent_id: n.parent_id, name: n.name, note: n.note || '', is_active: n.is_active, level })}>Edit</button>
          <button style={iconBtn} onClick={() => toggleActive(n)}>{n.is_active ? 'Hide' : 'Show'}</button>
          <button style={{ ...iconBtn, color: '#ef4444', borderColor: '#ef444455' }} onClick={() => remove(n)}>Delete</button>
        </div>
        {isOpen && kids.map((k, i) => <Row key={k.id} n={k} level={level + 1} index={i} total={kids.length} />)}
      </div>
    );
  };

  const top = tree.kids(0);

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: th.text }}>Contact Reasons</div>
          <div style={{ fontSize: 13, color: th.sub }}>Three levels: category, reason, detail. Agents see the whole tree under Operations.</div>
        </div>
        <button onClick={() => setForm({ parent_id: null, name: '', note: '', level: 0 })}
          style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add Level 1 category
        </button>
      </div>

      {form && (
        <div style={{ background: th.card, border: `1px solid ${ORANGE}66`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: th.text, marginBottom: 12 }}>
            {form.id ? `Edit ${LEVEL_NAMES[form.level]}` : `New ${LEVEL_NAMES[form.level]} item`}
            {!form.id && form.parent_id && <span style={{ color: th.sub, fontWeight: 500 }}> under “{tree.byId.get(form.parent_id)?.name}”</span>}
          </div>
          <label style={{ fontSize: 12, color: th.sub }}>Name</label>
          <input style={{ ...inp, marginBottom: 10 }} value={form.name} autoFocus onChange={e => setForm({ ...form, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && save()} />
          <label style={{ fontSize: 12, color: th.sub }}>Note for agents (optional, shown when this item is selected)</label>
          <textarea style={{ ...inp, minHeight: 70, marginBottom: 12, resize: 'vertical' }} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button disabled={busy} onClick={save} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
            <button onClick={() => setForm(null)} style={{ ...iconBtn, padding: '9px 18px', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 8 }}>
        {top.length === 0
          ? <div style={{ padding: 16, color: th.sub, fontSize: 13.5 }}>No categories yet. Add the first one.</div>
          : top.map((n, i) => <Row key={n.id} n={n} level={0} index={i} total={top.length} />)}
      </div>
    </div>
  );
}
