import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const NAVY   = '#0B1120';
const ORANGE = '#FF6B35';
const API    = process.env.REACT_APP_API_URL || 'https://runaki-kb-api.vercel.app';

const CRITERIA = [
  { key: 'greeting_script',  label: 'Greeting Script'  },
  { key: 'customer_info',    label: 'Customer Info'     },
  { key: 'faq_alignment',    label: 'FAQ Alignment'     },
  { key: 'correct_tagging',  label: 'Correct Tagging'   },
  { key: 'communication',    label: 'Communication'     },
  { key: 'tone_of_voice',    label: 'Tone of Voice'     },
  { key: 'ending',           label: 'Ending Script'     },
  { key: 'rude_behaviour',   label: 'Rude Behaviour'    },
  { key: 'hang_up',          label: 'Hang Up'           },
  { key: 'active_listening', label: 'Active Listening'  },
];

function scoreColor(s) {
  const n = parseFloat(s);
  if (isNaN(n)) return '#64748b';
  if (n >= 9)   return '#22c55e';
  if (n >= 7)   return ORANGE;
  return '#ef4444';
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString('en-GB');
  } catch { return String(d); }
}

function fmtScore(s) {
  const n = parseFloat(s);
  if (isNaN(n)) return '—';
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
}

export default function MyEvaluations({ darkMode }) {
  useAuth(); // keep auth context active
  const [evals,    setEvals]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState(null);

  const DM     = darkMode;
  const card   = DM ? '#1e293b' : '#ffffff';
  const border = DM ? '#334155' : '#e2e8f0';
  const text   = DM ? '#e2e8f0' : '#1e293b';
  const sub    = DM ? '#94a3b8' : '#64748b';
  const altRow = DM ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)';
  const faint  = DM ? '#0f172a' : '#f8fafc';

  useEffect(() => {
    api.get('/evaluations/mine')
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          data.sort((a, b) => new Date(b.evaluation_date) - new Date(a.evaluation_date));
          setEvals(data);
        } else {
          setEvals([]);
        }
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to load evaluations.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Computed stats ─────────────────────────────────────────────────────── */

  const avgScore = useMemo(() => {
    const valid = evals.filter(e => !isNaN(parseFloat(e.overall_score)));
    if (!valid.length) return null;
    const total = valid.reduce((acc, e) => acc + parseFloat(e.overall_score), 0);
    return (total / valid.length).toFixed(1);
  }, [evals]);

  const doneCount    = useMemo(() => evals.filter(e => e.coaching_status === 'Done').length,    [evals]);
  const pendingCount = useMemo(() => evals.filter(e => e.coaching_status === 'Pending').length, [evals]);

  const criteriaStats = useMemo(() => {
    if (!evals.length) return {};
    return CRITERIA.reduce((acc, c) => {
      const passes = evals.filter(e => parseInt(e[c.key]) === 1).length;
      acc[c.key] = Math.round((passes / evals.length) * 100);
      return acc;
    }, {});
  }, [evals]);

  /* ── Shared style helpers ───────────────────────────────────────────────── */
  const badge = (color, bg) => ({
    display: 'inline-block', padding: '2px 10px',
    borderRadius: 20, fontSize: 11, fontWeight: 700, color, background: bg,
  });

  const sectionLabel = {
    fontSize: 11, fontWeight: 700, color: sub,
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12,
  };

  /* ── Early returns ──────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300, color:sub }}>
      Loading your evaluations...
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300, color:'#ef4444' }}>
      {error}
    </div>
  );

  if (!evals.length) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:300, gap:12, color:sub }}>
      <span style={{ fontSize:44 }}>📋</span>
      <span style={{ fontSize:16, fontWeight:700, color: DM?'#e2e8f0':NAVY }}>No evaluations yet</span>
      <span style={{ fontSize:13, textAlign:'center', maxWidth:340 }}>
        Your evaluations will appear here once your QA officer uploads the sheet.
      </span>
    </div>
  );

  /* ── Main render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ color:text }}>

      {/* Header */}
      <div style={{ padding:'22px 28px 18px', borderBottom:`1px solid ${border}`, background:card, position:'sticky', top:0, zIndex:10 }}>
        <div style={{ fontSize:20, fontWeight:700, color:DM?'#f1f5f9':NAVY, margin:0 }}>📋 My Evaluations</div>
        <div style={{ fontSize:13, color:sub, marginTop:3 }}>{evals.length} evaluation{evals.length!==1?'s':''} on record</div>
      </div>

      <div style={{ padding:'24px 28px' }}>

        {/* ── Stats ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
          {[
            { val: avgScore ?? '—', label:'Avg score / 10', color: avgScore ? scoreColor(avgScore) : sub },
            { val: evals.length,   label:'Total evals',    color: ORANGE },
            { val: doneCount,      label:'Coaching done',  color:'#22c55e' },
            { val: pendingCount,   label:'Pending coaching', color: pendingCount>0?ORANGE:sub },
          ].map((s,i) => (
            <div key={i} style={{ background:card, border:`1px solid ${border}`, borderRadius:12, padding:'18px 20px' }}>
              <div style={{ fontSize:30, fontWeight:700, lineHeight:1, color:s.color, marginBottom:5 }}>{s.val}</div>
              <div style={{ fontSize:11, color:sub, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Criteria breakdown ── */}
        <div style={{ marginBottom:28 }}>
          <div style={sectionLabel}>Criteria breakdown — pass rate across all {evals.length} evaluations</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
            {CRITERIA.map(c => {
              const pct   = criteriaStats[c.key] ?? 0;
              const color = pct>=90?'#22c55e':pct>=70?ORANGE:'#ef4444';
              return (
                <div key={c.key} style={{ background:card, border:`1px solid ${border}`, borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:12, color:sub, marginBottom:8 }}>{c.label}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ flex:1, height:5, borderRadius:3, background:DM?'#334155':'#e2e8f0', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color, minWidth:34, textAlign:'right' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ marginBottom:8 }}>
          <div style={sectionLabel}>All evaluations</div>
          <div style={{ background:card, border:`1px solid ${border}`, borderRadius:12, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  {['Date','Subject','Coordinator','QA Officer','Score','Coaching',''].map((h,i) => (
                    <th key={i} style={{
                      padding:'10px 14px', fontSize:11, fontWeight:700, color:sub,
                      textTransform:'uppercase', letterSpacing:'0.05em',
                      background:faint, borderBottom:`1px solid ${border}`,
                      textAlign:'left', whiteSpace:'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evals.map((e, i) => {
                  const isDone = e.coaching_status === 'Done';
                  return (
                    <tr key={e.id} style={{ background: i%2===0?'transparent':altRow }}>
                      <td style={{ padding:'10px 14px', fontSize:12, color:sub, borderBottom:`1px solid ${border}`, whiteSpace:'nowrap' }}>
                        {fmtDate(e.evaluation_date)}
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:13, color:text, borderBottom:`1px solid ${border}`, maxWidth:170, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {e.subject || '—'}
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:13, color:sub, borderBottom:`1px solid ${border}`, whiteSpace:'nowrap' }}>
                        {e.coordinator || '—'}
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:13, color:sub, borderBottom:`1px solid ${border}`, whiteSpace:'nowrap' }}>
                        {e.qa_officer || '—'}
                      </td>
                      <td style={{ padding:'10px 14px', borderBottom:`1px solid ${border}` }}>
                        <span style={{ fontWeight:700, color:scoreColor(e.overall_score), fontSize:15 }}>
                          {fmtScore(e.overall_score)}
                        </span>
                        <span style={{ color:sub, fontSize:11 }}>/10</span>
                      </td>
                      <td style={{ padding:'10px 14px', borderBottom:`1px solid ${border}` }}>
                        <span style={badge(
                          isDone?'#22c55e':ORANGE,
                          isDone?'rgba(34,197,94,0.12)':'rgba(255,107,53,0.12)'
                        )}>
                          {e.coaching_status || '—'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px', borderBottom:`1px solid ${border}` }}>
                        <button
                          onClick={() => setSelected(e)}
                          style={{ background:'none', border:`1px solid ${border}`, borderRadius:6, padding:'3px 12px', fontSize:11, cursor:'pointer', color:sub, fontFamily:'inherit' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background:card, border:`1px solid ${border}`, borderRadius:16, width:'100%', maxWidth:580, maxHeight:'88vh', overflowY:'auto', padding:28, position:'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              style={{ position:'absolute', top:16, right:18, background:'none', border:'none', fontSize:22, cursor:'pointer', color:sub, lineHeight:1 }}
            >×</button>

            <div style={{ fontSize:17, fontWeight:700, color:DM?'#f1f5f9':NAVY, margin:'0 0 3px' }}>Evaluation Detail</div>
            <div style={{ fontSize:12, color:sub, marginBottom:20 }}>
              {fmtDate(selected.evaluation_date)}
              {selected.coordinator ? ` · TC: ${selected.coordinator}` : ''}
              {selected.qa_officer  ? ` · QA: ${selected.qa_officer}`  : ''}
            </div>

            {/* Score box */}
            <div style={{ textAlign:'center', padding:'18px 0', background:faint, borderRadius:12, marginBottom:22 }}>
              <div style={{ fontSize:52, fontWeight:900, color:scoreColor(selected.overall_score), lineHeight:1 }}>
                {fmtScore(selected.overall_score)}
              </div>
              <div style={{ fontSize:13, color:sub, marginTop:4 }}>out of 10</div>
              {selected.subject && <div style={{ fontSize:13, color:text, marginTop:10 }}>{selected.subject}</div>}
            </div>

            {/* Criteria */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, color:sub, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Criteria</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {CRITERIA.map(c => {
                  const pass = parseInt(selected[c.key]) === 1;
                  return (
                    <div key={c.key} style={{ display:'flex', alignItems:'center', fontSize:13, color:text, gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:pass?'#22c55e':'#ef4444', flexShrink:0, display:'inline-block' }} />
                      <span style={{ flex:1 }}>{c.label}</span>
                      <span style={{ fontWeight:700, color:pass?'#22c55e':'#ef4444', fontSize:14 }}>{pass?'✓':'✗'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop:`1px solid ${border}`, margin:'16px 0' }} />

            {/* Feedback blocks */}
            {[
              { label:'Improvement Areas', val: selected.improvement_areas },
              { label:'Positive Comments', val: selected.positive_comments  },
              { label:'Issues Noted',      val: selected.bad_comments       },
              { label:'Feedback',          val: selected.feedback           },
            ]
              .filter(b => b.val && b.val.trim() && b.val.trim().toLowerCase() !== 'n/a')
              .map(b => (
                <div key={b.label} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:sub, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{b.label}</div>
                  <div style={{ fontSize:13, color:text, background:faint, borderRadius:8, padding:'10px 14px', lineHeight:1.65 }}>{b.val}</div>
                </div>
              ))
            }

            <div style={{ borderTop:`1px solid ${border}`, margin:'14px 0' }} />

            {/* Meta pills */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
              {selected.ticket_id     && <span style={{ fontSize:12, color:sub }}>🎫 {selected.ticket_id}</span>}
              {selected.call_duration && <span style={{ fontSize:12, color:sub }}>⏱ {selected.call_duration}</span>}
              {selected.waiting_time  && <span style={{ fontSize:12, color:sub }}>⌛ Wait: {selected.waiting_time}</span>}
              {selected.hold_unhold && selected.hold_unhold !== 'Correct' && (
                <span style={{ fontSize:12, color:'#ef4444' }}>⚠️ Hold issue</span>
              )}
              <span style={badge(
                selected.coaching_status==='Done'?'#22c55e':ORANGE,
                selected.coaching_status==='Done'?'rgba(34,197,94,0.12)':'rgba(255,107,53,0.12)'
              )}>
                Coaching: {selected.coaching_status || '—'}
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}