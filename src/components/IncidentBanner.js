import React, { useEffect, useState } from 'react';
import api from '../utils/api';

// One line from the team lead at the top of every agent screen, until it expires or is ended.
export const SEV = {
  info:    { c: '#2563eb', bg: '#eff6ff', bgDark: '#0f1e3d', icon: 'ℹ️', word: 'Heads up' },
  warning: { c: '#d97706', bg: '#fffbeb', bgDark: '#2b1e05', icon: '⚠️', word: 'Incident' },
  urgent:  { c: '#dc2626', bg: '#fef2f2', bgDark: '#2d0f0f', icon: '🚨', word: 'Urgent' },
};
const hhmm = d => { try { return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

export default function IncidentBanner({ darkMode }) {
  const [inc, setInc] = useState(null);
  useEffect(() => {
    let live = true;
    const load = () => api.get('/incident').then(r => live && setInc(r.data.incident)).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    const vis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { live = false; clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, []);
  // hide it the moment it expires, without waiting for the next poll
  useEffect(() => {
    if (!inc) return undefined;
    const ms = new Date(inc.expires_at).getTime() - Date.now();
    if (ms <= 0) { setInc(null); return undefined; }
    const t = setTimeout(() => setInc(null), Math.min(ms, 2147483000));
    return () => clearTimeout(t);
  }, [inc]);
  if (!inc) return null;
  const s = SEV[inc.severity] || SEV.warning;
  return (
    <div role="alert" style={{ position: 'sticky', top: 0, zIndex: 40, marginBottom: 14, background: darkMode ? s.bgDark : s.bg, border: `1px solid ${s.c}66`, borderInlineStart: `6px solid ${s.c}`, borderRadius: 12, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', boxShadow: `0 6px 20px ${s.c}33` }}>
      <span style={{ fontSize: 20 }}>{s.icon}</span>
      <span style={{ fontSize: 12.5, fontWeight: 900, color: s.c, whiteSpace: 'nowrap' }}>{s.word}</span>
      <span style={{ flex: 1, minWidth: 200, fontSize: 14.5, fontWeight: 700, color: darkMode ? '#f1f5f9' : '#0f172a', lineHeight: 1.45 }}>{inc.message}</span>
      <span style={{ fontSize: 11.5, color: darkMode ? 'rgba(255,255,255,0.6)' : '#64748b', whiteSpace: 'nowrap' }}>{inc.by ? `${inc.by} · ` : ''}until {hhmm(inc.expires_at)}</span>
    </div>
  );
}
