import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import React, { useState, useEffect, useMemo } from 'react';
import LogoLight from '../assets/runaki-light.svg';
import LogoDark from '../assets/runaki-dark.svg';

const NAVY = '#0B1120';
const ORANGE = '#FF6B35';
const ROLE_META = {
  team_lead: { label: 'Team Lead', color: '#a78bfa', bg: 'rgba(167,139,250,0.18)' },
  qa_officer: { label: 'QA Officer', color: '#34d399', bg: 'rgba(52,211,153,0.18)' },
  agent: { label: 'Agent', color: '#60a5fa', bg: 'rgba(96,165,250,0.18)' },
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
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const location = useLocation();
  const [faqOpen, setFaqOpen] = useState(true);
  
  const [aiOpen, setAiOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(true);
  const [hasActiveScript, setHasActiveScript] = useState(false);
    useEffect(() => {

  if (
    ['_ai-kb', '_ai-categorizer'].includes(panel)
  ) {
    setAiOpen(true);
  }

  if (
    ['_callflows', '_restree', '_scripts', '_priority', '_holdunhold']
      .includes(panel)
  ) {
    setOpsOpen(true);
  }

  if (
    ['_maintenance', '_kyc'].includes(panel)
  ) {
    setToolsOpen(true);
  }

if (
  ['_bookmarks'].includes(panel)
) {
  setPersonalOpen(true);
}

}, [panel]);
  const rm = ROLE_META[user?.role] || ROLE_META.agent;
  const faqCounts = useMemo(() => ({
  inquiries: faqs.filter(
    f => f.category === 'Inquiries'
  ).length,

  runakiApp: faqs.filter(
    f =>
      f.category === 'Inquiries' &&
      (f.subcategory || '').toLowerCase() === 'runaki app'
  ).length,

  runaki: faqs.filter(
  f =>
    f.category === 'Inquiries' &&
    (f.subcategory || '').toLowerCase().includes('runaki') &&
    (f.subcategory || '').toLowerCase() !== 'runaki app'
).length,

  kyc: faqs.filter(
    f =>
      f.category === 'Inquiries' &&
      (f.subcategory || '').toLowerCase().includes('kyc')
  ).length,

  billingInquiries: faqs.filter(
    f =>
      f.category === 'Inquiries' &&
      (f.subcategory || '').toLowerCase().includes('billing')
  ).length,

  dunning: faqs.filter(
    f =>
      f.category === 'Inquiries' &&
      (f.subcategory || '').toLowerCase().includes('dunning')
  ).length,

  epsule: faqs.filter(
    f =>
      f.category === 'Inquiries' &&
      (f.subcategory || '').toLowerCase().includes('psule')
  ).length,

  ussd: faqs.filter(
    f =>
      f.category === 'Inquiries' &&
      (f.subcategory || '').toLowerCase().includes('ussd')
  ).length,

  other: faqs.filter(
  f =>
    f.category === 'Inquiries' &&
    (f.subcategory || '').toLowerCase().includes('other')
).length,

  billingComplaints: faqs.filter(
    f => f.category === 'Billing Complaints'
  ).length,

  generalComplaints: faqs.filter(
    f => f.category === 'General Complaints'
  ).length,

  serviceRequests: faqs.filter(
    f => f.category === 'Service Requests'
  ).length,

  feedback: faqs.filter(
    f => f.category === 'Feedback & Others'
  ).length,
}), [faqs]);
const FAQ_CHILDREN = [
  { id:'inq-runakirapp', icon:'📱', label:'Runaki App', badge:faqCounts.runakiApp },
  { id:'inq-runaki', icon:'🏗️', label:'Runaki Project', badge:faqCounts.runaki },
  { id:'inq-kyc', icon:'🪪', label:'KYC', badge:faqCounts.kyc },
  { id:'inq-billing', icon:'💳', label:'Billing Inquiries', badge:faqCounts.billingInquiries },
  { id:'inq-dunning', icon:'⚠️', label:'Dunning', badge:faqCounts.dunning },
  { id:'inq-epsule', icon:'📱', label:'e-Psûle', badge:faqCounts.epsule },
  { id:'inq-ussd', icon:'📲', label:'USSD', badge:faqCounts.ussd },
  { id:'inq-other', icon:'📌', label:'Other', badge:faqCounts.other },];

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
    <aside
  style={{
    ...S.aside,
    background: darkMode
      ? 'linear-gradient(180deg,#0f1623 0%,#0B1120 100%)'
      : 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)',
    borderRight: darkMode
      ? '1px solid rgba(255,255,255,0.06)'
      : '1px solid #e2e8f0',
    width: collapsed ? '68px' : '260px',
    ...(isMobile ? {
      position:'fixed',
      top:0,
      left:0,
      bottom:0,
      zIndex:1000,
      transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition:'transform .25s cubic-bezier(0.4,0,0.2,1)',
      width:'260px',
      boxShadow: mobileOpen
        ? '4px 0 30px rgba(34, 30, 30, 0.5)'
        : 'none'
    } : {})
  }}
>
 

{/* ── BRAND ── */}
<div style={S.brand}>
  <img
    src={darkMode ? LogoDark : LogoLight}
    alt="Runaki"
    style={{
      height: 48,

      width: 'auto',
    }}
  />
</div>
{/* ── USER CARD ── */}
<div
  onClick={() => {
    navigate('/profile');
    if (isMobile) setMobileOpen(false);
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
  placeholder="Quick search..."
  value={search}
  onChange={e => {

    setSearch(e.target.value);

    if (e.target.value && panel !== '_search') {
      setPanel('_search');
    }
  }}
  style={{
  ...S.searchInput,
  background: darkMode
    ? 'rgba(255,255,255,.07)'
    : '#ffffff',
  border: darkMode
    ? '1px solid rgba(255,255,255,.1)'
    : '1px solid #dbeafe',
  color: darkMode ? '#fff' : '#0B1120'
}}
/>
          {search && (
            <button style={S.searchClear} onClick={() => { setSearch(''); setPanel('billing'); }}>✕</button>
          )}
        </div>
      )}

      {/* ── NAV ── */}
      <nav style={S.nav}>

        {/* Update Scripts — top of sidebar with red badge when active */}
        {!collapsed && <div
  style={{
    ...S.groupLabel,
    color: darkMode
      ? 'rgba(255,255,255,0.28)'
      : '#64748b'
  }}
>📢 Notices</div>}
        <div style={{ position:'relative', display:'inline-block', width:'100%' }}>
          <NI icon="📋" label="Update Scripts" collapsed={collapsed} 
  darkMode={darkMode}

            active={panel==='_updatescripts'} onClick={() => go('_updatescripts')} />
          {hasActiveScript && panel !== '_updatescripts' && (
            <div style={{ position:'absolute', top:8, right: collapsed?6:12, width:8, height:8, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 6px #ef4444' }} />
          )}
        </div>
<NI
  folder
  icon="📚"
  
  darkMode={darkMode}

  label="FAQs"
  badge={faqs.length}
  collapsed={collapsed}
active={
  faqOpen &&
  (
    panel?.startsWith('inq-') ||
    ['billing','general','service','feedback','_updates']
      .includes(panel)
  )
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
{!collapsed && (
  <div
  style={{
    ...S.sectionLabel,
    color: darkMode
      ? 'rgba(255,255,255,0.25)'
      : '#64748b'
  }}
>
  💬 INQUIRIES
  </div>
)}

{FAQ_CHILDREN.map(c => (
  <NI
    key={c.id}
    icon={c.icon}
    label={c.label}
    badge={c.badge}
    
  darkMode={darkMode}

    sub
    collapsed={collapsed}
    active={panel === c.id}
    
    onClick={() => go(c.id)}

    
  />

  
))}

   {!collapsed && (
  <div
  style={{
    ...S.sectionLabel,
    color: darkMode
      ? 'rgba(255,255,255,0.25)'
      : '#64748b'
  }}
>
  💳 BILLING COMPLAINTS
  </div>
)}

<NI
  icon="💳"
  
  darkMode={darkMode}

  label="Billing Complaints"
  badge={faqCounts.billingComplaints}
  collapsed={collapsed}
  active={panel === 'billing'}
  onClick={() => go('billing')}
/>

{!collapsed && (
  <div
  style={{
    ...S.sectionLabel,
    color: darkMode
      ? 'rgba(255,255,255,0.25)'
      : '#64748b'
  }}
>
  ⚡ GENERAL COMPLAINTS
  </div>
)}

<NI
  icon="⚡"
  
  darkMode={darkMode}

  label="General Complaints"
  badge={faqCounts.generalComplaints}
  collapsed={collapsed}
  active={panel === 'general'}
  onClick={() => go('general')}
/>

{!collapsed && (
  <div
  style={{
    ...S.sectionLabel,
    color: darkMode
      ? 'rgba(255,255,255,0.25)'
      : '#64748b'
  }}
>
  🔧 SERVICE REQUESTS
  </div>
)}

<NI
  icon="🔧"
  
  darkMode={darkMode}

  label="Service Requests"
  badge={faqCounts.serviceRequests}
  collapsed={collapsed}
  active={panel === 'service'}
  onClick={() => go('service')}
/>

{!collapsed && (
  <div
  style={{
    ...S.sectionLabel,
    color: darkMode
      ? 'rgba(255,255,255,0.25)'
      : '#64748b'
  }}
>
  💌 FEEDBACK & OTHERS
  </div>
)}

<NI
  icon="💌"
  
  darkMode={darkMode}

  label="Feedback & Others"
  badge={faqCounts.feedback}
  collapsed={collapsed}
  active={panel === 'feedback'}
  onClick={() => go('feedback')}
/>


{!collapsed && (
  <div
  style={{
    ...S.sectionLabel,
    color: darkMode
      ? 'rgba(255,255,255,0.25)'
      : '#64748b'
  }}
>
  🆕 UPDATES
  </div>
)}

<NI
  icon="🆕"
  
  darkMode={darkMode}

  label="New Updates"
  collapsed={collapsed}
  active={panel === '_updates'}
  onClick={() => go('_updates')}
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

    <NI
      icon="🏷️"
      
  darkMode={darkMode}

      label="Case Categorizer"
      sub
      collapsed={collapsed}
      active={panel === '_ai-categorizer'}
      onClick={() => go('_ai-categorizer')}
    />
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
    '_restree',
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

    <NI sub icon="🌳" label="Resolution Tree" collapsed={collapsed}
    
  darkMode={darkMode}

      active={panel === '_restree'}
      onClick={() => go('_restree')}
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

{/* TOOLS */}
<NI
folder
  icon="🛠️"
  
  darkMode={darkMode}

  label="Tools"
  collapsed={collapsed}
  active={
  ['_maintenance','_kyc']
    .includes(panel)
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
    <NI
      sub
      icon="🔧"
      
  darkMode={darkMode}

      label="Maintenance Lookup"
      collapsed={collapsed}
      active={panel === '_maintenance'}
      onClick={() => go('_maintenance')}
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
  </>
)}

{/* PERSONAL */}
<NI
folder
  icon="⭐"
  
  darkMode={darkMode}

  label="Personal"
  collapsed={collapsed}
 active={['_bookmarks'].includes(panel)}
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
    <NI
      sub
      icon="✨"
      
  darkMode={darkMode}

      label="My Bookmarks"
      collapsed={collapsed}
      active={panel === '_bookmarks'}
      onClick={() => go('_bookmarks')}
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
    <NI
      sub
      icon="🛠️"
      label="Admin Panel"
      collapsed={collapsed}
      darkMode={darkMode}
      active={panel === '_admin'}
      onClick={() => go('_admin')}
    />

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
        ? '7px 12px 7px 28px'
        : '9px 12px',
      }}
    >
      <span style={{ fontSize: collapsed ? '18px' : '15px', flexShrink:0, width:'22px', textAlign:'center' }}>{icon}</span>
      {!collapsed && (
        <>
          <span style={{
            flex:1, fontSize:'13px',fontWeight: folder ? '700' : active ? '700' : '500',
            color: active
  ? (darkMode ? '#fff' : '#0B1120')
  : darkMode
    ? 'rgba(255,255,255,0.7)'
    : '#475569',

            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'left'
          }}>{label}</span>
          {badge !== undefined && (
            <span style={{
              fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'100px', flexShrink:0,
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

fontWeight:'800',
minWidth:'24px',
textAlign:'center',
            }}>{badge}</span>
          )}
          {suffix}
        </>
      )}
    </button>
  );
}

