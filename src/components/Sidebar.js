import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';
import React, { useState, useEffect, useMemo } from 'react';
import LogoLight from '../assets/runaki-light.svg';
import LogoDark from '../assets/runaki-dark.svg';


const NAVY = '#0B1120';
const ORANGE = '#FF6B35';
const ROLE_META = {
  admin: {
    label: 'Administrator',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.18)'
  },
  editor: {
    label: 'Content Editor',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.18)'
  },
  agent: {
    label: 'Agent',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.18)'
  }
};

export default function Sidebar({
  panel,
  setPanel,
  search,
  setSearch,
  faqs = [],
  darkMode
}) {

 
  const { user, logout } = useAuth();
  
  const navigate = useNavigate();
  const [collapsedHover, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 769);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 769);
    const onToggle = () => setNavOpen(o => !o);
    window.addEventListener('resize', onResize);
    window.addEventListener('rk-toggle-nav', onToggle);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('rk-toggle-nav', onToggle); };
  }, []);
  useEffect(() => { setNavOpen(false); }, [panel]);
  const collapsed = isMobile ? false : collapsedHover;

  const location = useLocation();
  const [faqOpen, setFaqOpen] = useState(true);
  
  const [aiOpen, setAiOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(true);
  const [hasActiveScript, setHasActiveScript] = useState(false);
  const isStaffUser = ['team_lead', 'qa_officer'].includes(String(user?.role || '').trim().toLowerCase());
  const [folders, setFolders] = useState([]);
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    api.get(isStaffUser ? '/folders?all=1' : '/folders').then(r => setFolders(r.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    const check = () => {
      let seen = '0'; try { seen = localStorage.getItem('rk_chan_seen') || '0'; } catch {}
      api.get(`/channel/unread?after=${seen}`).then(r => setUnread(r.data.n || 0)).catch(() => {});
    };
    check();
    const t = setInterval(check, 60000);
    const onSeen = () => setUnread(0);
    window.addEventListener('rk-channel-seen', onSeen);
    return () => { clearInterval(t); window.removeEventListener('rk-channel-seen', onSeen); };
  }, []);
    useEffect(() => {

  if (
    ['_ai-kb', '_ai-categorizer'].includes(panel)
  ) {
    setAiOpen(true);
  }

  if (
    ['_callflows', '_scripts', '_priority', '_holdunhold']
      .includes(panel)
  ) {
    setOpsOpen(true);
  }

  if (
    (['_kyc', '_tickets', '_zones', '_contactreasons', '_sms', '_extlinks'].includes(panel) || String(panel).startsWith('_tool_'))
  ) {
    setToolsOpen(true);
  }
  if (String(panel).startsWith('_folder_')) setFoldersOpen(true);

if (
  ['_bookmarks', '_mystats', '_evaluations', '_leaderboard', '_quiz', '_sendfeedback'].includes(panel)
) {
  setPersonalOpen(true);
}

}, [panel]);
const rm = ROLE_META[user?.role] || ROLE_META.agent;
 const faqCounts = useMemo(() => {
  // Shortlisted FAQs live in their own tab, so they are not counted in the general categories.
  const general = faqs.filter(f => !f.is_shortlisted);
  return {
    inquiries: general.filter(f => f.category?.toLowerCase() === 'inquiries').length,
    billingComplaints: general.filter(f => f.category?.toLowerCase().includes('billing')).length,
    generalComplaints: general.filter(f => f.category?.toLowerCase() === 'general complaints').length,
    serviceRequests: general.filter(f => f.category?.toLowerCase().includes('service')).length,
  };
}, [faqs]);

  useEffect(() => {
    const BASE = process.env.REACT_APP_API_URL || 'https://runaki-kb-api.vercel.app';
    fetch(`${BASE}/api/scripts/published`)
      .then(r => r.json())
      .then(d => {
        if (!d) { setHasActiveScript(false); return; }
        const lastSeen  = localStorage.getItem('rk_script_seen');
        const updatedAt = new Date(d.updated_at).getTime();
        setHasActiveScript(!lastSeen || parseInt(lastSeen) < updatedAt);
      })
      .catch(() => setHasActiveScript(false));
  }, [panel]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const go = p => {
    if (location.pathname !== '/') navigate('/');
    setPanel(p);
  };

  return (
    <>
    {isMobile && navOpen && <div className="rk-nav-backdrop" onClick={() => setNavOpen(false)} />}
    <aside className={isMobile ? 'rk-aside-mobile' + (navOpen ? ' open' : '') : ''}
onMouseEnter={() => { if (!isMobile) setCollapsed(false); }}
onMouseLeave={() => { if (!isMobile) setCollapsed(true); }}

  style={{
    ...S.aside,
    background: darkMode
      ? 'linear-gradient(180deg,#0f1623 0%,#0B1120 100%)'
      : 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',
    borderRight: darkMode
      ? '1px solid rgba(255,255,255,0.06)'
      : '1px solid #e2e8f0',
width: collapsed ? '68px' : '260px',
  }}
>
 

{/* ── BRAND ── */}
<div style={S.brand}>
  <div
    style={{
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      height: collapsed ? 30 : 48,
      width: collapsed ? 34 : 'auto',
      transition: 'height .2s ease, width .2s ease',
    }}
  >
    <img
      src={darkMode ? LogoDark : LogoLight}
      alt="Runaki"
      style={{
        height: collapsed ? 30 : 48,
        width: 'auto',
        flexShrink: 0,
        transition: 'height .2s ease',
      }}
    />
  </div>
</div>
{/* ── USER CARD ── */}
<div
onClick={() => {
  navigate('/profile');
}}
  style={{
    ...S.userCard,
    padding: collapsed ? '12px 0' : '12px 14px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    cursor: 'pointer'
  }}
  title="My Profile"
>
  <div style={S.avatar}>
    {user?.name?.[0]?.toUpperCase()}
  </div>

  {!collapsed && (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          ...S.userName,
          color: darkMode ? '#fff' : '#0B1120'
        }}
      >
        {user?.name}
      </div>

      <span
        style={{
          ...S.roleBadge,
          color: rm.color,
          background: rm.bg
        }}
      >
        {user?.title || rm.label}
      </span>
    </div>
  )}
</div>

{/* ── SEARCH ── */}
      {!collapsed && (
        <div style={S.searchWrap}>
          <span style={S.searchIco}>🔍</span>
          <input
  placeholder="Search FAQs, KYC, Billing..."
  value={search}
  onChange={e => {
    setSearch(e.target.value);

    if (e.target.value && panel !== '_search') {
      setPanel('_search');
    }
  }}
  onFocus={(e) => {
    e.target.style.boxShadow =
      '0 0 0 4px rgba(255,107,53,.18)';
  }}
  onBlur={(e) => {
    e.target.style.boxShadow =
      '0 4px 14px rgba(255,107,53,.15)';
  }}
  style={{
    ...S.searchInput,
background:
  darkMode
    ? 'rgba(255,255,255,.10)'
    : '#fff7ed',
    border: `2px solid ${ORANGE}`,
    color: darkMode ? '#fff' : '#0B1120',
    boxShadow: '0 4px 14px rgba(255,107,53,.15)'
  }}
/>
          {search && (
            <button
  style={S.searchClear}
  onClick={() => {
    setSearch('');
    setPanel('inquiries');
  }}
>
  ✕
</button>
          )}
        </div>
      )}

      {/* ── NAV ── */}
      <nav style={S.nav}>

        {/* Top three: Updates (team chat), Update Scripts, Shortlisted FAQ's */}
        <TopCard hero icon="📢" title="Updates" sub={unread ? `${unread} new message${unread > 1 ? 's' : ''}` : 'Team announcements'}
          badge={unread || undefined} collapsed={collapsed} darkMode={darkMode} active={panel === '_channel'} onClick={() => go('_channel')} />
        <TopCard icon="📋" title="Update Scripts" sub={hasActiveScript && panel !== '_updatescripts' ? 'New changes to read' : 'Latest script changes'}
          tint="#38bdf8" dot={hasActiveScript && panel !== '_updatescripts'} collapsed={collapsed} darkMode={darkMode} active={panel === '_updatescripts'} onClick={() => go('_updatescripts')} />
        <TopCard icon="📌" title="Shortlisted FAQ's" sub="Most used answers"
          tint="#a78bfa" collapsed={collapsed} darkMode={darkMode} active={panel === '_shortlisted'} onClick={() => go('_shortlisted')} />
<NI
  folder
  icon="📚"
  
  darkMode={darkMode}

  label="FAQs"
  badge={faqs.length}
  collapsed={collapsed}
active={
  faqOpen &&
  [
    'inquiries',
    'billing',
    'general',
    'service'
  ].includes(panel)
}
  onClick={() => setFaqOpen(!faqOpen)}
 suffix={
  !collapsed && (
    <div
      style={{
        display:'flex',
        alignItems:'center',
        gap:'6px',
      }}
    >
      <span
  style={{
    fontSize:'10px',
    fontWeight:'700',
color: darkMode ? 'rgba(255,255,255,0.75)' : '#475569',    letterSpacing:'0.08em'
  }}
>
  {faqOpen ? 'Hide' : 'Open'}
</span>

      <span
        style={{
          transform: faqOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition:'all .2s ease',
          fontSize:'18px',
          fontWeight:'900',
          color:'#FF6B35'
        }}
      >
        ▶
      </span>
    </div>
  )
}
/>

{faqOpen && (
  <>
    <NI
      icon="📘"
      label="Inquiries"
      badge={faqCounts.inquiries}
      darkMode={darkMode}
      collapsed={collapsed}
      active={panel === 'inquiries'}
      onClick={() => go('inquiries')}
    />

    <NI
      icon="💳"
      label="Billing Complaints"
      badge={faqCounts.billingComplaints}
      darkMode={darkMode}
      collapsed={collapsed}
      active={panel === 'billing'}
      onClick={() => go('billing')}
    />

    <NI
      icon="⚡"
      label="General Complaints"
      badge={faqCounts.generalComplaints}
      darkMode={darkMode}
      collapsed={collapsed}
      active={panel === 'general'}
      onClick={() => go('general')}
    />

    <NI
      icon="🔧"
      label="Service Requests"
      badge={faqCounts.serviceRequests}
      darkMode={darkMode}
      collapsed={collapsed}
      active={panel === 'service'}
      onClick={() => go('service')}
    />

  </>
)}
{/* RUNAKI AI */}
<NI
folder
  icon="🤖"
  
  darkMode={darkMode}

  label="RUNAKI AI"
  collapsed={collapsed}
  active={
  ['_ai-kb', '_ai-categorizer']
    .includes(panel)
}
  onClick={() => setAiOpen(!aiOpen)}
 suffix={
  !collapsed && (
    <div
      style={{
        display:'flex',
        alignItems:'center',
        gap:'6px',
      }}
    >
      <span
        style={{
          fontSize:'10px',
          fontWeight:'700',
          color: darkMode ? 'rgba(255,255,255,.75)' : '#64748b',
          textTransform:'uppercase',
          letterSpacing:'0.08em'
        }}
      >
       {aiOpen ? 'Hide' : 'Open'}
      </span>

      <span
        style={{
          transform: aiOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition:'all .2s ease',
          fontSize:'18px',
          fontWeight:'900',
          color:'#FF6B35'
        }}
      >
        ▶
      </span>
    </div>
  )
}
/>

{aiOpen && (
  <>
    <NI
  icon="💻"
  
  darkMode={darkMode}

  label="Knowledge Assistant"
  sub
  collapsed={collapsed}
  active={panel === '_ai-kb'}
  onClick={() => go('_ai-kb')}
/>

  </>
)}

{/* FOLDERS */}
{(folders.length > 0 || isStaffUser) && (
  <>
    <NI
      folder
      icon="🗂️"
      darkMode={darkMode}
      label="Folders"
      collapsed={collapsed}
      active={String(panel).startsWith('_folder_')}
      onClick={() => setFoldersOpen(!foldersOpen)}
      suffix={!collapsed && (
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'10px', fontWeight:'700', color: darkMode ? 'rgba(255,255,255,.75)' : '#64748b', textTransform:'uppercase', letterSpacing:'0.08em' }}>{foldersOpen ? 'Hide' : 'Open'}</span>
          <span style={{ transform: foldersOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition:'all .2s ease', fontSize:'18px', fontWeight:'900', color:'#FF6B35' }}>▶</span>
        </div>
      )}
    />
    {foldersOpen && isStaffUser && folders.length === 0 && !collapsed && (
      <div style={{ padding: '6px 14px 8px 34px', fontSize: 11.5, lineHeight: 1.5, color: darkMode ? 'rgba(255,255,255,.55)' : '#64748b' }}>
        No folders yet. Add the first one in Admin Panel → Folders.
      </div>
    )}
    {foldersOpen && folders.map(f => (
      <NI key={f.id} sub icon={f.is_visible === false ? '🔒' : (f.icon || '📁')} darkMode={darkMode} label={f.is_visible === false ? `${f.name} (hidden)` : f.name} collapsed={collapsed}
        active={panel === `_folder_${f.id}`} onClick={() => go(`_folder_${f.id}`)} />
    ))}
  </>
)}

