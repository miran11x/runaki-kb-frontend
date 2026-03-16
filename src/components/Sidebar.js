import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ORANGE = '#FF6B35';
const RK_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTM3IiBoZWlnaHQ9IjM1IiB2aWV3Qm94PSIwIDAgMTM3IDM1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNNTEuNzg4MSAyMC41MTM0SDUwLjU1NDFWMjMuNzA4OUg0NlYxMS4wMDE3SDUyLjUwMjNDNTMuNzUwNCAxMS4wMDE3IDU0LjgzNzcgMTEuMTk2MyA1NS43NjIzIDExLjU4MjJDNTYuNjg4NyAxMS45Njk4IDU3LjQwMjkgMTIuNTI1NCA1Ny45MDMyIDEzLjI1MjNDNTguNDA1MyAxMy45NzkzIDU4LjY1NjMgMTQuODI2IDU4LjY1NjMgMTUuNzk0MUM1OC42NTYzIDE2LjcwMjQgNTguNDM3MSAxNy40OTQyIDU4LjAwMDQgMTguMTcyOUM1Ny41NjM4IDE4Ljg1MTYgNTYuOTMyNiAxOS4zODg5IDU2LjEwODggMTkuNzg4MUw1OC45NDQ1IDIzLjcwODlINTQuMDgyOEw1MS43ODYzIDIwLjUxMzRINTEuNzg4MVpNNTMuNjAxOSAxNC42OTQ2QzUzLjI5MjUgMTQuNDM1MSA1Mi44Mjk0IDE0LjMwMzYgNTIuMjEyNCAxNC4zMDM2SDUwLjU1MjNWMTcuMjgxMkg1Mi4yMTI0QzUyLjgyOTQgMTcuMjgxMiA1My4yOTI1IDE3LjE1MTUgNTMuNjAxOSAxNi44OTAzQzUzLjkxMTMgMTYuNjMwOCA1NC4wNjUxIDE2LjI2MzIgNTQuMDY1MSAxNS43OTI1QzU0LjA2NTEgMTUuMzIxNyA1My45MTEzIDE0Ljk1NDEgNTMuNjAxOSAxNC42OTQ2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNNjIuNDIwMiAyMi40MTk3QzYxLjI2MjIgMjEuMzY2NyA2MC42ODQxIDE5Ljg4OTYgNjAuNjg0MSAxNy45ODk5VjExSDY1LjIzODJWMTcuODYxOEM2NS4yMzgyIDE4Ljc5MzMgNjUuNDE1IDE5LjQ3MiA2NS43Njg2IDE5Ljg5NDZDNjYuMTIyMSAyMC4zMTg3IDY2LjYzMyAyMC41MyA2Ny4zMDMxIDIwLjUzQzY3Ljk3MzEgMjAuNTMgNjguNDgyMyAyMC4zMTg3IDY4LjgzNzYgMTkuODk0NkM2OS4xOTEyIDE5LjQ3MDQgNjkuMzY4IDE4Ljc5MzMgNjkuMzY4IDE3Ljg2MThWMTFINzMuODQ0M1YxNy45ODk5QzczLjg0NDMgMTkuODg5NiA3My4yNjYyIDIxLjM2NjcgNzIuMTA4MiAyMi40MTk3QzcwLjk1MDIgMjMuNDcyNyA2OS4zMzYyIDI0IDY3LjI2NiAyNEM2NS4xOTU4IDI0IDYzLjU4MTcgMjMuNDcyNyA2Mi40MjM3IDIyLjQxOTciIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTg5LjY2MzMgMTFWMjMuNzA3Mkg4NS45MjA3TDgwLjc4NjggMTcuOTM1VjIzLjcwNzJINzYuMzQ5NFYxMUg4MC4wOTM4TDg1LjIyNiAxNi43NzIyVjExSDg5LjY2MzNaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik05Ni4zNTgzIDIxLjQ5MzJMOTUuNDUxNCAyMy43MDg5SDkwLjgyMTNMOTYuNzI2MSAxMUgxMDEuMjAyTDEwNy4xMDcgMjMuNzA4OUgxMDIuMzk5TDEwMS40OTIgMjEuNDkzMkg5Ni4zNTgzWk0xMDAuMjM1IDE4LjQwNzRMOTguOTIzNSAxNS4yMTE5TDk3LjYxMTggMTguNDA3NEgxMDAuMjM1WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMTEzLjc2MSAxOS40OTUzTDExMi43MzggMjAuNTY2NlYyMy43MDcySDEwOC4yNjJWMTFIMTEyLjczOFYxNS42MTExTDExNy4xNzUgMTFIMTIyLjEzNEwxMTYuNzMxIDE2LjU5MDlMMTIyLjQwNSAyMy43MDcySDExNy4xMzhMMTEzLjc2MSAxOS40OTUzWiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMTI4IDExSDEyMy40NDZWMjMuNzA3MkgxMjhWMTFaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0zLjAwMTIxIDIyLjEyNTNDMy4wMDEyMSAyMi4xMjUzIDExLjY2MDggMTguMDg0NCAyNS42MDc0IDE4LjA1MThDMjIuNjgyOSAxOS43OTI5IDIyLjAxNDUgMjAuNzAxMSAyMi4wMTQ1IDIwLjcwMTFDMjIuMDE0NSAyMC43MDExIDMxLjU0MjMgMTkuNTAxOCAzNy43MTcgMjIuMTU0NUMzMS43MTkxIDIxLjYyMDYgMjIuMDI3OCAyMi40ODI3IDE1LjY0IDI0LjUwMDRDMTUuODAzNSAyMy44Njk4IDE3LjMxNiAyMS44MDA0IDE4LjgyMzYgMjAuNjE2OEMxOC44MjM2IDIwLjYxNjggNS41NzMyOSAyMS40NDMgMyAyMi4xMjUzIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0zOS41NjI1IDExLjY2NDVMMzEuMTY2OSAxMi43OTQyTDM0LjIxOTggNS40NDg1N0wyNy4xODUzIDkuODQ5MkwyNi41MDM1IDJMMjIuMjIxNiA4Ljc5NTk3TDE3LjkzNiAyTDE3LjI1NTQgOS44NDgwOEwxMC4yMTk3IDUuNDUwODJMMTMuMjc1IDEyLjc5NjRMNC44Nzk0MiAxMS42NjY4TDExLjA2NSAxNy4wNTU1TDQuMzg1MzUgMjAuMzc1OUM2LjIwNTQyIDE5LjY0MyA4LjM5NDgzIDE4LjkwMTEgMTAuOTIyMSAxOC4zMDg4QzEzLjE1MDMgMTcuNzg2MSAxNS4yMDA0IDE3LjQ4MjYgMTYuOTkyNiAxNy4zMDk1QzE2Ljc1ODkgMTcuMTk5MyAxNi41MjUyIDE3LjA4OCAxNi4yOTI3IDE2Ljk3NzlMOC40MTkwNSAxMy4yNDk0TDE3Ljg3MDYgMTYuMTk4OUwxMi42Njk1IDguMzAxMzlMMTkuNTIxMSAxNS4wMjU0TDE4LjgxMTUgNS41NTUzNUwyMi4wNDg0IDE0LjY5MDVMMjUuNjI4IDUuNTU0MjNMMjQuMTE3OSAxNC44MjY1TDMxLjc3IDguMjk5MTVMMjYuMzk5NCAxNS44ODUzTDM2LjAyMjkgMTMuMjQ2MUMzNC41MDE5IDE0LjAxNiAyOS40NjE5IDE3Ljc4OTUgMjUuODUzMiAxOS40MTkzQzI5LjIxNDkgMTguOTIwMiAzMy4yMDEzIDE5LjI4MzMgMzYuODY2OSAyMC44NjE1QzM0LjkwMTUgMTkuMjM3MiAzMi4xNTM5IDE4LjEwNDIgMzEuNDY0OCAxOC4wNTAyTDM5LjU2MjUgMTEuNjYzNFYxMS42NjQ1WiIgZmlsbD0iI0QyQUQ1MCIvPgo8L3N2Zz4K";

