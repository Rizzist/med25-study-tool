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
  const unseenPool = shuffled(items.filter((item) => !seen.has(item.id)), random);
  const repairPool = shuffled(items.filter((item) => seen.has(item.id) && repair.has(item.id)), random);
  const ordinaryReviewPool = shuffled(items.filter((item) => seen.has(item.id) && !repair.has(item.id)), random);
  const reviewPool = [...repairPool, ...ordinaryReviewPool];

  const unseenTarget = Math.min(unseenPool.length, Math.ceil(cappedLimit * 0.8));
  const reviewTarget = Math.min(reviewPool.length, cappedLimit - unseenTarget);
  const selectedUnseen = unseenPool.slice(0, unseenTarget);
  const selectedReview = reviewPool.slice(0, reviewTarget);
  let remaining = cappedLimit - selectedUnseen.length - selectedReview.length;

  if (remaining > 0) {
    const unseenFill = unseenPool.slice(unseenTarget, unseenTarget + remaining);
    selectedUnseen.push(...unseenFill);
    remaining -= unseenFill.length;
  }
  if (remaining > 0) selectedReview.push(...reviewPool.slice(reviewTarget, reviewTarget + remaining));

  return {
    questions: shuffled([...selectedUnseen, ...selectedReview], random),
    unseenCount: selectedUnseen.length,
    reviewCount: selectedReview.length,
  };
}