{/* TOOLS */}
<NI
folder
  icon="🛠️"
  
  darkMode={darkMode}

  label="Tools"
  collapsed={collapsed}
  active={
  (['_kyc', '_tickets', '_zones', '_contactreasons', '_sms', '_extlinks'].includes(panel) || String(panel).startsWith('_tool_'))
}
  onClick={() => setToolsOpen(!toolsOpen)}
  suffix={
  !collapsed && (
    <div
      style={{
        display:'flex',
        alignItems:'center',
        gap:'6px',
      }}
    >
      <span
        style={{
          fontSize:'10px',
          fontWeight:'700',
          color: darkMode ? 'rgba(255,255,255,.75)' : '#64748b',
          textTransform:'uppercase',
          letterSpacing:'0.08em'
        }}
      >
        {toolsOpen ? 'Hide' : 'Open'}
      </span>

      <span
        style={{
          transform: toolsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition:'all .2s ease',
          fontSize:'18px',
          fontWeight:'900',
          color:'#FF6B35'
        }}
      >
        ▶
      </span>
    </div>
  )
}
/>

{toolsOpen && (
  <>
    <NI sub icon="🎫" label="Ticket Descriptions" collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_tickets'}
      onClick={() => go('_tickets')}
    />

    <NI sub icon="📍" label="Zone Lookup" collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_zones'}
      onClick={() => go('_zones')}
    />

    <NI sub icon="🌳" label="Contact Reasons" collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_contactreasons'}
      onClick={() => go('_contactreasons')}
    />

<NI
      sub
      icon="📱"
      
  darkMode={darkMode}

      label="KYC Platform Outputs"
      collapsed={collapsed}
      active={panel === '_kyc'}
      onClick={() => go('_kyc')}
    />

    <NI sub icon="💬" darkMode={darkMode} label="SMS Templates" collapsed={collapsed}
      active={panel === '_sms'} onClick={() => go('_sms')} />
    <NI sub icon="🔗" darkMode={darkMode} label="External Links" collapsed={collapsed}
      active={panel === '_extlinks'} onClick={() => go('_extlinks')} />
  </>
)}

