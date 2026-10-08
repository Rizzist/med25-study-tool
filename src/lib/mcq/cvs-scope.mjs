export const CVS_SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'physio', label: 'Physio' },
  { id: 'non-physio', label: 'Non-Physio' },
];

export function isCvsScope(value) {
  return CVS_SCOPES.some(scope => scope.id === value);
}

export function normalizeCvsScope(value) {
  return isCvsScope(value) ? value : 'all';
}

/** Older sessions have no scope, and scope from another course must not carry over. */
export function savedCvsScope(exam, value) {
  return exam === 'term2-cvs' ? normalizeCvsScope(value) : 'all';
}

/** Request boundaries reject unsupported scope values instead of broadening a selection. */
export function requestedCvsScope(exam, value) {
  if (value == null) return 'all';
  if (!isCvsScope(value) || (exam !== 'term2-cvs' && value !== 'all')) {
    throw new Error('A valid CVS scope is required');
  }
  return value;
}

export function cvsScopeLabel(scope) {
  return CVS_SCOPES.find(item => item.id === normalizeCvsScope(scope)).label;
}

/** Practice subjects are authoritative even when a question links across review sections. */
export function matchesCvsPracticeScope(question, scope = 'all') {
  const selected = normalizeCvsScope(scope);
  if (selected === 'all') return true;
  const physiology = question?.subject === 'physiology';
  return selected === 'physio' ? physiology : !physiology;
}

/**
 * Blood-cell physiology and hemostasis belong to Physio. Immune foundations is
 * taught in the histology course and its practice questions are labeled histology.
 * Unknown source mappings remain visible in the Non-Physio complement; callers
 * must retain the existing unclassified/source-review label for those records.
 */
export function matchesCvsPaperScope(mapping, scope = 'all') {
  const selected = normalizeCvsScope(scope);
  if (selected === 'all') return true;
  const physiology = mapping?.subjectId === 'physiology'
    || (mapping?.subjectId === 'blood-immune' && mapping.topicId !== 'immune-foundations');
  return selected === 'physio' ? physiology : !physiology;
}

export function scopedCvsPaperId(id, scope = 'all') {
  const selected = normalizeCvsScope(scope);
  return selected === 'all' ? id : `${id}::cvs-${selected}`;
}

export function cvsPaperScopeFingerprint(fingerprint, questionIds, scope = 'all') {
  const selected = normalizeCvsScope(scope);
  return selected === 'all' ? fingerprint : JSON.stringify(['cvs-scope-v1', fingerprint, selected, questionIds]);
}

/** Scope before starting/grading a session, while retaining original question provenance. */
export function scopeCvsPaper(paper, scope = 'all', topicMap) {
  const selected = normalizeCvsScope(scope);
  if (selected === 'all') return paper;
  if (!topicMap?.questions || typeof topicMap.questions !== 'object'
    || Array.isArray(topicMap.questions) || !Object.keys(topicMap.questions).length) {
    throw new Error('The CVS topic map must load before selecting a portion.');
  }
  const questions = paper.questions.filter(question => matchesCvsPaperScope(topicMap?.questions?.[question.id], selected));
  const title = paper.title.replace(/\s*·\s*\d+\s+questions\s*$/, '');
  return {
    ...paper,
    id: scopedCvsPaperId(paper.id, selected),
    title: `${title} · ${cvsScopeLabel(selected)} · ${questions.length} questions`,
    // A transparent content signature works in both browsers and Node. Selected
    // IDs invalidate a resume if a navigation-map update changes the scoped set.
    fingerprint: cvsPaperScopeFingerprint(paper.fingerprint, questions.map(question => question.id), selected),
    questions,
  };
}
