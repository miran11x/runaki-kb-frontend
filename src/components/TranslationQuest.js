import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import RichAnswer from './RichAnswer';
import { useTheme, GREEN, AMBER, ORANGE, BLUE } from './qaUi';

// Admin: review the translated Shortlisted FAQ's one at a time, as a small quest.
// Three rounds per FAQ (Sorani, Badini, Arabic). Edits save by themselves; a tick means "I checked this translation".
// Progress lives on the server, so tomorrow it opens on the first FAQ that is not finished.
const ROUNDS = [
  { key: 'ku', name: 'Sorani', native: 'سۆرانی', color: ORANGE },
  { key: 'ba', name: 'Badini', native: 'بادینی', color: BLUE },
  { key: 'ar', name: 'Arabic', native: 'العربية', color: GREEN },
];
const XP_CHECK = 10, XP_FAQ = 20;
const LEVELS = [[0, 'Newcomer'], [100, 'Word checker'], [300, 'Proofreader'], [600, 'Sharp-eyed editor'], [1000, 'Translation master']];
const levelOf = xp => { let i = 0; LEVELS.forEach((l, n) => { if (xp >= l[0]) i = n; }); return { n: i + 1, name: LEVELS[i][1], from: LEVELS[i][0], to: LEVELS[i + 1] ? LEVELS[i + 1][0] : null }; };

