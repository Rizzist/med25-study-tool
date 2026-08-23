function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function selectCoverageSprint(items, {
  limit,
  seenIds = [],
  repairIds = [],
  random = Math.random,
}) {
  const cappedLimit = Math.max(1, Math.min(Math.floor(Number(limit) || 20), items.length));
  const seen = new Set(seenIds);
  const repair = new Set(repairIds);
  const repairPool = shuffled(items.filter((item) => repair.has(item.id)), random);
  const unseenPool = shuffled(items.filter((item) => !repair.has(item.id) && !seen.has(item.id)), random);
  const ordinaryReviewPool = shuffled(items.filter((item) => seen.has(item.id) && !repair.has(item.id)), random);
  const selectedRepair = repairPool.slice(0, cappedLimit);
  let remaining = cappedLimit - selectedRepair.length;
  const selectedUnseen = unseenPool.slice(0, remaining);
  remaining -= selectedUnseen.length;
  const selectedOrdinaryReview = ordinaryReviewPool.slice(0, remaining);

  return {
    questions: [...selectedRepair, ...selectedUnseen, ...selectedOrdinaryReview],
    repairCount: selectedRepair.length,
    unseenCount: selectedUnseen.length,
    reviewCount: selectedRepair.length + selectedOrdinaryReview.length,
    ordinaryReviewCount: selectedOrdinaryReview.length,
  };
}

export function classifySessionCompletion(questionIds, {
  visitedIds = [],
  answeredIds = [],
  correctIds = [],
} = {}) {
  const visited = new Set(visitedIds);
  const answered = new Set(answeredIds);
  const correct = new Set(correctIds);
  const seenIds = questionIds.filter((id) => visited.has(id));
  return {
    seenIds,
    untouchedIds: questionIds.filter((id) => !visited.has(id)),
    unansweredIds: seenIds.filter((id) => !answered.has(id)),
    repairIds: seenIds.filter((id) => !correct.has(id)),
    correctIds: seenIds.filter((id) => correct.has(id)),
  };
}
