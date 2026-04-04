/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import toast from 'react-hot-toast';

const NAVY  = '#0B1120';
const ORANGE = '#FF6B35';
const BG = '#f0f4ff';

// Auto logout after 8 hours of inactivity
const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000;

const CAT_META = {
  'Inquiries':          { color:'#6366f1', bg:'#eef2ff', grad:'linear-gradient(135deg,#6366f1,#4f46e5)' },
  'Billing Complaints': { color:'#ef4444', bg:'#fef2f2', grad:'linear-gradient(135deg,#ef4444,#dc2626)' },
  'General Complaints': { color:'#8b5cf6', bg:'#f5f3ff', grad:'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  'Service Requests':   { color:'#10b981', bg:'#ecfdf5', grad:'linear-gradient(135deg,#10b981,#059669)' },
  'Feedback & Others':  { color:'#f59e0b', bg:'#fffbeb', grad:'linear-gradient(135deg,#f59e0b,#d97706)' },
  'New Updates':        { color:'#f97316', bg:'#fff7ed', grad:'linear-gradient(135deg,#f97316,#ea580c)' },
};

const PANEL_FILTER = {
  'inquiries':   f => f.category === 'Inquiries',
  'inq-runaki':  f => f.category === 'Inquiries' && (f.subcategory||'').toLowerCase().includes('runaki'),
  'inq-kyc':     f => f.category === 'Inquiries' && (f.subcategory||'').toLowerCase().includes('kyc'),
  'inq-billing': f => f.category === 'Inquiries' && (f.subcategory||'').toLowerCase().includes('billing'),
  'inq-dunning': f => f.category === 'Inquiries' && (f.subcategory||'').toLowerCase().includes('dunning'),
  'inq-epsule':  f => f.category === 'Inquiries' && (f.subcategory||'').toLowerCase().includes('psule'),
  'inq-ussd':    f => f.category === 'Inquiries' && (f.subcategory||'').toLowerCase().includes('ussd'),
  'inq-solar':   f => f.category === 'Inquiries' && ((f.subcategory||'').toLowerCase().includes('solar') || (f.subcategory||'').toLowerCase().includes('other') || (f.subcategory||'') === ''),
  'billing':     f => f.category === 'Billing Complaints',
  'general':     f => f.category === 'General Complaints',
  'service':     f => f.category === 'Service Requests',
  'feedback':    f => f.category === 'Feedback & Others',
  '_updates':    f => f.category === 'New Updates',
  '_bookmarks':  () => false,
  '_kyc':        () => false,
  '_holdunhold': () => false,
  '_traccess':   () => false,
  '_callflows':  () => false,
};

const PANEL_LABELS = {
  'inquiries':'Inquiries','inq-runaki':'Runaki Project','inq-kyc':'KYC',
  'inq-billing':'Billing Inquiries','inq-dunning':'Dunning','inq-epsule':'e-Psûle',
  'inq-ussd':'USSD','inq-solar':'Solar & Other','billing':'Billing Complaints',
  'general':'General Complaints','service':'Service Requests',
  'feedback':'Feedback & Others','_updates':'New Updates',
  '_restree':'Resolution Tree','_scripts':'Scripts & Processes','_priority':'Case Priorities',
  '_search':'Search Results','_bookmarks':'⭐ Bookmarks',
  '_kyc':'KYC Platform Outputs','_holdunhold':'Hold & Unhold Process','_traccess':'TR Access Scheduling',
};

export default function AgentView() {
  const { user, logout } = useAuth();
  const [faqs, setFaqs]           = useState([]);
  const [tip, setTip]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [panel, setPanel]         = useState('billing');
  const [lang, setLang]           = useState('en');
  const [search, setSearch]       = useState('');
  const [open, setOpen]           = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [ratings, setRatings]     = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [darkMode, setDarkMode]   = useState(() => localStorage.getItem('rk_dark') === '1');
  const inactivityTimer           = useRef(null);

  // Dark mode colors
  const DM = darkMode ? {
    bg:'#0f1623', cardBg:'#1a2235', border:'rgba(255,255,255,0.08)',
    text:'#e2e8f0', subText:'rgba(255,255,255,0.5)', shadow:'0 2px 8px rgba(0,0,0,0.4)'
  } : {
    bg:BG, cardBg:'#fff', border:'#e2e8f0',
    text:NAVY, subText:'#64748b', shadow:'0 2px 8px rgba(0,0,0,0.05)'
  };

  // Auto logout on inactivity
  const resetTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      await logout();
      toast('Logged out due to inactivity', { icon: '⏱️' });
    }, INACTIVITY_LIMIT);
  }, [logout]);

  useEffect(() => {
    const events = ['mousedown','mousemove','keypress','scroll','touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    // Logout when PC sleeps, screen locks, or browser closes
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // Save the time when page became hidden
        sessionStorage.setItem('rk_hidden_at', Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        const hiddenAt = sessionStorage.getItem('rk_hidden_at');
        if (hiddenAt) {
          const elapsed = Date.now() - parseInt(hiddenAt);
          if (elapsed >= INACTIVITY_LIMIT) {
            logout();
            toast('Logged out due to inactivity', { icon: '⏱️' });
          }
          sessionStorage.removeItem('rk_hidden_at');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(inactivityTimer.current);
    };
  }, [resetTimer]);

  const load = useCallback(async () => {
    try {
      const [fr, tr, br, rr, ar] = await Promise.all([
        api.get('/faqs'),
        api.get('/tips/latest').catch(() => ({ data: null })),
        api.get('/bookmarks/ids').catch(() => ({ data: [] })),
        api.get('/ratings/mine/all').catch(() => ({ data: [] })),
        api.get('/announcements').catch(() => ({ data: [] })),
      ]);
      setFaqs(fr.data);
      if (tr.data) setTip(tr.data);
      setBookmarks(br.data);
      const rmap = {};
      rr.data.forEach(r => { rmap[r.faq_id] = r.helpful; });
      setRatings(rmap);
      setAnnouncements(ar.data);
    } catch (err) {
      console.error('Load error:', err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tog = (id) => {
    const isOpening = !open[id];
    setOpen(p => ({ ...p, [id]: !p[id] }));
    // Track view when opening
    if (isOpening) {
      api.patch(`/faqs/${id}/view`).catch(() => {});
    }
  };

  const toggleBookmark = async (faqId) => {
    try {
      const r = await api.post(`/bookmarks/${faqId}`);
      if (r.data.bookmarked) {
        setBookmarks(prev => [...prev, faqId]);
        toast.success('Bookmarked ⭐');
      } else {
        setBookmarks(prev => prev.filter(id => id !== faqId));
        toast('Bookmark removed');
      }
    } catch { toast.error('Failed'); }
  };

  const rateFaq = async (faqId, helpful) => {
    try {
      await api.post(`/ratings/${faqId}`, { helpful });
      setRatings(prev => ({ ...prev, [faqId]: helpful }));
      toast.success(helpful ? 'Marked as helpful 👍' : 'Feedback recorded');
    } catch { toast.error('Failed'); }
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('rk_dark', next ? '1' : '0');
  };

  const panelFaqs = () => {
    if (panel === '_bookmarks') return faqs.filter(f => bookmarks.includes(f.id));
    if (search) return faqs.filter(f =>
      [f.question_en, f.answer_en, f.category, f.subcategory].some(x =>
        (x||'').toLowerCase().includes(search.toLowerCase())
      )
    );
    const fn = PANEL_FILTER[panel];
    return fn ? faqs.filter(fn) : [];
  };

  const grouped = items => {
    const g = {};
    items.forEach(f => {
      const k = f.subcategory || 'General';
      if (!g[k]) g[k] = [];
      g[k].push(f);
    });
    return g;
  };

  const items = panelFaqs();
  const groups = grouped(items);
  const isSpecial = ['_restree','_scripts','_priority','_kyc','_holdunhold','_traccess','_callflows'].includes(panel);

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:DM.bg, fontFamily:"'Inter',sans-serif", alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>⚡</div>
        <div style={{ fontSize:'16px', color:'#64748b', fontWeight:'700' }}>Loading Knowledge Base...</div>
      </div>
    </div>
  );

  return (
    <div style={{ ...S.layout, background: DM.bg }}>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
      `}</style>
      <Sidebar panel={panel} setPanel={p => { setPanel(p); setSearch(''); }} search={search} setSearch={setSearch} />
      <div style={S.body}>
        <Topbar
          title={PANEL_LABELS[search ? '_search' : panel] || 'Knowledge Base'}
          subtitle={search ? `${items.length} results for "${search}"` : `${items.length} topics`}
          darkMode={darkMode} onToggleDark={toggleDark}
        />
        <div style={S.content}>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div style={{ marginBottom:'18px', display:'flex', flexDirection:'column', gap:'8px' }}>
              {announcements.slice(0,3).map(ann => {
                const priColors = { urgent:'#dc2626', high:'#ea580c', normal:'#6366f1', low:'#64748b' };
                const priBg = { urgent:'#fef2f2', high:'#fff7ed', normal:'#eef2ff', low:'#f8fafc' };
                const col = priColors[ann.priority] || '#6366f1';
                return (
                  <div key={ann.id} style={{ background: darkMode ? DM.cardBg : priBg[ann.priority]||'#eef2ff', border:`1px solid ${col}30`, borderLeft:`4px solid ${col}`, borderRadius:'12px', padding:'12px 16px', animation:'slideIn .3s ease' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'13px' }}>📢</span>
                      <span style={{ fontSize:'12px', fontWeight:'800', color:col, textTransform:'uppercase', letterSpacing:'0.08em' }}>{ann.priority}</span>
                      <span style={{ fontSize:'13px', fontWeight:'700', color: DM.text, flex:1 }}>{ann.title}</span>
                      <span style={{ fontSize:'10px', color: DM.subText }}>{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize:'13px', color: DM.subText, marginTop:'6px', paddingLeft:'21px' }}>{ann.message}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Daily Tip Banner */}
          {tip && !isSpecial && !search && panel !== '_bookmarks' && (
            <div style={{ background: darkMode ? 'linear-gradient(135deg,#1a1200,#2d1a00)' : 'linear-gradient(135deg,#fff7ed,#fff3e8)', border:`1px solid ${ORANGE}40`, borderRadius:'18px', padding:'20px 24px', marginBottom:'22px', display:'flex', alignItems:'flex-start', gap:'18px', position:'relative', overflow:'hidden', boxShadow:`0 4px 20px ${ORANGE}18` }}>
              <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'160px', height:'160px', background:`${ORANGE}18`, borderRadius:'50%', filter:'blur(30px)', pointerEvents:'none' }} />
              <div style={{ width:'48px', height:'48px', background:`linear-gradient(135deg,${ORANGE},#ff9a6c)`, borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 14px ${ORANGE}35`, fontSize:'24px' }}>💡</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'10px', fontWeight:'800', color:ORANGE, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'4px' }}>Daily Tip · {tip.category}</div>
                <div style={{ fontSize:'16px', fontWeight:'800', color: darkMode?'#fed7aa':'#9a3412', marginBottom:'6px', letterSpacing:'-0.01em' }}>{tip.title}</div>
                <div style={{ fontSize:'13.5px', color: darkMode?'#fb923c':'#c2410c', lineHeight:'1.7' }}>{tip.content}</div>
              </div>
              <div style={{ fontSize:'11px', color: darkMode?'rgba(254,215,170,0.4)':'rgba(154,52,18,0.5)', fontWeight:'500', flexShrink:0, alignSelf:'flex-end' }}>by {tip.author} · {new Date(tip.created_at).toLocaleDateString()}</div>
            </div>
          )}

          {/* Lang toggle */}
          {!isSpecial && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'22px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'12px', fontWeight:'700', color: DM.subText, marginRight:'4px' }}>🌐 Language</span>
              {[['en','🇬🇧 English'],['ku','🇮🇶 کوردی'],['both','Both']].map(([l,lbl]) => (
                <button key={l} onClick={() => setLang(l)} style={{ padding:'7px 18px', borderRadius:'100px', border:`1.5px solid ${lang===l ? NAVY : DM.border}`, background: lang===l ? NAVY : DM.cardBg, fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', color: lang===l ? '#fff' : DM.subText, transition:'all .15s' }}>
                  {lbl}
                </button>
              ))}
              {search && (
                <button style={{ marginLeft:'auto', background:'#fef2f2', border:'1px solid #fecaca', color:'#ef4444', borderRadius:'100px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}
                  onClick={() => { setSearch(''); setPanel('billing'); }}>
                  ✕ Clear
                </button>
              )}
            </div>
          )}

          {/* Special panels */}
          {panel === '_restree'  && <ResolutionTree darkMode={darkMode} DM={DM} />}
          {panel === '_scripts'  && <Scripts darkMode={darkMode} DM={DM} />}
          {panel === '_priority' && <Priority darkMode={darkMode} DM={DM} />}
          {panel === '_kyc'       && <KYCPlatform darkMode={darkMode} DM={DM} />}
          {panel === '_holdunhold'&& <HoldUnhold darkMode={darkMode} DM={DM} />}
          {panel === '_traccess'  && <TRAccess darkMode={darkMode} DM={DM} />}
          {panel === '_callflows' && <CallFlows darkMode={darkMode} DM={DM} />}

          {/* Bookmarks empty */}
          {panel === '_bookmarks' && items.length === 0 && (
            <div style={{ textAlign:'center', padding:'70px 40px', background:DM.cardBg, borderRadius:'20px', border:`1px solid ${DM.border}` }}>
              <div style={{ fontSize:'52px', marginBottom:'14px' }}>⭐</div>
              <div style={{ fontSize:'20px', fontWeight:'800', color:DM.text, marginBottom:'8px' }}>No bookmarks yet</div>
              <div style={{ fontSize:'14px', color:DM.subText }}>Click the ⭐ on any FAQ to save it here</div>
            </div>
          )}

          {/* FAQ content */}
          {!isSpecial && items.length > 0 && (
            Object.entries(groups).map(([sub, subItems]) => {
              const meta = CAT_META[subItems[0]?.category] || { color:NAVY, bg:'#f1f5f9', grad:`linear-gradient(135deg,${NAVY},#1e293b)` };
              return (
                <div key={sub} style={{ marginBottom:'28px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:meta.grad, flexShrink:0 }} />
                    <span style={{ fontSize:'11px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.1em', color:meta.color, flex:1 }}>{sub}</span>
                    <span style={{ fontSize:'10px', fontWeight:'800', padding:'3px 10px', borderRadius:'100px', background: darkMode?`${meta.color}20`:meta.bg, color:meta.color }}>{subItems.length}</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(340px,100%),1fr))', gap:'12px' }}>
                    {subItems.map(f => (
                      <FAQCard key={f.id} faq={f} lang={lang} isOpen={open[f.id]} onToggle={() => tog(f.id)}
                        isBookmarked={bookmarks.includes(f.id)} onBookmark={() => toggleBookmark(f.id)}
                        myRating={ratings[f.id]} onRate={h => rateFaq(f.id, h)}
                        darkMode={darkMode} DM={DM} />
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {/* Empty state */}
          {!isSpecial && !loading && items.length === 0 && panel !== '_bookmarks' && (
            <div style={{ textAlign:'center', padding:'70px 40px', background:DM.cardBg, borderRadius:'20px', border:`1px solid ${DM.border}` }}>
              <div style={{ fontSize:'52px', marginBottom:'14px' }}>{search ? '🔍' : '📭'}</div>
              <div style={{ fontSize:'20px', fontWeight:'800', color:DM.text, marginBottom:'8px' }}>{search ? `No results for "${search}"` : 'No content here yet'}</div>
              <div style={{ fontSize:'14px', color:DM.subText }}>{search ? 'Try different keywords' : 'Content will be added soon'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FAQCard({ faq, lang, isOpen, onToggle, isBookmarked, onBookmark, myRating, onRate, darkMode, DM }) {
  const meta = CAT_META[faq.category] || { color:NAVY, bg:'#f1f5f9', grad:`linear-gradient(135deg,#0B1120,#1e293b)` };
  return (
    <div style={{ background:DM.cardBg, borderRadius:'16px', border:`1px solid ${isOpen ? '#cbd5e1' : DM.border}`, overflow:'hidden', transition:'all .2s', boxShadow: isOpen ? '0 12px 32px rgba(0,0,0,0.1)' : DM.shadow, transform: isOpen ? 'translateY(-2px)' : 'none' }}>
      <button style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'16px', background:'none', border:'none', width:'100%', cursor:'pointer', fontFamily:'inherit' }} onClick={onToggle}>
        <div style={{ width:'4px', alignSelf:'stretch', borderRadius:'4px', background:meta.grad, flexShrink:0 }} />
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ fontSize:'14px', fontWeight:'700', color:DM.text, lineHeight:'1.45', letterSpacing:'-0.01em' }}>{faq.question_en}</div>
          {(lang === 'ku' || lang === 'both') && faq.question_ku && (
            <div style={{ fontSize:'12px', color:DM.subText, direction:'rtl', textAlign:'right', marginTop:'5px', fontWeight:'500' }}>{faq.question_ku}</div>
          )}
        </div>
        <div style={{ display:'flex', gap:'6px', alignItems:'center', flexShrink:0 }}>
          {/* Bookmark button */}
          <button onClick={e => { e.stopPropagation(); onBookmark(); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', padding:'2px', color: isBookmarked ? '#f59e0b' : DM.subText, transition:'all .15s' }} title="Bookmark">
            {isBookmarked ? '⭐' : '☆'}
          </button>
          <div style={{ fontSize:'11px', transition:'transform .2s', color: isOpen ? meta.color : DM.subText, transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</div>
        </div>
      </button>
      {isOpen && (
        <div style={{ padding:'0 16px 16px 32px' }}>
          <div style={{ height:'1px', background:`${meta.color}18`, marginBottom:'14px' }} />
          {(lang === 'en' || lang === 'both') && (
            <div style={{ fontSize:'13.5px', color:DM.subText, lineHeight:'1.8', whiteSpace:'pre-line' }}>{faq.answer_en}</div>
          )}
          {(lang === 'ku' || lang === 'both') && (
            faq.answer_ku
              ? <div style={{ marginTop: lang==='both'?'14px':'0', padding:'12px 14px', background: darkMode?'rgba(255,107,53,0.08)':'#fff7ed', borderLeft:`3px solid ${meta.color}`, borderRadius:'8px' }}>
                  <div style={{ fontSize:'10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.1em', color:meta.color, marginBottom:'8px' }}>🇮🇶 Kurdish -- کوردی</div>
                  <div style={{ fontSize:'13.5px', color:DM.subText, lineHeight:'1.8', direction:'rtl', textAlign:'right', whiteSpace:'pre-line' }}>{faq.answer_ku}</div>
                </div>
              : <div style={{ marginTop:'12px', padding:'8px 12px', background: darkMode?'rgba(255,255,255,0.05)':'#f8fafc', borderRadius:'8px', fontSize:'12px', color:DM.subText, fontStyle:'italic' }}>Kurdish translation coming soon</div>
          )}
          {/* Footer: tags + rating */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'14px', flexWrap:'wrap', gap:'8px' }}>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'10px', fontWeight:'700', padding:'3px 10px', borderRadius:'6px', background: darkMode?`${meta.color}20`:meta.bg, color:meta.color }}>{faq.category}</span>
              {faq.subcategory && <span style={{ background: darkMode?'rgba(255,255,255,0.08)':'#f1f5f9', color:DM.subText, fontSize:'10px', fontWeight:'600', padding:'3px 10px', borderRadius:'6px' }}>{faq.subcategory}</span>}
            </div>
            {/* Rating */}
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              <span style={{ fontSize:'10px', color:DM.subText, fontWeight:'600' }}>Helpful?</span>
              <button onClick={() => onRate(true)} style={{ background: myRating===true ? '#f0fdf4':'none', border:`1px solid ${myRating===true ? '#22c55e':'#e2e8f0'}`, borderRadius:'8px', padding:'3px 10px', cursor:'pointer', fontSize:'13px', transition:'all .15s' }}>👍</button>
              <button onClick={() => onRate(false)} style={{ background: myRating===false ? '#fef2f2':'none', border:`1px solid ${myRating===false ? '#ef4444':'#e2e8f0'}`, borderRadius:'8px', padding:'3px 10px', cursor:'pointer', fontSize:'13px', transition:'all .15s' }}>👎</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResolutionTree({ darkMode, DM }) {
  const [expanded, setExpanded] = React.useState({});
  const tog = key => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const TREE = [
    {
      n:1, t:'Inquiries', g:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#6366f1',
      children: [
        { label:'KYC' },
        { label:'Runaki Project', children:[{label:'Rollout'},{label:'Smart Meters'},{label:'Private Generators'}] },
        { label:'Billing Inquiries', children:[{label:'Tariff'},{label:'Discounts'},{label:'Bill Amount'},{label:'Consumption'},{label:'Payment Location'}] },
        { label:'Dunning', children:[{label:'Process'},{label:'Amount/Date'}] },
        { label:'E-Psûle' },
        { label:'USSD' },
      ]
    },
    {
      n:2, t:'Billing Complaints', g:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#ef4444',
      children: [
        { label:'High Bill/High Debt' },
        { label:'Bill Not Received' },
        { label:'Wrong Tariff' },
        { label:'Zero Bill' },
        { label:'Other Billing' },
      ]
    },
    {
      n:3, t:'General Complaints', g:'linear-gradient(135deg,#8b5cf6,#7c3aed)', color:'#8b5cf6',
      children: [
        { label:'Outage', children:[{label:'Planned'},{label:'Unplanned'},{label:'Non-Payment'},{label:'SM Issue'}] },
        { label:'Message Not Received', children:[{label:'Not KYCed'},{label:'No Readings'}] },
        { label:'USSD Code' },
        { label:'Fraud' },
        { label:'Block Comms' },
        { label:'Private Generators' },
      ]
    },
    {
      n:4, t:'Service Requests', g:'linear-gradient(135deg,#10b981,#059669)', color:'#10b981',
      note:'⚠️ Redirected to CO',
      children: [
        { label:'Smart Meter', children:[{label:'Linking'},{label:'Installation'}] },
        { label:'Data Amendment' },
        { label:'Move In' },
        { label:'Move Out' },
        { label:'Temp Disconnection' },
        { label:'Debt Clearance' },
        { label:'Instalment Contract' },
        { label:'Change Holder' },
        { label:'TR Access', children:[{label:'Warning Leaflet'},{label:'Disconnection Leaflet'}] },
      ]
    },
    {
      n:5, t:'Feedback & Others', g:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#f59e0b',
      children: [
        { label:'Feedback' },
        { label:'Others' },
      ]
    },
  ];

  const TreeNode = ({ node, depth, parentKey, color }) => {
    const key = `${parentKey}-${node.label}`;
    const isOpen = expanded[key];
    const hasChildren = node.children && node.children.length > 0;
    const indent = depth * 14;
    const bg = depth === 0
      ? (darkMode ? 'rgba(255,255,255,0.1)' : '#0B1120')
      : depth === 1
        ? (darkMode ? 'rgba(255,255,255,0.06)' : `${color}12`)
        : (darkMode ? 'rgba(255,255,255,0.03)' : `${color}08`);
    const textColor = depth === 0 ? '#fff' : depth === 1 ? (darkMode?'#e2e8f0':color) : DM.subText;
    const fontSize = depth === 0 ? '12px' : depth === 1 ? '11.5px' : '11px';
    const fontWeight = depth === 0 ? '700' : depth === 1 ? '600' : '500';
    const borderColor = depth === 0 ? 'transparent' : darkMode ? 'rgba(255,255,255,0.07)' : `${color}25`;

    return (
      <div style={{ marginLeft: `${indent}px` }}>
        <button
          onClick={() => hasChildren && tog(key)}
          style={{
            width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:'6px',
            padding:'6px 10px', borderRadius:'9px', border:`1px solid ${borderColor}`,
            background:bg, cursor: hasChildren ? 'pointer':'default',
            fontFamily:'inherit', fontSize, fontWeight, color: textColor,
            marginBottom:'3px', transition:'all .15s',
          }}
        >
          {depth > 0 && <span style={{ opacity:0.3, fontSize:'10px' }}>{'└'}</span>}
          <span style={{ flex:1 }}>{node.label}</span>
          {hasChildren && (
            <span style={{ fontSize:'10px', opacity:0.6, transition:'transform .2s', display:'inline-block', transform: isOpen?'rotate(90deg)':'none' }}>›</span>
          )}
        </button>
        {isOpen && hasChildren && (
          <div style={{ marginBottom:'3px' }}>
            {node.children.map((child, i) => (
              <TreeNode key={i} node={child} depth={depth+1} parentKey={key} color={color} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'24px' }}>
        <div style={{ background:'linear-gradient(135deg,#0B1120,#1e293b)', color:'#fff', padding:'12px 36px', borderRadius:'16px', fontWeight:'800', fontSize:'15px', boxShadow:'0 8px 24px rgba(11,17,32,0.4)', display:'flex', alignItems:'center', gap:'10px' }}>
          📞 Call Center -- Click to Expand
        </div>
      </div>
      {/* Resolution Method Trees */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'24px' }}>
        {[
          { t:'Resolved with FAQ', icon:'📖', color:'#6366f1', steps:['Agent identifies customer issue','Matches to FAQ category','Reads approved answer','Confirms customer understood','Closes ticket as resolved'] },
          { t:'Resolved with Process', icon:'⚙️', color:'#10b981', steps:['Agent identifies issue requiring action','Follows standard process steps','Creates/updates CRM ticket','Notifies relevant team if needed','Closes ticket once process done'] },
          { t:'Resolved with CRM Access', icon:'💻', color:'#f59e0b', steps:['Agent checks CRM for customer data','Verifies account/meter details','Makes update or correction in CRM','Confirms change with customer','Closes ticket as resolved'] },
        ].map((tree,i) => (
          <div key={i} style={{ background: DM.cardBg, borderRadius:'16px', overflow:'hidden', border:`1.5px solid ${tree.color}30`, boxShadow:`0 4px 16px ${tree.color}12` }}>
            <div style={{ background:`linear-gradient(135deg,${tree.color}20,${tree.color}08)`, padding:'14px 18px', borderBottom:`1px solid ${tree.color}20`, display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'20px' }}>{tree.icon}</span>
              <span style={{ fontSize:'13px', fontWeight:'800', color:tree.color }}>{tree.t}</span>
            </div>
            <div style={{ padding:'14px 18px' }}>
              {tree.steps.map((step,j) => (
                <div key={j} style={{ display:'flex', gap:'10px', padding:'6px 0', borderBottom:j<tree.steps.length-1?`1px solid ${DM.border}`:'none', alignItems:'flex-start' }}>
                  <span style={{ background:tree.color, color:'#fff', borderRadius:'50%', width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:'900', flexShrink:0, marginTop:'2px' }}>{j+1}</span>
                  <span style={{ fontSize:'12.5px', color:DM.subText, lineHeight:'1.5' }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:'13px', fontWeight:'800', color:DM.subText, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'12px' }}>📞 Call Category Tree</div>
      <div style={{ display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'16px', alignItems:'flex-start' }}>
        {TREE.map(col => (
          <div key={col.n} style={{ flex:1, minWidth:'170px' }}>
            <div style={{ background:col.g, color:'#fff', padding:'10px 12px', borderRadius:'14px', fontWeight:'800', fontSize:'11.5px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
              <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:'50%', width:'22px', height:'22px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'900', flexShrink:0 }}>{col.n}</span>
              {col.t}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
              {col.children.map((node, i) => (
                <TreeNode key={i} node={node} depth={0} parentKey={`col${col.n}`} color={col.color} />
              ))}
            </div>
            {col.note && (
              <div style={{ fontSize:'11px', color:ORANGE, fontWeight:'700', padding:'6px 10px', background: darkMode?'rgba(255,107,53,0.1)':'#fff7ed', borderRadius:'9px', marginTop:'6px', border:'1px solid #fed7aa' }}>
                {col.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Scripts({ darkMode, DM }) {
  const scripts = [
    { t:'👋 Greeting', s:'Good [morning/afternoon/evening], thank you for calling Runaki. My name is [name], how may I assist you today?' },
    { t:'📋 Get User Info', s:'May I please have your name and account/meter number to look up your account?' },
    { t:'⏸️ Requesting Hold', s:'I need to place you on a brief hold while I look into this. It should take no more than 2 minutes. Is that okay?' },
    { t:'⏰ Still on Hold', s:"Thank you for holding. I'm still looking into this for you, I appreciate your patience." },
    { t:'▶️ Returning from Hold', s:'Thank you for holding, [customer name]. I have the information you need.' },
    { t:'✅ Closing', s:'Is there anything else I can help you with today? Thank you for calling Runaki. Have a great day!' },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'14px' }}>
      {scripts.map((s,i) => (
        <div key={i} style={{ background:DM.cardBg, borderRadius:'16px', padding:'20px 22px', border:`1px solid ${DM.border}`, overflow:'hidden', position:'relative' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${ORANGE},#ff9a6c)` }} />
          <div style={{ fontSize:'11px', fontWeight:'800', color:DM.text, marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.t}</div>
          <div style={{ fontSize:'14px', color:DM.subText, fontStyle:'italic', lineHeight:'1.75', borderLeft:`3px solid ${ORANGE}`, paddingLeft:'14px' }}>
            "{s.s}"
          </div>
        </div>
      ))}
    </div>
  );
}

function Priority({ DM, darkMode }) {
  const levels = [
    {
      level:'🟢 Low', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0',
      desc:'Minor issues -- handle after higher priorities.',
      items:[
        'Billing Complaints: Bill not received (>3 months) - Pending',
        'Billing Complaints: Wrong tariff applied - Pending',
        'Billing Complaints: Other billing complaints - Pending',
        'Customer-specific: Cap issue - Pending',
        'General Complaints: Message not received / KYC - Pending',
        'Billing Complaints: High Bill / High Debt - Pending',
      ]
    },
    {
      level:'🟡 Medium', color:'#d97706', bg:'#fffbeb', border:'#fde68a',
      desc:"Important but not critical -- doesn't yet affect service severely.",
      items:['Ongoing non-critical complaints']
    },
    {
      level:'🟠 High', color:'#ea580c', bg:'#fff7ed', border:'#fed7aa',
      desc:'Serious issues affecting customers -- prioritize.',
      items:[
        'Outage: Unplanned outage - Pending',
        'Customer-specific: Non-payment (paid >12h) - Pending',
        'Customer-specific: SM meter issue - Pending',
        'General Complaints: Private generators - Pending',
        'Disconnection leaflet - Pending',
        'Feedback & Others - Pending',
      ]
    },
    {
      level:'🔴 Urgent', color:'#dc2626', bg:'#fef2f2', border:'#fecaca',
      desc:'Immediate action needed -- escalations.',
      items:[
        'Customer specific (escalation 1): Maintenance non-responsive - Pending',
        'Customer specific (escalation 1): Maintenance could not support - Pending',
      ]
    },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px' }}>
      {levels.map((lv,i) => (
        <div key={i} style={{ background:DM.cardBg, borderRadius:'18px', overflow:'hidden', border:`1.5px solid ${lv.color}30`, boxShadow:`0 4px 20px ${lv.color}15` }}>
          <div style={{ background:`linear-gradient(135deg,${lv.color}18,${lv.color}08)`, padding:'18px 20px', borderBottom:`1px solid ${lv.color}25`, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'-10px', right:'-10px', width:'60px', height:'60px', background:`radial-gradient(circle,${lv.color}25,transparent)`, borderRadius:'50%' }} />
            <div style={{ fontSize:'18px', fontWeight:'900', color:lv.color }}>{lv.level}</div>
            <div style={{ fontSize:'12px', color:DM.subText, marginTop:'4px', lineHeight:'1.5' }}>{lv.desc}</div>
          </div>
          <div style={{ padding:'14px 20px' }}>
            {lv.items.map((item,j) => (
              <div key={j} style={{ display:'flex', gap:'10px', padding:'8px 0', borderBottom:j<lv.items.length-1?`1px solid ${DM.border}`:'none' }}>
                <span style={{ color:lv.color, flexShrink:0, fontSize:'10px', marginTop:'4px' }}>⬤</span>
                <span style={{ fontSize:'13px', color:DM.text, lineHeight:'1.55' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KYCPlatform({ darkMode, DM }) {
  const statuses = [
    { status:'✅ Validated', color:'#16a34a', bg:'#f0fdf4', action:'No issues from the KYC team. Be patient and wait.', badge:'Resolve the ticket.' },
    { status:'🕐 KYC Not Started', color:'#6366f1', bg:'#eef2ff', action:'Still in process. Be patient and wait.', badge:'Resolve the ticket.' },
    { status:'❌ Rejected', color:'#dc2626', bg:'#fef2f2', action:'Customer needs to re-submit their KYC.', badge:'Resolve the ticket.' },
    { status:'🚩 Flagged', color:'#d97706', bg:'#fffbeb', action:'Still in process. Be patient and wait.', badge:'Resolve the ticket.' },
    { status:'📋 KYC Not Submitted', color:'#8b5cf6', bg:'#f5f3ff', action:'Under validation process. Be patient and wait.', badge:'Resolve the ticket.' },
    { status:'⚙️ Pending Mechanical Meter Update', color:'#ea580c', bg:'#fff7ed', action:'BNF submitted a Mechanical meter instead of a bill.', badge:'Escalate to BNF team.' },
    { status:'🔍 Number Not Found in Sheet', color:'#64748b', bg:'#f8fafc', action:"BNF has not KYC'd with this phone number.", badge:'Verify with customer.' },
  ];
  return (
    <div>
      <div style={{ background: darkMode?'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05))':'linear-gradient(135deg,#eef2ff,#f5f3ff)', border:'1px solid #6366f130', borderRadius:'18px', padding:'20px 24px', marginBottom:'24px' }}>
        <div style={{ fontSize:'16px', fontWeight:'800', color:'#6366f1', marginBottom:'8px' }}>📱 KYC Platform -- How to Handle</div>
        <div style={{ fontSize:'13.5px', color:DM.subText, lineHeight:'1.75' }}>
          Whenever a customer has a KYC-related issue, always check their phone number in the system first, verify the KYC status, and ensure all details match before taking any further steps. This helps identify whether the issue is with the system, the BNF submission, or another stage of the process.
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'14px' }}>
        {statuses.map((s,i) => (
          <div key={i} style={{ background:DM.cardBg, borderRadius:'16px', overflow:'hidden', border:`1.5px solid ${s.color}30`, boxShadow:`0 4px 16px ${s.color}12` }}>
            <div style={{ background: darkMode?`${s.color}15`:s.bg, padding:'14px 18px', borderBottom:`1px solid ${s.color}20` }}>
              <div style={{ fontSize:'15px', fontWeight:'800', color:s.color }}>{s.status}</div>
            </div>
            <div style={{ padding:'14px 18px' }}>
              <div style={{ fontSize:'13.5px', color:DM.text, lineHeight:'1.6', marginBottom:'10px' }}>{s.action}</div>
              <div style={{ display:'inline-block', background:`${s.color}15`, color:s.color, fontSize:'11px', fontWeight:'800', padding:'4px 12px', borderRadius:'100px', border:`1px solid ${s.color}30` }}>
                {s.badge}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldUnhold({ darkMode, DM }) {
  const steps = [
    {
      phase:'1 -- Pre-Hold', icon:'🎙️', color:'#6366f1',
      title:'Before placing on hold',
      desc:'Before placing the customer on hold, clearly inform them and explain the reason using the approved pre-hold script.',
      script:'"I need to place you on a brief hold while I look into this for you. It should take no more than 2 minutes. Is that okay?"',
      rules:['Always inform the customer before holding','Explain the reason clearly','Get their agreement first'],
    },
    {
      phase:'2 -- During Hold', icon:'⏸️', color:'#f59e0b',
      title:'While customer is on hold',
      desc:'The call must be placed on hold -- not muted -- so that hold music plays for the customer.',
      script:null,
      rules:['Use the HOLD button -- never mute the call','Hold music must play for the customer','Check back every 2 minutes if hold is longer'],
    },
    {
      phase:'3 -- Post-Hold', icon:'▶️', color:'#10b981',
      title:'Returning from hold',
      desc:'After returning, use the approved post-hold script, apologize for the wait, and continue assisting professionally.',
      script:'"Thank you for holding, [customer name]. I have the information you need. I apologize for the wait."',
      rules:['Always thank the customer for holding','Apologize for the wait time','Use their name when returning'],
    },
  ];
  return (
    <div>
      <div style={{ background: darkMode?'rgba(99,102,241,0.1)':'#eef2ff', border:'1px solid #6366f130', borderRadius:'18px', padding:'18px 22px', marginBottom:'24px' }}>
        <div style={{ fontSize:'15px', fontWeight:'800', color:'#6366f1', marginBottom:'6px' }}>📞 Hold & Unhold -- Professional Standards</div>
        <div style={{ fontSize:'13px', color:DM.subText, lineHeight:'1.7' }}>Placing a customer on hold should be done professionally by informing them first, ensuring hold music plays, and apologizing when returning to the call.</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
        {steps.map((step,i) => (
          <div key={i} style={{ background:DM.cardBg, borderRadius:'18px', overflow:'hidden', border:`1.5px solid ${step.color}30`, boxShadow:`0 4px 20px ${step.color}12` }}>
            <div style={{ background:`linear-gradient(135deg,${step.color}20,${step.color}08)`, padding:'18px 22px', display:'flex', alignItems:'center', gap:'14px', borderBottom:`1px solid ${step.color}20` }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:`linear-gradient(135deg,${step.color},${step.color}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0, boxShadow:`0 4px 12px ${step.color}40` }}>{step.icon}</div>
              <div>
                <div style={{ fontSize:'11px', fontWeight:'800', color:step.color, textTransform:'uppercase', letterSpacing:'0.1em' }}>{step.phase}</div>
                <div style={{ fontSize:'16px', fontWeight:'800', color:DM.text, marginTop:'2px' }}>{step.title}</div>
              </div>
            </div>
            <div style={{ padding:'18px 22px' }}>
              <div style={{ fontSize:'13.5px', color:DM.subText, lineHeight:'1.7', marginBottom:'14px' }}>{step.desc}</div>
              {step.script && (
                <div style={{ background: darkMode?'rgba(255,255,255,0.04)':'#f8fafc', border:`2px solid ${step.color}30`, borderLeft:`4px solid ${step.color}`, borderRadius:'10px', padding:'12px 16px', fontSize:'13.5px', color:DM.text, fontStyle:'italic', lineHeight:'1.7', marginBottom:'14px' }}>
                  {step.script}
                </div>
              )}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {step.rules.map((r,j) => (
                  <div key={j} style={{ display:'flex', alignItems:'center', gap:'6px', background:`${step.color}12`, border:`1px solid ${step.color}25`, borderRadius:'8px', padding:'5px 12px' }}>
                    <span style={{ color:step.color, fontSize:'10px' }}>✓</span>
                    <span style={{ fontSize:'12px', fontWeight:'600', color:DM.text }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TRAccess({ darkMode, DM }) {
  const [open, setOpen] = React.useState({});
  const tog = k => setOpen(p => ({...p,[k]:!p[k]}));

  const infoBoxes = [
    { title:'📋 Info Required -- Disconnection Leaflet', color:'#ef4444', items:['Mobile number','Leaflet ID','Customer name','Account Number & Block ID','Does the customer have a bill?','Is the customer registered at the CO?','Does the customer have proof of registration or physical bill?'] },
    { title:'📋 Info Required -- Warning / Inaccessible TR', color:'#f59e0b', items:['Full Name of Customer','Location (address or area)','Zone Number','Phone Number','Leaflet ID','Bill/Account Availability','Account Number & Block ID (if available)','Date on the leaflet'] },
  ];

  const sections = [
    {
      title:'Warning Leaflet FAQs', color:'#f59e0b', icon:'⚠️',
      faqs:[
        { q:'Why did I get this leaflet?', a:'Our Runaki team attempted to access your transformer site several times without success. The leaflet is a reminder that we need your cooperation to complete the required work.' },
        { q:'What should I do?', a:"Thank you for calling. I'll take your details now and our team will call you to schedule a visit to complete the work at your location. Please be cooperative so the work can be completed." },
        { q:'When will they be coming?', a:'The exact date is not fixed, but once you provide your availability, our team will schedule the next visit promptly.' },
        { q:'Will my electricity be disconnected immediately?', a:'No. Electricity is only disconnected if we are unable to access your site after multiple attempts and no arrangement is made with you.' },
        { q:'What information do you need from me?', a:"We'll need your full name, phone number, location details, and the leaflet code. This helps us match your case quickly. Our team will call you to confirm the appointment." },
        { q:'Why is this work necessary?', a:'This work is part of the Runaki project. It improves electricity reliability and helps reduce outages in your area.' },
        { q:'Do I need to be present during the work?', a:'Yes, either you or someone you authorize must be present to provide access.' },
        { q:'What happens if I ignore the leaflet?', a:'If no action is taken, your electricity will be permanently disconnected.' },
        { q:'Will I be charged for this visit or service?', a:'No, the work is carried out free of charge as part of the Runaki project.' },
        { q:'How long will the work take?', a:'Typically ~20 minutes. Our team will inform you if more time is required.' },
        { q:'Who will be visiting?', a:'The authorized Runaki vendor team will visit under official supervision, with proper ID and safety gear.' },
      ]
    },
    {
      title:'Disconnection Leaflet FAQs', color:'#ef4444', icon:'🔴',
      faqs:[
        { q:'Why was my electricity disconnected?', a:'Your electricity was disconnected because our team could not access your site after several visits, and no contact was made to schedule the required work.' },
        { q:'How can I get my electricity back?', a:"Now that you've called, we'll arrange a visit to complete the refurbishment work. Once it's done, your electricity will be reconnected." },
        { q:'What information do you need from me?', a:"We'll need your full name, phone number, location details, and the leaflet code. Our team will call you to confirm the appointment." },
        { q:'When will the team come to restore my electricity?', a:'Our team will call you to arrange a visit, usually within the coming days, once scheduling is confirmed.' },
        { q:'Will my electricity be disconnected again if I miss the visit?', a:'Yes, electricity will remain disconnected until the refurbishment work is completed.' },
        { q:'Who will be visiting?', a:'The authorized Runaki vendor team will visit under official supervision, with proper ID and safety gear.' },
        { q:'How long does it take to restore electricity?', a:'Typically ~20 minutes. Our team will inform you if more time is required.' },
        { q:'Will I be charged for this visit?', a:'No, the work is carried out free of charge as part of the Runaki project.' },
        { q:"I already contacted the team before, why did I get another leaflet?", a:'The leaflet you received now is a disconnection leaflet. After the first call, the team was still unable to access your site. Thus, the electricity was disconnected.' },
      ]
    },
  ];

  return (
    <div>
      <div style={{ background: darkMode?'rgba(239,68,68,0.1)':'#fef2f2', border:'1px solid #ef444430', borderRadius:'18px', padding:'18px 22px', marginBottom:'22px' }}>
        <div style={{ fontSize:'15px', fontWeight:'800', color:'#ef4444', marginBottom:'6px' }}>⚡ TR Access Scheduling</div>
        <div style={{ fontSize:'13px', color:DM.subText, lineHeight:'1.7' }}>Handle all TR-related calls by capturing required information first, then scheduling a team visit. Use the scripts below for each case type.</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'14px', marginBottom:'22px' }}>
        {infoBoxes.map((box,i) => (
          <div key={i} style={{ background:DM.cardBg, borderRadius:'16px', border:`1.5px solid ${box.color}30`, overflow:'hidden' }}>
            <div style={{ background:`${box.color}15`, padding:'14px 18px', borderBottom:`1px solid ${box.color}20`, fontSize:'13px', fontWeight:'800', color:box.color }}>{box.title}</div>
            <div style={{ padding:'14px 18px' }}>
              {box.items.map((item,j) => (
                <div key={j} style={{ display:'flex', gap:'8px', padding:'5px 0', borderBottom:j<box.items.length-1?`1px solid ${DM.border}`:'none' }}>
                  <span style={{ color:box.color, fontWeight:'800', fontSize:'11px', marginTop:'2px' }}>{j+1}.</span>
                  <span style={{ fontSize:'13px', color:DM.text }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {sections.map((sec,si) => (
        <div key={si} style={{ marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
            <span style={{ fontSize:'18px' }}>{sec.icon}</span>
            <span style={{ fontSize:'14px', fontWeight:'800', color:sec.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>{sec.title}</span>
            <span style={{ background:`${sec.color}15`, color:sec.color, fontSize:'10px', fontWeight:'800', padding:'3px 10px', borderRadius:'100px' }}>{sec.faqs.length} FAQs</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {sec.faqs.map((faq,fi) => {
              const key = `${si}-${fi}`;
              const isOpen = open[key];
              return (
                <div key={fi} style={{ background:DM.cardBg, borderRadius:'14px', border:`1px solid ${isOpen?sec.color+'50':DM.border}`, overflow:'hidden', transition:'all .2s', boxShadow:isOpen?`0 4px 16px ${sec.color}15`:'none' }}>
                  <button onClick={() => tog(key)} style={{ width:'100%', display:'flex', alignItems:'center', gap:'12px', padding:'14px 18px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                    <div style={{ width:'4px', alignSelf:'stretch', background:`linear-gradient(180deg,${sec.color},${sec.color}60)`, borderRadius:'4px', flexShrink:0 }} />
                    <div style={{ flex:1, fontSize:'13.5px', fontWeight:'700', color:DM.text, textAlign:'left', lineHeight:'1.4' }}>{faq.q}</div>
                    <span style={{ fontSize:'11px', color:isOpen?sec.color:DM.subText, transition:'transform .2s', transform:isOpen?'rotate(180deg)':'none', flexShrink:0 }}>▼</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding:'0 18px 16px 34px', fontSize:'13.5px', color:DM.subText, lineHeight:'1.8', whiteSpace:'pre-line' }}>{faq.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


function CallFlows({ darkMode, DM }) {
  const [flows, setFlows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [openFlow, setOpenFlow] = React.useState(null);
  const togFlow = i => setOpenFlow(openFlow === i ? null : i);

  const AGENT_COLOR = '#3b82f6';
  const CUST_COLOR = '#10b981';
  const SYS_COLOR = '#f59e0b';
  const BRANCH_COLOR = '#8b5cf6';

  React.useEffect(() => {
    api.get('/callflows').then(r => { setFlows(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const typeStyle = (type) => {
    if (type === 'AGENT')    return { bg: darkMode ? 'rgba(59,130,246,0.12)' : '#eff6ff', border: '#3b82f6', color: AGENT_COLOR };
    if (type === 'CUSTOMER') return { bg: darkMode ? 'rgba(16,185,129,0.12)' : '#f0fdf4', border: '#10b981', color: CUST_COLOR };
    if (type === 'SYSTEM')   return { bg: darkMode ? 'rgba(245,158,11,0.12)' : '#fffbeb', border: '#f59e0b', color: SYS_COLOR };
    if (type === 'BRANCH')   return { bg: darkMode ? 'rgba(139,92,246,0.15)' : '#f5f3ff', border: '#8b5cf6', color: BRANCH_COLOR };
    return { bg: DM.cardBg, border: DM.border, color: DM.text };
  };

  if (loading) return <div style={{ textAlign:'center', padding:'40px', color:DM.subText }}>Loading call flows...</div>;
  if (!flows.length) return <div style={{ textAlign:'center', padding:'40px', color:DM.subText }}>No call flows available yet.</div>;

  return (
    <div>
      <div style={{ background: darkMode ? 'rgba(59,130,246,0.1)' : '#eff6ff', border: '1px solid #3b82f630', borderRadius: '18px', padding: '18px 22px', marginBottom: '22px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', color: '#3b82f6', marginBottom: '6px' }}>📞 Call Flow Scripts</div>
        <div style={{ fontSize: '13px', color: DM.subText, lineHeight: '1.7' }}>{flows.length} call flow scripts. Follow each step in order during live calls.</div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
          {[['🎙️ Agent', AGENT_COLOR], ['👤 Customer', CUST_COLOR], ['ℹ️ System/Action', SYS_COLOR], ['⑂ Branch', BRANCH_COLOR]].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: DM.subText }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {flows.map((flow, fi) => {
          const steps = typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps;
          return (
            <div key={flow.id} style={{ background: DM.cardBg, borderRadius: '18px', overflow: 'hidden', border: `1.5px solid ${openFlow === fi ? flow.color + '60' : DM.border}`, transition: 'all .2s' }}>
              <button onClick={() => togFlow(fi)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `linear-gradient(135deg,${flow.color},${flow.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{flow.icon}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: DM.text }}>{flow.title}</div>
                  <div style={{ fontSize: '12px', color: DM.subText, marginTop: '3px' }}>{flow.description}</div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: flow.color, background: `${flow.color}15`, padding: '4px 12px', borderRadius: '100px', flexShrink: 0 }}>{steps.length} steps</div>
                <span style={{ fontSize: '12px', color: DM.subText, transition: 'transform .2s', transform: openFlow === fi ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</span>
              </button>
              {openFlow === fi && (
                <div style={{ borderTop: `1px solid ${DM.border}`, padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {flow.note && (
                    <div style={{ background: darkMode ? 'rgba(245,158,11,0.1)' : '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: darkMode ? '#fcd34d' : '#92400e', fontWeight: '700', marginBottom: '8px' }}>{flow.note}</div>
                  )}
                  {steps.map((step, si) => {
                    const s = typeStyle(step.type);
                    return (
                      <div key={si} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{ background: s.color, color: '#fff', fontSize: '9px', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', flexShrink: 0, marginTop: '2px', whiteSpace: 'nowrap' }}>{step.type}</div>
                        <div style={{ background: s.bg, border: `1px solid ${s.border}25`, borderLeft: `3px solid ${s.border}`, borderRadius: '8px', padding: '10px 14px', flex: 1, fontSize: '13.5px', color: DM.text, lineHeight: '1.65' }}>{step.text}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


const S = {
  layout: { display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter','Segoe UI',sans-serif" },
  body: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 },
  content: { flex:1, overflowY:'auto', padding:'16px', paddingLeft:'16px' },
};