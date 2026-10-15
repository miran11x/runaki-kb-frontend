import api from './api';

// Records what agents search for (never blocks or breaks the search).
// The Admin Panel dashboard uses it to show searches that found nothing.
const recent = new Map();

export function logSearch(query, results, source) {
  const q = String(query || '').trim();
  if (q.length < 2) return;
  const key = `${source}:${q.toLowerCase()}`;
  const now = Date.now();
  if (recent.has(key) && now - recent.get(key) < 30000) return;
  recent.set(key, now);
  api.post('/search-log', { query: q, results, source }).catch(() => {});
}
