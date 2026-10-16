import api from './api';

// Fire-and-forget usage tracking (page visits, link clicks, file opens, navigation searches).
// Never blocks or breaks the page: any failure is ignored.
export function track(kind, item, results) {
  try { api.post('/usage', { kind, item, results }).catch(() => {}); } catch { /* ignore */ }
}
