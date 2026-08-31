function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function roundRobin(items, keyFor, random) {
  const groups = new Map();
  for (const item of shuffle(items, random)) {
    const key = keyFor(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  const result = [];
  while ([...groups.values()].some((group) => group.length > 0)) {
    for (const key of shuffle([...groups.keys()], random)) {
      const item = groups.get(key).shift();
      if (item) result.push(item);
    }
  }
  return result;
}

function balanced(items, random) {
  const bySubject = roundRobin(items, (item) => item.subject, random);
  const subjectGroups = new Map();
  for (const item of bySubject) {
    if (!subjectGroups.has(item.subject)) subjectGroups.set(item.subject, []);
    subjectGroups.get(item.subject).push(item);
  }
  for (const [subject, group] of subjectGroups) {
    const byChapter = roundRobin(group, (item) => item.chapter ?? item.topic, random);
    subjectGroups.set(subject, roundRobin(byChapter, (item) => item.kind, random));
  }
  return roundRobin([...subjectGroups.values()].flat(), (item) => item.subject, random);
}

// Balances the new Term 2 banks by discipline, chapter/module and modality while
// retaining the global repair -> unseen -> review learning priority.
export function selectTerm2Sprint(items, {
  limit = 20,
  seenIds = [],
  repairIds = [],
  studyMode = "learn",
  random = Math.random,
} = {}) {
  const cappedLimit = Math.max(1, Math.min(Math.floor(Number(limit) || 20), items.length));
  const seen = new Set(seenIds);
  const repair = new Set(repairIds);
  const priority = (item) => studyMode === "exam" ? 0 : repair.has(item.id) ? 0 : !seen.has(item.id) ? 1 : 2;
  const ordered = studyMode === "exam"
    ? balanced(items, random)
    : [0, 1, 2].flatMap((level) => balanced(items.filter((item) => priority(item) === level), random));
  const questions = ordered.slice(0, cappedLimit);
  const repairCount = questions.filter((item) => repair.has(item.id)).length;
  const unseenCount = questions.filter((item) => !repair.has(item.id) && !seen.has(item.id)).length;
  return {
    questions,
    repairCount,
    unseenCount,
    reviewCount: questions.length - unseenCount,
    ordinaryReviewCount: questions.length - unseenCount - repairCount,
  };
}
