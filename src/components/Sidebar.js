import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import React, { useState, useEffect, useMemo } from 'react';


const NAVY = '#0B1120';
const ORANGE = '#FF6B35';
const RK_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTM3IiBoZWlnaHQ9IjM1IiB2aWV3Qm94PSIwIDAgMTM3IDM1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNTEuNzg4MSAyMC41MTM0SDUwLjU1NDFWMjMuNzA4OUg0NlYxMS4wMDE3SDUyLjUwMjNDNTMuNzUwNCAxMS4wMDE3IDU0LjgzNzcgMTEuMTk2MyA1NS43NjIzIDExLjU4MjJDNTYuNjg4NyAxMS45Njk4IDU3LjQwMjkgMTIuNTI1NCA1Ny45MDMyIDEzLjI1MjNDNTguNDA1MyAxMy45NzkzIDU4LjY1NjMgMTQuODI2IDU4LjY1NjMgMTUuNzk0MUM1OC42NTYzIDE2LjcwMjQgNTguNDM3MSAxNy40OTQyIDU4LjAwMDQgMTguMTcyOUM1Ny41NjM4IDE4Ljg1MTYgNTYuOTMyNiAxOS4zODg5IDU2LjEwODggMTkuNzg4MUw1OC45NDQ1IDIzLjcwODlINTQuMDgyOEw1MS43ODYzIDIwLjUxMzRINTEuNzg4MVpNNTMuNjAxOSAxNC42OTQ2QzUzLjI5MjUgMTQuNDM1MSA1Mi44Mjk0IDE0LjMwMzYgNTIuMjEyNCAxNC4zMDM2SDUwLjU1MjNWMTcuMjgxMkg1Mi4yMTI0QzUyLjgyOTQgMTcuMjgxMiA1My4yOTI1IDE3LjE1MTUgNTMuNjAxOSAxNi44OTAzQzUzLjkxMTMgMTYuNjMwOCA1NC4wNjUxIDE2LjI2MzIgNTQuMDY1MSAxNS43OTI1QzU0LjA2NTEgMTUuMzIxNyA1My45MTEzIDE0Ljk1NDEgNTMuNjAxOSAxNC42OTQ2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNNjIuNDIwMiAyMi40MTk3QzYxLjI2MjIgMjEuMzY2NyA2MC42ODQxIDE5Ljg4OTYgNjAuNjg0MSAxNy45ODk5VjExSDY1LjIzODJWMTcuODYxOEM2NS4yMzgyIDE4Ljc5MzMgNjUuNDE1IDE5LjQ3MiA2NS43Njg2IDE5Ljg5NDZDNjYuMTIyMSAyMC4zMTg3IDY2LjYzMyAyMC41MyA2Ny4zMDMxIDIwLjUzQzY3Ljk3MzEgMjAuNTMgNjguNDgyMyAyMC4zMTg3IDY4LjgzNzYgMTkuODk0NkM2OS4xOTEyIDE5LjQ3MDQgNjkuMzY4IDE4Ljc5MzMgNjkuMzY4IDE3Ljg2MThWMTFINzMuODQ0M1YxNy45ODk5QzczLjg0NDMgMTkuODg5NiA3My4yNjYyIDIxLjM2NjcgNzIuMTA4MiAyMi40MTk3QzcwLjk1MDIgMjMuNDcyNyA2OS4zMzYyIDI0IDY3LjI2NiAyNEM2NS4xOTU4IDI0IDYzLjU4MTcgMjMuNDcyNyA2Mi40MjM3IDIyLjQxOTciIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTg5LjY2MzMgMTFWMjMuNzA3Mkg4NS45MjA3TDgwLjc4NjggMTcuOTM1VjIzLjcwNzJINzYuMzQ5NFYxMUg4MC4wOTM4TDg1LjIyNiAxNi43NzIyVjExSDg5LjY2MzNaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik05Ni4zNTgzIDIxLjQ5MzJMOTUuNDUxNCAyMy43MDg5SDkwLjgyMTNMOTYuNzI2MSAxMUgxMDEuMjAyTDEwNy4xMDcgMjMuNzA4OUgxMDIuMzk5TDEwMS40OTIgMjEuNDkzMkg5Ni4zNTgzWk0xMDAuMjM1IDE4LjQwNzRMOTguOTIzNSAxNS4yMTE5TDk3LjYxMTggMTguNDA3NEgxMDAuMjM1WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMTEzLjc2MSAxOS40OTUzTDExMi43MzggMjAuNTY2NlYyMy43MDcySDEwOC4yNjJWMTFIMTEyLjczOFYxNS42MTExTDExNy4xNzUgMTFIMTIyLjEzNEwxMTYuNzMxIDE2LjU5MDlMMTIyLjQwNSAyMy43MDcySDExNy4xMzhMMTEzLjc2MSAxOS40OTUzWiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMTI4IDExSDEyMy40NDZWMjMuNzA3MkgxMjhWMTFaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0zLjAwMTIxIDIyLjEyNTNDMy4wMDEyMSAyMi4xMjUzIDExLjY2MDggMTguMDg0NCAyNS42MDc0IDE4LjA1MThDMjIuNjgyOSAxOS43OTI5IDIyLjAxNDUgMjAuNzAxMSAyMi4wMTQ1IDIwLjcwMTFDMjIuMDE0NSAyMC43MDExIDMxLjU0MjMgMTkuNTAxOCAzNy43MTcgMjIuMTU0NUMzMS43MTkxIDIxLjYyMDYgMjIuMDI3OCAyMi40ODI3IDE1LjY0IDI0LjUwMDRDMTUuODAzNSAyMy44Njk4IDE3LjMxNiAyMS44MDA0IDE4LjgyMzYgMjAuNjE2OEMxOC44MjM2IDIwLjYxNjggNS41NzMyOSAyMS40NDMgMyAyMi4xMjUzIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0zOS41NjI1IDExLjY2NDVMMzEuMTY2OSAxMi43OTQyTDM0LjIxOTggNS40NDg1N0wyNy4xODUzIDkuODQ5MkwyNi41MDM1IDJMMjIuMjIxNiA4Ljc5NTk3TDE3LjkzNiAyTDE3LjI1NTQgOS44NDgwOEwxMC4yMTk3IDUuNDUwODJMMTMuMjc1IDEyLjc5NjRMNC44Nzk0MiAxMS42NjY4TDExLjA2NSAxNy4wNTU1TDQuMzg1MzUgMjAuMzc1OUM2LjIwNTQyIDE5LjY0MyA4LjM5NDgzIDE4LjkwMTEgMTAuOTIyMSAxOC4zMDg4QzEzLjE1MDMgMTcuNzg2MSAxNS4yMDA0IDE3LjQ4MjYgMTYuOTkyNiAxNy4zMDk1QzE2Ljc1ODkgMTcuMTk5MyAxNi41MjUyIDE3LjA4OCAxNi4yOTI3IDE2Ljk3NzlMOC40MTkwNSAxMy4yNDk0TDE3Ljg3MDYgMTYuMTk4OUwxMi42Njk1IDguMzAxMzlMMTkuNTIxMSAxNS4wMjU0TDE4LjgxMTUgNS41NTUzNUwyMi4wNDg0IDE0LjY5MDVMMjUuNjI4IDUuNTU0MjNMMjQuMTE3OSAxNC44MjY1TDMxLjc3IDguMjk5MTVMMjYuMzk5NCAxNS44ODUzTDM2LjAyMjkgMTMuMjQ2MUMzNC41MDE5IDE0LjAxNiAyOS40NjE5IDE3Ljc4OTUgMjUuODUzMiAxOS40MTkzQzI5LjIxNDkgMTguOTIwMiAzMy4yMDEzIDE5LjI4MzMgMzYuODY2OSAyMC44NjE1QzM0LjkwMTUgMTkuMjM3MiAzMi4xNTM5IDE4LjEwNDIgMzEuNDY0OCAxOC4wNTAyTDM5LjU2MjUgMTEuNjYzNFYxMS42NjQ1WiIgZmlsbD0iI0QyQUQ1MCIvPgo8L3N2Zz4K";

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
    ['_bookmarks', '_evaluations'].includes(panel)
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
        ? '4px 0 30px rgba(0,0,0,.5)'
        : 'none'
    } : {})
  }}
