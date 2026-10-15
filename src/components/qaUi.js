import React from 'react';

// Small shared pieces for the QA evaluation screens (admin reports and the agent page).

export const ORANGE = '#FF6B35';
export const NAVY = '#0B1120';
export const GREEN = '#10b981';
export const RED = '#ef4444';
export const AMBER = '#f59e0b';
export const BLUE = '#38bdf8';
export const QUEUE_COLORS = { Sorani: '#FF6B35', Badini: '#38bdf8', Arabic: '#10b981' };

export function useTheme(dark) {
  return dark
    ? { card: '#111827', soft: 'rgba(255,255,255,0.04)', input: '#0b1220', border: 'rgba(255,255,255,0.12)', text: '#e2e8f0', sub: 'rgba(255,255,255,0.55)', grid: 'rgba(255,255,255,0.1)' }
    : { card: '#fff', soft: '#f8fafc', input: '#f8fafc', border: '#e2e8f0', text: NAVY, sub: '#64748b', grid: '#e2e8f0' };
}

export const scoreColor = v => (v == null ? '#94a3b8' : v >= 0.8 ? GREEN : v >= 0.6 ? AMBER : RED);
export const bandColor = b => (b === 'HIGH' ? RED : b === 'MEDIUM' ? AMBER : GREEN);
export const trendColor = t => (t === 'Improving' ? GREEN : t === 'Declining' ? RED : t === 'Stable' ? '#64748b' : '#94a3b8');
export const resultColor = r => (r === 'Full' ? GREEN : r === 'Zero' ? RED : AMBER);

export const Panel = ({ th, title, hint, right, children, style }) => (
  <section style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 16, minWidth: 0, ...style }}>
    {(title || right) && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: th.text }}>{title}</h3>
          {hint && <div style={{ fontSize: 12, color: th.sub, marginTop: 2, lineHeight: 1.5 }}>{hint}</div>}
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
);

export const Kpi = ({ th, label, value, sub, color, delta }) => (
  <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: '12px 14px', minWidth: 0 }}>
    <div style={{ fontSize: 12, color: th.sub, fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color: color || th.text, lineHeight: 1.1 }}>{value}</div>
    {(sub || delta) && (
      <div style={{ fontSize: 11.5, color: th.sub, marginTop: 4 }}>
        {delta}{delta && sub ? ' · ' : ''}{sub}
      </div>
    )}
  </div>
);

export const Empty = ({ th, children }) => <div style={{ padding: '14px 4px', fontSize: 13, color: th.sub }}>{children}</div>;

export const Pill = ({ color, children }) => (
  <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color, background: `${color}1f`, whiteSpace: 'nowrap' }}>{children}</span>
);

export const Bar = ({ value, color, th }) => (
  <div style={{ height: 8, borderRadius: 4, background: th.soft, overflow: 'hidden', minWidth: 60 }}>
    <div style={{ width: `${Math.max(0, Math.min(100, (value || 0) * 100))}%`, height: '100%', background: color }} />
  </div>
);

export const gridStyle = (min, extra) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 12, marginBottom: 14, ...extra });
export const tableStyles = th => ({
  th: { textAlign: 'start', padding: '8px 10px', fontSize: 12, color: th.sub, fontWeight: 700, whiteSpace: 'nowrap', borderBottom: `1px solid ${th.border}`, userSelect: 'none' },
  td: { padding: '9px 10px', fontSize: 13, color: th.text, borderBottom: `1px solid ${th.border}`, verticalAlign: 'top' },
});

// sortable table helper
export function useSort(initialKey, initialDir = 'desc') {
  const [s, setS] = React.useState({ key: initialKey, dir: initialDir });
  const toggle = key => setS(p => ({ key, dir: p.key === key && p.dir === 'desc' ? 'asc' : 'desc' }));
  const apply = (list, getters = {}) => {
    const g = getters[s.key] || (r => r[s.key]);
    return [...list].sort((a, b) => {
      let x = g(a), y = g(b);
      if (x == null) x = s.dir === 'asc' ? Infinity : -Infinity;
      if (y == null) y = s.dir === 'asc' ? Infinity : -Infinity;
      if (typeof x === 'string' || typeof y === 'string') return s.dir === 'asc' ? String(x).localeCompare(String(y)) : String(y).localeCompare(String(x));
      return s.dir === 'asc' ? x - y : y - x;
    });
  };
  return { sort: s, toggle, apply };
}
