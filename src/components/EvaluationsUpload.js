import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const NAVY  = '#0B1120';
const ORANGE = '#FF6B35';
const API   = process.env.REACT_APP_API_URL || 'https://runaki-kb-api.vercel.app';

// Maps Excel column headers → DB field names
// Keys are lowercased + trimmed for flexible matching
const COL_MAP = {
  'agent name':                               'agent_name',
  'coordinator':                              'coordinator',
  'qa':                                       'qa_officer',
  'qa officer':                               'qa_officer',
  'subject':                                  'subject',
  'phone number':                             'phone_number',
  'ticket id':                                'ticket_id',
  'waiting time':                             'waiting_time',
  'call duration':                            'call_duration',
  'greeting script':                          'greeting_script',
  'ask about customer name and informatios':  'customer_info',
  'ask about customer name and information':  'customer_info',
  'faq alignment':                            'faq_alignment',
  'correcting tagging topic':                 'correct_tagging',
  'communication/problem solving':            'communication',
  'tone of voice':                            'tone_of_voice',
  'ending':                                   'ending',
  'rude behaviour':                           'rude_behaviour',
  'hang up':                                  'hang_up',
  'active listening':                         'active_listening',
  'improvment areas':                         'improvement_areas',
  'improvement areas':                        'improvement_areas',
  'overall score':                            'overall_score',
  'possitive comments':                       'positive_comments',
  'positive comments':                        'positive_comments',
  'bad comments':                             'bad_comments',
  'feedback':                                 'feedback',
  'hold - unhold':                            'hold_unhold',
  'hold/unhold':                              'hold_unhold',
  'qa/trainer coaching status':               'coaching_status',
  'coaching status':                          'coaching_status',
  'evaluation date':                          'evaluation_date',
  'email address':                            'agent_email',
  'email':                                    'agent_email',
};

const CRITERIA_KEYS = [
  'greeting_script','customer_info','faq_alignment','correct_tagging',
  'communication','tone_of_voice','ending','rude_behaviour','hang_up','active_listening'
];

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) return val.toISOString().split('T')[0];
  if (typeof val === 'string') {
    const cleaned = val.trim();
    if (!cleaned) return null;
    const dt = new Date(cleaned);
    if (!isNaN(dt)) return dt.toISOString().split('T')[0];
  }
  return null;
}

function parseRow(row) {
  const mapped = {};
  Object.entries(row).forEach(([col, val]) => {
    const key = COL_MAP[col.trim().toLowerCase()];
    if (!key) return;
    if (key === 'evaluation_date') {
      mapped[key] = parseDate(val);
    } else if (CRITERIA_KEYS.includes(key)) {
      const n = parseInt(val);
      mapped[key] = isNaN(n) ? 0 : (n === 1 ? 1 : 0);
    } else if (key === 'overall_score') {
      const n = parseFloat(val);
      mapped[key] = isNaN(n) ? null : n;
    } else {
      mapped[key] = String(val ?? '').trim() || null;
    }
  });
  return mapped;
}

