import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';
import QaUpload from './QaUpload';
import AgentScorecard, { EvalCard } from './QaScorecard';
import {
  useTheme, Panel, Kpi, Empty, Pill, Bar as MiniBar, gridStyle, tableStyles, useSort,
  ORANGE, GREEN, RED, AMBER, BLUE, QUEUE_COLORS, scoreColor, bandColor, trendColor, resultColor,
} from './qaUi';
import {
  ATTR_LABELS, SETTINGS, summarize, groupBy, mean, fmtPct, fmtDay, weekStart, attributeStats, reasonStats, criticalStats,
  agentTable, waveBandStats, coachingStats, coachingEffect, officerStats, coordinatorStats, dataQuality, resultOf, delivered, pct, mistakesOf, agentKey,
} from '../utils/qaStats';

// Admin Panel → Quality → Evaluation Reports (team lead only). Built from the monthly QA workbook (Raw Data tab).

const monthName = m => { try { return new Date(`${m}-01T00:00:00`).toLocaleString('en-GB', { month: 'long', year: 'numeric' }); } catch { return m; } };
const prevMonth = m => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const SECTIONS = [['performance', '📈 Performance'], ['agents', '👥 Agents'], ['coaching', '🎯 Coaching'], ['team', '🧑‍💼 QA team'], ['all', '🗂️ All evaluations'], ['upload', '📤 Upload']];

const deltaLabel = (cur, prev, invert) => {
  if (cur == null || prev == null) return null;
  const d = (cur - prev) * 100;
  if (Math.abs(d) < 0.05) return '＝ same as last month';
  const good = invert ? d < 0 : d > 0;
  return <span style={{ color: good ? GREEN : RED, fontWeight: 700 }}>{d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1)} pp vs last month</span>;
};

function exportSheet(name, rows) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name.slice(0, 30));
  XLSX.writeFile(wb, `${name}.xlsx`);
}

/* ================================================================== */
export function QaHub({ darkMode }) {
  const th = useTheme(darkMode);
  const [months, setMonths] = useState(null);
  const [month, setMonth] = useState('');
  const [section, setSection] = useState('performance');
  const [queue, setQueue] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openAgent, setOpenAgent] = useState(null);

  const loadMonths = useCallback(async () => {
    try {
      const r = await api.get('/qa/months');
      setMonths(r.data);
      setMonth(m => (m && r.data.some(x => x.month === m) ? m : (r.data[0] ? r.data[0].month : '')));
    } catch { setMonths([]); toast.error('Could not load the evaluation months'); }
  }, []);
  useEffect(() => { loadMonths(); }, [loadMonths]);

  const loadData = useCallback(async () => {
    if (!month) { setData(null); return; }
    setLoading(true);
    try {
      const r = await api.get(`/qa/data?months=${month},${prevMonth(month)}`);
      setData(r.data);
    } catch { toast.error('Could not load the evaluations'); }
    setLoading(false);
  }, [month]);
  useEffect(() => { loadData(); }, [loadData]);

  const all = useMemo(() => (data ? data.rows.filter(r => !queue || r.u === queue) : []), [data, queue]);
  const rows = useMemo(() => all.filter(r => r.d.startsWith(month)), [all, month]);
  const prev = useMemo(() => all.filter(r => r.d.startsWith(prevMonth(month))), [all, month]);
  const agents = useMemo(() => agentTable(rows), [rows]);
  const queues = useMemo(() => [...new Set((data ? data.rows : []).map(r => r.u).filter(Boolean))].sort(), [data]);

  const pillStyle = on => ({ padding: '8px 16px', borderRadius: 999, border: `1px solid ${on ? ORANGE : th.border}`, background: on ? `${ORANGE}22` : 'transparent', color: th.text, fontWeight: on ? 800 : 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' });
  const sel = { padding: '8px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' };

  if (months === null) return <div style={{ color: th.sub }}>Loading…</div>;
  const empty = !months.length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SECTIONS.map(([k, l]) => <button key={k} style={pillStyle(section === k)} onClick={() => setSection(k)}>{l}</button>)}
        </div>
        {!empty && section !== 'upload' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select style={sel} value={month} onChange={e => setMonth(e.target.value)} aria-label="Month">
              {months.map(m => <option key={m.month} value={m.month}>{monthName(m.month)} ({m.evals})</option>)}
            </select>
            <select style={sel} value={queue} onChange={e => setQueue(e.target.value)} aria-label="Queue">
              <option value="">All queues</option>
              {queues.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
        )}
      </div>

      {section === 'upload' && <QaUpload darkMode={darkMode} onDone={() => { loadMonths(); loadData(); }} />}

      {section !== 'upload' && empty && (
        <Panel th={th} title="No evaluations yet" hint="Upload the monthly QA workbook to see the reports.">
          <button onClick={() => setSection('upload')} style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Upload the workbook</button>
        </Panel>
      )}

      {section !== 'upload' && !empty && (loading && !data ? <div style={{ color: th.sub }}>Loading…</div> : data && (
        <>
          {section === 'performance' && <Performance th={th} rows={rows} prev={prev} agents={agents} month={month} />}
          {section === 'agents' && <AgentsSection th={th} agents={agents} rows={rows} onOpen={setOpenAgent} month={month} />}
          {section === 'coaching' && <CoachingSection th={th} rows={rows} onOpen={a => setOpenAgent(a)} agents={agents} month={month} />}
          {section === 'all' && <AllEvaluations th={th} rows={rows} rubric={data.rubric} month={month} />}
          {section === 'team' && <TeamSection th={th} rows={rows} agents={agents} roster={data.roster} month={month} onOpen={setOpenAgent} />}
        </>
      ))}

      {openAgent && (
        <AgentScorecard th={th} agent={agents.find(a => a.key === openAgent) || null} rubric={data ? data.rubric : []} onClose={() => setOpenAgent(null)} />
      )}
    </div>
  );
}

