import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { QuizBoard } from './DailyQuiz';
import { useTheme, Panel, Empty, GREEN, RED, AMBER, BLUE, ORANGE } from './qaUi';

// Friendly monthly leaderboard for agents: your own rank, a perfect-score club, and the next ten places.
const VIOLET = '#8b5cf6';
const monthName = m => { try { return new Date(`${m}-01T00:00:00`).toLocaleString('en-GB', { month: 'long', year: 'numeric' }); } catch { return m; } };
const pc = v => `${(v * 100).toFixed(1)}%`;
const POD = ['#f5b301', '#94a3b8', '#d28b4b'];

function Move({ n }) {
  if (n == null) return <span style={{ fontSize: 11, fontWeight: 800, color: VIOLET }}>new</span>;
  if (n === 0) return <span style={{ fontSize: 12, color: '#94a3b8' }}>–</span>;
  return <span style={{ fontSize: 12, fontWeight: 800, color: n > 0 ? GREEN : RED }}>{n > 0 ? '▲' : '▼'} {Math.abs(n)}</span>;
}

function Award({ th, emoji, title, who, sub, color, me }) {
  return (
    <div style={{ background: th.card, border: `1px solid ${color}55`, borderRadius: 16, padding: '14px 16px', boxShadow: `0 6px 20px ${color}1f`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -18, insetInlineEnd: -18, width: 70, height: 70, borderRadius: '50%', background: `${color}22` }} />
      <div style={{ fontSize: 24 }}>{emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color, marginTop: 4 }}>{title}</div>
      <div style={{ fontSize: 15, fontWeight: 900, color: th.text, marginTop: 2 }}>{who}{me ? ' (you!)' : ''}</div>
      <div style={{ fontSize: 12, color: th.sub, marginTop: 1 }}>{sub}</div>
    </div>
  );
}

