import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import RichAnswer from './RichAnswer';
import { buildIndex, searchFaqs, detectLanguage } from '../utils/faqSearch';
import { logSearch } from '../utils/searchLog';

// RUNAKI Knowledge Assistant: type the customer's problem, get the approved answer in the language you need.
// It searches the approved FAQs only (no guessing), so every answer here has been checked by QA.
const ORANGE = '#FF6B35';
const CAT = {
  'Inquiries': '#6366f1', 'Billing Complaints': '#ef4444', 'General Complaints': '#8b5cf6',
  'Service Requests': '#10b981', 'Feedback & Others': '#f59e0b', 'New Updates': '#f97316',
};
const LANGS = [['auto', 'Auto'], ['en', 'English'], ['ku', 'کوردی'], ['ba', 'Badini'], ['ar', 'عربي']];
const RTL = l => l === 'ku' || l === 'ba' || l === 'ar';
const QUICK = [
  ['💳', 'Customer paid but still disconnected', '#10b981'],
  ['📱', 'KYC rejected', '#8b5cf6'],
  ['🧾', 'High bill complaint', '#ef4444'],
  ['📲', 'Runaki App registration issue', '#38bdf8'],
  ['⚖️', 'Wrong tariff complaint', '#f59e0b'],
  ['⚡', 'Outage process', '#ec4899'],
];

const pick = (f, k, lang) => {
  const en = f[`${k}_en`];
  if (lang === 'ba') return f[`${k}_ba`] || f[`${k}_ku`] || en;
  if (lang === 'ku') return f[`${k}_ku`] || en;
  if (lang === 'ar') return f[`${k}_ar`] || en;
  return en;
};

function readRecent() { try { return JSON.parse(localStorage.getItem('rk_ai_recent') || '[]').slice(0, 5); } catch { return []; } }
function saveRecent(q) { try { localStorage.setItem('rk_ai_recent', JSON.stringify([q, ...readRecent().filter(x => x !== q)].slice(0, 5))); } catch { /* optional */ } }

