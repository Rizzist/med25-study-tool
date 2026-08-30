import { tissueToSystem, SYSTEMS } from "./systems.ts";

// Display label for each system id (e.g. "muscle" -> "Muscle", "cavity" -> "Cavities").
const SYSTEM_LABEL = new Map(SYSTEMS.map((system) => [system.id, system.label]));

// The user-facing SYSTEM a structure belongs to, derived purely from its authored `tissue` tag.
function systemOf(structure) {
  return tissueToSystem[structure.tissue];
}

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

// Standard "Which structure is highlighted?" question. The correct answer is always the (visible)
// target; the three distractor LABELS are drawn from the whole module, preferring same-system and
// visible structures, and only borrowing hidden-layer labels when the visible set is too small.
// Borrowed labels are never revealed, highlighted or made pickable — they are text options only.
function buildIdentifyQuestion(target, questionId, manifest, visibleIds) {
  const targetLabel = target.label.trim().toLocaleLowerCase();
  const targetSystem = systemOf(target);
  const moduleOthers = manifest.structures.filter((structure) => structure.id !== target.id);
  const byId = new Map(moduleOthers.map((structure) => [structure.id, structure]));

  // 1) Author-curated distractors (most plausible), resolved against the FULL module so a curated
  //    distractor that is currently hidden by a layer toggle can still supply its label.
  const preferred = uniqueByLabel(
    (target.distractorIds ?? []).flatMap((id) => (byId.has(id) ? [byId.get(id)] : [])),
    [targetLabel],
  );
  const usedIds = new Set(preferred.map((structure) => structure.id));
  const rest = moduleOthers.filter((structure) => !usedIds.has(structure.id));

  // 2) Same-system before other-system (plausibility: a muscle question offers other muscles first);
  //    within each band, visible structures before borrowed hidden ones so a hidden label is only
  //    pulled in when the visible set cannot supply enough distractors.
  const sameSystemVisible = rest.filter((s) => systemOf(s) === targetSystem && visibleIds.has(s.id));
  const sameSystemHidden = rest.filter((s) => systemOf(s) === targetSystem && !visibleIds.has(s.id));
  const otherVisible = rest.filter((s) => systemOf(s) !== targetSystem && visibleIds.has(s.id));
  const otherHidden = rest.filter((s) => systemOf(s) !== targetSystem && !visibleIds.has(s.id));

  const ordered = [
    ...preferred,
    ...shuffled(sameSystemVisible, `${questionId}:same-system-visible`),
    ...shuffled(sameSystemHidden, `${questionId}:same-system-hidden`),
    ...shuffled(otherVisible, `${questionId}:other-visible`),
    ...shuffled(otherHidden, `${questionId}:other-hidden`),
  ];
  const distractors = uniqueByLabel(ordered, [targetLabel]).slice(0, 3);
  if (distractors.length < 3) {
    throw new Error(`${manifest.id} needs at least four uniquely labelled structures for distractor labels`);
  }

  const choices = shuffled([target, ...distractors], `${questionId}:options`);
  const optionsForQuestion = choices.map((structure, index) => ({
    id: String.fromCharCode(65 + index),
    text: structure.label,
  }));
  const correctIndex = choices.findIndex((structure) => structure.id === target.id);

  return {
    id: questionId,
    kind: "identify",
    moduleId: manifest.id,
    structureId: target.id,
    prompt: "Which structure is highlighted?",
    options: optionsForQuestion,
    correctOptionId: optionsForQuestion[correctIndex].id,
    explanation: target.description,
    distractorExplanations: Object.fromEntries(choices.flatMap((structure, index) => (
      structure.id === target.id
        ? []
        : [[optionsForQuestion[index].id, `${structure.label} — ${structure.description}`]]
    ))),
    difficulty: target.difficulty,
    view: target.view,
    label: target.label,
    schematic: Boolean(target.schematic),
  };
}

// Relational variant "The highlighted structure is part of which system?" — a purely-data question
// (system derived from tissue, no geometry, no invented facts). The correct answer is the target's
// system; the three distractors are other systems that actually exist in this module. The viewer
// still highlights the same target structure via `structureId`.
function buildSystemQuestion(target, questionId, manifest, moduleSystems) {
  const targetSystem = systemOf(target);
  const otherSystems = shuffled(
    moduleSystems.filter((system) => system !== targetSystem),
    `${questionId}:system-distractors`,
  ).slice(0, 3);
  const systemChoices = shuffled([targetSystem, ...otherSystems], `${questionId}:system-options`);
  const optionsForQuestion = systemChoices.map((system, index) => ({
    id: String.fromCharCode(65 + index),
    text: SYSTEM_LABEL.get(system) ?? system,
  }));
  const correctIndex = systemChoices.findIndex((system) => system === targetSystem);
  const correctLabel = SYSTEM_LABEL.get(targetSystem) ?? targetSystem;

  return {
    id: questionId,
    kind: "system",
    moduleId: manifest.id,
    structureId: target.id,
    prompt: "The highlighted structure is part of which system?",
    options: optionsForQuestion,
    correctOptionId: optionsForQuestion[correctIndex].id,
    explanation: `${target.label} is ${target.tissue} tissue, so it belongs to the ${correctLabel} system.`,
    distractorExplanations: Object.fromEntries(systemChoices.flatMap((system, index) => (
      system === targetSystem
        ? []
        : [[optionsForQuestion[index].id, `${SYSTEM_LABEL.get(system) ?? system} is another system present in this module, not the one the highlighted structure belongs to.`]]
    ))),
    difficulty: target.difficulty,
    view: target.view,
    label: correctLabel,
    schematic: Boolean(target.schematic),
  };
}

/**
 * @param {import("./types").AnatomyModuleManifest} manifest
 * @param {{seed: string | number, count?: number, structureIds?: string[]}} options
 */
export function buildAnatomyQuiz(manifest, options) {
  const seed = String(options?.seed ?? "anatomy3d");
  const requestedIds = options?.structureIds ? new Set(options.structureIds) : null;
  const quizable = manifest.structures.filter((structure) => structure.quizable !== false);
  // Targets (and therefore correct answers) are only ever the visible/requested quizable structures.
  const eligible = quizable.filter((structure) => !requestedIds || requestedIds.has(structure.id));
  const orderedTargets = shuffled(eligible, `${seed}:${manifest.id}:targets`);
  const requestedCount = options?.count === undefined
    ? orderedTargets.length
    : Math.max(0, Math.floor(options.count));

  // Visible ids = the pool that may become the correct answer or a "visible" distractor. Hidden
  // structures still live in `manifest.structures` and may lend their labels as distractors only.
  const visibleIds = new Set(eligible.map((structure) => structure.id));
  // Distinct systems anywhere in the module. The relational variant needs four of them to offer a
  // clean four-option question, otherwise every question stays the standard identify variant.
  const moduleSystems = [...new Set(manifest.structures.map((structure) => tissueToSystem[structure.tissue]))];
  const canRelational = moduleSystems.length >= 4;

  return orderedTargets.slice(0, requestedCount).map((target) => {
    const questionId = `${manifest.id}-${target.id}-${seed}`;
    // Mix in the relational variant deterministically for roughly one question in four.
    const relational = canRelational && seedOf(`${questionId}:variant`) % 4 === 0;
    return relational
      ? buildSystemQuestion(target, questionId, manifest, moduleSystems)
      : buildIdentifyQuestion(target, questionId, manifest, visibleIds);
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
