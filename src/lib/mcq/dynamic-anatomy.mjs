function seedOf(text) {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
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

export function buildAnatomyQuestions(images) {
  return images.flatMap((image) => image.regions.flatMap((target) => {
    const others = image.regions.filter((region) => region.id !== target.id);
    if (others.length < 3) throw new Error(`${image.id} needs at least four identified structures`);
    const preferredIds = target.distractorRegionIds ?? [];
    const pool = shuffled(others, `${image.id}:${target.id}`).sort((a, b) => {
      const rank = (region) => preferredIds.includes(region.id) ? preferredIds.indexOf(region.id) : 99;
      return rank(a) - rank(b);
    });
    // A second variant changes the distractor set, not merely the answer letter.
    const variants = pool.length > 3 ? [1, 2] : [1];
    return variants.map((variant) => {
      const id = `resp-dyn-${image.id}-${target.id}-v${variant}`;
      const distractors = variant === 1 ? pool.slice(0, 3) : [pool[0], pool[2], pool[3]];
      const choices = shuffled([target, ...distractors], id);
      const options = choices.map((region, index) => ({ id: String.fromCharCode(65 + index), text: region.label }));
      const correctOptionId = options[choices.findIndex((region) => region.id === target.id)].id;
      return {
        schemaVersion: "1.0.0", id, revision: 1, status: "verified", kind: "dynamic_anatomy", subject: "anatomy",
        topic: image.title, chapter: image.source.chapter, difficulty: 2,
        prompt: `In this ${image.view ?? "anatomical"} source diagram, which structure is centered at marker A?`,
        options, correctOptionId, acceptedFreeText: [target.label],
        explanation: `Marker A identifies the ${target.label}. ${target.description}`,
        distractorExplanations: Object.fromEntries(choices.flatMap((region, index) => region.id === target.id ? [] : [[options[index].id, `${region.label} is not the marked target. ${region.description}`]])),
        learningObjective: `Identify the ${target.label} and distinguish it from adjacent structures.`,
        source: image.source,
        media: [{ id: image.id, type: "image", path: image.path, alt: image.alt, caption: image.title,
          attribution: image.attribution ?? `Source: ${image.source.title}${image.source.slide ? `, slide ${image.source.slide}` : ""}. Educational reference from the local study library.`,
          labelMasks: image.labelMasks ?? [],
          annotations: image.regions.map(({ id, label, x, y, width, height, description }) => ({ id, label, x, y, width, height, description })),
        }],
        anatomy: { imageId: image.id, targetRegionId: target.id, variant },
        tags: ["term-2", "exam-term2-respiratory", "source-grounded", "respiratory-anatomy", "dynamic-anatomy"],
        examPriority: "high", qualityFlags: [],
      };
    });
  }));
}

export function anatomyValidationErrors(question) {
  const errors = [];
  if (question.kind !== "dynamic_anatomy") return errors;
  if (question.subject !== "anatomy") errors.push("dynamic anatomy subject must be anatomy");
  const media = question.media?.find((item) => item.id === question.anatomy?.imageId);
  if (!media) return ["dynamic anatomy image is missing"];
  const regions = media.annotations ?? [];
  if (regions.length < 4) errors.push("dynamic anatomy needs at least four regions");
  if (new Set(regions.map((region) => region.id)).size !== regions.length) errors.push("duplicate region IDs");
  if (new Set(regions.map((region) => region.label.toLowerCase())).size !== regions.length) errors.push("duplicate region labels");
  const target = regions.find((region) => region.id === question.anatomy?.targetRegionId);
  if (!target) errors.push("target region is missing");
  if (target && (media.labelMasks ?? []).some((mask) => {
    const x = target.x + target.width / 2;
    const y = target.y + target.height / 2;
    return x >= mask.x && x <= mask.x + mask.width && y >= mask.y && y <= mask.y + mask.height;
  })) errors.push("target is obscured by a label mask");
  if (target && question.options?.find((option) => option.id === question.correctOptionId)?.text !== target.label) errors.push("answer does not identify target region");
  for (const option of question.options ?? []) if (!regions.some((region) => region.label === option.text)) errors.push(`unknown anatomical option: ${option.id}`);
  for (const region of regions) if (!region.description?.trim()) errors.push(`region lacks explanation: ${region.id}`);
  for (const box of [...regions, ...(media.labelMasks ?? [])]) {
    if (![box.x, box.y, box.width, box.height].every(Number.isFinite) || box.x < 0 || box.y < 0 || box.width <= 0 || box.height <= 0 || box.x + box.width > 1.000001 || box.y + box.height > 1.000001) errors.push("annotation or mask extends outside image");
  }
  return errors;
}
