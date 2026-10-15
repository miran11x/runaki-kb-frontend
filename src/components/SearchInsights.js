import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { buildIndex, searchFaqs, SYNONYM_GROUPS } from '../utils/faqSearch';
import { useTheme, Panel, Kpi, Empty, Pill, GREEN, RED, AMBER, BLUE, ORANGE } from './qaUi';

// Admin: turn what agents search for into fixes.
//  1. Missed searches  : phrases that found nothing -> add as a key term to an FAQ, create a draft FAQ, or ignore
//  2. Answer quality   : 👍/👎 and answers copied from below the first result -> fix the ranking
//  3. Synonyms         : words that mean the same thing (maqtu3 = disconnected), managed here instead of in code
const CATEGORIES = ['Inquiries', 'Billing Complaints', 'General Complaints', 'Service Requests', 'Feedback & Others', 'New Updates'];
const VIOLET = '#8b5cf6';
const when = d => { try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); } catch { return ''; } };
const errMsg = e => e?.response?.data?.error || 'Something went wrong';

function Btn({ th, color = ORANGE, solid, children, ...p }) {
  return (
    <button {...p} style={{ border: `1px solid ${color}`, background: solid ? color : 'transparent', color: solid ? '#fff' : color, borderRadius: 10, padding: '6px 12px', fontSize: 12.5, fontWeight: 800, cursor: p.disabled ? 'default' : 'pointer', opacity: p.disabled ? 0.5 : 1, fontFamily: 'inherit', ...p.style }}>
      {children}
    </button>
  );
}

