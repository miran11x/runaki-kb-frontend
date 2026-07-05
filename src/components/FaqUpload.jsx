import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const NAVY  = '#0B1120';
const ORANGE = '#FF6B35';
const API   = process.env.REACT_APP_API_URL || 'https://runaki-kb-api.vercel.app';

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
    if (res.status === 413) {
      throw new Error('Payload too large. The batch size has been reduced automatically — please try again.');
    }
    throw new Error(`Server error (${res.status}). Please try again or contact support.`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function FAQsUpload({ token, darkMode }) {
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

    const wb = XLSX.read(
      ev.target.result,
      { type: 'binary' }
    );

    let allRows = [];

    wb.SheetNames.forEach(sheetName => {

      const ws = wb.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(ws, {
        defval: ''
      });

      allRows = allRows.concat(rows);

    });

    if (!allRows.length) {
      setErrorMsg('No FAQ rows found.');
      setStatus('error');
      return;
    }

    setParsed(allRows);
    setStatus('ready');

  } catch (err) {
    setErrorMsg(err.message);
    setStatus('error');
  }
};    reader.onerror = () => { setErrorMsg('Could not read file.'); setStatus('error'); };
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

    const BATCH_SIZE = 100;

    let totalInserted = 0;

    for (let i = 0; i < parsed.length; i += BATCH_SIZE) {

      const chunk = parsed.slice(i, i + BATCH_SIZE);

      const data = await safeFetch(
        `${API}/api/faqs/import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rows: chunk
          })
        }
      );

      totalInserted += data.imported || 0;
    }

    setResult({
      inserted: totalInserted
    });

    setStatus('done');

    toast.success(
      `${totalInserted} FAQs uploaded successfully`
    );

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
  total: parsed.length,
  categories: [
    ...new Set(
      parsed
        .map(x => x.category)
        .filter(Boolean)
    )
  ].length
} : null;

  return (
    <div style={{ padding:'24px 28px', color:text }}>
      <h3 style={{ margin:'0 0 6px', color:DM?'#f1f5f9':NAVY, fontSize:18, fontWeight:700 }}>
        📤 Upload FAQs
      </h3>
      <p style={{ margin:'0 0 24px', fontSize:13, color:sub, lineHeight:1.65 }}>
  Upload FAQ Excel files directly into the Knowledge Base.
  All sheets are read automatically and imported into the database.
  FAQs become available immediately after upload.
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
  <div>
    📚 Categories:
    <strong style={{ color:text }}>
      {summary.categories}
    </strong>
  </div>

  <div>
    📝 FAQ Rows:
    <strong style={{ color:text }}>
      {summary.total}
    </strong>
  </div>
</div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <button onClick={handleUpload}
              style={{ background:ORANGE, color:'#fff', border:'none', borderRadius:10, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Upload {summary.total} FAQs
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
  {result.inserted} FAQ
  {result.inserted !== 1 ? 's' : ''}
  {' '}processed successfully.
</div>          </div>
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