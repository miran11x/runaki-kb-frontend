import React, { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import { useTheme, Panel, Empty, GREEN, RED, AMBER, ORANGE } from './qaUi';

// Daily 3-question quiz built from the approved FAQs. Same questions for everybody each day (Erbil time).
// 10 points per right answer, +5 for three out of three. Points feed the monthly quiz board.
const VIOLET = '#8b5cf6';
const LETTER = ['A', 'B', 'C', 'D'];
const MEDAL = ['🥇', '🥈', '🥉'];

export function QuizBoard({ th, board }) {
  if (!board) return null;
  return (
    <Panel th={th} title="🏅 Quiz board this month" hint="Points from the daily quiz. 10 for each right answer, +5 for a perfect day.">
      {!board.top.length ? <Empty th={th}>Nobody has played this month yet. Be the first on the board.</Empty> : board.top.map(r => (
        <div key={r.rank + r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: r.me ? `${ORANGE}18` : 'transparent', border: r.me ? `1px solid ${ORANGE}66` : '1px solid transparent' }}>
          <span style={{ width: 28, textAlign: 'center', fontWeight: 900, color: th.sub }}>{MEDAL[r.rank - 1] || r.rank}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: r.me ? 900 : 700, color: th.text }}>{r.name}{r.me ? ' (you)' : ''}</span>
          <span style={{ fontSize: 12, color: th.sub }}>{r.days} day{r.days > 1 ? 's' : ''}</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: VIOLET, minWidth: 54, textAlign: 'end' }}>{r.points} pts</span>
        </div>
      ))}
      {board.me && !board.top.some(r => r.me) && <div style={{ marginTop: 8, fontSize: 13, color: th.text }}>You are <b>#{board.me.rank}</b> with <b>{board.me.points} pts</b>.</div>}
    </Panel>
  );
}

