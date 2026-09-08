import questionIndex from "../../../data/term2/respiratory-question-index.json" with { type: "json" };

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function balanced(items, random, level = 0) {
  if (level >= 3) return shuffle(items, random);
  const groups = new Map();
  for (const item of shuffle(items, random)) {
    const key = level === 0 ? item.subject : level === 1
      ? questionIndex[item.id]?.moduleId ?? item.chapter ?? item.subject
      : questionIndex[item.id]?.primaryConceptId ?? item.subtopic ?? item.topic ?? item.subject;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  for (const [key, group] of groups) groups.set(key, balanced(group, random, level + 1));
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
  const seenTargets = new Set(seenIds.map((id) => questionIndex[id]?.dedupeKey ?? id));
  const repair = new Set(repairIds);
  const wasSeen = (item) => seen.has(item.id) || seenTargets.has(questionIndex[item.id]?.dedupeKey ?? item.id);
  const priority = (item) => studyMode === "exam" ? 0 : repair.has(item.id) ? 0 : !wasSeen(item) ? 1 : 2;
  const candidates = shuffle(items, random).sort((a, b) => priority(a) - priority(b));
  const targets = new Set();
  const unique = candidates.filter((item) => {
    if (!item.anatomy) return true;
    // Do not put both directions of the same target in one test: the named
    // location prompt would disclose the adjacent identification answer.
    const key = studyMode === "learn" ? item.anatomy.imageId : `${item.anatomy.imageId}:${item.anatomy.targetRegionId}`;
    if (targets.has(key)) return false;
    targets.add(key);
    return true;
  });
  const ordered = studyMode === "exam" ? balanced(unique, random)
    : [0, 1, 2].flatMap((level) => balanced(unique.filter((item) => priority(item) === level), random));
  const selected = ordered.slice(0, Math.max(1, Math.min(250, Math.floor(Number(limit) || 20))));
  const questions = studyMode === "exam" ? shuffle(selected, random) : selected;
  const repairCount = questions.filter((item) => repair.has(item.id)).length;
  const unseenCount = questions.filter((item) => !repair.has(item.id) && !wasSeen(item)).length;
  return { questions, repairCount, unseenCount, reviewCount: questions.length - unseenCount, ordinaryReviewCount: questions.length - unseenCount - repairCount };
}
