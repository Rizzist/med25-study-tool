const chapterTitles = [
  'Amino acids', 'Protein structure', 'Globular proteins', 'Fibrous proteins', 'Enzymes',
  'Bioenergetics & oxidative phosphorylation', 'Carbohydrate structure', 'Metabolism & glycolysis',
  'TCA cycle & pyruvate dehydrogenase', 'Gluconeogenesis', 'Glycogen metabolism',
  'Monosaccharide & disaccharide metabolism', 'Pentose phosphate pathway', 'Glycosaminoglycans & glycoproteins',
  'Dietary lipid metabolism', 'Fatty acids, ketones & triacylglycerols', 'Complex lipids',
  'Cholesterol, lipoproteins & steroids', 'Amino acids: nitrogen disposal', 'Amino-acid degradation & synthesis',
  'Amino acids: specialized products', 'Nucleotide metabolism', 'Insulin & glucagon', 'Fed–fast cycle',
  'Diabetes mellitus', 'Obesity', 'Nutrition', 'Vitamins', 'DNA structure, replication & repair',
  'RNA & transcription', 'Protein synthesis', 'Gene regulation', 'Biotechnology',
];
const supplementary = new Set([8, 9, 10, 11, 12, 13, 19, 20, 21, 22]);

export const RETAKE_PRACTICE_CHAPTERS = [
  // Chapters 8-13 and 19-22 are Term 2 Biochemistry II material and are not part of the retake.
  ...chapterTitles.map((title, index) => ({
    id: `ch-${index + 1}`, chapterLabel: `Chapter ${index + 1}`, title,
    coverage: supplementary.has(index + 1) ? 'supplementary' : 'confirmed',
  })).filter(chapter => chapter.coverage === 'confirmed'),
  {id: 'foundations', chapterLabel: 'Slide extra', title: 'Biochemical foundations', coverage: 'confirmed'},
  {id: 'water-buffers', chapterLabel: 'Slide extra', title: 'Water, acids, bases & buffers', coverage: 'confirmed'},
  {id: 'lab-practical', chapterLabel: 'Slide extra', title: 'Laboratory practicals', coverage: 'confirmed'},
];
export const DEFAULT_RETAKE_CHAPTER_IDS = RETAKE_PRACTICE_CHAPTERS.filter(chapter => chapter.coverage === 'confirmed').map(chapter => chapter.id);
const validIds = new Set(RETAKE_PRACTICE_CHAPTERS.map(chapter => chapter.id));

/** A stale or partial index must not masquerade as a fully loaded chapter list. */
export function isRetakeChapterIndexReady(index) {
  if (!Array.isArray(index) || index.length !== validIds.size) return false;
  const chapterIds = new Set();
  const questionIds = new Set();
  return index.every(chapter => {
    if (!chapter || !validIds.has(chapter.id) || chapterIds.has(chapter.id) || !Array.isArray(chapter.questionIds) || chapter.questionCount !== chapter.questionIds.length) return false;
    chapterIds.add(chapter.id);
    return chapter.questionIds.every(id => {
      if (typeof id !== 'string' || !id || questionIds.has(id)) return false;
      questionIds.add(id);
      return true;
    });
  });
}

/** Missing selection is legacy/unscoped; an explicit empty selection stays empty. */
export function sanitizeRetakeChapterIds(value) {
  return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && validIds.has(id)))] : undefined;
}

export function retakeChapterQuestionIds(index, selectedIds) {
  const selected = new Set(sanitizeRetakeChapterIds(selectedIds) ?? []);
  return [...new Set((index ?? []).filter(chapter => selected.has(chapter.id)).flatMap(chapter => chapter.questionIds ?? []))];
}

export function retakeChapterSelectionLabel(ids) {
  const selected = sanitizeRetakeChapterIds(ids);
  if (!selected?.length) return undefined;
  if (selected.length === DEFAULT_RETAKE_CHAPTER_IDS.length && DEFAULT_RETAKE_CHAPTER_IDS.every(id => selected.includes(id))) return 'Confirmed Term 1 scope';
  if (selected.length === RETAKE_PRACTICE_CHAPTERS.length) return 'All chapters & slide extras';
  if (selected.length === 1) {
    const chapter = RETAKE_PRACTICE_CHAPTERS.find(chapter => chapter.id === selected[0]);
    return `${chapter.chapterLabel} · ${chapter.title}`;
  }
  return `${selected.length} chapters / slide extras`;
}
