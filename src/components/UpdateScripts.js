import React, { useEffect, useState } from 'react';

const NAVY   = '#0B1120';
const ORANGE = '#FF6B35';
const BASE   = process.env.REACT_APP_API_URL || 'https://runaki-kb-api.vercel.app';

const LANGS = [
  { key: 'sorani',  label: 'کوردی سۆرانی', rtl: true,  flag: '🟢' },
  { key: 'badini',  label: 'کوردی بادینی', rtl: true,  flag: '🔵' },
  { key: 'arabic',  label: 'العربية',       rtl: true,  flag: '🟡' },
  { key: 'english', label: 'English',        rtl: false, flag: '🔴' },
];

export default function UpdateScripts({ darkMode }) {
  const DM      = darkMode;
  const card    = DM ? 'linear-gradient(145deg,#0f1623,#111827)' : '#fff';
  const border  = DM ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const text    = DM ? '#e2e8f0' : '#1e293b';
  const sub     = DM ? '#94a3b8' : '#64748b';
  const faint   = DM ? 'rgba(255,255,255,0.04)' : '#f8fafc';

  const [script,  setScript]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang,    setLang]    = useState('sorani');

  useEffect(() => {
    fetch(`${BASE}/api/scripts/published`)
      .then(r => r.json())
      .then(d => { setScript(d); setLoading(false); })
      .catch(() => setLoading(false));

    // Mark as seen — clear badge
    localStorage.setItem('rk_script_seen', Date.now());
  }, []);

  const activeLang = LANGS.find(l => l.key === lang);
  const content    = script?.[lang];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300, color:sub }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', border:`3px solid ${ORANGE}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
        <div style={{ fontSize:13 }}>Loading...</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!script) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:380, gap:14 }}>
      <div style={{ fontSize:56 }}>✅</div>
      <div style={{ fontSize:18, fontWeight:800, color: DM?'#e2e8f0':NAVY }}>No Active Alerts</div>
      <div style={{ fontSize:13, color:sub, textAlign:'center', maxWidth:340, lineHeight:1.7 }}>
        There are currently no active system updates or script notices. All systems are running normally.
      </div>
    </div>
  );

  return (
    <div style={{ padding:'24px 28px', color:text }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .lang-btn:hover{opacity:0.85}
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 8px #ef4444', animation:'spin 2s linear infinite' }} />
          <span style={{ fontSize:11, fontWeight:800, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.1em' }}>Live Alert</span>
        </div>
        <div style={{ fontSize:22, fontWeight:900, color: DM?'#f1f5f9':NAVY, lineHeight:1.2 }}>{script.topic}</div>
      </div>

      {/* ── Language tabs ── */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {LANGS.map(l => {
          const hasContent = !!(script[l.key]?.trim());
          const isActive   = lang === l.key;
          return (
            <button
              key={l.key}
              className="lang-btn"
              onClick={() => setLang(l.key)}
              disabled={!hasContent}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'9px 18px', borderRadius:12,
                border: isActive ? `2px solid ${ORANGE}` : `1.5px solid ${border}`,
                background: isActive
                  ? `linear-gradient(135deg,${ORANGE}20,${ORANGE}10)`
                  : hasContent ? faint : 'transparent',
                color: isActive ? ORANGE : hasContent ? text : sub,
                fontSize:13, fontWeight: isActive ? 800 : 600,
                cursor: hasContent ? 'pointer' : 'not-allowed',
                opacity: hasContent ? 1 : 0.4,
                transition:'all 0.2s', fontFamily:'inherit',
                boxShadow: isActive ? `0 0 0 1px ${ORANGE}30, 0 4px 12px ${ORANGE}20` : 'none',
              }}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {!hasContent && <span style={{ fontSize:10, color:sub }}>(empty)</span>}
            </button>
          );
        })}
      </div>

      {/* ── Script content ── */}
      {content ? (
        <div style={{ animation:'fadeIn 0.3s ease' }}>
          {/* Language indicator */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <span style={{ fontSize:18 }}>{activeLang.flag}</span>
            <span style={{ fontSize:12, fontWeight:700, color:sub, textTransform:'uppercase', letterSpacing:'0.07em' }}>{activeLang.label}</span>
            {activeLang.rtl && (
              <span style={{ fontSize:10, background:'rgba(99,102,241,0.15)', color:'#6366f1', border:'1px solid rgba(99,102,241,0.3)', borderRadius:20, padding:'2px 8px', fontWeight:700 }}>RTL</span>
            )}
          </div>

          {/* Script box */}
          <div style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 18,
            padding: '28px 32px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: DM ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(11,17,32,0.06)',
            direction: activeLang.rtl ? 'rtl' : 'ltr',
            textAlign: activeLang.rtl ? 'right' : 'left',
          }}>
            {/* Accent bar */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${ORANGE},${ORANGE}60,transparent)`, borderRadius:'18px 18px 0 0' }} />

            {/* Quote mark */}
            <div style={{ fontSize:48, color: DM?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.05)', lineHeight:1, marginBottom:8, direction:'ltr', textAlign: activeLang.rtl?'right':'left' }}>"</div>

            <p style={{
              fontSize: 16,
              lineHeight: 2,
              color: text,
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontWeight: 500,
              letterSpacing: activeLang.rtl ? '0.01em' : 'normal',
            }}>
              {content}
            </p>
          </div>

          {/* Copy button */}
          <div style={{ display:'flex', justifyContent: activeLang.rtl ? 'flex-start' : 'flex-end', marginTop:14 }}>
            <button
              onClick={() => { navigator.clipboard.writeText(content); }}
              style={{
                background:`linear-gradient(135deg,#6366f1,#8b5cf6)`,
                color:'#fff', border:'none', borderRadius:10,
                padding:'9px 20px', fontSize:12, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
                boxShadow:'0 4px 12px rgba(99,102,241,0.35)',
              }}
            >
              📋 Copy Script
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign:'center', padding:'40px 0', color:sub }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🈳</div>
          <div style={{ fontSize:14 }}>No {activeLang.label} script available for this alert.</div>
        </div>
      )}
    </div>
  );
}