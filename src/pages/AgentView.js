import RichAnswer from '../components/RichAnswer';
import { buildIndex, searchFaqs, detectLanguage as detectQueryLanguage } from '../utils/faqSearch';
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';

import api from '../utils/api';
  import { useAuth } from '../contexts/AuthContext';
  import Sidebar from '../components/Sidebar';
  import Topbar from '../components/Topbar';
  import toast from 'react-hot-toast';
  import { Scripts, KYCPlatform, HoldUnhold } from '../components/OpsPages';
  import UpdateScripts from '../components/UpdateScripts';
  import AdminPanel from './AdminPanel';
  import EditorPanel from './EditorPanel';

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
  inquiries: f => f.category === 'Inquiries' && !f.is_shortlisted,
  billing: f => f.category === 'Billing Complaints' && !f.is_shortlisted,
  general: f => f.category === 'General Complaints' && !f.is_shortlisted,
  service: f => f.category === 'Service Requests' && !f.is_shortlisted,
  feedback: f => f.category === 'Feedback & Others' && !f.is_shortlisted,

  _updates: () => false,
  _bookmarks: () => false,
  _shortlisted: () => false,
  _kyc: () => false,
  _holdunhold: () => false,
  _traccess: () => false,
  _callflows: () => false,
  _maintenance: () => false,
  _ai: () => false,
  _admin: () => false,
  _faqeditor: () => false,
};

  const PANEL_LABELS = {
  inquiries: 'Inquiries',
  billing: 'Billing Complaints',
  general: 'General Complaints',
  service: 'Service Requests',
  feedback: 'Feedback & Others',

  '_callflows':'Call Flows',
  '_maintenance':' Maintenance Lookup',
  '_ai-kb':' Knowledge Assistant',
  '_ai-categorizer':' Case Categorizer',
  '_updates':'New Updates',
  '_restree':'Resolution Tree',
  '_scripts':'Scripts & Processes',
  '_priority':'Case Priorities',
  '_search':'Search Results',
  '_bookmarks':' Bookmarks',
  '_shortlisted':"Shortlisted FAQ's",
  '_kyc':'KYC Platform Outputs',
  '_holdunhold':'Hold & Unhold Process',
  '_traccess':'TR Access Scheduling',
  '_ai':'🤖 RUNAKI AI Assistant',
  '_admin':'Admin Panel',
  '_faqeditor':'FAQ Editor',
  '_feedback':'Feedback Center',
};

