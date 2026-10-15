// Analytics for the QA evaluation reports. Everything is computed in the browser from the evaluations
// of the chosen month(s). Row fields: n agent, w wave id, q QA officer, c coordinator, u queue, d date,
// s subject, f final score, r raw score, cr critical failure, fl failure reason per attribute (null = pass),
// pt points per attribute, fn feedback needed, cs coaching status, cdt coaching date.

export const MAX = 33;
export const ATTR_LABELS = [
  'Greeting', 'Customer ID & Info', 'Active Listening', 'FAQ Alignment', 'Communication', 'Problem Solving',
  'Tag / Topic', 'Tone of Voice', 'Ending', 'Rude Behaviour', 'Hang Up',
];
export const BANDS = [
  { id: 1, label: 'Band 1 (oldest)', range: 'up to 1149', test: w => w <= 1149 },
  { id: 2, label: 'Band 2', range: '1150 – 1249', test: w => w >= 1150 && w <= 1249 },
  { id: 3, label: 'Band 3', range: '1250 – 1349', test: w => w >= 1250 && w <= 1349 },
  { id: 4, label: 'Band 4', range: '1350 – 1399', test: w => w >= 1350 && w <= 1399 },
  { id: 5, label: 'Band 5 (newest)', range: '1400 +', test: w => w >= 1400 },
];
export const SETTINGS = { stableBand: 0.05, repeatAt: 2, targetStd: 10, targetRaised: 15, minRank: 3, overdueDays: 3, targetScore: 0.8 };

export const pct = r => r.f / MAX;
export const resultOf = r => (r.f >= MAX ? 'Full' : r.f <= 0 ? 'Zero' : 'Partial');
export const mistakesOf = r => (r.fl || []).filter(Boolean).length;
export const delivered = r => /deliver/i.test(r.cs || '');
export const agentKey = r => r.w || r.em || r.n;
export const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
export const fmtPct = (v, d = 1) => (v == null || Number.isNaN(v) ? '—' : `${(v * 100).toFixed(d)}%`);
export const fmtDay = iso => (iso ? iso.slice(0, 10) : '');

export function groupBy(rows, fn) {
  const m = new Map();
  rows.forEach(r => { const k = fn(r); if (k == null || k === '') return; if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
  return m;
}

export function summarize(rows) {
  const n = rows.length;
  const zero = rows.filter(r => resultOf(r) === 'Zero').length;
  const full = rows.filter(r => resultOf(r) === 'Full').length;
  return {
    evals: n,
    agents: new Set(rows.map(agentKey)).size,
    avg: mean(rows.map(pct)),
    skill: mean(rows.map(r => r.r / MAX)),
    zero, full, partial: n - zero - full,
    zeroRate: n ? zero / n : null, fullRate: n ? full / n : null, partialRate: n ? (n - zero - full) / n : null,
    critRate: n ? rows.filter(r => r.cr).length / n : null,
    mistakeRate: n ? rows.filter(r => mistakesOf(r) > 0).length / n : null,
    avgMistakes: n ? rows.reduce((a, r) => a + mistakesOf(r), 0) / n : null,
  };
}

// Monday of the week (YYYY-MM-DD)
export function weekStart(iso) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const wd = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - wd);
  return d.toISOString().slice(0, 10);
}

export function attributeStats(rows) {
  return ATTR_LABELS.map((label, i) => {
    const withMistake = rows.filter(r => r.fl && r.fl[i]).length;
    return { i, label, count: withMistake, rate: rows.length ? withMistake / rows.length : 0 };
  });
}

export function reasonStats(rows) {
  const m = new Map();
  rows.forEach(r => (r.fl || []).forEach((reason, i) => {
    if (!reason) return;
    const k = `${i}|${reason}`;
    if (!m.has(k)) m.set(k, { attr: ATTR_LABELS[i], reason, count: 0 });
    m.get(k).count++;
  }));
  return [...m.values()].sort((a, b) => b.count - a.count);
}