export default function KnowledgeAssistant({ darkMode, DM, faqs, synV = 0, onOpen }) {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [lang, setLang] = useState('auto');
  const [auto, setAuto] = useState('en');
  const [limit, setLimit] = useState(5);
  const [recent, setRecent] = useState(readRecent);
  const index = useMemo(() => buildIndex(faqs), [faqs, synV]); // eslint-disable-line react-hooks/exhaustive-deps
  const [votes, setVotes] = useState({});
  const [flows, setFlows] = useState([]);
  const [scripts, setScripts] = useState([]);

  // call flows and scripts, so each answer can point to the matching next step
  useEffect(() => {
    api.get('/callflows').then(r => setFlows(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/page-content/scripts').then(r => {
      const d = r.data && r.data.data; if (!d) return;
      const cards = (d.cards || []).map(c => ({ id: `s${(c.t && c.t.en) || ''}`, title: (c.t && c.t.en) || '', text: (c.s && c.s.en) || '' }));
      const closing = ((d.closing && d.closing.steps) || []).map(c => ({ id: `c${(c.label && c.label.en) || ''}`, title: (c.label && c.label.en) || '', text: (c.s && c.s.en) || '' }));
      setScripts([...cards, ...closing].filter(x => x.title));
    }).catch(() => {});
  }, []);
  const flowIndex = useMemo(() => buildIndex(flows.map(f => {
    let steps = f.steps; try { if (typeof steps === 'string') steps = JSON.parse(steps); } catch { steps = []; }
    return { id: f.id, question_en: f.title, answer_en: `${f.description || ''} ${(steps || []).map(x => x.text).join(' ')}`, category: '', _flow: f };
  })), [flows, synV]); // eslint-disable-line react-hooks/exhaustive-deps
  const scriptIndex = useMemo(() => buildIndex(scripts.map((x, i) => ({ id: i, question_en: x.title, answer_en: x.text, category: '', _script: x }))), [scripts, synV]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Also see": FAQs on the same topic, the matching call flow, the matching script
  const related = useMemo(() => {
    const out = {};
    results.forEach(({ faq }) => {
      const probe = `${faq.question_en || ''} ${faq.tags || ''}`;
      const sim = searchFaqs(index, probe, { limit: 6, minScore: 6 }).map(r => r.faq).filter(f => f.id !== faq.id);
      const same = (faqs || []).filter(f => f.id !== faq.id && f.subcategory && f.subcategory === faq.subcategory && f.category === faq.category);
      const faqsRel = [...sim, ...same.filter(f => !sim.some(x => x.id === f.id))].slice(0, 3);
      const fl = searchFaqs(flowIndex, probe, { limit: 1, minScore: 5 }).map(r => r.faq._flow);
      const sc = searchFaqs(scriptIndex, probe, { limit: 1, minScore: 5 }).map(r => r.faq._script);
      out[faq.id] = { faqs: faqsRel, flow: fl[0] || null, script: sc[0] || null };
    });
    return out;
  }, [results, index, flowIndex, scriptIndex, faqs]);

  const sendFeedback = (faq, position, action, vote) => {
    api.post('/search-feedback', { query: asked, faq_id: faq.id, position, action, vote }).catch(() => {});
  };
  const vote = (faq, position, v) => {
    const cur = votes[faq.id];
    const next = cur === v ? 0 : v;
    setVotes(x => ({ ...x, [faq.id]: next }));
    sendFeedback(faq, position, 'vote', next);
  };
  const shown = lang === 'auto' ? auto : lang;

  const ask = (q = question, lim = 5) => {
    const query = (typeof q === 'string' ? q : question).trim();
    if (!query) { setResults([]); setSearched(false); setAsked(''); return; }
    setAuto(detectLanguage(query));
    setLimit(lim);
    const found = searchFaqs(index, query, { limit: lim, minScore: 3 });
    setResults(found); setSearched(true); setAsked(query); setVotes({});
    logSearch(query, found.length, 'assistant');
    saveRecent(query); setRecent(readRecent());
  };
  const clear = () => { setQuestion(''); setResults([]); setSearched(false); setAsked(''); setVotes({}); };
  const copy = async text => { try { await navigator.clipboard.writeText(text); toast.success('Answer copied'); } catch { toast.error('Could not copy'); } };

  const chip = (active, c = ORANGE) => ({
    border: `1px solid ${active ? c : DM.border}`, background: active ? c : 'transparent', color: active ? '#fff' : DM.text,
    borderRadius: 999, padding: '6px 13px', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  });

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: '24px', marginBottom: 18, color: '#fff', background: 'linear-gradient(120deg,#FF6B35 0%,#ec4899 55%,#8b5cf6 100%)', boxShadow: '0 14px 36px rgba(236,72,153,.28)' }}>
        <div style={{ position: 'absolute', insetInlineEnd: -40, top: -50, width: 190, height: 190, borderRadius: '50%', background: 'rgba(255,255,255,.14)' }} />
        <div style={{ position: 'absolute', insetInlineEnd: 90, bottom: -70, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 40, lineHeight: 1 }}>🤖</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900 }}>Knowledge Assistant</h1>
              <div style={{ fontSize: 14, opacity: 0.95, marginTop: 2 }}>Describe the customer's problem. You get the approved answer, nothing made up.</div>
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); ask(); }} style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <input value={question} onChange={e => setQuestion(e.target.value)} aria-label="Describe the customer's problem"
                placeholder="For example: customer paid but internet is still off"
                style={{ width: '100%', boxSizing: 'border-box', height: 54, borderRadius: 16, border: 'none', background: '#fff', color: '#0B1120', padding: '0 46px 0 18px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxShadow: '0 6px 18px rgba(0,0,0,.14)' }} />
              {question && <button type="button" onClick={clear} aria-label="Clear" style={{ position: 'absolute', insetInlineEnd: 10, top: 13, width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#e2e8f0', color: '#475569', cursor: 'pointer', fontWeight: 900 }}>✕</button>}
            </div>
            <button type="submit" style={{ height: 54, padding: '0 28px', border: 'none', borderRadius: 16, background: '#0B1120', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 18px rgba(0,0,0,.2)' }}>Find answer</button>
          </form>
        </div>
      </div>

      {!searched && (
        <>
          <div style={{ fontWeight: 900, color: DM.text, fontSize: 15, margin: '4px 0 10px' }}>⚡ Common problems</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10, marginBottom: 18 }}>
            {QUICK.map(([e, t, c]) => (
              <button key={t} onClick={() => { setQuestion(t); ask(t); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'start', background: `${c}${darkMode ? '22' : '14'}`, border: `1px solid ${c}55`, borderRadius: 16, padding: '13px 14px', cursor: 'pointer', fontFamily: 'inherit', color: DM.text, fontWeight: 800, fontSize: 14 }}>
                <span style={{ fontSize: 24 }}>{e}</span><span>{t}</span>
              </button>
            ))}
          </div>
          {recent.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 900, color: DM.text, fontSize: 15, margin: '4px 0 10px' }}>🕘 Your recent searches</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {recent.map(r => <button key={r} onClick={() => { setQuestion(r); ask(r); }} style={chip(false)}>{r}</button>)}
              </div>
            </div>
          )}
          <div style={{ background: DM.cardBg, border: `1px dashed ${DM.border}`, borderRadius: 18, padding: '16px 18px', color: DM.subText, fontSize: 13.5, lineHeight: 1.8 }}>
            <strong style={{ color: DM.text }}>Tips:</strong> use the key words of the problem (bill, disconnected, KYC, tariff). You can type in English, Sorani, Badini or Arabic, and switch the answer language after you search.
          </div>
        </>
      )}

      {searched && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ color: DM.subText, fontSize: 13.5 }}>
              {results.length ? <><strong style={{ color: DM.text }}>{results.length} approved answer{results.length === 1 ? '' : 's'}</strong> for “{asked}”</> : <>Nothing found for “{asked}”</>}
            </div>
            <div role="group" aria-label="Answer language" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LANGS.map(([k, l]) => <button key={k} onClick={() => setLang(k)} aria-pressed={lang === k} style={chip(lang === k, '#8b5cf6')}>{l}</button>)}
            </div>
          </div>

          {results.length === 0 ? (
            <div style={{ background: DM.cardBg, border: `1px dashed ${DM.border}`, borderRadius: 20, padding: '24px', color: DM.subText, lineHeight: 1.8 }}>
              <div style={{ fontSize: 34 }}>🔎</div>
              <div style={{ fontWeight: 900, color: DM.text, fontSize: 17, margin: '4px 0 6px' }}>No approved answer found</div>
              Try fewer or different words, for example the key words of the customer's problem: bill, disconnected, KYC, tariff.
              If it is still not covered, ask your Team Coordinator or QA and do not guess.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {results.map(({ faq, matchedTerms }, idx) => {
                const c = CAT[faq.category] || ORANGE;
                const q = pick(faq, 'question', shown), a = pick(faq, 'answer', shown), rtl = RTL(shown);
                return (
                  <article key={faq.id} style={{ background: DM.cardBg, border: `1px solid ${idx === 0 ? c : DM.border}`, borderRadius: 20, overflow: 'hidden', boxShadow: idx === 0 ? `0 10px 28px ${c}30` : DM.shadow }}>
                    <div style={{ height: 5, background: `linear-gradient(90deg,${c},${c}55)` }} />
                    <div style={{ padding: '16px 20px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        <span style={{ color: '#10b981', fontWeight: 900, fontSize: 13 }}>{idx === 0 ? '🏆 Best match · approved by QA' : '✅ Approved by QA'}</span>
                        <button onClick={() => { copy(`${q}\n\n${a}`); sendFeedback(faq, idx + 1, 'copy'); }} style={{ ...chip(false, c), padding: '5px 12px', fontSize: 12.5 }}>📋 Copy answer</button>
                      </div>
                      <h3 dir={rtl ? 'rtl' : 'ltr'} style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 900, color: DM.text, textAlign: rtl ? 'right' : 'left', lineHeight: 1.5 }}>{q}</h3>
                      <RichAnswer style={{ color: DM.text, opacity: 0.88, lineHeight: 1.85, fontSize: 14.5, direction: rtl ? 'rtl' : 'ltr', textAlign: rtl ? 'right' : 'left' }} text={a} />
                      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {faq.category && <span style={{ background: `${c}${darkMode ? '33' : '1a'}`, color: c, border: `1px solid ${c}55`, borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 800 }}>{faq.category}</span>}
                        {faq.subcategory && <span style={{ background: darkMode ? 'rgba(255,255,255,.08)' : '#f1f5f9', color: DM.text, borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 700 }}>{faq.subcategory}</span>}
                        {(matchedTerms || []).map(t => <span key={t} title="Found through this key word" style={{ background: darkMode ? 'rgba(249,115,22,.22)' : '#fff7ed', color: darkMode ? '#fdba74' : '#c2410c', border: '1px solid #fdba7466', borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 700 }}>🔑 {t}</span>)}
                      </div>
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${DM.border}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: DM.text }}>Was this the answer you needed?</span>
                        <button onClick={() => vote(faq, idx + 1, 1)} aria-pressed={votes[faq.id] === 1} style={chip(votes[faq.id] === 1, '#10b981')}>👍 Yes</button>
                        <button onClick={() => vote(faq, idx + 1, -1)} aria-pressed={votes[faq.id] === -1} style={chip(votes[faq.id] === -1, '#ef4444')}>👎 No</button>
                        {votes[faq.id] === 1 && <span style={{ fontSize: 12.5, color: '#10b981', fontWeight: 800 }}>Thanks!</span>}
                        {votes[faq.id] === -1 && <span style={{ fontSize: 12.5, color: DM.subText }}>Thanks, QA will look at this search.</span>}
                      </div>
                      {(() => {
                        const rel = related[faq.id];
                        if (!rel || (!rel.faqs.length && !rel.flow && !rel.script)) return null;
                        return (
                          <div style={{ marginTop: 12, background: darkMode ? 'rgba(255,255,255,.04)' : '#f8fafc', border: `1px solid ${DM.border}`, borderRadius: 14, padding: '12px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: DM.text, marginBottom: 8 }}>👀 Also see</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {rel.flow && onOpen && <button onClick={() => onOpen('_callflows')} style={{ ...chip(false, '#38bdf8'), borderColor: '#38bdf8aa' }}>🗺️ Call flow: {rel.flow.title}</button>}
                              {rel.script && onOpen && <button onClick={() => onOpen('_scripts')} style={{ ...chip(false, '#ec4899'), borderColor: '#ec4899aa' }}>📝 Script: {rel.script.title}</button>}
                              {rel.faqs.map(f => (
                                <button key={f.id} onClick={() => { const t = f.question_en; setQuestion(t); ask(t); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                  style={{ ...chip(false, '#8b5cf6'), borderColor: '#8b5cf6aa', textAlign: 'start' }}>🔗 {f.question_en}</button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </article>
                );
              })}
              {results.length >= limit && limit < 15 && (
                <button onClick={() => ask(asked, 15)} style={{ ...chip(false, '#8b5cf6'), alignSelf: 'center', justifySelf: 'center', padding: '9px 20px' }}>Show more answers</button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
