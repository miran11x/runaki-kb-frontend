import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useTheme, Panel, Empty, ORANGE, RED } from './qaUi';
import { SEV } from './IncidentBanner';

const DURATIONS = [[30, '30 minutes'], [60, '1 hour'], [120, '2 hours'], [240, '4 hours'], [720, '12 hours'], [1440, '1 day']];
const when = d => { try { return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

export default function IncidentAdmin({ darkMode }) {
  const th = useTheme(darkMode);
  const [msg, setMsg] = useState('');
  const [sev, setSev] = useState('warning');
  const [mins, setMins] = useState(120);
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get('/admin/incident/history').then(r => setD(r.data)).catch(() => toast.error('Could not load incidents')), []);
  useEffect(() => { load(); }, [load]);

  const post = async () => {
    setBusy(true);
    try { await api.post('/admin/incident', { message: msg, severity: sev, minutes: mins }); setMsg(''); toast.success('Posted. Agents see it within a minute.'); load(); }
    catch (e) { toast.error(e.response?.data?.error || 'Could not post'); }
    setBusy(false);
  };
  const end = async () => { try { await api.post('/admin/incident/end'); toast.success('Incident ended'); load(); } catch { toast.error('Could not end it'); } };
  const inp = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 14, fontFamily: 'inherit' };
  const live = d && d.active;

  return (
    <div style={{ maxWidth: 820, display: 'grid', gap: 14 }}>
      {live && (() => { const s = SEV[live.severity] || SEV.warning; return (
        <div style={{ background: `${s.c}15`, border: `1px solid ${s.c}66`, borderInlineStart: `6px solid ${s.c}`, borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22 }}>{s.icon}</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: s.c }}>Showing to every agent now, until {when(live.expires_at)}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: th.text, marginTop: 2 }}>{live.message}</div>
          </div>
          <button onClick={end} style={{ border: `1px solid ${RED}`, background: RED, color: '#fff', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>End now</button>
        </div>); })()}

      <Panel th={th} title="📣 Post an incident line" hint="One short line that shows at the top of every agent screen until it expires. Posting a new one replaces the current one.">
        <textarea value={msg} onChange={e => setMsg(e.target.value.slice(0, 240))} rows={2} placeholder="Example: Billing system is slow. Use the manual check and note the ticket." style={{ ...inp, resize: 'vertical' }} />
        <div style={{ fontSize: 11.5, color: th.sub, textAlign: 'end', margin: '2px 0 8px' }}>{msg.length}/240</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={sev} onChange={e => setSev(e.target.value)} style={{ ...inp, width: 'auto' }} aria-label="Severity">
            <option value="info">ℹ️ Heads up</option><option value="warning">⚠️ Incident</option><option value="urgent">🚨 Urgent</option>
          </select>
          <select value={mins} onChange={e => setMins(+e.target.value)} style={{ ...inp, width: 'auto' }} aria-label="Show for">
            {DURATIONS.map(([v, l]) => <option key={v} value={v}>Show for {l}</option>)}
          </select>
          <button onClick={post} disabled={busy || msg.trim().length < 5} style={{ marginInlineStart: 'auto', border: 'none', background: ORANGE, color: '#fff', borderRadius: 10, padding: '9px 18px', fontWeight: 800, cursor: busy || msg.trim().length < 5 ? 'default' : 'pointer', opacity: busy || msg.trim().length < 5 ? 0.5 : 1, fontFamily: 'inherit' }}>Post to agents</button>
        </div>
      </Panel>

      <Panel th={th} title="🕘 Recent lines">
        {!d ? <Empty th={th}>Loading…</Empty> : !d.rows.length ? <Empty th={th}>Nothing posted yet.</Empty> : d.rows.map(r => {
          const s = SEV[r.severity] || SEV.warning;
          const state = r.ended_at ? 'ended' : new Date(r.expires_at) > new Date() ? 'live' : 'expired';
          return (
            <div key={r.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderTop: `1px solid ${th.border}`, alignItems: 'baseline' }}>
              <span>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: th.text }}>{r.message}</div>
                <div style={{ fontSize: 11.5, color: th.sub }}>{r.by || 'Staff'} · {when(r.created_at)}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: state === 'live' ? s.c : th.sub }}>{state}</span>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