{/* OPERATIONS */}
<NI
folder
  icon="📞"
  
  darkMode={darkMode}

  label="Operations"
  collapsed={collapsed}
  active={
  [
    '_callflows',
    '_scripts',
    '_priority',
    '_holdunhold'
  ].includes(panel)
}
  onClick={() => setOpsOpen(!opsOpen)}
 suffix={
  !collapsed && (
    <div
      style={{
        display:'flex',
        alignItems:'center',
        gap:'6px',
      }}
    >
      <span
        style={{
          fontSize:'10px',
          fontWeight:'700',
          color: darkMode ? 'rgba(255,255,255,.75)' : '#64748b',
          textTransform:'uppercase',
          letterSpacing:'0.08em'
        }}
      >
       {opsOpen ? 'Hide' : 'Open'}
      </span>

      <span
        style={{
          transform: opsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition:'all .2s ease',
          fontSize:'18px',
          fontWeight:'900',
          color:'#FF6B35'
        }}
      >
        ▶
      </span>
    </div>
  )
}
/>

{opsOpen && (
  <>
    <NI sub icon="📞" label="Call Flows" collapsed={collapsed}
    
  darkMode={darkMode}

      active={panel === '_callflows'}
      onClick={() => go('_callflows')}
    />

    <NI sub icon="📋" label="Scripts & Processes" collapsed={collapsed}
    
  darkMode={darkMode}

      active={panel === '_scripts'}
      onClick={() => go('_scripts')}
    />

    <NI sub icon="🎯" label="Case Priorities" collapsed={collapsed}
    
  darkMode={darkMode}

      active={panel === '_priority'}
      onClick={() => go('_priority')}
    />

    <NI sub icon="⏸️" label="Hold & Unhold" collapsed={collapsed}
    
  darkMode={darkMode}

      active={panel === '_holdunhold'}
      onClick={() => go('_holdunhold')}
    />
  </>
)}