>
      {/* ── BRAND ── */}
      <div style={S.brand}>
        {collapsed ? (
          <img src={RK_LOGO} alt="Runaki" style={S.logoCollapsed} />
        ) : (
          <>
            <img src={RK_LOGO} alt="Runaki" style={S.logoFull} />

          </>
        )}
      </div>

      {/* ── USER CARD ── */}
      <div onClick={() => { navigate('/profile'); if(isMobile) setMobileOpen(false); }} style={{ ...S.userCard, padding: collapsed ? '12px 0' : '12px 14px', justifyContent: collapsed ? 'center' : 'flex-start', cursor:'pointer' }} title="My Profile">
        <div style={S.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
        {!collapsed && (
          <div style={{ flex:1, minWidth:0 }}>
            <div
  style={{
    ...S.userName,
    color: darkMode ? '#fff' : '#0B1120'
  }}
>{user?.name}</div>
            <span style={{ ...S.roleBadge, color:rm.color, background:rm.bg }}>
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
    panel.startsWith('inq-') ||
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
          color:'rgba(255,255,255,.45)',
          textTransform:'uppercase',
          letterSpacing:'0.08em'
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

  label="✨ RUNAKI AI PRO"
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
          color:'rgba(255,255,255,.45)',
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
  icon="🧠"
  
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
          color:'rgba(255,255,255,.45)',
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
          color:'rgba(255,255,255,.45)',
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
  active={
  ['_bookmarks','_evaluations']
    .includes(panel)
}
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
          color:'rgba(255,255,255,.45)',
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
      icon="⭐"
      
  darkMode={darkMode}

      label="My Bookmarks"
      collapsed={collapsed}
      active={panel === '_bookmarks'}
      onClick={() => go('_bookmarks')}
    />

    <NI
      sub
      icon="📝"
      
  darkMode={darkMode}

      label="My Evaluations"
      collapsed={collapsed}
      active={panel === '_evaluations'}
      onClick={() => go('_evaluations')}
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