const ROLE_META = {
  team_lead: { label: 'Team Lead', color: '#a78bfa', bg: 'rgba(167,139,250,0.18)' },
  qa_officer: { label: 'QA Officer', color: '#34d399', bg: 'rgba(52,211,153,0.18)' },
  agent: { label: 'Agent', color: '#60a5fa', bg: 'rgba(96,165,250,0.18)' },
};

const FAQ_CHILDREN = [
  { id:'inq-runaki',  icon:'🏗️', label:'Runaki Project',    badge:24 },
  { id:'inq-kyc',     icon:'🪪',  label:'KYC',              badge:24 },
  { id:'inq-billing', icon:'💳', label:'Billing Inquiries',  badge:18 },
  { id:'inq-dunning', icon:'⚠️', label:'Dunning',           badge:14 },
  { id:'inq-epsule',  icon:'📱', label:'e-Psûle',           badge:11 },
  { id:'inq-ussd',    icon:'📲', label:'USSD',              badge:5  },
  { id:'inq-solar',   icon:'☀️', label:'Solar & Other',     badge:7  },
];

const FAQ_ITEMS = [
  { id:'billing',  icon:'💳', label:'Billing Complaints',  badge:22 },
  { id:'general',  icon:'⚡', label:'General Complaints',  badge:7  },
  { id:'service',  icon:'🔧', label:'Service Requests',    badge:9  },
  { id:'feedback', icon:'💌', label:'Feedback & Others',   badge:2  },
];