export default function DailyQuiz({ darkMode, onOpenFaq }) {
  const th = useTheme(darkMode);
  const [q, setQ] = useState(null);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState([]);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/quiz/today').then(r => setQ(r.data)).catch(e => setErr(e.response?.data?.error || 'Could not load the quiz.'));
    api.get('/quiz/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  if (err) return <Empty th={th}>{err}</Empty>;
  if (!q) return <Empty th={th}>Loading…</Empty>;
  if (!q.available) return <Empty th={th}>{q.message || 'No quiz today.'}</Empty>;

  const total = q.questions.length;
  const finish = async list => {
    setBusy(true);
    try { const r = await api.post('/quiz/answer', { answers: list }); setRes(r.data); load(); }
    catch (e) { setErr(e.response?.data?.error || 'Could not send your answers.'); }
    setBusy(false);
  };
  const choose = n => {
    if (busy) return;
    const list = [...picks]; list[i] = n; setPicks(list);
  };
  const next = () => { if (i + 1 < total) setI(i + 1); else finish(picks); };

  const streak = stats ? stats.streak : q.streak;
  const head = (
    <div style={{ background: 'linear-gradient(120deg,#6d28d9,#8b5cf6 55%,#ec4899)', color: '#fff', borderRadius: 22, padding: '20px 24px', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 12px 34px #8b5cf655', marginBottom: 16 }}>
      <div style={{ fontSize: 44 }}>🧠</div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 24, fontWeight: 900 }}>Daily quiz</div>
        <div style={{ fontSize: 14, opacity: 0.95, marginTop: 3, lineHeight: 1.6 }}>Three questions from the FAQs you use every day. Two minutes, once a day.</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '6px 13px', fontSize: 13, fontWeight: 800 }}>🔥 {streak} day streak</span>
        {stats && <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '6px 13px', fontSize: 13, fontWeight: 800 }}>⭐ {stats.points} points</span>}
      </div>
    </div>
  );

  // finished today: show the result and the board
  const finished = res || (q.done ? { correct: q.done.correct, total: q.done.total, points: q.done.points, perfect: q.done.correct === q.done.total } : null);
  if (finished) {
    const review = res ? q.questions.map((x, n) => ({ ...x, picked: res.answers[n].picked, correct: res.answers[n].correct })) : null;
    return (
      <div style={{ maxWidth: 820 }}>
        {head}
        <Panel th={th} style={{ marginBottom: 16, textAlign: 'center', padding: '26px 20px' }}>
          <div style={{ fontSize: 46 }}>{finished.perfect ? '🎉' : finished.correct > 0 ? '👍' : '💪'}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: th.text, marginTop: 4 }}>{finished.correct} out of {finished.total} right</div>
          <div style={{ fontSize: 15, color: VIOLET, fontWeight: 800, marginTop: 2 }}>+{finished.points} points{finished.perfect ? ' (perfect day bonus)' : ''}</div>
          <div style={{ fontSize: 13.5, color: th.sub, marginTop: 8, lineHeight: 1.6 }}>
            {finished.perfect ? 'Flawless. See you tomorrow to keep the streak alive.' : 'Come back tomorrow for a new set. Every day you play keeps your streak going.'}
          </div>
        </Panel>
        {review && (
          <Panel th={th} title="Check your answers" style={{ marginBottom: 16 }}>
            {review.map((x, n) => {
              const ok = x.picked === x.correct;
              return (
                <div key={n} style={{ padding: '12px 0', borderTop: n ? `1px solid ${th.border}` : 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: th.text }}>{ok ? '✅' : '❌'} {x.question}</div>
                  {!ok && <div style={{ fontSize: 13, color: RED, marginTop: 4 }}>You chose: {x.options[x.picked]}</div>}
                  <div style={{ fontSize: 13, color: GREEN, marginTop: 4 }}>Right answer: {x.options[x.correct]}</div>
                  {onOpenFaq && <button onClick={() => onOpenFaq(x.question)} style={{ marginTop: 6, border: 'none', background: 'transparent', color: ORANGE, fontWeight: 800, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 12.5 }}>🔎 Read the full FAQ</button>}
                </div>
              );
            })}
          </Panel>
        )}
        <QuizBoard th={th} board={stats && stats.board} />
      </div>
    );
  }

  const cur = q.questions[i];
  const chosen = picks[i];
  return (
    <div style={{ maxWidth: 820 }}>
      {head}
      <Panel th={th} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {q.questions.map((_, n) => <div key={n} style={{ flex: 1, height: 6, borderRadius: 4, background: n < i ? GREEN : n === i ? VIOLET : th.border }} />)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: th.sub }}>Question {i + 1} of {total}{cur.category ? ` · ${cur.category}` : ''}</div>
        <div style={{ fontSize: 19, fontWeight: 900, color: th.text, margin: '6px 0 4px', lineHeight: 1.4 }}>{cur.question}</div>
        <div style={{ fontSize: 13, color: th.sub, marginBottom: 12 }}>Which answer goes with this question?</div>
        <div style={{ display: 'grid', gap: 9 }}>
          {cur.options.map((o, n) => {
            const on = chosen === n;
            return (
              <button key={n} onClick={() => choose(n)} aria-pressed={on} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'start', padding: '12px 14px', borderRadius: 14, border: `2px solid ${on ? VIOLET : th.border}`, background: on ? `${VIOLET}16` : th.soft, color: th.text, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5 }}>
                <span style={{ flex: 'none', width: 26, height: 26, borderRadius: '50%', background: on ? VIOLET : th.border, color: on ? '#fff' : th.sub, fontWeight: 900, fontSize: 12.5, display: 'grid', placeItems: 'center' }}>{LETTER[n]}</span>
                <span>{o}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={next} disabled={chosen == null || busy} style={{ border: 'none', background: chosen == null ? AMBER : VIOLET, color: '#fff', borderRadius: 12, padding: '10px 24px', fontWeight: 900, fontSize: 14, cursor: chosen == null || busy ? 'default' : 'pointer', opacity: chosen == null || busy ? 0.5 : 1, fontFamily: 'inherit' }}>
            {i + 1 < total ? 'Next question' : busy ? 'Checking…' : 'Finish'}
          </button>
        </div>
      </Panel>
      <QuizBoard th={th} board={stats && stats.board} />
    </div>
  );
}
