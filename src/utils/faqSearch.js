// Free, in-browser FAQ search used by BOTH the top search bar and the Runaki AI Assistant.
// No API, no cost, no data leaves the browser.
//
// What it does better than a plain "includes" search:
//  1. Key terms (the Excel "Key terms (search)" column, stored in faq.tags) are a first-class,
//     high-weight field, together with the FAQ id ("FAQ13") and the assigned team.
//  2. Spelling variants of Kurdish / Arabic letters are folded together, so ي = ی, ك = ک,
//     ة = ه = ە, ڤ = ف, Arabic-Indic digits = 0-9, and diacritics / tatweel / ZWNJ are ignored.
//  3. Words are matched whole, by prefix ("disconnect" finds "disconnected") and with
//     one-letter typo tolerance ("recieved" finds "received").
//  4. Rare words count for more than common ones (IDF), so "maqtu3" outranks "customer".
//  5. A small synonym list (English + the local words agents actually say).
//  6. Results are ranked: question and key terms count most, the answer text least.

const STOP = new Set((
  'a an the and or of to in on at for with is are was were be been it this that these those ' +
  'i me my we our you your he she they them his her their what which who whom how why when where ' +
  'do does did can could should would will shall may might must have has had not no yes if then ' +
  'than so as by from about into out up down over under again also very just please tell say ' +
  'ku ba ar ' +
  // "what is X?" in other words: Latin Kurdish, Sorani and Arabic question words
  'whats meaning mean means chiya chiye chye cheya chiyah چییه چیه چی ما هو هی ماذا ایش شو یعنی معنی مانای'
).split(' '));

// Groups of words that mean the same thing. First word of a group is the canonical one.
export const SYNONYM_GROUPS = [
  ['pay', 'paid', 'payment', 'payments', 'paying', 'paymnt', 'pai'],
  ['bill', 'billing', 'invoice', 'charge', 'charged', 'fatura', 'فاتورە', 'فاتوره', 'فاتورة'],
  ['disconnect', 'disconnected', 'disconnection', 'cut', 'cutoff', 'cuts', 'outage', 'blackout', 'maqtu3', 'maqtu', 'maqtoo3', 'maqtou3', 'مقطوع'],
  ['electricity', 'power', 'electric', 'current', 'کارەبا', 'کهربا', 'كهرباء', 'کهرباء'],
  ['kyc', 'registration', 'register', 'registered', 'verify', 'verification', 'validate', 'validated', 'validation'],
  ['meter', 'counter', 'mitr', 'عداد', 'مەتەر', 'مەتر'],
  ['balance', 'debt', 'debts', 'arrears', 'owed', 'owe', 'outstanding', 'unpaid', 'dues'],
  ['tariff', 'rate', 'rates', 'price', 'prices', 'pricing', 'cost'],
  ['app', 'application', 'mobile'],
  ['high', 'expensive', 'large', 'big', 'huge'],
  ['refund', 'reimburse', 'reimbursement', 'moneyback'],
  ['complaint', 'complain', 'issue', 'problem', 'trouble'],
  ['instalment', 'installment', 'instalments', 'installments', 'split'],
  ['discount', 'waiver', 'reduction', 'reduce'],
  ['leaflet', 'warning', 'notice', 'message', 'sms', 'text'],
  ['customer', 'costumer', 'client', 'consumer', 'subscriber', 'beneficiary', 'bnf', 'کڕیار', 'عميل'],
  ['received', 'recived', 'get', 'got', 'receive', 'recieved'],
  ['phone', 'number', 'mobile', 'telephone'],
  ['transfer', 'move', 'moved', 'relocate', 'relocation'],
  ['escalate', 'escalation', 'ticket', 'crm'],
];

const SYN = new Map();
function rebuildSyn(extraGroups = []) {
  // merge the groups of your own (set in the admin panel) into the built-in ones: a group that shares a word
  // with an existing group joins it, so "fatora = bill" also finds everything that means "bill"
  const groups = SYNONYM_GROUPS.map(g => g.map(normalizeWord));
  (extraGroups || []).forEach(g => {
    const words = (g || []).map(normalizeWord).filter(Boolean);
    if (words.length < 2) return;
    const hit = groups.filter(grp => grp.some(w => words.includes(w)));
    if (hit.length) {
      const base = hit[0];
      words.forEach(w => { if (!base.includes(w)) base.push(w); });
      hit.slice(1).forEach(other => { other.forEach(w => { if (!base.includes(w)) base.push(w); }); groups.splice(groups.indexOf(other), 1); });
    } else groups.push(words);
  });
  SYN.clear();
  groups.forEach(group => group.forEach(w => { if (!SYN.has(w)) SYN.set(w, group[0]); }));
}
// Called once the agent's app has loaded the synonym groups saved in the admin panel. Rebuild the index afterwards.
export function applySynonyms(groups) { rebuildSyn(groups); }

rebuildSyn();