{/* PERSONAL */}
<NI
folder
  icon="⭐"
  
  darkMode={darkMode}

  label="Personal"
  collapsed={collapsed}
 active={['_bookmarks', '_mystats', '_evaluations', '_leaderboard', '_quiz', '_sendfeedback'].includes(panel)}
  onClick={() => setPersonalOpen(!personalOpen)}
  suffix={
  !collapsed && (
    <div
      style={{
        display:'flex',
        alignItems:'center',
        gap:'6px',
      }}
    >
      <span
        style={{
          fontSize:'10px',
          fontWeight:'700',
          color: darkMode ? 'rgba(255,255,255,.75)' : '#64748b',
          textTransform:'uppercase',
          letterSpacing:'0.08em'
        }}
      >
        {personalOpen ? 'Hide' : 'Open'}
      </span>

      <span
        style={{
          transform: personalOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          transition:'all .2s ease',
          fontSize:'18px',
          fontWeight:'900',
          color:'#FF6B35'
        }}
      >
        ▶
      </span>
    </div>
  )
}
/>

{personalOpen && (
  <>
    <NI sub icon="⭐" label="My Evaluations" collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_evaluations'}
      onClick={() => go('_evaluations')}
    />

    <NI sub icon="🏆" label="Leaderboard" collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_leaderboard'}
      onClick={() => go('_leaderboard')}
    />

    <NI sub icon="🧠" label="Daily Quiz" collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_quiz'}
      onClick={() => go('_quiz')}
    />

    <NI
      sub
      icon="✨"
      
  darkMode={darkMode}

      label="My Bookmarks"
      collapsed={collapsed}
      active={panel === '_bookmarks'}
      onClick={() => go('_bookmarks')}
    />

    <NI sub icon="📊" label="My Stats" collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_mystats'}
      onClick={() => go('_mystats')}
    />

    <NI sub icon="💬" label="Send Feedback" collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_sendfeedback'}
      onClick={() => go('_sendfeedback')}
    />
  </>
)}
{!collapsed && (
  <>
    <div
      style={{
        height: '1px',
        margin: '14px 16px 10px',
        background: darkMode
          ? 'rgba(255,255,255,0.08)'
          : '#e2e8f0'
      }}
    />
  </>
)}

