import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const NAVY  = '#0B1120';
const ORANGE = '#FF6B35';
const API   = process.env.REACT_APP_API_URL || 'https://runaki-kb-api.vercel.app';

// Maps exact Excel column headers → DB field names
const COL_MAP = {
  'Agent Name':                              'agent_name',
  'Coordinator':                             'coordinator',
  'QA':                                      'qa_officer',
  'Subject':                                 'subject',
  'Phone Number':                            'phone_number',
  'Ticket ID':                               'ticket_id',
  'Waiting time':                            'waiting_time',
  'Call Duration':                           'call_duration',
  'Greeting Script':                         'greeting_script',
  'Ask about customer name and informatios': 'customer_info',
  'FAQ Alignment':                           'faq_alignment',
  'Correcting tagging Topic':                'correct_tagging',
  'Communication/Problem solving':           'communication',
  'Tone of Voice':                           'tone_of_voice',
  'Ending':                                  'ending',
  'Rude Behaviour':                          'rude_behaviour',
  'Hang Up':                                 'hang_up',
  'Active Listening':                        'active_listening',
  'Improvment areas':                        'improvement_areas',
  'Overall Score':                           'overall_score',
  'Possitive comments':                      'positive_comments',
  'Bad comments':                            'bad_comments',
  'Feedback':                                'feedback',
  'Hold - UnHold':                           'hold_unhold',
  'QA/Trainer Coaching Status':              'coaching_status',
  'Evaluation Date':                         'evaluation_date',
  'Email Address':                           'agent_email',
};

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val)) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    // Try parsing various date formats
    const cleaned = val.trim();
    if (!cleaned) return null;
    const dt = new Date(cleaned);
    if (!isNaN(dt)) return dt.toISOString().split('T')[0];
  }
  return null;
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
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

        const rows = raw
          .map(row => {
            const mapped = {};
            Object.entries(row).forEach(([col, val]) => {
              const dbKey = COL_MAP[col.trim()];
              if (!dbKey) return;
              if (dbKey === 'evaluation_date') {
                mapped[dbKey] = parseDate(val);
              } else if (['greeting_script','customer_info','faq_alignment','correct_tagging','communication','tone_of_voice','ending','rude_behaviour','hang_up','active_listening'].includes(dbKey)) {
                // Criteria: ensure 0 or 1
                const n = parseInt(val);
                mapped[dbKey] = isNaN(n) ? 0 : (n === 1 ? 1 : 0);
              } else if (dbKey === 'overall_score') {
                const n = parseFloat(val);
                mapped[dbKey] = isNaN(n) ? null : n;
              } else {
                mapped[dbKey] = String(val).trim() || null;
              }
            });
            return mapped;
          })
          .filter(r => (r.agent_name || r.agent_email)); // skip blank rows

        if (!rows.length) {
          setErrorMsg('No valid rows found. Make sure the column headers exactly match the evaluation sheet.');
          setStatus('error');
          return;
        }

        setParsed(rows);
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
        const delRes = await fetch(`${API}/api/evaluations/all`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!delRes.ok) throw new Error('Failed to clear existing evaluations.');
      }

      const res  = await fetch(`${API}/api/evaluations/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setResult(data);
      setStatus('done');
      toast.success(`${data.inserted} evaluations uploaded successfully`);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle'); setParsed(null); setResult(null); setErrorMsg('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // Summary info for ready state
  const summary = parsed ? {
    agents: [...new Set(parsed.map(r => r.agent_name).filter(Boolean))].length,
    qas:    [...new Set(parsed.map(r => r.qa_officer).filter(Boolean))],
    scored: parsed.filter(r => r.overall_score !== null).length,
  } : null;

  return (
    <div style={{ padding:'24px 28px', color:text }}>
      <h3 style={{ margin:'0 0 6px', color:DM?'#f1f5f9':NAVY, fontSize:18, fontWeight:700 }}>📤 Upload Evaluations</h3>
      <p style={{ margin:'0 0 24px', fontSize:13, color:sub, lineHeight:1.65 }}>
        Upload your daily evaluations Excel sheet (.xlsx or .xls). New records are inserted automatically.
        Existing records with updated coaching status or scores will be updated. No duplicates will be created.
        Agents will see only their own evaluations under <strong>My Evaluations</strong> in the sidebar.
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
            borderRadius: 16,
            padding: '52px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(255,107,53,0.05)' : faint,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize:48, marginBottom:14 }}>📂</div>
          <div style={{ fontSize:16, fontWeight:700, color:DM?'#f1f5f9':NAVY, marginBottom:6 }}>
            Drop your Excel file here
          </div>
          <div style={{ fontSize:13, color:sub }}>or click to browse — .xlsx or .xls only</div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display:'none' }}
            onChange={e => processFile(e.target.files[0])}
          />
        </div>
      )}

      {/* ── Parsing ── */}
      {status === 'parsing' && (
        <div style={{ padding:40, textAlign:'center', color:sub }}>Reading Excel file...</div>
      )}

      {/* ── Ready to upload ── */}
      {status === 'ready' && parsed && summary && (
        <div>
          <div style={{ background:card, border:`1px solid ${border}`, borderRadius:12, padding:'18px 22px', marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#22c55e', marginBottom:8 }}>
              ✅ {parsed.length} rows ready to upload
            </div>
            <div style={{ fontSize:13, color:sub, lineHeight:1.8 }}>
              <div>Agents found: <strong style={{ color:text }}>{summary.agents}</strong></div>
              <div>Rows with scores: <strong style={{ color:text }}>{summary.scored}</strong></div>
              <div>QA Officers: <strong style={{ color:text }}>{summary.qas.join(', ') || '—'}</strong></div>
            </div>
          </div>

          <label style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:text, marginBottom:22, cursor:'pointer', lineHeight:1.5 }}>
            <input
              type="checkbox"
              checked={clearFirst}
              onChange={e => setClearFirst(e.target.checked)}
              style={{ marginTop:2, width:16, height:16, accentColor:ORANGE, flexShrink:0 }}
            />
            <span>
              <strong>Clear all existing evaluations before uploading</strong><br/>
              <span style={{ color:sub }}>Use this only for a full re-upload. For daily updates, leave this unchecked — the system will add new records and update changed ones automatically.</span>
            </span>
          </label>

          <div style={{ display:'flex', gap:12 }}>
            <button
              onClick={handleUpload}
              style={{ background:ORANGE, color:'#fff', border:'none', borderRadius:10, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
            >
              Upload {parsed.length} Evaluations
            </button>
            <button
              onClick={reset}
              style={{ background:'transparent', color:sub, border:`1px solid ${border}`, borderRadius:10, padding:'12px 20px', fontSize:14, cursor:'pointer', fontFamily:'inherit' }}
            >
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
              {result.inserted} evaluation{result.inserted!==1?'s':''} processed successfully.
              New records have been inserted and any existing records with changes have been updated.
            </div>
          </div>
          <button
            onClick={reset}
            style={{ background:ORANGE, color:'#fff', border:'none', borderRadius:10, padding:'11px 24px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
          >
            Upload Another File
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && (
        <div>
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'20px 24px', marginBottom:20 }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#ef4444', marginBottom:4 }}>❌ Error</div>
            <div style={{ fontSize:13, color:text }}>{errorMsg}</div>
          </div>
          <button
            onClick={reset}
            style={{ background:ORANGE, color:'#fff', border:'none', borderRadius:10, padding:'11px 24px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}