const RESOURCE_ITEMS = [
  { id:'_restree',  icon:'🌳', label:'Resolution Tree'     },
  { id:'_scripts',  icon:'📞', label:'Scripts & Processes' },
  { id:'_priority', icon:'🎯', label:'Case Priorities'     },
  { id:'_updates',  icon:'🆕', label:'New Updates', badge:6, hot:true },
];

export default function Sidebar({ panel, setPanel, search, setSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [inqOpen, setInqOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const rm = ROLE_META[user?.role] || ROLE_META.agent;

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
      style={{ ...S.aside, width: collapsed ? '68px' : '260px' }}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
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
      <div style={{ ...S.userCard, padding: collapsed ? '12px 0' : '12px 14px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={S.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
        {!collapsed && (
          <div style={{ flex:1, minWidth:0 }}>
            <div style={S.userName}>{user?.name}</div>
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
            onChange={e => { setSearch(e.target.value); if (e.target.value) go('_search'); }}
            style={S.searchInput}
          />
          {search && (
            <button style={S.searchClear} onClick={() => { setSearch(''); setPanel('billing'); }}>✕</button>
          )}
        </div>
      )}

      {/* ── NAV ── */}
      <nav style={S.nav}>

        {/* Knowledge Base */}
        {!collapsed && <div style={S.groupLabel}>📋 Knowledge Base</div>}

        <NI icon="💬" label="Inquiries" badge={103} collapsed={collapsed}
          active={panel==='inquiries'}
          onClick={() => { setInqOpen(!inqOpen); go('inquiries'); }}
          suffix={!collapsed && (
            <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)', transition:'transform .2s', display:'inline-block', transform: inqOpen?'rotate(90deg)':'none' }}>›</span>
          )}
        />
        {inqOpen && !collapsed && FAQ_CHILDREN.map(c => (
          <NI key={c.id} icon={c.icon} label={c.label} badge={c.badge} sub collapsed={collapsed}
            active={panel===c.id} onClick={() => go(c.id)} />
        ))}
        {FAQ_ITEMS.map(item => (
          <NI key={item.id} icon={item.icon} label={item.label} badge={item.badge} collapsed={collapsed}
            active={panel===item.id} onClick={() => go(item.id)} />
        ))}

        {/* Resources */}
        {!collapsed && <div style={{ ...S.groupLabel, marginTop:'6px' }}>🗂️ Resources</div>}
        {RESOURCE_ITEMS.map(item => (
          <NI key={item.id} icon={item.icon} label={item.label} badge={item.badge} hot={item.hot} collapsed={collapsed}
            active={panel===item.id} onClick={() => go(item.id)} />
        ))}

        {/* Management */}
        {(user?.role === 'qa_officer' || user?.role === 'team_lead') && (
          <>
            {!collapsed && <div style={{ ...S.groupLabel, marginTop:'6px' }}>⚙️ Management</div>}
            <NI icon="✏️" label="FAQ Editor" collapsed={collapsed}
              active={location.pathname==='/editor'}
              onClick={() => navigate('/editor')} />
            {user?.role === 'team_lead' && (
              <NI icon="📊" label="Admin Panel" collapsed={collapsed}
                active={location.pathname==='/admin'}
                onClick={() => navigate('/admin')} />
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
  );
}

function NI({ icon, label, badge, active, sub, onClick, suffix, hot, collapsed }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={collapsed ? label : undefined}
      style={{
        ...S.ni,
        ...(sub && !collapsed ? S.niSub : {}),
        ...(active ? S.niActive : hov ? S.niHov : {}),
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : sub ? '7px 12px 7px 22px' : '9px 12px',
      }}
    >
      <span style={{ fontSize: collapsed ? '18px' : '15px', flexShrink:0, width:'22px', textAlign:'center' }}>{icon}</span>
      {!collapsed && (
        <>
          <span style={{
            flex:1, fontSize:'13px', fontWeight: active?'700':'500',
            color: active?'#fff':'rgba(255,255,255,0.7)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'left'
          }}>{label}</span>
          {badge !== undefined && (
            <span style={{
              fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'100px', flexShrink:0,
              background: active?'rgba(255,255,255,0.2)': hot?'rgba(255,107,53,0.25)':'rgba(255,255,255,0.1)',
              color: active?'#fff': hot?ORANGE:'rgba(255,255,255,0.55)',
            }}>{badge}</span>
          )}
          {suffix}
        </>
      )}
    </button>
  );
}

const S = {
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

  brandName: { fontSize:'15px', fontWeight:'800', color:'#fff', letterSpacing:'-0.01em', whiteSpace:'nowrap' },
  brandSub: { fontSize:'9px', color:'rgba(255,255,255,0.3)', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' },

  userCard: {
    display:'flex', alignItems:'center', gap:'10px',
    borderBottom:'1px solid rgba(255,255,255,0.06)',
    minHeight:'64px', flexShrink:0,
  },
  avatar: {
    width:'36px', height:'36px', borderRadius:'10px',
    background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'15px', fontWeight:'800', color:'#fff', flexShrink:0,
    boxShadow:'0 4px 12px rgba(99,102,241,0.35)',
  },
  userName: { fontSize:'13px', fontWeight:'700', color:'#fff', marginBottom:'5px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  roleBadge: { fontSize:'9.5px', fontWeight:'800', padding:'3px 9px', borderRadius:'100px', textTransform:'uppercase', letterSpacing:'0.07em', display:'inline-block' },

  searchWrap: { margin:'10px 10px 4px', position:'relative', display:'flex', alignItems:'center' },
  searchIco: { position:'absolute', left:'11px', fontSize:'12px', pointerEvents:'none', opacity:0.4 },
  searchInput: { width:'100%', padding:'8px 28px 8px 30px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'#fff', fontSize:'12.5px', fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  searchClear: { position:'absolute', right:'9px', background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:'11px' },

  nav: { flex:1, overflowY:'auto', overflowX:'hidden', padding:'6px 0' },
  groupLabel: { padding:'10px 14px 3px', fontSize:'9px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.15em', color:'rgba(255,255,255,0.28)', whiteSpace:'nowrap' },

  ni: {
    display:'flex', alignItems:'center', gap:'9px',
    width:'calc(100% - 14px)', margin:'1px 7px',
    borderRadius:'10px', border:'none', background:'transparent',
    cursor:'pointer', fontFamily:'inherit', transition:'all .14s',
    boxSizing:'border-box', overflow:'hidden', whiteSpace:'nowrap',
  },
  niSub: { paddingLeft:'26px !important' },
  niActive: {
    background:'rgba(255,107,53,0.15)',
    borderLeft:`2px solid ${ORANGE}`,
    paddingLeft:'10px',
  },
  niHov: { background:'rgba(255,255,255,0.06)' },

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