import * as XLSX from 'xlsx';
import defaultRubric from './qaRubricDefault.json';

// Reads the monthly "Runaki QA Evaluation" workbook: the Raw Data tab (the evaluations) and the
// QA Scoring Rubric tab (points + definitions for every failure reason).

export const ATTRS = [
  'Greeting Script', 'Customer ID & Info', 'Active Listening', 'FAQ Alignment', 'Communication', 'Problem Solving',
  'Tag / Topic', 'Tone of Voice', 'Ending', 'Rude Behaviour', 'Hang Up',
];
// the rubric tab names two of the attributes a little differently
const RUBRIC_NAME = { 'Greeting Script': 'Greeting' };
export const MAX_SCORE = 33;

const txt = v => (v == null ? '' : String(v).replace(/\r\n?/g, '\n').trim());
const key = s => txt(s).toLowerCase().replace(/\s+/g, ' ');

const serialToIso = n => new Date(Math.round((n - 25569) * 86400000)).toISOString().slice(0, 19);
// the CSV has no seconds, so they are dropped everywhere: both file types then give identical rows
const toMinute = iso => `${iso.slice(0, 16)}:00`;
const pad = n => String(n).padStart(2, '0');

function toDateTime(v) {
  if (typeof v === 'number' && v > 1) return toMinute(serialToIso(v));
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v);
    if (!isNaN(d)) return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  }
  return null;
}
function toDate(v) {
  if (typeof v === 'number' && v > 1) return serialToIso(v).slice(0, 10);
  const s = txt(v);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);            // M/D/YYYY as written in the sheet
  if (m) {
    let mo = +m[1], da = +m[2];
    if (mo > 12 && da <= 12) [mo, da] = [da, mo];           // typed day-first (13/10/2026)
    if (mo < 1 || mo > 12 || da < 1 || da > 31) return null;
    return `${m[3]}-${pad(mo)}-${pad(da)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}
function toSeconds(v) {
  if (typeof v === 'number') return v < 1 ? Math.round(v * 86400) : Math.round(v);
  const m = txt(v).match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (m) return m[3] != null ? +m[1] * 3600 + +m[2] * 60 + +m[3] : +m[1] * 60 + +m[2];
  return null;
}

// small, stable fingerprint so the upload can tell which evaluations really changed
function fingerprint(obj) {
  const s = JSON.stringify(obj);
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0') + s.length.toString(16);
}

function sheetRows(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) return null;
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
}

export function parseRubric(wb) {
  const rows = sheetRows(wb, 'QA Scoring Rubric');
  if (!rows) return [];
  const out = [];
  rows.slice(1).forEach((r, i) => {
    if (!txt(r[0]) || !txt(r[2])) return;
    out.push({
      attribute: txt(r[0]), attr_definition: txt(r[1]), reason: txt(r[2]),
      points: Number.isFinite(+r[3]) ? +r[3] : 0, definition: txt(r[4]), pass_example: txt(r[5]), sort: i,
    });
  });
  return out;
}

// The 'Unique ID' tab is the agent roster: Name, Gender, Queue, Status, Wave ID, Email Address, Team Coordinator, ... QA
export function parseRoster(wb) {
  const raw = sheetRows(wb, 'Unique ID');
  if (!raw) return [];
  const hi = raw.findIndex(r => r && txt(r[0]) === 'Name' && r.some(c => txt(c) === 'Wave ID'));
  if (hi < 0) return [];
  const head = raw[hi];
  const c = n => head.findIndex(h => txt(h) === n);
  const ix = { name: c('Name'), queue: c('Queue'), status: c('Status'), wave: c('Wave ID'), email: c('Email Address') };
  const seen = new Set();
  const out = [];
  for (let i = hi + 1; i < raw.length; i++) {
    const r = raw[i];
    const name = txt(r[ix.name]), wave = txt(r[ix.wave]);
    if (!name || !wave || seen.has(wave)) continue;
    seen.add(wave);
    out.push({ name, wave_id: wave, queue: txt(r[ix.queue]), status: txt(r[ix.status]) || 'Active', email: txt(r[ix.email]).toLowerCase() });
  }
  return out;
}

const WIN1252 = '\u20ac\u0081\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u008d\u017d\u008f\u0090\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u009d\u017e\u0178';
function decodeWin1252(buffer) {
  const b = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < b.length; i += 8192) {
    out += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + 8192), c => (c >= 0x80 && c <= 0x9f ? WIN1252.charCodeAt(c - 0x80) : c)));
  }
  return out;
}

// The Raw Data tab saved on its own as a CSV (Windows files are often not UTF-8, so decode carefully).
export function parseCsv(buffer) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); } catch { text = decodeWin1252(buffer); }
  const w = XLSX.read(text, { type: 'string', raw: true });
  return parseWorkbook(null, { 'Raw Data': w.Sheets[w.SheetNames[0]] });
}

export function parseWorkbook(buffer, sheets) {
  const wb = sheets ? { Sheets: sheets } : XLSX.read(buffer, { type: 'array', sheets: ['Raw Data', 'QA Scoring Rubric', 'Unique ID'] });
  const raw = sheetRows(wb, 'Raw Data');
  if (!raw) throw new Error("This workbook has no 'Raw Data' tab.");
  const hi = raw.findIndex(r => r && r.some(c => txt(c) === 'Agent Name') && r.some(c => txt(c) === 'QA Officer'));
  if (hi < 0) throw new Error("Could not find the header row (Agent Name, QA Officer…) in the Raw Data tab.");
  const head = raw[hi];
  const col = {};
  head.forEach((h, i) => { const k = txt(h); if (k && !(k in col)) col[k] = i; });   // first match only: later columns are helper formulas
  const need = ['Agent Name', 'QA Officer', 'Evaluation Date', 'Final Score', ...ATTRS];
  const missing = need.filter(n => !(n in col));
  if (missing.length) throw new Error(`Columns missing in Raw Data: ${missing.join(', ')}`);

  const fileRubric = parseRubric(wb);
  const rubric = fileRubric.length ? fileRubric : defaultRubric;   // a CSV has no rubric tab: use the standard one
  const pointsOf = new Map(rubric.map(r => [`${key(r.attribute)}|${key(r.reason)}`, r.points]));
  const get = (r, name) => (name in col ? r[col[name]] : null);

  const rows = [];
  const problems = { noDate: 0, unknownReason: 0, scoreMismatch: 0, noWave: 0 };
  for (let i = hi + 1; i < raw.length; i++) {
    const r = raw[i];
    if (!r || !txt(get(r, 'Agent Name')) || !txt(get(r, 'QA Officer'))) continue;
    const date = toDateTime(get(r, 'Evaluation Date'));
    if (!date) { problems.noDate++; continue; }

    const fails = [], pts = [];
    ATTRS.forEach(a => {
      const v = txt(get(r, a));
      const reasonPts = pointsOf.get(`${key(RUBRIC_NAME[a] || a)}|${key(v)}`);
      if (!v) { fails.push(null); pts.push(0); return; }
      if (key(v) === 'pass') { fails.push(null); pts.push(3); return; }
      fails.push(v);
      if (reasonPts == null) problems.unknownReason++;
      pts.push(reasonPts == null ? 0 : reasonPts);
    });
    const crit = txt(get(r, 'Critical Failure'));
    const rawScore = Number.isFinite(+get(r, 'Raw Score /33')) && get(r, 'Raw Score /33') !== null ? +get(r, 'Raw Score /33') : pts.reduce((a, b) => a + b, 0);
    const finalScore = Number.isFinite(+get(r, 'Final Score')) && get(r, 'Final Score') !== null ? +get(r, 'Final Score') : (crit && key(crit) !== 'none' ? 0 : rawScore);
    if (pts.reduce((a, b) => a + b, 0) !== rawScore) problems.scoreMismatch++;
    const wave = txt(get(r, 'Wave ID'));
    if (!wave) problems.noWave++;
    const coachDate = get(r, 'Coaching Date');
    const cs = txt(get(r, 'Coaching Status'));

    const row = {
      eval_id: txt(get(r, 'Evaluation ID')) || null,
      agent_name: txt(get(r, 'Agent Name')),
      agent_email: txt(get(r, 'Agent Email')).toLowerCase() || null,
      wave_id: wave || null,
      qa_officer: txt(get(r, 'QA Officer')),
      coordinator: txt(get(r, 'Coordinator')) || null,
      queue: txt(get(r, 'Queue')) || null,
      eval_date: date,
      call_date: toDate(get(r, 'Call Date')),
      subject: txt(get(r, 'Subject / Contact Reason')) || null,
      ticket_ref: txt(get(r, 'Ticket ID / Case Ref / Phone')) || null,
      wait_sec: toSeconds(get(r, 'Waiting Time (min)')),
      talk_sec: toSeconds(get(r, 'Call / Talk Time (min)')),
      fails, pts,
      raw_score: rawScore,
      final_score: finalScore,
      critical: crit && key(crit) !== 'none' ? crit : null,
      comments: txt(get(r, 'Systemic Findings / Comments')).slice(0, 3000) || null,
      feedback_needed: key(get(r, 'Feedback Needed')) === 'yes',
      background_noise: txt(get(r, 'Background Noise')) && key(get(r, 'Background Noise')) !== 'none' ? txt(get(r, 'Background Noise')) : null,
      coaching_status: cs && !['none', 'n/a'].includes(key(cs)) ? cs : null,
      coaching_date: typeof coachDate === 'number' && coachDate > 1 ? serialToIso(coachDate).slice(0, 10) : toDate(coachDate),
      coaching_notes: txt(get(r, 'Coaching Notes')).slice(0, 3000) || null,
      dispute_status: txt(get(r, 'Dispute Status')) || null,
      dispute_result: txt(get(r, 'Dispute Result')) || null,
      cap_raised: txt(get(r, 'CAP Raised')) || null,
    };
    // the evaluation form's own id is only unique inside one month, so the month is part of the key
    row.eval_key = `${row.eval_date.slice(0, 7)}|${row.eval_id || `${row.agent_email || row.agent_name}|${row.eval_date}|${row.ticket_ref || ''}|${row.qa_officer}`}`;
    row.row_hash = fingerprint(row);
    rows.push(row);
  }
  const months = [...new Set(rows.map(r => r.eval_date.slice(0, 7)))].sort();
  return { rows, rubric, rubricFromFile: fileRubric.length > 0, months, problems, roster: parseRoster(wb) };
}
