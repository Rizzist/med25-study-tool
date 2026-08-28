// Referential validation is separate from the medical/source review. A valid
// link proves that a question exists, not that it tests every sentence in notes.
const isGapQuestion = (id) => /^resp-(anat|hist|emb|phys)-gap-\d+$/.test(id);

export function auditRespiratoryCatalog(catalog, questions) {
  const errors = [];
  const modules = new Map(catalog.modules.map((module) => [module.id, module]));
  const concepts = new Map(catalog.concepts.map((concept) => [concept.id, concept]));
  const questionById = new Map(questions.map((question) => [question.id, question]));
  if (modules.size !== catalog.modules.length) errors.push("Duplicate module IDs");
  if (concepts.size !== catalog.concepts.length) errors.push("Duplicate concept IDs");
  if (questionById.size !== questions.length) errors.push("Duplicate respiratory question IDs");
  const globalIds = new Set([...modules.keys(), ...concepts.keys()]);
  if (globalIds.size !== modules.size + concepts.size) errors.push("Module/concept IDs overlap");
  const links = new Map();
  const objectives = [];
  const sourceMapped = new Set();

  for (const concept of catalog.concepts) {
    if (modules.get(concept.moduleId)?.subject !== concept.subject) errors.push(`${concept.id}: module missing or subject mismatch`);
    const basis = new Set(concept.sources.map((source) => source.basis));
    if (concept.scope === "book-and-slides" && (!basis.has("book") || !basis.has("slides"))) errors.push(`${concept.id}: book-and-slides needs both cited sources`);
    if (concept.scope === "book-only" && (basis.size !== 1 || !basis.has("book"))) errors.push(`${concept.id}: invalid book-only evidence`);
    if (concept.scope === "slide-only" && (basis.size !== 1 || !basis.has("slides"))) errors.push(`${concept.id}: invalid slide-only evidence`);
    if (concept.subject === "physiology" && concept.scope !== "book-only") errors.push(`${concept.id}: physiology teacher slides are unavailable`);
    for (const objective of concept.objectives) {
      if (globalIds.has(objective.id)) errors.push(`${objective.id}: duplicate objective/catalog ID`);
      globalIds.add(objective.id);
      objectives.push(objective);
      if (!objective.questionIds.length) errors.push(`${objective.id}: unsampled learning objective`);
      for (const id of objective.questionIds) {
        const question = questionById.get(id);
        if (!question) errors.push(`${objective.id}: unknown question ${id}`);
        else if (question.subject !== concept.subject) errors.push(`${objective.id}: ${id} has a different subject`);
        if (!links.has(id)) links.set(id, new Set());
        links.get(id).add(concept.id);
      }
    }
  }
  for (const entry of catalog.sourceAudit) {
    if (entry.status === "mapped" && !entry.conceptIds.length) errors.push(`${entry.topic}: mapped source has no concepts`);
    for (const id of entry.conceptIds) {
      if (!concepts.has(id)) errors.push(`${entry.topic}: unknown concept ${id}`);
      if (entry.status === "mapped") sourceMapped.add(id);
    }
  }
  for (const concept of catalog.concepts) if (!sourceMapped.has(concept.id)) errors.push(`${concept.id}: absent from mapped source inventory`);
  for (const definition of catalog.modules) if (!catalog.concepts.some((concept) => concept.moduleId === definition.id)) errors.push(`${definition.id}: empty module`);
  const prompts = new Map();
  for (const question of questions) {
    if (!links.has(question.id)) errors.push(`${question.id}: not mapped to a study concept`);
    if (question.status !== "verified" || !question.tags.includes("source-grounded")) errors.push(`${question.id}: unverified/ungrounded question`);
    if (!question.source.page && !question.source.slide) errors.push(`${question.id}: no source locator`);
    if (question.kind !== "dynamic_anatomy") {
      const prompt = question.prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (prompts.has(prompt)) errors.push(`${question.id}: repeated stem with ${prompts.get(prompt)}`);
      prompts.set(prompt, question.id);
    }
  }
  const index = Object.fromEntries(questions.map((question) => {
    const conceptIds = [...(links.get(question.id) ?? [])];
    const moduleIds = [...new Set(conceptIds.map((id) => concepts.get(id)?.moduleId).filter(Boolean))];
    return [question.id, {
      subject: question.subject, kind: question.kind, moduleId: moduleIds[0] ?? "unmapped", moduleIds,
      primaryConceptId: conceptIds[0] ?? "unmapped", conceptIds,
      dedupeKey: question.anatomy ? `${question.anatomy.imageId}:${question.anatomy.targetRegionId}` : question.id,
      prompt: question.prompt, learningObjective: question.learningObjective, addedForGap: isGapQuestion(question.id),
    }];
  }));
  const distinct = (ids) => new Set(ids.map((id) => index[id]?.dedupeKey ?? id)).size;
  const originalLink = (objective) => objective.questionIds.some((id) => index[id] && !index[id].addedForGap);
  const report = {
    schemaVersion: "1.0.0", updatedAt: catalog.updatedAt,
    moduleCount: modules.size, conceptCount: concepts.size, objectiveCount: objectives.length,
    mcqLinkedObjectives: objectives.filter((objective) => objective.questionIds.length).length,
    objectivesSampledBeforeExpansion: objectives.filter(originalLink).length,
    objectivesFirstSampledByExpansion: objectives.filter((objective) => objective.questionIds.length && !originalLink(objective)).length,
    questionCount: questions.length, addedQuestionCount: questions.filter((question) => isGapQuestion(question.id)).length,
    dynamicVariantCount: questions.filter((question) => question.kind === "dynamic_anatomy").length,
    dynamicTargetCount: distinct(questions.filter((question) => question.kind === "dynamic_anatomy").map((question) => question.id)),
    distinctPracticeItems: distinct(questions.map((question) => question.id)),
    unmappedQuestionIds: questions.filter((question) => !links.has(question.id)).map((question) => question.id),
    unsampledObjectiveIds: objectives.filter((objective) => !objective.questionIds.length).map((objective) => objective.id),
    byModule: catalog.modules.map((module) => {
      const children = catalog.concepts.filter((concept) => concept.moduleId === module.id);
      const objectives = children.flatMap((concept) => concept.objectives);
      const ids = [...new Set(objectives.flatMap((objective) => objective.questionIds))];
      return { id: module.id, title: module.title, subject: module.subject, conceptCount: children.length, objectiveCount: objectives.length, linkedObjectiveCount: objectives.filter((objective) => objective.questionIds.length).length, questions: ids.length, distinctItems: distinct(ids), newlySampledObjectives: objectives.filter((objective) => objective.questionIds.length && !originalLink(objective)).length };
    }),
    bySubject: ["anatomy", "histology", "embryology", "physiology"].map((subject) => ({
      subject, concepts: catalog.concepts.filter((concept) => concept.subject === subject).length,
      questions: questions.filter((question) => question.subject === subject).length,
      addedQuestions: questions.filter((question) => question.subject === subject && isGapQuestion(question.id)).length,
    })),
    sourceInventory: { mapped: catalog.sourceAudit.filter((entry) => entry.status === "mapped").length, limits: catalog.sourceAudit.filter((entry) => entry.status !== "mapped") },
    interpretation: "Question links sample objectives; neither link counts nor source inventory guarantee actual exam completeness or test every statement in the notes.",
  };
  return { errors, index, report };
}
