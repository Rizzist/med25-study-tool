import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { anatomyValidationErrors, buildAnatomyQuestions } from "../src/lib/mcq/dynamic-anatomy.mjs";
import { getAnatomyModule } from "../src/lib/anatomy3d/registry.ts";

const root = resolve(import.meta.dirname, "..");
const { images } = JSON.parse(readFileSync(resolve(root, "data/term2/anatomy-visual-images.json"), "utf8"));
const questions = buildAnatomyQuestions(images);
const seen = new Set();
for (const image of images) {
  if (seen.has(image.id)) throw new Error(`Duplicate anatomy image ${image.id}`);
  seen.add(image.id);
  if (!existsSync(resolve(root, "public/study", image.path))) throw new Error(`Missing image ${image.path}`);
  if (!image.source.lecture && !image.source.page) throw new Error(`Missing source locator ${image.id}`);
  const manifest = getAnatomyModule(image.anatomy3d?.modelKey ?? image.moduleKey)?.manifest;
  if (!manifest) throw new Error(`Missing 3D module for ${image.id}`);
  for (const region of image.regions) {
    const owner = getAnatomyModule(region.modelKey ?? manifest.modelKey)?.manifest;
    if (region.structureId && !owner?.structures.some((structure) => structure.id === region.structureId)) {
      throw new Error(`Unknown paired 3D target ${image.id}:${region.id}:${region.structureId}`);
    }
  }
}
for (const question of questions) {
  const errors = anatomyValidationErrors(question);
  if (errors.length) throw new Error(`${question.id}: ${errors.join("; ")}`);
}
const path = resolve(root, "data/bank/questions/term2-anatomy-visual.jsonl");
const text = questions.map((question) => JSON.stringify(question)).join("\n") + (questions.length ? "\n" : "");
if (process.argv.includes("--check")) {
  if (!existsSync(path) || readFileSync(path, "utf8") !== text) throw new Error("Stale anatomy visual question bank");
} else writeFileSync(path, text);
console.log(`Anatomy visual atlas: ${images.length} figures, ${images.reduce((n, image) => n + image.regions.length, 0)} targets, ${questions.length} MCQs; ${questions.filter((q) => q.anatomy3d).length} paired with 3D.`);

// Each source figure gets a readable concept and each labeled part its own retrieval objective.
// This extends the existing auditable curriculum instead of leaving image questions orphaned.
for (const stem of ["cvs", "respiratory", "limbs"]) {
  const examId = `term2-${stem}`;
  const selected = images.filter((image) => image.examId === examId);
  if (!selected.length) continue;
  const catalogPath = resolve(root, `data/term2/${stem}-concepts.json`);
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  const moduleId = `${stem === "respiratory" ? "resp" : stem}-visual-atlas`;
  catalog.modules = catalog.modules.filter((module) => module.id !== moduleId);
  catalog.concepts = catalog.concepts.filter((concept) => concept.moduleId !== moduleId);
  catalog.sourceAudit = catalog.sourceAudit.filter((entry) => !entry.conceptIds.some((id) => id.startsWith(`${moduleId}-`)));
  catalog.modules.push({ id: moduleId, title: "Anatomy image identification & location", subject: "anatomy", description: "Original source diagrams for both naming marked structures and finding named structures, with explanations and paired three-dimensional anatomy.", order: 14.5 });
  for (const image of selected) {
    const id = `${moduleId}-${image.id}`;
    const basis = image.source.lecture ? "slides" : "book";
    const locator = [image.source.page && `Page ${image.source.page}`, image.source.figure, image.source.slide && `Slide ${image.source.slide}`].filter(Boolean).join(" · ");
    catalog.concepts.push({
      id, moduleId, subject: "anatomy", title: image.title,
      summary: `Name and locate the labeled anatomy in ${image.title}. Follow each original callout to its structure and explain its anatomical relationships. Reverse practice uses the authored callout boxes rather than pretending the whole structure is pixel-segmented. ${image.regions[0].description}`,
      keyPoints: image.regions.map((region) => `${region.label}: ${region.description}`),
      examTraps: ["Follow the complete leader line to its endpoint; a nearby structure can be a plausible distractor.", "Check the viewing direction and laterality before naming a structure. The 3D view may show the other side of the same anatomical relationship."],
      retrievalPrompts: image.regions.map((region) => ({ prompt: `Locate ${region.label} and describe its relationship to surrounding structures.`, answer: region.description })),
      sources: [{ title: image.source.title, ...(image.source.edition ? { edition: image.source.edition } : {}), chapter: image.source.chapter, locator, basis }],
      scope: stem === "respiratory" ? basis === "book" ? "book-only" : "slide-only" : basis === "book" ? "book-extension" : "course",
      objectives: image.regions.map((region) => ({ id: `${id}-${region.id}`, text: `Name and locate ${region.label} in the original source figure and distinguish it from neighboring structures.`, questionIds: questions.filter((q) => q.anatomy.imageId === image.id && q.anatomy.targetRegionId === region.id).map((q) => q.id) })),
    });
    catalog.sourceAudit.push({ source: image.source.title, locator, topic: image.title, conceptIds: [id], status: "mapped", note: "Original labeled figure inspected; each authored target has its own image identification questions and source locator." });
  }
  const output = JSON.stringify(catalog, null, 2) + "\n";
  if (process.argv.includes("--check")) {
    if (readFileSync(catalogPath, "utf8") !== output) throw new Error(`Stale anatomy image concepts: ${stem}`);
  } else writeFileSync(catalogPath, output);
}