// Pick the FAQ a phrase should find. Suggests likely FAQs, and lets the editor search for any other.
function FaqPicker({ th, phrase, faqs, index, onPick, onCreate, onClose }) {
  const [term, setTerm] = useState(phrase);
  const [q, setQ] = useState('');
  const suggestions = useMemo(() => searchFaqs(index, q.trim() || phrase, { limit: 6, minScore: 0 }).map(r => r.faq), [index, q, phrase]);
  const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 11px', borderRadius: 9, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' };
  return (
    <div style={{ marginTop: 10, background: th.soft, border: `1px solid ${ORANGE}66`, borderRadius: 14, padding: 14 }}>
      <label style={{ fontSize: 12, color: th.sub, fontWeight: 700 }}>Key term to add (agents who type this will find the FAQ)</label>
      <input style={{ ...inp, margin: '4px 0 10px' }} value={term} onChange={e => setTerm(e.target.value)} />
      <label style={{ fontSize: 12, color: th.sub, fontWeight: 700 }}>Which FAQ should it find?</label>
      <input style={{ ...inp, margin: '4px 0 8px' }} placeholder="Search another FAQ…" value={q} onChange={e => setQ(e.target.value)} />
      {suggestions.length === 0 ? <Empty th={th}>No FAQ looks close. Create a new one.</Empty> : suggestions.map(f => (
        <div key={f.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderTop: `1px solid ${th.border}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: th.text }}>{f.question_en}</div>
            <div style={{ fontSize: 11.5, color: th.sub }}>{[f.category, f.subcategory].filter(Boolean).join(' › ')}</div>
          </div>
          <Btn th={th} color={GREEN} solid disabled={!term.trim()} onClick={() => onPick(f, term.trim())}>Add key term</Btn>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {onCreate && <Btn th={th} color={VIOLET} onClick={onCreate}>None of these: create a new FAQ</Btn>}
        <Btn th={th} color="#64748b" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

function NewFaq({ th, phrase, onSave, onClose }) {
  const [f, setF] = useState({ question_en: phrase.charAt(0).toUpperCase() + phrase.slice(1), answer_en: '', category: CATEGORIES[0] });
  const [busy, setBusy] = useState(false);
  const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 11px', borderRadius: 9, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit', margin: '4px 0 10px' };
  return (
    <div style={{ marginTop: 10, background: th.soft, border: `1px solid ${VIOLET}66`, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: th.text, marginBottom: 8 }}>New FAQ (saved as a draft, finish it in the FAQ editor)</div>
      <label style={{ fontSize: 12, color: th.sub, fontWeight: 700 }}>Question</label>
      <input style={inp} value={f.question_en} onChange={e => setF({ ...f, question_en: e.target.value })} />
      <label style={{ fontSize: 12, color: th.sub, fontWeight: 700 }}>Category</label>
      <select style={inp} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
      <label style={{ fontSize: 12, color: th.sub, fontWeight: 700 }}>Answer (English)</label>
      <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} value={f.answer_en} onChange={e => setF({ ...f, answer_en: e.target.value })} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn th={th} color={VIOLET} solid disabled={busy || !f.question_en.trim() || !f.answer_en.trim()} onClick={async () => { setBusy(true); await onSave(f); setBusy(false); }}>Save draft</Btn>
        <Btn th={th} color="#64748b" onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

function Misses({ th, days, faqs, index }) {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null); // {norm, mode:'pick'|'new'}
  const load = useCallback(() => api.get('/admin/search/misses', { params: { days } }).then(r => setRows(r.data.rows)).catch(e => { setRows([]); toast.error(errMsg(e)); }), [days]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const addTerm = async (row, faq, term) => {
    try { await api.post('/admin/search/add-key-term', { faq_id: faq.id, term, query: row.example }); toast.success(`Added “${term}” to the FAQ`); setOpen(null); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const create = async (row, f) => {
    try {
      await api.post('/faqs', { ...f, tags: row.example, is_published: false });
      await api.post('/admin/search/misses/ignore', { query: row.example, reason: 'draft created' });
      toast.success('Draft FAQ created. Finish and publish it in the FAQ editor.'); setOpen(null); load();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const ignore = async row => { try { await api.post('/admin/search/misses/ignore', { query: row.example }); load(); } catch (e) { toast.error(errMsg(e)); } };

  if (!rows) return <Empty th={th}>Loading…</Empty>;
  return (
    <Panel th={th} title="What agents searched and didn't find" hint="Most often first. Add the phrase as a key term to the FAQ that should answer it, or create a new draft FAQ.">
      {rows.length === 0 ? <Empty th={th}>🎉 Nothing missing in this period. Every search found an answer.</Empty> : rows.map(r => (
        <div key={r.norm} style={{ padding: '11px 0', borderTop: `1px solid ${th.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: th.text }}>“{r.example}”</div>
              <div style={{ fontSize: 12, color: th.sub, marginTop: 2 }}>last searched {when(r.last_seen)}</div>
            </div>
            <Pill color={r.n >= 5 ? RED : r.n >= 2 ? AMBER : BLUE}>{r.n}× searched</Pill>
            <Pill color={VIOLET}>{r.agents} agent{r.agents === 1 ? '' : 's'}</Pill>
            <Btn th={th} color={GREEN} solid onClick={() => setOpen({ norm: r.norm, mode: 'pick' })}>Fix</Btn>
            <Btn th={th} color="#64748b" onClick={() => ignore(r)}>Ignore</Btn>
          </div>
          {open && open.norm === r.norm && open.mode === 'pick' && (
            <FaqPicker th={th} phrase={r.example} faqs={faqs} index={index} onPick={(f, term) => addTerm(r, f, term)} onCreate={() => setOpen({ norm: r.norm, mode: 'new' })} onClose={() => setOpen(null)} />
          )}
          {open && open.norm === r.norm && open.mode === 'new' && <NewFaq th={th} phrase={r.example} onSave={f => create(r, f)} onClose={() => setOpen(null)} />}
        </div>
      ))}
    </Panel>
  );
}

