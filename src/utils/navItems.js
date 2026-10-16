// Everything an agent can jump to from the "Go to" box. This is for finding PAGES and sections, not FAQ answers.
// `words` are extra names people use for the same thing (English, plus a few Arabic and Sorani words).
export const NAV_ITEMS = [
  { key: 'inquiries', icon: '📂', label: 'Inquiries', group: 'FAQ categories', words: 'inquiry questions faq' },
  { key: 'billing', icon: '💳', label: 'Billing Complaints', group: 'FAQ categories', words: 'bill billing invoice payment complaint فاتورة' },
  { key: 'general', icon: '📣', label: 'General Complaints', group: 'FAQ categories', words: 'complaint general' },
  { key: 'service', icon: '🛠️', label: 'Service Requests', group: 'FAQ categories', words: 'service request installation' },
  { key: 'feedback', icon: '💬', label: 'Feedback & Others', group: 'FAQ categories', words: 'others other misc' },
  { key: '_shortlisted', icon: '📌', label: "Shortlisted FAQ's", group: 'Quick access', words: 'shortlist most asked top common important' },
  { key: '_bookmarks', icon: '🔖', label: 'Bookmarks', group: 'Quick access', words: 'saved favourites favorites starred' },
  { key: '_channel', icon: '💬', label: 'Updates Chat', group: 'Quick access', words: 'updates news messages announcements chat new' },
  { key: '_ai-kb', icon: '🤖', label: 'RUNAKI AI', group: 'Quick access', words: 'assistant ai ask robot knowledge' },
  { key: '_callflows', icon: '📞', label: 'Call Flows', group: 'Operations', words: 'flow flows steps process call' },
  { key: '_scripts', icon: '📋', label: 'Scripts & Processes', group: 'Operations', words: 'script scripts greeting opening closing' },
  { key: '_priority', icon: '🚦', label: 'Case Priorities', group: 'Operations', words: 'priority priorities urgent sla' },
  { key: '_holdunhold', icon: '⏸️', label: 'Hold & Unhold Process', group: 'Operations', words: 'hold unhold suspend resume' },
  { key: '_traccess', icon: '🗓️', label: 'TR Access Scheduling', group: 'Operations', words: 'tr access schedule scheduling' },
  { key: '_kyc', icon: '🪪', label: 'KYC Platform Outputs', group: 'Tools', words: 'kyc verify verification identity customer platform' },
  { key: '_tickets', icon: '🎫', label: 'Ticket Descriptions', group: 'Tools', words: 'ticket tickets description crm' },
  { key: '_zones', icon: '🗺️', label: 'Zone Lookup', group: 'Tools', words: 'zone zones area district location region neighborhood منطقة مناطق زون ناوچە' },
  { key: '_contactreasons', icon: '🌳', label: 'Contact Reasons', group: 'Tools', words: 'contact reason reasons tree tag topic' },
  { key: '_sms', icon: '✉️', label: 'SMS Templates', group: 'Tools', words: 'sms text message templates' },
  { key: '_extlinks', icon: '🔗', label: 'External Links', group: 'Tools', words: 'links crm system open website external' },
  { key: '_evaluations', icon: '⭐', label: 'My Evaluations', group: 'Personal', words: 'evaluation evaluations score scores qa feedback calls marks result review تقييم تقييمات هەڵسەنگاندن' },
  { key: '_leaderboard', icon: '🏆', label: 'Leaderboard', group: 'Personal', words: 'ranking rank top best winners' },
  { key: '_quiz', icon: '🧠', label: 'Daily Quiz', group: 'Personal', words: 'quiz test questions game daily' },
  { key: '_mystats', icon: '📊', label: 'My Stats', group: 'Personal', words: 'stats statistics progress numbers' },
  { key: '_sendfeedback', icon: '📝', label: 'Send Feedback', group: 'Personal', words: 'suggestion report problem idea send feedback' },
];
export const STAFF_NAV = [
  { key: '_admin', icon: '⚙️', label: 'Admin Panel', group: 'Admin', words: 'admin panel settings users accounts engagement' },
  { key: '_faqeditor', icon: '✏️', label: 'FAQ Editor', group: 'Admin', words: 'faq editor edit answers' },
];

const clean = s => String(s || '').toLowerCase().replace(/['’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const tokens = s => clean(s).split(' ').filter(Boolean);
const stem = t => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t);

function dist(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

function tokenScore(q, t) {
  if (q === t) return 3;
  if (stem(q) === stem(t)) return 2.8;
  if (t.startsWith(q)) return 2.4;
  if (q.length >= 3 && t.includes(q)) return 1.5;
  if (q.length >= 4) { const d = dist(q, t, q.length >= 7 ? 2 : 1); if (d <= (q.length >= 7 ? 2 : 1)) return 1.2; }
  return 0;
}

// items: [{key, label, icon, group, words}] -> best matches for the typed text (all typed words must match something)
export function searchNav(items, query, limit = 7) {
  const q = tokens(query);
  if (!q.length) return [];
  const out = [];
  for (const it of items) {
    const labelT = tokens(it.label), wordT = tokens(it.words || '');
    let total = 0, ok = true;
    for (const w of q) {
      let best = 0;
      for (const t of labelT) { const sc = tokenScore(w, t); if (sc) best = Math.max(best, sc + 0.6); }
      for (const t of wordT) best = Math.max(best, tokenScore(w, t));
      if (!best) { ok = false; break; }
      total += best;
    }
    if (ok) out.push({ it, score: total });
  }
  return out.sort((a, b) => b.score - a.score || a.it.label.localeCompare(b.it.label)).slice(0, limit).map(x => x.it);
}
