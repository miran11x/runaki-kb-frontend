import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useTheme, Panel, Empty, Pill, ORANGE, GREEN, RED, AMBER } from './qaUi';

// Undo mistaken shortlist changes. Shortlisted FAQs are the translated ones, so this lists
//  1. shortlisted FAQs with no translation (probably added by mistake)  -> move back to the general FAQs
//  2. general FAQs that are fully translated (probably removed by mistake) -> add back to the shortlist
// Nothing changes until you confirm each one.
const when = d => { try { return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

function Row({ th, f, label, color, onDo }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${th.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: th.text }}>{f.question_en}</div>
        <div style={{ fontSize: 11.5, color: th.sub, marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span>#{f.id} · {[f.category, f.subcategory].filter(Boolean).join(' › ')}</span>
          <Pill color={f.ku ? GREEN : '#94a3b8'}>Sorani</Pill><Pill color={f.ba ? GREEN : '#94a3b8'}>Badini</Pill><Pill color={f.ar ? GREEN : '#94a3b8'}>Arabic</Pill>
        </div>
      </div>
      <button onClick={() => onDo(f)} style={{ border: 'none', background: color, color: '#fff', borderRadius: 10, padding: '7px 14px', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>{label}</button>
    </div>
  );
}

export default function ShortlistCheck({ darkMode }) {
  const th = useTheme(darkMode);
  const [d, setD] = useState(null);
  const [q, setQ] = useState('');
  const load = useCallback(() => api.get('/admin/shortlist-check').then(r => setD(r.data)).catch(() => { toast.error('Could not load'); setD({ wrong: [], missing: [], totals: {}, recent: [] }); }), []);
  useEffect(() => { load(); }, [load]);
  const set = async (f, value) => {
    const msg = value ? `Add this FAQ back to the Shortlisted FAQ's?\n\n“${f.question_en}”` : `Move this FAQ back to the general FAQs?\n\n“${f.question_en}”`;
    if (!window.confirm(msg)) return;
    try { await api.patch(`/faqs/${f.id}/shortlist`, { value }); toast.success(value ? 'Added to Shortlisted FAQ\'s' : 'Moved to general FAQs'); load(); } catch { toast.error('Could not change it'); }
  };
  if (!d) return <Empty th={th}>Loading…</Empty>;
  const miss = d.missing.filter(f => !q.trim() || f.question_en.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div style={{ maxWidth: 940 }}>
      <div style={{ color: th.sub, fontSize: 13, marginBottom: 12 }}>
        Shortlisted FAQs: <strong style={{ color: th.text }}>{d.totals.shortlisted}</strong> of {d.totals.all}. Shortlisted FAQs are the translated ones, so this page shows what looks wrong. Nothing changes until you confirm.
      </div>
      <Panel th={th} title="⚠️ Shortlisted but not translated" hint="Probably added by mistake. Move them back to the general FAQs.">
        {!d.wrong.length ? <Empty th={th}>None. Every shortlisted FAQ has a translation.</Empty> : d.wrong.map(f => <Row key={f.id} th={th} f={f} label="Move back to general" color={RED} onDo={x => set(x, false)} />)}
      </Panel>
      <Panel th={th} title="🔎 Translated but not shortlisted" hint="Probably removed by mistake. Add back the one you want." style={{ marginTop: 14 }}
        right={<input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ padding: '6px 10px', borderRadius: 9, border: `1px solid ${th.border}`, background: th.input || th.soft, color: th.text, fontSize: 13, fontFamily: 'inherit' }} />}>
        {!miss.length ? <Empty th={th}>{d.missing.length ? 'No match.' : 'None. Every fully translated FAQ is shortlisted.'}</Empty> : miss.slice(0, 60).map(f => <Row key={f.id} th={th} f={f} label="Add to shortlist" color={GREEN} onDo={x => set(x, true)} />)}
        {miss.length > 60 && <div style={{ fontSize: 12, color: th.sub, paddingTop: 8 }}>Showing 60 of {miss.length}. Use the search box.</div>}
      </Panel>
      <Panel th={th} title="🕘 Recent shortlist changes" hint="From now on every add and remove is recorded here (earlier ones were not recorded)." style={{ marginTop: 14 }}>
        {!d.recent.length ? <Empty th={th}>No changes recorded yet.</Empty> : d.recent.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: `1px solid ${th.border}`, fontSize: 13, color: th.text }}>
            <span style={{ color: r.action === 'SHORTLIST_ADD' ? GREEN : AMBER, fontWeight: 800, width: 70 }}>{r.action === 'SHORTLIST_ADD' ? 'Added' : 'Removed'}</span>
            <span style={{ flex: 1 }}>{r.details}</span><span style={{ color: th.sub }}>{r.name} · {when(r.created_at)}</span>
          </div>))}
      </Panel>
    </div>
  );
}
