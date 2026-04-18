/* eslint-disable */
import React, { useState } from 'react';

const NAVY  = '#0B1120';
const ORANGE = '#FF6B35';
const KANI_COLOR   = '#3b82f6';
const NEWROZ_COLOR = '#10b981';

const AREAS = [
  // ── KANI ──────────────────────────────────────────────────────
  { unit:'Kani', feeder:'M.Ankawa 4', neighborhood:'نازناز / Mala Omerra', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'M.Ankawa 6', neighborhood:'نازناز', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Park 7', neighborhood:'نازناز', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 1', neighborhood:'بەختیارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 11', neighborhood:'بەختیارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'M.Ankawa 2', neighborhood:'وەزیران - بەختیارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 17', neighborhood:'فەرمانگە - بەختیارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 21', neighborhood:'Zaga Mall', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 24', neighborhood:'Star Tower', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 25', neighborhood:'نوسەران - حاکماوە', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran H1', neighborhood:'Boulevard', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran H15', neighborhood:'Gulan Tower', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Park 2', neighborhood:'Bakhtyary', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Park 6', neighborhood:'Zakarya - Naz City', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Park 11', neighborhood:'دریم ستى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Park 14', neighborhood:'وەزیران - بەختیارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Park 13', neighborhood:'وەزیران - بەختیارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 2 (Zone 5)', neighborhood:'فەرمانگە میریەکان - بەختیارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Glkand 2', neighborhood:'شەقامى پزیشکان - Mstawfi', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 2 (Zone 7)', neighborhood:'بەردەوام بەختیارى - منارە', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nishtiman 4', neighborhood:'عەرەبى نوێ پشت هۆتێڵ پاندا', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 6', neighborhood:'گەرەکى منارە', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Shorsh 1', neighborhood:'گەڕەکى کەناسان', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Shorsh 10', neighborhood:'مصتۆفى - تەیراوا', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Shorsh 11', neighborhood:'فەرمانگە - پارێزگا - قایم قام', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Shorsh 12', neighborhood:'تەیراوە - Mstawfi', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 3', neighborhood:'تەیراوە - ٦٠مەترى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 13', neighborhood:'تەیراوە مزگەوتى شێخ مەلا رشید', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 15', neighborhood:'تەیراوە - Mstawfi', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 27', neighborhood:'تەیراوە بەرامبەر حمام سیروان', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 4', neighborhood:'نوسەران - Sallahaddin', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 9', neighborhood:'سەرۆکایەتى هەرێم', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 10', neighborhood:'صلاح الدین ٦٠ مەترى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Park 12', neighborhood:'پرۆژەى ئاو - فرۆکەخانە', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 2', neighborhood:'صلاح الدین مزگەوتى حاجى سەنیە', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 7', neighborhood:'حاکماوە', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran H14', neighborhood:'کواترۆ تاوەر', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran H5', neighborhood:'سکاى تاوەر', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 22', neighborhood:'Middle East - Haval School', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 23', neighborhood:'نوسەران - حاکماوە', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Bakoor k10', neighborhood:'گەڕەکى شۆرش - بنکەى هێلینا', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Bakoor k14', neighborhood:'گەڕەکى شۆرش', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Bakoor k15', neighborhood:'دارزیافە', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Bakoor k6', neighborhood:'نەخۆشخانەى ڕاپرین و لەدایک بوون', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 7', neighborhood:'گەڕەکى کوێستان', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 13', neighborhood:'شەقامى سورچیان', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Kori 14', neighborhood:'گەرەکى کوێستان - فەرمانگەکان 40 مەترى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 4', neighborhood:'گەڕەکى ئارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 6', neighborhood:'گەڕەکى کوێستان', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 14', neighborhood:'شەقامى سورچیان گەڕەکى شۆرش', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 18', neighborhood:'گەڕەکى علماء', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 26', neighborhood:'فەرنگەو - گەڕەگى شۆرش', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Pirzin 21', neighborhood:'گەڕەکى ئارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Pirzin 22', neighborhood:'فەرمانگەکان - شەقامى 100 مەترى - حەفتە بازاڕ', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Pirzin 23', neighborhood:'گەڕەکى کوێستان', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Shorsh 2', neighborhood:'گەڕەکى شۆرش و کوێستان', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Shorsh 3', neighborhood:'گەڕەکى علماء', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Shorsh 4', neighborhood:'شۆرش و گەڕەکى ئارى', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Shorsh 5', neighborhood:'گەڕەگى شۆرش', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Shorsh 8', neighborhood:'Royal Mall - Jalil - Xayat Mosque', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'M.Snaha 1', neighborhood:'بەنزینخانەی نۆرس - کۆگای هۆشمەند - بێرکۆت', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 9', neighborhood:'Khoshnaw Tower', phone:'07518064356 / 07518064357' },
  { unit:'Kani', feeder:'Nusaran 1', neighborhood:'Zaga Mall', phone:'07518064356 / 07518064357' },

  // ── NEWROZ ────────────────────────────────────────────────────
  { unit:'Newroz', feeder:'M.Ankawa 3', neighborhood:'Garaki 32', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Park 1', neighborhood:'Zeravani - Mosul Road', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Park 4', neighborhood:'Part of 32 Park', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Park 9', neighborhood:'English Village', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa H12', neighborhood:'Roya Tower', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-2', neighborhood:'PMO + Parliament', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-3', neighborhood:'Part of 32', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-4', neighborhood:'MRF 100m - Vital - Wave Avenue - Iqama', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-6', neighborhood:'Sarbasty - Part of 32', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-7', neighborhood:'Part of 32', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-9', neighborhood:'Rotana', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F11', neighborhood:'خانووەکانی ئیمپایەری', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-12', neighborhood:'Italian Village 1', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-13', neighborhood:'Part of 32', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-14', neighborhood:'Part of 32', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Azadi 2', neighborhood:'Hary Kon - Old Har', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Azadi 17', neighborhood:'Hary Kon - Old Har', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nasij 2', neighborhood:'Rzgary 1', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nasij 3', neighborhood:'Nawxo Asaysh', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nasij 8', neighborhood:'Nasij', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 5', neighborhood:'Kurdistan', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 7', neighborhood:'Rzgary 1 & 2 - Kuran - Aln', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 10', neighborhood:'Kurdistan', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 11', neighborhood:'Kurdistan', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 12', neighborhood:'Kuran - Aln - Riz 1 & 2', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa 2', neighborhood:'Kurdistan', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Shadi 13', neighborhood:'Har (Krekaran)', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Zanyari 12', neighborhood:'Kurdistan', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Zanyari 19', neighborhood:'Kurdistan', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nasij 4', neighborhood:'Coca Cola Company', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nasij 6', neighborhood:'Sina3i Area', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 1', neighborhood:'نەورۆز (بەشێک)', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 2', neighborhood:'بازاری نەورۆز', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 3', neighborhood:'نشتیمان', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 4', neighborhood:'نەخۆشخانەی پاکی - نەورۆز', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 6', neighborhood:'نشتیمان (بەشێک)', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 8', neighborhood:'نەسیراوە (بەشێک)', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nawroz 9', neighborhood:'نشتیمان - بیرە ئاوەکان', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa 4', neighborhood:'نەورۆز (بەشێک)', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa 5', neighborhood:'Parezgay Nwe - منارە', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa 12', neighborhood:'ماردین - Karty 55', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa 13', neighborhood:'قەیرەتا - bnberza (villages)', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa 14', neighborhood:'دادگای هەولێر - جنسیە و نفووس', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa 15', neighborhood:'نێرگز', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa 16', neighborhood:'کۆلێژی تیشک - WoW Tower - بانکی جیهان', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa 22', neighborhood:'کۆلێژی جیهان - پێشانگاکانی ئۆتۆمبێل', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-1', neighborhood:'منارە (بەشێک) - نیشتمان', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F-5', neighborhood:'نشتیمان', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Shadi 3', neighborhood:'نەورۆز (بەشێک) نەسیراوا', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Shadi 4', neighborhood:'نێرگز (بەشێک)', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Zanyari Nawroz', neighborhood:'بانکی نەورۆز - بیری یاوەکانی ئازادی', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Glkand 3', neighborhood:'زانیاری', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Glkand 4', neighborhood:'مزگەوتی سەواف - پارکی منارە - زانکۆی کوردستان', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Glkand 6', neighborhood:'شەقامی سوڵتان موزەفەر - منارە', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Glkand 10', neighborhood:'بازاری باتا - چۆلی - سولتان موزەفەر', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nishtiman 3', neighborhood:'منارە', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nishtiman 2', neighborhood:'Kotry Salam - Ase Asan', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Nishtiman 5', neighborhood:'فەرمانگە میریەکان - Garaki Minara', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F10', neighborhood:'گوندی قەریەتاخ - بیری کشتوکاڵی', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F17', neighborhood:'ئالان ستی - نەورۆز ستی', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F18', neighborhood:'کۆمەڵگەی نەورۆز ستی - کارگەی پیستە', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F19', neighborhood:'کارگەی غاز - مەیدانی ئاژەڵان', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F20', neighborhood:'گوندی سوێری - عارەب کەند', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F21', neighborhood:'بەشێک لە توڕەق - باغلو منارە', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F23', neighborhood:'کانی قرژالە - بەشێک لە ڕێگای موسڵ', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F24', neighborhood:'بەشێک لە توڕەق', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F6', neighborhood:'کۆلێژی تیشک', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F7', neighborhood:'کۆگاکانی ڕێگای گوێڕ - گرتوخانەی محتە', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F8', neighborhood:'بیری ئاوی توڕەق - کۆمپانیای تۆیۆتا', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F9', neighborhood:'کەمپی دیڤان - تابخانەی بەریتانی', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa H2', neighborhood:'Ramada Hotel - KAR Company', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Sarbasti F10', neighborhood:'فوجی5 - گومرگ - سەر ڕێگای سێبیران - کانی قرژاڵە', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Rojawa F13', neighborhood:'یارمجە - قەریەتاخ', phone:'07518064341 / 07518064949' },
  { unit:'Newroz', feeder:'Zanyari 20', neighborhood:'Zanyari', phone:'07518064341 / 07518064949' },
];

const CHECKLIST = [
  "Customer's full name, phone number, account number, block ID, meter ID",
  "Area and full address of the location",
  "Description of the issue — did the maintenance team visit?",
  "One customer issue or whole neighborhood?",
  "Smart meter or mechanical meter?",
  "Duration of outage — how many hours without electricity?",
];

export default function MaintenanceLookup({ darkMode }) {
  const [search, setSearch] = useState('');
  const [checked, setChecked] = useState({});

  const dm = darkMode;
  const bg     = dm ? '#080e18'   : '#f0f4ff';
  const card   = dm ? '#0f1623'   : '#fff';
  const border = dm ? 'rgba(255,255,255,0.07)' : '#e2e8f0';
  const text   = dm ? '#f1f5f9'   : NAVY;
  const sub    = dm ? 'rgba(255,255,255,0.45)' : '#64748b';

  const q = search.toLowerCase().trim();
  const results = q.length < 1 ? [] : AREAS.filter(a =>
    a.feeder.toLowerCase().includes(q) ||
    a.neighborhood.toLowerCase().includes(q) ||
    a.unit.toLowerCase().includes(q)
  ).slice(0, 15);

  const toggle = i => setChecked(p => ({ ...p, [i]: !p[i] }));
  const allDone = CHECKLIST.every((_, i) => checked[i]);

  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'14px', height:'100%', overflowY:'auto' }}>

      {/* HEADER */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:`linear-gradient(135deg,${KANI_COLOR},${NEWROZ_COLOR})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>🔧</div>
        <div>
          <div style={{ fontSize:'14px', fontWeight:'800', color:text }}>Maintenance Lookup</div>
          <div style={{ fontSize:'11px', color:sub }}>Kani & Newroz areas</div>
        </div>
      </div>

      {/* SEARCH */}
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'15px' }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search area, feeder, neighborhood..."
          style={{
            width:'100%', padding:'10px 12px 10px 36px',
            border:`1.5px solid ${q && results.length===0 ? '#ef4444' : border}`,
            borderRadius:'10px', fontSize:'13px', fontFamily:'inherit', outline:'none',
            background: dm?'rgba(255,255,255,0.05)':card,
            color:text, boxSizing:'border-box',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:sub, fontSize:'16px' }}>✕</button>
        )}
      </div>

      {/* RESULTS */}
      {q.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {results.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'#ef4444', fontSize:'13px', fontWeight:'600' }}>
              ❌ No area found — check the feeder name or neighborhood
            </div>
          ) : results.map((a, i) => {
            const isKani = a.unit === 'Kani';
            const col = isKani ? KANI_COLOR : NEWROZ_COLOR;
            return (
              <div key={i} style={{ background:card, border:`1px solid ${col}40`, borderRadius:'12px', padding:'12px 14px', borderLeft:`4px solid ${col}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                  <span style={{ fontSize:'13px', fontWeight:'900', color:col }}>
                    {isKani ? '🔵 KANI' : '🟢 NEWROZ'}
                  </span>
                  <span style={{ fontSize:'10px', fontWeight:'700', background:`${col}15`, color:col, padding:'2px 8px', borderRadius:'100px', border:`1px solid ${col}30` }}>
                    {a.feeder}
                  </span>
                </div>
                <div style={{ fontSize:'13px', color:text, fontWeight:'600', marginBottom:'4px' }}>📍 {a.neighborhood}</div>
                <div style={{ fontSize:'11px', color:sub }}>
                  📞 <span style={{ fontFamily:'monospace', letterSpacing:'0.03em' }}>{a.phone}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EMPTY STATE */}
      {q.length === 0 && (
        <div style={{ display:'flex', gap:'8px' }}>
          <div style={{ flex:1, background:`${KANI_COLOR}15`, border:`1px solid ${KANI_COLOR}30`, borderRadius:'10px', padding:'10px', textAlign:'center' }}>
            <div style={{ fontSize:'16px', fontWeight:'900', color:KANI_COLOR }}>{AREAS.filter(a=>a.unit==='Kani').length}</div>
            <div style={{ fontSize:'10px', color:KANI_COLOR, fontWeight:'700' }}>KANI Areas</div>
          </div>
          <div style={{ flex:1, background:`${NEWROZ_COLOR}15`, border:`1px solid ${NEWROZ_COLOR}30`, borderRadius:'10px', padding:'10px', textAlign:'center' }}>
            <div style={{ fontSize:'16px', fontWeight:'900', color:NEWROZ_COLOR }}>{AREAS.filter(a=>a.unit==='Newroz').length}</div>
            <div style={{ fontSize:'10px', color:NEWROZ_COLOR, fontWeight:'700' }}>NEWROZ Areas</div>
          </div>
        </div>
      )}

      {/* CHECKLIST */}
      <div style={{ background:card, border:`1.5px solid ${allDone ? '#10b981' : border}`, borderRadius:'12px', padding:'14px', transition:'border-color 0.3s' }}>
        <div style={{ fontSize:'12px', fontWeight:'800', color:allDone?'#10b981':ORANGE, marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
          {allDone ? '✅ All info collected — ready to pending!' : '📋 Info to collect before pending'}
        </div>
        {CHECKLIST.map((item, i) => (
          <div key={i} onClick={() => toggle(i)} style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'5px 0', cursor:'pointer', borderBottom: i < CHECKLIST.length-1 ? `1px solid ${border}`:'' }}>
            <div style={{ width:'18px', height:'18px', borderRadius:'5px', border:`2px solid ${checked[i]?'#10b981':border}`, background:checked[i]?'#10b981':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px', transition:'all 0.2s' }}>
              {checked[i] && <span style={{ color:'#fff', fontSize:'11px', fontWeight:'900' }}>✓</span>}
            </div>
            <span style={{ fontSize:'12px', color:checked[i]?'#10b981':sub, textDecoration:checked[i]?'line-through':'none', lineHeight:'1.4', transition:'all 0.2s' }}>{item}</span>
          </div>
        ))}
        {Object.values(checked).some(Boolean) && (
          <button onClick={() => setChecked({})} style={{ marginTop:'10px', fontSize:'11px', color:sub, background:'none', border:'none', cursor:'pointer', textDecoration:'underline', fontFamily:'inherit' }}>
            Reset checklist
          </button>
        )}
      </div>

    </div>
  );
}