function Quality({ th, days, faqs, index }) {
  const [d, setD] = useState(null);
  const [open, setOpen] = useState(null);
  const load = useCallback(() => api.get('/admin/search/quality', { params: { days } }).then(r => setD(r.data)).catch(e => { setD(false); toast.error(errMsg(e)); }), [days]);
  useEffect(() => { setD(null); load(); }, [load]);
  if (d === null) return <Empty th={th}>Loading…</Empty>;
  if (d === false) return null;
  const s = d.summary;
  const pc = v => (v == null ? '–' : `${Math.round(v * 100)}%`);
  const noRes = s.searches ? s.noResult / s.searches : null;

  const addTo = async (row, faq, term) => {
    try { await api.post('/admin/search/add-key-term', { faq_id: faq.id, term, query: row.query }); toast.success(`Added “${term}” to the FAQ`); setOpen(null); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 14 }}>
        <Kpi th={th} label="Helpful answers" value={pc(s.helpfulRate)} color={s.helpfulRate == null ? th.text : s.helpfulRate >= 0.8 ? GREEN : s.helpfulRate >= 0.6 ? AMBER : RED} sub={`${s.up} 👍 · ${s.down} 👎`} />
        <Kpi th={th} label="Copied the first answer" value={pc(s.firstAnswerRate)} color={s.firstAnswerRate == null ? th.text : s.firstAnswerRate >= 0.8 ? GREEN : AMBER} sub={`of ${s.copies} copied answers`} />
        <Kpi th={th} label="Searches with no answer" value={pc(noRes)} color={noRes == null ? th.text : noRes <= 0.1 ? GREEN : noRes <= 0.25 ? AMBER : RED} sub={`${s.noResult} of ${s.searches} searches`} />
      </div>

      <Panel th={th} title="Answers copied from below the first result" hint="The agent skipped the first answer. The one they copied should have ranked higher: add their search words to it." style={{ marginBottom: 14 }}>
        {d.wrongOrder.length === 0 ? <Empty th={th}>No data yet. It appears as agents copy answers.</Empty> : d.wrongOrder.map(r => {
          const key = `w${r.query}|${r.faq_id}`;
          return (
            <div key={key} style={{ padding: '10px 0', borderTop: `1px solid ${th.border}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: th.text }}>“{r.query}”</div>
                  <div style={{ fontSize: 12.5, color: th.sub }}>copied: {r.question || `FAQ ${r.faq_id}`}</div>
                </div>
                <Pill color={AMBER}>position {r.position}</Pill>
                <Pill color={VIOLET}>{r.n}×</Pill>
                <Btn th={th} color={GREEN} solid onClick={() => addTo(r, { id: r.faq_id }, r.query)}>Add “{r.query.length > 22 ? `${r.query.slice(0, 22)}…` : r.query}” to this FAQ</Btn>
              </div>
            </div>
          );
        })}
      </Panel>

      <Panel th={th} title="Answers marked 👎" hint="Agents said this answer did not help for that search. Move the search words to a better FAQ, or fix the answer.">
        {d.notHelpful.length === 0 ? <Empty th={th}>No 👎 yet. 👍 and 👎 buttons are under every answer agents see.</Empty> : d.notHelpful.map(r => {
          const key = `n${r.query}|${r.faq_id}`;
          return (
            <div key={key} style={{ padding: '10px 0', borderTop: `1px solid ${th.border}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: th.text }}>“{r.query}”</div>
                  <div style={{ fontSize: 12.5, color: th.sub }}>showed: {r.question || `FAQ ${r.faq_id}`}</div>
                </div>
                <Pill color={RED}>{r.downs} 👎</Pill>
                {r.ups > 0 && <Pill color={GREEN}>{r.ups} 👍</Pill>}
                <Btn th={th} color={ORANGE} onClick={() => setOpen(open === key ? null : key)}>Find the right FAQ</Btn>
              </div>
              {open === key && <FaqPicker th={th} phrase={r.query} faqs={faqs} index={index} onPick={(f, term) => addTo(r, f, term)} onClose={() => setOpen(null)} />}
            </div>
          );
        })}
      </Panel>
    </>
  );
}