// ── Safe fetch helper ────────────────────────────────────────────────────────
// Handles cases where server returns HTML (404/error page) instead of JSON
async function safeFetch(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    // Server returned HTML (likely 404 or server error)
    if (res.status === 404) {
      throw new Error('API endpoint not found. Please make sure the backend is deployed with the latest code.');
    }
    throw new Error(`Server error (${res.status}). Please make sure the backend is deployed.`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function EvaluationsUpload({ token, darkMode }) {
  const DM     = darkMode;
  const card   = DM ? '#1e293b' : '#ffffff';
  const border = DM ? '#334155' : '#e2e8f0';
  const text   = DM ? '#e2e8f0' : '#1e293b';
  const sub    = DM ? '#94a3b8' : '#64748b';
  const faint  = DM ? '#0f172a' : '#f8fafc';

  const [status,     setStatus]     = useState('idle');
  const [parsed,     setParsed]     = useState(null);
  const [result,     setResult]     = useState(null);
  const [errorMsg,   setErrorMsg]   = useState('');
  const [clearFirst, setClearFirst] = useState(false);
  const [dragging,   setDragging]   = useState(false);
  const fileRef = useRef();

  const processFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx','xls'].includes(ext)) {
      setErrorMsg('Please upload an .xlsx or .xls file only.');
      setStatus('error');
      return;
    }

    setStatus('parsing');
    setErrorMsg('');
    setParsed(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb  = XLSX.read(ev.target.result, { type: 'binary', cellDates: true });

        // ── Read ALL sheets and merge ────────────────────────────────────────
        let allRows = [];
        wb.SheetNames.forEach(sheetName => {
          const ws  = wb.Sheets[sheetName];
          const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
          const rows = raw
            .map(parseRow)
            .filter(r => r.agent_name || r.agent_email);
          allRows = allRows.concat(rows);
        });

        if (!allRows.length) {
          setErrorMsg('No valid rows found. Make sure column headers match the evaluation sheet exactly.');
          setStatus('error');
          return;
        }

        setParsed(allRows);
        setStatus('ready');
      } catch (err) {
        setErrorMsg('Failed to parse file: ' + err.message);
        setStatus('error');
      }
    };
    reader.onerror = () => { setErrorMsg('Could not read file.'); setStatus('error'); };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!parsed?.length) return;
    setStatus('uploading');
    try {
      // Optional: clear existing first
      if (clearFirst) {
        await safeFetch(`${API}/api/evaluations/all`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Send in batches of 150 to avoid Vercel 413 payload limit
      const BATCH_SIZE = 150;
      let totalInserted = 0;
      for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
        const chunk = parsed.slice(i, i + BATCH_SIZE);
        const data = await safeFetch(`${API}/api/evaluations/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: chunk }),
        });
        totalInserted += data.inserted || 0;
      }
      setResult({ inserted: totalInserted });
      setStatus('done');
      toast.success(`${totalInserted} evaluations uploaded successfully`);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle'); setParsed(null); setResult(null); setErrorMsg('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const summary = parsed ? {
    total:  parsed.length,
    agents: [...new Set(parsed.map(r => r.agent_name).filter(Boolean))].length,
    qas:    [...new Set(parsed.map(r => r.qa_officer).filter(Boolean))],
    scored: parsed.filter(r => r.overall_score !== null && r.overall_score !== undefined).length,
  } : null;

  return (
    <div style={{ padding:'24px 28px', color:text }}>
      <h3 style={{ margin:'0 0 6px', color:DM?'#f1f5f9':NAVY, fontSize:18, fontWeight:700 }}>
        📤 Upload Evaluations
      </h3>
      <p style={{ margin:'0 0 24px', fontSize:13, color:sub, lineHeight:1.65 }}>
        Upload your daily evaluations Excel sheet (.xlsx or .xls). All sheets are read automatically.
        New records are inserted and existing ones with changes are updated. No duplicates created.
        Agents see only their own evaluations under <strong>📋 My Evaluations</strong>.
      </p>

      {/* ── Drop zone ── */}
      {status === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? ORANGE : border}`,
            borderRadius: 16, padding: '52px 24px',
            textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(255,107,53,0.05)' : faint,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize:48, marginBottom:14 }}>📂</div>
          <div style={{ fontSize:16, fontWeight:700, color:DM?'#f1f5f9':NAVY, marginBottom:6 }}>
            Drop your Excel file here
          </div>
          <div style={{ fontSize:13, color:sub }}>or click to browse — .xlsx or .xls only · all sheets will be read</div>
          <input
            ref={fileRef} type="file" accept=".xlsx,.xls"
            style={{ display:'none' }}
            onChange={e => processFile(e.target.files[0])}
          />
        </div>
      )}

      {/* ── Parsing ── */}
      {status === 'parsing' && (
        <div style={{ padding:40, textAlign:'center', color:sub }}>Reading all sheets...</div>
      )}

      {/* ── Ready ── */}
      {status === 'ready' && parsed && summary && (
        <div>
          <div style={{ background:card, border:`1px solid ${border}`, borderRadius:12, padding:'18px 22px', marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#22c55e', marginBottom:10 }}>
              ✅ {summary.total} rows ready to upload
            </div>
            <div style={{ fontSize:13, color:sub, lineHeight:2 }}>
              <div>👤 Agents: <strong style={{ color:text }}>{summary.agents}</strong></div>
              <div>📊 Rows with scores: <strong style={{ color:text }}>{summary.scored}</strong></div>
              <div>🔍 QA Officers: <strong style={{ color:text }}>{summary.qas.join(', ') || '—'}</strong></div>
            </div>
          </div>

          <label style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:text, marginBottom:22, cursor:'pointer', lineHeight:1.5 }}>
            <input
              type="checkbox" checked={clearFirst}
              onChange={e => setClearFirst(e.target.checked)}
              style={{ marginTop:2, width:16, height:16, accentColor:ORANGE, flexShrink:0 }}
            />
            <span>
              <strong>Clear all existing evaluations before uploading</strong><br/>
              <span style={{ color:sub }}>Only use for a full re-upload. For daily updates, leave unchecked — new rows are inserted and changed ones updated automatically.</span>
            </span>
          </label>

          <div style={{ display:'flex', gap:12 }}>
            <button onClick={handleUpload}
              style={{ background:ORANGE, color:'#fff', border:'none', borderRadius:10, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Upload {summary.total} Evaluations
            </button>
            <button onClick={reset}
              style={{ background:'transparent', color:sub, border:`1px solid ${border}`, borderRadius:10, padding:'12px 20px', fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Uploading ── */}
      {status === 'uploading' && (
        <div style={{ padding:40, textAlign:'center', color:sub }}>Uploading to database, please wait...</div>
      )}

      {/* ── Done ── */}
      {status === 'done' && result && (
        <div>
          <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:12, padding:'22px 24px', marginBottom:20 }}>
            <div style={{ fontSize:18, fontWeight:700, color:'#22c55e', marginBottom:6 }}>✅ Upload Complete</div>
            <div style={{ fontSize:14, color:text }}>
              {result.inserted} evaluation{result.inserted !== 1 ? 's' : ''} processed successfully.
              New records inserted and changed records updated.
            </div>
          </div>
          <button onClick={reset}
            style={{ background:ORANGE, color:'#fff', border:'none', borderRadius:10, padding:'11px 24px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Upload Another File
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div>
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'20px 24px', marginBottom:20 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#ef4444', marginBottom:4 }}>❌ Error</div>
            <div style={{ fontSize:13, color:text, lineHeight:1.6 }}>{errorMsg}</div>
            {errorMsg.includes('backend') || errorMsg.includes('endpoint') ? (
              <div style={{ marginTop:12, fontSize:12, color:sub, background:faint, borderRadius:8, padding:'10px 14px' }}>
                💡 Fix: Push your backend first:<br/>
                <code style={{ color:ORANGE }}>cd C:\Users\Miran\runaki-kb-api</code><br/>
                <code style={{ color:ORANGE }}>git add -A && git commit -m "Add evaluations endpoints" && git push</code>
              </div>
            ) : null}
          </div>
          <button onClick={reset}
            style={{ background:ORANGE, color:'#fff', border:'none', borderRadius:10, padding:'11px 24px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}