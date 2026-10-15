import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { normalizeText } from '../utils/faqSearch';

// Contact Reasons tree: Level 1 (category) → Level 2 (reason) → Level 3 (detail).
//  - ContactReasons       : agent page — walk the levels, copy the full path
//  - ContactReasonsAdmin  : Admin Panel tab — add / rename / reorder / hide / delete

const ORANGE = '#FF6B35';
const NAVY = '#0B1120';
const LEVEL_NAMES = ['Level 1', 'Level 2', 'Level 3'];
const LEVEL_HINTS = ['Category', 'Reason', 'Detail'];

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
/*  AGENT PAGE                                                         */
/* ================================================================== */
export function ContactReasons({ DM }) {
  const [rows, setRows] = useState(null);
  const [path, setPath] = useState([]);     // selected ids: [level1, level2, level3]
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/contact-reasons').then(r => setRows(r.data || [])).catch(() => { setRows([]); toast.error('Could not load contact reasons'); });
  }, []);

  const tree = useMemo(() => buildTree(rows || []), [rows]);

  const matches = useMemo(() => {
    const q = normalizeText(query);
    if (!rows || !q) return [];
    return rows
      .filter(r => normalizeText(r.name).includes(q))
      .map(r => tree.pathOf(r.id))
      .slice(0, 12);
  }, [rows, query, tree]);

  const choose = (level, id) => {
    setCopied(false);
    setPath(p => (p[level] === id ? p.slice(0, level) : [...p.slice(0, level), id]));
  };
  const jump = ids => { setPath(ids); setQuery(''); setCopied(false); };

  const selectedNodes = path.map(id => tree.byId.get(id)).filter(Boolean);
  const last = selectedNodes[selectedNodes.length - 1];
  const fullPath = selectedNodes.map(n => n.name).join(' › ');
  const atEnd = last && tree.kids(last.id).length === 0;

  const doCopy = async () => {
    const ok = await copyText(fullPath);
    if (!ok) return toast.error('Copy failed');
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  if (rows === null) return <div style={{ color: DM.subText }}>Loading…</div>;
  if (!rows.length) return <div style={{ color: DM.subText }}>No contact reasons have been added yet.</div>;

  const columns = [tree.kids(0)];
  selectedNodes.forEach(n => { const k = tree.kids(n.id); if (k.length) columns.push(k); });

  return (
    <div style={{ maxWidth: 980 }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="🔍 Search a reason, e.g. “bill not received”…"
        style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: 10, border: `1px solid ${DM.border}`, background: DM.cardBg, color: DM.text, fontSize: 14, fontFamily: 'inherit', marginBottom: 14 }}
      />

      {query.trim() && (
        <div style={{ background: DM.cardBg, border: `1px solid ${DM.border}`, borderRadius: 14, padding: 8, marginBottom: 16, boxShadow: DM.shadow }}>
          {matches.length === 0
            ? <div style={{ padding: 12, fontSize: 13.5, color: DM.subText }}>Nothing matches “{query}”.</div>
            : matches.map(p => (
              <button key={p[p.length - 1].id} onClick={() => jump(p.map(n => n.id))}
                style={{ display: 'block', width: '100%', textAlign: 'start', border: 'none', borderBottom: `1px solid ${DM.border}`, background: 'transparent', padding: '10px 12px', cursor: 'pointer', color: DM.text, fontFamily: 'inherit', fontSize: 13.5 }}>
                {p.map((n, i) => (
                  <span key={n.id} style={{ fontWeight: i === p.length - 1 ? 800 : 500, color: i === p.length - 1 ? DM.text : DM.subText }}>
                    {i > 0 && ' › '}{n.name}
                  </span>
                ))}
              </button>
            ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {columns.map((list, level) => (
          <div key={level} style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '0 4px 8px' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: DM.text }}>{LEVEL_NAMES[level]}</span>
              <span style={{ fontSize: 12, color: DM.subText }}>{LEVEL_HINTS[level]}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(n => {
                const on = path[level] === n.id;
                const hasKids = tree.kids(n.id).length > 0;
                return (
                  <button key={n.id} onClick={() => choose(level, n.id)} aria-pressed={on}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      textAlign: 'start', padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                      border: `1.5px solid ${on ? ORANGE : DM.border}`,
                      background: on ? `${ORANGE}1a` : DM.cardBg, color: DM.text,
                      fontSize: 14, fontWeight: on ? 800 : 600, boxShadow: on ? 'none' : DM.shadow,
                    }}>
                    <span>{n.name}</span>
                    {hasKids && <span style={{ color: on ? ORANGE : DM.subText, fontSize: 13 }}>›</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {last && (
        <div style={{ marginTop: 20, background: DM.cardBg, border: `1px solid ${ORANGE}66`, borderRadius: 16, padding: '16px 18px', boxShadow: DM.shadow }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: DM.subText, marginBottom: 6 }}>
            {atEnd ? 'Your selection' : 'Your selection so far, pick the next level above'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', fontSize: 16, fontWeight: 800, color: DM.text, lineHeight: 1.5 }}>{fullPath}</div>
            <button onClick={doCopy} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: copied ? '#10b981' : ORANGE, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {copied ? '✓ Copied' : '📋 Copy path'}
            </button>
          </div>
          {selectedNodes.filter(n => n.note).map(n => (
            <div key={n.id} style={{ marginTop: 10, fontSize: 13.5, color: DM.subText, lineHeight: 1.6 }}>
              {selectedNodes.length > 1 && <strong style={{ color: DM.text }}>{n.name}: </strong>}{n.note}
            </div>
          ))}
        </div>
      )}

      {!last && !query.trim() && (
        <div style={{ textAlign: 'center', padding: '26px 0 6px', color: DM.subText, fontSize: 13.5 }}>
          Pick a Level 1 category to see its reasons.
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
          <div style={{ fontSize: 13, color: th.sub }}>Three levels: category, reason, detail. Agents see this under Operations.</div>
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