export function criticalStats(rows) {
  const m = groupBy(rows.filter(r => r.cr), r => r.cr);
  return [...m.entries()].map(([reason, list]) => ({ reason, count: list.length })).sort((a, b) => b.count - a.count);
}

/* ---------- agents ---------- */
export function agentTable(rows) {
  const S = SETTINGS;
  const out = [];
  groupBy(rows, agentKey).forEach(list => {
    list.sort((a, b) => (a.d < b.d ? -1 : 1));
    const n = list.length;
    const first = list[0];
    const half = Math.floor(n / 2);
    let change = null, trend = 'Not enough evals';
    if (n >= 2) {
      change = mean(list.slice(n - half).map(pct)) - mean(list.slice(0, half).map(pct));
      trend = change > S.stableBand ? 'Improving' : change < -S.stableBand ? 'Declining' : 'Stable';
    }
    // a mistake is "repeated" when the same attribute (or the same critical failure) happens 2+ times
    const attrCount = ATTR_LABELS.map((_, i) => list.filter(r => r.fl && r.fl[i]).length);
    const critCount = [...groupBy(list.filter(r => r.cr), r => r.cr).values()].map(l => l.length);
    const repeated = attrCount.filter(c => c >= S.repeatAt).length + critCount.filter(c => c >= S.repeatAt).length;
    const target = repeated > 0 ? S.targetRaised : S.targetStd;
    const sum = summarize(list);
    const parts = {
      decline: change != null && change < 0 ? Math.min(35, -change * 100) : 0,
      zero: (sum.zeroRate || 0) * 40,
      repeat: Math.min(25, repeated * 8),
      raised: target === S.targetRaised ? 10 : 0,
      below: n < target ? Math.min(10, ((target - n) / target) * 10) : 0,
    };
    const risk = Math.min(100, Math.round(parts.decline + parts.zero + parts.repeat + parts.raised + parts.below));
    const why = [];
    if (parts.decline >= 5) why.push(`Declining ${Math.round(change * 100)} pp`);
    if (sum.zeroRate >= 0.2) why.push(`Zero-score rate ${Math.round(sum.zeroRate * 100)}%`);
    if (repeated) why.push(`Repeating ${repeated} mistake type${repeated > 1 ? 's' : ''}`);
    if (parts.below >= 5) why.push(`${n} of ${target} evaluations done`);
    out.push({
      key: agentKey(first), name: first.n, wave: first.w, queue: first.u, coordinator: first.c, qa: [...new Set(list.map(r => r.q))].join(', '),
      uid: first.uid, evals: n, avg: sum.avg, zeroRate: sum.zeroRate, partialRate: sum.partialRate, fullRate: sum.fullRate,
      avgMistakes: sum.avgMistakes, change, trend, repeated, attrCount, target, remaining: Math.max(0, target - n),
      risk, band: risk >= 70 ? 'HIGH' : risk >= 40 ? 'MEDIUM' : 'LOW', why: why.join(' · '), list,
    });
  });
  return out;
}

export function waveBandStats(agents) {
  return BANDS.map(b => {
    const ag = agents.filter(a => a.wave && b.test(parseInt(a.wave, 10)));
    const list = ag.flatMap(a => a.list);
    const s = summarize(list);
    return {
      ...b, agents: ag.length, evals: s.evals, avg: s.avg, zeroRate: s.zeroRate, partialRate: s.partialRate, avgMistakes: s.avgMistakes,
      improving: ag.filter(a => a.trend === 'Improving').length, stable: ag.filter(a => a.trend === 'Stable').length, declining: ag.filter(a => a.trend === 'Declining').length,
    };
  });
}

/* ---------- coaching ---------- */
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export function coachingStats(rows, now = new Date()) {
  const needs = rows.filter(r => r.fn);
  const done = needs.filter(delivered);
  const open = needs.filter(r => !delivered(r));
  const overdue = open.filter(r => daysBetween(r.d.slice(0, 10), now.toISOString().slice(0, 10)) > SETTINGS.overdueDays);
  const lagList = rows.filter(r => r.cdt && r.d).map(r => daysBetween(r.d.slice(0, 10), r.cdt)).filter(x => x >= 0 && x < 90);
  return { needs, done, open, overdue, avgDays: mean(lagList) };
}