// ---------- text normalisation ----------
function foldChars(s) {
  return s
    .replace(/[ً-ٰٟـ‌‍‎‏]/g, '')   // diacritics, tatweel, ZWNJ, direction marks
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[يىیێ]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[ةەھهـ]/g, 'ه')
    .replace(/[ۆوؤ]/g, 'و')
    .replace(/[ڕ]/g, 'ر')
    .replace(/[ڵ]/g, 'ل')
    .replace(/[ڤ]/g, 'ف')
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0));
}

function stemEn(w) {
  if (!/^[a-z0-9]+$/.test(w) || w.length < 5) return w;
  return w
    .replace(/(ies)$/, 'y')
    .replace(/(ing|ed|es)$/, '')
    .replace(/s$/, '');
}

function normalizeWord(w) {
  const base = foldChars(
    String(w).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  );
  return stemEn(base);
}

export function normalizeText(text) {
  const t = String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // Psûle -> psule
    .replace(/\bfaq\s*#?\s*(\d+)\b/g, 'faq$1')            // "faq 13" -> "faq13"
    .replace(/[*_•◦▪→–—\-/\\]/g, ' ');
  return foldChars(t).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function tokenize(text, { keepStop = false } = {}) {
  const out = [];
  normalizeText(text).split(' ').forEach(raw => {
    if (!raw) return;
    if (!keepStop && STOP.has(raw)) return;
    if (raw.length < 2 && !/\d/.test(raw)) return;
    const w = stemEn(raw);
    out.push(SYN.get(w) || w);
  });
  return out;
}

// Same as tokenize() but WITHOUT the synonym mapping, so the exact word the agent typed can be told apart
// from a word that only means the same thing ("maqtu3" must beat a generic "disconnected" question).
function tokenizeRaw(text) {
  const out = [];
  normalizeText(text).split(' ').forEach(raw => {
    if (!raw || STOP.has(raw)) return;
    if (raw.length < 2 && !/\d/.test(raw)) return;
    out.push(stemEn(raw));
  });
  return out;
}

// Splits a stored key-terms string ("a, b, c; d") into separate terms, keeping the phrases.
export function splitKeyTerms(tags) {
  return String(tags || '').split(/[,;،؛\n]+/).map(s => s.trim()).filter(Boolean);
}

// ---------- fuzzy matching ----------
function withinOneEdit(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (la === lb) {
      // substitution, or adjacent swap
      if (a[i + 1] === b[j] && a[i] === b[j + 1]) { i += 2; j += 2; } else { i++; j++; }
    } else if (la > lb) i++; else j++;
  }
  return edits + (la - i) + (lb - j) <= 1;
}

// ---------- index ----------
const FIELD_WEIGHT = { tags: 3.2, question: 3.0, subcategory: 1.6, category: 1.0, answer: 1.0 };

export function buildIndex(faqs) {
  const docs = (faqs || []).map(faq => {
    const question = tokenize([faq.question_en, faq.question_ku, faq.question_ba, faq.question_ar].filter(Boolean).join(' '));
    const answer = tokenize([faq.answer_en, faq.answer_ku, faq.answer_ba, faq.answer_ar].filter(Boolean).join(' '));
    const tags = tokenize(faq.tags);
    const subcategory = tokenize([faq.subcategory, faq.third_level].filter(Boolean).join(' '));
    const category = tokenize(faq.category);
    const qAll = [faq.question_en, faq.question_ku, faq.question_ba, faq.question_ar].filter(Boolean).join(' ');
    const raw = {
      question: new Set(tokenizeRaw(qAll)),
      tags: new Set(tokenizeRaw(faq.tags)),
      answer: new Set(tokenizeRaw([faq.answer_en, faq.answer_ku, faq.answer_ba, faq.answer_ar].filter(Boolean).join(' '))),
    };
    return {
      faq,
      raw,
      qLen: new Set(question).size || 1,
      qEn: String(faq.question_en || '').toLowerCase().trim(),
      fields: {
        question: new Set(question),
        tags: new Set(tags),
        subcategory: new Set(subcategory),
        category: new Set(category),
        answer: new Set(answer),
      },
      phrase: {
        question: normalizeText([faq.question_en, faq.question_ku, faq.question_ba, faq.question_ar].filter(Boolean).join(' | ')),
        tags: splitKeyTerms(faq.tags).map(normalizeText),
      },
    };
  });

  // document frequency for IDF
  const df = new Map();
  docs.forEach(d => {
    const all = new Set();
    Object.values(d.fields).forEach(set => set.forEach(t => all.add(t)));
    all.forEach(t => df.set(t, (df.get(t) || 0) + 1));
  });
  const rawDf = new Map();
  docs.forEach(d => {
    const all = new Set([...d.raw.question, ...d.raw.tags, ...d.raw.answer]);
    all.forEach(t => rawDf.set(t, (rawDf.get(t) || 0) + 1));
  });
  return { docs, df, rawDf, n: docs.length };
}

const idf = (index, t) => {
  const f = index.df.get(t) || 0;
  return Math.log(1 + (index.n + 1) / (f + 0.5));
};

// How well does query token `qt` match field token set `set`?  1 exact, .7 prefix, .5 one typo, 0 none.
function matchIn(set, qt) {
  if (set.has(qt)) return 1;
  if (qt.length < 3) return 0;
  let best = 0;
  for (const t of set) {
    if (t.length >= qt.length && t.startsWith(qt)) { best = Math.max(best, 0.7); }
    else if (qt.length >= 5 && withinOneEdit(qt, t)) { best = Math.max(best, 0.5); }
    if (best === 1) break;
  }
  return best;
}

/**
 * Rank FAQs for a query.
 * returns [{ faq, score, coverage, matchedTerms:[...key terms that matched] }]
 */
export function searchFaqs(index, query, { limit = 0, minScore = 0 } = {}) {
  const q = normalizeText(query);
  if (!q) return [];
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const uniq = Array.from(new Set(qTokens));
  const rawQ = Array.from(new Set(tokenizeRaw(query)));
  // "what is maqtu3", "meaning of KYC": the agent wants the definition of one thing
  const wantsDefinition = /^(what is|what s|whats|what are|what does|meaning of|define|explain)\b/.test(q)
    || /\b(meaning|means?|chiya|chiye|chye|cheya)\b/.test(q) || /(چییه|چیه|یعنی|معنی)$/.test(q) || /^ما هو\b/.test(q);
  // a lone term ("maqtu3") usually means "what is that?" too, just less sure than when the agent says so
  const defStrength = wantsDefinition ? 1 : (rawQ.length === 1 ? 0.45 : 0);
  const rawIdf = t => Math.log(1 + (index.n + 1) / ((index.rawDf.get(t) || 0) + 0.5));

  const results = [];
  index.docs.forEach(d => {
    let score = 0;
    let matchedCount = 0;
    uniq.forEach(qt => {
      const w = idf(index, qt);
      let bestForToken = 0;
      Object.entries(d.fields).forEach(([field, set]) => {
        const m = matchIn(set, qt);
        if (m > 0) bestForToken = Math.max(bestForToken, m * FIELD_WEIGHT[field]);
      });
      if (bestForToken > 0) { matchedCount++; score += w * bestForToken; }
    });
    if (matchedCount === 0) return;

    // the exact words typed, found in the question or the key terms (not just a synonym of them)
    let literal = 0, literalInQuestion = 0;
    rawQ.forEach(rt => {
      const inQ = d.raw.question.has(rt), inT = d.raw.tags.has(rt);
      if (inQ || inT) literal += rawIdf(rt) * (inQ ? 3.0 : 2.4);
      if (inQ) literalInQuestion++;
    });
    score += literal;

    const coverage = matchedCount / uniq.length;
    // multi-word questions: require at least half of the words to be found
    if (uniq.length >= 3 && coverage < 0.5) return;
    score *= 0.4 + 0.6 * coverage;
    // Shortlisted FAQs are the most-asked questions QA has pinned, so they edge ahead of equal matches
    if (d.faq.is_shortlisted) score += 1.5;

    let defBonus = 0;
    // every typed word is in the question title: the shorter and more focused the title, the better the match
    if (rawQ.length && literalInQuestion === rawQ.length) {
      score += 6 * Math.min(1, rawQ.length / d.qLen) + 3;
      // the agent asked "what is X" and this FAQ is literally titled "What is ... X": that is the answer, rank it first
      // (the shorter and more focused the title, the higher, so "What is Maqtu3?" beats "What is this Maqtu3 charge...?")
      if (defStrength && /^(what|why) (is|are|does|do)\b/.test(d.qEn)) { defBonus = defStrength * (60 + 20 * Math.min(1, rawQ.length / d.qLen)); score += defBonus; }
    }

    // exact phrase bonuses
    if (q.length >= 3) {
      if (d.phrase.question.includes(q)) score += 12;
      if (d.phrase.tags.some(t => t === q)) score += 18;
      else if (d.phrase.tags.some(t => t && (t.includes(q) || (t.length >= 4 && q.includes(t))))) score += 9;
    }

    // which stored key terms explain the match
    const matchedTerms = splitKeyTerms(d.faq.tags).filter(term => {
      const tt = tokenize(term);
      return tt.length > 0 && tt.some(x => uniq.some(qt => x === qt || (qt.length >= 3 && x.startsWith(qt))));
    }).slice(0, 4);

    results.push({ faq: d.faq, score, base: score - defBonus, coverage, matchedTerms });
  });

  results.sort((a, b) => b.score - a.score || b.coverage - a.coverage);
  // the cut-off ignores the "what is X" bonus, so the other related answers still show below the first one
  const top = results.length ? Math.max(...results.map(r => r.base)) : 0;
  const kept = results.filter(r => r.score >= minScore && r.base >= top * 0.25);
  return limit ? kept.slice(0, limit) : kept;
}

// Language of what the agent typed (used by the assistant to answer in the same language)
export function detectLanguage(text) {
  const t = String(text || '');
  if (/[ڤ]|ئەز|هەوە|هەوە|چاوا|کیڤە|ناڤ/.test(t)) return 'ba';
  if (/[ڕڵۆێە]/.test(t)) return 'ku';
  if (/[؀-ۿ]/.test(t)) return 'ar';
  return 'en';
}