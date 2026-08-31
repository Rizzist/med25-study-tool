const forbiddenAssessmentTag = /(?:^|-)past(?:-|$)|final-bank|telegram-final|downloaded-final|official-exam/;

function normalizedPrompt(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function dedupeKey(question) {
  if (question.anatomy) return `${question.anatomy.imageId}:${question.anatomy.targetRegionId}`;
  if (question.anatomy3d) return `${question.anatomy3d.modelKey}:${question.anatomy3d.structureId}`;
  return question.id;
}

export function auditTerm2ConceptCatalog(catalog, questions) {
  const errors = [];
  const modules = new Map(catalog.modules.map((item) => [item.id, item]));
  const concepts = new Map(catalog.concepts.map((item) => [item.id, item]));
  const questionById = new Map(questions.map((item) => [item.id, item]));
  if (modules.size !== catalog.modules.length) errors.push("Duplicate module IDs");
  if (concepts.size !== catalog.concepts.length) errors.push("Duplicate concept IDs");
  if (questionById.size !== questions.length) errors.push("Duplicate question IDs");

  const globalIds = new Set([...modules.keys(), ...concepts.keys()]);
  if (globalIds.size !== modules.size + concepts.size) errors.push("Module/concept IDs overlap");
  const links = new Map();
  const objectives = [];
  const mappedConcepts = new Set();

  for (const concept of catalog.concepts) {
    if (modules.get(concept.moduleId)?.subject !== concept.subject) errors.push(`${concept.id}: module missing or subject mismatch`);
    const bases = new Set(concept.sources.map((source) => source.basis));
    const hasCourseEvidence = ["slides", "transcript", "notes", "media"].some((basis) => bases.has(basis));
    if (concept.scope === "course" && !hasCourseEvidence) errors.push(`${concept.id}: course scope needs direct course evidence`);
    if (concept.scope === "book-extension" && !bases.has("book")) errors.push(`${concept.id}: book extension needs a cited book source`);
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
      if (entry.status === "mapped") mappedConcepts.add(id);
    }
  }
  for (const concept of catalog.concepts) if (!mappedConcepts.has(concept.id)) errors.push(`${concept.id}: absent from mapped source inventory`);
  for (const definition of catalog.modules) if (!catalog.concepts.some((concept) => concept.moduleId === definition.id)) errors.push(`${definition.id}: empty module`);

  const prompts = new Map();
  for (const question of questions) {
    if (!links.has(question.id)) errors.push(`${question.id}: not mapped to a study concept`);
    if (question.status !== "verified") errors.push(`${question.id}: not verified`);
    if (!(question.tags ?? []).includes(`exam-${catalog.examId}`)) errors.push(`${question.id}: missing exam routing`);
    if (!(question.tags ?? []).some((tag) => tag === "study-practice" || tag === "source-grounded-practice")) errors.push(`${question.id}: missing study-practice routing`);
    if ((question.tags ?? []).some((tag) => forbiddenAssessmentTag.test(tag))) errors.push(`${question.id}: forbidden past/final assessment tag`);
    if (!question.source?.page && !question.source?.slide) errors.push(`${question.id}: no precise page/slide locator`);
    if (!question.kind.startsWith("dynamic_anatomy")) {
      const key = normalizedPrompt(question.prompt);
      if (prompts.has(key)) errors.push(`${question.id}: repeated stem with ${prompts.get(key)}`);
      prompts.set(key, question.id);
    }
  }

  const index = Object.fromEntries(questions.map((question) => {
    const conceptIds = [...(links.get(question.id) ?? [])];
    const moduleIds = [...new Set(conceptIds.map((id) => concepts.get(id)?.moduleId).filter(Boolean))];
    return [question.id, {
      subject: question.subject,
      kind: question.kind,
      moduleId: moduleIds[0] ?? "unmapped",
      moduleIds,
      conceptIds,
      primaryConceptId: conceptIds[0] ?? "unmapped",
      dedupeKey: dedupeKey(question),
      prompt: question.prompt,
      learningObjective: question.learningObjective,
      addedForGap: (question.tags ?? []).includes("gap-audit"),
    }];
  }));
  const distinct = (ids) => new Set(ids.map((id) => index[id]?.dedupeKey ?? id)).size;
  const originalLink = (objective) => objective.questionIds.some((id) => index[id] && !index[id].addedForGap);
  const report = {
    schemaVersion: "1.0.0",
    examId: catalog.examId,
    updatedAt: catalog.updatedAt,
    moduleCount: modules.size,
    conceptCount: concepts.size,
    objectiveCount: objectives.length,
    mcqLinkedObjectives: objectives.filter((objective) => objective.questionIds.length).length,
    objectivesSampledBeforeExpansion: objectives.filter(originalLink).length,
    objectivesFirstSampledByExpansion: objectives.filter((objective) => objective.questionIds.length && !originalLink(objective)).length,
    questionCount: questions.length,
    addedQuestionCount: questions.filter((question) => (question.tags ?? []).includes("gap-audit")).length,
    imageQuestionCount: questions.filter((question) => question.media?.length).length,
    interactive3dCount: questions.filter((question) => question.kind === "dynamic_anatomy_3d").length,
    distinctPracticeItems: distinct(questions.map((question) => question.id)),
    unmappedQuestionIds: questions.filter((question) => !links.has(question.id)).map((question) => question.id),
    unsampledObjectiveIds: objectives.filter((objective) => !objective.questionIds.length).map((objective) => objective.id),
    byModule: catalog.modules.map((module) => {
      const children = catalog.concepts.filter((concept) => concept.moduleId === module.id);
      const moduleObjectives = children.flatMap((concept) => concept.objectives);
      const ids = [...new Set(moduleObjectives.flatMap((objective) => objective.questionIds))];
      return {
        id: module.id,
        title: module.title,
        subject: module.subject,
        conceptCount: children.length,
        objectiveCount: moduleObjectives.length,
        linkedObjectiveCount: moduleObjectives.filter((objective) => objective.questionIds.length).length,
        questions: ids.length,
        distinctItems: distinct(ids),
        newlySampledObjectives: moduleObjectives.filter((objective) => objective.questionIds.length && !originalLink(objective)).length,
      };
    }),
    sourceInventory: {
      mapped: catalog.sourceAudit.filter((entry) => entry.status === "mapped").length,
      limits: catalog.sourceAudit.filter((entry) => entry.status !== "mapped"),
    },
    interpretation: "Question links sample objectives; neither link counts nor the source inventory guarantee official exam completeness or weighting.",
  };
  return { errors, index, report };
}
