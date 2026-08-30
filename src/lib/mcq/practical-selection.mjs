import { selectCoverageSprint } from "./sprint-selection.mjs";

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function selectPracticalSprint(items, options = {}) {
  if (options.studyMode !== "exam") return selectCoverageSprint(items, options);
  const { random = Math.random, seenIds = [], repairIds = [] } = options;
  const limit = Math.max(0, Math.min(items.length, Math.floor(Number(options.limit) || 36)));
  const groups = new Map();
  for (const item of shuffled(items, random)) {
    const key = item.tags?.find((tag) => tag.startsWith("practical-station-")) ?? item.topic;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const pools = shuffled([...groups.values()], random);
  const selected = [];
  while (selected.length < limit && pools.some((pool) => pool.length)) {
    for (const pool of pools) if (pool.length && selected.length < limit) selected.push(pool.pop());
  }
  const questions = shuffled(selected, random);
  const repairCount = questions.filter((q) => repairIds.includes(q.id)).length;
  const unseenCount = questions.filter((q) => !seenIds.includes(q.id) && !repairIds.includes(q.id)).length;
  return { questions, repairCount, unseenCount, reviewCount: questions.length - unseenCount, ordinaryReviewCount: questions.length - unseenCount - repairCount };
}
