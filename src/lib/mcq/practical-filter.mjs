// A single deterministic filter powers the count, set cards and launch pool.
// Never include answer text in the searchable pre-answer question index.
export function filterPracticalQuestions(index, ids, { filter = "all", query = "", attemptedIds = [], repairIds = [] } = {}) {
  const lookup = new Map(index.map((question) => [question.id, question]));
  const attempted = new Set(attemptedIds);
  const repair = new Set(repairIds);
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return [...new Set(ids)].filter((id) => {
    const question = lookup.get(id);
    if (!question) return false;
    if (filter === "new" && !question.expanded) return false;
    if (filter === "unseen" && attempted.has(id)) return false;
    if (filter === "repair" && !repair.has(id)) return false;
    if (filter === "images" && !question.image) return false;
    if (filter === "calculations" && !question.calculation) return false;
    const text = `${question.prompt} ${question.objective} ${question.source}`.toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  });
}
