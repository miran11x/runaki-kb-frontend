import React, { useEffect, useState, useMemo } from 'react';

const NAVY   = '#0B1120';
const ORANGE = '#FF6B35';
const BASE   = process.env.REACT_APP_API_URL || 'https://runaki-kb-api.vercel.app';

const CRITERIA = [
  { key: 'greeting_script',  label: 'Greeting Script',   icon: '👋' },
  { key: 'customer_info',    label: 'Customer Info',      icon: '👤' },
  { key: 'faq_alignment',    label: 'FAQ Alignment',      icon: '📚' },
  { key: 'correct_tagging',  label: 'Correct Tagging',    icon: '🏷️' },
  { key: 'communication',    label: 'Communication',      icon: '💬' },
  { key: 'tone_of_voice',    label: 'Tone of Voice',      icon: '🎙️' },
  { key: 'ending',           label: 'Ending Script',      icon: '✅' },
  { key: 'rude_behaviour',   label: 'Rude Behaviour',     icon: '🚫' },
  { key: 'hang_up',          label: 'Hang Up',            icon: '📵' },
  { key: 'active_listening', label: 'Active Listening',   icon: '👂' },
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
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return String(d); }
}

function fmtScore(s) {
  const n = parseFloat(s);
  if (isNaN(n)) return '—';
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
}