export function coachingEffect(rows) {
  const byAgent = groupBy(rows, agentKey);
  const items = [];
  rows.filter(r => r.cdt).forEach(r => {
    const list = (byAgent.get(agentKey(r)) || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1));
    const before = list.filter(x => x.d.slice(0, 10) <= r.cdt);
    const after = list.filter(x => x.d.slice(0, 10) > r.cdt);
    if (!after.length) { items.push({ row: r, before: mean(before.map(pct)), after: null }); return; }
    const failedThen = new Set((r.fl || []).map((f, i) => (f ? i : -1)).filter(i => i >= 0));
    const came = after.some(x => (x.fl || []).some((f, i) => f && failedThen.has(i)));
    items.push({ row: r, before: mean(before.map(pct)), after: mean(after.map(pct)), sameMistake: came });
  });
  const withAfter = items.filter(i => i.after != null);
  return {
    coached: items.length,
    agents: new Set(items.map(i => agentKey(i.row))).size,
    withAfter: withAfter.length,
    improved: withAfter.length ? withAfter.filter(i => i.after > i.before).length / withAfter.length : null,
    sameMistake: withAfter.length ? withAfter.filter(i => i.sameMistake).length / withAfter.length : null,
    avgChange: withAfter.length ? mean(withAfter.map(i => i.after - i.before)) : null,
    items,
  };
}

/* ---------- QA team ---------- */
export function officerStats(rows) {
  const all = mean(rows.map(pct));
  return [...groupBy(rows, r => r.q).entries()].map(([q, list]) => {
    const s = summarize(list);
    const days = new Set(list.map(r => r.d.slice(0, 10))).size;
    return { qa: q, evals: s.evals, agents: s.agents, avg: s.avg, gap: s.avg - all, zeroRate: s.zeroRate, partialRate: s.partialRate, fullRate: s.fullRate, days, perDay: days ? s.evals / days : 0 };
  }).sort((a, b) => b.evals - a.evals);
}

export function coordinatorStats(rows, agentRows) {
  return [...groupBy(rows, r => r.c).entries()].map(([c, list]) => {
    const s = summarize(list);
    const co = coachingStats(list);
    const partial = list.filter(r => resultOf(r) === 'Partial');
    const partialDone = partial.filter(delivered).length;
    const zero = list.filter(r => resultOf(r) === 'Zero');
    const ag = agentRows.filter(a => a.coordinator === c);
    return {
      coordinator: c, agents: s.agents, evals: s.evals, avg: s.avg, zeroRate: s.zeroRate,
      partial: partial.length, partialDone, partialRate: partial.length ? partialDone / partial.length : null,
      zero: zero.length, zeroDone: zero.filter(delivered).length, overdue: co.overdue.length,
      high: ag.filter(a => a.band === 'HIGH').length, declining: ag.filter(a => a.trend === 'Declining').length,
    };
  }).sort((a, b) => b.evals - a.evals);
}

export function dataQuality(rows, roster) {
  const sumMismatch = rows.filter(r => (r.pt || []).reduce((a, b) => a + b, 0) !== r.r);
  const critMismatch = rows.filter(r => (r.cr && r.f !== 0) || (!r.cr && r.f !== r.r));
  const missingAttr = rows.filter(r => (r.pt || []).some((p, i) => p === 0 && !(r.fl && r.fl[i])));
  const noKb = rows.filter(r => !r.uid);
  const evaluated = new Set(rows.map(r => r.w).filter(Boolean));
  const notEvaluated = (roster || []).filter(u => !evaluated.has(String(u.wave_id || '').trim()));
  const dateIssues = rows.filter(r => r.di);
  return { sumMismatch, critMismatch, missingAttr, noKb, notEvaluated, dateIssues };
}
