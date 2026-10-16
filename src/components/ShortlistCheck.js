import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useTheme, Panel, Empty, Pill, ORANGE, GREEN, RED, AMBER, BLUE } from './qaUi';
import RichAnswer from './RichAnswer';

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


// Upload the master Word document ("FAQ1: Question?" headings). Nothing changes until you confirm.
function SyncFromDoc({ th, onApplied }) {
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState(null);
  const [name, setName] = useState('');
  const [pick, setPick] = useState({});     // per document FAQ: { ok, shortlist, answer, create, category, open }
  const [off, setOff] = useState({});       // shortlisted FAQs not in the document: id -> true = move back to general
  const inp = { padding: '6px 10px', borderRadius: 9, border: `1px solid ${th.border}`, background: th.input || th.soft, color: th.text, fontSize: 13, fontFamily: 'inherit' };

  const onFile = async e => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (!/\.docx$/i.test(f.name)) { toast.error('Please choose a Word file (.docx)'); return; }
    setBusy(true); setName(f.name);
    try {
      const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(f); });
      const r = await api.post('/admin/shortlist-sync/preview', { file: b64 });
      setD(r.data);
      const p = {};
      r.data.items.forEach(it => {
        const m = it.match; const exact = m && m.kind === 'exact';
        p[it.no] = { ok: !!exact, shortlist: !!(m && !m.is_shortlisted), answer: !!(exact && it.answerStatus === 'different'), create: !m, category: 'Inquiries', open: false };
      });
      setPick(p);
      setOff(Object.fromEntries(r.data.notInDoc.map(x => [x.id, !x.translated])));
    } catch (er) { toast.error(er?.response?.data?.error || 'Could not read the file'); setD(null); }
    setBusy(false);
  };
  const set = (no, patch) => setPick(p => ({ ...p, [no]: { ...p[no], ...patch } }));

  const plan = () => {
    const shortlist = [], answers = [], create = [], unshortlist = Object.keys(off).filter(k => off[k]).map(Number);
    d.items.forEach(it => {
      const c = pick[it.no]; if (!c) return;
      if (it.match) { if (!c.ok) return; if (c.shortlist && !it.match.is_shortlisted) shortlist.push(it.match.id); if (c.answer && it.answerStatus === 'different') answers.push({ id: it.match.id, answer: it.answer }); }
      else if (c.create) create.push({ question: it.question, answer: it.answer, category: c.category });
    });
    return { shortlist, answers, create, unshortlist };
  };
  const apply = async () => {
    const pl = plan();
    const n = pl.shortlist.length + pl.answers.length + pl.create.length + pl.unshortlist.length;
    if (!n) { toast('Nothing selected'); return; }
    const lines = [
      pl.shortlist.length ? `• Add ${pl.shortlist.length} FAQ(s) to the Shortlisted FAQ's` : '',
      pl.answers.length ? `• Replace the English answer of ${pl.answers.length} FAQ(s) (the old answer is saved)` : '',
      pl.create.length ? `• Create ${pl.create.length} new shortlisted FAQ(s)` : '',
      pl.unshortlist.length ? `• Move ${pl.unshortlist.length} FAQ(s) back to the general FAQs` : '',
    ].filter(Boolean).join('\n');
    if (!window.confirm(`Apply these changes?\n\n${lines}\n\nAgents will see them straight away.`)) return;
    setBusy(true);
    try { const r = await api.post('/admin/shortlist-sync/apply', pl); toast.success(`Done: ${r.data.shortlisted} added, ${r.data.answersUpdated} answers updated, ${r.data.created} created, ${r.data.unshortlisted} moved back`); setD(null); onApplied(); }
    catch (er) { toast.error(er?.response?.data?.error || 'Could not apply the changes'); }
    setBusy(false);
  };

  const counts = d ? plan() : null;
  return (
    <Panel th={th} title="📄 Update from the Word document" hint="Upload the master document of shortlisted FAQs. You will see exactly what would change, and nothing happens until you press Apply.">
      <label style={{ display: 'inline-block', background: ORANGE, color: '#fff', borderRadius: 10, padding: '9px 16px', fontWeight: 800, fontSize: 13, cursor: busy ? 'wait' : 'pointer' }}>
        {busy ? 'Reading…' : d ? '↻ Choose another file' : '⬆ Choose the .docx file'}
        <input type="file" accept=".docx" onChange={onFile} disabled={busy} style={{ display: 'none' }} />
      </label>
      {name && <span style={{ marginInlineStart: 10, fontSize: 12.5, color: th.sub }}>{name}</span>}
      {d && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, color: th.text, marginBottom: 10 }}>
            The document has <strong>{d.totals.inDoc}</strong> FAQs. The site has <strong>{d.totals.shortlistedNow}</strong> shortlisted now.
            Found on the site: <strong>{d.items.filter(i => i.match).length}</strong>. Not found: <strong>{d.items.filter(i => !i.match).length}</strong>.
          </div>
          {d.items.map(it => {
            const c = pick[it.no] || {}; const m = it.match;
            return (
              <div key={it.no} style={{ border: `1px solid ${th.border}`, borderRadius: 12, padding: '10px 12px', marginBottom: 8, background: th.card }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Pill color={BLUE}>FAQ{it.no}</Pill>
                  <div style={{ flex: 1, minWidth: 220, fontWeight: 700, fontSize: 13.5, color: th.text }}>{it.question}</div>
                  {m ? (m.kind === 'exact' ? <Pill color={GREEN}>Found #{m.id}</Pill> : <Pill color={AMBER}>Close match {m.score}%</Pill>) : <Pill color={RED}>Not on the site</Pill>}
                  {m && (m.is_shortlisted ? <Pill color={GREEN}>Shortlisted</Pill> : <Pill color="#94a3b8">Not shortlisted</Pill>)}
                  {it.answerStatus && <Pill color={it.answerStatus === 'same' ? GREEN : AMBER}>{it.answerStatus === 'same' ? 'Answer is the same' : 'Answer is different'}</Pill>}
                </div>
                {m && m.kind === 'close' && (
                  <div style={{ marginTop: 8, fontSize: 12.5, color: th.text, background: `${AMBER}18`, borderRadius: 8, padding: '6px 10px' }}>
                    Site question: <strong>“{m.question_en}”</strong><br />
                    <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={!!c.ok} onChange={e => set(it.no, { ok: e.target.checked, shortlist: e.target.checked && !m.is_shortlisted, answer: e.target.checked && it.answerStatus === 'different' })} /> Yes, this is the same FAQ</label>
                  </div>
                )}
                {m && c.ok && (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8, fontSize: 12.5, color: th.text }}>
                    {!m.is_shortlisted && <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={!!c.shortlist} onChange={e => set(it.no, { shortlist: e.target.checked })} /> Add to Shortlisted FAQ's</label>}
                    {it.answerStatus === 'different' && <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={!!c.answer} onChange={e => set(it.no, { answer: e.target.checked })} /> Replace the English answer{m.translated ? ' (translations stay as they are, please review them)' : ''}</label>}
                    {it.answerStatus === 'different' && <button onClick={() => set(it.no, { open: !c.open })} style={{ background: 'none', border: 'none', color: ORANGE, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, padding: 0 }}>{c.open ? 'Hide' : 'Compare'} answers</button>}
                  </div>
                )}
                {!m && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8, fontSize: 12.5, color: th.text, alignItems: 'center' }}>
                    <label style={{ cursor: 'pointer' }}><input type="checkbox" checked={!!c.create} onChange={e => set(it.no, { create: e.target.checked })} /> Create it as a new shortlisted FAQ</label>
                    {c.create && <select value={c.category} onChange={e => set(it.no, { category: e.target.value })} style={inp}>{d.categories.map(x => <option key={x}>{x}</option>)}</select>}
                  </div>
                )}
                {c.open && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10, marginTop: 10 }}>
                    <div style={{ background: th.soft, borderRadius: 10, padding: 10, maxHeight: 320, overflow: 'auto', fontSize: 12.5, color: th.text }}><div style={{ fontWeight: 800, color: th.sub, marginBottom: 4 }}>On the site now</div><RichAnswer text={it.currentAnswer} /></div>
                    <div style={{ background: `${GREEN}12`, borderRadius: 10, padding: 10, maxHeight: 320, overflow: 'auto', fontSize: 12.5, color: th.text }}><div style={{ fontWeight: 800, color: GREEN, marginBottom: 4 }}>In the document</div><RichAnswer text={it.answer} /></div>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ marginTop: 14, fontWeight: 800, fontSize: 13.5, color: th.text }}>Shortlisted on the site but not in the document ({d.notInDoc.length})</div>
          {!d.notInDoc.length ? <Empty th={th}>None.</Empty> : d.notInDoc.map(x => (
            <label key={x.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderTop: `1px solid ${th.border}`, cursor: 'pointer', fontSize: 13, color: th.text }}>
              <input type="checkbox" checked={!!off[x.id]} onChange={e => setOff(o => ({ ...o, [x.id]: e.target.checked }))} />
              <span style={{ flex: 1 }}>{x.question_en} <span style={{ color: th.sub, fontSize: 11.5 }}>#{x.id}</span></span>
              <Pill color={x.translated ? GREEN : RED}>{x.translated ? 'Translated' : 'No translation'}</Pill>
              <span style={{ fontSize: 12, color: th.sub }}>{off[x.id] ? 'will move back to general' : 'stays shortlisted'}</span>
            </label>
          ))}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            <button onClick={apply} disabled={busy} style={{ border: 'none', background: GREEN, color: '#fff', borderRadius: 12, padding: '11px 22px', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Apply selected changes</button>
            <span style={{ fontSize: 12.5, color: th.sub }}>{counts.shortlist.length} to shortlist · {counts.answers.length} answers to replace · {counts.create.length} to create · {counts.unshortlist.length} to move back</span>
          </div>
        </div>
      )}
    </Panel>
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
      <SyncFromDoc th={th} onApplied={load} />
      <div style={{ height: 14 }} />
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