const S = {


sectionLabel: {
  padding: '10px 18px 2px',
  fontSize: '9px',
  fontWeight: '800',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.25)',
},


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
  logoFull: {
    width:'150px', height:'auto', objectFit:'contain',
    flexShrink:0,
  },
  logoCollapsed: {
    width:'36px', height:'auto', objectFit:'contain',
    margin:'0 auto',
  },

    brandSub: { fontSize:'9px', color:'rgba(255,255,255,0.3)', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' },

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

  searchWrap: { margin:'10px 10px 4px', position:'relative', display:'flex', alignItems:'center' },
  searchIco: { position:'absolute', left:'11px', fontSize:'12px', pointerEvents:'none', opacity:0.4 },
  searchInput: {
  width:'100%',
  padding:'8px 28px 8px 30px',
  borderRadius:'10px',
  fontSize:'12.5px',
  fontFamily:'inherit',
  outline:'none',
  boxSizing:'border-box'
},
  searchClear: { position:'absolute', right:'9px', background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:'11px' },

  nav: { flex:1, overflowY:'auto', overflowX:'hidden', padding:'6px 0' },
  groupLabel: { padding:'10px 14px 3px', fontSize:'9px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.15em', color:'rgba(255,255,255,0.28)', whiteSpace:'nowrap' },

  ni: {
    display:'flex', alignItems:'center', gap:'9px',
    width:'calc(100% - 14px)', margin:'1px 7px',
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