export const LIMB_PRACTICE_SCOPES = [
  {id: 'all', label: 'Upper + Lower'},
  {id: 'upper', label: 'Upper only'},
  {id: 'lower', label: 'Lower only'},
];

export function isLimbPracticeScope(value) {
  return LIMB_PRACTICE_SCOPES.some(scope => scope.id === value);
}

// Saved sessions predate regional selection; never reinterpret their question IDs.
export function savedLimbPracticeScope(exam, value) {
  return exam === 'term2-limbs' && isLimbPracticeScope(value) ? value : 'all';
}

export function requestedLimbPracticeScope(exam, value) {
  if (value == null) return 'all';
  if (!isLimbPracticeScope(value) || (exam !== 'term2-limbs' && value !== 'all')) {
    throw new Error('A valid limb practice region is required');
  }
  return value;
}

export function limbPracticeLabel(scope) {
  return LIMB_PRACTICE_SCOPES.find(item => item.id === scope)?.label ?? 'Upper + Lower';
}

// Audited regional cases in the otherwise shared science chapters. Explicit IDs
// avoid classifying a question by a distractor or a passing mention of a limb.
const upperCases = new Set([
  'comp-limbs-061', 'comp-limbs-062', 'comp-limbs-063',
  ...[5, 6, 7, 15, 16, 23, 24, 25, 26, 28, 29, 30, 31, 36, 39].map(n => `limb-audit-emb-${String(n).padStart(3, '0')}`),
  'limb-audit-hist-026', 'limb-audit-hist-042',
  ...[27, 29, 30, 31, 43, 45].map(n => `limb-audit-phys-${String(n).padStart(3, '0')}`),
]);
const lowerCases = new Set([
  'depth-limb-emb-006', 'limb-audit-emb-003', 'limb-audit-emb-034', 'limb-audit-emb-035',
  'limb-audit-hist-012', 'limb-audit-hist-024', 'limb-audit-hist-027', 'limb-audit-hist-033',
  'limb-audit-phys-040', 'limb-audit-phys-044',
]);

export function limbPracticeRegion(question) {
  const tags = new Set(question.tags ?? []);
  const upper = tags.has('atlas-module-upper-limb') || tags.has('upper-limb');
  const lower = tags.has('atlas-module-lower-limb') || tags.has('lower-limb');
  if (upper || lower) return upper && lower ? 'shared' : upper ? 'upper' : 'lower';
  if (upperCases.has(question.id)) return 'upper';
  if (lowerCases.has(question.id)) return 'lower';
  // Chapter labels only, not prompts/options. Numeric Gray chapters already carry
  // atlas module tags. Unknown anatomy must be mapped before publication.
  if (question.subject === 'anatomy') {
    const chapter = question.chapter ?? '';
    if (/upper limb|shoulder|elbow|forearm|wrist|hand/i.test(chapter)) return 'upper';
    if (/lower limb|pelvic|gluteal|thigh|leg|ankle|foot/i.test(chapter)) return 'lower';
    return 'unclassified';
  }
  return 'shared';
}

export function matchesLimbPracticeScope(question, scope = 'all') {
  if (scope === 'all') return true;
  const region = limbPracticeRegion(question);
  return region === scope || region === 'shared';
}

export function buildLimbPracticeIndex(questions) {
  const index = {all: [], upper: [], lower: [], shared: []};
  for (const question of questions) {
    const region = limbPracticeRegion(question);
    if (region === 'unclassified') throw new Error(`Map limb practice region for ${question.id}`);
    index.all.push(question.id);
    if (region === 'shared') {
      index.shared.push(question.id);
      index.upper.push(question.id);
      index.lower.push(question.id);
    } else index[region].push(question.id);
  }
  return index;
}