{(user?.role || '').toString().trim().toLowerCase() !== 'agent' && (
<>
<NI
  folder
  icon="⚙️"
  label="System"
  collapsed={collapsed}
  darkMode={darkMode}
  active={['_admin', '_faqeditor'].includes(panel)}
  onClick={() => setSystemOpen(!systemOpen)}
  suffix={
    !collapsed && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: '700',
            color: darkMode
              ? 'rgba(255,255,255,.75)'
              : '#64748b'
          }}
        >
          {systemOpen ? 'Hide' : 'Open'}
        </span>

        <span
          style={{
            transform: systemOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'all .2s ease',
            fontSize: '18px',
            fontWeight: '900',
            color: '#FF6B35'
          }}
        >
          ▶
        </span>
      </div>
    )
  }
/>

{systemOpen && (
  <>
    {(user?.role || '').toString().trim().toLowerCase() === 'team_lead' && (
      <NI
        sub
        icon="🛠️"
        label="Admin Panel"
        collapsed={collapsed}
        darkMode={darkMode}
        active={panel === '_admin'}
        onClick={() => go('_admin')}
      />
    )}

    <NI
      sub
      icon="📝"
      label="FAQ Editor"
      collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_faqeditor'}
      onClick={() => go('_faqeditor')}
    />
  </>
)}
</>
)}
      </nav>

      {/* ── LOGOUT ── */}
      <button
        style={{ ...S.logoutBtn, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px 0' : '10px 16px' }}
        onClick={handleLogout}
      >
        <span style={{ fontSize:'16px' }}>🚪</span>
        {!collapsed && <span>Sign Out</span>}
      </button>
    </aside>
    </>
  );
}

