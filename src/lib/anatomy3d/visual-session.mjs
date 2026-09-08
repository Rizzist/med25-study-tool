import { isLocationQuestion, restoredLocationResponse } from '../mcq/anatomy-location.mjs';

export function shuffleAnatomy(items, seed) {
  let state = 2166136261;
  for (const char of String(seed)) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const j = Math.floor((state / 4294967296) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Rotate between figures and keep just one distractor variant for each labeled target per test.
export function selectAnatomySession(questions, { seed = "anatomy", count = 30, moduleKey = "all", format = "mixed", direction = "mixed", feedback = "learn" } = {}) {
  const seen = new Set();
  const eligible = shuffleAnatomy(questions, seed).filter((question) => {
    const locating = isLocationQuestion(question);
    if (direction === "locate" && !locating || direction === "identify" && locating) return false;
    // Filter before deduplication: a locate variant must not evict its eligible 3D counterpart.
    if (format === "3d" && (!question.anatomy3d || (locating && question.anatomy))) return false;
    if (format === "2d" && !question.anatomy) return false;
    if (moduleKey !== "all" && question.anatomy3d?.modelKey !== moduleKey && !question.tags.includes(`atlas-module-${moduleKey}`)) return false;
    // Learn feedback opens the full figure, so sibling targets belong in another
    // session. Test mode can reuse figures because labels stay hidden until grading.
    const key = question.anatomy ? feedback === "learn" ? question.anatomy.imageId : `${question.anatomy.imageId}:${question.anatomy.targetRegionId}` : question.anatomy3d ? `model:${question.anatomy3d.modelKey}:${question.anatomy3d.structureId}` : question.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const figures = new Map();
  for (const question of eligible.filter((q) => q.anatomy)) {
    const key = question.anatomy.imageId;
    if (!figures.has(key)) figures.set(key, []);
    figures.get(key).push(question);
  }
  const images = [];
  while ([...figures.values()].some((items) => items.length)) {
    for (const items of figures.values()) if (items.length) images.push(items.shift());
  }
  const models = eligible.filter((q) => !q.anatomy && q.anatomy3d);
  if (format === "2d") return images.slice(0, count).map((question) => ({ question, initialView: "2d" }));
  if (format === "3d") {
    const paired = images.filter((q) => q.anatomy3d && q.anatomy?.responseMode !== "locate");
    return [...paired, ...models].slice(0, count).map((question) => ({ question, initialView: "3d" }));
  }
  const session = [];
  // Four source diagrams to one model by default; switching views never replaces the question.
  while (session.length < count && (images.length || models.length)) {
    const preferModel = session.length % 5 === 4;
    const question = preferModel ? models.shift() ?? images.shift() : images.shift() ?? models.shift();
    session.push({ question, initialView: question.anatomy ? "2d" : "3d" });
  }
  return session;
}

export function parseAnatomySession(value, questions) {
  try {
    const saved = JSON.parse(value ?? "null");
    if (saved?.version !== 1 || !Array.isArray(saved.ids)) return null;
    const byId = new Map(questions.map((question) => [question.id, question]));
    if (!saved.ids.length || new Set(saved.ids).size !== saved.ids.length) return null;
    const items = saved.ids.flatMap((id, index) => !byId.has(id) ? [] : [{ question: byId.get(id), initialView: !byId.get(id).anatomy && byId.get(id).anatomy3d || saved.views?.[index] === "3d" && byId.get(id).anatomy3d && !isLocationQuestion(byId.get(id)) ? "3d" : "2d" }]);
    if (!items.length) return null;
    const answers = {};
    const locations = {};
    for (const { question } of items) {
      const answer = saved.answers?.[question.id];
      if (isLocationQuestion(question)) {
        const response = restoredLocationResponse(question, saved.locations?.[question.id]);
        if (response) { answers[question.id] = response.selectedOptionId; locations[question.id] = response.selectedRegionId; }
      } else if (question.options.some((option) => option.id === answer)) answers[question.id] = answer;
    }
    const oldIndex=Math.max(0,Math.min(saved.ids.length-1,Math.floor(Number(saved.index)||0)));
    const retainedIndex=items.findIndex(item=>item.question.id===saved.ids[oldIndex]);
    const index=retainedIndex>=0?retainedIndex:Math.min(items.length-1,saved.ids.slice(0,oldIndex).filter(id=>byId.has(id)).length);
    return { items, answers, locations, index, graded: saved.graded === true, feedback: saved.feedback === "exam" ? "exam" : "learn" };
  } catch { return null; }
}
