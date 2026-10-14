import * as XLSX from 'xlsx';

// Reads an FAQ workbook and returns rows in the shape the API import expects.
// Understands both naming styles:
//   • database style:  category, subcategory, question_en, answer_en, question_ku, ...
//   • master-sheet style: Level 1 / Level 2 / Level 3, Question (English),
//     FAQ Solution (English), Key terms (search), Assigned team, FAQ ID
// The header row is found automatically (the master sheet has a title block
// above it), and sheets that are not FAQ lists (e.g. "Count_all") are skipped.

const ALIASES = {
  category:    ['category', 'level 1'],
  subcategory: ['subcategory', 'sub category', 'level 2'],
  third_level: ['third level', 'level 3'],
  question_en: ['question en', 'question english', 'question'],
  answer_en:   ['answer en', 'answer english', 'faq solution english', 'faq solution', 'solution', 'answer'],
  question_ku: ['question ku', 'question kurdish', 'question sorani', 'question kurdish sorani'],
  answer_ku:   ['answer ku', 'answer kurdish', 'answer sorani', 'answer kurdish sorani'],
  question_ba: ['question ba', 'question badini'],
  answer_ba:   ['answer ba', 'answer badini'],
  question_ar: ['question ar', 'question arabic'],
  answer_ar:   ['answer ar', 'answer arabic'],
  tags:        ['tags', 'key terms', 'key terms search', 'keywords'],
  faq_id:      ['faq id', 'id'],
  team:        ['assigned team', 'team'],
};

const FIELD_BY_HEADER = {};
Object.entries(ALIASES).forEach(([field, names]) => names.forEach(n => { FIELD_BY_HEADER[n] = field; }));

const normHeader = h => (h == null ? '' : String(h)).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const cellText = v => (v == null ? '' : String(v)).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

export function parseFaqWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const rows = [];
  const sheetsUsed = [];
  const sheetsSkipped = [];

  wb.SheetNames.forEach(name => {
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: '', blankrows: false });

    // find the header row: the first of the top 25 rows that has a question AND an answer column
    let headerIdx = -1;
    let colField = {};
    for (let i = 0; i < Math.min(grid.length, 25); i++) {
      const map = {};
      grid[i].forEach((cell, c) => {
        const field = FIELD_BY_HEADER[normHeader(cell)];
        if (field && !Object.values(map).includes(field)) map[c] = field;
      });
      const fields = Object.values(map);
      if (fields.includes('question_en') && fields.includes('answer_en')) { headerIdx = i; colField = map; break; }
    }
    if (headerIdx === -1) { sheetsSkipped.push(name); return; }

    sheetsUsed.push(name);
    for (let r = headerIdx + 1; r < grid.length; r++) {
      const rec = {};
      Object.entries(colField).forEach(([c, field]) => { rec[field] = cellText(grid[r][c]); });
      if (!rec.question_en && !rec.answer_en) continue;

      // make the FAQ ID and owning team searchable by keeping them in the tags text
      const tags = [rec.tags, rec.faq_id, rec.team].filter(Boolean).join(', ');
      delete rec.faq_id; delete rec.team;
      rows.push({ ...rec, tags });
    }
  });

  return { rows, sheetsUsed, sheetsSkipped };
}