function TopCard({ icon, title, sub, badge, dot, hero, tint = '#FF6B35', active, collapsed, darkMode, onClick }) {
  const dm = darkMode;
  const bg = hero
    ? 'linear-gradient(135deg,#FF6B35 0%,#ff9a6c 100%)'
    : active ? (dm ? 'rgba(255,255,255,0.09)' : '#fff') : (dm ? 'rgba(255,255,255,0.04)' : '#ffffff');
  const border = hero ? 'transparent' : active ? tint : (dm ? 'rgba(255,255,255,0.08)' : '#e8edf5');
  const titleColor = hero ? '#fff' : (dm ? '#f1f5f9' : '#0B1120');
  const subColor = hero ? 'rgba(255,255,255,.88)' : (dm ? 'rgba(255,255,255,.5)' : '#64748b');
  return (
    <>
      <style>{`@keyframes rkPulse{0%{box-shadow:0 0 0 0 rgba(239,68,68,.55)}70%{box-shadow:0 0 0 9px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}`}</style>
      <button onClick={onClick} title={title} style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 11, justifyContent: collapsed ? 'center' : 'flex-start',
        width: 'calc(100% - 14px)', margin: '4px 7px', padding: collapsed ? '8px 0' : '10px 12px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start',
        background: bg, border: `1.5px solid ${border}`, boxShadow: hero ? '0 6px 18px rgba(255,107,53,.35)' : active ? `0 4px 14px ${tint}33` : 'none', transition: 'all .18s ease',
      }}>
        <span style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          background: hero ? 'rgba(255,255,255,.22)' : `${tint}22`,
        }}>{icon}</span>
        {!collapsed && (
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: titleColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: subColor, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
          </span>
        )}
        {badge ? (
          <span style={{ position: collapsed ? 'absolute' : 'static', top: collapsed ? 2 : undefined, right: collapsed ? 4 : undefined, minWidth: 22, height: 22, padding: '0 6px', borderRadius: 11, background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 900, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', animation: 'rkPulse 1.8s infinite', flexShrink: 0 }}>{badge > 99 ? '99+' : badge}</span>
        ) : dot ? (
          <span style={{ position: collapsed ? 'absolute' : 'static', top: collapsed ? 6 : undefined, right: collapsed ? 8 : undefined, width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'rkPulse 1.8s infinite', flexShrink: 0 }} />
        ) : null}
      </button>
    </>
  );
}

