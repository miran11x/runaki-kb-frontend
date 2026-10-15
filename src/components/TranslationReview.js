import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useTheme, Panel, Empty, ORANGE, GREEN } from './qaUi';

// Admin: download the live FAQs as a Kurdish review sheet, and load the reviewer's corrections back in.
const CATEGORIES = ['Inquiries', 'Billing Complaints', 'General Complaints', 'Service Requests', 'Feedback & Others', 'New Updates'];
const LANGS = { ku: 'Sorani', ba: 'Badini' };
const cut = (s, n = 90) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

export default function TranslationReview({ darkMode }) {
  const th = useTheme(darkMode);
  const [cat, setCat] = useState('');
  const [gaps, setGaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prev, setPrev] = useState(null);
  const [picked, setPicked] = useState({});
  const fileRef = useRef(null);

  const download = async () => {
    setBusy(true);
    try {
      const r = await api.get('/admin/translation-review', { params: { category: cat || undefined, gaps: gaps ? 1 : undefined }, responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a'); a.href = url; a.download = `Runaki_FAQ_Kurdish_Review_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast.success('Review sheet downloaded');
    } catch { toast.error('Could not build the sheet'); }
    setBusy(false);
  };

  const readFile = async f => {
    if (!f) return;
    setBusy(true);
    try {
      const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets.Review;
      if (!ws) throw new Error('This file has no “Review” tab. Use the sheet downloaded from here.');
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const changes = [];
      rows.slice(1).forEach(r => {
        const id = parseInt(r[0], 10); const part = String(r[2]).toLowerCase();
        if (!id || !['question', 'answer'].includes(part)) return;
        if (String(r[6]).trim()) changes.push({ faq_id: id, part, lang: 'ku', text: String(r[6]) });
        if (String(r[9]).trim()) changes.push({ faq_id: id, part, lang: 'ba', text: String(r[9]) });
      });
      if (!changes.length) { toast('No corrected texts found in the file'); setPrev({ changes: [], skipped: 0 }); setBusy(false); return; }
      const r = await api.post('/admin/translation-review/apply', { dry: true, changes });
      setPrev(r.data); setPicked(Object.fromEntries(r.data.changes.map((c, i) => [i, true])));
    } catch (e) { toast.error(e.response?.data?.error || e.message || 'Could not read the file'); }
    setBusy(false); if (fileRef.current) fileRef.current.value = '';
  };

  const apply = async () => {
    const list = prev.changes.filter((_, i) => picked[i]);
    if (!list.length) return;
    setBusy(true);
    try {
      const r = await api.post('/admin/translation-review/apply', { changes: list });
      toast.success(`Saved ${r.data.applied} corrected texts`); setPrev(null);
    } catch (e) { toast.error(e.response?.data?.error || 'Could not save'); }
    setBusy(false);
  };
  const sel = { padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 14, fontFamily: 'inherit' };
  const btn = (solid, color = ORANGE) => ({ border: `1px solid ${color}`, background: solid ? color : 'transparent', color: solid ? '#fff' : color, borderRadius: 10, padding: '9px 16px', fontWeight: 800, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'inherit', fontSize: 13.5 });

  return (
    <div style={{ maxWidth: 900, display: 'grid', gap: 14 }}>
      <Panel th={th} title="🌍 1. Download the review sheet" hint="Every live FAQ question and answer, with the English beside the Sorani and Badini wording, ready for a native speaker to check.">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={cat} onChange={e => setCat(e.target.value)} style={sel} aria-label="Category">
            <option value="">All categories</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <label style={{ fontSize: 13.5, color: th.text, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="checkbox" checked={gaps} onChange={e => setGaps(e.target.checked)} /> Only FAQs missing a Kurdish text
          </label>
          <button onClick={download} disabled={busy} style={{ ...btn(true), marginInlineStart: 'auto' }}>⬇️ Download .xlsx</button>
        </div>
      </Panel>

      <Panel th={th} title="📥 2. Load the corrections" hint="Upload the sheet your reviewer sent back. You see every change first and choose what to save. Only the “corrected text” cells are used.">
        <input ref={fileRef} type="file" accept=".xlsx" onChange={e => readFile(e.target.files[0])} disabled={busy} style={{ fontSize: 13, color: th.text }} />
        {prev && (prev.changes.length === 0
          ? <Empty th={th}>Nothing to change{prev.skipped ? ` (${prev.skipped} texts already match)` : ''}.</Empty>
          : (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <b style={{ color: th.text, fontSize: 14 }}>{prev.changes.filter((_, i) => picked[i]).length} of {prev.changes.length} changes selected</b>
                <button style={btn(false, '#64748b')} onClick={() => setPicked(Object.fromEntries(prev.changes.map((_, i) => [i, !prev.changes.every((__, k) => picked[k])])))}>Select / clear all</button>
                <button style={{ ...btn(true, GREEN), marginInlineStart: 'auto' }} onClick={apply} disabled={busy}>Save selected</button>
              </div>
              <div style={{ maxHeight: 420, overflow: 'auto', border: `1px solid ${th.border}`, borderRadius: 12 }}>
                {prev.changes.map((c, i) => (
                  <label key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderTop: i ? `1px solid ${th.border}` : 'none', cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={!!picked[i]} onChange={e => setPicked({ ...picked, [i]: e.target.checked })} style={{ marginTop: 3 }} />
                    <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                      <div style={{ fontWeight: 800, color: th.text }}>FAQ #{c.faq_id} · {c.part} · {LANGS[c.lang]}</div>
                      {c.old ? <div dir="auto" style={{ color: th.sub, textDecoration: 'line-through' }}>{cut(c.old)}</div> : <div style={{ color: ORANGE }}>was empty</div>}
                      <div dir="auto" style={{ color: th.text }}>{cut(c.text, 200)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
      </Panel>
    </div>
  );
}
