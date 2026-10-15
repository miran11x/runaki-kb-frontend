import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import { useTheme, Kpi, Panel, Empty, gridStyle, scoreColor, RED } from './qaUi';
import { EvalList, AttributeBars } from './QaScorecard';
import { pct, mean, fmtPct, resultOf } from '../utils/qaStats';

// The agent's own evaluations: everything the QA team recorded about their calls.
const monthName = m => { try { return new Date(`${m}-01T00:00:00`).toLocaleString('en-GB', { month: 'long', year: 'numeric' }); } catch { return m; } };

export default function MyQaEvaluations({ darkMode }) {
  const th = useTheme(darkMode);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [month, setMonth] = useState('');

  useEffect(() => {
    api.get('/qa/mine').then(r => setData(r.data)).catch(e => setErr(e.response?.data?.error || 'Could not load your evaluations.'));
  }, []);

  const months = useMemo(() => (data ? [...new Set(data.rows.map(r => r.d.slice(0, 7)))].sort().reverse() : []), [data]);
  const rows = useMemo(() => (data ? data.rows.filter(r => !month || r.d.slice(0, 7) === month) : []), [data, month]);

  if (err) return <Empty th={th}>{err}</Empty>;
  if (!data) return <Empty th={th}>Loading…</Empty>;
  if (!data.rows.length) {
    return (
      <Panel th={th} title="My Evaluations" hint="No evaluations have been recorded for you yet. When the QA team evaluates your calls, they will appear here with your scores, comments and coaching.">
        <div style={{ fontSize: 13, color: th.sub }}>If you expected to see evaluations, ask your coordinator to check your Wave ID in your profile.</div>
      </Panel>
    );
  }

  const avg = mean(rows.map(pct));
  const zero = rows.filter(r => resultOf(r) === 'Zero').length;
  const full = rows.filter(r => resultOf(r) === 'Full').length;
  const pending = rows.filter(r => r.fn && !/deliver/i.test(r.cs || '')).length;

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: th.text }}>My Evaluations</h2>
        <select value={month} onChange={e => setMonth(e.target.value)} aria-label="Month"
          style={{ background: th.input, color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: '8px 12px', fontFamily: 'inherit', fontSize: 13 }}>
          <option value="">All months</option>
          {months.map(m => <option key={m} value={m}>{monthName(m)}</option>)}
        </select>
      </div>

      <div style={gridStyle(140)}>
        <Kpi th={th} label="Average score" value={fmtPct(avg)} color={scoreColor(avg)} />
        <Kpi th={th} label="Evaluated calls" value={rows.length} />
        <Kpi th={th} label="Full scores" value={full} sub="33 out of 33" />
        <Kpi th={th} label="Zero scores" value={zero} color={zero ? RED : th.text} />
        <Kpi th={th} label="Feedback waiting" value={pending} sub="not delivered yet" />
      </div>

      <Panel th={th} title="Where points were lost" hint="How many of your evaluations had a mistake in each part of the call." style={{ marginBottom: 14 }}>
        <AttributeBars th={th} rows={rows} />
      </Panel>

      <h3 style={{ margin: '0 0 8px', fontSize: 14, color: th.text }}>Your evaluations</h3>
      <EvalList th={th} rows={rows} rubric={data.rubric} />
    </div>
  );
}
