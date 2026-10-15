import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { SCRIPTS_DEFAULT, HOLD_DEFAULT, KYC_DEFAULT } from './OpsPages';

const ORANGE = '#FF6B35';
const NAVY = '#0B1120';

const LANGS = [
  ['en', 'English', 'ltr'],
  ['ku', 'Sorani · سۆرانی', 'rtl'],
  ['ba', 'Badini · بادینی', 'rtl'],
  ['ar', 'Arabic · العربية', 'rtl'],
];

const PAGES = [
  { key: 'scripts', icon: '📋', label: 'Scripts & Processes', def: SCRIPTS_DEFAULT },
  { key: 'hold', icon: '⏸️', label: 'Hold & Unhold', def: HOLD_DEFAULT },
  { key: 'kyc', icon: '📱', label: 'KYC Platform Outputs', def: KYC_DEFAULT },
];

// friendly names for the technical keys in the stored content
const LABELS = {
  cards: 'Script cards',
  closing: 'Closing',
  steps: 'Steps',
  intro: 'Intro box',
  statuses: 'Platform outputs',
  t: 'Card title',
  s: 'Script text (what the agent says)',
  label: 'Step label',
  title: 'Title',
  text: 'Text',
  phase: 'Phase label',
  desc: 'Description',
  script: 'Script (what the agent says)',
  rules: 'Rules / checklist',
  status: 'Platform output name (shown exactly as on the platform, English)',
  action: 'What the agent should do',
  badge: 'Action badge',
  color: 'Accent color',
  bg: 'Background color',
  icon: 'Icon / emoji',
};
const ITEM_NAME = {
  cards: 'card', steps: 'step', rules: 'rule', statuses: 'output',
};

const pretty = k => LABELS[k] || k.replace(/_/g, ' ');
const isLangObj = v => v && typeof v === 'object' && !Array.isArray(v) && 'en' in v;
const clone = v => JSON.parse(JSON.stringify(v));

// blank copy of an item, used by "Add"
function blankLike(v, key) {
  if (isLangObj(v)) return { en: '', ku: '', ba: '', ar: '' };
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') {
    const o = {};
    Object.keys(v).forEach(k => { o[k] = blankLike(v[k], k); });
    return o;
  }
  if (typeof v === 'string') return ['color', 'bg', 'icon'].includes(key) ? v : '';
  return v;
}

function useTheme(dark) {
  return dark
    ? { card: '#111827', input: '#0b1220', border: 'rgba(255,255,255,0.12)', text: '#e2e8f0', sub: 'rgba(255,255,255,0.5)', soft: 'rgba(255,255,255,0.04)' }
    : { card: '#fff', input: '#f8fafc', border: '#e2e8f0', text: NAVY, sub: '#64748b', soft: '#f8fafc' };
}

function Field({ k, value, onChange, th }) {
  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10,
    border: `1px solid ${th.border}`, background: th.input, color: th.text,
    fontSize: 13, fontFamily: 'inherit',
  };
  const isColor = (k === 'color' || k === 'bg') && /^#[0-9a-fA-F]{6}$/.test(value || '');
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: th.sub, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{pretty(k)}</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isColor && <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 38, height: 34, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} />}
        <input value={value ?? ''} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, direction: k === 'status' || isColor ? 'ltr' : 'auto' }} />
      </div>
    </div>
  );
}

