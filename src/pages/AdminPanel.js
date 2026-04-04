/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import toast from 'react-hot-toast';

const NAVY  = '#0B1120';
const ORANGE = '#FF6B35';
const ROLE_COLORS = { team_lead:'#8b5cf6', qa_officer:'#10b981', agent:'#3b82f6' };
const ROLE_LABELS = { team_lead:'Team Lead', qa_officer:'QA Officer', agent:'Agent' };

function GlowCard({ icon, label, value, color, sub, live, dark }) {
  const [hov, setHov] = useState(false);
  if (dark) {
    return (
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
        background:'linear-gradient(145deg,#0f1623,#111827)', borderRadius:'22px', padding:'26px 24px',
        border:`1px solid ${color}30`,
        boxShadow: hov ? `0 0 0 1px ${color}50,0 8px 32px ${color}30,inset 0 1px 0 rgba(255,255,255,0.06)` : `0 0 0 1px ${color}20,0 4px 20px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04)`,
        position:'relative', overflow:'hidden', transition:'all .25s cubic-bezier(0.4,0,0.2,1)',
        transform: hov ? 'translateY(-2px)' : 'none', cursor:'default',
      }}>
        <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'120px', height:'120px', background:`radial-gradient(circle,${color}25 0%,transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'14px', right:'14px', width:'52px', height:'52px', borderRadius:'50%', border:`2px solid ${color}40`, boxShadow:`0 0 12px ${color}30,inset 0 0 12px ${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', background:`radial-gradient(circle,${color}15,transparent)` }}>{icon}</div>
        {live && (<div style={{ position:'absolute', top:'68px', right:'18px', display:'flex', alignItems:'center', gap:'4px', fontSize:'9px', fontWeight:'800', color:'#22c55e', textTransform:'uppercase', letterSpacing:'0.08em' }}><span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 6px #22c55e' }} />Live</div>)}
        <div style={{ marginTop:'8px' }}>
          <div style={{ fontSize:'38px', fontWeight:'900', color:'#fff', letterSpacing:'-0.03em', lineHeight:1, textShadow:`0 0 20px ${color}50` }}>{value ?? '—'}</div>
          <div style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.4)', marginTop:'10px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</div>
          {sub && <div style={{ fontSize:'11px', color:color, marginTop:'4px', fontWeight:'600' }}>{sub}</div>}
        </div>
        <div style={{ position:'absolute', bottom:0, left:'20%', right:'20%', height:'2px', background:`linear-gradient(90deg,transparent,${color}80,transparent)`, borderRadius:'2px' }} />
      </div>
    );
  }
  // Light mode card
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background:'#fff', borderRadius:'22px', padding:'26px 24px',
      border:`1px solid ${color}20`,
      boxShadow: hov ? `0 8px 32px ${color}20, 0 0 0 1px ${color}30` : `0 4px 20px rgba(11,17,32,0.06), 0 0 0 1px ${color}15`,
      position:'relative', overflow:'hidden', transition:'all .25s cubic-bezier(0.4,0,0.2,1)',
      transform: hov ? 'translateY(-2px)' : 'none', cursor:'default',
    }}>
      <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'100px', height:'100px', background:`radial-gradient(circle,${color}12 0%,transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'14px', right:'14px', width:'52px', height:'52px', borderRadius:'50%', border:`2px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', background:`${color}10` }}>{icon}</div>
      {live && (<div style={{ position:'absolute', top:'68px', right:'18px', display:'flex', alignItems:'center', gap:'4px', fontSize:'9px', fontWeight:'800', color:'#22c55e', textTransform:'uppercase', letterSpacing:'0.08em' }}><span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 6px #22c55e' }} />Live</div>)}
      <div style={{ marginTop:'8px' }}>
        <div style={{ fontSize:'38px', fontWeight:'900', color:'#0B1120', letterSpacing:'-0.03em', lineHeight:1 }}>{value ?? '—'}</div>
        <div style={{ fontSize:'11px', fontWeight:'700', color:'#94a3b8', marginTop:'10px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</div>
        {sub && <div style={{ fontSize:'11px', color:color, marginTop:'4px', fontWeight:'600' }}>{sub}</div>}
      </div>
      <div style={{ position:'absolute', bottom:0, left:'20%', right:'20%', height:'2px', background:`linear-gradient(90deg,transparent,${color}60,transparent)`, borderRadius:'2px' }} />
    </div>
  );
}

function ChartCard({ title, sub, children, accent, dark }) {
  accent = accent || ORANGE;
  const bg = dark ? 'linear-gradient(145deg,#0f1623,#111827)' : '#fff';
  const bd = dark ? `1px solid ${accent}20` : '1px solid #e2e8f0';
  const sh = dark ? `0 4px 24px rgba(0,0,0,0.3)` : '0 4px 24px rgba(11,17,32,0.06)';
  const tc = dark ? '#f1f5f9' : NAVY;
  const sc = dark ? 'rgba(255,255,255,0.35)' : '#94a3b8';
  return (
    <div style={{ background:bg, borderRadius:'20px', padding:'22px', border:bd, boxShadow:sh, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${accent},${accent}60,transparent)`, borderRadius:'20px 20px 0 0' }} />
      {dark && <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'80px', height:'80px', background:`radial-gradient(circle,${accent}15 0%,transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />}
      <div style={{ marginBottom:'18px' }}>
        <div style={{ fontSize:'14px', fontWeight:'800', color:tc }}>{title}</div>
        {sub && <div style={{ fontSize:'11px', color:sc, marginTop:'2px' }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  text = text || 'No data yet';
  return (
    <div style={{ height:'160px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'13px', gap:'8px' }}>
      <div style={{ fontSize:'28px', opacity:0.4 }}>📭</div>{text}
    </div>
  );
}

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
  const [uFilter, setUFilter]   = useState('all');
  const [leaderboard, setLeaderboard] = useState([]);
  const [callFlows, setCallFlows] = useState([]);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfModal, setCfModal] = useState(null); // null | 'new' | flow object
  const [cfEditSteps, setCfEditSteps] = useState([]);
  const [cfForm, setCfForm] = useState({ title:'', icon:'📞', color:'#3b82f6', description:'', note:'' });
  const [editUser, setEditUser] = useState(null); // null or user object
  const [editForm, setEditForm] = useState({ name:'', email:'', role:'agent', title:'', newPassword:'' });
  const [peakHours, setPeakHours] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('rk_admin_dark') === '1');
  const toggleDark = () => { const n = !darkMode; setDarkMode(n); localStorage.setItem('rk_admin_dark', n?'1':'0'); };

  const load = useCallback(async () => {
    try {
      const [s,u,al,act,tf,lb,ph,wt] = await Promise.all([
        api.get('/users/stats'), api.get('/users'),
        api.get('/users/active-list'), api.get('/users/activity'),
        api.get('/faqs/top-viewed'),
        api.get('/users/leaderboard').catch(() => ({ data: [] })),
        api.get('/users/stats/peak-hours').catch(() => ({ data: [] })),
        api.get('/users/stats/weekly').catch(() => ({ data: [] })),
      ]);
      setStats(s.data); setUsers(u.data); setActive(al.data);
      setActivity(act.data); setTopFAQs(tf.data); setLeaderboard(lb.data);
      api.get('/callflows/all').then(r => setCallFlows(r.data)).catch(() => {});
      // Peak hours - fill all 24 hours
      const phFull = Array.from({length:24},(_,i) => {
        const found = ph.data.find(x => parseInt(x.hour) === i);
        return { hour: i < 12 ? `${i||12}am` : `${i===12?12:i-12}pm`, logins: parseInt(found?.logins||0) };
      });
      setPeakHours(phFull);
      setWeeklyTrends(wt.data.map(d => ({ day: new Date(d.day).toLocaleDateString('en',{month:'short',day:'numeric'}), logins: parseInt(d.logins) })));
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
  const toggleActive = async u => { await api.patch(`/users/${u.id}`, { is_active: !u.is_active }); toast.success(u.is_active?'Deactivated':'Activated'); load(); };
  const deleteUser = async id => { if (!window.confirm('Delete this user?')) return; await api.delete(`/users/${id}`); toast.success('Deleted'); load(); };
  const saveEditUser = async () => {
    if (!editUser) return;
    const payload = { name: editForm.name, email: editForm.email, role: editForm.role, title: editForm.title };
    if (editForm.newPassword) payload.password = editForm.newPassword;
    await api.patch(`/users/${editUser.id}`, payload).catch(() => {});
    toast.success('User updated!'); setEditUser(null); load();
  };
  const changeRole = async (u, role) => { await api.patch(`/users/${u.id}`, { role }); toast.success('Role updated'); load(); };

  const loginData = stats?.loginsWeek?.map(d => ({ day: new Date(d.day).toLocaleDateString('en',{weekday:'short'}), logins: parseInt(d.count) })) || [];

  const colorMap = { 'Agent':'#3b82f6','Team Lead':'#8b5cf6','QA Officer':'#10b981','Team Coordinator':'#f59e0b','Supervisor':'#ec4899','Trainer':'#06b6d4' };

  const roleData = (() => {
    if (!users.length) return [];
    const counts = {};
    users.forEach(u => {
      if (u.title === 'Admin') return;
      const label = u.role === 'agent' ? 'Agent'
        : u.role === 'team_lead' && u.title?.toLowerCase().includes('supervisor') ? 'Supervisor'
        : u.role === 'team_lead' ? 'Team Lead'
        : u.title?.toLowerCase().includes('coordinator') ? 'Team Coordinator'
        : u.title?.toLowerCase().includes('trainer') ? 'Trainer'
        : 'QA Officer';
      counts[label] = (counts[label]||0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: colorMap[name]||'#94a3b8' }));
  })();

  const barData = topFAQs.slice(0,6).map(f => ({ name: f.question_en.substring(0,22)+'…', views: f.views }));

  const faqCategoryData = (() => {
    if (!topFAQs.length) return [];
    const cats = {};
    topFAQs.forEach(f => { cats[f.category] = (cats[f.category]||0) + (f.views||0); });
    const catColors = { 'Billing Complaints':'#ef4444','General Complaints':'#f97316','Inquiries':'#3b82f6','Service Requests':'#8b5cf6','Feedback & Others':'#10b981','New Updates':'#f59e0b' };
    return Object.entries(cats).map(([name, views]) => ({ name: name.replace(' Complaints',''), views, color: catColors[name]||'#94a3b8' }));
  })();

  const queueData = (() => {
    const q = { Arabic:0, Badini:0, Sorani:0 };
    users.forEach(u => {
      if (u.role !== 'agent') return;
      if (u.title?.includes('Arabic')) q.Arabic++;
      else if (u.title?.includes('Badini')) q.Badini++;
      else if (u.title?.includes('Sorani')) q.Sorani++;
    });
    return [{ name:'Arabic', value:q.Arabic, color:'#f59e0b' },{ name:'Badini', value:q.Badini, color:'#10b981' },{ name:'Sorani', value:q.Sorani, color:'#3b82f6' }].filter(x => x.value > 0);
  })();

  const filtered = users.filter(u => {
    const ms = !uSearch || u.name.toLowerCase().includes(uSearch.toLowerCase()) || u.email.toLowerCase().includes(uSearch.toLowerCase());
    const mf = uFilter === 'all' || u.role === uFilter;
    return ms && mf;
  });

  const STAT_CARDS = stats ? [
    { icon:'👥', label:'Total Users',  value:stats.totalUsers,  color:'#6366f1', sub:`${activeList.length} online now` },
    { icon:'🟢', label:'Active Now',   value:stats.activeNow,   color:'#22c55e', live:true, sub:'Right now' },
    { icon:'📚', label:'Total FAQs',   value:stats?.totalFaqs,   color:'#f59e0b', sub:'EN + Kurdish' },
    { icon:'🔐', label:'Total Logins', value:stats.totalLogins, color:'#8b5cf6', sub:'All time' },
  ] : [];

  const TABS = [['dashboard','📊','Dashboard'],['users','👥','Users'],['active','🟢','Live'],['activity','📋','Activity'],['leaderboard','🏆','Leaderboard'],['callflows','📞','Call Flows']];

  const CT = ({ active, payload, label }) => {
    if (active && payload?.length) return (
      <div style={{ background:'#0f1623', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'10px 14px', fontSize:'12px', color:'#fff' }}>
        <div style={{ fontWeight:'700', marginBottom:'4px' }}>{label}</div>
        {payload.map((p,i) => <div key={i} style={{ color:p.color }}>{p.name}: {p.value}</div>)}
      </div>
    );
    return null;
  };

  return (
    <div style={{ ...S.layout, background: darkMode ? '#080e18' : '#f0f4ff' }}>
      <style>{`
        @keyframes pulse{0%,100%{box-shadow:0 0 6px #22c55e}50%{box-shadow:0 0 14px #22c55e}}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px}
      `}</style>
      <Sidebar panel={null} setPanel={() => navigate('/')} search={''} setSearch={() => {}} />
      <div style={S.body}>
        <Topbar title="Admin Panel" subtitle="System analytics & management" darkMode={darkMode} onToggleDark={toggleDark} />
        <div style={{ ...S.tabBar, background: darkMode ? '#0d1526' : '#fff', borderBottomColor: darkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
          {TABS.map(([k,ico,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...S.tab, ...(tab===k ? S.tabOn : {}), color: tab===k ? (darkMode?'#fff':NAVY) : (darkMode?'rgba(255,255,255,0.4)':'#94a3b8') }}>
              <span>{ico}</span> {l}
              {tab===k && <div style={S.tabUnderline} />}
            </button>
          ))}
        </div>
        <div style={{ ...S.content, background: darkMode ? '#080e18' : '#f0f4ff' }}>

          {tab === 'dashboard' && (
            <div>
              <div style={S.kpiGrid}>
                {STAT_CARDS.map((sc,i) => <GlowCard key={i} {...sc} dark={darkMode} />)}
              </div>
              <div style={S.row3}>
                <ChartCard title="Login Activity" sub="Last 7 days" accent="#FF6B35" dark={darkMode}>
                  {loginData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={190}>
                      <AreaChart data={loginData} margin={{ top:5, right:5, bottom:0, left:-20 }}>
                        <defs><linearGradient id="lgO" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={ORANGE} stopOpacity={0.3}/><stop offset="95%" stopColor={ORANGE} stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="day" tick={{ fontSize:11, fill:'#94a3b8' }} />
                        <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} allowDecimals={false} />
                        <Tooltip content={<CT />} />
                        <Area type="monotone" dataKey="logins" stroke={ORANGE} strokeWidth={2.5} fill="url(#lgO)" dot={{ fill:ORANGE, r:4, strokeWidth:0 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <EmptyState />}
                </ChartCard>

                <ChartCard title="Users by Role" sub={`${stats?.totalUsers||0} total`} accent="#8b5cf6" dark={darkMode}>
                  {roleData.length > 0 ? (
                    <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <ResponsiveContainer width={150} height={150}>
                          <PieChart>
                            <Pie data={roleData} cx="50%" cy="50%" innerRadius={44} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                              {roleData.map((e,i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                          <div style={{ fontSize:'22px', fontWeight:'900', color: darkMode?'#fff':NAVY }}>{stats?.totalUsers||0}</div>
                          <div style={{ fontSize:'9px', color: darkMode?'rgba(255,255,255,0.4)':'#94a3b8', fontWeight:'700', textTransform:'uppercase' }}>Total</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'9px', flex:1 }}>
                        {roleData.map((r,i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:r.color, boxShadow:`0 0 6px ${r.color}`, flexShrink:0 }} />
                            <span style={{ fontSize:'12px', color: darkMode?'rgba(255,255,255,0.6)':'#475569', fontWeight:'600', flex:1 }}>{r.name}</span>
                            <span style={{ fontSize:'14px', fontWeight:'800', color: darkMode?'#fff':NAVY }}>{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <EmptyState />}
                </ChartCard>

                <ChartCard title="Agents by Queue" sub="Language distribution" accent="#10b981" dark={darkMode}>
                  {queueData.length > 0 ? (
                    <div>
                      {queueData.map((q,i) => {
                        const total = queueData.reduce((a,b) => a+b.value, 0);
                        const pct = Math.round((q.value/total)*100);
                        return (
                          <div key={i} style={{ marginBottom:'18px' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                              <span style={{ fontSize:'13px', fontWeight:'700', color: darkMode?'#f1f5f9':NAVY }}>{q.name}</span>
                              <span style={{ fontSize:'12px', fontWeight:'800', color:q.color }}>{q.value} <span style={{ color:'#94a3b8', fontWeight:'500' }}>({pct}%)</span></span>
                            </div>
                            <div style={{ height:'8px', background: darkMode?'rgba(255,255,255,0.08)':'#f1f5f9', borderRadius:'100px', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${q.color},${q.color}cc)`, borderRadius:'100px', boxShadow:`0 0 8px ${q.color}50` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <EmptyState />}
                </ChartCard>
              </div>

              <div style={S.row2}>
                <ChartCard title="Top Viewed FAQs" sub="By total views" accent="#6366f1" dark={darkMode}>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData} layout="vertical" margin={{ top:0, right:16, bottom:0, left:0 }}>
                        <defs><linearGradient id="bG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize:10, fill:'#94a3b8' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} width={130} />
                        <Tooltip content={<CT />} />
                        <Bar dataKey="views" fill="url(#bG)" radius={[0,8,8,0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState />}
                </ChartCard>

                <ChartCard title="FAQ Views by Category" sub="Which sections agents use most" accent="#f59e0b" dark={darkMode}>
                  {faqCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={faqCategoryData} margin={{ top:5, right:5, bottom:30, left:-15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize:10, fill:'#64748b' }} angle={-20} textAnchor="end" />
                        <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} />
                        <Tooltip content={<CT />} />
                        <Bar dataKey="views" radius={[6,6,0,0]} maxBarSize={40}>
                          {faqCategoryData.map((e,i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState />}
                </ChartCard>
              </div>

              <div style={{ background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', borderRadius:'20px', padding:'22px', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 4px 24px rgba(11,17,32,0.06)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
                  <div>
                    <div style={{ fontSize:'15px', fontWeight:'800', color: darkMode?'#f1f5f9':NAVY }}>Currently Online</div>
                    <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>Updates every 30 seconds</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e', display:'inline-block', animation:'pulse 2s infinite' }} />
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#22c55e' }}>{activeList.length} online</span>
                  </div>
                </div>
                {activeList.length === 0 ? <EmptyState text="No agents online right now" /> : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'10px' }}>
                    {activeList.map(u => (
                      <div key={u.id} style={{ background: darkMode?'rgba(255,255,255,0.05)':'#f8fafc', borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'12px', border: darkMode?'1px solid rgba(255,255,255,0.08)':'1px solid #e2e8f0' }}>
                        <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:ROLE_COLORS[u.role]||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'800', color:'#fff', flexShrink:0 }}>{u.name[0]}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'13.5px', fontWeight:'700', color: darkMode?'#f1f5f9':NAVY, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                          <div style={{ fontSize:'11px', color: darkMode?'rgba(255,255,255,0.35)':'#94a3b8', marginTop:'2px' }}>{u.title||ROLE_LABELS[u.role]}</div>
                        </div>
                        <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e80', flexShrink:0, animation:'pulse 2s infinite' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div>
              <div style={{ display:'flex', gap:'12px', marginBottom:'14px' }}>
                <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center' }}>
                  <span style={{ position:'absolute', left:'12px', color:'#94a3b8', fontSize:'14px' }}>🔍</span>
                  <input placeholder="Search users..." value={uSearch} onChange={e => setUSearch(e.target.value)} style={{ width:'100%', padding:'11px 16px 11px 36px', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', borderRadius:'12px', fontSize:'13.5px', fontFamily:'inherit', outline:'none', background: darkMode?'rgba(255,255,255,0.05)':'#fff', boxSizing:'border-box', color: darkMode?'#f1f5f9':NAVY }} />
                </div>
                <select value={uFilter} onChange={e => setUFilter(e.target.value)} style={{ padding:'11px 14px', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', borderRadius:'12px', fontSize:'13px', fontFamily:'inherit', outline:'none', background: darkMode?'rgba(255,255,255,0.05)':'#fff', cursor:'pointer', color: darkMode?'#f1f5f9':NAVY }}>
                  <option value="all">All Roles</option>
                  <option value="agent">Agents</option>
                  <option value="qa_officer">QA Officers</option>
                  <option value="team_lead">Team Leads</option>
                </select>
                <button style={{ background:`linear-gradient(135deg,${ORANGE},#ff9a6c)`, color:'#fff', border:'none', borderRadius:'12px', padding:'11px 22px', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:`0 4px 12px ${ORANGE}40` }} onClick={() => setShowAdd(true)}>+ Add User</button>
              </div>
              <div style={{ fontSize:'12px', color: darkMode?'rgba(255,255,255,0.35)':'#94a3b8', marginBottom:'12px', fontWeight:'600' }}>Showing {filtered.length} of {users.length} users</div>
              {showAdd && (
                <div style={S.overlay}>
                  <div style={S.modal}>
                    <div style={S.modalHead}><h3 style={S.modalTitle}>Add New User</h3><button style={S.modalClose} onClick={() => setShowAdd(false)}>✕</button></div>
                    <form onSubmit={createUser} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                      {[{k:'name',t:'text',p:'Full Name',l:'Full Name'},{k:'email',t:'email',p:'name@highperformanceco.net',l:'Email'},{k:'password',t:'password',p:'Password',l:'Password'},{k:'title',t:'text',p:'e.g. QA Officer...',l:'Job Title'}].map(f => (
                        <div key={f.k} style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                          <label style={S.mLabel}>{f.l}</label>
                          <input type={f.t} placeholder={f.p} value={newUser[f.k]} onChange={e => setNewUser({...newUser,[f.k]:e.target.value})} style={S.mInput} required={f.k!=='title'} />
                        </div>
                      ))}
                      <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                        <label style={S.mLabel}>Role</label>
                        <select value={newUser.role} onChange={e => setNewUser({...newUser,role:e.target.value})} style={S.mInput}>
                          <option value="agent">Agent</option><option value="qa_officer">QA Officer</option><option value="team_lead">Team Lead</option>
                        </select>
                      </div>
                      <div style={{ display:'flex', gap:'10px', marginTop:'6px' }}>
                        <button type="submit" disabled={loading} style={S.mBtn}>{loading?'Creating…':'Create User'}</button>
                        <button type="button" onClick={() => setShowAdd(false)} style={S.mBtnSec}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div style={{ ...S.table, background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 4px 24px rgba(11,17,32,0.06)' }}>
                <div style={{ ...S.thead, background: darkMode?'rgba(255,255,255,0.04)':'#f8fafc', borderBottom: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', color: darkMode?'rgba(255,255,255,0.3)':'#94a3b8' }}>{['Name','Email','Title','Role','Status','Last Seen','Actions'].map((h,i)=><div key={i} style={{ flex:[2,2.5,1.5,1.2,1,1.8,1][i], fontSize:'10px' }}>{h}</div>)}</div>
                {filtered.map(u => (
                  <div key={u.id} style={{ ...S.trow, borderBottom: darkMode?'1px solid rgba(255,255,255,0.05)':'1px solid #f1f5f9' }}>
                    <div style={{ flex:2, display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:`linear-gradient(135deg,${ROLE_COLORS[u.role]||'#6366f1'},${ROLE_COLORS[u.role]||'#6366f1'}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', color:'#fff', flexShrink:0 }}>{u.name[0]}</div>
                      <span style={{ fontSize:'13.5px', fontWeight:'600', color: darkMode?'#f1f5f9':NAVY, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</span>
                    </div>
                    <div style={{ flex:2.5, fontSize:'12px', color: darkMode?'rgba(255,255,255,0.4)':'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                    <div style={{ flex:1.5, fontSize:'12px', color: darkMode?'rgba(255,255,255,0.35)':'#94a3b8' }}>{u.title||'—'}</div>
                    <div style={{ flex:1.2 }}>
                      <select value={u.role} onChange={e=>changeRole(u,e.target.value)} style={{ background:ROLE_COLORS[u.role]+'18', color:ROLE_COLORS[u.role], border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'10px', fontWeight:'800', padding:'4px 10px', borderRadius:'100px', outline:'none' }}>
                        <option value="agent">Agent</option><option value="qa_officer">QA Officer</option><option value="team_lead">Team Lead</option>
                      </select>
                    </div>
                    <div style={{ flex:1 }}><span style={{ padding:'4px 10px', borderRadius:'100px', fontSize:'11px', fontWeight:'700', background:u.is_active?'#f0fdf4':'#fef2f2', color:u.is_active?'#16a34a':'#dc2626' }}>{u.is_active?'Active':'Inactive'}</span></div>
                    <div style={{ flex:1.8, fontSize:'11px', color: darkMode?'rgba(255,255,255,0.3)':'#94a3b8' }}>{u.last_seen?new Date(u.last_seen).toLocaleString():'Never'}</div>
                    <div style={{ flex:1, display:'flex', gap:'5px' }}>
                      <button style={{ ...S.tBtn, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1px solid rgba(255,255,255,0.1)':'1px solid #e2e8f0' }} onClick={() => toggleActive(u)}>{u.is_active?'🔒':'🔓'}</button>
                      <button style={{ ...S.tBtn, background: darkMode?'rgba(59,130,246,0.12)':'#eff6ff', border: darkMode?'1px solid rgba(59,130,246,0.2)':'1px solid #bfdbfe', color:'#3b82f6' }} onClick={() => { setEditUser(u); setEditForm({ name:u.name, email:u.email, role:u.role, title:u.title||'', newPassword:'' }); }}>✏️</button>
                      <button style={{ ...S.tBtn, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1px solid rgba(255,255,255,0.1)':'1px solid #e2e8f0', color:'#ef4444' }} onClick={() => deleteUser(u.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


              {/* ── EDIT USER MODAL ── */}
              {editUser && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                  <div style={{ background: darkMode?'#1a2235':'#fff', borderRadius:'20px', padding:'32px', width:'100%', maxWidth:'440px', boxShadow:'0 32px 80px rgba(0,0,0,0.3)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
                      <div style={{ fontSize:'18px', fontWeight:'800', color: darkMode?'#f1f5f9':NAVY }}>✏️ Edit User</div>
                      <button onClick={() => setEditUser(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'18px', color:'#94a3b8' }}>✕</button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                      {[
                        { label:'Full Name', key:'name', type:'text', placeholder:'Full name' },
                        { label:'Email', key:'email', type:'email', placeholder:'email@highperformanceco.net' },
                        { label:'Job Title', key:'title', type:'text', placeholder:'e.g. QA Officer, Team Lead...' },
                        { label:'New Password (leave blank to keep)', key:'newPassword', type:'password', placeholder:'Enter new password or leave empty' },
                      ].map(f => (
                        <div key={f.key}>
                          <div style={{ fontSize:'11px', fontWeight:'800', color: darkMode?'rgba(255,255,255,0.5)':NAVY, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px' }}>{f.label}</div>
                          <input type={f.type} value={editForm[f.key]} onChange={e => setEditForm({...editForm,[f.key]:e.target.value})}
                            placeholder={f.placeholder}
                            style={{ width:'100%', padding:'10px 14px', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', fontFamily:'inherit', outline:'none', background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', color: darkMode?'#f1f5f9':NAVY, boxSizing:'border-box' }} />
                        </div>
                      ))}
                      <div>
                        <div style={{ fontSize:'11px', fontWeight:'800', color: darkMode?'rgba(255,255,255,0.5)':NAVY, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px' }}>Role</div>
                        <select value={editForm.role} onChange={e => setEditForm({...editForm,role:e.target.value})}
                          style={{ width:'100%', padding:'10px 14px', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', fontFamily:'inherit', outline:'none', background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', color: darkMode?'#f1f5f9':NAVY, boxSizing:'border-box' }}>
                          <option value="agent">Agent</option>
                          <option value="qa_officer">QA Officer</option>
                          <option value="team_lead">Team Lead</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'10px', marginTop:'24px' }}>
                      <button onClick={() => setEditUser(null)} style={{ flex:1, background: darkMode?'rgba(255,255,255,0.08)':'#f1f5f9', color: darkMode?'#e2e8f0':NAVY, border:'none', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                      <button onClick={saveEditUser} style={{ flex:1, background:NAVY, color:'#fff', border:'none', borderRadius:'10px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>Save Changes</button>
                    </div>
                  </div>
                </div>
              )}

          {tab === 'active' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
                <div>
                  <div style={{ fontSize:'18px', fontWeight:'800', color: darkMode?'#f1f5f9':NAVY }}>Live — {activeList.length} Online</div>
                  <div style={{ fontSize:'12px', color: darkMode?'rgba(255,255,255,0.3)':'#94a3b8', marginTop:'2px' }}>Auto-refreshes every 30 seconds</div>
                </div>
              </div>
              {activeList.length === 0 ? <EmptyState text="No agents online right now" /> : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'12px' }}>
                  {activeList.map(u => (
                    <div key={u.id} style={{ background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', borderRadius:'16px', padding:'18px', display:'flex', alignItems:'center', gap:'14px', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', boxShadow: darkMode?'0 4px 16px rgba(0,0,0,0.3)':'0 4px 16px rgba(11,17,32,0.06)', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,#22c55e,transparent)' }} />
                      <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:`linear-gradient(135deg,${ROLE_COLORS[u.role]||'#6366f1'},${ROLE_COLORS[u.role]||'#6366f1'}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:'900', color:'#fff', flexShrink:0, boxShadow:`0 4px 12px ${ROLE_COLORS[u.role]||'#6366f1'}40` }}>{u.name?.[0]?.toUpperCase()}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'14px', fontWeight:'700', color: darkMode?'#f1f5f9':NAVY }}>{u.name}</div>
                        <div style={{ fontSize:'11px', color: darkMode?'rgba(255,255,255,0.4)':'#94a3b8', marginTop:'2px' }}>{u.email}</div>
                        <div style={{ fontSize:'11px', color: darkMode?'rgba(255,255,255,0.55)':'#64748b', marginTop:'3px', fontWeight:'600' }}>{u.title||ROLE_LABELS[u.role]}</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
                        <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 10px #22c55e', animation:'pulse 2s infinite' }} />
                        <div style={{ fontSize:'10px', color: darkMode?'rgba(255,255,255,0.3)':'#94a3b8' }}>{new Date(u.last_ping).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'activity' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
                <div style={{ fontSize:'18px', fontWeight:'800', color: darkMode?'#f1f5f9':NAVY }}>Activity Log</div>
                <div style={{ fontSize:'12px', color: darkMode?'rgba(255,255,255,0.3)':'#94a3b8', fontWeight:'600' }}>Last 100 actions</div>
              </div>
              <div style={{ background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', borderRadius:'18px', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', overflow:'hidden', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 4px 24px rgba(11,17,32,0.06)' }}>
                {activity.map((a,i) => {
                  const colors = { LOGIN:'#10b981',LOGOUT:'#94a3b8',CREATE_FAQ:'#6366f1',UPDATE_FAQ:'#f59e0b',DELETE_FAQ:'#ef4444',CREATE_TIP:'#f97316' };
                  const col = colors[a.action]||'#94a3b8';
                  return (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'13px 20px', borderBottom: i < activity.length-1 ? (darkMode?'1px solid rgba(255,255,255,0.05)':'1px solid #f1f5f9'):'none' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${ROLE_COLORS[a.role]||'#6366f1'}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'800', color:ROLE_COLORS[a.role]||'#6366f1', flexShrink:0 }}>{a.name[0]}</div>
                      <div style={{ flex:1 }}>
                        <span style={{ fontWeight:'700', color: darkMode?'#f1f5f9':NAVY, fontSize:'13px' }}>{a.name}</span>
                        <span style={{ color: darkMode?'rgba(255,255,255,0.4)':'#64748b', fontSize:'13px' }}> — {a.details}</span>
                      </div>
                      <span style={{ fontSize:'10px', fontWeight:'800', padding:'4px 12px', borderRadius:'100px', background:`${col}15`, color:col, flexShrink:0, border:`1px solid ${col}25` }}>{a.action?.replace('_',' ')}</span>
                      <div style={{ fontSize:'11px', color: darkMode?'rgba(255,255,255,0.25)':'#94a3b8', whiteSpace:'nowrap' }}>{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                  );
                })}
                {activity.length === 0 && <EmptyState text="No activity yet" />}
              </div>
            </div>
          )}


          {tab === 'callflows' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                <div style={{ fontSize:'18px', fontWeight:'800', color: darkMode?'#f1f5f9':NAVY }}>📞 Call Flow Scripts</div>
                <button onClick={() => { setCfForm({title:'',icon:'📞',color:'#3b82f6',description:'',note:''}); setCfEditSteps([{type:'AGENT',text:''}]); setCfModal('new'); }}
                  style={{ background: '#3b82f6', color:'#fff', border:'none', borderRadius:'10px', padding:'8px 18px', fontWeight:'700', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
                  + Add Call Flow
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {callFlows.length === 0 && <div style={{ textAlign:'center', padding:'40px', color: darkMode?'rgba(255,255,255,0.5)':'#64748b' }}>No call flows yet. Click Add to create one.</div>}
                {callFlows.map(flow => {
                  const steps = typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps;
                  return (
                    <div key={flow.id} style={{ background: darkMode?'#1a2235':'#fff', borderRadius:'16px', padding:'18px 22px', border:`1px solid ${darkMode?'rgba(255,255,255,0.08)':'#e2e8f0'}`, display:'flex', alignItems:'center', gap:'16px' }}>
                      <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:`linear-gradient(135deg,${flow.color},${flow.color}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>{flow.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'14px', fontWeight:'800', color: darkMode?'#e2e8f0':'#0B1120' }}>{flow.title}</div>
                        <div style={{ fontSize:'12px', color: darkMode?'rgba(255,255,255,0.5)':'#64748b', marginTop:'3px' }}>{flow.description} &bull; {steps.length} steps</div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                        <button onClick={async () => {
                          await api.patch(`/callflows/${flow.id}/toggle`);
                          const r = await api.get('/callflows/all'); setCallFlows(r.data);
                        }} style={{ background: flow.is_active ? '#dcfce7':'#fef2f2', color: flow.is_active?'#16a34a':'#dc2626', border:'none', borderRadius:'8px', padding:'4px 12px', fontWeight:'700', fontSize:'11px', cursor:'pointer', fontFamily:'inherit' }}>
                          {flow.is_active ? 'Active' : 'Hidden'}
                        </button>
                        <button onClick={() => {
                          const steps = typeof flow.steps === 'string' ? JSON.parse(flow.steps) : flow.steps;
                          setCfForm({ title:flow.title, icon:flow.icon, color:flow.color, description:flow.description||'', note:flow.note||'' });
                          setCfEditSteps(steps);
                          setCfModal(flow);
                        }} style={{ background:'#3b82f615', color:'#3b82f6', border:'none', borderRadius:'8px', padding:'6px 14px', fontWeight:'700', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>✏️ Edit</button>
                        <button onClick={async () => {
                          if(!window.confirm('Delete this call flow?')) return;
                          await api.delete(`/callflows/${flow.id}`);
                          const r = await api.get('/callflows/all'); setCallFlows(r.data);
                        }} style={{ background:'#ef444415', color:'#ef4444', border:'none', borderRadius:'8px', padding:'6px 14px', fontWeight:'700', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>🗑️ Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Call Flow Modal */}
              {cfModal && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                  <div style={{ background: darkMode?'#1a2235':'#fff', borderRadius:'20px', padding:'28px', width:'100%', maxWidth:'700px', maxHeight:'90vh', overflowY:'auto' }}>
                    <div style={{ fontSize:'16px', fontWeight:'900', color: darkMode?'#e2e8f0':'#0B1120', marginBottom:'20px' }}>
                      {cfModal === 'new' ? '+ Add Call Flow' : `✏️ Edit: ${cfModal.title}`}
                    </div>

                    {/* Basic info */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 140px', gap:'10px', marginBottom:'14px' }}>
                      <div>
                        <div style={{ fontSize:'12px', fontWeight:'700', color: darkMode?'rgba(255,255,255,0.5)':'#64748b', marginBottom:'4px' }}>Title</div>
                        <input value={cfForm.title} onChange={e => setCfForm(p=>({...p,title:e.target.value}))}
                          style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:`1px solid ${darkMode?'rgba(255,255,255,0.08)':'#e2e8f0'}`, background: darkMode?'#0f1623':'#f8fafc', color: darkMode?'#e2e8f0':'#0B1120', fontFamily:'inherit', fontSize:'13px', boxSizing:'border-box' }} placeholder="e.g. 1. E-Psule -- Discount Inquiry" />
                      </div>
                      <div>
                        <div style={{ fontSize:'12px', fontWeight:'700', color: darkMode?'rgba(255,255,255,0.5)':'#64748b', marginBottom:'4px' }}>Icon</div>
                        <input value={cfForm.icon} onChange={e => setCfForm(p=>({...p,icon:e.target.value}))}
                          style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:`1px solid ${darkMode?'rgba(255,255,255,0.08)':'#e2e8f0'}`, background: darkMode?'#0f1623':'#f8fafc', color: darkMode?'#e2e8f0':'#0B1120', fontFamily:'inherit', fontSize:'18px', textAlign:'center', boxSizing:'border-box' }} />
                      </div>
                      <div>
                        <div style={{ fontSize:'12px', fontWeight:'700', color: darkMode?'rgba(255,255,255,0.5)':'#64748b', marginBottom:'4px' }}>Color</div>
                        <input type="color" value={cfForm.color} onChange={e => setCfForm(p=>({...p,color:e.target.value}))}
                          style={{ width:'100%', height:'38px', borderRadius:'8px', border:`1px solid ${darkMode?'rgba(255,255,255,0.08)':'#e2e8f0'}`, cursor:'pointer' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom:'14px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'700', color: darkMode?'rgba(255,255,255,0.5)':'#64748b', marginBottom:'4px' }}>Description</div>
                      <input value={cfForm.description} onChange={e => setCfForm(p=>({...p,description:e.target.value}))}
                        style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:`1px solid ${darkMode?'rgba(255,255,255,0.08)':'#e2e8f0'}`, background: darkMode?'#0f1623':'#f8fafc', color: darkMode?'#e2e8f0':'#0B1120', fontFamily:'inherit', fontSize:'13px', boxSizing:'border-box' }} placeholder="Short description" />
                    </div>
                    <div style={{ marginBottom:'20px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'700', color: darkMode?'rgba(255,255,255,0.5)':'#64748b', marginBottom:'4px' }}>Warning Note (optional)</div>
                      <input value={cfForm.note} onChange={e => setCfForm(p=>({...p,note:e.target.value}))}
                        style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:`1px solid ${darkMode?'rgba(255,255,255,0.08)':'#e2e8f0'}`, background: darkMode?'#0f1623':'#f8fafc', color: darkMode?'#e2e8f0':'#0B1120', fontFamily:'inherit', fontSize:'13px', boxSizing:'border-box' }} placeholder="e.g. Warning: Read carefully before proceeding" />
                    </div>

                    {/* Steps */}
                    <div style={{ fontSize:'13px', fontWeight:'800', color: darkMode?'#e2e8f0':'#0B1120', marginBottom:'10px' }}>Steps ({cfEditSteps.length})</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
                      {cfEditSteps.map((step, si) => (
                        <div key={si} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                          <select value={step.type} onChange={e => { const s=[...cfEditSteps]; s[si]={...s[si],type:e.target.value}; setCfEditSteps(s); }}
                            style={{ padding:'7px 8px', borderRadius:'8px', border:`1px solid ${darkMode?'rgba(255,255,255,0.08)':'#e2e8f0'}`, background: darkMode?'#0f1623':'#f8fafc', color: darkMode?'#e2e8f0':'#0B1120', fontFamily:'inherit', fontSize:'12px', flexShrink:0 }}>
                            <option value="AGENT">AGENT</option>
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="SYSTEM">SYSTEM</option>
                            <option value="BRANCH">BRANCH</option>
                          </select>
                          <textarea value={step.text} onChange={e => { const s=[...cfEditSteps]; s[si]={...s[si],text:e.target.value}; setCfEditSteps(s); }}
                            rows={2} style={{ flex:1, padding:'7px 10px', borderRadius:'8px', border:`1px solid ${darkMode?'rgba(255,255,255,0.08)':'#e2e8f0'}`, background: darkMode?'#0f1623':'#f8fafc', color: darkMode?'#e2e8f0':'#0B1120', fontFamily:'inherit', fontSize:'12.5px', resize:'vertical' }} />
                          <button onClick={() => setCfEditSteps(cfEditSteps.filter((_,i)=>i!==si))}
                            style={{ background:'#ef444415', color:'#ef4444', border:'none', borderRadius:'8px', padding:'7px 10px', cursor:'pointer', fontSize:'14px', flexShrink:0 }}>✕</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:'8px', marginBottom:'24px' }}>
                      {['AGENT','CUSTOMER','SYSTEM','BRANCH'].map(t => (
                        <button key={t} onClick={() => setCfEditSteps([...cfEditSteps, {type:t,text:''}])}
                          style={{ background:`${t==='AGENT'?'#3b82f6':t==='CUSTOMER'?'#10b981':t==='SYSTEM'?'#f59e0b':'#8b5cf6'}15`, color: t==='AGENT'?'#3b82f6':t==='CUSTOMER'?'#10b981':t==='SYSTEM'?'#f59e0b':'#8b5cf6', border:'none', borderRadius:'8px', padding:'6px 12px', fontSize:'11px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>
                          + {t}
                        </button>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                      <button onClick={() => setCfModal(null)}
                        style={{ background: darkMode?'rgba(255,255,255,0.08)':'#e2e8f0', color: darkMode?'#e2e8f0':'#0B1120', border:'none', borderRadius:'10px', padding:'10px 20px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                      <button onClick={async () => {
                        if(!cfForm.title || cfEditSteps.length === 0) return;
                        setCfLoading(true);
                        const payload = { ...cfForm, steps: cfEditSteps };
                        if(cfModal === 'new') { await api.post('/callflows', payload).catch(()=>{}); }
                        else { await api.put(`/callflows/${cfModal.id}`, payload).catch(()=>{}); }
                        const r = await api.get('/callflows/all'); setCallFlows(r.data);
                        setCfModal(null); setCfLoading(false);
                      }} style={{ background:'#3b82f6', color:'#fff', border:'none', borderRadius:'10px', padding:'10px 20px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>
                        {cfLoading ? 'Saving...' : (cfModal === 'new' ? '+ Add Flow' : '✓ Save Changes')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'leaderboard' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'18px' }}>
                <div style={{ fontSize:'18px', fontWeight:'800', color: darkMode?'#f1f5f9':NAVY }}>🏆 Agent Leaderboard</div>
                <div style={{ fontSize:'12px', color: darkMode?'rgba(255,255,255,0.3)':'#94a3b8', fontWeight:'600' }}>Top 20 by FAQ views</div>
              </div>
              <div style={{ background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', borderRadius:'18px', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', overflow:'hidden', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 4px 24px rgba(11,17,32,0.06)' }}>
                {leaderboard.length === 0 ? <EmptyState text="No agent activity yet" /> : leaderboard.map((agent, i) => {
                  const medals = ['🥇','🥈','🥉'];
                  const rankColors = ['#f59e0b','#94a3b8','#cd7c2f'];
                  return (
                    <div key={agent.id} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'14px 20px', borderBottom: i < leaderboard.length-1 ? '1px solid #f1f5f9':'none', background: i < 3 ? `${rankColors[i]}12`:'transparent' }}>
                      <div style={{ width:'32px', textAlign:'center', fontSize: i < 3 ? '22px':'16px', fontWeight:'900', color: i < 3 ? rankColors[i]:'#94a3b8', flexShrink:0 }}>
                        {i < 3 ? medals[i] : `#${i+1}`}
                      </div>
                      <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:ROLE_COLORS[agent.role]||'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', fontWeight:'800', color:'#fff', flexShrink:0 }}>{agent.name[0]}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'14px', fontWeight:'700', color: darkMode?'#f1f5f9':NAVY }}>{agent.name}</div>
                        <div style={{ fontSize:'11px', color: darkMode?'rgba(255,255,255,0.35)':'#94a3b8' }}>{agent.title||'Agent'}</div>
                      </div>
                      <div style={{ display:'flex', gap:'20px', flexShrink:0 }}>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:'18px', fontWeight:'900', color:'#6366f1' }}>{agent.faqs_viewed||0}</div>
                          <div style={{ fontSize:'10px', color: darkMode?'rgba(255,255,255,0.35)':'#94a3b8', fontWeight:'600' }}>FAQs Viewed</div>
                        </div>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:'18px', fontWeight:'900', color:'#f59e0b' }}>{agent.bookmarks||0}</div>
                          <div style={{ fontSize:'10px', color: darkMode?'rgba(255,255,255,0.35)':'#94a3b8', fontWeight:'600' }}>Bookmarks</div>
                        </div>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:'18px', fontWeight:'900', color:'#10b981' }}>{agent.helpful_ratings||0}</div>
                          <div style={{ fontSize:'10px', color: darkMode?'rgba(255,255,255,0.35)':'#94a3b8', fontWeight:'600' }}>👍 Ratings</div>
                        </div>
                      </div>
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
  layout:{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter','Segoe UI',sans-serif" },
  body:{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 },
  tabBar:{ display:'flex', gap:'4px', padding:'12px 28px 0', background:'#0d1526', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 },
  tab:{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 18px', borderRadius:'12px 12px 0 0', border:'none', background:'transparent', fontSize:'13px', fontWeight:'600', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontFamily:'inherit', position:'relative', transition:'all .15s' },
  tabOn:{ background:'rgba(255,107,53,0.08)', color:'#fff', fontWeight:'800' },
  tabUnderline:{ position:'absolute', bottom:0, left:'20%', right:'20%', height:'3px', background:ORANGE, borderRadius:'3px 3px 0 0' },
  content:{ flex:1, overflowY:'auto', padding:'24px 28px', overflowX:'hidden' },
  kpiGrid:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'20px' },
  row3:{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:'16px', marginBottom:'16px' },
  row2:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' },
  table:{ borderRadius:'18px', overflow:'hidden' },
  thead:{ display:'flex', padding:'12px 18px', fontSize:'10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'0.08em', gap:'8px' },
  trow:{ display:'flex', alignItems:'center', padding:'12px 18px', gap:'8px' },
  tBtn:{ borderRadius:'8px', padding:'5px 8px', cursor:'pointer', fontSize:'13px' },
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'20px' },
  modal:{ background:'#fff', borderRadius:'24px', padding:'32px', width:'100%', maxWidth:'420px', boxShadow:'0 32px 80px rgba(0,0,0,0.25)' },
  modalHead:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' },
  modalTitle:{ fontSize:'20px', fontWeight:'800', color:NAVY, margin:0 },
  modalClose:{ background:'none', border:'none', cursor:'pointer', fontSize:'18px', color:'#94a3b8' },
  mLabel:{ fontSize:'11px', fontWeight:'800', color:NAVY, textTransform:'uppercase', letterSpacing:'0.07em' },
  mInput:{ padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:'11px', fontSize:'14px', fontFamily:'inherit', outline:'none', background:'#f8fafc', width:'100%', boxSizing:'border-box' },
  mBtn:{ flex:1, background:NAVY, color:'#fff', border:'none', borderRadius:'11px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
  mBtnSec:{ flex:1, background:'#f1f5f9', color:NAVY, border:'1px solid #e2e8f0', borderRadius:'11px', padding:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' },
};