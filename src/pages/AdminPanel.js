import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import toast from 'react-hot-toast';

const NAVY = '#0B1120';
const ORANGE = '#FF6B35';
const ROLE_COLORS = { team_lead:'#8b5cf6', qa_officer:'#10b981', agent:'#3b82f6' };
const ROLE_LABELS = { team_lead:'Team Lead', qa_officer:'QA Officer', agent:'Agent' };

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState('dashboard');
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [activeList, setActive] = useState([]);
  const [activity, setActivity] = useState([]);
  const [topFAQs, setTopFAQs]   = useState([]);
  const [showAdd, setShowAdd]   = useState(false);
  const [newUser, setNewUser]   = useState({ name:'', email:'', password:'', role:'agent', title:'' });
  const [loading, setLoading]   = useState(false);
  const [uSearch, setUSearch]   = useState('');

  const load = useCallback(async () => {
    try {
      const [s,u,al,act,tf] = await Promise.all([
        api.get('/users/stats'), api.get('/users'),
        api.get('/users/active-list'), api.get('/users/activity'),
        api.get('/faqs/top-viewed'),
      ]);
      setStats(s.data); setUsers(u.data); setActive(al.data);
      setActivity(act.data); setTopFAQs(tf.data);
    } catch { toast.error('Failed to load'); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const createUser = async e => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/users', newUser);
      toast.success('User created!');
      setShowAdd(false);
      setNewUser({ name:'', email:'', password:'', role:'agent', title:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const toggleActive = async u => {
    await api.patch(`/users/${u.id}`, { is_active: !u.is_active });
    toast.success(u.is_active ? 'Deactivated' : 'Activated'); load();
  };

  const deleteUser = async id => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    toast.success('Deleted'); load();
  };

  const changeRole = async (u, role) => {
    await api.patch(`/users/${u.id}`, { role });
    toast.success('Role updated'); load();
  };

  const loginData = stats?.loginsWeek?.map(d => ({
    day: new Date(d.day).toLocaleDateString('en', { weekday:'short' }),
    logins: parseInt(d.count),
  })) || [];

  const roleData = (() => {
    if (!users.length) return stats?.byRole?.map(r => ({
      name: ROLE_LABELS[r.role] || r.role,
      value: parseInt(r.count),
      color: ROLE_COLORS[r.role] || '#94a3b8',
    })) || [];
    const counts = {};
    users.forEach(u => {
      const label = u.role === 'agent' ? 'Agent'
        : u.role === 'team_lead' ? 'Team Lead'
        : (u.title && u.title.toLowerCase().includes('coordinator')) ? 'Team Coordinator'
        : 'QA Officer';
      counts[label] = (counts[label] || 0) + 1;
    });
    const colorMap = { 'Agent':'#3b82f6','Team Lead':'#8b5cf6','QA Officer':'#10b981','Team Coordinator':'#f59e0b' };
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: colorMap[name]||'#94a3b8' }));
  })();

  const barData = topFAQs.slice(0,5).map(f => ({
    name: f.question_en.substring(0,18) + '...',
    views: f.views,
  }));

  const filtered = users.filter(u =>
    !uSearch || u.name.toLowerCase().includes(uSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(uSearch.toLowerCase())
  );

  const TABS = [['dashboard','📊 Dashboard'],['users','👥 Users'],['active','🟢 Live'],['activity','📋 Activity']];

  const STAT_CARDS = stats ? [
    { label:'Total Users',  value:stats.totalUsers,  icon:'👥', color:'#6366f1', bg:'linear-gradient(135deg,#6366f1,#4f46e5)', light:'#eef2ff' },
    { label:'Active Now',   value:stats.activeNow,   icon:'🟢', color:'#10b981', bg:'linear-gradient(135deg,#10b981,#059669)', light:'#ecfdf5', live:true },
    { label:'Total FAQs',   value:stats.totalFAQs,   icon:'📖', color:'#f59e0b', bg:'linear-gradient(135deg,#f59e0b,#d97706)', light:'#fffbeb' },
    { label:'Total Logins', value:stats.totalLogins, icon:'🔐', color:'#8b5cf6', bg:'linear-gradient(135deg,#8b5cf6,#7c3aed)', light:'#f5f3ff' },
  ] : [];

  return (
    <div style={S.layout}>
      <Sidebar panel={null} setPanel={() => navigate('/')} search={''} setSearch={() => {}} />
      <div style={S.body}>
        <Topbar title="Admin Panel" subtitle="System analytics & management" />
        <div style={S.tabBar}>
          {TABS.map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...S.tab, ...(tab===k ? S.tabOn : {}) }}>{l}</button>
          ))}
        </div>
        <div style={S.content}>

          {tab === 'dashboard' && (
            <div>
              <div style={S.statGrid}>
                {STAT_CARDS.map((sc, i) => (
                  <div key={i} style={S.statCard}>
                    <div style={{ position:'absolute',top:0,right:0,width:'80px',height:'80px',background:sc.light,borderRadius:'0 18px 0 80px',opacity:0.6 }} />
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'18px' }}>
                      <div style={{ width:'46px',height:'46px',background:sc.bg,borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',boxShadow:`0 6px 16px ${sc.color}40` }}>{sc.icon}</div>
                      {sc.live && <span style={{ fontSize:'10px',fontWeight:'800',color:'#16a34a',background:'#f0fdf4',padding:'4px 10px',borderRadius:'100px',display:'flex',alignItems:'center',gap:'4px' }}><span style={{ width:'6px',height:'6px',background:'#22c55e',borderRadius:'50%' }} />Live</span>}
                    </div>
                    <div style={{ fontSize:'36px',fontWeight:'900',color:NAVY,letterSpacing:'-0.03em',lineHeight:1 }}>{sc.value ?? '—'}</div>
                    <div style={{ fontSize:'12px',fontWeight:'700',color:'#94a3b8',marginTop:'8px',textTransform:'uppercase',letterSpacing:'0.06em' }}>{sc.label}</div>
                  </div>
                ))}
              </div>

              <div style={S.chartsRow}>
                <div style={S.chartCard}>
                  <div style={S.chartHead}><div style={S.chartTitle}>Login Activity</div><div style={S.chartSub}>Last 7 days</div></div>
                  {loginData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={loginData} margin={{ top:5,right:5,bottom:0,left:-20 }}>
                        <defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ORANGE} stopOpacity={0.25}/><stop offset="95%" stopColor={ORANGE} stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize:11,fill:'#94a3b8' }} />
                        <YAxis tick={{ fontSize:11,fill:'#94a3b8' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius:'12px',border:'1px solid #e2e8f0',fontSize:'12px' }} />
                        <Area type="monotone" dataKey="logins" stroke={ORANGE} strokeWidth={2.5} fill="url(#lg1)" dot={{ fill:ORANGE,r:4,strokeWidth:0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div style={S.noData}>No login data yet</div>}
                </div>

                <div style={S.chartCard}>
                  <div style={S.chartHead}><div style={S.chartTitle}>Users by Role</div><div style={S.chartSub}>{stats?.totalUsers || 0} total</div></div>
                  {roleData.length > 0 ? (
                    <div style={{ display:'flex',alignItems:'center',gap:'16px' }}>
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart><Pie data={roleData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">{roleData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={{ borderRadius:'12px',fontSize:'12px' }}/></PieChart>
                      </ResponsiveContainer>
                      <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
                        {roleData.map((r,i) => (
                          <div key={i} style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                            <span style={{ width:'10px',height:'10px',borderRadius:'50%',background:r.color,flexShrink:0 }} />
                            <span style={{ fontSize:'12px',color:'#475569',fontWeight:'600',flex:1 }}>{r.name}</span>
                            <span style={{ fontSize:'15px',fontWeight:'800',color:NAVY }}>{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <div style={S.noData}>Loading...</div>}
                </div>

                <div style={S.chartCard}>
                  <div style={S.chartHead}><div style={S.chartTitle}>Top Viewed FAQs</div><div style={S.chartSub}>By views</div></div>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={barData} layout="vertical" margin={{ top:0,right:10,bottom:0,left:-10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize:10,fill:'#94a3b8' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize:10,fill:'#94a3b8' }} width={80} />
                        <Tooltip contentStyle={{ borderRadius:'12px',fontSize:'12px' }} />
                        <Bar dataKey="views" fill="#6366f1" radius={[0,8,8,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div style={S.noData}>No view data yet</div>}
                </div>
              </div>

              <div style={S.section}>
                <div style={S.sectionHead}><div style={S.sectionTitle}>🟢 Currently Online</div><div style={S.sectionCount}>{activeList.length} agents</div></div>
                {activeList.length === 0 ? <div style={S.empty}>No agents online right now</div> : (
                  <div style={S.onlineGrid}>
                    {activeList.map(u => (
                      <div key={u.id} style={S.onlineCard}>
                        <div style={{ ...S.onlineAv,background:ROLE_COLORS[u.role]||'#6366f1' }}>{u.name[0]}</div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:'13.5px',fontWeight:'700',color:NAVY }}>{u.name}</div>
                          <div style={{ fontSize:'11px',color:'#94a3b8' }}>{u.title||ROLE_LABELS[u.role]}</div>
                        </div>
                        <span style={S.greenPulse} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div>
              <div style={S.toolbar}>
                <input placeholder="🔍 Search users..." value={uSearch} onChange={e => setUSearch(e.target.value)} style={S.toolSearch} />
                <button style={S.addBtn} onClick={() => setShowAdd(true)}>+ Add User</button>
              </div>
              {showAdd && (
                <div style={S.overlay}>
                  <div style={S.modal}>
                    <div style={S.modalHead}><h3 style={S.modalTitle}>Add New User</h3><button style={S.modalClose} onClick={() => setShowAdd(false)}>✕</button></div>
                    <form onSubmit={createUser} style={{ display:'flex',flexDirection:'column',gap:'14px' }}>
                      {[{k:'name',t:'text',p:'Full Name',l:'Full Name'},{k:'email',t:'email',p:'name@highperformanceco.net',l:'Email'},{k:'password',t:'password',p:'Password',l:'Password'},{k:'title',t:'text',p:'e.g. QA Officer...',l:'Job Title'}].map(f => (
                        <div key={f.k} style={{ display:'flex',flexDirection:'column',gap:'5px' }}>
                          <label style={S.mLabel}>{f.l}</label>
                          <input type={f.t} placeholder={f.p} value={newUser[f.k]} onChange={e => setNewUser({...newUser,[f.k]:e.target.value})} style={S.mInput} required={f.k!=='title'} />
                        </div>
                      ))}
                      <div style={{ display:'flex',flexDirection:'column',gap:'5px' }}>
                        <label style={S.mLabel}>Role</label>
                        <select value={newUser.role} onChange={e => setNewUser({...newUser,role:e.target.value})} style={S.mInput}>
                          <option value="agent">Agent</option>
                          <option value="qa_officer">QA Officer</option>
                          <option value="team_lead">Team Lead</option>
                        </select>
                      </div>
                      <div style={{ display:'flex',gap:'10px',marginTop:'6px' }}>
                        <button type="submit" disabled={loading} style={S.mBtn}>{loading?'Creating...':'Create User'}</button>
                        <button type="button" onClick={() => setShowAdd(false)} style={S.mBtnSec}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div style={S.table}>
                <div style={S.thead}>{['Name','Email','Title','Role','Status','Last Seen','Actions'].map((h,i)=><div key={i} style={{ flex:[2,2.2,1.5,1,1,1.5,1][i] }}>{h}</div>)}</div>
                {filtered.map(u => (
                  <div key={u.id} style={S.trow}>
                    <div style={{ flex:2,display:'flex',alignItems:'center',gap:'10px' }}>
                      <div style={{ width:'32px',height:'32px',borderRadius:'9px',background:ROLE_COLORS[u.role]||'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'800',color:'#fff',flexShrink:0 }}>{u.name[0]}</div>
                      <span style={{ fontSize:'13.5px',fontWeight:'600',color:NAVY,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.name}</span>
                    </div>
                    <div style={{ flex:2.2,fontSize:'12px',color:'#64748b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.email}</div>
                    <div style={{ flex:1.5,fontSize:'12px',color:'#94a3b8' }}>{u.title||'—'}</div>
                    <div style={{ flex:1 }}>
                      <select value={u.role} onChange={e=>changeRole(u,e.target.value)} style={{ background:ROLE_COLORS[u.role]+'15',color:ROLE_COLORS[u.role],border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'10px',fontWeight:'800',padding:'3px 8px',borderRadius:'100px',outline:'none' }}>
                        <option value="agent">Agent</option><option value="qa_officer">QA Officer</option><option value="team_lead">Team Lead</option>
                      </select>
                    </div>
                    <div style={{ flex:1 }}><span style={{ padding:'3px 10px',borderRadius:'100px',fontSize:'11px',fontWeight:'700',background:u.is_active?'#f0fdf4':'#fef2f2',color:u.is_active?'#16a34a':'#dc2626' }}>{u.is_active?'Active':'Inactive'}</span></div>
                    <div style={{ flex:1.5,fontSize:'11px',color:'#94a3b8' }}>{u.last_seen?new Date(u.last_seen).toLocaleString():'Never'}</div>
                    <div style={{ flex:1,display:'flex',gap:'5px' }}>
                      <button style={S.tBtn} onClick={()=>toggleActive(u)}>{u.is_active?'🔒':'🔓'}</button>
                      <button style={{ ...S.tBtn,color:'#ef4444' }} onClick={()=>deleteUser(u.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'active' && (
            <div>
              <div style={S.sectionHead}><div style={S.sectionTitle}>🟢 Live — {activeList.length} Online</div><div style={S.sectionCount}>Refreshes every 30s</div></div>
              {activeList.length === 0 ? <div style={S.empty}>No agents online right now</div> : (
                <div style={S.onlineGrid}>
                  {activeList.map(u => (
                    <div key={u.id} style={{ ...S.onlineCard,padding:'18px' }}>
                      <div style={{ ...S.onlineAv,width:'46px',height:'46px',fontSize:'19px',background:ROLE_COLORS[u.role]||'#6366f1' }}>{u.name[0]}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'14px',fontWeight:'700',color:NAVY }}>{u.name}</div>
                        <div style={{ fontSize:'11px',color:'#94a3b8',marginTop:'2px' }}>{u.email}</div>
                        <div style={{ fontSize:'11px',color:'#94a3b8',marginTop:'2px' }}>{u.title||ROLE_LABELS[u.role]} · {new Date(u.last_ping).toLocaleTimeString()}</div>
                      </div>
                      <span style={S.greenPulse} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div>
              <div style={S.sectionHead}><div style={S.sectionTitle}>📋 Activity Log</div><div style={S.sectionCount}>Last 100 actions</div></div>
              <div style={S.actList}>
                {activity.map(a => {
                  const colors = { LOGIN:'#10b981',LOGOUT:'#94a3b8',CREATE_FAQ:'#6366f1',UPDATE_FAQ:'#f59e0b',DELETE_FAQ:'#ef4444',CREATE_TIP:'#f97316' };
                  const col = colors[a.action]||'#94a3b8';
                  return (
                    <div key={a.id} style={S.actRow}>
                      <div style={{ ...S.actAv,background:ROLE_COLORS[a.role]||'#6366f1' }}>{a.name[0]}</div>
                      <div style={{ flex:1 }}>
                        <span style={{ fontWeight:'700',color:NAVY,fontSize:'13px' }}>{a.name}</span>
                        <span style={{ color:'#64748b',fontSize:'13px' }}> — {a.details}</span>
                      </div>
                      <span style={{ fontSize:'10px',fontWeight:'800',padding:'3px 10px',borderRadius:'100px',background:col+'18',color:col,flexShrink:0 }}>{a.action}</span>
                      <div style={{ fontSize:'11px',color:'#94a3b8',whiteSpace:'nowrap',marginLeft:'12px' }}>{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  layout:{display:'flex',height:'100vh',overflow:'hidden',background:'#f0f4ff',fontFamily:"'Inter','Segoe UI',sans-serif"},
  body:{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0},
  tabBar:{display:'flex',gap:'2px',padding:'12px 28px 0',background:'#fff',borderBottom:'1px solid #f1f5f9',flexShrink:0},
  tab:{padding:'10px 20px',borderRadius:'12px 12px 0 0',border:'none',background:'transparent',fontSize:'13px',fontWeight:'600',color:'#94a3b8',cursor:'pointer',fontFamily:'inherit'},
  tabOn:{background:'#f0f4ff',color:'#0B1120',fontWeight:'800',borderBottom:`3px solid ${ORANGE}`},
  content:{flex:1,overflowY:'auto',padding:'24px 28px'},
  statGrid:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'20px'},
  statCard:{background:'#fff',borderRadius:'18px',padding:'22px',border:'1px solid #e2e8f0',boxShadow:'0 2px 8px rgba(0,0,0,0.04)',position:'relative',overflow:'hidden'},
  chartsRow:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px',marginBottom:'24px'},
  chartCard:{background:'#fff',borderRadius:'18px',padding:'22px',border:'1px solid #e2e8f0',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'},
  chartHead:{marginBottom:'18px'},
  chartTitle:{fontSize:'14px',fontWeight:'800',color:'#0B1120'},
  chartSub:{fontSize:'11px',color:'#94a3b8',marginTop:'2px'},
  noData:{height:'160px',display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:'13px'},
  section:{background:'#fff',borderRadius:'18px',padding:'22px',border:'1px solid #e2e8f0',marginBottom:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'},
  sectionHead:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'18px'},
  sectionTitle:{fontSize:'15px',fontWeight:'800',color:'#0B1120'},
  sectionCount:{fontSize:'12px',color:'#94a3b8',fontWeight:'600'},
  empty:{textAlign:'center',padding:'40px',color:'#94a3b8',fontSize:'14px',background:'#f8fafc',borderRadius:'12px'},
  onlineGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'10px'},
  onlineCard:{background:'#fff',borderRadius:'14px',padding:'14px 16px',display:'flex',alignItems:'center',gap:'12px',border:'1px solid #e2e8f0',position:'relative'},
  onlineAv:{width:'38px',height:'38px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:'800',color:'#fff',flexShrink:0},
  greenPulse:{width:'10px',height:'10px',background:'#22c55e',borderRadius:'50%',boxShadow:'0 0 0 3px rgba(34,197,94,0.2)',position:'absolute',top:'12px',right:'12px'},
  toolbar:{display:'flex',gap:'12px',marginBottom:'16px'},
  toolSearch:{flex:1,padding:'11px 16px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'13.5px',fontFamily:'inherit',outline:'none',background:'#fff'},
  addBtn:{background:'#0B1120',color:'#fff',border:'none',borderRadius:'12px',padding:'11px 22px',fontSize:'13px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'},
  table:{background:'#fff',borderRadius:'18px',overflow:'hidden',border:'1px solid #e2e8f0',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'},
  thead:{display:'flex',padding:'12px 18px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',fontSize:'10px',fontWeight:'800',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em',gap:'8px'},
  trow:{display:'flex',alignItems:'center',padding:'12px 18px',borderBottom:'1px solid #f1f5f9',gap:'8px'},
  tBtn:{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'5px 8px',cursor:'pointer',fontSize:'13px'},
  actList:{background:'#fff',borderRadius:'18px',overflow:'hidden',border:'1px solid #e2e8f0'},
  actRow:{display:'flex',alignItems:'center',gap:'12px',padding:'12px 18px',borderBottom:'1px solid #f1f5f9'},
  actAv:{width:'32px',height:'32px',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'800',color:'#fff',flexShrink:0},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px'},
  modal:{background:'#fff',borderRadius:'22px',padding:'30px',width:'100%',maxWidth:'420px',boxShadow:'0 24px 70px rgba(0,0,0,0.22)'},
  modalHead:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'},
  modalTitle:{fontSize:'20px',fontWeight:'800',color:'#0B1120',margin:0},
  modalClose:{background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'#94a3b8'},
  mLabel:{fontSize:'11px',fontWeight:'800',color:'#0B1120',textTransform:'uppercase',letterSpacing:'0.07em'},
  mInput:{padding:'11px 14px',border:'1.5px solid #e2e8f0',borderRadius:'11px',fontSize:'14px',fontFamily:'inherit',outline:'none',background:'#f8fafc',width:'100%',boxSizing:'border-box'},
  mBtn:{flex:1,background:'#0B1120',color:'#fff',border:'none',borderRadius:'11px',padding:'12px',fontSize:'14px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'},
  mBtnSec:{flex:1,background:'#f1f5f9',color:'#0B1120',border:'1px solid #e2e8f0',borderRadius:'11px',padding:'12px',fontSize:'14px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'},
};