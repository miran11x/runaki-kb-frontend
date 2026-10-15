import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { parseWorkbook } from '../utils/qaParse';

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

  const reset = () => { setStep('idle'); setParsed(null); setPreview(null); setResult(null); setProgress(0); if (fileRef.current) fileRef.current.value = ''; };

  const readFile = async file => {
    if (!file) return;
    if (!/\.xlsx?$/i.test(file.name)) return toast.error('Please choose the Excel workbook (.xlsx).');
    setStep('reading'); setFileName(file.name);
    try {
      await new Promise(r => setTimeout(r, 30));           // let the "reading" message paint first
      const p = parseWorkbook(await file.arrayBuffer());
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
      if (parsed.rubric.length) await api.post('/qa/rubric', { rows: parsed.rubric });
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
          Choose the monthly Excel workbook. Only its <strong style={{ color: th.text }}>Raw Data</strong> tab (and the scoring rubric tab) is read.
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
          <div style={{ fontSize: 12.5, color: th.sub, marginTop: 4 }}>.xlsx, up to 35 MB</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => readFile(e.target.files[0])} />
        </div>
      )}

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
