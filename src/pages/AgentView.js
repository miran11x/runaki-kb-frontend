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

// Auto logout after 30 minutes of inactivity
const INACTIVITY_LIMIT = 30 * 60 * 1000;

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
  'inq-solar':   f => f.category === 'Inquiries' && (f.subcategory||'').toLowerCase().includes('solar'),
  'billing':     f => f.category === 'Billing Complaints',
  'general':     f => f.category === 'General Complaints',
  'service':     f => f.category === 'Service Requests',
  'feedback':    f => f.category === 'Feedback & Others',
  '_updates':    f => f.category === 'New Updates',
  '_bookmarks':  () => false,
};

const PANEL_LABELS = {
  'inquiries':'Inquiries','inq-runaki':'Runaki Project','inq-kyc':'KYC',
  'inq-billing':'Billing Inquiries','inq-dunning':'Dunning','inq-epsule':'e-Psûle',
  'inq-ussd':'USSD','inq-solar':'Solar & Other','billing':'Billing Complaints',
  'general':'General Complaints','service':'Service Requests',
  'feedback':'Feedback & Others','_updates':'New Updates',
  '_restree':'Resolution Tree','_scripts':'Scripts & Processes','_priority':'Case Priorities',
  '_search':'Search Results','_bookmarks':'⭐ Bookmarks',
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
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
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

  const tog = id => setOpen(p => ({ ...p, [id]: !p[id] }));

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
  const isSpecial = ['_restree','_scripts','_priority'].includes(panel);

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
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'12px' }}>
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
                  <div style={{ fontSize:'10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.1em', color:meta.color, marginBottom:'8px' }}>🇮🇶 Kurdish — کوردی</div>
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
        { label:'TR Access' },
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
          📞 Call Center — Click to Expand
        </div>
      </div>
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

function Priority({ DM }) {
  const levels = [
    { level:'🟢 Low', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', items:['Billing errors','KYC issues','Cap issues','High bill/debt'] },
    { level:'🟡 Medium', color:'#d97706', bg:'#fffbeb', border:'#fde68a', items:['Ongoing non-critical complaints'] },
    { level:'🟠 High', color:'#ea580c', bg:'#fff7ed', border:'#fed7aa', items:['Unplanned outage','Paid >12h still disconnected','SM issue','Private generators','Disconnection leaflet'] },
    { level:'🔴 Urgent', color:'#dc2626', bg:'#fef2f2', border:'#fecaca', items:['Maintenance non-responsive','Maintenance visited but could not resolve'] },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'14px' }}>
      {levels.map((lv,i) => (
        <div key={i} style={{ background:DM.cardBg, borderRadius:'16px', overflow:'hidden', border:`1px solid ${DM.border}` }}>
          <div style={{ background:lv.bg, padding:'16px 18px', borderBottom:`2px solid ${lv.border}` }}>
            <div style={{ fontSize:'16px', fontWeight:'800', color:lv.color }}>{lv.level}</div>
          </div>
          <div style={{ padding:'14px 18px' }}>
            {lv.items.map((item,j) => (
              <div key={j} style={{ display:'flex', gap:'10px', padding:'6px 0', borderBottom:j<lv.items.length-1?`1px solid ${DM.border}`:'none' }}>
                <span style={{ color:lv.color, flexShrink:0, fontSize:'12px', marginTop:'2px' }}>●</span>
                <span style={{ fontSize:'13.5px', color:DM.subText, lineHeight:'1.5' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const S = {
  layout: { display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter','Segoe UI',sans-serif" },
  body: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 },
  content: { flex:1, overflowY:'auto', padding:'24px 28px' },
};