import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { track } from '../utils/track';
import { useTheme, Panel, Empty, ORANGE, GREEN, RED } from './qaUi';
import { NAV_ITEMS, searchNav } from '../utils/navItems';
import { ExportButton, exportSheets } from './ReportKit';

// Folders (links to shared files), SMS templates, External links and the Updates channel.
// The agent pages and the admin editors live together because they share the same data.

const inputStyle = th => ({ padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 0 });
const btn = (bg, extra) => ({ padding: '9px 16px', borderRadius: 10, border: 'none', background: bg, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', ...extra });
const mini = (th, c) => ({ padding: '6px 11px', borderRadius: 8, border: `1px solid ${c}55`, background: `${c}14`, color: c, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' });
const openNew = url => window.open(url, '_blank', 'noopener,noreferrer');
const copy = async (text, msg = 'Copied') => { try { await navigator.clipboard.writeText(text); toast.success(msg); } catch { toast.error('Could not copy'); } };
const sizeLabel = n => (n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1000)) + ' KB');
const fileIcon = n => (/\.(xlsx|xls|csv)$/i.test(n || '') ? '📊' : /\.pdf$/i.test(n || '') ? '📕' : /\.(docx|doc)$/i.test(n || '') ? '📝' : /\.pptx$/i.test(n || '') ? '📽️' : '📄');
// Files travel in pieces of up to 3 MB (the hosting refuses bigger requests), so large Excel files work.
const CHUNK = 3 * 1000 * 1000;
const MAX_TOTAL_MB = 25;
const downloadFile = async l => {
  const tid = toast.loading('Downloading…');
  try {
    const info = (await api.get(`/folder-files/${l.id}/info`)).data;
    const parts = [];
    for (let i = 0; i < info.parts; i++) {
      if (info.parts > 1) toast.loading(`Downloading… ${i + 1}/${info.parts}`, { id: tid });
      parts.push((await api.get(`/folder-files/${l.id}/download`, { params: { part: i }, responseType: 'blob' })).data);
    }
    const u = URL.createObjectURL(new Blob(parts, { type: info.type }));
    const a = document.createElement('a'); a.href = u; a.download = info.name || l.file_name || l.title;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    toast.success('Downloaded', { id: tid });
  } catch { toast.error('Could not download the file', { id: tid }); }
};
// uploads a file into a folder (folderId) or replaces the file of an existing card (linkId)
const uploadFile = async (file, { folderId, linkId, title, description, sortOrder }) => {
  if (file.size > MAX_TOTAL_MB * 1000 * 1000) throw new Error(`This file is ${(file.size / 1e6).toFixed(1)} MB. The limit is ${MAX_TOTAL_MB} MB. Put it on SharePoint and add the link instead.`);
  const tid = toast.loading('Uploading…');
  try {
    const init = (await api.post('/admin/folder-files/init', { folder_id: folderId, link_id: linkId, title, description, sort_order: sortOrder, filename: file.name, size: file.size })).data;
    const n = Math.ceil(file.size / CHUNK);
    for (let i = 0; i < n; i++) {
      if (n > 1) toast.loading(`Uploading… ${i + 1}/${n}`, { id: tid });
      await api.post(`/admin/folder-files/${init.id}/chunk`, file.slice(i * CHUNK, (i + 1) * CHUNK), { params: { idx: i, version: init.version }, headers: { 'Content-Type': 'application/octet-stream' }, transformRequest: [d => d] });
    }
    await api.post(`/admin/folder-files/${init.id}/finish`, { version: init.version, size: file.size });
    toast.dismiss(tid);
  } catch (e) { toast.dismiss(tid); throw e; }
};
const FILE_ACCEPT = '.xlsx,.xls,.csv,.pdf,.docx,.doc,.pptx,.txt';
const errMsg = (e, d) => e?.response?.data?.error || (!e?.response && e?.message && e.message !== 'Network Error' ? e.message : d);

/* ───────────────────────── Folders (agent) ───────────────────────── */
export function FolderPage({ folderId, darkMode }) {
  const th = useTheme(darkMode);
  const { user } = useAuth();
  const staff = ['team_lead', 'qa_officer'].includes(String(user?.role || '').trim().toLowerCase());
  const [folder, setFolder] = useState(undefined);
  useEffect(() => {
    api.get(staff ? '/folders?all=1' : '/folders').then(r => setFolder((r.data || []).find(f => String(f.id) === String(folderId)) || null)).catch(() => setFolder(null));
  }, [folderId, staff]);
  if (folder === undefined) return <Empty th={th}>Loading…</Empty>;
  if (!folder) return <Empty th={th}>This folder is not available.</Empty>;
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 34 }}>{folder.icon}</span>
        <div><h2 style={{ margin: 0, color: th.text, fontSize: 22 }}>{folder.name}</h2>{folder.description && <div style={{ color: th.sub, fontSize: 13.5, marginTop: 2 }}>{folder.description}</div>}</div>
      </div>
      <div style={{ color: th.sub, fontSize: 12.5, margin: '10px 0 16px' }}>Links open in a new tab (you may need to be signed in to your work account). Excel and other files download to your computer.</div>
      {!folder.links.length ? <Empty th={th}>No files in this folder yet.</Empty> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {folder.links.map(l => (
            <button key={l.id} onClick={() => { track('file', l.title); return l.has_file ? downloadFile(l) : openNew(l.url); }} style={{ textAlign: 'start', background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 24 }}>{l.has_file ? fileIcon(l.file_name) : '📄'}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, color: th.text, fontSize: 14.5, overflowWrap: 'anywhere' }}>{l.title}</span>
                {l.description && <span style={{ display: 'block', color: th.sub, fontSize: 12.5, marginTop: 3, lineHeight: 1.5 }}>{l.description}</span>}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '7px 16px', borderRadius: 10, background: ORANGE, color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: `0 4px 12px ${ORANGE}44` }}>{l.has_file ? '⬇ Download' : 'Open ↗'}</span>
                {l.has_file && <span style={{ display: 'block', color: th.sub, fontSize: 11.5, marginTop: 6 }}>{l.file_name} · {sizeLabel(l.file_size)}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Folders (admin) ───────────────────────── */
export function FoldersAdmin({ darkMode }) {
  const th = useTheme(darkMode); const inp = inputStyle(th);
  const [folders, setFolders] = useState([]);
  const [nf, setNf] = useState({ name: '', icon: '📁', description: '' });
  const [nl, setNl] = useState({});
  const load = useCallback(() => api.get('/folders?all=1').then(r => setFolders(r.data || [])).catch(() => toast.error('Could not load folders')), []);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { try { await fn(); if (ok) toast.success(ok); load(); } catch (e) { toast.error(errMsg(e, 'Something went wrong')); } };
  const addFolder = () => run(async () => { await api.post('/admin/folders', { ...nf, sort_order: folders.length + 1 }); setNf({ name: '', icon: '📁', description: '' }); }, 'Folder added');
  const addLink = f => { const d = nl[f.id] || {}; return run(async () => { await api.post('/admin/folder-links', { folder_id: f.id, title: d.title, url: d.url, description: d.description, sort_order: f.links.length + 1 }); setNl({ ...nl, [f.id]: {} }); }, 'File added'); };
  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: th.text, marginBottom: 4 }}>🗂️ Folders</div>
        <ExportButton onClick={() => exportSheets('folders', [{ name: 'Folders and files', rows: folders.flatMap(f => (f.links || []).map(l => ({ Folder: f.name, Title: l.title, Link: l.url || '', Description: l.description || '' }))) }])} />
      </div>
      <div style={{ fontSize: 13, color: th.sub, marginBottom: 16, lineHeight: 1.7 }}>
        Each folder appears under <b>Folders</b> in the agents’ sidebar. Add a link (SharePoint, Excel Online, anything) or <b>upload a file</b> (Excel, PDF, Word, PowerPoint, up to 25 MB) that agents download. Use <b>Hidden</b> to keep a folder or a file away from agents without deleting it.
      </div>
      <Panel th={th} title="＋ New folder">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...inp, width: 64, textAlign: 'center' }} value={nf.icon} onChange={e => setNf({ ...nf, icon: e.target.value })} title="Emoji" />
          <input style={{ ...inp, flex: '1 1 200px' }} placeholder="Folder name (e.g. Training files)" value={nf.name} onChange={e => setNf({ ...nf, name: e.target.value })} />
          <input style={{ ...inp, flex: '2 1 260px' }} placeholder="Short description (optional)" value={nf.description} onChange={e => setNf({ ...nf, description: e.target.value })} />
          <button disabled={!nf.name.trim()} onClick={addFolder} style={btn(ORANGE, { opacity: nf.name.trim() ? 1 : 0.5 })}>Add folder</button>
        </div>
      </Panel>
      {folders.map(f => (
        <Panel key={f.id} th={th} style={{ marginTop: 14, opacity: f.is_visible ? 1 : 0.75 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
            <input style={{ ...inp, width: 56, textAlign: 'center' }} defaultValue={f.icon} onBlur={e => e.target.value !== f.icon && run(() => api.put(`/admin/folders/${f.id}`, { ...f, icon: e.target.value }))} />
            <input style={{ ...inp, flex: '1 1 180px', fontWeight: 800 }} defaultValue={f.name} onBlur={e => e.target.value.trim() && e.target.value !== f.name && run(() => api.put(`/admin/folders/${f.id}`, { ...f, name: e.target.value }))} />
            <input style={{ ...inp, flex: '2 1 220px' }} placeholder="Description" defaultValue={f.description || ''} onBlur={e => e.target.value !== (f.description || '') && run(() => api.put(`/admin/folders/${f.id}`, { ...f, description: e.target.value }))} />
            <input style={{ ...inp, width: 64 }} type="number" title="Order" defaultValue={f.sort_order} onBlur={e => +e.target.value !== f.sort_order && run(() => api.put(`/admin/folders/${f.id}`, { ...f, sort_order: e.target.value }))} />
            <button style={mini(th, f.is_visible ? GREEN : '#64748b')} onClick={() => run(() => api.put(`/admin/folders/${f.id}`, { ...f, is_visible: !f.is_visible }))}>{f.is_visible ? 'Visible to agents' : 'Hidden'}</button>
            <button style={mini(th, RED)} onClick={() => window.confirm(`Delete the folder “${f.name}” and all its links?`) && run(() => api.delete(`/admin/folders/${f.id}`), 'Folder deleted')}>✕ Delete</button>
          </div>
          {f.links.map(l => (
            <div key={l.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${th.border}`, opacity: l.is_visible ? 1 : 0.65 }}>
              <span>{l.has_file ? fileIcon(l.file_name) : '📄'}</span>
              <input style={{ ...inp, flex: '1 1 160px' }} defaultValue={l.title} onBlur={e => e.target.value.trim() && e.target.value !== l.title && run(() => api.put(`/admin/folder-links/${l.id}`, { ...l, title: e.target.value }))} />
              {l.has_file ? (
                <>
                  <div style={{ flex: '2 1 240px', fontSize: 12.5, color: th.sub, overflowWrap: 'anywhere' }}>{l.file_name} · {sizeLabel(l.file_size)} · uploaded {l.file_updated_at ? new Date(l.file_updated_at).toLocaleDateString() : ''}</div>
                  <label style={{ ...mini(th, ORANGE), display: 'inline-block' }}>Replace file
                    <input type="file" accept={FILE_ACCEPT} style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) run(() => uploadFile(f, { linkId: l.id }), 'File replaced'); }} />
                  </label>
                  <button style={mini(th, '#38bdf8')} onClick={() => downloadFile(l)}>Download</button>
                </>
              ) : (
                <>
                  <input style={{ ...inp, flex: '2 1 240px', direction: 'ltr' }} defaultValue={l.url} onBlur={e => e.target.value !== l.url && run(() => api.put(`/admin/folder-links/${l.id}`, { ...l, url: e.target.value }), 'Saved')} />
                  <button style={mini(th, '#38bdf8')} onClick={() => openNew(l.url)}>Test ↗</button>
                </>
              )}
              <button style={mini(th, l.is_visible ? GREEN : '#64748b')} onClick={() => run(() => api.put(`/admin/folder-links/${l.id}`, { ...l, is_visible: !l.is_visible }))}>{l.is_visible ? 'Visible' : 'Hidden'}</button>
              <button style={mini(th, RED)} onClick={() => window.confirm(`Remove “${l.title}”?`) && run(() => api.delete(`/admin/folder-links/${l.id}`), 'File removed')}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, paddingTop: 10, borderTop: `1px dashed ${th.border}` }}>
            <input style={{ ...inp, flex: '1 1 160px' }} placeholder="Name shown to agents" value={(nl[f.id] || {}).title || ''} onChange={e => setNl({ ...nl, [f.id]: { ...nl[f.id], title: e.target.value } })} />
            <input style={{ ...inp, flex: '2 1 240px', direction: 'ltr' }} placeholder="https://... (SharePoint, Excel, any link)" value={(nl[f.id] || {}).url || ''} onChange={e => setNl({ ...nl, [f.id]: { ...nl[f.id], url: e.target.value } })} />
            <input style={{ ...inp, flex: '1 1 160px' }} placeholder="Note (optional)" value={(nl[f.id] || {}).description || ''} onChange={e => setNl({ ...nl, [f.id]: { ...nl[f.id], description: e.target.value } })} />
            <button disabled={!(nl[f.id] || {}).title || !(nl[f.id] || {}).url} onClick={() => addLink(f)} style={btn(ORANGE, { opacity: (nl[f.id] || {}).title && (nl[f.id] || {}).url ? 1 : 0.5 })}>Add link</button>
            <label style={btn('#10b981', { display: 'inline-block' })} title="Excel, PDF, Word or PowerPoint, up to 25 MB">⬆ Upload file
              <input type="file" accept={FILE_ACCEPT} style={{ display: 'none' }} onChange={e => { const file = e.target.files[0]; e.target.value = ''; if (!file) return; run(() => uploadFile(file, { folderId: f.id, title: (nl[f.id] || {}).title || undefined, description: (nl[f.id] || {}).description || undefined, sortOrder: f.links.length + 1 }), 'File uploaded'); }} />
            </label>
          </div>
        </Panel>
      ))}
      {!folders.length && <Empty th={th}>No folders yet. Add the first one above.</Empty>}
    </div>
  );
}

/* ───────────────────────── SMS templates (agent) ───────────────────────── */
const LANGS = [['en', 'English'], ['ku', 'Sorani'], ['ba', 'Badini'], ['ar', 'Arabic']];
// Contact-reason helpers: the CRM level an agent must pick for each SMS (Level 1 › Level 2 › Level 3)
const crPath = (tree, id) => { const by = new Map((tree || []).map(n => [n.id, n])); const out = []; let n = by.get(id); while (n) { out.unshift(n.name); n = n.parent_id ? by.get(n.parent_id) : null; } return out; };
const smsLevel = (t, tree) => { const live = t.reason_id ? crPath(tree, t.reason_id) : []; return live.length ? live : (t.reason_path ? t.reason_path.split('>').map(x => x.trim()).filter(Boolean) : []); };
const smsMatches = (t, q) => { const w = q.trim().toLowerCase().replace(/^#/, ''); if (!w) return true; if (/^\d+$/.test(w) && t.code != null) return Number(w) === t.code; return [t.title, t.body_en, t.body_ku, t.body_ba, t.body_ar].some(x => String(x || '').toLowerCase().includes(w)); };

const pad3 = n => String(n).padStart(3, '0');
// {placeholders} are highlighted so agents see what the system fills in
const withPlaceholders = text => String(text || '').split(/(\{[^}]+\})/g).map((p, i) => (/^\{[^}]+\}$/.test(p) ? <span key={i} style={{ color: ORANGE, fontWeight: 800, background: `${ORANGE}14`, borderRadius: 5, padding: '0 3px' }}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>));

function LevelChip({ levels, th, canCopy }) {
  if (!levels.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: `${ORANGE}12`, border: `1px solid ${ORANGE}55`, borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: ORANGE }}>🎫 Select in Freshdesk</span>
      {levels.map((l, k) => (
        <React.Fragment key={k}>
          {k > 0 && <span style={{ color: th.sub, fontWeight: 800 }}>›</span>}
          <span style={{ fontSize: 12.5, fontWeight: 700, color: th.text, background: th.card, border: `1px solid ${th.border}`, borderRadius: 100, padding: '2px 10px' }}><span style={{ color: th.sub, fontWeight: 600 }}>Level {k + 1}: </span>{l}</span>
        </React.Fragment>
      ))}
      {canCopy && <button onClick={() => copy(levels.join(' > '), 'Level copied')} style={{ marginInlineStart: 'auto', background: 'none', border: `1px solid ${ORANGE}`, color: ORANGE, borderRadius: 100, padding: '2px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Copy</button>}
    </div>
  );
}

export function SmsTemplates({ darkMode }) {
  const th = useTheme(darkMode);
  const { user } = useAuth();
  const staff = ['team_lead', 'qa_officer'].includes(String(user?.role || '').trim().toLowerCase());
  const [types, setTypes] = useState(null);
  const [tree, setTree] = useState([]);
  const [tid, setTid] = useState(null);
  const [lang, setLang] = useState('en');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  useEffect(() => {
    api.get('/sms').then(r => { const list = (r.data || []).filter(t => (t.templates || []).length); setTypes(list); setTid(list[0]?.id || null); }).catch(() => setTypes([]));
    api.get('/contact-reasons').then(r => setTree(r.data || [])).catch(() => {});
  }, []);
  if (!types) return <Empty th={th}>Loading…</Empty>;
  if (!types.length) return <Empty th={th}>No SMS templates yet.</Empty>;
  const cur = types.find(t => t.id === tid) || types[0];
  const all = types.flatMap(t => t.templates);
  const open = openId ? all.find(m => m.id === openId) : null;
  const body = t => t[`body_${lang}`] || t.body_en || t.body_ku || t.body_ba || t.body_ar || '';
  const searching = q.trim().length > 0;
  const shown = searching ? all.filter(m => smsMatches(m, q)) : cur.templates;
  const noCopy = staff ? {} : { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' };
  const block = staff ? {} : { onCopy: e => e.preventDefault(), onCut: e => e.preventDefault(), onContextMenu: e => e.preventDefault(), onDragStart: e => e.preventDefault() };

  if (open) {
    const lv = smsLevel(open, tree);
    return (
      <div style={{ maxWidth: 860 }}>
        <button onClick={() => setOpenId(null)} style={{ ...mini(th, ORANGE), marginBottom: 12 }}>← All SMS</button>
        <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {open.code != null && <span style={{ background: ORANGE, color: '#fff', fontWeight: 900, fontSize: 20, borderRadius: 10, padding: '4px 14px', letterSpacing: 1 }}>{pad3(open.code)}</span>}
            <div style={{ fontWeight: 800, color: th.text, fontSize: 19 }}>{open.title}</div>
            {staff && <button onClick={() => copy(body(open), 'SMS copied')} style={{ ...btn(ORANGE, { padding: '7px 14px', fontSize: 12.5 }), marginInlineStart: 'auto' }}>📋 Copy SMS</button>}
          </div>
          <LevelChip levels={lv} th={th} canCopy={staff} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', margin: '4px 0 12px' }}>
            <span style={{ fontSize: 12.5, color: th.sub, fontWeight: 700 }}>🌐 Language</span>
            {LANGS.map(([k, n]) => <button key={k} onClick={() => setLang(k)} style={{ padding: '5px 12px', borderRadius: 100, border: `1px solid ${lang === k ? th.text : th.border}`, background: lang === k ? th.text : 'transparent', color: lang === k ? th.card : th.text, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', opacity: open[`body_${k}`] ? 1 : 0.5 }}>{n}</button>)}
          </div>
          <div dir={lang === 'en' ? 'ltr' : 'rtl'} {...block} style={{ whiteSpace: 'pre-wrap', color: th.text, background: th.soft, border: `1px solid ${th.border}`, borderRadius: 12, padding: '14px 16px', fontSize: 15, lineHeight: 1.9, overflowWrap: 'anywhere', ...noCopy }}>{withPlaceholders(body(open))}</div>
          {!open[`body_${lang}`] && <div style={{ fontSize: 11.5, color: th.sub, marginTop: 6 }}>No {LANGS.find(l => l[0] === lang)[1]} text yet, showing another language.</div>}
          <div style={{ fontSize: 12, color: th.sub, marginTop: 10 }}>The words in <b style={{ color: ORANGE }}>{'{orange}'}</b> are filled in automatically by the system.</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 980 }}>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by SMS number or name (for example 001 or bill)…" style={{ ...inputStyle(th), width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: '11px 14px', fontSize: 14 }} />
      {!searching && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {types.map(t => <button key={t.id} onClick={() => setTid(t.id)} style={{ padding: '8px 16px', borderRadius: 100, border: `1px solid ${cur.id === t.id ? ORANGE : th.border}`, background: cur.id === t.id ? ORANGE : th.card, color: cur.id === t.id ? '#fff' : th.text, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{t.icon} {t.name}</button>)}
        </div>
      )}
      {!shown.length ? <Empty th={th}>{searching ? `No SMS found for “${q}”.` : 'No templates in this type yet.'}</Empty> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12 }}>
          {shown.map(t => {
            const lv = smsLevel(t, tree);
            return (
              <button key={t.id} onClick={() => setOpenId(t.id)} style={{ textAlign: 'start', background: th.card, border: `1.5px solid ${th.border}`, borderRadius: 16, padding: '16px 16px 14px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 130, transition: 'transform .12s, border-color .12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = th.border; e.currentTarget.style.transform = 'none'; }}>
                <span style={{ alignSelf: 'flex-start', background: t.code != null ? ORANGE : th.soft, color: t.code != null ? '#fff' : th.sub, fontWeight: 900, fontSize: 17, borderRadius: 9, padding: '2px 11px', letterSpacing: 1 }}>{t.code != null ? pad3(t.code) : '—'}</span>
                <span style={{ fontWeight: 800, color: th.text, fontSize: 15, lineHeight: 1.35 }}>{t.title}</span>
                {lv.length > 0 && <span style={{ fontSize: 11.5, color: th.sub, marginTop: 'auto' }}>🎫 {lv[lv.length - 1]}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Cascading selects (Level 1 → Level 2 → Level 3) that store the CRM contact reason the agent must choose for this SMS
function LevelPicker({ th, inp, tree, edit, setEdit }) {
  const kids = pid => tree.filter(n => (n.parent_id || null) === pid && n.is_active !== false).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  const chain = edit.reason_id ? (() => { const by = new Map(tree.map(n => [n.id, n])); const out = []; let n = by.get(edit.reason_id); while (n) { out.unshift(n); n = n.parent_id ? by.get(n.parent_id) : null; } return out; })() : [];
  const pick = (level, val) => {
    const keep = chain.slice(0, level);
    const node = val ? tree.find(n => n.id === +val) : null;
    const next = node ? [...keep, node] : keep;
    const last = next[next.length - 1];
    setEdit({ ...edit, reason_id: last ? last.id : null, reason_path: next.map(n => n.name).join(' > ') });
  };
  const sels = [kids(null)];
  chain.forEach(n => sels.push(kids(n.id)));
  const legacy = !chain.length && edit.reason_path;
  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: th.sub, marginBottom: 4 }}>Freshdesk level the agent selects (contact reason)</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sels.slice(0, 3).map((opts, lv) => (opts.length || chain[lv]) ? (
          <select key={lv} style={{ ...inp, flex: '1 1 150px' }} value={chain[lv] ? chain[lv].id : ''} onChange={e => pick(lv, e.target.value)}>
            <option value="">{lv === 0 ? 'Level 1 (none)' : `Level ${lv + 1} (none)`}</option>
            {opts.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        ) : null)}
      </div>
      {legacy && <div style={{ fontSize: 11.5, color: th.sub, marginTop: 4 }}>Saved as “{edit.reason_path}” (not found in the contact reasons list). Pick the right levels above to link it.</div>}
    </div>
  );
}

/* ───────────────────────── SMS templates (admin) ───────────────────────── */
export function SmsAdmin({ darkMode }) {
  const th = useTheme(darkMode); const inp = inputStyle(th);
  const [types, setTypes] = useState([]);
  const [nt, setNt] = useState({ name: '', icon: '💬' });
  const [edit, setEdit] = useState(null); // {id?, type_id, title, body_*}
  const [tree, setTree] = useState([]);
  const [showArch, setShowArch] = useState({});
  useEffect(() => { api.get('/contact-reasons?all=1').then(r => setTree(r.data || [])).catch(() => {}); }, []);
  const load = useCallback(() => api.get('/sms?all=1').then(r => setTypes(r.data || [])).catch(() => toast.error('Could not load SMS templates')), []);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { try { await fn(); if (ok) toast.success(ok); load(); return true; } catch (e) { toast.error(errMsg(e, 'Something went wrong')); return false; } };
  const save = async () => { const ok = await run(() => (edit.id ? api.put(`/admin/sms-templates/${edit.id}`, edit) : api.post('/admin/sms-templates', edit)), 'Template saved'); if (ok) setEdit(null); };
  const area = (k, label, rtl) => (
    <div style={{ flex: '1 1 300px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: th.sub, marginBottom: 4 }}>{label}</div>
      <textarea rows={10} dir={rtl ? 'rtl' : 'ltr'} style={{ ...inp, width: '100%', boxSizing: 'border-box', lineHeight: 1.8, resize: 'vertical' }} value={edit[k] || ''} onChange={e => setEdit({ ...edit, [k]: e.target.value })} />
      <div style={{ fontSize: 11, color: th.sub, textAlign: 'end' }}>{(edit[k] || '').length} characters</div>
    </div>
  );
  const row = m => {
    const lv = smsLevel(m, tree);
    return (
      <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: `1px solid ${th.border}`, opacity: m.is_active && !m.is_archived ? 1 : 0.65 }}>
        <span style={{ minWidth: 38, textAlign: 'center', background: m.code != null ? ORANGE : th.soft, color: m.code != null ? '#fff' : th.sub, fontWeight: 900, fontSize: 12.5, borderRadius: 8, padding: '3px 8px' }}>{m.code != null ? pad3(m.code) : 'no #'}</span>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: th.text, fontSize: 13.5 }}>{m.title}{m.is_archived && <span style={{ marginInlineStart: 8, fontSize: 11, color: th.sub }}>archived</span>}</div>
          <div style={{ color: th.sub, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lv.length ? `📍 ${lv.join(' › ')}` : 'No Freshdesk level set'} · {[m.body_en && 'EN', m.body_ku && 'KU', m.body_ba && 'BA', m.body_ar && 'AR'].filter(Boolean).join(' ')}</div>
        </div>
        <button style={mini(th, '#38bdf8')} onClick={() => setEdit({ ...m })}>Edit</button>
        {!m.is_archived && <button style={mini(th, m.is_active ? GREEN : '#64748b')} title="Hidden templates are not shown to agents" onClick={() => run(() => api.put(`/admin/sms-templates/${m.id}`, { ...m, is_active: !m.is_active }))}>{m.is_active ? 'Visible' : 'Hidden'}</button>}
        <button style={mini(th, m.is_archived ? GREEN : '#a16207')} onClick={() => run(() => api.put(`/admin/sms-templates/${m.id}`, { ...m, is_archived: !m.is_archived }), m.is_archived ? 'Restored' : 'Archived')}>{m.is_archived ? 'Restore' : 'Archive'}</button>
        <button style={mini(th, RED)} onClick={() => window.confirm(`Delete “${m.title}” for good? Use Archive to keep it.`) && run(() => api.delete(`/admin/sms-templates/${m.id}`), 'Template deleted')}>✕</button>
      </div>
    );
  };
  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: th.text, marginBottom: 4 }}>💬 SMS Templates</div>
        <ExportButton onClick={() => exportSheets('sms-templates', [{ name: 'SMS templates', rows: types.flatMap(t => (t.templates || []).map(m => ({ Number: m.code != null ? String(m.code).padStart(3, '0') : '', Type: t.name, Title: m.title, 'Freshdesk level': smsLevel(m, tree).join(' > ') || m.reason_path || '', Visible: m.is_active ? 'Yes' : 'No', Archived: m.is_archived ? 'Yes' : 'No', English: m.body_en || '', Sorani: m.body_ku || '', Badini: m.body_ba || '', Arabic: m.body_ar || '' }))) }])} />
      </div>
      <div style={{ fontSize: 13, color: th.sub, marginBottom: 16, lineHeight: 1.7 }}>
        The SMS messages agents send to customers, grouped by type. Agents see the types as tabs under <b>Tools → SMS Templates</b> and copy the text in one click. Write each message in as many languages as you need.
      </div>
      {edit && (
        <Panel th={th} title={edit.id ? 'Edit template' : 'New template'} style={{ marginBottom: 14, borderColor: ORANGE }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <select style={inp} value={edit.type_id} onChange={e => setEdit({ ...edit, type_id: +e.target.value })}>{types.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}</select>
            <input style={{ ...inp, flex: '1 1 240px' }} placeholder="Title (e.g. Bill sent by SMS)" value={edit.title || ''} onChange={e => setEdit({ ...edit, title: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: th.sub, marginBottom: 4 }}>SMS number (shows as 001, 002…)</div>
              <input type="number" min="1" style={{ ...inp, width: 100 }} placeholder="e.g. 1 (shows as 001)" value={edit.code ?? ''} onChange={e => setEdit({ ...edit, code: e.target.value === '' ? null : e.target.value })} />
            </div>
            <LevelPicker th={th} inp={inp} tree={tree} edit={edit} setEdit={setEdit} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{area('body_en', 'English', false)}{area('body_ku', 'Sorani · سۆرانی', true)}{area('body_ba', 'Badini · بادینی', true)}{area('body_ar', 'Arabic · العربية', true)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={btn(ORANGE)} onClick={save}>Save template</button>
            <button style={btn('#64748b')} onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </Panel>
      )}
      {types.map(t => (
        <Panel key={t.id} th={th} style={{ marginBottom: 14, opacity: t.is_active ? 1 : 0.75 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <input style={{ ...inp, width: 56, textAlign: 'center' }} defaultValue={t.icon} onBlur={e => e.target.value !== t.icon && run(() => api.put(`/admin/sms-types/${t.id}`, { ...t, icon: e.target.value }))} />
            <input style={{ ...inp, flex: '1 1 200px', fontWeight: 800 }} defaultValue={t.name} onBlur={e => e.target.value.trim() && e.target.value !== t.name && run(() => api.put(`/admin/sms-types/${t.id}`, { ...t, name: e.target.value }))} />
            <button style={mini(th, t.is_active ? GREEN : '#64748b')} onClick={() => run(() => api.put(`/admin/sms-types/${t.id}`, { ...t, is_active: !t.is_active }))}>{t.is_active ? 'Visible' : 'Hidden'}</button>
            <button style={mini(th, ORANGE)} onClick={() => setEdit({ type_id: t.id, title: '', body_en: '', body_ku: '', body_ba: '', body_ar: '', code: null, reason_id: null, reason_path: '', sort_order: t.templates.length + 1 })}>＋ Add template</button>
            <button style={mini(th, RED)} onClick={() => window.confirm(`Delete the type “${t.name}” and all its templates?`) && run(() => api.delete(`/admin/sms-types/${t.id}`), 'Type deleted')}>✕</button>
          </div>
          {t.templates.filter(m => !m.is_archived).map(m => row(m))}
          {t.templates.some(m => m.is_archived) && (
            <div style={{ marginTop: 6 }}>
              <button style={mini(th, '#64748b')} onClick={() => setShowArch(a => ({ ...a, [t.id]: !a[t.id] }))}>🗄 Archived ({t.templates.filter(m => m.is_archived).length}) {showArch[t.id] ? '▴' : '▾'}</button>
              {showArch[t.id] && t.templates.filter(m => m.is_archived).map(m => row(m))}
            </div>
          )}
          {!t.templates.length && <div style={{ fontSize: 12.5, color: th.sub }}>No templates yet.</div>}
        </Panel>
      ))}
      <Panel th={th} title="＋ New SMS type" hint="For example: Billing, Service request, Complaint follow-up, General information.">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...inp, width: 64, textAlign: 'center' }} value={nt.icon} onChange={e => setNt({ ...nt, icon: e.target.value })} />
          <input style={{ ...inp, flex: '1 1 240px' }} placeholder="Type name" value={nt.name} onChange={e => setNt({ ...nt, name: e.target.value })} />
          <button disabled={!nt.name.trim()} style={btn(ORANGE, { opacity: nt.name.trim() ? 1 : 0.5 })} onClick={async () => { if (await run(() => api.post('/admin/sms-types', { ...nt, sort_order: types.length + 1 }), 'Type added')) setNt({ name: '', icon: '💬' }); }}>Add type</button>
        </div>
      </Panel>
    </div>
  );
}

/* ───────────────────────── External links (agent) ───────────────────────── */
// Links saved with the default puzzle icon get a fitting emoji from their name, and no two cards share one.
const ICON_RULES = [
  [/queue|metric|report|dashboard.*stat|stats/i, ['📊', '📈']],
  [/freshdesk|ticket|helpdesk/i, ['🎫', '🧾']],
  [/calculator|tariff|price|pricing/i, ['🧮', '💰']],
  [/maintenance|support|outage/i, ['🛠️', '🔧', '📞']],
  [/zone|map|location|coverage/i, ['🗺️', '📍']],
  [/kyc|identity|verify|verification/i, ['🪪', '🔐', '🛡️']],
  [/crm|customer|account/i, ['👥', '🗂️']],
  [/bill|payment|invoice/i, ['💳', '🧾']],
  [/website|web site|portal|site/i, ['🌐', '🧭']],
  [/mail|email|outlook/i, ['📧']],
  [/chat|whatsapp|message|sms/i, ['💬']],
  [/train|learn|course|academy/i, ['🎓']],
  [/schedule|roster|shift|calendar/i, ['🗓️']],
];
const FALLBACK_ICONS = ['🔗', '🧭', '📌', '⭐', '🚀', '📎', '🔔', '🧰', '🏷️', '🔎'];
export function pickIcons(tools) {
  const used = new Set(tools.filter(t => t.icon && t.icon !== '🧩').map(t => t.icon));
  return tools.map(t => {
    if (t.icon && t.icon !== '🧩') return t.icon;
    const rule = ICON_RULES.find(([re]) => re.test(t.name));
    const choice = (rule ? rule[1] : []).concat(FALLBACK_ICONS).find(e => !used.has(e)) || '🔗';
    used.add(choice);
    return choice;
  });
}

export function ExternalLinks({ darkMode }) {
  const th = useTheme(darkMode);
  const [tools, setTools] = useState(null);
  useEffect(() => { api.get('/external-tools').then(r => setTools(r.data || [])).catch(() => setTools([])); }, []);
  if (!tools) return <Empty th={th}>Loading…</Empty>;
  const icons = pickIcons(tools);
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ color: th.sub, fontSize: 13, marginBottom: 14 }}>Each button opens the system in a new browser tab. This website stays open.</div>
      {!tools.length ? <Empty th={th}>No links yet.</Empty> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          {tools.map((t, i) => (
            <button key={t.id} onClick={() => { track('link', t.name); openNew(t.url); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start' }}>
              <span style={{ fontSize: 28 }}>{icons[i]}</span>
              <span style={{ flex: 1, fontWeight: 800, color: th.text, fontSize: 15, overflowWrap: 'anywhere' }}>{t.name}</span>
              <span style={{ padding: '7px 16px', borderRadius: 10, background: ORANGE, color: '#fff', fontSize: 13, fontWeight: 800, boxShadow: `0 4px 12px ${ORANGE}44`, whiteSpace: 'nowrap' }}>Open ↗</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Updates channel ───────────────────────── */
const linkify = text => String(text).split(/(https?:\/\/[^\s]+)/g).map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', overflowWrap: 'anywhere' }}>{p}</a> : <React.Fragment key={i}>{p}</React.Fragment>));
const when = d => { const t = new Date(d); const same = t.toDateString() === new Date().toDateString(); return (same ? '' : t.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ') + t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
const dayLabel = d => { const t = new Date(d), n = new Date(); const y = new Date(n); y.setDate(n.getDate() - 1); return t.toDateString() === n.toDateString() ? 'Today' : t.toDateString() === y.toDateString() ? 'Yesterday' : t.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }); };


/* ───────────── Attachments: the QA team attaches an FAQ, call flow, file... to a message; agents tap the chip to jump there ───────────── */
const TYPE_NAME = { faq: 'FAQ', flow: 'Call flow', folder: 'Folder', file: 'File', sms: 'SMS template', tool: 'Link', page: 'Page' };
const attLabel = a => a.label || TYPE_NAME[a.type] || 'Item';

function AttachmentChips({ items, onOpen, onRemove, th }) {
  if (!items || !items.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {items.map((a, i) => (
        <span key={`${a.type}-${a.id}-${i}`} style={{ display: 'inline-flex', alignItems: 'stretch', maxWidth: '100%' }}>
          <button type="button" onClick={() => onOpen && onOpen(a)} disabled={!onOpen} title={onOpen ? 'Open it' : ''}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textAlign: 'start', padding: '8px 12px', borderRadius: onRemove ? '12px 0 0 12px' : 12, border: `1.5px solid ${ORANGE}88`, background: `${ORANGE}14`, color: th.text, cursor: onOpen ? 'pointer' : 'default', fontFamily: 'inherit', maxWidth: '100%', minWidth: 0 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon || '📎'}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 800, color: ORANGE }}>{TYPE_NAME[a.type] || 'Item'}{a.sub ? ` · ${a.sub}` : ''}</span>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, lineHeight: 1.4, overflowWrap: 'anywhere' }}>{attLabel(a)}</span>
            </span>
            {onOpen && <span style={{ color: ORANGE, fontWeight: 900, fontSize: 16, flexShrink: 0 }}>›</span>}
          </button>
          {onRemove && <button type="button" onClick={() => onRemove(i)} title="Remove" style={{ border: `1.5px solid ${ORANGE}88`, borderInlineStart: 'none', borderRadius: '0 12px 12px 0', background: `${ORANGE}14`, color: th.sub, cursor: 'pointer', padding: '0 10px', fontSize: 14, fontFamily: 'inherit' }}>✕</button>}
        </span>
      ))}
    </div>
  );
}

function AttachPicker({ faqs, th, picked, onPick, onClose }) {
  const [q, setQ] = useState('');
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    const g = (u) => api.get(u).then(r => r.data || []).catch(() => []);
    Promise.all([g('/callflows'), g('/folders?all=1'), g('/sms?all=1'), g('/external-tools')]).then(([flows, folders, sms, tools]) => { if (alive) setSrc({ flows, folders, sms, tools }); });
    return () => { alive = false; };
  }, []);
  const all = React.useMemo(() => {
    const out = [];
    (faqs || []).forEach(f => out.push({ key: `faq-${f.id}`, type: 'faq', id: f.id, icon: f.is_shortlisted ? '📌' : '❓', label: f.question_en || `FAQ ${f.id}`, sub: f.is_shortlisted ? "Shortlisted" : (f.category || ''), group: f.is_shortlisted ? "Shortlisted FAQ's" : 'FAQs', words: `${f.category || ''} ${f.subcategory || ''} ${f.third_level || ''} ${String(f.answer_en || '').slice(0, 200)}` }));
    if (src) {
      src.flows.forEach(x => out.push({ key: `flow-${x.id}`, type: 'flow', id: x.id, icon: x.icon || '📞', label: x.title, sub: '', group: 'Call flows', words: x.description || '' }));
      src.folders.forEach(f => {
        out.push({ key: `folder-${f.id}`, type: 'folder', id: f.id, icon: f.icon || '📁', label: f.name, sub: '', group: 'Folders', words: f.description || '' });
        (f.links || []).forEach(l => out.push({ key: `file-${l.id}`, type: 'file', id: l.id, folder_id: f.id, icon: l.has_file ? fileIcon(l.file_name) : '📄', label: l.title, sub: f.name, group: 'Files', words: `${f.name} ${l.description || ''}` }));
      });
      src.sms.forEach(t => (t.templates || []).filter(m => !m.is_archived).forEach(m => out.push({ key: `sms-${m.id}`, type: 'sms', id: m.id, icon: t.icon || '✉️', label: m.title, sub: t.name, group: 'Message types (SMS)', words: `${t.name} ${String(m.body_en || '').slice(0, 160)}` })));
      src.tools.forEach(t => out.push({ key: `tool-${t.id}`, type: 'tool', id: t.id, icon: t.icon || '🔗', label: t.name, sub: '', group: 'External links', words: '' }));
    }
    NAV_ITEMS.forEach(n => out.push({ key: `page-${n.key}`, type: 'page', id: n.key, icon: n.icon, label: n.label, sub: '', group: 'Pages', words: n.words }));
    return out;
  }, [faqs, src]);
  const results = q.trim() ? searchNav(all, q, 10) : [];
  const isPicked = r => picked.some(a => a.type === r.type && String(a.id) === String(r.id));
  const pick = r => { if (!isPicked(r)) onPick({ type: r.type, id: String(r.id), folder_id: r.folder_id != null ? String(r.folder_id) : undefined, label: r.label, icon: r.icon, sub: r.sub }); onClose(); };
  return (
    <div style={{ border: `1px solid ${th.border}`, background: th.soft, borderRadius: 14, padding: 10, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search a FAQ, call flow, folder, file, message type, link or page…" style={{ ...inputStyle(th), flex: 1 }} />
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: th.sub, cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>
      {!src && <div style={{ fontSize: 12, color: th.sub, marginTop: 6 }}>Loading items…</div>}
      {q.trim() && !results.length && <div style={{ fontSize: 13, color: th.sub, padding: '10px 4px' }}>Nothing found for “{q}”.</div>}
      {!q.trim() && <div style={{ fontSize: 12, color: th.sub, padding: '8px 4px 2px' }}>Type a few words. You can attach up to 6 items.</div>}
      {results.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
          {results.map(r => (
            <button type="button" key={r.key} onClick={() => pick(r)} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'start', padding: '8px 10px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.card, color: th.text, cursor: 'pointer', fontFamily: 'inherit', opacity: isPicked(r) ? 0.5 : 1 }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, overflowWrap: 'anywhere' }}>{r.label}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: th.sub }}>{r.group}{r.sub && r.group !== r.sub ? ` · ${r.sub}` : ''}</span>
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: ORANGE }}>{isPicked(r) ? 'Added' : 'Attach'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function UpdatesChannel({ darkMode, faqs, onOpenAttachment }) {
  const th = useTheme(darkMode);
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const first = useRef(true);
  const posted = useRef(0);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [atts, setAtts] = useState([]);
  const [editAtts, setEditAtts] = useState([]);
  const [picking, setPicking] = useState(false);
  const [seenFor, setSeenFor] = useState(null);
  const [seenData, setSeenData] = useState(null);
  const load = useCallback(() => api.get('/channel').then(r => { setD(r.data); const ms = r.data.messages; if (ms.length && ms[ms.length - 1].id > posted.current) { posted.current = ms[ms.length - 1].id; api.post('/channel/seen', { last_id: posted.current }).catch(() => {}); } if (ms.length) { try { localStorage.setItem('rk_chan_seen', String(ms[ms.length - 1].id)); window.dispatchEvent(new Event('rk-channel-seen')); } catch {} } }).catch(() => setD(x => x || { messages: [], emoji: [], canPost: false })), []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);
  useEffect(() => { if (d && endRef.current) endRef.current.scrollIntoView({ behavior: first.current ? 'auto' : 'smooth', block: 'end' }); if (d) first.current = false; }, [d && d.messages.length]); // eslint-disable-line
  const react = async (id, emoji) => { try { await api.post(`/channel/${id}/react`, { emoji }); load(); } catch { toast.error('Could not react'); } };
  const send = async () => { if ((!text.trim() && !atts.length) || busy) return; setBusy(true); try { await api.post('/channel', { body: text, attachments: atts }); setText(''); setAtts([]); setPicking(false); await load(); } catch (e) { toast.error(errMsg(e, 'Could not send')); } setBusy(false); };
  const del = async m => { if (!window.confirm('Delete this message for everyone?')) return; try { await api.delete(`/channel/${m.id}`); load(); } catch { toast.error('Could not delete'); } };
  const saveEdit = async () => { if (!editText.trim() && !editAtts.length) return; try { await api.put(`/channel/${editId}`, { body: editText, attachments: editAtts }); setEditId(null); load(); } catch (e) { toast.error(errMsg(e, 'Could not save')); } };
  const pin = async m => { try { const r = await api.post(`/channel/${m.id}/pin`); toast.success(r.data.pinned ? 'Pinned to the top' : 'Unpinned'); load(); } catch { toast.error('Could not pin'); } };
  const showSeen = async m => { if (seenFor === m.id) { setSeenFor(null); return; } setSeenFor(m.id); setSeenData(null); try { setSeenData((await api.get(`/channel/${m.id}/seen`)).data); } catch { setSeenData({ seen: [], unseen: [] }); } };
  const delAll = async () => { if (!window.confirm('Delete ALL your messages in this chat for everyone? This cannot be undone.')) return; try { const r = await api.delete('/channel'); toast.success(`${r.data.deleted} message${r.data.deleted === 1 ? '' : 's'} deleted`); load(); } catch { toast.error('Could not delete'); } };
  if (!d) return <Empty th={th}>Loading…</Empty>;
  let lastDay = '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 130px)', minHeight: 420, maxWidth: 860, margin: '0 auto' }}>
      {d.canPost && d.messages.length > 0 && <div style={{ textAlign: 'end', paddingBottom: 6 }}><button onClick={delAll} style={{ background: 'none', border: `1px solid ${th.border}`, borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: th.sub, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Delete all my messages</button></div>}
      {d.pinned && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#fff7ed', border: `1px solid ${ORANGE}66`, borderInlineStart: `5px solid ${ORANGE}`, borderRadius: 14, padding: '10px 12px', marginBottom: 10, color: '#0B1120' }}>
          <span style={{ fontSize: 18 }}>📌</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: ORANGE, marginBottom: 2 }}>Pinned by {d.pinned.author_name}</div>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.65, overflowWrap: 'anywhere', maxHeight: 110, overflowY: 'auto' }}>{linkify(d.pinned.body)}</div>
            <AttachmentChips items={d.pinned.attachments} onOpen={onOpenAttachment} th={th} />
          </div>
          {d.canPost && <button onClick={() => pin(d.pinned)} style={{ background: 'none', border: `1px solid ${ORANGE}`, color: ORANGE, borderRadius: 100, padding: '3px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Unpin</button>}
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 2px 12px' }}>
        {!d.messages.length && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8, padding: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg,#FF6B35,#ff9a6c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, boxShadow: '0 6px 0 #d9531f' }}>💬</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: th.text, marginTop: 10 }}>No updates yet</div>
            <div style={{ fontSize: 13.5, color: th.sub || '#64748b', maxWidth: 320 }}>New messages from the QA team will show up here, and you'll see a red badge when one arrives.</div>
          </div>
        )}
        {d.messages.map(m => {
          const dl = dayLabel(m.created_at); const showDay = dl !== lastDay; lastDay = dl;
          return (
            <React.Fragment key={m.id}>
              {showDay && <div style={{ textAlign: 'center', margin: '14px 0 8px' }}><span style={{ fontSize: 11.5, fontWeight: 800, color: th.sub, background: th.soft, border: `1px solid ${th.border}`, borderRadius: 100, padding: '3px 12px' }}>{dl}</span></div>}
              <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: '12px 14px', margin: '0 0 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 9, background: `linear-gradient(135deg,${ORANGE},#ff9a6c)`, color: '#fff', fontWeight: 900, fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{(m.author_name || '?')[0].toUpperCase()}</span>
                  <span style={{ fontWeight: 800, color: th.text, fontSize: 13.5 }}>{m.author_name}</span>
                  {m.author_title && <span style={{ fontSize: 11.5, color: th.sub }}>{m.author_title}</span>}
                  <span style={{ marginInlineStart: 'auto', fontSize: 11.5, color: th.sub }}>{when(m.created_at)}</span>
                  {d.canPost && <button onClick={() => pin(m)} title={m.pinned ? 'Unpin' : 'Pin to the top'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.pinned ? ORANGE : th.sub, fontSize: 14, opacity: m.pinned ? 1 : 0.7 }}>📌</button>}
                  {d.canPost && (m.mine || d.isLead) && <button onClick={() => { setEditId(m.id); setEditText(m.body); setEditAtts(m.attachments || []); }} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.sub, fontSize: 14 }}>✏️</button>}
                  {d.canPost && <button onClick={() => del(m)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.sub, fontSize: 14 }}>🗑</button>}
                </div>
                {editId === m.id ? (
                  <div>
                    <textarea rows={4} value={editText} onChange={e => setEditText(e.target.value)} style={{ ...inputStyle(th), width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6 }} />
                    <AttachmentChips items={editAtts} onRemove={i => setEditAtts(a => a.filter((_, j) => j !== i))} th={th} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button onClick={saveEdit} disabled={!editText.trim() && !editAtts.length} style={btn(ORANGE, { padding: '6px 14px', fontSize: 12.5 })}>Save</button>
                      <button onClick={() => setEditId(null)} style={btn('#64748b', { padding: '6px 14px', fontSize: 12.5 })}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {(m.body || m.edited_at) && <div style={{ whiteSpace: 'pre-wrap', color: th.text, fontSize: 14.5, lineHeight: 1.75, overflowWrap: 'anywhere' }}>{linkify(m.body)}{m.edited_at && <span style={{ fontSize: 11.5, color: th.sub, marginInlineStart: 6 }}>(edited)</span>}</div>}
                    <AttachmentChips items={m.attachments} onOpen={onOpenAttachment} th={th} />
                  </>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {d.emoji.map(e => { const r = m.reactions.find(x => x.emoji === e); return (
                    <button key={e} onClick={() => react(m.id, e)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, border: `1px solid ${r && r.mine ? ORANGE : th.border}`, background: r && r.mine ? `${ORANGE}1f` : 'transparent', color: th.text, opacity: r ? 1 : 0.55 }}>
                      <span>{e}</span>{r && <b style={{ fontSize: 12 }}>{r.count}</b>}
                    </button>); })}
                </div>
                {d.canPost && typeof m.seen === 'number' && (
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => showSeen(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: m.seen >= d.agents && d.agents ? GREEN : th.sub }}>
                      👁 Seen by {m.seen} of {d.agents} agents {seenFor === m.id ? '▴' : '▾'}
                    </button>
                    {seenFor === m.id && (
                      <div style={{ marginTop: 6, background: th.soft, border: `1px solid ${th.border}`, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, color: th.text, maxHeight: 180, overflowY: 'auto' }}>
                        {!seenData ? 'Loading…' : (
                          <>
                            <div style={{ fontWeight: 800, color: RED, marginBottom: 3 }}>Not seen yet ({seenData.unseen.length})</div>
                            <div style={{ lineHeight: 1.7 }}>{seenData.unseen.length ? seenData.unseen.map(a => a.name).join(', ') : 'Everyone has seen it 🎉'}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={endRef} />
      </div>
      {d.canPost ? (
        <div style={{ paddingTop: 8, borderTop: `1px solid ${th.border}` }}>
        {picking && <AttachPicker faqs={faqs} th={th} picked={atts} onPick={a => setAtts(x => (x.length >= 6 ? x : [...x, a]))} onClose={() => setPicking(false)} />}
        <AttachmentChips items={atts} onRemove={i => setAtts(a => a.filter((_, j) => j !== i))} th={th} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: atts.length ? 8 : 0 }}>
          <button type="button" onClick={() => setPicking(v => !v)} disabled={atts.length >= 6} title="Attach an FAQ, call flow, folder, file..." style={{ ...btn(picking ? '#64748b' : '#fff', { padding: '12px 14px' }), color: picking ? '#fff' : ORANGE, border: `1.5px solid ${ORANGE}` }}>📎 Attach</button>
          <textarea rows={2} placeholder={`Write an update for all agents, ${user?.name?.split(' ')[0] || ''}…`} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }} style={{ ...inputStyle(th), flex: 1, resize: 'vertical', lineHeight: 1.6 }} />
          <button onClick={send} disabled={(!text.trim() && !atts.length) || busy} style={btn(ORANGE, { opacity: (text.trim() || atts.length) && !busy ? 1 : 0.5, padding: '12px 20px' })}>Send</button>
        </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 12.5, color: th.sub, paddingTop: 10, borderTop: `1px solid ${th.border}` }}>Only the QA team can post here. Tap an emoji to react, so we know you have seen the update.</div>
      )}
    </div>
  );
}

/* ───────────────────────── Floating "new update" bubble ───────────────────────── */
// Like a chat app: a round button in the corner with the number of unread updates.
// When a new message arrives a small preview pops up. Tapping either opens the Updates channel.
export function UpdatesBubble({ onOpen, hidden }) {
  const [n, setN] = useState(0);
  const [preview, setPreview] = useState(null);
  const lastPreviewed = useRef(null);
  const timer = useRef(null);
  const check = useCallback(async () => {
    let seen = '0'; try { seen = localStorage.getItem('rk_chan_seen') || '0'; } catch {}
    try {
      const u = (await api.get(`/channel/unread?after=${seen}`)).data;
      setN(u.n || 0);
      if (u.n > 0 && String(u.last) !== lastPreviewed.current) {
        lastPreviewed.current = String(u.last);
        const m = (await api.get('/channel')).data.messages;
        const latest = m[m.length - 1];
        if (latest) { setPreview({ id: latest.id, name: latest.author_name, text: latest.body || ((latest.attachments || [])[0] ? `📎 ${latest.attachments[0].label}` : '') }); clearTimeout(timer.current); timer.current = setTimeout(() => setPreview(null), 14000); }
      }
    } catch {}
  }, []);
  useEffect(() => {
    check();
    const t = setInterval(check, 30000);
    const onSeen = () => { setN(0); setPreview(null); };
    window.addEventListener('rk-channel-seen', onSeen);
    return () => { clearInterval(t); clearTimeout(timer.current); window.removeEventListener('rk-channel-seen', onSeen); };
  }, [check]);
  if (hidden) return null;
  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 900, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, pointerEvents: 'none', maxWidth: 'calc(100vw - 36px)' }}>
      <style>{`@keyframes rkBubbleIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}@keyframes rkRing{0%{box-shadow:0 0 0 0 rgba(255,107,53,.55)}70%{box-shadow:0 0 0 16px rgba(255,107,53,0)}100%{box-shadow:0 0 0 0 rgba(255,107,53,0)}}`}</style>
      {preview && n > 0 && (
        <div onClick={onOpen} style={{ pointerEvents: 'auto', cursor: 'pointer', width: 300, maxWidth: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '12px 14px', boxShadow: '0 14px 40px rgba(15,23,42,.22)', animation: 'rkBubbleIn .28s ease', position: 'relative' }}>
          <button onClick={e => { e.stopPropagation(); setPreview(null); }} aria-label="Close" style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 15 }}>✕</button>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: ORANGE, marginBottom: 3 }}>💬 New message from {preview.name}</div>
          <div style={{ fontSize: 13.5, color: '#0B1120', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>{preview.text}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE, marginTop: 6 }}>Tap to read</div>
        </div>
      )}
      <button onClick={onOpen} aria-label="Open updates" style={{ pointerEvents: 'auto', position: 'relative', width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 26, color: '#fff', background: 'linear-gradient(135deg,#FF6B35,#ff9a6c)', boxShadow: '0 10px 28px rgba(255,107,53,.5)', animation: n ? 'rkRing 2s infinite' : 'none' }}>
        💬
        {n > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 24, height: 24, padding: '0 6px', borderRadius: 12, background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>{n > 99 ? '99+' : n}</span>}
      </button>
    </div>
  );
}
