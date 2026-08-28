function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function balanced(items, random) {
  const groups = new Map();
  for (const item of shuffle(items, random)) {
    if (!groups.has(item.subject)) groups.set(item.subject, []);
    groups.get(item.subject).push(item);
  }
  const result = [];
  while ([...groups.values()].some((group) => group.length)) {
    for (const subject of shuffle([...groups.keys()], random)) {
      const item = groups.get(subject).shift();
      if (item) result.push(item);
    }
  }
  return result;
}

// One variant of a given image/target per session, while retaining stable IDs for resume.
export function selectRespiratorySprint(items, { limit = 20, seenIds = [], repairIds = [], studyMode = "learn", random = Math.random } = {}) {
  const seen = new Set(seenIds);
  const repair = new Set(repairIds);
  const priority = (item) => studyMode === "exam" ? 0 : repair.has(item.id) ? 0 : !seen.has(item.id) ? 1 : 2;
  const candidates = shuffle(items, random).sort((a, b) => priority(a) - priority(b));
  const targets = new Set();
  const unique = candidates.filter((item) => {
    if (!item.anatomy) return true;
    const key = `${item.anatomy.imageId}:${item.anatomy.targetRegionId}`;
    if (targets.has(key)) return false;
    targets.add(key);
    return true;
  });
  const ordered = studyMode === "exam" ? balanced(unique, random)
    : [0, 1, 2].flatMap((level) => balanced(unique.filter((item) => priority(item) === level), random));
  const selected = ordered.slice(0, Math.max(1, Math.min(250, Math.floor(Number(limit) || 20))));
  const questions = studyMode === "exam" ? shuffle(selected, random) : selected;
  const repairCount = questions.filter((item) => repair.has(item.id)).length;
  const unseenCount = questions.filter((item) => !repair.has(item.id) && !seen.has(item.id)).length;
  return { questions, repairCount, unseenCount, reviewCount: questions.length - unseenCount, ordinaryReviewCount: questions.length - unseenCount - repairCount };
}
