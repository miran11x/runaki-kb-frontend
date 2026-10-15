import React, { useMemo } from 'react';
import { ATTR_LABELS } from '../utils/qaStats';
import { ATTR_EMOJI } from './QaScorecard';
import { buildIndex, searchFaqs } from '../utils/faqSearch';
import { Panel, GREEN, RED, AMBER, ORANGE } from './qaUi';

// "Your focus this week": the parts of the call where this agent lost the most points lately,
// each with one practical tip and a shortcut to the script, checklist, call flow or FAQs that help.
const GUIDE = {
  0: { tip: 'Greet in the first seconds, use the company name and your name, and sound glad to help.', go: ['_scripts', '📋 Opening script'] },
  1: { tip: 'Verify the customer before you share anything. Ask for the details in the same order every time.', go: ['_kyc', '🪪 KYC checklist'] },
  2: { tip: 'Let the customer finish. Repeat the problem back in one sentence before you answer.', go: ['_callflows', '📞 Call flows'] },
  3: { tip: 'Give the answer the FAQ gives. Search it again if you are not sure, then say it in your own words.', go: ['_shortlisted', '⭐ Shortlisted FAQs'] },
  4: { tip: 'Short sentences, no jargon, and check that the customer understood before moving on.', go: ['_scripts', '📋 Scripts'] },
  5: { tip: 'Follow the call flow step by step. Offer the next step and do not leave the customer to guess.', go: ['_callflows', '📞 Call flows'] },
  6: { tip: 'Pick the contact reason that matches what the customer asked, not what you solved last.', go: ['_contactreasons', '🌳 Contact reasons'] },
  7: { tip: 'Smile while you speak and keep the same calm voice, even when the customer is upset.', go: ['_scripts', '📋 Scripts'] },
  8: { tip: 'Ask if there is anything else, thank the customer, and close with the closing script.', go: ['_scripts', '📋 Closing script'] },
  9: { tip: 'Never argue. Use a calming phrase, then return to the solution.', go: ['_scripts', '📋 Scripts'] },
  10: { tip: 'End the call the right way: only after the customer has heard the closing.', go: ['_callflows', '📞 Call flows'] },
};
const DAY = 86400000;

export default function FocusThisWeek({ th, rows, faqs, onOpen, onSearch }) {
  const index = useMemo(() => (faqs && faqs.length ? buildIndex(faqs) : null), [faqs]);
  const { recent, label, areas } = useMemo(() => {
    const sorted = [...rows].sort((a, b) => (a.d < b.d ? 1 : -1));
    const cut = Date.now() - 14 * DAY;
    let rec = sorted.filter(r => Date.parse(r.d) >= cut);
    let lab = 'in your last 2 weeks';
    if (rec.length < 2) { rec = sorted.slice(0, 5); lab = `in your last ${rec.length} call${rec.length === 1 ? '' : 's'}`; }
    const per = ATTR_LABELS.map((name, i) => {
      const hit = rec.filter(r => r.fl && r.fl[i]);
      const reasons = new Map();
      hit.forEach(r => { const t = String(r.fl[i]).trim(); if (t && t.length > 1 && t !== 'true') reasons.set(t, (reasons.get(t) || 0) + 1); });
      const top = [...reasons.entries()].sort((a, b) => b[1] - a[1])[0];
      return { i, name, lost: hit.length, reason: top ? top[0] : '' };
    }).filter(a => a.lost > 0).sort((a, b) => b.lost - a.lost).slice(0, 3);
    return { recent: rec, label: lab, areas: per };
  }, [rows]);

  if (!recent.length) return null;
  if (!areas.length) {
    return (
      <Panel th={th} title="🎯 Your focus this week" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: th.text, lineHeight: 1.7 }}>
          <b style={{ color: GREEN }}>Nothing to fix {label}.</b> No points were lost in any part of the call. Keep doing exactly what you are doing.
        </div>
      </Panel>
    );
  }
  const btn = { border: `1px solid ${ORANGE}`, background: 'transparent', color: ORANGE, borderRadius: 10, padding: '6px 12px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
  return (
    <Panel th={th} title="🎯 Your focus this week" hint={`The ${areas.length === 1 ? 'one thing' : areas.length + ' things'} that will lift your score fastest, from ${label.replace('in ', '')}.`} style={{ marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
        {areas.map((a, n) => {
          const g = GUIDE[a.i] || {};
          const c = n === 0 ? RED : AMBER;
          const faqHits = index ? searchFaqs(index, a.reason || a.name, { limit: 2, minScore: 0 }).map(r => r.faq) : [];
          return (
            <div key={a.i} style={{ background: `${c}12`, border: `1px solid ${c}55`, borderRadius: 16, padding: '14px 15px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{ATTR_EMOJI[a.i]}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: th.text }}>{n === 0 ? 'Start with ' : ''}{a.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: c }}>lost {a.lost} time{a.lost > 1 ? 's' : ''} {label}</div>
                </div>
              </div>
              {a.reason && <div style={{ fontSize: 12.5, color: th.sub, fontStyle: 'italic', borderInlineStart: `3px solid ${c}`, paddingInlineStart: 9, lineHeight: 1.5 }}>“{a.reason}”</div>}
              {g.tip && <div style={{ fontSize: 13, color: th.text, lineHeight: 1.6 }}>{g.tip}</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 'auto' }}>
                {g.go && onOpen && <button style={btn} onClick={() => onOpen(g.go[0])}>{g.go[1]}</button>}
                {faqHits.map(f => (
                  <button key={f.id} style={{ ...btn, borderColor: th.border, color: th.text, textAlign: 'start' }} title={f.question_en} onClick={() => onSearch && onSearch(f.question_en)}>
                    🔎 {String(f.question_en).length > 38 ? String(f.question_en).slice(0, 36) + '…' : f.question_en}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
