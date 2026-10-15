import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { parseWorkbook, parseCsv, parseRosterFile } from '../utils/qaParse';

// Admin → Quality → Upload: sync the monthly QA workbook (Raw Data tab) into the Knowledge Base.
// Upload as often as you like (daily): new evaluations are added, changed ones updated, nothing is duplicated.

const ORANGE = '#FF6B35';
const NAVY = '#0B1120';
const monthName = m => { try { return new Date(`${m}-01T00:00:00`).toLocaleString('en-GB', { month: 'long', year: 'numeric' }); } catch { return m; } };

function useTheme(dark) {
  return dark
    ? { card: '#111827', soft: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.12)', text: '#e2e8f0', sub: 'rgba(255,255,255,0.55)' }
    : { card: '#fff', soft: '#f8fafc', border: '#e2e8f0', text: NAVY, sub: '#64748b' };
}

function RosterSync({ th, roster }) {
  const [busy, setBusy] = useState(false);
  const [deact, setDeact] = useState(false);
  const [res, setRes] = useState(null);
  const off = roster.filter(a => /resign|transfer|terminat/i.test(a.status)).length;
  const run = async () => {
    setBusy(true); setRes(null);
    try {
      const t = { created: 0, updated: 0, failed: [] };
      for (let i = 0; i < roster.length; i += 40) {
        const r = await api.post('/users/sync-agents', { agents: roster.slice(i, i + 40) });
        t.created += r.data.created; t.updated += r.data.updated; t.failed.push(...r.data.failed);
      }
      const fin = await api.post('/users/sync-agents/finish', { waves: roster.map(a => a.wave_id), deactivate: deact });
      setRes({ ...t, ...fin.data });
      toast.success(`Agents synced: ${t.created} created, ${t.updated} updated`);
    } catch (e) { toast.error(e.response?.data?.error || 'Agent sync failed. You can run it again.'); }
    setBusy(false);
  };
  return (
    <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: th.text, marginBottom: 4 }}>Agent accounts from the Unique ID tab</div>
      <div style={{ fontSize: 13, color: th.sub, lineHeight: 1.7, marginBottom: 12 }}>
        {roster.length} agents with a Wave ID ({off} resigned or transferred). Everyone gets a Knowledge Base account that logs in with the Wave ID
        (new accounts use the password <strong style={{ color: th.text }}>Wave@&lt;WaveID&gt;</strong>). Existing accounts are matched by Wave ID, email or name and keep their history.
        Resigned and transferred agents are kept but switched off.
      </div>
      <label style={{ display: 'flex', gap: 8, fontSize: 13, color: th.text, marginBottom: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={deact} onChange={e => setDeact(e.target.checked)} style={{ accentColor: ORANGE }} />
        <span>Also switch off agent accounts that are not in this roster</span>
      </label>
      <button onClick={run} disabled={busy} style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 800, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.7 : 1 }}>
        {busy ? 'Syncing…' : 'Sync agent accounts'}
      </button>
      {res && (
        <div style={{ marginTop: 14, fontSize: 13, color: th.text, lineHeight: 1.8 }}>
          <div><strong style={{ color: '#10b981' }}>{res.created}</strong> created · <strong>{res.updated}</strong> updated · <strong>{res.active}</strong> of {res.n} agent accounts active · {res.no_wave} without a Wave ID{res.deactivated ? ` · ${res.deactivated} switched off` : ''}</div>
          {res.failed.length > 0 && <div style={{ color: '#ef4444' }}>Could not sync: {res.failed.map(f => `${f.name} (${f.reason})`).join('; ')}</div>}
          {res.notInRoster.length > 0 && (
            <div style={{ color: th.sub }}>Agent accounts not in the roster ({res.notInRoster.length}): {res.notInRoster.slice(0, 40).map(a => `${a.name}${a.wave_id ? ` (${a.wave_id})` : ' (no Wave ID)'}`).join(', ')}{res.notInRoster.length > 40 ? '…' : ''}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QaUpload({ darkMode, onDone }) {
  const th = useTheme(darkMode);
  const fileRef = useRef(null);
  const [step, setStep] = useState('idle');       // idle | reading | ready | uploading | done
  const [parsed, setParsed] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeStale, setRemoveStale] = useState(true);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState('');
  const [drag, setDrag] = useState(false);
  const [rosterOnly, setRosterOnly] = useState(null);
  const rosterRef = useRef(null);
  const readRoster = async file => {
    if (!file) return;
    try {
      const r = parseRosterFile(await file.arrayBuffer(), /\.csv$/i.test(file.name));
      if (!r.length) throw new Error('No agents found. The file needs the columns Name and Wave ID.');
      setRosterOnly(r);
    } catch (e) { toast.error(e.message || 'Could not read the roster'); }
    if (rosterRef.current) rosterRef.current.value = '';
  };

  const reset = () => { setStep('idle'); setParsed(null); setPreview(null); setResult(null); setProgress(0); if (fileRef.current) fileRef.current.value = ''; };

  const readFile = async file => {
    if (!file) return;
    if (!/\.(xlsx?|csv)$/i.test(file.name)) return toast.error('Please choose the workbook (.xlsx) or the Raw Data CSV.');
    setStep('reading'); setFileName(file.name);
    try {
      await new Promise(r => setTimeout(r, 30));           // let the "reading" message paint first
      const buf = await file.arrayBuffer();
      const p = /\.csv$/i.test(file.name) ? parseCsv(buf) : parseWorkbook(buf);
      if (!p.rows.length) throw new Error('No evaluations were found in the Raw Data tab.');
      const pv = await api.post('/qa/preview', { items: p.rows.map(r => ({ key: r.eval_key, hash: r.row_hash, month: r.eval_date.slice(0, 7) })) });
      setParsed(p); setPreview(pv.data); setStep('ready');
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Could not read this file');
      reset();
    }
  };

  const upload = async () => {
    setStep('uploading'); setProgress(0);
    const batch = `${Date.now()}`;
    const CH = 60;
    try {
      let inserted = 0, updated = 0;
      for (let i = 0; i < parsed.rows.length; i += CH) {
        const r = await api.post('/qa/upload', { batch, rows: parsed.rows.slice(i, i + CH) });
        inserted += r.data.inserted; updated += r.data.updated;
        setProgress(Math.min(100, Math.round(((i + CH) / parsed.rows.length) * 100)));
      }
      if (parsed.rubric.length) await api.post('/qa/rubric', { rows: parsed.rubric, onlyIfEmpty: !parsed.rubricFromFile });
      const fin = await api.post('/qa/finish', { batch, months: parsed.months, remove: removeStale });
      setResult({ inserted, updated, removed: fin.data.removed, total: parsed.rows.length });
      setStep('done');
      if (onDone) onDone();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Upload failed. Nothing was removed, you can upload again.');
      setStep('ready');
    }
  };

  const card = { background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 20, marginBottom: 14 };
  const stat = (n, label, color) => (
    <div style={{ background: th.soft, borderRadius: 12, padding: '12px 14px', minWidth: 120 }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: color || th.text }}>{n}</div>
      <div style={{ fontSize: 12, color: th.sub }}>{label}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ ...card }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: th.text, marginBottom: 6 }}>Upload the QA evaluation workbook</div>
        <div style={{ fontSize: 13.5, color: th.sub, lineHeight: 1.7 }}>
          Choose the monthly Excel workbook, or just the Raw Data tab saved as a CSV. From the workbook only its <strong style={{ color: th.text }}>Raw Data</strong> tab (and the rubric tab) is read; a CSV is read as the Raw Data tab.
          You can upload every day: evaluations already in the system stay as they are, new ones are added, ones that changed in the sheet are updated, and nothing is duplicated.
        </div>
      </div>

      {step === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); readFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current && fileRef.current.click()}
          style={{ border: `2px dashed ${drag ? ORANGE : th.border}`, borderRadius: 16, padding: '44px 20px', textAlign: 'center', cursor: 'pointer', background: drag ? `${ORANGE}11` : th.card }}>
          <div style={{ fontSize: 34 }}>📊</div>
          <div style={{ fontWeight: 800, color: th.text, marginTop: 8 }}>Drop the workbook here or click to choose it</div>
          <div style={{ fontSize: 12.5, color: th.sub, marginTop: 4 }}>.xlsx or .csv</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => readFile(e.target.files[0])} />
        </div>
      )}

      {step === 'idle' && (
        <div style={{ ...card, marginTop: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: th.text, marginBottom: 4 }}>Agent accounts only</div>
          <div style={{ fontSize: 13, color: th.sub, lineHeight: 1.7, marginBottom: 12 }}>
            Upload a roster file (the Unique ID tab saved as CSV, or a file with Name, Wave ID, Email Address, Queue and Status columns) to create or update the agent accounts without uploading evaluations.
          </div>
          <button onClick={() => rosterRef.current && rosterRef.current.click()} style={{ background: 'transparent', color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Choose roster file</button>
          <input ref={rosterRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => readRoster(e.target.files[0])} />
        </div>
      )}
      {step === 'idle' && rosterOnly && <RosterSync th={th} roster={rosterOnly} />}

      {step === 'reading' && <div style={{ ...card, color: th.sub }}>Reading {fileName}. This takes about 10 seconds…</div>}

      {step === 'ready' && parsed && preview && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 800, color: th.text, marginBottom: 4 }}>{fileName}</div>
          <div style={{ fontSize: 13, color: th.sub, marginBottom: 14 }}>
            {parsed.rows.length} evaluations · {parsed.months.map(monthName).join(', ')} · {new Set(parsed.rows.map(r => r.agent_name)).size} agents · {new Set(parsed.rows.map(r => r.qa_officer)).size} QA officers
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {stat(preview.added, 'new', '#10b981')}
            {stat(preview.changed, 'changed', ORANGE)}
            {stat(preview.same, 'unchanged')}
            {stat(preview.removed, removeStale ? 'will be removed' : 'not in the sheet', preview.removed ? '#ef4444' : th.text)}
          </div>
          {parsed.problems.scoreMismatch > 0 && (
            <div style={{ fontSize: 12.5, color: '#b45309', marginBottom: 10 }}>
              {parsed.problems.scoreMismatch} evaluation{parsed.problems.scoreMismatch > 1 ? 's have' : ' has'} points that do not add up to the Raw Score in the sheet. They are still uploaded as written.
            </div>
          )}
          {parsed.problems.noWave > 0 && (
            <div style={{ fontSize: 12.5, color: '#b45309', marginBottom: 10 }}>
              {parsed.problems.noWave} evaluations have no Wave ID, so those agents cannot see them in My Evaluations.
            </div>
          )}
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: th.text, lineHeight: 1.6, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={removeStale} onChange={e => setRemoveStale(e.target.checked)} style={{ marginTop: 3, accentColor: ORANGE }} />
            <span>
              <strong>Remove evaluations that are no longer in this sheet</strong><br />
              <span style={{ color: th.sub }}>Only for the months in this file ({parsed.months.map(monthName).join(', ')}). Other months are never touched. Untick it to only add and update.</span>
            </span>
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={upload} style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Upload now</button>
            <button onClick={reset} style={{ background: 'transparent', color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: '11px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {(step === 'ready' || step === 'done') && parsed && parsed.roster.length > 0 && <RosterSync th={th} roster={parsed.roster} />}

      {step === 'uploading' && (
        <div style={card}>
          <div style={{ fontWeight: 800, color: th.text, marginBottom: 10 }}>Uploading… {progress}%</div>
          <div style={{ height: 10, borderRadius: 6, background: th.soft, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: ORANGE, transition: 'width .3s' }} />
          </div>
          <div style={{ fontSize: 12.5, color: th.sub, marginTop: 8 }}>Keep this page open until it finishes.</div>
        </div>
      )}

      {step === 'done' && result && (
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981', marginBottom: 10 }}>✓ Done: {result.total} evaluations are in the system</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {stat(result.inserted, 'added', '#10b981')}
            {stat(result.updated, 'already there (updated if changed)')}
            {stat(result.removed, 'removed', result.removed ? '#ef4444' : th.text)}
          </div>
          <button onClick={reset} style={{ background: 'transparent', color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontFamily: 'inherit' }}>Upload another file</button>
        </div>
      )}
    </div>
  );
}