function LangField({ k, value, onChange, onRemove, th }) {
  const long = (value.en || value.ku || value.ba || value.ar || '').length > 90;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: th.sub, textTransform: 'uppercase', letterSpacing: '.06em', flex: 1 }}>{pretty(k)}</div>
        {onRemove && <button onClick={onRemove} style={miniBtn(th, '#ef4444')}>Remove</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 8 }}>
        {LANGS.map(([code, name, dir]) => (
          <div key={code}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: ORANGE, marginBottom: 3 }}>{name}</div>
            <textarea
              dir={dir}
              rows={long ? 5 : 2}
              value={value[code] ?? ''}
              onChange={e => onChange({ ...value, [code]: e.target.value })}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, resize: 'vertical',
                border: `1px solid ${th.border}`, background: th.input, color: th.text, fontSize: 13.5, lineHeight: 1.8, fontFamily: 'inherit',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const miniBtn = (th, color) => ({
  border: `1px solid ${color}55`, background: `${color}14`, color, borderRadius: 8,
  padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginInlineStart: 6,
});

function Node({ k, value, onChange, th, depth, onRemoveSelf }) {
  if (value === null) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: th.sub, textTransform: 'uppercase', marginBottom: 5 }}>{pretty(k)}</div>
        <button onClick={() => onChange({ en: '', ku: '', ba: '', ar: '' })} style={miniBtn(th, '#10b981')}>＋ Add {pretty(k).split(' (')[0].toLowerCase()}</button>
      </div>
    );
  }
  if (typeof value === 'string') return <Field k={k} value={value} onChange={onChange} th={th} />;
  if (isLangObj(value)) {
    return <LangField k={k} value={value} onChange={onChange} th={th} onRemove={k === 'script' ? () => onChange(null) : null} />;
  }
  if (Array.isArray(value)) {
    const move = (i, d) => {
      const j = i + d;
      if (j < 0 || j >= value.length) return;
      const a = value.slice(); [a[i], a[j]] = [a[j], a[i]]; onChange(a);
    };
    const name = ITEM_NAME[k] || 'item';
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: th.text, marginBottom: 8 }}>{pretty(k)} <span style={{ color: th.sub, fontWeight: 600 }}>({value.length})</span></div>
        {value.map((item, i) => (
          <div key={i} style={{ border: `1px solid ${th.border}`, borderInlineStart: `4px solid ${ORANGE}`, borderRadius: 12, padding: '12px 14px', marginBottom: 10, background: th.soft }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE, flex: 1 }}>{name} {i + 1}</div>
              <button onClick={() => move(i, -1)} style={miniBtn(th, '#64748b')} title="Move up">↑</button>
              <button onClick={() => move(i, 1)} style={miniBtn(th, '#64748b')} title="Move down">↓</button>
              <button
                onClick={() => { if (window.confirm(`Delete this ${name}?`)) onChange(value.filter((_, x) => x !== i)); }}
                style={miniBtn(th, '#ef4444')}
              >✕ Delete</button>
            </div>
            <Node k={`${k}-item`} value={item} th={th} depth={depth + 1} onChange={nv => onChange(value.map((x, xi) => (xi === i ? nv : x)))} />
          </div>
        ))}
        <button
          onClick={() => {
            const tpl = value.length ? blankLike(value[value.length - 1], k) : { en: '', ku: '', ba: '', ar: '' };
            onChange([...value, tpl]);
          }}
          style={{ ...miniBtn(th, '#10b981'), marginInlineStart: 0, padding: '7px 14px', fontSize: 12 }}
        >＋ Add {name}</button>
      </div>
    );
  }
  if (value && typeof value === 'object') {
    return (
      <div>
        {Object.keys(value).map(key => {
          const v = value[key];
          const nested = v && typeof v === 'object' && !isLangObj(v) && !Array.isArray(v);
          return (
            <div key={key} style={nested ? { border: `1px dashed ${th.border}`, borderRadius: 12, padding: 14, marginBottom: 14 } : {}}>
              {nested && <div style={{ fontSize: 13, fontWeight: 800, color: th.text, marginBottom: 10 }}>{pretty(key)}</div>}
              <Node k={key} value={v} th={th} depth={depth + 1} onChange={nv => onChange({ ...value, [key]: nv })} />
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Admin tab: edit Scripts / Hold / KYC pages                         */
/* ------------------------------------------------------------------ */
export function PageContentEditor({ darkMode }) {
  const th = useTheme(darkMode);
  const [pageKey, setPageKey] = useState('scripts');
  const [data, setData] = useState(null);
  const [custom, setCustom] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const page = PAGES.find(p => p.key === pageKey);

  const load = useCallback(async () => {
    setData(null);
    try {
      const r = await api.get(`/page-content/${pageKey}`);
      if (r.data && r.data.data) { setData(r.data.data); setCustom(true); }
      else { setData(clone(page.def)); setCustom(false); }
    } catch {
      setData(clone(page.def)); setCustom(false);
    }
    setDirty(false);
  }, [pageKey, page.def]);

  useEffect(() => { load(); }, [load]);

  const switchPage = k => {
    if (dirty && !window.confirm('You have unsaved changes on this page. Leave without saving?')) return;
    setPageKey(k);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/page-content/${pageKey}`, { data });
      setCustom(true); setDirty(false);
      toast.success('Saved — agents will see the new text when they open the page');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save');
    }
    setSaving(false);
  };

  const reset = async () => {
    if (!window.confirm('Reset this page to the original built-in text? Your edits to it will be lost.')) return;
    try {
      await api.delete(`/page-content/${pageKey}`);
      toast.success('Reset to the original text');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not reset');
    }
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: th.text, marginBottom: 4 }}>📝 Page Content</div>
      <div style={{ fontSize: 13, color: th.sub, marginBottom: 18, lineHeight: 1.7 }}>
        Edit, add, remove or re-order the text on the agent pages, in English, Sorani, Badini and Arabic.
        Changes go live for agents as soon as you press Save.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {PAGES.map(p => (
          <button key={p.key} onClick={() => switchPage(p.key)} style={{
            padding: '8px 16px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
            border: `1.5px solid ${pageKey === p.key ? ORANGE : th.border}`,
            background: pageKey === p.key ? ORANGE : th.card, color: pageKey === p.key ? '#fff' : th.sub,
          }}>{p.icon} {p.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: th.sub }}>
          {custom ? '✏️ Showing your edited version' : '📄 Showing the original text (nothing edited yet)'}
          {dirty && <b style={{ color: ORANGE }}> · unsaved changes</b>}
        </span>
        <span style={{ flex: 1 }} />
        {custom && <button onClick={reset} style={miniBtn(th, '#ef4444')}>Reset to original</button>}
        <button onClick={save} disabled={!dirty || saving} style={{
          padding: '9px 22px', borderRadius: 10, border: 'none', cursor: dirty && !saving ? 'pointer' : 'default',
          background: dirty ? ORANGE : th.border, color: dirty ? '#fff' : th.sub, fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
        }}>{saving ? 'Saving…' : '💾 Save changes'}</button>
      </div>

      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 20 }}>
        {data ? (
          <Node k="root" value={data} th={th} depth={0} onChange={nv => { setData(nv); setDirty(true); }} />
        ) : (
          <div style={{ color: th.sub, fontSize: 13 }}>Loading…</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin tab: external tools (other websites shown under Tools)       */
/* ------------------------------------------------------------------ */
export function ExternalToolsAdmin({ darkMode }) {
  const th = useTheme(darkMode);
  const [tools, setTools] = useState([]);
  const [form, setForm] = useState({ name: '', icon: '🧩', url: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/external-tools?all=1');
      setTools(r.data || []);
    } catch { toast.error('Could not load tools'); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    try {
      await api.post('/external-tools', { ...form, sort_order: tools.length + 1 });
      setForm({ name: '', icon: '🧩', url: '' });
      toast.success('Added — it now appears under Tools in the sidebar');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Could not add'); }
  };
  const update = async (t, patch) => {
    try { await api.put(`/external-tools/${t.id}`, { ...t, ...patch }); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Could not save'); }
  };
  const remove = async t => {
    if (!window.confirm(`Remove "${t.name}" from the Tools menu?`)) return;
    try { await api.delete(`/external-tools/${t.id}`); load(); }
    catch { toast.error('Could not remove'); }
  };

  const inp = {
    padding: '9px 12px', borderRadius: 10, border: `1px solid ${th.border}`, background: th.input,
    color: th.text, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: th.text, marginBottom: 4 }}>🧰 External Tools</div>
      <div style={{ fontSize: 13, color: th.sub, marginBottom: 18, lineHeight: 1.7 }}>
        Add another website here and it appears as a tab under <b>Tools</b> in the sidebar, opened inside this site.
        Some websites refuse to be shown inside another site; for those the tab shows an “Open in new tab” button.
      </div>

      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 16, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: th.text, marginBottom: 10 }}>＋ Add a website</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input style={{ ...inp, width: 64, textAlign: 'center' }} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} title="Emoji" />
          <input style={{ ...inp, flex: '1 1 180px' }} placeholder="Name (e.g. Outbound Portal)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={{ ...inp, flex: '2 1 280px', direction: 'ltr' }} placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          <button onClick={add} disabled={!form.name || !form.url} style={{
            padding: '9px 20px', borderRadius: 10, border: 'none', background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit', opacity: !form.name || !form.url ? 0.5 : 1,
          }}>Add</button>
        </div>
      </div>

      {loading ? <div style={{ color: th.sub, fontSize: 13 }}>Loading…</div> : tools.length === 0 ? (
        <div style={{ color: th.sub, fontSize: 13 }}>No external tools yet.</div>
      ) : tools.map(t => (
        <div key={t.id} style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', opacity: t.is_active ? 1 : 0.55 }}>
          <input style={{ ...inp, width: 56, textAlign: 'center' }} defaultValue={t.icon} onBlur={e => e.target.value !== t.icon && update(t, { icon: e.target.value })} />
          <input style={{ ...inp, flex: '1 1 160px' }} defaultValue={t.name} onBlur={e => e.target.value !== t.name && update(t, { name: e.target.value })} />
          <input style={{ ...inp, flex: '2 1 240px', direction: 'ltr' }} defaultValue={t.url} onBlur={e => e.target.value !== t.url && update(t, { url: e.target.value })} />
          <button onClick={() => update(t, { is_active: !t.is_active })} style={miniBtn(th, t.is_active ? '#10b981' : '#64748b')}>{t.is_active ? 'Visible' : 'Hidden'}</button>
          <button onClick={() => remove(t)} style={miniBtn(th, '#ef4444')}>✕ Remove</button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Agent side: show an external tool inside the site                  */
/* ------------------------------------------------------------------ */
export function ExternalToolView({ toolId, DM }) {
  const [tool, setTool] = useState(undefined);
  useEffect(() => {
    api.get('/external-tools')
      .then(r => setTool((r.data || []).find(t => String(t.id) === String(toolId)) || null))
      .catch(() => setTool(null));
  }, [toolId]);

  if (tool === undefined) return <div style={{ color: DM.subText }}>Loading…</div>;
  if (!tool) return <div style={{ color: DM.subText }}>This tool is no longer available.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: 480 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: DM.text, flex: 1 }}>{tool.icon} {tool.name}</div>
        <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{
          padding: '7px 14px', borderRadius: 10, background: ORANGE, color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none',
        }}>Open in new tab ↗</a>
      </div>
      <iframe
        title={tool.name}
        src={tool.url}
        style={{ flex: 1, width: '100%', border: `1px solid ${DM.border}`, borderRadius: 14, background: '#fff' }}
        allow="clipboard-read; clipboard-write; fullscreen"
      />
      <div style={{ fontSize: 11.5, color: DM.subText, marginTop: 8 }}>
        If the page above stays blank, that website does not allow being shown inside another site — use “Open in new tab”.
      </div>
    </div>
  );
}