function Synonyms({ th }) {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null);
  const load = useCallback(() => api.get('/admin/search/synonyms').then(r => setRows(r.data)).catch(e => { setRows([]); toast.error(errMsg(e)); }), []);
  useEffect(() => { load(); }, [load]);
  const inp = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit', margin: '4px 0 10px' };
  const save = async () => {
    try {
      if (form.id) await api.put(`/admin/search/synonyms/${form.id}`, form); else await api.post('/admin/search/synonyms', form);
      toast.success('Saved. Agents get it the next time they open the app.'); setForm(null); load();
    } catch (e) { toast.error(errMsg(e)); }
  };
  const toggle = async r => { try { await api.put(`/admin/search/synonyms/${r.id}`, { words: r.words, note: r.note, is_active: !r.is_active }); load(); } catch (e) { toast.error(errMsg(e)); } };
  const del = async r => { if (!window.confirm(`Delete “${r.words}”?`)) return; try { await api.delete(`/admin/search/synonyms/${r.id}`); load(); } catch (e) { toast.error(errMsg(e)); } };

  return (
    <>
      <Panel th={th} title="Words that mean the same thing" hint="If agents say it differently from the FAQ, list the words here (separate with commas, any language or spelling). A search for any of them finds FAQs written with the others."
        right={<Btn th={th} solid onClick={() => setForm({ words: '', note: '', is_active: true })}>+ Add words</Btn>} style={{ marginBottom: 14 }}>
        {form && (
          <div style={{ background: th.soft, border: `1px solid ${ORANGE}66`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: th.sub, fontWeight: 700 }}>Words (comma separated)</label>
            <input style={inp} autoFocus placeholder="for example: maqtu3, maqtoo3, مقطوع, cutoff" value={form.words} onChange={e => setForm({ ...form, words: e.target.value })} />
            <label style={{ fontSize: 12, color: th.sub, fontWeight: 700 }}>Note (optional)</label>
            <input style={inp} value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn th={th} solid color={GREEN} onClick={save}>Save</Btn>
              <Btn th={th} color="#64748b" onClick={() => setForm(null)}>Cancel</Btn>
            </div>
          </div>
        )}
        {rows === null ? <Empty th={th}>Loading…</Empty> : rows.length === 0 && !form ? <Empty th={th}>No groups of your own yet.</Empty> : rows.map(r => (
          <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${th.border}`, opacity: r.is_active ? 1 : 0.5, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{String(r.words).split(',').map(w => <Pill key={w} color={VIOLET}>{w.trim()}</Pill>)}</div>
              {r.note && <div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>{r.note}</div>}
            </div>
            <Btn th={th} color={ORANGE} onClick={() => setForm({ id: r.id, words: r.words, note: r.note || '', is_active: r.is_active })}>Edit</Btn>
            <Btn th={th} color="#64748b" onClick={() => toggle(r)}>{r.is_active ? 'Turn off' : 'Turn on'}</Btn>
            <Btn th={th} color={RED} onClick={() => del(r)}>Delete</Btn>
          </div>
        ))}
      </Panel>
      <Panel th={th} title="Built in" hint="These groups are always on.">
        <div style={{ display: 'grid', gap: 8 }}>
          {SYNONYM_GROUPS.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{g.map(w => <Pill key={w} color="#64748b">{w}</Pill>)}</div>
          ))}
        </div>
      </Panel>
    </>
  );
}

export default function SearchInsights({ darkMode }) {
  const th = useTheme(darkMode);
  const [tab, setTab] = useState('misses');
  const [days, setDays] = useState(30);
  const [faqs, setFaqs] = useState([]);
  useEffect(() => { api.get('/faqs/all').then(r => setFaqs(Array.isArray(r.data) ? r.data : [])).catch(() => setFaqs([])); }, []);
  const index = useMemo(() => buildIndex(faqs), [faqs]);
  const tabBtn = (k, label, c) => (
    <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} style={{ border: `1px solid ${tab === k ? c : th.border}`, background: tab === k ? c : 'transparent', color: tab === k ? '#fff' : th.text, borderRadius: 999, padding: '8px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
  );
  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ background: 'linear-gradient(120deg,#FF6B35,#ec4899,#8b5cf6)', borderRadius: 20, padding: '18px 22px', color: '#fff', marginBottom: 14, boxShadow: '0 10px 28px rgba(236,72,153,.25)' }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>🔎 Search Insights</div>
        <div style={{ fontSize: 13.5, opacity: 0.95, marginTop: 3, lineHeight: 1.5 }}>See what agents look for, fix what they cannot find, and teach the search their words. Every fix helps every agent after that.</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        {tabBtn('misses', '🕳️ Not found', ORANGE)}
        {tabBtn('quality', '👍 Answer quality', GREEN)}
        {tabBtn('synonyms', '🔤 Synonyms', VIOLET)}
        {tab !== 'synonyms' && (
          <select value={days} onChange={e => setDays(+e.target.value)} aria-label="Period" style={{ marginInlineStart: 'auto', background: th.input, color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontSize: 13 }}>
            {[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
      </div>
      {tab === 'misses' && <Misses th={th} days={days} faqs={faqs} index={index} />}
      {tab === 'quality' && <Quality th={th} days={days} faqs={faqs} index={index} />}
      {tab === 'synonyms' && <Synonyms th={th} />}
    </div>
  );
}
