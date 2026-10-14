import React from 'react';

// Renders an FAQ answer stored as plain text:
//  - keeps indentation (4 spaces = one level) so step-by-step decision trees stay readable
//  - shows •  ◦  ▪ bullets with a hanging indent
//  - turns **bold** into bold (used for labels such as "If the customer has not paid:")
// Layout uses logical properties, so it mirrors correctly for Kurdish / Arabic (RTL).
const BULLET = /^([•◦▪])\s+/;

function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

export default function RichAnswer({ text, style }) {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  return (
    <div style={style}>
      {lines.map((raw, i) => {
        if (raw.trim() === '') return <div key={i} style={{ height: '0.7em' }} />;
        const lead = raw.match(/^[ \u00A0\t]*/)[0].replace(/\t/g, '    ').length;
        const depth = Math.floor(lead / 4);
        const body = raw.trim();
        const m = body.match(BULLET);
        return (
          <div key={i} style={{ display: 'flex', paddingInlineStart: depth * 20 }}>
            {m && <span style={{ flex: '0 0 18px' }}>{m[1]}</span>}
            <span style={{ flex: 1, minWidth: 0 }}>{inline(m ? body.slice(m[0].length) : body)}</span>
          </div>
        );
      })}
    </div>
  );
}