export default function TranslationQuest({ darkMode }) {
  const th = useTheme(darkMode);
  const [data, setData] = useState(null);
  const [rev, setRev] = useState({});            // { faqId: { ku: 'name', ... } }
  const [today, setToday] = useState(0);
  const [idx, setIdx] = useState(0);
  const [lang, setLang] = useState('ku');
  const [mode, setMode] = useState('edit');       // edit | preview
  const [saving, setSaving] = useState('idle');  // idle | dirty | saving | saved | error
  const [done, setDone] = useState(false);       // current FAQ just finished
  const [showEn, setShowEn] = useState(true);
  const timer = useRef(null);
  const pending = useRef(null);                   // { id, lang, q, a } waiting to be saved
  const [resumed, setResumed] = useState(false);

  const firstOpen = useCallback((faqs, r) => {
    const i = faqs.findIndex(f => ROUNDS.some(x => !r[f.id]?.[x.key]));
    return i < 0 ? 0 : i;
  }, []);
  const firstLang = (f, r) => (ROUNDS.find(x => !r[f.id]?.[x.key]) || ROUNDS[0]).key;

  useEffect(() => {
    let live = true;
    api.get('/admin/translation-quest').then(res => {
      if (!live) return;
      const r = {}; let t = 0; const day = new Date().toDateString();
      res.data.reviews.forEach(x => { (r[x.faq_id] = r[x.faq_id] || {})[x.lang] = x.name || 'someone'; if (new Date(x.reviewed_at).toDateString() === day) t++; });
      const i = firstOpen(res.data.faqs, r);
      setData(res.data.faqs); setRev(r); setToday(t); setIdx(i);
      if (res.data.faqs[i]) setLang(firstLang(res.data.faqs[i], r));
      setResumed(Object.keys(r).length > 0);
    }).catch(() => toast.error('Could not load the Shortlisted FAQ\'s'));
    return () => { live = false; };
  }, [firstOpen]);

  const faq = data?.[idx];
  const doneCount = useMemo(() => (data || []).filter(f => ROUNDS.every(x => rev[f.id]?.[x.key])).length, [data, rev]);
  const checks = useMemo(() => (data || []).reduce((n, f) => n + ROUNDS.filter(x => rev[f.id]?.[x.key]).length, 0), [data, rev]);
  const xp = checks * XP_CHECK + doneCount * XP_FAQ;
  const lv = levelOf(xp);

  // ---- saving -----------------------------------------------------------
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const p = pending.current; if (!p) return true;
    pending.current = null; setSaving('saving');
    try { await api.put(`/admin/translation-quest/${p.id}`, { lang: p.lang, question: p.q, answer: p.a }); setSaving('saved'); return true; }
    catch { pending.current = p; setSaving('error'); toast.error('Could not save — check your connection'); return false; }
  }, []);
  useEffect(() => () => { clearTimeout(timer.current); const p = pending.current; if (p) api.put(`/admin/translation-quest/${p.id}`, { lang: p.lang, question: p.q, answer: p.a }).catch(() => {}); }, []);
  useEffect(() => { const h = e => { if (pending.current) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, []);

  const edit = (field, value) => {
    const cur = faq[lang];
    const next = { ...cur, [field]: value };
    setData(d => d.map((f, i) => (i === idx ? { ...f, [lang]: next } : f)));
    setRev(r => { const c = { ...r, [faq.id]: { ...(r[faq.id] || {}) } }; delete c[faq.id][lang]; return c; });   // an edited text must be confirmed again
    setDone(false);
    pending.current = { id: faq.id, lang, q: next.q, a: next.a };
    setSaving('dirty');
    clearTimeout(timer.current); timer.current = setTimeout(flush, 1200);
  };

  const go = async (i, l) => {
    if (!(await flush())) return;
    setIdx(i); setDone(false); setMode('edit'); setSaving('idle');
    setLang(l || firstLang(data[i], rev));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const looksGood = async () => {
    if (!faq || !(await flush())) return;
    try { await api.post(`/admin/translation-quest/${faq.id}/review`, { lang, reviewed: true }); }
    catch { toast.error('Could not save your tick'); return; }
    const r2 = { ...rev, [faq.id]: { ...(rev[faq.id] || {}), [lang]: 'you' } };
    setRev(r2); setToday(t => t + 1);
    const nextLang = ROUNDS.find(x => !r2[faq.id][x.key]);
    if (nextLang) { setLang(nextLang.key); setMode('edit'); setSaving('idle'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else setDone(true);
  };
  const untick = async () => {
    try { await api.post(`/admin/translation-quest/${faq.id}/review`, { lang, reviewed: false }); } catch { return; }
    setRev(r => { const c = { ...r, [faq.id]: { ...(r[faq.id] || {}) } }; delete c[faq.id][lang]; return c; }); setDone(false);
  };
  const nextOpen = () => {
    if (!data) return;
    for (let k = 1; k <= data.length; k++) { const i = (idx + k) % data.length; if (ROUNDS.some(x => !rev[data[i].id]?.[x.key])) return go(i); }
    setDone(true);
  };

  useEffect(() => {
    const h = e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); looksGood(); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  });

  if (!data) return <div style={{ padding: 30, color: th.sub }}>Loading the quest…</div>;
  if (!data.length) return <div style={{ padding: 30, color: th.sub }}>There are no Shortlisted FAQ's yet.</div>;

  const round = ROUNDS.find(x => x.key === lang);
  const cur = faq[lang];
  const roundsDone = ROUNDS.filter(x => rev[faq.id]?.[x.key]).length;
  const allDone = doneCount === data.length;
  const pct = Math.round((checks / (data.length * 3)) * 100);
  const reviewer = rev[faq.id]?.[lang];

  const field = {
    width: '100%', boxSizing: 'border-box', background: th.input, color: th.text, border: `1px solid ${th.border}`, borderRadius: 12,
    padding: '12px 14px', fontSize: 16, lineHeight: 1.9, outline: 'none', fontFamily: 'inherit', direction: 'rtl', textAlign: 'start',
  };
  const btn = (bg, extra) => ({ border: 'none', borderRadius: 12, padding: '12px 18px', fontWeight: 800, fontSize: 14, cursor: 'pointer', background: bg, color: '#fff', ...extra });

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <style>{`
        @keyframes tqpop{0%{transform:scale(.8);opacity:0}60%{transform:scale(1.04);opacity:1}100%{transform:scale(1)}}
        @keyframes tqfall{0%{transform:translateY(-20px) rotate(0);opacity:0}15%{opacity:1}100%{transform:translateY(120px) rotate(300deg);opacity:0}}
        .tq-dot{transition:transform .12s}.tq-dot:hover{transform:scale(1.25)}
        @media (prefers-reduced-motion: reduce){.tq-anim{animation:none!important}}
      `}</style>

      {/* scoreboard */}
      <div style={{ background: darkMode ? '#0f172a' : '#0B1120', color: '#fff', borderRadius: 18, padding: '16px 18px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 700 }}>Translation quest</div>
            <div style={{ fontSize: 21, fontWeight: 900 }}>Level {lv.n} · {lv.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            {[[doneCount + '/' + data.length, 'FAQs finished'], [checks + '/' + data.length * 3, 'translations checked'], [xp, 'XP'], [today, 'checked today']].map(([v, l]) => (
              <div key={l}><div style={{ fontSize: 20, fontWeight: 900 }}>{v}</div><div style={{ fontSize: 11, opacity: 0.65 }}>{l}</div></div>
            ))}
          </div>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,.14)', borderRadius: 99, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: `linear-gradient(90deg,${ORANGE},${AMBER})`, borderRadius: 99, transition: 'width .4s' }} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {data.map((f, i) => {
            const n = ROUNDS.filter(x => rev[f.id]?.[x.key]).length;
            return (
              <button key={f.id} className="tq-dot" onClick={() => go(i)} title={`FAQ ${f.pos || i + 1} — ${n}/3 checked`}
                style={{ width: 26, height: 26, borderRadius: 8, border: i === idx ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', fontSize: 10.5, fontWeight: 800, color: n ? '#06281c' : '#fff',
                  background: n === 3 ? GREEN : n ? AMBER : 'rgba(255,255,255,.16)' }}>{f.pos || i + 1}</button>
            );
          })}
        </div>
        {resumed && !allDone && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>Welcome back — the quest opened on the first FAQ you haven't finished.</div>}
      </div>

      {allDone && (
        <div style={{ background: 'rgba(16,185,129,.12)', border: `1px solid ${GREEN}`, borderRadius: 14, padding: '12px 16px', marginBottom: 14, color: th.text, fontWeight: 700 }}>
          🏁 Quest complete — all {data.length} Shortlisted FAQ's are checked in Sorani, Badini and Arabic. You can still open any FAQ to fix a word.
        </div>
      )}

      {/* the FAQ */}
      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 18, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: th.sub }}>FAQ {faq.pos || idx + 1} of {data.length} · {roundsDone}/3 checked</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => go(Math.max(0, idx - 1))} disabled={idx === 0} style={btn(th.soft, { color: th.text, border: `1px solid ${th.border}`, padding: '6px 12px', opacity: idx === 0 ? 0.4 : 1 })}>← Previous</button>
            <button onClick={() => go(Math.min(data.length - 1, idx + 1))} disabled={idx === data.length - 1} style={btn(th.soft, { color: th.text, border: `1px solid ${th.border}`, padding: '6px 12px', opacity: idx === data.length - 1 ? 0.4 : 1 })}>Skip →</button>
          </div>
        </div>
        <h2 style={{ margin: '8px 0 12px', fontSize: 19, lineHeight: 1.45, color: th.text }}>{faq.question_en}</h2>

        {/* rounds */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {ROUNDS.map((x, n) => {
            const ok = !!rev[faq.id]?.[x.key], on = x.key === lang && !done;
            return (
              <button key={x.key} onClick={async () => { if (await flush()) { setLang(x.key); setDone(false); setMode('edit'); setSaving('idle'); } }}
                style={{ flex: '1 1 150px', textAlign: 'start', cursor: 'pointer', borderRadius: 14, padding: '10px 12px', border: `2px solid ${on ? x.color : th.border}`, background: on ? x.color + '1f' : th.soft, color: th.text }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: th.sub }}>Round {n + 1}</div>
                <div style={{ fontWeight: 900, fontSize: 15 }}>{ok ? '✅' : '▫️'} {x.name} <span style={{ fontWeight: 600, color: th.sub, fontSize: 13 }}>{x.native}</span></div>
              </button>
            );
          })}
        </div>

        {done ? (
          <div className="tq-anim" style={{ position: 'relative', textAlign: 'center', padding: '34px 12px', borderRadius: 16, background: 'rgba(16,185,129,.1)', border: `1px solid ${GREEN}`, animation: 'tqpop .4s', overflow: 'hidden' }}>
            {['🎉', '✨', '⭐', '🎊', '✨', '⭐'].map((e, i) => <span key={i} className="tq-anim" style={{ position: 'absolute', top: 0, left: 8 + i * 17 + '%', fontSize: 20, animation: `tqfall ${1.6 + i * 0.15}s ease-out ${i * 0.08}s` }}>{e}</span>)}
            <div style={{ fontSize: 40 }}>🏆</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: th.text, marginTop: 6 }}>FAQ {faq.pos || idx + 1} reviewed</div>
            <div style={{ color: th.sub, marginTop: 4 }}>Sorani, Badini and Arabic all checked · +{3 * XP_CHECK + XP_FAQ} XP</div>
            <button onClick={nextOpen} style={btn(GREEN, { marginTop: 18, padding: '13px 26px', fontSize: 15 })}>{allDone ? 'Finish' : 'Next FAQ →'}</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 14, alignItems: 'start' }}>
            {/* English reference */}
            <div style={{ background: th.soft, border: `1px solid ${th.border}`, borderRadius: 14, padding: 14, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: th.sub }}>English original</div>
                <button onClick={() => setShowEn(s => !s)} style={{ background: 'none', border: 'none', color: th.sub, cursor: 'pointer', fontSize: 12 }}>{showEn ? 'Hide' : 'Show'}</button>
              </div>
              {showEn && <RichAnswer text={faq.answer_en} style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.65, color: th.text, maxHeight: '62vh', overflowY: 'auto' }} />}
            </div>

            {/* editor */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 900, color: round.color }}>{round.name} · {round.native}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: saving === 'error' ? '#ef4444' : th.sub }}>{{ idle: '', dirty: 'Unsaved…', saving: 'Saving…', saved: 'Saved ✓', error: 'Not saved' }[saving]}</span>
                  {['edit', 'preview'].map(m => (
                    <button key={m} onClick={() => setMode(m)} style={{ border: `1px solid ${th.border}`, background: mode === m ? round.color : th.soft, color: mode === m ? '#fff' : th.text, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{m === 'edit' ? 'Edit' : 'Preview'}</button>
                  ))}
                </div>
              </div>
              {mode === 'edit' ? (
                <>
                  <input dir="rtl" value={cur.q} onChange={e => edit('q', e.target.value)} placeholder="Question" style={{ ...field, fontWeight: 800, marginBottom: 8 }} />
                  <textarea dir="rtl" value={cur.a} onChange={e => edit('a', e.target.value)} placeholder="Answer" style={{ ...field, minHeight: 360, height: '62vh', resize: 'vertical' }} />
                  <div style={{ fontSize: 11.5, color: th.sub, marginTop: 6 }}>Keep the bullets (• ◦ ▪) and the **bold** marks. Changes save by themselves; editing a text clears its tick.</div>
                </>
              ) : (
                <div dir="rtl" style={{ background: th.input, border: `1px solid ${th.border}`, borderRadius: 12, padding: 14, maxHeight: '62vh', overflowY: 'auto' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10, color: th.text }}>{cur.q}</div>
                  <RichAnswer text={cur.a} style={{ fontSize: 15, lineHeight: 1.9, color: th.text }} />
                </div>
              )}
              {!cur.q && !cur.a && <div style={{ marginTop: 8, color: AMBER, fontSize: 13 }}>This language is empty — type the translation above.</div>}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
                {reviewer ? (
                  <>
                    <span style={{ color: GREEN, fontWeight: 800 }}>✅ Checked{reviewer !== 'you' ? ` by ${reviewer}` : ''}</span>
                    <button onClick={untick} style={btn(th.soft, { color: th.text, border: `1px solid ${th.border}` })}>Untick</button>
                    <button onClick={() => { const n = ROUNDS.find(x => !rev[faq.id]?.[x.key]); n ? setLang(n.key) : setDone(true); }} style={btn(round.color)}>Continue →</button>
                  </>
                ) : (
                  <button onClick={looksGood} style={btn(GREEN, { padding: '13px 22px' })}>✓ Looks good{roundsDone === 2 ? ' — finish FAQ' : ' — next language'}</button>
                )}
                <span style={{ fontSize: 11.5, color: th.sub }}>Ctrl + Enter</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
