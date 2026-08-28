export function distinctQuestionIds(ids, index = {}) {
  const seen = new Set();
  return ids.filter((id) => {
    const key = index[id]?.dedupeKey ?? id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Merely opening a question, or ticking "read", is not an answered question.
// Any unresolved variant of a target keeps that target in the repair count.
export function questionProgress(ids, attemptedIds = [], repairIds = [], index = {}) {
  const key = (id) => index[id]?.dedupeKey ?? id;
  const attempted = new Set(attemptedIds.map(key));
  const repair = new Set(repairIds.map(key));
  const unique = distinctQuestionIds(ids, index);
  return {
    total: unique.length,
    attempted: unique.filter((id) => attempted.has(key(id))).length,
    repair: unique.filter((id) => repair.has(key(id))).length,
  };
}

export function parseConceptReading(raw, validIds) {
  try {
    const value = JSON.parse(raw ?? "null");
    if (value?.version !== 1 || !Array.isArray(value.readIds)) return [];
    const valid = new Set(validIds);
    return [...new Set(value.readIds.filter((id) => typeof id === "string" && valid.has(id)))];
  } catch { return []; }
}

export function normalizeRespiratoryPractice(exam, scopeId, poolIds, index) {
  if (exam !== "term2-respiratory" || typeof scopeId !== "string" || !Array.isArray(poolIds)) return {};
  const ids = [...new Set(poolIds.filter((id) => typeof id === "string" && Object.hasOwn(index, id) && (
    scopeId === "all" || index[id].conceptIds?.includes(scopeId) || index[id].moduleIds?.includes(scopeId)
  )))].slice(0, 2000);
  if (!ids.length) return {};
  return { respiratoryScopeId: scopeId, respiratoryPracticeIds: ids };
}