export default function Leaderboard({ darkMode }) {
  const th = useTheme(darkMode);
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [month, setMonth] = useState('');
  const [scope, setScope] = useState('all');
  const [qb, setQb] = useState(null);
  useEffect(() => { api.get('/quiz/leaderboard').then(r => setQb(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    let live = true;
    api.get('/qa/leaderboard', { params: { month: month || undefined, scope } })
      .then(r => { if (live) { setD(r.data); setErr(''); } })
      .catch(e => live && setErr(e.response?.data?.error || 'Could not load the leaderboard.'));
    return () => { live = false; };
  }, [month, scope]);

  if (err) return <Empty th={th}>{err}</Empty>;
  if (!d) return <Empty th={th}>Loading…</Empty>;
  if (!d.month) {
    return (
      <div style={{ maxWidth: 640, margin: '30px auto', textAlign: 'center', background: th.card, border: `1px solid ${th.border}`, borderRadius: 20, padding: '36px 24px' }}>
        <div style={{ fontSize: 48 }}>🏆</div>
        <h2 style={{ margin: '8px 0 6px', color: th.text }}>The leaderboard opens soon</h2>
        <div style={{ fontSize: 14, color: th.sub, lineHeight: 1.7 }}>It starts as soon as the first QA evaluations are in.</div>
      </div>
    );
  }

  const me = d.me && !d.me.unranked ? d.me : null;
  const club = d.club || [];
  const hero = me
    ? me.perfect
      ? { a: '#f5b301', b: '#f97316', emoji: '👑', title: `You are in the perfect club!`, text: `Every one of your ${me.evals} evaluated calls scored full marks this month. Keep the streak alive.` }
      : me.rank <= 3
        ? { a: '#10b981', b: '#0ea5e9', emoji: '🥇', title: `You are #${me.rank} this month!`, text: 'You are right at the top. One more perfect call and you could join the club.' }
        : { a: '#8b5cf6', b: '#ec4899', emoji: '🔥', title: `You are #${me.rank} of ${d.total}`, text: me.gap > 0 ? `You are ${(me.gap * 100).toFixed(1)} points behind the next place. Fix one mistake and you climb.` : 'Keep going, every full score moves you up.' }
    : d.me && d.me.unranked
      ? { a: '#38bdf8', b: '#8b5cf6', emoji: '🎯', title: 'Almost on the board!', text: d.me.need ? `You need ${d.me.need} more evaluated call${d.me.need === 1 ? '' : 's'} this month to get a rank (${d.min} are needed).` : 'Your rank will appear as soon as the next evaluations are in.' }
      : { a: '#f97316', b: '#ec4899', emoji: '🏆', title: `${monthName(d.month)} leaderboard`, text: 'Agents with at least ' + d.min + ' evaluated calls are ranked by their average score.' };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {d.queue && (
          <div role="group" aria-label="Who to compare with" style={{ display: 'flex', background: th.input, border: `1px solid ${th.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {[['all', 'Everyone'], ['queue', `${d.queue} team`]].map(([k, l]) => (
              <button key={k} onClick={() => setScope(k)} aria-pressed={scope === k}
                style={{ border: 'none', padding: '8px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: scope === k ? ORANGE : 'transparent', color: scope === k ? '#fff' : th.text }}>{l}</button>
            ))}
          </div>
        )}
        <select value={d.month} onChange={e => setMonth(e.target.value)} aria-label="Month"
          style={{ background: th.input, color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontSize: 13 }}>
          {[...d.months].reverse().map(x => <option key={x} value={x}>{monthName(x)}</option>)}
        </select>
      </div>

      <div style={{ background: `linear-gradient(120deg, ${hero.a}, ${hero.b})`, borderRadius: 22, padding: '22px 24px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', color: '#fff', boxShadow: `0 12px 34px ${hero.a}55`, marginBottom: 16 }}>
        <div style={{ fontSize: 56, lineHeight: 1 }}>{hero.emoji}</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 26, fontWeight: 900 }}>{hero.title}</div>
          <div style={{ fontSize: 14, opacity: 0.95, marginTop: 4, lineHeight: 1.6 }}>{hero.text}</div>
          {me && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 800 }}>📊 {pc(me.avg)} average</span>
              <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 800 }}>📞 {me.evals} calls</span>
              {me.full > 0 && <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 800 }}>💯 {me.full} full score{me.full === 1 ? '' : 's'}</span>}
              {me.move != null && me.move !== 0 && <span style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 12px', fontSize: 12.5, fontWeight: 800 }}>{me.move > 0 ? '▲' : '▼'} {Math.abs(me.move)} place{Math.abs(me.move) === 1 ? '' : 's'} vs last month</span>}
            </div>
          )}
        </div>
      </div>

      {(d.perfect || d.improved || club.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 16 }}>
          {club.length > 0 && <Award th={th} emoji="👑" title="Perfect club" who={`${club.length} agent${club.length === 1 ? '' : 's'}`} sub="Full marks on every call" color="#f5b301" />}
          {d.perfect && <Award th={th} emoji="💯" title="Most full scores" who={d.perfect.name} sub={`${d.perfect.count} perfect calls`} color={GREEN} me={d.perfect.me} />}
          {d.improved && <Award th={th} emoji="🚀" title="Most improved" who={d.improved.name} sub={`+${(d.improved.delta * 100).toFixed(1)} points vs last month`} color={BLUE} me={d.improved.me} />}
        </div>
      )}

      {club.length > 0 && (
        <Panel th={th} title="👑 The perfect club" hint={`Every evaluated call scored 33 out of 33 in ${monthName(d.month)}.`} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {club.map(c => (
              <span key={c.name} style={{ background: c.me ? 'linear-gradient(120deg,#f5b301,#f97316)' : '#f5b30120', color: c.me ? '#fff' : th.text, border: `1px solid ${c.me ? 'transparent' : '#f5b30166'}`, borderRadius: 999, padding: '6px 12px', fontSize: 13, fontWeight: c.me ? 900 : 700 }}>
                {c.me ? '⭐ ' : ''}{c.name}
              </span>
            ))}
          </div>
        </Panel>
      )}

      <Panel th={th} title={club.length ? '🏅 Next in line' : '🏅 Top 10'} hint={club.length ? 'The best averages just below the perfect club.' : `Ranked by average score. At least ${d.min} evaluated calls to qualify.`}>
        {d.top.length === 0 ? <Empty th={th}>No one else is ranked yet.</Empty> : (
          <div style={{ display: 'grid', gap: 8 }}>
            {d.top.map(a => {
              const medal = !club.length && a.rank <= 3 ? POD[a.rank - 1] : null;
              const c = a.me ? ORANGE : (medal || VIOLET);
              return (
                <div key={a.rank + a.name} style={{ display: 'flex', alignItems: 'center', gap: 12, background: a.me ? `${ORANGE}18` : th.card, border: `1px solid ${a.me ? ORANGE : th.border}`, borderRadius: 14, padding: '10px 14px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${c}26`, color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, flex: 'none' }}>
                    {medal ? ['🥇', '🥈', '🥉'][a.rank - 1] : `#${a.rank}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: th.text, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}{a.me ? ' (you)' : ''}</div>
                    <div style={{ height: 6, borderRadius: 3, background: th.grid || 'rgba(148,163,184,.25)', marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round(a.avg * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${c}, ${a.me ? AMBER : BLUE})` }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flex: 'none' }}>
                    <div style={{ fontWeight: 900, color: c, fontSize: 15 }}>{pc(a.avg)}</div>
                    <div style={{ fontSize: 11.5, color: th.sub }}>{a.evals} calls{a.full ? ` · ${a.full} 💯` : ''}</div>
                  </div>
                  <div style={{ width: 44, textAlign: 'center', flex: 'none' }}><Move n={a.move} /></div>
                </div>
              );
            })}
          </div>
        )}
        {me && !me.inTop && (
          <div style={{ marginTop: 12, background: `${ORANGE}18`, border: `1px solid ${ORANGE}`, borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontWeight: 900, color: ORANGE, fontSize: 15 }}>#{me.rank}</div>
            <div style={{ flex: 1, fontWeight: 800, color: th.text, fontSize: 14 }}>{me.name} (you)</div>
            <div style={{ fontWeight: 900, color: ORANGE }}>{pc(me.avg)}</div>
            <div style={{ width: 44, textAlign: 'center' }}><Move n={me.move} /></div>
          </div>
        )}
      </Panel>
      {qb && <div style={{ marginTop: 16 }}><QuizBoard th={th} board={qb} /></div>}
      <div style={{ fontSize: 12, color: th.sub, marginTop: 10, textAlign: 'center' }}>Average of the final score on each evaluated call. Only agents with {d.min}+ calls are ranked.</div>
    </div>
  );
}
