import React, { useEffect, useState } from 'react';
import api from '../utils/api';

// Scripts & Processes, Hold & Unhold and KYC Platform Outputs pages,
// each available in English, Sorani (ku), Badini (ba) and Arabic (ar).
// Platform status labels on the KYC page intentionally stay in English
// because they are exactly what the agent sees on the platform.

const ORANGE = '#FF6B35';

const LANGS = [
  ['en', '🇬🇧 English'],
  ['ku', '☀️ سۆرانی'],
  ['ba', '🏔️ بادینی'],
  ['ar', '🌙 العربية'],
];


// Text shown on these pages can be edited by the team lead in Admin Panel → Page Content.
// If nothing was saved there, the built-in default below is used.
function usePageContent(key, fallback) {
  const [data, setData] = useState(fallback);
  useEffect(() => {
    let alive = true;
    api.get(`/page-content/${key}`)
      .then(r => { if (alive && r.data && r.data.data) setData(r.data.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [key]);
  return data;
}

const pick = (obj, lang) => (obj && (obj[lang] || obj.en)) || '';
const dirOf = (lang) => (lang === 'en' ? 'ltr' : 'rtl');

function LangBar({ lang, setLang, DM }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '12px', fontWeight: '700', color: DM.subText, marginInlineEnd: '4px' }}>🌐 Language</span>
      {LANGS.map(([l, lbl]) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: '7px 18px', borderRadius: '100px',
            border: `1.5px solid ${lang === l ? '#0B1120' : DM.border}`,
            background: lang === l ? '#0B1120' : DM.cardBg,
            fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
            color: lang === l ? '#fff' : DM.subText, transition: 'all .15s',
          }}
        >
          {lbl}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SCRIPTS                                                            */
/* ------------------------------------------------------------------ */

const SCRIPT_CARDS = [
  {
    t: {
      en: '👋 Greeting',
      ku: '👋 سڵاوکردن',
      ba: '👋 سلاڤکرن',
      ar: '👋 الترحيب',
    },
    s: {
      en: 'Good [morning/afternoon/evening], thank you for calling Runaki. My name is [name], how may I assist you today?',
      ku: '[بەیانی باش / نیوەڕۆ باش / ئێوارە باش]، سوپاس بۆ پەیوەندیکردن بە Runaki. ناوم [ناو]ە، چۆن دەتوانم ئەمڕۆ یارمەتیتان بدەم؟',
      ba: '[سپێدە باش / ڕۆژ باش / ئێڤار باش]، سوپاس بۆ پەیوەندیکرنا هەوە ب Runaki ڤە. ناڤێ من [ناڤ]ە، ئەز چاوا دشێم ئەڤرۆ یارمەتیا هەوە بکەم؟',
      ar: '[صباح الخير / مساء الخير]، شكراً لاتصالك بـ Runaki. معك [الاسم]، كيف يمكنني مساعدتك اليوم؟',
    },
  },
  {
    t: {
      en: '📋 Get User Info',
      ku: '📋 وەرگرتنی زانیاری کڕیار',
      ba: '📋 وەرگرتنا زانیارییێن کڕیاری',
      ar: '📋 الحصول على معلومات العميل',
    },
    s: {
      en: 'May I please have your name and account number to look up your account? Could you also tell me your location?',
      ku: 'تکایە ناو و ژمارەی هەژمارەکەتان پێ بفەرموون بۆ ئەوەی هەژمارەکەتان بدۆزمەوە؟ هەروەها تکایە شوێنەکەتان (لە کوێ دانیشتوون) پێم بڵێن؟',
      ba: 'ب خاترێ هەوە، ناڤ و ژمارا حسابا خوە بدەنە من دا کو ئەز حسابا هەوە بدۆزمەڤە؟ هەروەسا ب خاترێ هەوە شوێنێ خوە (هوین ل کیڤە دژین) ژ من ڕا بێژن؟',
      ar: 'هل يمكنني الحصول على اسمك ورقم حسابك للبحث عن حسابك؟ وهل يمكنك أيضاً إخباري بموقعك؟',
    },
  },
];

const CLOSING = {
  title: {
    en: '✅ Closing — 3 steps',
    ku: '✅ کۆتاییهێنانی پەیوەندی — 3 هەنگاو',
    ba: '✅ ب دوماهیک ئینانا پەیوەندیێ — 3 هەنگاڤ',
    ar: '✅ إنهاء المكالمة — 3 خطوات',
  },
  steps: [
    {
      label: {
        en: 'Step 1 · KYC / SMS check',
        ku: 'هەنگاوی 1 · پشکنینی KYC / SMS',
        ba: 'هەنگاڤا 1 · پشکنینا KYC / SMS',
        ar: 'الخطوة 1 · التحقق من KYC / الرسائل',
      },
      s: {
        en: 'Before we end the call, may I ask if you are receiving the SMS messages (the KYC messages) on your phone?',
        ku: 'پێش ئەوەی پەیوەندییەکە کۆتایی پێ بهێنین، دەتوانم بپرسم ئایا پەیامە کورتەکانی SMS (پەیامەکانی KYC) بۆ مۆبایلەکەتان دێن؟',
        ba: 'بەری ئەم پەیوەندیێ ب دوماهیک بینین، ئەز دشێم ژ هەوە بپرسم ئەرێ پەیامێن SMS (پەیامێن KYC) دگەهنە مۆبایلا هەوە؟',
        ar: 'قبل إنهاء المكالمة، هل لي أن أسألك إن كانت تصلك رسائل SMS (رسائل الـ KYC) على هاتفك؟',
      },
    },
    {
      label: {
        en: 'Step 2 · Further assistance',
        ku: 'هەنگاوی 2 · یارمەتیدانی زیاتر',
        ba: 'هەنگاڤا 2 · یارمەتیا زێدە',
        ar: 'الخطوة 2 · مساعدة إضافية',
      },
      s: {
        en: 'Is there anything else I can help you with today? Thank you for calling Runaki. Have a great day!',
        ku: 'ئایا هیچ شتێکی دیکە هەیە ئەمڕۆ یارمەتیتان تێدا بدەم؟ سوپاس بۆ پەیوەندیکردنتان بە Runaki. ڕۆژێکی خۆشتان هەبێت!',
        ba: 'ئەرێ تشتەکێ دی هەیە ئەڤرۆ ئەز یارمەتیا هەوە تێدا بکەم؟ سوپاس بۆ پەیوەندیکرنا هەوە ب Runaki ڤە. ڕۆژەکا خۆش بۆ هەوە!',
        ar: 'هل هناك أي شيء آخر يمكنني مساعدتك به اليوم؟ شكراً لاتصالك بـ Runaki. أتمنى لك يوماً سعيداً!',
      },
    },
    {
      label: {
        en: 'Step 3 · Rate the call',
        ku: 'هەنگاوی 3 · هەڵسەنگاندنی پەیوەندی',
        ba: 'هەنگاڤا 3 · هەلسەنگاندنا پەیوەندیێ',
        ar: 'الخطوة 3 · تقييم المكالمة',
      },
      s: {
        en: "Before you go, please don't forget to rate this call once it ends. Your feedback helps us serve you better.",
        ku: 'پێش ئەوەی کۆتایی بە پەیوەندییەکە بهێنین، تکایە لەبیرتان نەچێت دوای تەواوبوونی پەیوەندییەکە هەڵیبسەنگێنن. ڕای ئێوە یارمەتیمان دەدات خزمەتگوزارییەکی باشتر پێشکەش بکەین.',
        ba: 'بەری هوین بچن، ب خاترێ هەوە ژبیر نەکەن پشتی پەیوەندی ب دوماهیک دهێت هەلسەنگاندنێ بۆ ڤێ پەیوەندیێ بکەن. بۆچوونا هەوە یارمەتیا مە دکەت کو خزمەتگوزاریەکا باشتر پێشکێش بکەین.',
        ar: 'قبل أن تغلق الخط، يرجى عدم نسيان تقييم هذه المكالمة بعد انتهائها. رأيك يساعدنا على تقديم خدمة أفضل.',
      },
    },
  ],
};

export const SCRIPTS_DEFAULT = { cards: SCRIPT_CARDS, closing: CLOSING };

function ScriptCard({ title, text, lang, DM, accent = ORANGE, badge }) {
  return (
    <div style={{ background: DM.cardBg, borderRadius: '16px', padding: '20px 22px', border: `1px solid ${DM.border}`, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg,${accent},#ff9a6c)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        {badge && (
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: accent, color: '#fff', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{badge}</span>
        )}
        <div style={{ fontSize: '11px', fontWeight: '800', color: DM.text, textTransform: 'uppercase', letterSpacing: lang === 'en' ? '0.08em' : 0 }}>{title}</div>
      </div>
      <div style={{ fontSize: '14px', color: DM.subText, fontStyle: lang === 'en' ? 'italic' : 'normal', lineHeight: '1.9', borderInlineStart: `3px solid ${accent}`, paddingInlineStart: '14px' }}>
        “{text}”
      </div>
    </div>
  );
}

export function Scripts({ DM, lang, setLang }) {
  const content = usePageContent('scripts', SCRIPTS_DEFAULT);
  const SCRIPT_CARDS = content.cards || [];
  const CLOSING = content.closing || { title: {}, steps: [] };
  return (
    <div dir={dirOf(lang)}>
      <LangBar lang={lang} setLang={setLang} DM={DM} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '14px' }}>
        {SCRIPT_CARDS.map((c, i) => (
          <ScriptCard key={i} title={pick(c.t, lang)} text={pick(c.s, lang)} lang={lang} DM={DM} />
        ))}
      </div>

      <div style={{ margin: '28px 0 14px', fontSize: '15px', fontWeight: '800', color: DM.text }}>{pick(CLOSING.title, lang)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '14px' }}>
        {CLOSING.steps.map((st, i) => (
          <ScriptCard key={i} title={pick(st.label, lang)} text={pick(st.s, lang)} lang={lang} DM={DM} accent="#10b981" badge={String(i + 1)} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KYC PLATFORM OUTPUTS                                               */
/* ------------------------------------------------------------------ */

const KYC_INTRO = {
  title: {
    en: '📱 KYC Platform -- How to Handle',
    ku: '📱 پلاتفۆرمی KYC — چۆن مامەڵەی لەگەڵ بکەین',
    ba: '📱 پلاتفۆرما KYC — چاوا مامەلێ دگەل بکەین',
    ar: '📱 منصة KYC — كيفية التعامل',
  },
  text: {
    en: 'Whenever a customer has a KYC-related issue, always check their phone number in the system first, verify the KYC status, and ensure all details match before taking any further steps. This helps identify whether the issue is with the system, the BNF submission, or another stage of the process.',
    ku: 'هەرکاتێک کڕیارێک کێشەیەکی پەیوەست بە KYC ـی هەبوو، هەمیشە سەرەتا ژمارەی مۆبایلەکەی لە سیستەمدا بپشکنە، دۆخی KYC پشتڕاست بکەرەوە، و دڵنیابە لەوەی هەموو زانیارییەکان یەک دەگرنەوە پێش ئەوەی هیچ هەنگاوێکی دیکە بنێیت. ئەمە یارمەتی دەدات بزانرێت کێشەکە لە سیستەمەکەدایە، لە ناردنی BNF دایە، یان لە قۆناغێکی دیکەی پرۆسەکەدایە.',
    ba: 'هەر دەمەکێ کڕیارەکی گرفتەکا ب KYC ڤە گرێدایی هەبیت، هەردەم سەرەتا ژمارا مۆبایلا وی ل سیستەمی بپشکنە، دۆخێ KYC پشتڕاست بکە، و دلنیا ببە کو هەمی زانیاری وەک ئێک دهێن، بەری تو هەر هەنگاڤەکا دی هەلگری. ئەڤە یارمەتیێ ددەت کو بهێتە زانین گرفت ل سیستەمی یە، یان ل ناردنا BNF یە، یان ل قۆناغەکا دی یا پرۆسێسێ یە.',
    ar: 'عندما يواجه العميل مشكلة تتعلق بالـ KYC، تحقق دائماً أولاً من رقم هاتفه في النظام، وتأكد من حالة الـ KYC، وتأكد من تطابق جميع البيانات قبل اتخاذ أي خطوة أخرى. يساعد ذلك في معرفة ما إذا كانت المشكلة في النظام أو في تقديم الـ BNF أو في مرحلة أخرى من العملية.',
  },
};

const WAIT = {
  en: 'Still in process. Be patient and wait.',
  ku: 'هێشتا لە پرۆسەدایە. سەبر بگرە و چاوەڕێ بکە.',
  ba: 'هێشتا ل پرۆسێسێ دایە. خوە ڕاگرە و ڕاوەستە.',
  ar: 'ما زال قيد المعالجة. التزم بالصبر وانتظر.',
};
const RESOLVE = {
  en: 'Resolve the ticket.',
  ku: 'تیکێتەکە چارەسەر بکە.',
  ba: 'تیکێتی چارە بکە.',
  ar: 'قم بحل التذكرة.',
};

const KYC_STATUSES = [
  {
    status: '✅ Validated', color: '#16a34a', bg: '#f0fdf4',
    action: {
      en: 'No issues from the KYC team. Be patient and wait.',
      ku: 'هیچ کێشەیەک لە لایەن تیمی KYC نییە. سەبر بگرە و چاوەڕێ بکە.',
      ba: 'چ گرفت ژ تیمێ KYC نینن. خوە ڕاگرە و ڕاوەستە.',
      ar: 'لا توجد أي مشكلة من فريق الـ KYC. التزم بالصبر وانتظر.',
    },
    badge: RESOLVE,
  },
  { status: '🕐 KYC Not Started', color: '#6366f1', bg: '#eef2ff', action: WAIT, badge: RESOLVE },
  {
    status: '❌ Rejected', color: '#dc2626', bg: '#fef2f2',
    action: {
      en: 'Customer needs to re-submit their KYC.',
      ku: 'کڕیار پێویستە KYC ـەکەی دووبارە بنێرێتەوە.',
      ba: 'کڕیار دڤێت KYC یا خوە جارەکا دی بشێنیت.',
      ar: 'على العميل إعادة تقديم الـ KYC الخاص به.',
    },
    badge: RESOLVE,
  },
  { status: '🚩 Flagged', color: '#d97706', bg: '#fffbeb', action: WAIT, badge: RESOLVE },
  {
    status: '📋 KYC Not Submitted', color: '#8b5cf6', bg: '#f5f3ff',
    action: {
      en: 'Under validation process. Be patient and wait.',
      ku: 'لە پرۆسەی پشتڕاستکردنەوەدایە. سەبر بگرە و چاوەڕێ بکە.',
      ba: 'ل پرۆسێسا پشتڕاستکرنێ دایە. خوە ڕاگرە و ڕاوەستە.',
      ar: 'قيد عملية التحقق. التزم بالصبر وانتظر.',
    },
    badge: RESOLVE,
  },
  {
    status: '⚙️ Pending Mechanical Meter Update', color: '#ea580c', bg: '#fff7ed',
    action: {
      en: 'BNF submitted a Mechanical meter instead of a bill.',
      ku: 'BNF مەتەری میکانیکی ناردووە لەبری فاتورە.',
      ba: 'BNF مەتەرەکێ میکانیکی هنارتییە ب جهێ فاتورەیێ.',
      ar: 'قام الـ BNF بتقديم عدّاد ميكانيكي بدلاً من الفاتورة.',
    },
    badge: {
      en: 'Escalate to BNF team.',
      ku: 'بیگەیەنە تیمی BNF.',
      ba: 'بگەهینە تیمێ BNF.',
      ar: 'قم بالتصعيد إلى فريق BNF.',
    },
  },
  {
    status: '🔍 Number Not Found in Sheet', color: '#64748b', bg: '#f8fafc',
    action: {
      en: "BNF has not KYC'd with this phone number.",
      ku: 'BNF بەم ژمارە مۆبایلە KYC ـی نەکردووە.',
      ba: 'BNF ب ڤێ ژمارا مۆبایلێ KYC نەکریە.',
      ar: 'لم يقم الـ BNF بإجراء الـ KYC بهذا الرقم.',
    },
    badge: {
      en: 'Verify with customer.',
      ku: 'لەگەڵ کڕیار پشتڕاستی بکەرەوە.',
      ba: 'دگەل کڕیاری پشتڕاست بکە.',
      ar: 'تحقق من الأمر مع العميل.',
    },
  },
];

export const KYC_DEFAULT = { intro: KYC_INTRO, statuses: KYC_STATUSES };

export function KYCPlatform({ darkMode, DM, lang, setLang }) {
  const content = usePageContent('kyc', KYC_DEFAULT);
  const KYC_INTRO = content.intro || { title: {}, text: {} };
  const KYC_STATUSES = content.statuses || [];
  return (
    <div dir={dirOf(lang)}>
      <LangBar lang={lang} setLang={setLang} DM={DM} />
      <div style={{ background: darkMode ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05))' : 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1px solid #6366f130', borderRadius: '18px', padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: '800', color: '#6366f1', marginBottom: '8px' }}>{pick(KYC_INTRO.title, lang)}</div>
        <div style={{ fontSize: '13.5px', color: DM.subText, lineHeight: '1.9' }}>{pick(KYC_INTRO.text, lang)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
        {KYC_STATUSES.map((s, i) => (
          <div key={i} style={{ background: DM.cardBg, borderRadius: '16px', overflow: 'hidden', border: `1.5px solid ${s.color}30`, boxShadow: `0 4px 16px ${s.color}12` }}>
            <div style={{ background: darkMode ? `${s.color}15` : s.bg, padding: '14px 18px', borderBottom: `1px solid ${s.color}20` }}>
              {/* platform output label: always English, always left-to-right */}
              <div dir="ltr" style={{ fontSize: '15px', fontWeight: '800', color: s.color, textAlign: lang === 'en' ? 'left' : 'right' }}>{s.status}</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '13.5px', color: DM.text, lineHeight: '1.8', marginBottom: '10px' }}>{pick(s.action, lang)}</div>
              <div style={{ display: 'inline-block', background: `${s.color}15`, color: s.color, fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '100px', border: `1px solid ${s.color}30` }}>
                {pick(s.badge, lang)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HOLD & UNHOLD                                                      */
/* ------------------------------------------------------------------ */

const HOLD_INTRO = {
  title: {
    en: '📞 Hold & Unhold -- Professional Standards',
    ku: '📞 هۆڵد و گەڕانەوە لە هۆڵد — ستانداردە پیشەییەکان',
    ba: '📞 هۆڵد و زڤڕین ژ هۆڵدێ — ستانداردێن پیشەیی',
    ar: '📞 الانتظار وإنهاء الانتظار — المعايير المهنية',
  },
  text: {
    en: 'Placing a customer on hold should be done professionally by informing them first, ensuring hold music plays, and apologizing when returning to the call.',
    ku: 'دانانی کڕیار لەسەر هۆڵد دەبێت بە شێوەیەکی پیشەیی ئەنجام بدرێت: سەرەتا ئاگادارکردنەوەی کڕیار، دڵنیابوون لەوەی مۆسیقای هۆڵد کار دەکات، و داوای لێبوردن لە کاتی گەڕانەوە بۆ پەیوەندییەکە.',
    ba: 'دانانا کڕیاری ل سەر هۆڵد دڤێت ب شێوەیەکێ پیشەیی بهێتە کرن: سەرەتا کڕیاری ئاگەهدار بکە، دلنیا ببە کو مۆسیقایا هۆڵدێ لێ دهێت، و دەمێ تو ڤەدگەڕی سەر پەیوەندیێ داخوازا ببوورتنێ بکە.',
    ar: 'يجب وضع العميل على الانتظار بشكل مهني: بإبلاغه أولاً، والتأكد من تشغيل موسيقى الانتظار، والاعتذار عند العودة إلى المكالمة.',
  },
};

const HOLD_STEPS = [
  {
    color: '#6366f1', icon: '🎙️',
    phase: {
      en: '1 -- Pre-Hold', ku: '1 — پێش هۆڵد', ba: '1 — بەری هۆڵدێ', ar: '1 — قبل الانتظار',
    },
    title: {
      en: 'Before placing on hold',
      ku: 'پێش دانانی کڕیار لەسەر هۆڵد',
      ba: 'بەری دانانا کڕیاری ل سەر هۆڵدێ',
      ar: 'قبل وضع العميل على الانتظار',
    },
    desc: {
      en: 'Before placing the customer on hold, clearly inform them and explain the reason using the approved pre-hold script.',
      ku: 'پێش ئەوەی کڕیار لەسەر هۆڵد دابنێیت، بە ڕوونی ئاگاداری بکەرەوە و هۆکارەکە بە بەکارهێنانی سکریپتی پەسەندکراوی پێش هۆڵد ڕوون بکەرەوە.',
      ba: 'بەری تو کڕیاری ل سەر هۆڵدێ دانی، ب ڕوونی ئاگەهدار بکە و ئەگەرێ وێ چەندێ ب کارئینانا سکریپتا پەسەندکری یا بەری هۆڵدێ ڕوون بکە.',
      ar: 'قبل وضع العميل على الانتظار، أبلغه بوضوح واشرح السبب باستخدام النص المعتمد لما قبل الانتظار.',
    },
    script: {
      en: '"I need to place you on a brief hold while I look into this for you. It should take no more than 1 minute. Is that okay?"',
      ku: '«پێویستە بۆ ماوەیەکی کەم لەسەر هۆڵد دابنێمتان تا ئەمە بۆتان بپشکنم. زیاتر لە 1 خولەک ناخایەنێت. ئایا گونجاوە؟»',
      ba: '«پێدڤییە ئەز هەوە بۆ دەمەکێ کورت ل سەر هۆڵدێ دانم هەتا ئەز ڤێ چەندێ بۆ هەوە پشکنین دکەم. پتر ژ 1 خولەکێ ناخایەنیت. ئەرێ ئاساییە؟»',
      ar: '«أحتاج إلى وضعك على الانتظار لوقت قصير بينما أتحقق من الأمر لك. لن يستغرق ذلك أكثر من دقيقة واحدة. هل هذا مناسب؟»',
    },
    rules: [
      {
        en: 'Always inform the customer before holding',
        ku: 'هەمیشە پێش هۆڵد کڕیار ئاگادار بکەرەوە',
        ba: 'هەردەم بەری هۆڵدێ کڕیاری ئاگەهدار بکە',
        ar: 'أبلغ العميل دائماً قبل وضعه على الانتظار',
      },
      {
        en: 'Explain the reason clearly',
        ku: 'هۆکارەکە بە ڕوونی ڕوون بکەرەوە',
        ba: 'ئەگەرێ وێ چەندێ ب ڕوونی ڕوون بکە',
        ar: 'اشرح السبب بوضوح',
      },
      {
        en: 'Get their agreement first',
        ku: 'سەرەتا ڕەزامەندی وەربگرە',
        ba: 'سەرەتا ڕازیبوونا وی وەربگرە',
        ar: 'احصل على موافقته أولاً',
      },
    ],
  },
  {
    color: '#f59e0b', icon: '⏸️',
    phase: {
      en: '2 -- During Hold', ku: '2 — لە کاتی هۆڵد', ba: '2 — د دەمێ هۆڵدێ دا', ar: '2 — أثناء الانتظار',
    },
    title: {
      en: 'While customer is on hold',
      ku: 'کاتێک کڕیار لەسەر هۆڵدە',
      ba: 'دەمێ کڕیار ل سەر هۆڵدێ یە',
      ar: 'أثناء وجود العميل على الانتظار',
    },
    desc: {
      en: 'The call must be placed on hold -- not muted -- so that hold music plays for the customer.',
      ku: 'پەیوەندییەکە دەبێت لەسەر هۆڵد دابنرێت — نەک بێدەنگ بکرێت — بۆ ئەوەی مۆسیقای هۆڵد بۆ کڕیار کار بکات.',
      ba: 'پەیوەندی دڤێت ل سەر هۆڵدێ بهێتە دانان — نە کو بێدەنگ بهێتە کرن — دا کو مۆسیقایا هۆڵدێ بۆ کڕیاری لێ بیت.',
      ar: 'يجب وضع المكالمة على الانتظار (Hold) — وليس كتم الصوت — حتى تُسمع موسيقى الانتظار للعميل.',
    },
    script: null,
    rules: [
      {
        en: 'Use the HOLD button -- never mute the call',
        ku: 'دوگمەی HOLD بەکاربهێنە — هەرگیز پەیوەندییەکە بێدەنگ مەکە',
        ba: 'دوگمەیا HOLD ب کار بینە — چ جاران پەیوەندیێ بێدەنگ نەکە',
        ar: 'استخدم زر HOLD — لا تكتم المكالمة أبداً',
      },
      {
        en: 'Hold music must play for the customer',
        ku: 'دەبێت مۆسیقای هۆڵد بۆ کڕیار کار بکات',
        ba: 'دڤێت مۆسیقایا هۆڵدێ بۆ کڕیاری لێ بیت',
        ar: 'يجب أن تُسمع موسيقى الانتظار للعميل',
      },
      {
        en: 'Check back every 1 minute if hold is longer',
        ku: 'ئەگەر هۆڵد درێژتر بوو، هەر 1 خولەک جارێک بگەڕێوە بۆ لای کڕیار',
        ba: 'ئەگەر هۆڵد درێژتر بیت، هەر 1 خولەکێ جارەکێ ڤەگەڕە دەڤ کڕیاری',
        ar: 'إذا طال الانتظار، عُد إلى العميل كل 1 دقيقة',
      },
    ],
  },
  {
    color: '#10b981', icon: '▶️',
    phase: {
      en: '3 -- Post-Hold', ku: '3 — دوای هۆڵد', ba: '3 — پشتی هۆڵدێ', ar: '3 — بعد الانتظار',
    },
    title: {
      en: 'Returning from hold',
      ku: 'گەڕانەوە لە هۆڵد',
      ba: 'زڤڕین ژ هۆڵدێ',
      ar: 'العودة من الانتظار',
    },
    desc: {
      en: 'After returning, use the approved post-hold script, apologize for the wait, and continue assisting professionally.',
      ku: 'دوای گەڕانەوە، سکریپتی پەسەندکراوی دوای هۆڵد بەکاربهێنە، داوای لێبوردن بکە بۆ چاوەڕێکردنەکە، و بە شێوەیەکی پیشەیی بەردەوام بە لە یارمەتیدان.',
      ba: 'پشتی ڤەگەڕینێ، سکریپتا پەسەندکری یا پشتی هۆڵدێ ب کار بینە، بۆ چاوەڕێکرنێ داخوازا ببوورتنێ بکە، و ب شێوەیەکێ پیشەیی یارمەتیێ بەردەوام بکە.',
      ar: 'بعد العودة، استخدم النص المعتمد لما بعد الانتظار، واعتذر عن الانتظار، وواصل مساعدة العميل بشكل مهني.',
    },
    script: {
      en: '"Thank you for holding, [customer name]. I have the information you need. I apologize for the wait."',
      ku: '«سوپاس بۆ چاوەڕێکردنتان، [ناوی کڕیار]. ئەو زانیارییەم دۆزییەوە کە پێویستتانە. لێبوردن بۆ چاوەڕێکردنەکە.»',
      ba: '«سوپاس بۆ چاوەڕێکرنا هەوە، [ناڤێ کڕیاری]. ئەو زانیاری یێن هەوە پێدڤی پێ هەنە من دیتینە. ببوورن بۆ چاوەڕێکرنێ.»',
      ar: '«شكراً لانتظارك، [اسم العميل]. لدي المعلومات التي تحتاجها. أعتذر عن الانتظار.»',
    },
    rules: [
      {
        en: 'Always thank the customer for holding',
        ku: 'هەمیشە سوپاسی کڕیار بکە بۆ چاوەڕێکردنەکە',
        ba: 'هەردەم سوپاسیا کڕیاری بکە بۆ چاوەڕێکرنێ',
        ar: 'اشكر العميل دائماً على انتظاره',
      },
      {
        en: 'Apologize for the wait time',
        ku: 'داوای لێبوردن بکە بۆ ماوەی چاوەڕێکردنەکە',
        ba: 'بۆ دەمێ چاوەڕێکرنێ داخوازا ببوورتنێ بکە',
        ar: 'اعتذر عن مدة الانتظار',
      },
      {
        en: 'Use their name when returning',
        ku: 'کاتی گەڕانەوە ناوی کڕیار بەکاربهێنە',
        ba: 'دەمێ ڤەدگەڕی ناڤێ کڕیاری ب کار بینە',
        ar: 'استخدم اسمه عند العودة',
      },
    ],
  },
];

export const HOLD_DEFAULT = { intro: HOLD_INTRO, steps: HOLD_STEPS };

export function HoldUnhold({ darkMode, DM, lang, setLang }) {
  const content = usePageContent('hold', HOLD_DEFAULT);
  const HOLD_INTRO = content.intro || { title: {}, text: {} };
  const HOLD_STEPS = content.steps || [];
  return (
    <div dir={dirOf(lang)}>
      <LangBar lang={lang} setLang={setLang} DM={DM} />
      <div style={{ background: darkMode ? 'rgba(99,102,241,0.1)' : '#eef2ff', border: '1px solid #6366f130', borderRadius: '18px', padding: '18px 22px', marginBottom: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', color: '#6366f1', marginBottom: '6px' }}>{pick(HOLD_INTRO.title, lang)}</div>
        <div style={{ fontSize: '13px', color: DM.subText, lineHeight: '1.9' }}>{pick(HOLD_INTRO.text, lang)}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {HOLD_STEPS.map((step, i) => (
          <div key={i} style={{ background: DM.cardBg, borderRadius: '18px', overflow: 'hidden', border: `1.5px solid ${step.color}30`, boxShadow: `0 4px 20px ${step.color}12` }}>
            <div style={{ background: `linear-gradient(135deg,${step.color}20,${step.color}08)`, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: `1px solid ${step.color}20` }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `linear-gradient(135deg,${step.color},${step.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, boxShadow: `0 4px 12px ${step.color}40` }}>{step.icon}</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: step.color, textTransform: 'uppercase', letterSpacing: lang === 'en' ? '0.1em' : 0 }}>{pick(step.phase, lang)}</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: DM.text, marginTop: '2px' }}>{pick(step.title, lang)}</div>
              </div>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <div style={{ fontSize: '13.5px', color: DM.subText, lineHeight: '1.9', marginBottom: '14px' }}>{pick(step.desc, lang)}</div>
              {step.script && (
                <div style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: `2px solid ${step.color}30`, borderInlineStart: `4px solid ${step.color}`, borderRadius: '10px', padding: '12px 16px', fontSize: '13.5px', color: DM.text, fontStyle: lang === 'en' ? 'italic' : 'normal', lineHeight: '1.9', marginBottom: '14px' }}>
                  {pick(step.script, lang)}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {step.rules.map((r, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `${step.color}12`, border: `1px solid ${step.color}25`, borderRadius: '8px', padding: '5px 12px' }}>
                    <span style={{ color: step.color, fontSize: '10px' }}>✓</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: DM.text }}>{pick(r, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}