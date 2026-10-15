import React from 'react';

// Shared warm page header used by the agent tool pages.
export const PALETTE = ['#FF6B35', '#8b5cf6', '#10b981', '#38bdf8', '#ec4899', '#f59e0b', '#6366f1', '#14b8a6'];

export default function PageHero({ icon, title, text, a = '#FF6B35', b = '#ec4899', children }) {
  return (
    <div style={{ background: `linear-gradient(120deg, ${a}, ${b})`, borderRadius: 20, padding: '18px 22px', color: '#fff', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14, boxShadow: `0 10px 28px ${a}44`, position: 'relative', overflow: 'hidden', flexWrap: 'wrap' }}>
      <div style={{ position: 'absolute', insetInlineEnd: -20, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.14)' }} />
      <div style={{ fontSize: 38, lineHeight: 1 }}>{icon}</div>
      <div style={{ position: 'relative', flex: '1 1 240px' }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 13.5, opacity: 0.95, marginTop: 3, lineHeight: 1.5 }}>{text}</div>
      </div>
      {children}
    </div>
  );
}