/* ================================================================== */
/*  ALL EVALUATIONS: every evaluation of the month, searchable            */
/* ================================================================== */
function AllEvaluations({ th, rows, rubric, month }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState({ result: '', qa: '', coord: '', coaching: '', crit: '' });
  const [page, setPage] = useState(0);
  const PAGE = 40;
  const opts = useMemo(() => ({
    qa: [...new Set(rows.map(r => r.q))].sort(),
    coord: [...new Set(rows.map(r => r.c).filter(Boolean))].sort(),
  }), [rows]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter(r => {
      if (t && !`${r.n} ${r.w} ${r.t} ${r.s} ${r.eval_id} ${r.cm || ''}`.toLowerCase().includes(t)) return false;
      if (f.result && resultOf(r) !== f.result) return false;
      if (f.qa && r.q !== f.qa) return false;
      if (f.coord && r.c !== f.coord) return false;
      if (f.crit && !r.cr) return false;
      if (f.coaching === 'open' && !(r.fn && !delivered(r))) return false;
      if (f.coaching === 'done' && !delivered(r)) return false;
      return true;
    }).sort((a, b) => (a.d < b.d ? 1 : -1));
  }, [rows, q, f]);
  useEffect(() => { setPage(0); }, [q, f, rows]);
  const sel = { padding: '8px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const exportAll = () => exportSheet(`evaluations-${month}`, list.map(r => ({
    'Evaluation ID': r.eval_id, 'Evaluation date': fmtDay(r.d), 'Call date': r.cd, Agent: r.n, 'Wave ID': r.w, Queue: r.u, Coordinator: r.c, 'QA officer': r.q,
    'Contact reason': r.s, Reference: r.t, ...Object.fromEntries(ATTR_LABELS.map((l, i) => [l, (r.fl && r.fl[i]) || 'Pass'])),
    'Raw score': r.r, 'Final score': r.f, Result: resultOf(r), 'Critical failure': r.cr || '', Comments: r.cm || '', 'Feedback needed': r.fn ? 'Yes' : 'No',
    'Coaching status': r.cs || '', 'Coaching date': r.cdt || '', 'Coaching notes': r.cn || '',
  })));
  return (
    <Panel th={th} title={`All evaluations (${list.length} of ${rows.length})`} hint="Every evaluation uploaded for this month. Open one to see all 11 criteria, the comments and the coaching."
      right={<button onClick={exportAll} style={{ ...sel, cursor: 'pointer', fontWeight: 700 }}>Export Excel</button>}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input style={{ ...sel, minWidth: 220, flex: 1 }} placeholder="Search agent, Wave ID, reference, reason, comment…" value={q} onChange={e => setQ(e.target.value)} />
        <select style={sel} value={f.result} onChange={set('result')}><option value="">Any result</option><option value="Full">Full</option><option value="Partial">Partial</option><option value="Zero">Zero</option></select>
        <select style={sel} value={f.qa} onChange={set('qa')}><option value="">All QA officers</option>{opts.qa.map(x => <option key={x}>{x}</option>)}</select>
        <select style={sel} value={f.coord} onChange={set('coord')}><option value="">All coordinators</option>{opts.coord.map(x => <option key={x}>{x}</option>)}</select>
        <select style={sel} value={f.coaching} onChange={set('coaching')}><option value="">Any coaching</option><option value="open">Feedback not delivered</option><option value="done">Feedback delivered</option></select>
        <select style={sel} value={f.crit} onChange={set('crit')}><option value="">Critical or not</option><option value="1">Critical failures only</option></select>
      </div>
      {!list.length ? <Empty th={th}>No evaluations match.</Empty> : (
        <div style={{ display: 'grid', gap: 8 }}>
          {list.slice(page * PAGE, page * PAGE + PAGE).map(r => <EvalCard key={r.id} th={th} r={r} rubric={rubric} showAgent />)}
        </div>
      )}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 14, fontSize: 13, color: th.text }}>
          <button style={{ ...sel, cursor: 'pointer' }} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page + 1} of {pages}</span>
          <button style={{ ...sel, cursor: 'pointer' }} disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </Panel>
  );
}

