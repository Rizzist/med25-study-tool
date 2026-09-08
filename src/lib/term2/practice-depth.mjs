export function questionDepth(question) {
  return question.knowledgeLevel ?? (question.tags?.includes('knowledge-challenge') || question.difficulty >= 4 ? 'challenge' : 'core');
}

export function filterDepthIds(ids, index, depth = 'all') {
  return [...new Set(ids)].filter((id) => index[id] && (depth === 'all' || questionDepth(index[id]) === depth));
}

export function depthSummary(index) {
  const subjects = [...new Set(Object.values(index).map((entry) => entry.subject))];
  return subjects.map((subject) => {
    const ids = Object.keys(index).filter((id) => index[id].subject === subject);
    return { subject, total: ids.length, core: filterDepthIds(ids, index, 'core'), challenge: filterDepthIds(ids, index, 'challenge'),
      distinctTargets: new Set(ids.map((id) => index[id].dedupeKey ?? id)).size,
      written: ids.filter((id) => !index[id].kind.startsWith('dynamic_anatomy')).length };
  });
}