function NI({
  icon,
  label,
  badge,
  active,
  sub,
  folder,
  onClick,
  suffix,
  hot,
  collapsed,
  darkMode
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={collapsed ? label : undefined}
      style={{
  ...S.ni,
  ...(folder
  ? {
      ...S.folderNi,
      background: darkMode
        ? 'linear-gradient(135deg,#182132,#111827)'
        : '#ffffff',
      border: darkMode
        ? '1px solid rgba(255,255,255,0.08)'
        : '1px solid #e2e8f0'
    }
  : {}),
 ...(folder && active
  ? S.folderActive
  : active
    ? S.niActive
    : hov
      ? S.niHov
      : {}),
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding:
  collapsed
    ? '10px 0'
    : folder
      ? '11px 12px'
      : sub
        ? '7px 12px 7px 32px'
        : '9px 12px',
      }}
    >
      <span style={{ fontSize: collapsed ? '18px' : '15px', flexShrink:0, width:'22px', textAlign:'center' }}>{icon}</span>
     {!collapsed && (
  <>
    <span
      style={{
        flex: 1,
        fontSize: sub ? '12px' : '13px',
        fontWeight: sub
          ? '500'
          : folder
            ? '700'
            : active
              ? '700'
              : '500',
        color: active
          ? (darkMode ? '#fff' : '#0B1120')
          : darkMode
            ? 'rgba(255,255,255,0.7)'
            : '#475569',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'left'
      }}
    >
      {label}
    </span>

    {badge !== undefined && (
      <span
        style={{
          fontSize: '10px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '100px',
          flexShrink: 0,
          background:
            badge > 0
              ? 'rgba(255,107,53,0.18)'
              : darkMode
                ? 'rgba(255,255,255,0.08)'
                : '#f1f5f9',
          color:
            badge > 0
              ? '#FF6B35'
              : darkMode
                ? 'rgba(255,255,255,0.45)'
                : '#64748b',
          minWidth: '24px',
          textAlign: 'center'
        }}
      >
        {badge}
      </span>
    )}

    {suffix}
  </>
)}
    </button>
  );
}
const S = {



folderNi: {
  background: 'linear-gradient(135deg,#182132,#111827)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  marginTop: '10px',
  marginBottom: '8px',
  minHeight: '52px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  position:'relative',
},

folderActive: {
  background:'linear-gradient(135deg, rgba(255,107,53,.20), rgba(255,107,53,.08))',
  border:'1px solid rgba(255,107,53,.30)',
  boxShadow:'0 0 16px rgba(255,107,53,.18)',
},
  aside: {
    flexShrink:0,
    background:`linear-gradient(180deg,#0f1623 0%,#0B1120 100%)`,
    display:'flex', flexDirection:'column', height:'100%',
    fontFamily:"'Inter','Segoe UI',sans-serif",
    borderRight:'1px solid rgba(255,255,255,0.06)',
    transition:'width .22s cubic-bezier(0.4,0,0.2,1)',
    overflow:'hidden',
  },

  brand: {
    display:'flex', alignItems:'center', gap:'12px',
    padding:'0 16px', height:'72px', flexShrink:0, justifyContent:'center',
    borderBottom:'1px solid rgba(255,255,255,0.07)',
    background:'linear-gradient(135deg,rgba(255,107,53,0.06) 0%,transparent 60%)',
  },

  userCard: {
    display:'flex', alignItems:'center', gap:'10px',
    borderBottom:'1px solid rgba(255,255,255,0.06)',
    minHeight:'64px', flexShrink:0,
  },
  avatar: {
  width:'36px',
  height:'36px',
  borderRadius:'10px',
  background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  fontSize:'15px',
  fontWeight:'800',
  color:'#fff',
  flexShrink:0,
  boxShadow:'0 4px 12px rgba(99,102,241,0.35)',
},
  userName: {
  fontSize:'13px',
  fontWeight:'700',
  marginBottom:'5px',
  whiteSpace:'nowrap',
  overflow:'hidden',
  textOverflow:'ellipsis'
},
  roleBadge: { fontSize:'9.5px', fontWeight:'800', padding:'3px 9px', borderRadius:'100px', textTransform:'uppercase', letterSpacing:'0.07em', display:'inline-block' },

searchWrap: {
  margin: '12px 12px 8px',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(255,107,53,.05)',
  padding: '4px',
  borderRadius: '18px',
},
searchIco: {
  position: 'absolute',
  left: '14px',
  fontSize: '16px',
  pointerEvents: 'none',
  zIndex: 2,
  opacity: 0.8
},
  searchInput: {
  width: '100%',
  height: '48px',
  padding: '10px 38px 10px 42px',
  borderRadius: '14px',
  fontSize: '13px',
  fontWeight: '600',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  border: `2px solid ${ORANGE}`,
  boxShadow: '0 4px 14px rgba(255,107,53,.15)',
  transition: 'all .2s ease'
},
  searchClear: {
  position: 'absolute',
  right: '12px',
  background: 'none',
  border: 'none',
  color: '#FF6B35',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '700'
},
  nav: { flex:1, overflowY:'auto', overflowX:'hidden', padding:'6px 0' },
   ni: {
    display:'flex', alignItems:'center', gap:'9px',
    width:'calc(100% - 14px)', margin:'4px 7px',
    borderRadius:'10px', border:'none', background:'transparent',
    cursor:'pointer', fontFamily:'inherit', transition:'all .2s ease',
    boxSizing:'border-box', overflow:'hidden', whiteSpace:'nowrap',
  },

niActive: {
  background:'linear-gradient(90deg, rgba(255,107,53,.28), rgba(255,107,53,.08))',
  borderLeft:`4px solid ${ORANGE}`,
  paddingLeft:'8px',
  boxShadow:'0 0 12px rgba(255,107,53,.25)',

  },
 niHov: {
  transform:'translateX(4px)',
  boxShadow:'0 0 14px rgba(255,107,53,.15)',
},
  logoutBtn: {
    display:'flex', alignItems:'center', gap:'8px',
    margin:'8px 10px 14px', width:'calc(100% - 20px)',
    background:'rgba(239,68,68,0.08)',
    border:'1px solid rgba(239,68,68,0.15)',
    borderRadius:'10px',
    color:'rgba(239,68,68,0.75)',
    fontSize:'13px', fontWeight:'600',
    cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
    overflow:'hidden', whiteSpace:'nowrap',
  },
};