/* ================================================================== */
/*  PERFORMANCE                                                        */
/* ================================================================== */
function Performance({ th, rows, prev, agents, month }) {
  const s = useMemo(() => summarize(rows), [rows]);
  const p = useMemo(() => (prev.length ? summarize(prev) : null), [prev]);
  const T = tableStyles(th);
  const tick = { fontSize: 11, fill: th.sub };
  const tip = { background: th.card, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8 };

  const byQueue = useMemo(() => [...groupBy(rows, r => r.u).entries()].map(([q, l]) => ({ q, ...summarize(l) })).sort((a, b) => b.evals - a.evals), [rows]);
  const weeks = useMemo(() => {
    const ws = [...new Set(rows.map(r => weekStart(r.d)))].sort();
    const qs = [...new Set(rows.map(r => r.u).filter(Boolean))];
    return ws.map(w => {
      const inW = rows.filter(r => weekStart(r.d) === w);
      const o = { week: w.slice(5), All: +(mean(inW.map(pct)) * 100).toFixed(1) };
      qs.forEach(q => { const l = inW.filter(r => r.u === q); o[q] = l.length ? +(mean(l.map(pct)) * 100).toFixed(1) : null; });
      return o;
    });
  }, [rows]);
  const daily = useMemo(() => [...groupBy(rows, r => r.d.slice(0, 10)).entries()].sort().map(([d, l]) => ({ day: d.slice(5), evals: l.length })), [rows]);
  const attrs = useMemo(() => attributeStats(rows).sort((a, b) => b.rate - a.rate), [rows]);
  const reasons = useMemo(() => reasonStats(rows).slice(0, 10), [rows]);
  const crit = useMemo(() => criticalStats(rows), [rows]);
  const subjects = useMemo(() => [...groupBy(rows, r => r.s).entries()].map(([subject, l]) => {
    const sm = summarize(l);
    const top = attributeStats(l).sort((a, b) => b.count - a.count)[0];
    return { subject, ...sm, topAttr: top && top.count ? top.label : '—' };
  }), [rows]);
  const subj = useSort('evals');
  const ranked = agents.filter(a => a.evals >= SETTINGS.minRank).sort((a, b) => a.avg - b.avg);
  const qs = [...new Set(rows.map(r => r.u).filter(Boolean))];

  if (!rows.length) return <Empty th={th}>No evaluations for this selection.</Empty>;
  const SortTh = ({ k, children }) => <th style={{ ...T.th, cursor: 'pointer' }} onClick={() => subj.toggle(k)}>{children}{subj.sort.key === k ? (subj.sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}</th>;

  return (
    <div>
      <div style={gridStyle(170)}>
        <Kpi th={th} label="Evaluations" value={s.evals} sub={p ? `${p.evals} last month` : undefined} />
        <Kpi th={th} label="Agents evaluated" value={s.agents} sub={p ? `${p.agents} last month` : undefined} />
        <Kpi th={th} label="Average QA score" value={fmtPct(s.avg)} color={scoreColor(s.avg)} delta={p ? deltaLabel(s.avg, p.avg) : null} sub={`skill before critical: ${fmtPct(s.skill)}`} />
        <Kpi th={th} label="Zero-score rate" value={fmtPct(s.zeroRate)} color={RED} delta={p ? deltaLabel(s.zeroRate, p.zeroRate, true) : null} sub={`${s.zero} evaluations`} />
        <Kpi th={th} label="Partial-score rate" value={fmtPct(s.partialRate)} color={AMBER} sub={`${s.partial} evaluations`} />
        <Kpi th={th} label="Full-mark rate" value={fmtPct(s.fullRate)} color={GREEN} delta={p ? deltaLabel(s.fullRate, p.fullRate) : null} sub={`${s.full} evaluations`} />
        <Kpi th={th} label="Critical failures" value={fmtPct(s.critRate)} sub={`${rows.filter(r => r.cr).length} calls scored zero`} />
        <Kpi th={th} label="Mistakes per evaluation" value={s.avgMistakes.toFixed(2)} sub={`${fmtPct(s.mistakeRate, 0)} had at least one`} />
      </div>

      <Panel th={th} title="Results by queue" style={{ marginBottom: 14 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Queue', 'Agents', 'Evaluations', 'Avg QA score', 'Zero', 'Partial', 'Full', 'Mistakes / eval'].map(h => <th key={h} style={T.th}>{h}</th>)}</tr></thead>
            <tbody>
              {byQueue.map(q => (
                <tr key={q.q}>
                  <td style={{ ...T.td, fontWeight: 800 }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: QUEUE_COLORS[q.q] || BLUE, marginInlineEnd: 8 }} />{q.q}</td>
                  <td style={T.td}>{q.agents}</td><td style={T.td}>{q.evals}</td>
                  <td style={{ ...T.td, fontWeight: 800, color: scoreColor(q.avg) }}>{fmtPct(q.avg)}</td>
                  <td style={T.td}>{fmtPct(q.zeroRate, 0)}</td><td style={T.td}>{fmtPct(q.partialRate, 0)}</td><td style={T.td}>{fmtPct(q.fullRate, 0)}</td>
                  <td style={T.td}>{q.avgMistakes.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={gridStyle(380)}>
        <Panel th={th} title="Average QA score per week" hint={`${monthName(month)}, week starting on Monday`}>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeks} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={th.grid} />
                <XAxis dataKey="week" tick={tick} /><YAxis domain={[0, 100]} tick={tick} unit="%" />
                <Tooltip contentStyle={tip} formatter={v => `${v}%`} /><Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="All" stroke={th.text} strokeWidth={2.5} dot={{ r: 3 }} />
                {qs.map(q => <Line key={q} type="monotone" dataKey={q} stroke={QUEUE_COLORS[q] || BLUE} strokeWidth={2} dot={{ r: 2 }} connectNulls />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel th={th} title="Evaluations done per day">
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={th.grid} />
                <XAxis dataKey="day" tick={tick} /><YAxis allowDecimals={false} tick={tick} />
                <Tooltip contentStyle={tip} /><Bar dataKey="evals" name="Evaluations" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div style={gridStyle(380)}>
        <Panel th={th} title="Mistakes by attribute" hint="Share of evaluations where the attribute was not a full pass">
          {attrs.map(a => (
            <div key={a.i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 90px', gap: 10, alignItems: 'center', padding: '5px 0', fontSize: 13, color: th.text }}>
              <span>{a.label}</span><MiniBar th={th} value={a.rate * 2} color={a.rate > 0.2 ? RED : a.rate > 0.1 ? AMBER : GREEN} />
              <span style={{ color: th.sub, textAlign: 'end' }}>{fmtPct(a.rate, 0)} · {a.count}</span>
            </div>
          ))}
        </Panel>
        <Panel th={th} title="Top failure reasons" hint="The exact reason the QA officers picked">
          {reasons.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: i === reasons.length - 1 ? 'none' : `1px solid ${th.border}`, fontSize: 13, color: th.text }}>
              <span><span style={{ color: th.sub }}>{r.attr}: </span>{r.reason}</span><strong>{r.count}</strong>
            </div>
          ))}
        </Panel>
      </div>

      <Panel th={th} title="Critical failures" hint="Calls that scored zero because of one critical mistake" style={{ marginBottom: 14 }}>
        {crit.length === 0 ? <Empty th={th}>None in this period.</Empty> : crit.map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) 2fr 60px', gap: 10, alignItems: 'center', padding: '6px 0', fontSize: 13, color: th.text }}>
            <span>{c.reason}</span><MiniBar th={th} value={c.count / crit[0].count} color={RED} /><strong style={{ textAlign: 'end' }}>{c.count}</strong>
          </div>
        ))}
      </Panel>

      <Panel th={th} title="Contact reasons" hint="Which kinds of calls are going wrong. Click a column to sort." style={{ marginBottom: 14 }}
        right={<button onClick={() => exportSheet(`contact-reasons-${month}`, subjects.map(x => ({ 'Contact reason': x.subject, Evaluations: x.evals, 'Avg QA score': x.avg, 'Zero rate': x.zeroRate, 'Mistakes per eval': x.avgMistakes, 'Most common mistake': x.topAttr })))} style={{ border: `1px solid ${th.border}`, background: 'transparent', color: th.text, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5 }}>Export Excel</button>}>
        <div style={{ overflowX: 'auto', maxHeight: 420 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <SortTh k="subject">Contact reason</SortTh><SortTh k="evals">Evals</SortTh><SortTh k="avg">Avg score</SortTh><SortTh k="zeroRate">Zero</SortTh><SortTh k="avgMistakes">Mistakes / eval</SortTh><th style={T.th}>Most common mistake</th>
            </tr></thead>
            <tbody>
              {subj.apply(subjects).map(x => (
                <tr key={x.subject}>
                  <td style={T.td}>{x.subject}</td><td style={T.td}>{x.evals}</td>
                  <td style={{ ...T.td, fontWeight: 800, color: scoreColor(x.avg) }}>{fmtPct(x.avg)}</td>
                  <td style={T.td}>{fmtPct(x.zeroRate, 0)}</td><td style={T.td}>{x.avgMistakes.toFixed(2)}</td><td style={T.td}>{x.topAttr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={gridStyle(380)}>
        <Panel th={th} title="Lowest scoring agents" hint={`Only agents with ${SETTINGS.minRank}+ evaluations`}>
          {ranked.slice(0, 10).map((a, i) => (
            <div key={a.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: th.text }}>
              <span>{i + 1}. {a.name} <span style={{ color: th.sub }}>· {a.queue}</span></span><strong style={{ color: scoreColor(a.avg) }}>{fmtPct(a.avg)}</strong>
            </div>
          ))}
          {!ranked.length && <Empty th={th}>Not enough evaluations yet.</Empty>}
        </Panel>
        <Panel th={th} title="Highest scoring agents" hint={`Only agents with ${SETTINGS.minRank}+ evaluations`}>
          {[...ranked].reverse().slice(0, 10).map((a, i) => (
            <div key={a.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: th.text }}>
              <span>{i + 1}. {a.name} <span style={{ color: th.sub }}>· {a.queue}</span></span><strong style={{ color: scoreColor(a.avg) }}>{fmtPct(a.avg)}</strong>
            </div>
          ))}
          {!ranked.length && <Empty th={th}>Not enough evaluations yet.</Empty>}
        </Panel>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  AGENTS                                                             */
/* ================================================================== */
function AgentsSection({ th, agents, rows, onOpen, month }) {
  const T = tableStyles(th);
  const [q, setQ] = useState('');
  const [band, setBand] = useState('');
  const [trend, setTrend] = useState('');
  const srt = useSort('risk');
  const tick = { fontSize: 11, fill: th.sub };
  const tip = { background: th.card, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8 };
  const sel = { padding: '7px 10px', borderRadius: 9, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' };

  const count = f => agents.filter(f).length;
  const filtered = agents.filter(a => (!q || `${a.name} ${a.wave}`.toLowerCase().includes(q.toLowerCase())) && (!band || a.band === band) && (!trend || a.trend === trend));
  const improvers = agents.filter(a => a.change != null && a.change > 0).sort((a, b) => b.change - a.change).slice(0, 10);
  const decliners = agents.filter(a => a.change != null && a.change < 0).sort((a, b) => a.change - b.change).slice(0, 10);
  const repeaters = agents.filter(a => a.repeated > 0).sort((a, b) => b.repeated - a.repeated || b.attrCount.reduce((x, y) => x + y, 0) - a.attrCount.reduce((x, y) => x + y, 0)).slice(0, 40);
  const bands = useMemo(() => waveBandStats(agents), [agents]);
  const SortTh = ({ k, children }) => <th style={{ ...T.th, cursor: 'pointer' }} onClick={() => srt.toggle(k)}>{children}{srt.sort.key === k ? (srt.sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}</th>;
  const heat = c => (c >= 4 ? `${RED}` : c === 3 ? '#fb7185' : c === 2 ? '#fdba74' : c === 1 ? `${AMBER}33` : 'transparent');

  const exportAgents = () => exportSheet(`agents-${month}`, filtered.map(a => ({
    Agent: a.name, 'Wave ID': a.wave, Queue: a.queue, Coordinator: a.coordinator, 'QA officer': a.qa, Evaluations: a.evals, 'Avg QA score': a.avg,
    'Zero rate': a.zeroRate, 'Partial rate': a.partialRate, 'Full rate': a.fullRate, 'Mistakes per eval': a.avgMistakes,
    Trend: a.trend, 'Change (pp)': a.change == null ? '' : +(a.change * 100).toFixed(1), 'Repeated mistake types': a.repeated, Target: a.target, Remaining: a.remaining, Risk: a.risk, 'Risk band': a.band, Why: a.why,
  })));

  return (
    <div>
      <div style={gridStyle(150)}>
        <Kpi th={th} label="High risk" value={count(a => a.band === 'HIGH')} color={RED} sub="look at these first" />
        <Kpi th={th} label="Medium risk" value={count(a => a.band === 'MEDIUM')} color={AMBER} />
        <Kpi th={th} label="Low risk" value={count(a => a.band === 'LOW')} color={GREEN} />
        <Kpi th={th} label="Improving" value={count(a => a.trend === 'Improving')} color={GREEN} />
        <Kpi th={th} label="Stable" value={count(a => a.trend === 'Stable')} />
        <Kpi th={th} label="Declining" value={count(a => a.trend === 'Declining')} color={RED} />
        <Kpi th={th} label="Repeating a mistake" value={count(a => a.repeated > 0)} color={AMBER} sub="same mistake 2+ times" />
        <Kpi th={th} label="Not enough evals" value={count(a => a.trend === 'Not enough evals')} sub="fewer than 2" />
      </div>

      <Panel th={th} title="Every agent" style={{ marginBottom: 14 }}
        hint="Risk score 0 to 100 = score decline + zero-score rate + repeated mistakes + raised target + evaluations still owed. High 70+, medium 40+. Click an agent for the full scorecard."
        right={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find an agent or Wave ID…" style={{ ...sel, minWidth: 190 }} />
            <select style={sel} value={band} onChange={e => setBand(e.target.value)}><option value="">All risk levels</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select>
            <select style={sel} value={trend} onChange={e => setTrend(e.target.value)}><option value="">All trends</option><option>Improving</option><option>Stable</option><option>Declining</option><option>Not enough evals</option></select>
            <button onClick={exportAgents} style={{ ...sel, cursor: 'pointer', fontWeight: 700 }}>Export Excel</button>
          </div>
        )}>
        <div style={{ overflow: 'auto', maxHeight: 560 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: th.card, zIndex: 1 }}><tr>
              <SortTh k="name">Agent</SortTh><SortTh k="queue">Queue</SortTh><SortTh k="evals">Evals</SortTh><SortTh k="avg">Avg score</SortTh><SortTh k="zeroRate">Zero</SortTh>
              <SortTh k="avgMistakes">Mistakes / eval</SortTh><SortTh k="change">Trend</SortTh><SortTh k="repeated">Repeats</SortTh><SortTh k="risk">Risk</SortTh><th style={T.th}>Why</th>
            </tr></thead>
            <tbody>
              {srt.apply(filtered).map(a => (
                <tr key={a.key} onClick={() => onOpen(a.key)} style={{ cursor: 'pointer' }}>
                  <td style={{ ...T.td, fontWeight: 700, whiteSpace: 'nowrap' }}>{a.name}<div style={{ fontWeight: 400, fontSize: 11.5, color: th.sub }}>{a.wave ? `Wave ${a.wave}` : ''}{a.coordinator ? ` · ${a.coordinator}` : ''}</div></td>
                  <td style={T.td}>{a.queue}</td><td style={T.td}>{a.evals}</td>
                  <td style={{ ...T.td, fontWeight: 800, color: scoreColor(a.avg) }}>{fmtPct(a.avg)}</td>
                  <td style={T.td}>{fmtPct(a.zeroRate, 0)}</td><td style={T.td}>{a.avgMistakes.toFixed(2)}</td>
                  <td style={{ ...T.td, whiteSpace: 'nowrap', color: trendColor(a.trend), fontWeight: 700 }}>{a.trend === 'Not enough evals' ? 'Too few evals' : `${a.trend}${a.change != null ? ` ${a.change > 0 ? '+' : ''}${Math.round(a.change * 100)} pp` : ''}`}</td>
                  <td style={T.td}>{a.repeated || ''}</td>
                  <td style={T.td}><Pill color={bandColor(a.band)}>{a.risk} {a.band}</Pill></td>
                  <td style={{ ...T.td, color: th.sub, fontSize: 12, minWidth: 200 }}>{a.why}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td style={T.td} colSpan={10}>No agents match.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <div style={gridStyle(380)}>
        <Panel th={th} title="▲ Biggest improvers" hint="Average score of the later half of an agent's evaluations vs the first half">
          {improvers.length ? improvers.map((a, i) => (
            <div key={a.key} onClick={() => onOpen(a.key)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: th.text, cursor: 'pointer' }}>
              <span>{i + 1}. {a.name} <span style={{ color: th.sub }}>· {a.queue}</span></span><strong style={{ color: GREEN }}>+{Math.round(a.change * 100)} pp</strong>
            </div>
          )) : <Empty th={th}>Nobody yet.</Empty>}
        </Panel>
        <Panel th={th} title="▼ Biggest decliners" hint="Worth a coaching conversation">
          {decliners.length ? decliners.map((a, i) => (
            <div key={a.key} onClick={() => onOpen(a.key)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: th.text, cursor: 'pointer' }}>
              <span>{i + 1}. {a.name} <span style={{ color: th.sub }}>· {a.queue}</span></span><strong style={{ color: RED }}>{Math.round(a.change * 100)} pp</strong>
            </div>
          )) : <Empty th={th}>Nobody yet.</Empty>}
        </Panel>
      </div>

      <Panel th={th} title="Repeated mistakes" hint="How many times each agent made each mistake this month. Agents repeating the most are first (top 40)." style={{ marginBottom: 14 }}>
        {repeaters.length === 0 ? <Empty th={th}>Nobody repeats a mistake.</Empty> : (
          <div style={{ overflow: 'auto', maxHeight: 520 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: th.card }}><tr>
                <th style={T.th}>Agent</th>{ATTR_LABELS.map(l => <th key={l} style={{ ...T.th, textAlign: 'center', fontSize: 11, maxWidth: 70, whiteSpace: 'normal' }}>{l}</th>)}
              </tr></thead>
              <tbody>
                {repeaters.map(a => (
                  <tr key={a.key} onClick={() => onOpen(a.key)} style={{ cursor: 'pointer' }}>
                    <td style={{ ...T.td, whiteSpace: 'nowrap', fontWeight: 700 }}>{a.name}</td>
                    {a.attrCount.map((c, i) => <td key={i} style={{ ...T.td, textAlign: 'center', background: heat(c), color: c >= 3 ? '#fff' : th.text, fontWeight: 700 }}>{c || ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel th={th} title="Wave and tenure" hint="Do newer agents struggle more? Agents grouped by Wave ID, oldest to newest.">
        <div style={{ height: 220, marginBottom: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bands.map(b => ({ name: b.label.replace(/ \(.*\)/, ''), avg: b.avg == null ? 0 : +(b.avg * 100).toFixed(1), zero: b.zeroRate == null ? 0 : +(b.zeroRate * 100).toFixed(1) }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={th.grid} /><XAxis dataKey="name" tick={tick} /><YAxis domain={[0, 100]} tick={tick} unit="%" />
              <Tooltip contentStyle={tip} formatter={v => `${v}%`} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="avg" name="Avg QA score" fill={GREEN} radius={[4, 4, 0, 0]} /><Bar dataKey="zero" name="Zero-score rate" fill={RED} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Band', 'Wave IDs', 'Agents', 'Evals', 'Avg score', 'Zero', 'Partial', 'Mistakes / eval', 'Improving', 'Stable', 'Declining'].map(h => <th key={h} style={T.th}>{h}</th>)}</tr></thead>
            <tbody>
              {bands.map(b => (
                <tr key={b.id}>
                  <td style={{ ...T.td, fontWeight: 700 }}>{b.label}</td><td style={T.td}>{b.range}</td><td style={T.td}>{b.agents}</td><td style={T.td}>{b.evals}</td>
                  <td style={{ ...T.td, fontWeight: 800, color: scoreColor(b.avg) }}>{fmtPct(b.avg)}</td><td style={T.td}>{fmtPct(b.zeroRate, 0)}</td><td style={T.td}>{fmtPct(b.partialRate, 0)}</td>
                  <td style={T.td}>{b.avgMistakes == null ? '—' : b.avgMistakes.toFixed(2)}</td><td style={T.td}>{b.improving}</td><td style={T.td}>{b.stable}</td><td style={T.td}>{b.declining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ================================================================== */
/*  COACHING                                                           */
/* ================================================================== */
function CoachingSection({ th, rows, agents, onOpen, month }) {
  const T = tableStyles(th);
  const [list, setList] = useState('Zero');
  const [status, setStatus] = useState('');
  const [qa, setQa] = useState('');
  const [coord, setCoord] = useState('');
  const [days, setDays] = useState(SETTINGS.overdueDays);
  const sel = { padding: '7px 10px', borderRadius: 9, border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13, fontFamily: 'inherit' };

  const now = useMemo(() => new Date(), []);
  const co = useMemo(() => {
    const base = coachingStats(rows, now);
    const overdue = base.open.filter(r => Math.round((now - new Date(r.d.slice(0, 10))) / 86400000) > days);
    return { ...base, overdue };
  }, [rows, now, days]);
  const eff = useMemo(() => coachingEffect(rows), [rows]);
  const byKey = useMemo(() => new Map(agents.map(a => [a.key, a])), [agents]);
  const qas = [...new Set(rows.map(r => r.q))].sort();
  const coords = [...new Set(rows.map(r => r.c).filter(Boolean))].sort();
  const items = rows.filter(r => resultOf(r) === list && (!qa || r.q === qa) && (!coord || r.c === coord)
    && (!status || (status === 'done' ? delivered(r) : !delivered(r)))).sort((a, b) => (a.d < b.d ? 1 : -1));

  const exportList = () => exportSheet(`${list.toLowerCase()}-score-evaluations-${month}`, items.map(r => ({
    Date: fmtDay(r.d), Agent: r.n, 'Wave ID': r.w, Queue: r.u, Coordinator: r.c, 'QA officer': r.q, 'Contact reason': r.s, Score: r.f, 'Raw score': r.r,
    'Critical failure': r.cr || '', 'Failure reasons': (r.fl || []).filter(Boolean).join('; '), 'Coaching status': delivered(r) ? 'Delivered' : 'Open', 'Coaching date': r.cdt || '',
  })));

  return (
    <div>
      <div style={gridStyle(160)}>
        <Kpi th={th} label="Need coaching" value={co.needs.length} sub="zero and partial scores" />
        <Kpi th={th} label="Feedback delivered" value={co.done.length} color={GREEN} sub={fmtPct(co.needs.length ? co.done.length / co.needs.length : null, 0)} />
        <Kpi th={th} label="Still open" value={co.open.length} color={AMBER} />
        <Kpi th={th} label={`Overdue (${days}+ days)`} value={co.overdue.length} color={co.overdue.length ? RED : GREEN}
          sub={<select value={days} onChange={e => setDays(+e.target.value)} style={{ ...sel, padding: '2px 6px', fontSize: 11.5 }} aria-label="Overdue after days">{[1, 2, 3, 5, 7, 14].map(d => <option key={d} value={d}>after {d} days</option>)}</select>} />
        <Kpi th={th} label="Days: evaluation to coaching" value={co.avgDays == null ? '—' : co.avgDays.toFixed(1)} sub="average" />
      </div>

      <Panel th={th} title="Did the coaching work?" hint="Each coached evaluation: the agent's score up to the coaching date vs after it, and whether the same mistake came back." style={{ marginBottom: 14 }}>
        <div style={gridStyle(150, { marginBottom: 12 })}>
          <Kpi th={th} label="Coached evaluations" value={eff.coached} sub={`${eff.agents} agents`} />
          <Kpi th={th} label="With evaluations after" value={eff.withAfter} />
          <Kpi th={th} label="Score improved after" value={fmtPct(eff.improved, 0)} color={GREEN} />
          <Kpi th={th} label="Same mistake came back" value={fmtPct(eff.sameMistake, 0)} color={AMBER} />
          <Kpi th={th} label="Average score change" value={eff.avgChange == null ? '—' : `${eff.avgChange > 0 ? '+' : ''}${(eff.avgChange * 100).toFixed(1)} pp`} color={eff.avgChange > 0 ? GREEN : RED} />
        </div>
        {eff.items.filter(i => i.after != null).length > 0 && (
          <div style={{ overflow: 'auto', maxHeight: 320 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Agent', 'Coached on', 'Score before', 'Score after', 'Change', 'Same mistake again'].map(h => <th key={h} style={T.th}>{h}</th>)}</tr></thead>
              <tbody>
                {eff.items.filter(i => i.after != null).sort((a, b) => (a.after - a.before) - (b.after - b.before)).map((i, k) => (
                  <tr key={k} onClick={() => onOpen(agentKey(i.row))} style={{ cursor: 'pointer' }}>
                    <td style={{ ...T.td, fontWeight: 700 }}>{i.row.n}</td><td style={T.td}>{i.row.cdt}</td>
                    <td style={T.td}>{fmtPct(i.before)}</td><td style={T.td}>{fmtPct(i.after)}</td>
                    <td style={{ ...T.td, fontWeight: 800, color: i.after >= i.before ? GREEN : RED }}>{i.after >= i.before ? '+' : ''}{((i.after - i.before) * 100).toFixed(1)} pp</td>
                    <td style={T.td}>{i.sameMistake ? <Pill color={AMBER}>yes</Pill> : <Pill color={GREEN}>no</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel th={th} title={`${list}-score evaluations`} hint={list === 'Zero' ? 'Calls that scored zero. The QA officer coaches these.' : 'Calls that lost some points but not all. The coordinator coaches these.'}
        right={(
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select style={sel} value={list} onChange={e => setList(e.target.value)}><option value="Zero">Zero score</option><option value="Partial">Partial score</option></select>
            <select style={sel} value={status} onChange={e => setStatus(e.target.value)}><option value="">Any coaching status</option><option value="open">Open</option><option value="done">Delivered</option></select>
            <select style={sel} value={qa} onChange={e => setQa(e.target.value)}><option value="">All QA officers</option>{qas.map(x => <option key={x}>{x}</option>)}</select>
            <select style={sel} value={coord} onChange={e => setCoord(e.target.value)}><option value="">All coordinators</option>{coords.map(x => <option key={x}>{x}</option>)}</select>
            <button onClick={exportList} style={{ ...sel, cursor: 'pointer', fontWeight: 700 }}>Export Excel</button>
          </div>
        )}>
        <div style={{ fontSize: 12.5, color: th.sub, marginBottom: 8 }}>{items.length} evaluations</div>
        <div style={{ overflow: 'auto', maxHeight: 560 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: th.card }}><tr>{['Date', 'Agent', 'Queue', 'QA', 'Contact reason', 'Score', 'What went wrong', 'Coaching'].map(h => <th key={h} style={T.th}>{h}</th>)}</tr></thead>
            <tbody>
              {items.slice(0, 300).map(r => (
                <tr key={r.id} onClick={() => byKey.has(agentKey(r)) && onOpen(agentKey(r))} style={{ cursor: 'pointer' }}>
                  <td style={{ ...T.td, whiteSpace: 'nowrap' }}>{fmtDay(r.d)}</td>
                  <td style={{ ...T.td, fontWeight: 700 }}>{r.n}<div style={{ fontWeight: 400, fontSize: 11.5, color: th.sub }}>{r.c}</div></td>
                  <td style={T.td}>{r.u}</td><td style={T.td}>{r.q}</td><td style={T.td}>{r.s}</td>
                  <td style={{ ...T.td, fontWeight: 800, color: resultColor(resultOf(r)) }}>{r.f}/33</td>
                  <td style={{ ...T.td, fontSize: 12, minWidth: 260 }}>
                    {r.cr && <div style={{ color: RED, fontWeight: 700 }}>Critical: {r.cr}</div>}
                    {(r.fl || []).map((f, i) => (f ? <div key={i} style={{ color: th.sub }}><span style={{ color: th.text }}>{ATTR_LABELS[i]}:</span> {f}</div> : null))}
                  </td>
                  <td style={{ ...T.td, whiteSpace: 'nowrap' }}>{delivered(r) ? <Pill color={GREEN}>Delivered</Pill> : <Pill color={AMBER}>Open</Pill>}{r.cdt && <div style={{ fontSize: 11.5, color: th.sub }}>{r.cdt}</div>}</td>
                </tr>
              ))}
              {!items.length && <tr><td style={T.td} colSpan={8}>Nothing matches.</td></tr>}
            </tbody>
          </table>
        </div>
        {items.length > 300 && <div style={{ fontSize: 12, color: th.sub, marginTop: 8 }}>Showing the newest 300. Export to Excel for all of them.</div>}
      </Panel>
    </div>
  );
}

/* ================================================================== */
/*  QA TEAM                                                            */
/* ================================================================== */
function TeamSection({ th, rows, agents, roster, month, onOpen }) {
  const T = tableStyles(th);
  const tick = { fontSize: 11, fill: th.sub };
  const tip = { background: th.card, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8 };
  const officers = useMemo(() => officerStats(rows), [rows]);
  const coords = useMemo(() => coordinatorStats(rows, agents), [rows, agents]);
  const dq = useMemo(() => dataQuality(rows, roster), [rows, roster]);
  const qaNames = officers.map(o => o.qa);
  const palette = [ORANGE, BLUE, GREEN, '#a78bfa', '#f472b6', AMBER, '#94a3b8'];
  const daily = useMemo(() => [...groupBy(rows, r => r.d.slice(0, 10)).entries()].sort().map(([d, l]) => {
    const o = { day: d.slice(5) };
    qaNames.forEach(q => { o[q] = l.filter(r => r.q === q).length; });
    return o;
  }), [rows, qaNames.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = agents.length;
  const raised = agents.filter(a => a.target > SETTINGS.targetStd).length;
  const evalsDone = rows.length;
  const owed = agents.reduce((a, x) => a + x.remaining, 0) + dq.notEvaluated.length * SETTINGS.targetStd;
  const reached = agents.filter(a => a.remaining === 0).length;
  const below = agents.filter(a => a.remaining > 0).sort((a, b) => b.remaining - a.remaining);

  return (
    <div>
      <Panel th={th} title="QA officers" hint="Volume and scoring pattern. A big gap from the team average can mean a different marking style." style={{ marginBottom: 14 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['QA officer', 'Evaluations', 'Agents', 'Active days', 'Per day', 'Avg score given', 'Gap vs team', 'Zero', 'Partial', 'Full'].map(h => <th key={h} style={T.th}>{h}</th>)}</tr></thead>
            <tbody>
              {officers.map(o => (
                <tr key={o.qa}>
                  <td style={{ ...T.td, fontWeight: 800 }}>{o.qa}</td><td style={T.td}>{o.evals}</td><td style={T.td}>{o.agents}</td><td style={T.td}>{o.days}</td><td style={T.td}>{o.perDay.toFixed(1)}</td>
                  <td style={{ ...T.td, fontWeight: 800, color: scoreColor(o.avg) }}>{fmtPct(o.avg)}</td>
                  <td style={{ ...T.td, color: Math.abs(o.gap) > 0.08 ? AMBER : th.text, fontWeight: 700 }}>{o.gap > 0 ? '+' : ''}{(o.gap * 100).toFixed(1)} pp</td>
                  <td style={T.td}>{fmtPct(o.zeroRate, 0)}</td><td style={T.td}>{fmtPct(o.partialRate, 0)}</td><td style={T.td}>{fmtPct(o.fullRate, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ height: 240, marginTop: 14 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={th.grid} /><XAxis dataKey="day" tick={tick} /><YAxis allowDecimals={false} tick={tick} />
              <Tooltip contentStyle={tip} /><Legend wrapperStyle={{ fontSize: 12 }} />
              {qaNames.map((q, i) => <Bar key={q} dataKey={q} stackId="a" fill={palette[i % palette.length]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel th={th} title="Call targets" hint={`Every agent needs ${SETTINGS.targetStd} evaluations a month. An agent who repeats the same mistake ${SETTINGS.repeatAt} times moves to ${SETTINGS.targetRaised}.`} style={{ marginBottom: 14 }}>
        <div style={gridStyle(150, { marginBottom: 12 })}>
          <Kpi th={th} label="Evaluations done" value={evalsDone} />
          <Kpi th={th} label="Still to do" value={owed} color={AMBER} sub="including agents not evaluated yet" />
          <Kpi th={th} label="Reached target" value={reached} color={GREEN} sub={`of ${done} evaluated agents`} />
          <Kpi th={th} label="On raised target" value={raised} color={RED} sub={`${SETTINGS.targetRaised} evaluations`} />
          <Kpi th={th} label="Not evaluated yet" value={dq.notEvaluated.length} color={dq.notEvaluated.length ? RED : GREEN} sub="active agents with zero" />
        </div>
        <div style={gridStyle(380, { marginBottom: 0 })}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: th.sub, marginBottom: 6 }}>Agents furthest from their target</div>
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              {below.slice(0, 40).map(a => (
                <div key={a.key} onClick={() => onOpen(a.key)} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px', gap: 8, padding: '6px 0', fontSize: 13, color: th.text, cursor: 'pointer', borderBottom: `1px solid ${th.border}` }}>
                  <span>{a.name}<span style={{ color: th.sub }}> · {a.queue}</span></span>
                  <span style={{ color: th.sub }}>{a.evals} / {a.target}</span><strong style={{ color: AMBER, textAlign: 'end' }}>{a.remaining} to go</strong>
                </div>
              ))}
              {!below.length && <Empty th={th}>Everyone reached their target.</Empty>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: th.sub, marginBottom: 6 }}>Active agents with no evaluation this month</div>
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              {dq.notEvaluated.map(u => <div key={u.id} style={{ padding: '6px 0', fontSize: 13, color: th.text, borderBottom: `1px solid ${th.border}` }}>{u.name}<span style={{ color: th.sub }}> · Wave {u.wave_id || '—'}</span></div>)}
              {!dq.notEvaluated.length && <Empty th={th}>Every active agent has been evaluated.</Empty>}
            </div>
          </div>
        </div>
      </Panel>

      <Panel th={th} title="Coordinators" hint="Partial-score coaching is done by coordinators, zero-score coaching by the QA officers." style={{ marginBottom: 14 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Coordinator', 'Agents', 'Evals', 'Avg score', 'Zero rate', 'Partial evals', 'Coached', 'Completion', 'Zero evals', 'Coached', 'Overdue', 'High-risk agents', 'Declining'].map((h, i) => <th key={i} style={T.th}>{h}</th>)}</tr></thead>
            <tbody>
              {coords.map(c => (
                <tr key={c.coordinator}>
                  <td style={{ ...T.td, fontWeight: 800, whiteSpace: 'nowrap' }}>{c.coordinator}</td><td style={T.td}>{c.agents}</td><td style={T.td}>{c.evals}</td>
                  <td style={{ ...T.td, fontWeight: 800, color: scoreColor(c.avg) }}>{fmtPct(c.avg)}</td><td style={T.td}>{fmtPct(c.zeroRate, 0)}</td>
                  <td style={T.td}>{c.partial}</td><td style={T.td}>{c.partialDone}</td>
                  <td style={{ ...T.td, color: c.partialRate != null && c.partialRate < 0.5 ? RED : th.text, fontWeight: 700 }}>{fmtPct(c.partialRate, 0)}</td>
                  <td style={T.td}>{c.zero}</td><td style={T.td}>{c.zeroDone}</td>
                  <td style={{ ...T.td, color: c.overdue ? RED : th.text, fontWeight: 700 }}>{c.overdue}</td><td style={T.td}>{c.high}</td><td style={T.td}>{c.declining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel th={th} title="Data quality" hint="Fix these in the workbook, then upload again.">
        {[
          ['Points do not add up to the Raw Score', dq.sumMismatch],
          ['Score is not consistent with the critical failure', dq.critMismatch],
          ['An attribute has no selection (scored 0)', dq.missingAttr],
          ['Agent not found in the Knowledge Base (Wave ID does not match)', dq.noKb],
        ].map(([label, list]) => (
          <div key={label} style={{ padding: '8px 0', borderBottom: `1px solid ${th.border}`, fontSize: 13, color: th.text }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span>{label}</span><Pill color={list.length ? AMBER : GREEN}>{list.length ? `${list.length} to check` : 'OK'}</Pill>
            </div>
            {list.length > 0 && <div style={{ fontSize: 12, color: th.sub, marginTop: 4, lineHeight: 1.6 }}>{[...new Set(list.map(r => r.n))].slice(0, 12).join(', ')}{new Set(list.map(r => r.n)).size > 12 ? '…' : ''}</div>}
          </div>
        ))}
      </Panel>
    </div>
  );
}

export default QaHub;
