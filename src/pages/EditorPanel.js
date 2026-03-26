import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import toast from 'react-hot-toast';

const NAVY = '#0F1629';
const ORANGE = '#FF6B35';
const BG = '#f8fafc';

const CATEGORIES = ['Inquiries','Billing Complaints','General Complaints','Service Requests','Feedback & Others','New Updates'];
const TIP_CATEGORIES = ['General','KYC','Billing','Outage','Dunning','e-Psûle','USSD','Service','Scripts'];

const emptyFaq = { category:'Inquiries', subcategory:'', question_en:'', answer_en:'', question_ku:'', answer_ku:'', tags:'', is_published:true };

export default function EditorPanel() {
  const navigate = useNavigate();
  const [tab, setTab]         = useState('faqs');
  const [faqs, setFaqs]       = useState([]);
  const [tips, setTips]       = useState([]);
  const [editFaq, setEditFaq] = useState(null);
  const [isNew, setIsNew]     = useState(false);
  const [search, setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [notifForm, setNotifForm] = useState({ title:'', message:'' });
  const [tipForm, setTipForm] = useState({ title:'', content:'', category:'General' });
  const [loading, setLoading] = useState(false);
  const [sideSearch, setSideSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('rk_editor_dark') === '1');
  const toggleDark = () => { const n = !darkMode; setDarkMode(n); localStorage.setItem('rk_editor_dark', n?'1':'0'); };

  const loadFaqs = useCallback(async () => {
    const r = await api.get('/faqs/all').catch(() => null);
    if (r) setFaqs(r.data);
  }, []);

  const loadTips = useCallback(async () => {
    const r = await api.get('/tips').catch(() => null);
    if (r) setTips(r.data);
  }, []);

  useEffect(() => { loadFaqs(); loadTips(); }, [loadFaqs, loadTips]);

  const saveFaq = async e => {
    e.preventDefault(); setLoading(true);
    try {
      isNew ? await api.post('/faqs', editFaq) : await api.put(`/faqs/${editFaq.id}`, editFaq);
      toast.success(isNew ? 'FAQ created!' : 'FAQ updated!');
      setEditFaq(null); setIsNew(false); loadFaqs();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const deleteFaq = async id => {
    if (!window.confirm('Delete this FAQ?')) return;
    await api.delete(`/faqs/${id}`);
    toast.success('Deleted'); loadFaqs();
  };

  const togglePublish = async faq => {
    await api.put(`/faqs/${faq.id}`, { ...faq, is_published: !faq.is_published });
    toast.success(faq.is_published ? 'Unpublished' : 'Published'); loadFaqs();
  };

  const sendNotif = async e => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/faqs/notifications', notifForm);
      toast.success('Notification sent!');
      setNotifForm({ title:'', message:'' });
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const createTip = async e => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/tips', tipForm);
      toast.success('Tip posted! It\'s now live for agents 🎉');
      setTipForm({ title:'', content:'', category:'General' });
      loadTips();
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const setActiveTip = async id => {
    await api.patch(`/tips/${id}/toggle`);
    toast.success('Tip set as active!'); loadTips();
  };

  const deleteTip = async id => {
    await api.delete(`/tips/${id}`);
    toast.success('Tip deleted'); loadTips();
  };

  const filtered = faqs.filter(f => {
    const matchCat = catFilter === 'All' || f.category === catFilter;
    const matchSearch = !search || f.question_en.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ ...S.layout, background: darkMode ? '#080e18' : '#f0f4ff' }}>
      <Sidebar panel={null} setPanel={() => navigate('/')} search={sideSearch} setSearch={setSideSearch} />
      <div style={S.body}>
        <Topbar
          title="FAQ Editor"
          subtitle={`${faqs.filter(f=>f.is_published).length} published · ${faqs.filter(f=>!f.is_published).length} drafts`}
          darkMode={darkMode} onToggleDark={toggleDark}
        />

        {/* Tabs */}
        <div style={S.tabs}>
          {[['faqs','📖 FAQs'],['tips','💡 Daily Tips'],['notify','🔔 Notify']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ ...S.tab, ...(tab===k ? S.tabOn : {}) }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ ...S.content, background: darkMode ? '#080e18' : '#f0f4ff' }}>

          {/* ── FAQs ── */}
          {tab === 'faqs' && (
            <div>
              {/* Controls */}
              <div style={S.controls}>
                <input placeholder="🔍 Search FAQs..." value={search}
                  onChange={e => setSearch(e.target.value)} style={S.searchInput} />
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={S.select}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button style={S.addBtn} onClick={() => { setEditFaq({...emptyFaq}); setIsNew(true); }}>
                  + New FAQ
                </button>
              </div>

              {/* FAQ Edit Modal */}
              {editFaq && (
                <div style={S.overlay}>
                  <div style={{ ...S.modal, background: darkMode?'#0f1623':'#fff', border: darkMode?'1px solid rgba(255,255,255,0.1)':'' }}>
                    <div style={S.mHead}>
                      <h3 style={{ ...S.mTitle, color: darkMode?'#f1f5f9':NAVY }}>{isNew ? '➕ New FAQ' : '✏️ Edit FAQ'}</h3>
                      <button style={S.mClose} onClick={() => { setEditFaq(null); setIsNew(false); }}>✕</button>
                    </div>
                    <form onSubmit={saveFaq} style={S.mForm}>
                      <div style={S.mRow}>
                        <div style={S.mField}>
                          <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Category</label>
                          <select value={editFaq.category} onChange={e => setEditFaq({...editFaq,category:e.target.value})} style={{ ...S.mInput, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', color: darkMode?'#f1f5f9':'#0B1120' }}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div style={S.mField}>
                          <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Subcategory</label>
                          <input value={editFaq.subcategory} onChange={e => setEditFaq({...editFaq,subcategory:e.target.value})} style={{ ...S.mInput, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', color: darkMode?'#f1f5f9':'#0B1120' }} placeholder="e.g. Rollout, KYC, USSD..." />
                        </div>
                      </div>
                      <div style={S.mField}>
                        <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Question (English) *</label>
                        <input value={editFaq.question_en} onChange={e => setEditFaq({...editFaq,question_en:e.target.value})} style={{ ...S.mInput, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', color: darkMode?'#f1f5f9':'#0B1120' }} placeholder="Enter question in English" required />
                      </div>
                      <div style={S.mField}>
                        <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Answer (English) *</label>
                        <textarea value={editFaq.answer_en} onChange={e => setEditFaq({...editFaq,answer_en:e.target.value})} style={{...S.mInput,height:'100px',resize:'vertical'}} placeholder="Enter answer in English" required />
                      </div>
                      <div style={S.mField}>
                        <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Question (Kurdish)</label>
                        <input value={editFaq.question_ku} onChange={e => setEditFaq({...editFaq,question_ku:e.target.value})} style={{...S.mInput,direction:'rtl'}} placeholder="پرسیار بە کوردی" />
                      </div>
                      <div style={S.mField}>
                        <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Answer (Kurdish)</label>
                        <textarea value={editFaq.answer_ku} onChange={e => setEditFaq({...editFaq,answer_ku:e.target.value})} style={{...S.mInput,height:'100px',resize:'vertical',direction:'rtl'}} placeholder="وەڵام بە کوردی" />
                      </div>
                      <div style={S.mRow}>
                        <div style={S.mField}>
                          <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Tags</label>
                          <input value={editFaq.tags} onChange={e => setEditFaq({...editFaq,tags:e.target.value})} style={{ ...S.mInput, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', color: darkMode?'#f1f5f9':'#0B1120' }} placeholder="billing, kyc, payment" />
                        </div>
                        <div style={S.mField}>
                          <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Status</label>
                          <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',marginTop:'8px'}}>
                            <input type="checkbox" checked={editFaq.is_published} onChange={e => setEditFaq({...editFaq,is_published:e.target.checked})} />
                            <span style={{fontSize:'13px',fontWeight:'600',color:darkMode?'#e2e8f0':NAVY}}>Published</span>
                          </label>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
                        <button type="submit" disabled={loading} style={S.mBtn}>{loading?'Saving...':(isNew?'Create FAQ':'Save Changes')}</button>
                        <button type="button" onClick={()=>{setEditFaq(null);setIsNew(false);}} style={S.mBtnSec}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* FAQs Table */}
              <div style={{ ...S.table, background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ ...S.tableHead, background: darkMode?'rgba(255,255,255,0.04)':'#f8fafc', borderBottom: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', color: darkMode?'rgba(255,255,255,0.3)':'#94a3b8' }}>
                  <div style={{flex:3}}>Question</div>
                  <div style={{flex:1.5}}>Category</div>
                  <div style={{flex:1}}>Status</div>
                  <div style={{flex:1}}>Views</div>
                  <div style={{flex:1.5}}>By</div>
                  <div style={{flex:1}}>Actions</div>
                </div>
                {filtered.length === 0
                  ? <div style={{padding:'32px',textAlign:'center',color:'#94a3b8',fontSize:'14px'}}>No FAQs found</div>
                  : filtered.map(f => (
                    <div key={f.id} style={S.tableRow}>
                      <div style={{flex:3}}>
                        <div style={{fontSize:'13.5px',fontWeight:'600',color:darkMode?'#e2e8f0':NAVY,lineHeight:'1.4'}}>{f.question_en}</div>
                        {f.subcategory && <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'2px'}}>{f.subcategory}</div>}
                      </div>
                      <div style={{flex:1.5}}>
                        <span style={{background: darkMode?'rgba(99,102,241,0.2)':'#eef2ff',color: darkMode?'#a5b4fc':'#4338ca',fontSize:'11px',fontWeight:'700',padding:'3px 9px',borderRadius:'6px'}}>{f.category}</span>
                      </div>
                      <div style={{flex:1}}>
                        <span style={{padding:'3px 10px',borderRadius:'100px',fontSize:'11px',fontWeight:'700',background:f.is_published?(darkMode?'rgba(22,163,74,0.2)':'#f0fdf4'):(darkMode?'rgba(234,179,8,0.2)':'#fef3c7'),color:f.is_published?'#16a34a':'#92400e'}}>
                          {f.is_published?'Live':'Draft'}
                        </span>
                      </div>
                      <div style={{flex:1,fontSize:'13px',color:'#64748b',fontWeight:'600'}}>{f.views||0}</div>
                      <div style={{flex:1.5,fontSize:'12px',color:'#94a3b8'}}>{f.created_by_name||'—'}</div>
                      <div style={{flex:1,display:'flex',gap:'5px'}}>
                        <button style={{ ...S.tBtn, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1px solid rgba(255,255,255,0.1)':'1px solid #e2e8f0' }} onClick={()=>{setEditFaq({...f});setIsNew(false);}}>✏️</button>
                        <button style={{ ...S.tBtn, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1px solid rgba(255,255,255,0.1)':'1px solid #e2e8f0' }} onClick={()=>togglePublish(f)} title={f.is_published?'Unpublish':'Publish'}>{f.is_published?'👁️':'🚀'}</button>
                        <button style={{...S.tBtn,color:'#ef4444'}} onClick={()=>deleteFaq(f.id)}>🗑️</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ── DAILY TIPS ── */}
          {tab === 'tips' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
              {/* Create tip */}
              <div style={{ ...S.card, background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={S.cardTitle}>💡 Post New Daily Tip</h3>
                <p style={{fontSize:'13px',color:'#64748b',marginBottom:'20px',lineHeight:'1.6'}}>
                  Tips appear as a highlighted banner on the agent FAQ view. Only one tip is active at a time.
                </p>
                <form onSubmit={createTip} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  <div style={S.mField}>
                    <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Tip Title</label>
                    <input value={tipForm.title} onChange={e=>setTipForm({...tipForm,title:e.target.value})}
                      style={{ ...S.mInput, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', color: darkMode?'#f1f5f9':'#0B1120' }} placeholder="e.g. Always verify KYC before billing complaints" required />
                  </div>
                  <div style={S.mField}>
                    <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Tip Content</label>
                    <textarea value={tipForm.content} onChange={e=>setTipForm({...tipForm,content:e.target.value})}
                      style={{...S.mInput,height:'100px',resize:'vertical'}}
                      placeholder="Write the tip details here..." required />
                  </div>
                  <div style={S.mField}>
                    <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Category</label>
                    <select value={tipForm.category} onChange={e=>setTipForm({...tipForm,category:e.target.value})} style={{ ...S.mInput, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', color: darkMode?'#f1f5f9':'#0B1120' }}>
                      {TIP_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={loading} style={S.mBtn}>
                    {loading ? 'Posting...' : '💡 Post Tip Now'}
                  </button>
                </form>
              </div>

              {/* Tips history */}
              <div style={{ ...S.card, background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={S.cardTitle}>📋 Recent Tips ({tips.length})</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'8px',maxHeight:'480px',overflowY:'auto'}}>
                  {tips.length === 0
                    ? <div style={{textAlign:'center',padding:'32px',color:'#94a3b8',fontSize:'13px'}}>No tips yet</div>
                    : tips.map(t => (
                      <div key={t.id} style={{...S.tipItem,...(t.is_active?S.tipItemActive:{})}}>
                        <div style={S.tipItemHead}>
                          <span style={{fontSize:'12.5px',fontWeight:'800',color:t.is_active?ORANGE:NAVY}}>{t.title}</span>
                          {t.is_active && <span style={S.activeBadge}>● LIVE</span>}
                        </div>
                        <div style={{fontSize:'12px',color:'#64748b',lineHeight:'1.5',margin:'4px 0'}}>{t.content}</div>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div style={{fontSize:'11px',color:'#94a3b8'}}>{t.category} · {t.author} · {new Date(t.created_at).toLocaleDateString()}</div>
                          <div style={{display:'flex',gap:'6px'}}>
                            {!t.is_active && <button style={{ ...S.tBtn, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1px solid rgba(255,255,255,0.1)':'1px solid #e2e8f0' }} onClick={()=>setActiveTip(t.id)} title="Set as active">✅</button>}
                            <button style={{...S.tBtn,color:'#ef4444'}} onClick={()=>deleteTip(t.id)}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ── NOTIFY ── */}
          {tab === 'notify' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
              <div style={{ ...S.card, background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={S.cardTitle}>🔔 Send Notification</h3>
                <p style={{fontSize:'13px',color:'#64748b',marginBottom:'20px',lineHeight:'1.6'}}>
                  Agents will see this in the notification bell in the top bar.
                </p>
                <form onSubmit={sendNotif} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  <div style={S.mField}>
                    <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Title</label>
                    <input value={notifForm.title} onChange={e=>setNotifForm({...notifForm,title:e.target.value})}
                      style={{ ...S.mInput, background: darkMode?'rgba(255,255,255,0.06)':'#f8fafc', border: darkMode?'1.5px solid rgba(255,255,255,0.1)':'1.5px solid #e2e8f0', color: darkMode?'#f1f5f9':'#0B1120' }} placeholder="e.g. KB Updated — New e-Psûle FAQs" required />
                  </div>
                  <div style={S.mField}>
                    <label style={{ ...S.mLabel, color: darkMode?'rgba(255,255,255,0.6)':NAVY }}>Message</label>
                    <textarea value={notifForm.message} onChange={e=>setNotifForm({...notifForm,message:e.target.value})}
                      style={{...S.mInput,height:'120px',resize:'vertical'}} required />
                  </div>
                  <button type="submit" disabled={loading} style={S.mBtn}>
                    {loading ? 'Sending...' : '🔔 Send to All Agents'}
                  </button>
                </form>
                <div style={{marginTop:'18px',padding:'14px',background:'#f0f9ff',borderRadius:'12px',border:'1px solid #bae6fd'}}>
                  <div style={{fontSize:'12px',fontWeight:'800',color:'#0369a1',marginBottom:'6px'}}>📧 Send via Outlook</div>
                  <a href={`mailto:agents@highperformanceco.net?subject=${encodeURIComponent(notifForm.title||'KB Update')}&body=${encodeURIComponent(notifForm.message||'')}`}
                    style={{display:'block',textAlign:'center',padding:'9px',background:'#0072C6',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'12px',fontWeight:'700',marginTop:'8px'}}>
                    Open in Outlook
                  </a>
                </div>
              </div>
              <div style={{ ...S.card, background: darkMode?'linear-gradient(145deg,#0f1623,#111827)':'#fff', border: darkMode?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={S.cardTitle}>📋 Tips for Effective Notifications</h3>
                {[
                  { icon: '✅', tip: 'Keep titles short and clear — agents see them in the bell dropdown' },
                  { icon: '📝', tip: 'Mention the specific change: "Added 5 new e-Psûle FAQs"' },
                  { icon: '⏰', tip: 'Send at the start of a shift for maximum visibility' },
                  { icon: '🎯', tip: 'Use Daily Tips for general best practices and reminders' },
                  { icon: '🔔', tip: 'Use Notifications for urgent or time-sensitive updates' },
                ].map((item, i) => (
                  <div key={i} style={{display:'flex',gap:'12px',padding:'12px 0',borderBottom:'1px solid #f1f5f9'}}>
                    <span style={{fontSize:'18px',flexShrink:0}}>{item.icon}</span>
                    <span style={{fontSize:'13px',color:'#475569',lineHeight:'1.6'}}>{item.tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  layout:{display:'flex',height:'100vh',overflow:'hidden',fontFamily:"'Inter','Segoe UI',sans-serif"},
  body:{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0},
  tabs:{display:'flex',gap:'4px',padding:'12px 28px 0'},
  tab:{padding:'10px 18px',borderRadius:'10px 10px 0 0',border:'none',background:'transparent',fontSize:'13px',fontWeight:'600',color:'#94a3b8',cursor:'pointer',fontFamily:'inherit'},
  tabOn:{background:BG,color:NAVY,fontWeight:'800',borderBottom:'2px solid '+ORANGE},
  content:{flex:1,overflowY:'auto',padding:'24px 28px'},

  controls:{display:'flex',gap:'10px',marginBottom:'18px',flexWrap:'wrap'},
  searchInput:{flex:1,minWidth:'200px',padding:'10px 16px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'13.5px',fontFamily:'inherit',outline:'none'},
  select:{padding:'10px 14px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'13px',fontFamily:'inherit',outline:'none',background:'#fff'},
  addBtn:{background:NAVY,color:'#fff',border:'none',borderRadius:'12px',padding:'10px 20px',fontSize:'13px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'},

  table:{borderRadius:'16px',overflow:'hidden'},
  tableHead:{display:'flex',padding:'12px 18px',fontSize:'10.5px',fontWeight:'800',textTransform:'uppercase',letterSpacing:'0.08em'},
  tableRow:{display:'flex',alignItems:'center',padding:'12px 18px',borderBottom:'1px solid #f1f5f9',gap:'8px'},
  tBtn:{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'5px 8px',cursor:'pointer',fontSize:'13px'},

  card:{background:'#fff',borderRadius:'16px',padding:'22px 24px',border:'1px solid #e2e8f0',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'},
  cardTitle:{fontSize:'16px',fontWeight:'800',color:NAVY,margin:'0 0 4px',letterSpacing:'-0.01em'},

  tipItem:{padding:'12px 14px',border:'1px solid #e2e8f0',borderRadius:'12px',transition:'all .15s'},
  tipItemActive:{border:`1px solid ${ORANGE}`},
  tipItemHead:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'},
  activeBadge:{fontSize:'10px',fontWeight:'800',color:ORANGE,letterSpacing:'0.06em'},

  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px'},
  modal:{borderRadius:'20px',padding:'28px',width:'100%',maxWidth:'600px',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'},
  mHead:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'},
  mTitle:{fontSize:'20px',fontWeight:'800',color:NAVY,margin:0},
  mClose:{background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'#94a3b8'},
  mForm:{display:'flex',flexDirection:'column',gap:'14px'},
  mRow:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'},
  mField:{display:'flex',flexDirection:'column',gap:'5px'},
  mLabel:{fontSize:'11px',fontWeight:'800',color:NAVY,textTransform:'uppercase',letterSpacing:'0.08em'},
  mInput:{padding:'10px 14px',borderRadius:'10px',fontSize:'14px',fontFamily:'inherit',outline:'none',width:'100%',boxSizing:'border-box'},
  mBtn:{background:NAVY,color:'#fff',border:'none',borderRadius:'10px',padding:'12px',fontSize:'14px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'},
  mBtnSec:{background:'#f1f5f9',color:NAVY,border:'1px solid #e2e8f0',borderRadius:'10px',padding:'12px',fontSize:'14px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'},
};