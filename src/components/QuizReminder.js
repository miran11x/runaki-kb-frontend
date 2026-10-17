import React, { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

// Reminder for the Daily Quiz: tells an agent who has not played today's quiz yet.
//  - useQuizDue(enabled)  : true while today's quiz is still waiting (checks on load, on focus, every 10 minutes)
//  - QuizReminder         : the banner shown on every page except the quiz itself; "Later" hides it for 2 hours
// DailyQuiz fires window event 'rk-quiz-done' after a finished quiz, so the banner and the menu dot clear at once.

export function useQuizDue(enabled) {
  const [s, setS] = useState({ due: false, streak: 0 });
  const load = useCallback(() => {
    if (!enabled) return;
    api.get('/quiz/status').then(r => setS({ due: !!r.data.due, streak: r.data.streak || 0 })).catch(() => {});
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return undefined;
    load();
    const t = setInterval(load, 10 * 60 * 1000);
    const vis = () => { if (document.visibilityState === 'visible') load(); };
    const done = () => setS(x => ({ ...x, due: false }));
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('rk-quiz-done', done);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); window.removeEventListener('rk-quiz-done', done); };
  }, [enabled, load]);
  return s;
}

const SNOOZE_KEY = 'rk_quiz_snooze';
const snoozed = () => { try { return Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now(); } catch { return false; } };

export function QuizReminder({ enabled, onOpen }) {
  const { due, streak } = useQuizDue(enabled);
  const [hidden, setHidden] = useState(snoozed());
  useEffect(() => { const t = setInterval(() => setHidden(snoozed()), 60 * 1000); return () => clearInterval(t); }, []);
  if (!enabled || !due || hidden) return null;
  const later = () => { try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + 2 * 3600 * 1000)); } catch {} setHidden(true); };
  return (
    <div role="status" style={{ marginBottom: 16, background: 'linear-gradient(120deg,#7c3aed,#a78bfa)', borderRadius: 18, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', color: '#fff', boxShadow: '0 10px 26px rgba(124,58,237,.3)' }}>
      <div style={{ fontSize: 30 }}>🧠</div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>You have not done today's quiz yet</div>
        <div style={{ fontSize: 13, opacity: 0.95, marginTop: 2, lineHeight: 1.55 }}>
          Three questions, about a minute.{streak > 0 ? ` Do it today to keep your ${streak}-day streak.` : ' Do it today to start your streak.'}
        </div>
      </div>
      <button onClick={onOpen} style={{ background: '#fff', color: '#6d28d9', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 900, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 0 rgba(0,0,0,.18)' }}>Take the quiz</button>
      <button onClick={later} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.5)', borderRadius: 12, padding: '9px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Later</button>
    </div>
  );
}
