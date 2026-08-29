function seedOf(text) {
  let hash = 2166136261;
  for (const char of String(text)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

function shuffled(items, key) {
  let state = seedOf(key);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const other = Math.floor((state / 4294967296) * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function uniqueByLabel(structures, seedLabels) {
  const labels = new Set(seedLabels);
  return structures.filter((structure) => {
    const label = structure.label.trim().toLocaleLowerCase();
    if (labels.has(label)) return false;
    labels.add(label);
    return true;
  });
}

/**
 * @param {import("./types").AnatomyModuleManifest} manifest
 * @param {{seed: string | number, count?: number, structureIds?: string[]}} options
 */
export function buildAnatomyQuiz(manifest, options) {
  const seed = String(options?.seed ?? "anatomy3d");
  const requestedIds = options?.structureIds ? new Set(options.structureIds) : null;
  const quizable = manifest.structures.filter((structure) => structure.quizable !== false);
  const eligible = quizable.filter((structure) => !requestedIds || requestedIds.has(structure.id));
  const orderedTargets = shuffled(eligible, `${seed}:${manifest.id}:targets`);
  const requestedCount = options?.count === undefined
    ? orderedTargets.length
    : Math.max(0, Math.floor(options.count));

  return orderedTargets.slice(0, requestedCount).map((target) => {
    const targetLabel = target.label.trim().toLocaleLowerCase();
    const otherStructures = uniqueByLabel(quizable.filter((structure) => structure.id !== target.id), [targetLabel]);
    if (otherStructures.length < 3) {
      throw new Error(`${manifest.id} needs at least four uniquely labelled quizable structures`);
    }

    const byId = new Map(otherStructures.map((structure) => [structure.id, structure]));
    const preferred = uniqueByLabel((target.distractorIds ?? []).flatMap((id) => {
      const structure = byId.get(id);
      return structure ? [structure] : [];
    }));
    const preferredIds = new Set(preferred.map((structure) => structure.id));
    const sameTissue = shuffled(
      otherStructures.filter((structure) => structure.tissue === target.tissue && !preferredIds.has(structure.id)),
      `${seed}:${manifest.id}:${target.id}:same-tissue`,
    );
    const usedIds = new Set([...preferredIds, ...sameTissue.map((structure) => structure.id)]);
    const remaining = shuffled(
      otherStructures.filter((structure) => !usedIds.has(structure.id)),
      `${seed}:${manifest.id}:${target.id}:remaining`,
    );
    const distractors = uniqueByLabel([...preferred, ...sameTissue, ...remaining], [targetLabel]).slice(0, 3);
    const questionId = `${manifest.id}-${target.id}-${seed}`;
    const choices = shuffled([target, ...distractors], `${questionId}:options`);
    const optionsForQuestion = choices.map((structure, index) => ({
      id: String.fromCharCode(65 + index),
      text: structure.label,
    }));
    const correctIndex = choices.findIndex((structure) => structure.id === target.id);
    const correctOptionId = optionsForQuestion[correctIndex].id;

    return {
      id: questionId,
      moduleId: manifest.id,
      structureId: target.id,
      prompt: "Which structure is highlighted?",
      options: optionsForQuestion,
      correctOptionId,
      explanation: target.description,
      distractorExplanations: Object.fromEntries(choices.flatMap((structure, index) => (
        structure.id === target.id
          ? []
          : [[optionsForQuestion[index].id, `${structure.label} — ${structure.description}`]]
      ))),
      difficulty: target.difficulty,
      view: target.view,
      label: target.label,
    };
  });
}

export function validateQuizQuestion(question) {
  const errors = [];
  const options = Array.isArray(question?.options) ? question.options : [];
  if (options.length !== 4) errors.push("question must have exactly four options");
  if (new Set(options.map((option) => option.id)).size !== options.length) errors.push("option IDs must be unique");
  if (new Set(options.map((option) => option.text?.trim().toLocaleLowerCase())).size !== options.length) {
    errors.push("option labels must be unique");
  }
  const correct = options.find((option) => option.id === question?.correctOptionId);
  if (!correct) errors.push("correct option must be present");
  if (correct && correct.text !== question?.label) errors.push("correct option must match the target label");
  return errors;
}
