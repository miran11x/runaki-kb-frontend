/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const NAVY = '#0B1120';
const ORANGE = '#FF6B35';

const ROLE_COLORS = {
  agent: '#3b82f6', team_lead: '#8b5cf6',
  qa_officer: '#10b981', supervisor: '#ec4899',
};

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('rk_dark') === '1');
  const toggleDark = () => { const n = !darkMode; setDarkMode(n); localStorage.setItem('rk_dark', n?'1':'0'); };
  const [activeTab, setActiveTab] = useState('overview');

  const DM = darkMode ? {
    bg:'#0f1623', cardBg:'#1a2235', border:'rgba(255,255,255,0.08)',
    text:'#e2e8f0', subText:'rgba(255,255,255,0.5)', shadow:'0 2px 8px rgba(0,0,0,0.4)'
  } : {
    bg:'#f0f4ff', cardBg:'#fff', border:'#e2e8f0',
    text:NAVY, subText:'#64748b', shadow:'0 2px 8px rgba(0,0,0,0.05)'
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [sr, br] = await Promise.all([
          api.get('/users/profile/me'),
          api.get('/bookmarks'),
        ]);
        setStats(sr.data);
        setBookmarks(br.data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const roleColor = ROLE_COLORS[user?.role] || '#6366f1';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

  const StatCard = ({ icon, value, label, color }) => (
    <div style={{ background: DM.cardBg, borderRadius:'18px', padding:'22px', border:`1px solid ${color}25`, boxShadow:`0 4px 20px ${color}12`, textAlign:'center', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-15px', right:'-15px', width:'70px', height:'70px', background:`radial-gradient(circle,${color}20,transparent)`, borderRadius:'50%' }} />
      <div style={{ fontSize:'28px', marginBottom:'8px' }}>{icon}</div>
      <div style={{ fontSize:'32px', fontWeight:'900', color, lineHeight:1 }}>{value ?? 0}</div>
      <div style={{ fontSize:'11px', fontWeight:'700', color:DM.subText, marginTop:'6px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</div>
    </div>
  );

  if (loading) return (
    <div style={{ display:'flex', height:'100vh', background:DM.bg, alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'40px', marginBottom:'12px' }}>👤</div>
        <div style={{ fontSize:'14px', color:DM.subText, fontWeight:'600' }}>Loading profile...</div>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:DM.bg, fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <Sidebar panel="_profile" setPanel={p => { if(p !== '_profile') navigate('/'); }} search="" setSearch={() => {}} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar title="My Profile" subtitle="Your activity and stats" darkMode={darkMode} onToggleDark={toggleDark} />
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', background:DM.bg }}>

          {/* Profile Header Card */}
          <div style={{ background: darkMode ? 'linear-gradient(135deg,#0f1623,#1a1040)' : `linear-gradient(135deg,${NAVY},#1e3a5f)`, borderRadius:'24px', padding:'32px', marginBottom:'24px', position:'relative', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
            {/* Background decoration */}
            <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px', background:`radial-gradient(circle,${roleColor}30,transparent)`, borderRadius:'50%' }} />
            <div style={{ position:'absolute', bottom:'-20px', left:'30%', width:'120px', height:'120px', background:'rgba(255,255,255,0.03)', borderRadius:'50%' }} />

            <div style={{ display:'flex', alignItems:'center', gap:'24px', position:'relative' }}>
              {/* Avatar */}
              <div style={{ width:'80px', height:'80px', borderRadius:'22px', background:`linear-gradient(135deg,${roleColor},${roleColor}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:'900', color:'#fff', flexShrink:0, boxShadow:`0 8px 24px ${roleColor}50`, border:'3px solid rgba(255,255,255,0.2)' }}>
                {initials}
              </div>
              {/* Info */}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'22px', fontWeight:'900', color:'#fff', letterSpacing:'-0.02em', marginBottom:'4px' }}>{user?.name}</div>
                <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)', marginBottom:'10px' }}>{user?.email}</div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  <span style={{ background:roleColor, color:'#fff', fontSize:'11px', fontWeight:'800', padding:'4px 14px', borderRadius:'100px', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    {user?.title || user?.role}
                  </span>
                  <span style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.8)', fontSize:'11px', fontWeight:'600', padding:'4px 14px', borderRadius:'100px' }}>
                    🔥 {stats?.total_logins || 0} logins
                  </span>
                </div>
              </div>
              {/* Score circle */}
              <div style={{ textAlign:'center', flexShrink:0 }}>
                <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:`3px solid ${roleColor}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backdropFilter:'blur(10px)' }}>
                  <div style={{ fontSize:'20px', fontWeight:'900', color:'#fff', lineHeight:1 }}>{stats?.faqs_viewed || 0}</div>
                  <div style={{ fontSize:'8px', color:'rgba(255,255,255,0.6)', fontWeight:'700', textTransform:'uppercase', marginTop:'2px' }}>FAQs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:DM.cardBg, borderRadius:'14px', padding:'4px', border:`1px solid ${DM.border}` }}>
            {[['overview','📊 Overview'],['bookmarks',`⭐ Bookmarks (${bookmarks.length})`]].map(([t,l]) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ flex:1, padding:'10px', borderRadius:'10px', border:'none', background: activeTab===t ? (darkMode?`${roleColor}25`:NAVY) : 'transparent', color: activeTab===t ? (darkMode?roleColor:'#fff') : DM.subText, fontWeight: activeTab===t ? '800':'600', fontSize:'13px', cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Stats Grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'14px', marginBottom:'24px' }}>
                <StatCard icon="📖" value={stats?.faqs_viewed} label="FAQs Viewed" color="#6366f1" />
                <StatCard icon="⭐" value={stats?.bookmarks} label="Bookmarks" color="#f59e0b" />
                <StatCard icon="👍" value={stats?.helpful_ratings} label="Helpful Ratings" color="#10b981" />
                <StatCard icon="🔑" value={stats?.total_logins} label="Total Logins" color="#ec4899" />
              </div>

              {/* Engagement Score */}
              <div style={{ background:DM.cardBg, borderRadius:'18px', padding:'22px', border:`1px solid ${DM.border}`, marginBottom:'16px' }}>
                <div style={{ fontSize:'14px', fontWeight:'800', color:DM.text, marginBottom:'16px' }}>📈 Engagement Score</div>
                {[
                  { label:'FAQ Explorer', value: Math.min(100, (stats?.faqs_viewed||0)*2), color:'#6366f1', icon:'📖' },
                  { label:'Knowledge Saver', value: Math.min(100, (stats?.bookmarks||0)*10), color:'#f59e0b', icon:'⭐' },
                  { label:'Feedback Giver', value: Math.min(100, (stats?.helpful_ratings||0)*10), color:'#10b981', icon:'👍' },
                ].map((bar,i) => (
                  <div key={i} style={{ marginBottom:'14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                      <span style={{ fontSize:'12px', fontWeight:'700', color:DM.text }}>{bar.icon} {bar.label}</span>
                      <span style={{ fontSize:'12px', fontWeight:'800', color:bar.color }}>{bar.value}%</span>
                    </div>
                    <div style={{ height:'8px', background: darkMode?'rgba(255,255,255,0.08)':'#f1f5f9', borderRadius:'100px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${bar.value}%`, background:`linear-gradient(90deg,${bar.color},${bar.color}88)`, borderRadius:'100px', transition:'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div style={{ background: darkMode?'rgba(255,107,53,0.08)':'#fff7ed', borderRadius:'16px', padding:'18px', border:`1px solid ${ORANGE}25` }}>
                <div style={{ fontSize:'13px', fontWeight:'800', color:ORANGE, marginBottom:'10px' }}>💡 Tips to improve your score</div>
                {[
                  '📖 Open and read FAQs to increase your Explorer score',
                  '⭐ Bookmark FAQs you use often for quick access',
                  '👍 Rate FAQs after reading to help improve content',
                ].map((tip,i) => (
                  <div key={i} style={{ display:'flex', gap:'8px', padding:'6px 0', fontSize:'12.5px', color:DM.subText, borderBottom: i<2?`1px solid ${DM.border}`:'none' }}>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bookmarks Tab */}
          {activeTab === 'bookmarks' && (
            <div>
              {bookmarks.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 40px', background:DM.cardBg, borderRadius:'20px', border:`1px solid ${DM.border}` }}>
                  <div style={{ fontSize:'48px', marginBottom:'12px' }}>⭐</div>
                  <div style={{ fontSize:'18px', fontWeight:'800', color:DM.text, marginBottom:'8px' }}>No bookmarks yet</div>
                  <div style={{ fontSize:'13px', color:DM.subText }}>Click ☆ on any FAQ to save it here</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {bookmarks.map(faq => {
                    const catColors = { 'Inquiries':'#6366f1','Billing Complaints':'#ef4444','General Complaints':'#8b5cf6','Service Requests':'#10b981','Feedback & Others':'#f59e0b','New Updates':'#f97316' };
                    const color = catColors[faq.category] || '#6366f1';
                    return (
                      <div key={faq.id} style={{ background:DM.cardBg, borderRadius:'14px', padding:'16px 20px', border:`1px solid ${DM.border}`, display:'flex', alignItems:'flex-start', gap:'14px' }}>
                        <div style={{ width:'4px', alignSelf:'stretch', background:color, borderRadius:'4px', flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'14px', fontWeight:'700', color:DM.text, marginBottom:'5px' }}>{faq.question_en}</div>
                          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                            <span style={{ background:`${color}15`, color, fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'6px' }}>{faq.category}</span>
                            {faq.subcategory && <span style={{ background:DM.border, color:DM.subText, fontSize:'10px', fontWeight:'600', padding:'2px 8px', borderRadius:'6px' }}>{faq.subcategory}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize:'10px', color:DM.subText, flexShrink:0 }}>{new Date(faq.bookmarked_at).toLocaleDateString()}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}