export default function AgentView() {
  const { logout, user } = useAuth();

  const [faqs, setFaqs] = useState([]);
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState('inquiries');
  const [lang, setLang] = useState('en');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [ratings, setRatings] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('rk_dark') === '1'
  );

  const inactivityTimer = useRef(null);

  // Dark mode colors
  const DM = darkMode
    ? {
        bg:'#0f1623',
        cardBg:'#1a2235',
        border:'rgba(255,255,255,0.08)',
        text:'#e2e8f0',
        subText:'rgba(255,255,255,0.5)',
        shadow:'0 2px 8px rgba(0,0,0,0.4)'
      }
    : {
        bg:BG,
        cardBg:'#fff',
        border:'#e2e8f0',
        text:NAVY,
        subText:'#64748b',
        shadow:'0 2px 8px rgba(0,0,0,0.05)'
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
      const [fr, tr, br, rr, ar, feedbackRes] = await Promise.all([
  api.get('/faqs'),
  api.get('/tips/latest').catch(() => ({ data: null })),
  api.get('/bookmarks/ids').catch(() => ({ data: [] })),
  api.get('/ratings/mine/all').catch(() => ({ data: [] })),
  api.get('/announcements').catch(() => ({ data: [] })),
  api.get('/feedback/my-feedback').catch(err => {
  console.error('Feedback load failed:', err);
  return { data: [] };
})]);
      console.log('Agent FAQs:', fr.data);
setFaqs(fr.data);


  if (tr.data) setTip(tr.data);
        setBookmarks(br.data);
        const rmap = {};
        rr.data.forEach(r => { rmap[r.faq_id] = r.helpful; });
        setRatings(rmap);
        setAnnouncements(ar.data);
        setFeedback(feedbackRes.data || []);
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

    const toggleShortlist = async (faqId) => {
      try {
        const r = await api.patch(`/faqs/${faqId}/shortlist`);
        setFaqs(prev => prev.map(f => f.id === faqId ? { ...f, is_shortlisted: r.data.is_shortlisted } : f));
        toast.success(r.data.is_shortlisted ? 'Added to Shortlisted FAQ\'s 📌' : 'Removed from Shortlisted FAQ\'s');
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

    const searchIndex = useMemo(() => buildIndex(faqs), [faqs]);

    const panelFaqs = () => {

      if (panel === '_bookmarks') return faqs.filter(f => bookmarks.includes(f.id));
      // keep the order the FAQs were imported in (the order of the source document)
      if (panel === '_shortlisted') return faqs.filter(f => f.is_shortlisted).sort((a, b) => a.id - b.id);
      if (search) return searchFaqs(searchIndex, search).map(r => r.faq);
      const fn = PANEL_FILTER[panel];
      return fn ? faqs.filter(fn) : [];
    };

const grouped = items => {
  const g = {};

  items.forEach(f => {
    const sub = f.subcategory || 'General';
    const third = f.third_level || '';

    const key =
      third && third !== '-'
        ? `${sub} › ${third}`
        : sub;

    if (!g[key]) g[key] = [];
    g[key].push(f);
  });

  return g;
};

    const items = panelFaqs();
const groups = grouped(items);

const isSpecial = [
      '_feedback',
  '_scripts',
  '_priority',
  '_kyc',
  '_holdunhold',
  '_traccess',
  '_callflows',
  '_updatescripts',
  '_ai',
  '_ai-kb',
  '_ai-categorizer',
  '_admin',
  '_faqeditor'
].includes(panel);


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
        <Sidebar
  panel={panel}
  setPanel={setPanel}
  search={search}
  setSearch={setSearch}
  faqs={faqs}
  darkMode={darkMode}
/>

        <div style={S.body}>
         
<Topbar
  title={PANEL_LABELS[search ? '_search' : panel] || 'Knowledge Base'}
  subtitle={
    search
      ? `${items.length} results for "${search}"`
      :''
  }
  darkMode={darkMode}
  onToggleDark={toggleDark}
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
            {tip && !isSpecial && !search && panel !== '_bookmarks' && panel !== '_shortlisted' && (
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
                {[
    ['en','🇬🇧 English'],
  ['ku','☀️ سۆرانی'],
  ['ba','🏔️ بادینی'],
  ['ar','🌙 العربية']
  ].map(([l,lbl]) => (
                  <button key={l} onClick={() => setLang(l)} style={{ padding:'7px 18px', borderRadius:'100px', border:`1.5px solid ${lang===l ? NAVY : DM.border}`, background: lang===l ? NAVY : DM.cardBg, fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', color: lang===l ? '#fff' : DM.subText, transition:'all .15s' }}>
                    {lbl}
                  </button>
                ))}
                {search && (
                  <button style={{ marginLeft:'auto', background:'#fef2f2', border:'1px solid #fecaca', color:'#ef4444', borderRadius:'100px', padding:'6px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}
                    onClick={() => { setSearch(''); setPanel('inquiries'); }}>
                    ✕ Clear
                  </button>
                )}
              </div>
            )}

            {/* Special panels */}
            {panel === '_scripts'  && <Scripts darkMode={darkMode} DM={DM} lang={lang} setLang={setLang} />}
            {panel === '_priority' && <Priority darkMode={darkMode} DM={DM} />}
            {panel === '_kyc'       && <KYCPlatform darkMode={darkMode} DM={DM} lang={lang} setLang={setLang} />}
            {panel === '_holdunhold'&& <HoldUnhold darkMode={darkMode} DM={DM} lang={lang} setLang={setLang} />}
            {panel === '_traccess'  && <TRAccess darkMode={darkMode} DM={DM} />}
            {panel === '_callflows' && <CallFlows darkMode={darkMode} DM={DM} />}
            {panel === '_updatescripts' && <UpdateScripts darkMode={darkMode} />}
            
{panel === '_admin' && (
 <AdminPanel darkMode={darkMode} />
)}

{panel === '_faqeditor' && (
  <EditorPanel darkMode={darkMode} />
)}

{panel === '_feedback' && (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}
  >
    <div
      style={{
        background: DM.cardBg,
        border: `1px solid ${DM.border}`,
        borderRadius: '20px',
        padding: '24px'
      }}
    >
      <h2 style={{ margin: 0 }}>💬 Feedback Center</h2>

      <p
        style={{
          color: DM.subText,
          marginTop: '10px'
        }}
      >
        Unread Feedback:{' '}
        {feedback.filter(f => f.status !== 'acknowledged').length}
      </p>
    </div>

    {feedback.length === 0 ? (
      <div
        style={{
          background: DM.cardBg,
          border: `1px solid ${DM.border}`,
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <h3>No feedback available yet</h3>

        <p style={{ color: DM.subText }}>
          Feedback will automatically appear when an evaluation score is below 30.
        </p>
      </div>
    ) : (
      feedback.map(item => (
        <div
          key={item.id}
          style={{
            background: DM.cardBg,
            border: `1px solid ${DM.border}`,
            borderRadius: '20px',
            padding: '24px'
          }}
        >
          <h3>💬 Evaluation Feedback</h3>

          <p>
            <strong>Score:</strong> {item.score}/30
          </p>

          <p>
            <strong>Status:</strong> {item.status}
          </p>

          {item.feedback_text && (
            <p>
              <strong>Feedback:</strong> {item.feedback_text}
            </p>
          )}

          <div
            style={{
              marginTop: '12px',
              color: DM.subText,
              fontSize: '12px'
            }}
          >
            {new Date(item.created_at).toLocaleString()}
          </div>
        </div>
      ))
    )}
  </div>
)}

           {['_ai', '_ai-kb', '_ai-categorizer'].includes(panel) && (
  <RUNAKIAIAssistant
    darkMode={darkMode}
    DM={DM}
    faqs={faqs}
  />
)}

            {/* Bookmarks empty */}
            {panel === '_bookmarks' && items.length === 0 && (
              <div style={{ textAlign:'center', padding:'70px 40px', background:DM.cardBg, borderRadius:'20px', border:`1px solid ${DM.border}` }}>
                <div style={{ fontSize:'52px', marginBottom:'14px' }}>⭐</div>
                <div style={{ fontSize:'20px', fontWeight:'800', color:DM.text, marginBottom:'8px' }}>No bookmarks yet</div>
                <div style={{ fontSize:'14px', color:DM.subText }}>Click the ⭐ on any FAQ to save it here</div>
              </div>
            )}

            {/* Shortlisted FAQ's empty */}
            {panel === '_shortlisted' && items.length === 0 && (
              <div style={{ textAlign:'center', padding:'70px 40px', background:DM.cardBg, borderRadius:'20px', border:`1px solid ${DM.border}` }}>
                <div style={{ fontSize:'52px', marginBottom:'14px' }}>📌</div>
                <div style={{ fontSize:'20px', fontWeight:'800', color:DM.text, marginBottom:'8px' }}>No shortlisted FAQs yet</div>
                <div style={{ fontSize:'14px', color:DM.subText }}>Your QA team hasn't pinned any FAQs here yet</div>
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
                          canShortlist={user?.role === 'qa_officer' || user?.role === 'team_lead'}
                          isShortlisted={!!f.is_shortlisted} onShortlist={() => toggleShortlist(f.id)}
                          myRating={ratings[f.id]} onRate={h => rateFaq(f.id, h)}
                          darkMode={darkMode} DM={DM} />
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            {/* Empty state */}
            {!isSpecial && !loading && items.length === 0 && panel !== '_bookmarks' && panel !== '_shortlisted' && (
              <div style={{ textAlign:'center', padding:'70px 40px', background:DM.cardBg, borderRadius:'20px', border:`1px solid ${DM.border}` }}>
               <div style={{ fontSize:'64px', marginBottom:'14px' }}>
  {search ? '🔍' : '📂'}
</div>

<div style={{
  fontSize:'22px',
  fontWeight:'800',
  color:DM.text,
  marginBottom:'8px'
}}>
  {search ? `No results for "${search}"` : 'No FAQs Available'}
</div>

<div style={{
  fontSize:'14px',
  color:DM.subText
}}>
  {search
    ? 'Try a different keyword'
    : `There are currently no approved FAQs in ${PANEL_LABELS[panel] || 'this section'}.`
  }
</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
 

  function FAQCard({ faq, lang, isOpen, onToggle, isBookmarked, onBookmark, canShortlist, isShortlisted, onShortlist, myRating, onRate, darkMode, DM }) {


    const meta = CAT_META[faq.category] || {
      color: NAVY,
      bg: '#f1f5f9',
      grad: `linear-gradient(135deg,#0B1120,#1e293b)`
    };
    return (
      <div style={{ background:DM.cardBg, borderRadius:'16px', border:`1px solid ${isOpen ? '#cbd5e1' : DM.border}`, overflow:'hidden', transition:'all .2s', boxShadow: isOpen ? '0 12px 32px rgba(0,0,0,0.1)' : DM.shadow, transform: isOpen ? 'translateY(-2px)' : 'none' }}>
        <button style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'16px', background:'none', border:'none', width:'100%', cursor:'pointer', fontFamily:'inherit' }} onClick={onToggle}>
          <div style={{ width:'4px', alignSelf:'stretch', borderRadius:'4px', background:meta.grad, flexShrink:0 }} />
          <div style={{ flex:1, textAlign:'left' }}>
            <div
  style={{
    fontSize:'14px',
    fontWeight:'700',
    color:DM.text,
    direction:
      lang === 'ku' ||
      lang === 'ba' ||
      lang === 'ar'
        ? 'rtl'
        : 'ltr',
    textAlign:
      lang === 'ku' ||
      lang === 'ba' ||
      lang === 'ar'
        ? 'right'
        : 'left'
  }}
>
{
  lang === 'en'
    ? faq.question_en
    : lang === 'ku'
    ? (faq.question_ku || faq.question_en)
    : lang === 'ba'
    ? (faq.question_ba || faq.question_en)
    : lang === 'ar'
    ? (faq.question_ar || faq.question_en)
    : faq.question_en
}
</div>
          
          </div>
          <div style={{ display:'flex', gap:'6px', alignItems:'center', flexShrink:0 }}>
            {/* Shortlist pin — QA officer / team lead only */}
            {canShortlist && (
              <button onClick={e => { e.stopPropagation(); onShortlist(); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'14px', padding:'2px', color: isShortlisted ? '#FF6B35' : DM.subText, transition:'all .15s' }} title={isShortlisted ? 'Remove from Shortlisted FAQ\'s' : 'Add to Shortlisted FAQ\'s'}>
                📌
              </button>
            )}
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
            <div
    style={{
      fontSize:'13.5px',
      color:DM.subText,
      lineHeight:'1.8',
      whiteSpace:'pre-line',
      direction:
        lang === 'ku' || lang === 'ba' || lang === 'ar'
          ? 'rtl'
          : 'ltr',
      textAlign:
        lang === 'ku' || lang === 'ba' || lang === 'ar'
          ? 'right'
          : 'left'
    }}
  >
  <RichAnswer text={
       lang === 'en' ? faq.answer_en :
       lang === 'ku' ? (faq.answer_ku || '🚧 وەرگێڕان لە ژێر ئامادەکردندایە. بەزوویی زیاد دەکرێت.') :
       lang === 'ba' ? (faq.answer_ba || '🚧 وەرگێران ل ژێر ئامادەکرنێ دایە. ب زوویی دهێتە زیادکرن.') :
       lang === 'ar' ? (faq.answer_ar || '🚧 الترجمة قيد الإعداد. ستتوفر قريباً.') :
  faq.answer_en
  } />
  </div>
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

function RUNAKIAIAssistant({
  darkMode,
  DM,
  faqs
}){

  const [question, setQuestion] = React.useState('');
  const [results, setResults] = React.useState([]);

  const [resultLanguage, setResultLanguage] =
    React.useState('en');

const searchIndex = React.useMemo(() => buildIndex(faqs), [faqs]);
const [searched, setSearched] = React.useState(false);

const askAI = (q = question) => {
  const query = (typeof q === 'string' ? q : question).trim();
  setResultLanguage(detectQueryLanguage(query));
  if (!query) {
    setResults([]);
    setSearched(false);
    return;
  }
  // same free ranking engine as the top search bar (key terms, synonyms, typo tolerance, Kurdish/Arabic letter folding)
  setResults(searchFaqs(searchIndex, query, { limit: 5, minScore: 3 }));
  setSearched(true);
};

  const quickActions = [
    'Customer paid but still disconnected',
    'KYC rejected',
    'High bill complaint',
    'Runaki App registration issue',
    'Wrong tariff complaint',
    'Which call flow should I use?'
  ];

  return (
    <div>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '28px',
          padding: '24px',
          background:
            'linear-gradient(135deg,#0B1120 0%,#182235 100%)',
          color: '#fff',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'rgba(255,107,53,.18)',
            filter: 'blur(60px)'
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2
          }}
        >
          <div
  style={{
    width: '56px',
    height: '56px',
    borderRadius: '24px',
    background:
      'linear-gradient(135deg,#FF6B35,#ff8f66)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    marginBottom: '18px',
    boxShadow: '0 10px 30px rgba(255,107,53,.35)'
  }}
>
  🤖
</div>

          <h1
            style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '800'
            }}
          >
            Runaki AI Assistant
          </h1>

          <p
            style={{
              marginTop: '10px',
              color: 'rgba(255,255,255,.7)',
              fontSize: '15px'
            }}
          >{/* Search */}
            Search FAQs, call flows, operational procedures and resolution guidance.
          </p>
          <div
  style={{
    display:'flex',
    gap:'12px',
    marginTop:'20px'
  }}
>
  <input
    value={question}
    onChange={(e)=>setQuestion(e.target.value)}
    onKeyDown={(e)=>{
      if(e.key==='Enter') askAI();
    }}
    placeholder="Search FAQs, processes, KYC, billing or outages..."
    style={{
      flex:1,
      height:'56px',
      borderRadius:'14px',
      border:'1px solid rgba(255,255,255,.15)',
      background:'rgba(255,255,255,.08)',
      color:'#fff',
      padding:'0 18px',
      fontSize:'15px'
    }}
  />

  <button
    onClick={askAI}
    style={{
      height:'56px',
      padding:'0 24px',
      border:'none',
      borderRadius:'14px',
      background:'#FF6B35',
      color:'#fff',
      fontWeight:'700',
      cursor:'pointer'
    }}
  >
    Ask
  </button>
</div>
        </div>
      </div>

      {/* Search */}

{results.length > 0 && (

<div
  style={{
    display:'flex',
    flexDirection:'column',
    gap:'16px',
    marginBottom:'24px'
  }}
>

  {results.map(({ faq, score, matchedTerms }, idx) => (

    <div
      key={faq.id}
      style={{
        background:DM.cardBg,
        border:`1px solid ${DM.border}`,
        borderRadius:'20px',
        padding:'20px'
      }}
    >

      <div
        style={{
          color:'#10b981',
          fontWeight:'800',
          marginBottom:'10px'
        }}
      >
        {idx === 0 ? '✅ Best match · Approved Runaki Knowledge' : '✅ Approved Runaki Knowledge'}
      </div>

      <div
  style={{
    color: DM.text,
    fontSize: '18px',
    fontWeight: '800',
    marginBottom: '12px',
    direction:
      resultLanguage === 'ku' ||
      resultLanguage === 'ba' ||
      resultLanguage === 'ar'
        ? 'rtl'
        : 'ltr',
    textAlign:
      resultLanguage === 'ku' ||
      resultLanguage === 'ba' ||
      resultLanguage === 'ar'
        ? 'right'
        : 'left'
  }}
>
  📌 {
    resultLanguage === 'ba'
      ? (
          faq.question_ba ||
          faq.question_ku ||
          faq.question_en
        )
      : resultLanguage === 'ku'
      ? (
          faq.question_ku ||
          faq.question_en
        )
      : resultLanguage === 'ar'
      ? (
          faq.question_ar ||
          faq.question_en
        )
      : faq.question_en
  }
</div>

      <RichAnswer
        style={{
          color:DM.subText,
          lineHeight:'1.8',
          fontSize:'14px',
          direction: resultLanguage === 'en' ? 'ltr' : 'rtl',
          textAlign: resultLanguage === 'en' ? 'left' : 'right'
        }}
        text={
          resultLanguage === 'ba' ? (faq.answer_ba || faq.answer_ku || faq.answer_en)
          : resultLanguage === 'ku' ? (faq.answer_ku || faq.answer_en)
          : resultLanguage === 'ar' ? (faq.answer_ar || faq.answer_en)
          : faq.answer_en
        }
      />

      <div
        style={{
          marginTop:'12px',
          display:'flex',
          gap:'8px'
        }}
      >
        <span
          style={{
            background:'#eef2ff',
            padding:'4px 10px',
            borderRadius:'999px',
            fontSize:'12px'
          }}
        >
          {faq.category}
        </span>

        <span
          style={{
            background:'#f8fafc',
            padding:'4px 10px',
            borderRadius:'999px',
            fontSize:'12px'
          }}
        >
          {faq.subcategory}
        </span>
        {(matchedTerms || []).map(t => (
          <span key={t} title="Matched your search through this key term"
            style={{ background:'#fff7ed', color:'#c2410c', border:'1px solid #fed7aa', padding:'4px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:'600' }}>
            🔑 {t}
          </span>
        ))}
      </div>

    </div>

  ))}

</div>

)}
      {searched && results.length === 0 && (
        <div style={{ background:DM.cardBg, border:`1px dashed ${DM.border}`, borderRadius:'20px', padding:'22px', marginBottom:'24px', color:DM.subText, lineHeight:'1.8' }}>
          <div style={{ fontWeight:'800', color:DM.text, marginBottom:'6px' }}>🔎 No approved answer found</div>
          Try different or fewer words (for example the key words from the customer's problem: bill, disconnected, KYC, Maqtu3, tariff).
          If it is still not covered, ask your Team Coordinator or QA and do not guess.
        </div>
      )}
      {/* Quick Actions */}
      <div
        style={{

background: DM.cardBg,
          borderRadius: '24px',
          padding: '24px',
          border: `1px solid ${DM.border}`,
          marginBottom: '24px'
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: '18px'
          }}
        >
          ⚡ Quick Actions
        </h3>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {quickActions.map(item => (
            <button
              key={item}
        onClick={() => {
  setQuestion(item);
  askAI(item);
}}
             style={{
  background: darkMode ? DM.cardBg : '#fff',
  border: `1px solid ${DM.border}`,
  color: DM.text,
  padding:'8px 14px',
  borderRadius:'999px',
  fontSize:'13px',
  cursor:'pointer',
  fontWeight:'700',
  transition:'all .2s ease',
  boxShadow:'0 4px 12px rgba(0,0,0,.04)',
  minWidth:'unset',
  textAlign:'left',
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.borderColor = '#FF6B35';
}}

onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.borderColor = DM.border;
}}

            >
              {item}
            </button>
          ))}
        </div>
      </div>

  {/* Empty State */}
  {question && results.length === 0 && (

  <div
    style={{
      background:'#fef2f2',
      border:'1px solid #fecaca',
      color:'#dc2626',
      padding:'18px',
      borderRadius:'16px',
      marginBottom:'20px'
    }}
  >
    <strong>No approved Runaki knowledge found for:</strong>

    <div style={{ marginTop:'8px' }}>
      "{question}"
    </div>

  </div>

)}
{!question && results.length === 0 && (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
      gap: '20px'
    }}
  >
    <div
      style={{
        background: DM.cardBg,
        borderRadius: '24px',
        padding: '40px',
        border: `1px solid ${DM.border}`
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        Search the Knowledge Base
      </h2>

      <p style={{ color: DM.subText }}>
        Find approved answers, procedures,
        escalation paths and customer support guidance.
      </p>
    </div>

    <div
      style={{
        background: DM.cardBg,
        borderRadius: '24px',
        padding: '24px',
        border: `1px solid ${DM.border}`
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        Quick Tips
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div
          style={{
            padding: '12px',
            background: DM.cardBg,
            border: `1px solid ${DM.border}`,
            borderRadius: '12px',
            color: DM.text,
            boxShadow: DM.shadow
          }}
        >
          📱 KYC Rejected
        </div>

        <div
          style={{
            padding: '12px',
            background: DM.cardBg,
            border: `1px solid ${DM.border}`,
            borderRadius: '12px',
            color: DM.text,
            boxShadow: DM.shadow
          }}
        >
          💳 High Bill Complaint
        </div>

        <div
          style={{
            padding: '12px',
            background: DM.cardBg,
            border: `1px solid ${DM.border}`,
            borderRadius: '12px',
            color: DM.text,
            boxShadow: DM.shadow
          }}
        >
          ⚡ Outage Process
        </div>

        <div
          style={{
            padding: '12px',
            background: DM.cardBg,
            border: `1px solid ${DM.border}`,
            borderRadius: '12px',
            color: DM.text,
            boxShadow: DM.shadow
          }}
        >
          🏗 Runaki App Registration
        </div>
      </div>
    </div>
  </div>
)}
  </div>
);
}
const S = {
  layout: {
    display:'flex',
    height:'100vh',
    overflow:'hidden',
    fontFamily:"'Inter','Segoe UI',sans-serif"
  },

  body: {
    flex:1,
    display:'flex',
    flexDirection:'column',
    overflow:'hidden',
    minWidth:0
  },

  content: {
    flex:1,
    overflowY:'auto',
    padding:'16px',
    paddingLeft:'16px'
  },
};