// ── GlowCard same style as AdminPanel ────────────────────────────────────────
function GlowCard({ icon, label, value, color, sub, dark }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: dark ? 'linear-gradient(145deg,#0f1623,#111827)' : '#fff',
        borderRadius: 22, padding: '24px 22px',
        border: `1px solid ${color}30`,
        boxShadow: hov
          ? `0 0 0 1px ${color}50, 0 8px 32px ${color}30, inset 0 1px 0 rgba(255,255,255,0.06)`
          : `0 0 0 1px ${color}20, 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
        position: 'relative', overflow: 'hidden',
        transition: 'all .25s cubic-bezier(0.4,0,0.2,1)',
        transform: hov ? 'translateY(-3px)' : 'none', cursor: 'default',
      }}
    >
      {/* Glow blob top-right */}
      <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'120px', height:'120px', background:`radial-gradient(circle,${color}25 0%,transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />
      {/* Icon circle */}
      <div style={{ position:'absolute', top:14, right:14, width:50, height:50, borderRadius:'50%', border:`2px solid ${color}40`, boxShadow:`0 0 14px ${color}30,inset 0 0 12px ${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, background:`radial-gradient(circle,${color}15,transparent)` }}>
        {icon}
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize:36, fontWeight:900, color: dark ? '#fff' : NAVY, letterSpacing:'-0.03em', lineHeight:1, textShadow:`0 0 20px ${color}50` }}>{value ?? '—'}</div>
        <div style={{ fontSize:11, fontWeight:700, color: dark ? 'rgba(255,255,255,0.4)' : '#94a3b8', marginTop:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</div>
        {sub && <div style={{ fontSize:11, color, marginTop:4, fontWeight:600 }}>{sub}</div>}
      </div>
      {/* Bottom shimmer line */}
      <div style={{ position:'absolute', bottom:0, left:'20%', right:'20%', height:2, background:`linear-gradient(90deg,transparent,${color}80,transparent)`, borderRadius:2 }} />
    </div>
  );
}

export default function MyEvaluations({ darkMode }) {
  const DM     = darkMode;
  const bg     = DM ? '#080e18' : '#f0f4ff';
  const card   = DM ? 'linear-gradient(145deg,#0f1623,#111827)' : '#fff';
  const cardSolid = DM ? '#111827' : '#fff';
  const border = DM ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const text   = DM ? '#e2e8f0' : '#1e293b';
  const sub    = DM ? '#94a3b8' : '#64748b';
  const faint  = DM ? 'rgba(255,255,255,0.04)' : '#f8fafc';
  const rowAlt = DM ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)';

  const [evals,    setEvals]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('rk_token') || '';
    fetch(`${BASE}/api/evaluations/mine`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          data.sort((a, b) => new Date(b.evaluation_date) - new Date(a.evaluation_date));
          setEvals(data);
        } else setEvals([]);
      })
      .catch(() => setError('Failed to load evaluations. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const avgScore = useMemo(() => {
    const valid = evals.filter(e => !isNaN(parseFloat(e.overall_score)));
    if (!valid.length) return null;
    return (valid.reduce((a, e) => a + parseFloat(e.overall_score), 0) / valid.length).toFixed(1);
  }, [evals]);

  const doneCount    = useMemo(() => evals.filter(e => e.coaching_status === 'Done').length, [evals]);
  const pendingCount = useMemo(() => evals.filter(e => e.coaching_status === 'Pending').length, [evals]);

  const criteriaStats = useMemo(() => {
    if (!evals.length) return {};
    return CRITERIA.reduce((acc, c) => {
      acc[c.key] = Math.round((evals.filter(e => parseInt(e[c.key]) === 1).length / evals.length) * 100);
      return acc;
    }, {});
  }, [evals]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:16, background:bg }}>
      <div style={{ width:48, height:48, borderRadius:'50%', border:`3px solid ${ORANGE}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
      <div style={{ color:sub, fontSize:14 }}>Loading your evaluations...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:12, background:bg }}>
      <div style={{ fontSize:44 }}>⚠️</div>
      <div style={{ fontSize:15, fontWeight:700, color:'#ef4444' }}>{error}</div>
    </div>
  );

  if (!evals.length) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:12, background:bg }}>
      <div style={{ fontSize:50 }}>📋</div>
      <div style={{ fontSize:17, fontWeight:800, color: DM?'#e2e8f0':NAVY }}>No evaluations yet</div>
      <div style={{ fontSize:13, color:sub, textAlign:'center', maxWidth:360 }}>Your QA officer evaluations will appear here once uploaded.</div>
    </div>
  );

  return (
    <div style={{ background:bg, minHeight:'100%', color:text }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding:'22px 28px 18px', borderBottom:`1px solid ${border}`, background: DM?'linear-gradient(145deg,#0f1623,#111827)':'#fff', position:'sticky', top:0, zIndex:10, boxShadow: DM?'0 4px 24px rgba(0,0,0,0.4)':'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize:20, fontWeight:800, color: DM?'#f1f5f9':NAVY }}>📋 My Evaluations</div>
        <div style={{ fontSize:13, color:sub, marginTop:3 }}>{evals.length} evaluation{evals.length!==1?'s':''} on record</div>
      </div>

      <div style={{ padding:'24px 28px', animation:'fadeUp 0.4s ease' }}>

        {/* ── GlowCards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
          <GlowCard icon="⭐" label="Avg Score / 10" value={avgScore ?? '—'} color={avgScore ? scoreColor(avgScore) : '#6366f1'} sub={avgScore ? (parseFloat(avgScore)>=9?'Excellent':parseFloat(avgScore)>=7?'Good':'Needs Work') : undefined} dark={DM} />
          <GlowCard icon="📋" label="Total Evals"    value={evals.length} color="#6366f1" sub="All time" dark={DM} />
          <GlowCard icon="✅" label="Coaching Done"  value={doneCount}    color="#22c55e" sub={`${Math.round((doneCount/evals.length)*100)}% complete`} dark={DM} />
          <GlowCard icon="⏳" label="Pending"        value={pendingCount} color={pendingCount>0?ORANGE:'#64748b'} sub={pendingCount>0?'Action needed':'All clear'} dark={DM} />
        </div>

        {/* ── Criteria breakdown ── */}
        <div style={{ background:card, borderRadius:20, padding:22, border:`1px solid ${border}`, boxShadow: DM?'0 4px 24px rgba(0,0,0,0.3)':'0 4px 24px rgba(11,17,32,0.06)', marginBottom:28, position:'relative', overflow:'hidden' }}>
          {/* Accent top bar */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${ORANGE},${ORANGE}60,transparent)`, borderRadius:'20px 20px 0 0' }} />
          <div style={{ fontSize:14, fontWeight:800, color: DM?'#f1f5f9':NAVY, marginBottom:4 }}>📊 Criteria Breakdown</div>
          <div style={{ fontSize:11, color:sub, marginBottom:18 }}>Pass rate across all {evals.length} evaluations</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 }}>
            {CRITERIA.map(c => {
              const pct   = criteriaStats[c.key] ?? 0;
              const color = pct>=90?'#22c55e':pct>=70?ORANGE:'#ef4444';
              return (
                <div key={c.key}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:600, color: DM?'rgba(255,255,255,0.7)':NAVY }}>
                      <span style={{ marginRight:6 }}>{c.icon}</span>{c.label}
                    </span>
                    <span style={{ fontSize:12, fontWeight:800, color }}>{pct}%</span>
                  </div>
                  <div style={{ height:7, background: DM?'rgba(255,255,255,0.08)':'#f1f5f9', borderRadius:100, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}cc)`, borderRadius:100, boxShadow:`0 0 8px ${color}50`, transition:'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Evaluations Table ── */}
        <div style={{ background:card, borderRadius:20, border:`1px solid ${border}`, boxShadow: DM?'0 4px 24px rgba(0,0,0,0.3)':'0 4px 24px rgba(11,17,32,0.06)', overflow:'hidden', position:'relative' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,#6366f1,#8b5cf6,transparent)`, borderRadius:'20px 20px 0 0' }} />
          <div style={{ padding:'18px 22px 14px', borderBottom:`1px solid ${border}` }}>
            <div style={{ fontSize:14, fontWeight:800, color: DM?'#f1f5f9':NAVY }}>🗂️ All Evaluations</div>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background: DM?'rgba(255,255,255,0.04)':faint }}>
                {['Date','Subject','Coordinator','QA Officer','Score','Coaching',''].map((h,i) => (
                  <th key={i} style={{ padding:'10px 16px', fontSize:10, fontWeight:800, color:sub, textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'left', borderBottom:`1px solid ${border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evals.map((e, i) => {
                const score  = parseFloat(e.overall_score);
                const sColor = scoreColor(e.overall_score);
                const isDone = e.coaching_status === 'Done';
                return (
                  <tr key={e.id} style={{ background: i%2===0?'transparent':rowAlt, transition:'background 0.15s' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = DM?'rgba(255,255,255,0.04)':'rgba(99,102,241,0.04)'}
                    onMouseLeave={ev => ev.currentTarget.style.background = i%2===0?'transparent':rowAlt}
                  >
                    <td style={{ padding:'12px 16px', fontSize:12, color:sub, borderBottom:`1px solid ${border}`, whiteSpace:'nowrap' }}>{fmtDate(e.evaluation_date)}</td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:text, borderBottom:`1px solid ${border}`, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.subject||'—'}</td>
                    <td style={{ padding:'12px 16px', fontSize:12, color:sub, borderBottom:`1px solid ${border}`, whiteSpace:'nowrap' }}>{e.coordinator||'—'}</td>
                    <td style={{ padding:'12px 16px', fontSize:12, color:sub, borderBottom:`1px solid ${border}`, whiteSpace:'nowrap' }}>{e.qa_officer||'—'}</td>
                    <td style={{ padding:'12px 16px', borderBottom:`1px solid ${border}` }}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:`${sColor}18`, border:`1px solid ${sColor}40`, borderRadius:100, padding:'3px 12px' }}>
                        <span style={{ fontSize:15, fontWeight:900, color:sColor }}>{fmtScore(e.overall_score)}</span>
                        <span style={{ fontSize:10, color:sColor, opacity:0.7 }}>/10</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', borderBottom:`1px solid ${border}` }}>
                      <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:100, fontSize:11, fontWeight:800,
                        background: isDone?'rgba(34,197,94,0.15)':'rgba(255,107,53,0.15)',
                        color:       isDone?'#22c55e':ORANGE,
                        border:     `1px solid ${isDone?'rgba(34,197,94,0.3)':'rgba(255,107,53,0.3)'}`,
                      }}>
                        {isDone ? '✓ Done' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px', borderBottom:`1px solid ${border}` }}>
                      <button
                        onClick={() => setSelected(e)}
                        style={{
                          background:`linear-gradient(135deg,#6366f1,#8b5cf6)`,
                          color:'#fff', border:'none', borderRadius:10,
                          padding:'7px 16px', fontSize:12, fontWeight:700,
                          cursor:'pointer', fontFamily:'inherit',
                          boxShadow:'0 4px 12px rgba(99,102,241,0.4)',
                          transition:'all 0.2s',
                        }}
                        onMouseEnter={ev => { ev.target.style.transform='translateY(-1px)'; ev.target.style.boxShadow='0 6px 16px rgba(99,102,241,0.5)'; }}
                        onMouseLeave={ev => { ev.target.style.transform='none'; ev.target.style.boxShadow='0 4px 12px rgba(99,102,241,0.4)'; }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fadeUp 0.2s ease' }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: DM?'#111827':'#fff', border:`1px solid ${border}`, borderRadius:24, width:'100%', maxWidth:620, maxHeight:'90vh', overflowY:'auto', position:'relative', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal accent bar */}
            <div style={{ height:4, background:`linear-gradient(90deg,${scoreColor(selected.overall_score)},${scoreColor(selected.overall_score)}60,transparent)`, borderRadius:'24px 24px 0 0' }} />

            <div style={{ padding:28 }}>
              {/* Close */}
              <button onClick={() => setSelected(null)}
                style={{ position:'absolute', top:18, right:20, background: DM?'rgba(255,255,255,0.1)':'#f1f5f9', border:'none', borderRadius:'50%', width:32, height:32, fontSize:16, cursor:'pointer', color:sub, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

              {/* Title */}
              <div style={{ fontSize:17, fontWeight:800, color: DM?'#f1f5f9':NAVY, marginBottom:2 }}>Evaluation Detail</div>
              <div style={{ fontSize:12, color:sub, marginBottom:22 }}>
                {fmtDate(selected.evaluation_date)}
                {selected.coordinator ? ` · TC: ${selected.coordinator}` : ''}
                {selected.qa_officer  ? ` · QA: ${selected.qa_officer}`  : ''}
              </div>

              {/* Big score */}
              <div style={{ textAlign:'center', padding:'20px 0', background: DM?'rgba(255,255,255,0.04)':'#f8fafc', borderRadius:16, marginBottom:24, border:`1px solid ${scoreColor(selected.overall_score)}30` }}>
                <div style={{ fontSize:60, fontWeight:900, color:scoreColor(selected.overall_score), lineHeight:1, textShadow:`0 0 30px ${scoreColor(selected.overall_score)}50` }}>
                  {fmtScore(selected.overall_score)}
                </div>
                <div style={{ fontSize:13, color:sub, marginTop:4 }}>out of 10</div>
                {selected.subject && <div style={{ fontSize:13, color:text, marginTop:10, fontWeight:600 }}>{selected.subject}</div>}
              </div>

              {/* Criteria */}
              <div style={{ marginBottom:22 }}>
                <div style={{ fontSize:11, fontWeight:800, color:sub, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Criteria</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {CRITERIA.map(c => {
                    const pass = parseInt(selected[c.key]) === 1;
                    return (
                      <div key={c.key} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, background: pass ? (DM?'rgba(34,197,94,0.08)':'rgba(34,197,94,0.06)') : (DM?'rgba(239,68,68,0.08)':'rgba(239,68,68,0.05)'), border:`1px solid ${pass?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.15)'}` }}>
                        <span style={{ fontSize:14 }}>{c.icon}</span>
                        <span style={{ flex:1, fontSize:12, fontWeight:600, color:text }}>{c.label}</span>
                        <span style={{ fontSize:16, fontWeight:900, color:pass?'#22c55e':'#ef4444' }}>{pass?'✓':'✗'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop:`1px solid ${border}`, margin:'18px 0' }} />

              {/* Feedback blocks */}
              {[
                { label:'💡 Improvement Areas', val: selected.improvement_areas, accent:'#f59e0b' },
                { label:'👍 Positive Comments',  val: selected.positive_comments,  accent:'#22c55e' },
                { label:'⚠️ Issues Noted',       val: selected.bad_comments,       accent:'#ef4444' },
                { label:'📝 Feedback',           val: selected.feedback,           accent:'#6366f1' },
              ]
                .filter(b => b.val && b.val.trim() && b.val.trim().toLowerCase() !== 'n/a' && b.val.trim() !== '—')
                .map(b => (
                  <div key={b.label} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:11, fontWeight:800, color:b.accent, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:7 }}>{b.label}</div>
                    <div style={{ fontSize:13, color:text, background: DM?'rgba(255,255,255,0.04)':'#f8fafc', border:`1px solid ${b.accent}25`, borderLeft:`3px solid ${b.accent}`, borderRadius:'0 10px 10px 0', padding:'10px 14px', lineHeight:1.7 }}>
                      {b.val}
                    </div>
                  </div>
                ))
              }

              <div style={{ borderTop:`1px solid ${border}`, margin:'18px 0 0' }} />

              {/* Meta pills */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:14, alignItems:'center' }}>
                {selected.ticket_id     && <span style={{ fontSize:12, color:sub, background:faint, border:`1px solid ${border}`, borderRadius:20, padding:'3px 12px' }}>🎫 {selected.ticket_id}</span>}
                {selected.call_duration && <span style={{ fontSize:12, color:sub, background:faint, border:`1px solid ${border}`, borderRadius:20, padding:'3px 12px' }}>⏱ {selected.call_duration}</span>}
                {selected.waiting_time  && <span style={{ fontSize:12, color:sub, background:faint, border:`1px solid ${border}`, borderRadius:20, padding:'3px 12px' }}>⌛ {selected.waiting_time}</span>}
                {selected.hold_unhold && selected.hold_unhold !== 'Correct' && (
                  <span style={{ fontSize:12, color:'#ef4444', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:20, padding:'3px 12px' }}>⚠️ Hold Issue</span>
                )}
                <span style={{ fontSize:12, fontWeight:700,
                  color:       selected.coaching_status==='Done'?'#22c55e':ORANGE,
                  background:  selected.coaching_status==='Done'?'rgba(34,197,94,0.12)':'rgba(255,107,53,0.12)',
                  border:     `1px solid ${selected.coaching_status==='Done'?'rgba(34,197,94,0.3)':'rgba(255,107,53,0.3)'}`,
                  borderRadius:20, padding:'3px 12px',
                }}>
                  {selected.coaching_status==='Done'?'✓ Coaching Done':'⏳ Coaching Pending'}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}