/** Every valid `Tissue` string (keep in sync with the `Tissue` union in types.ts). */
export const TISSUES = [
  "cartilage", "bone", "mucosa", "muscle", "ligament", "membrane", "airway",
  "lung", "nerve", "artery", "vein", "gland", "cavity", "fat",
];

const tissues = new Set(TISSUES);

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/** @param {import("./types").AnatomyModuleManifest} manifest */
export function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") return ["manifest must be an object"];
  if (!nonEmpty(manifest.id)) errors.push("manifest id is required");
  if (!nonEmpty(manifest.region)) errors.push("manifest region is required");
  if (!nonEmpty(manifest.modelKey)) errors.push("manifest modelKey is required");
  if (!nonEmpty(manifest.title)) errors.push("manifest title is required");
  if (manifest.subject !== "anatomy") errors.push("manifest subject must be anatomy");
  if (!nonEmpty(manifest.blurb)) errors.push("manifest blurb is required");
  if (!Array.isArray(manifest.structures)) return [...errors, "manifest structures must be an array"];

  const ids = new Set();
  const labels = new Set();
  for (const [index, structure] of manifest.structures.entries()) {
    const prefix = `structure ${index + 1}`;
    if (!nonEmpty(structure?.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(structure.id)) {
      errors.push(`${prefix} id must be unique kebab-case`);
    } else if (ids.has(structure.id)) {
      errors.push(`duplicate structure id: ${structure.id}`);
    } else {
      ids.add(structure.id);
    }
    if (!nonEmpty(structure?.label)) {
      errors.push(`${prefix} label is required`);
    } else {
      const normalizedLabel = structure.label.trim().toLocaleLowerCase();
      if (labels.has(normalizedLabel)) errors.push(`duplicate structure label: ${structure.label}`);
      labels.add(normalizedLabel);
    }
    if (!tissues.has(structure?.tissue)) errors.push(`${structure?.id ?? prefix} has an invalid tissue`);
    if (!nonEmpty(structure?.description)) errors.push(`${structure?.id ?? prefix} needs a description`);
    if (![1, 2, 3].includes(structure?.difficulty)) errors.push(`${structure?.id ?? prefix} has an invalid difficulty`);
    if (structure?.aliases !== undefined && (!Array.isArray(structure.aliases) || structure.aliases.some((alias) => !nonEmpty(alias)))) {
      errors.push(`${structure?.id ?? prefix} aliases must be non-empty strings`);
    }
    if (structure?.keyPoints !== undefined && (!Array.isArray(structure.keyPoints) || structure.keyPoints.some((point) => !nonEmpty(point)))) {
      errors.push(`${structure?.id ?? prefix} keyPoints must be non-empty strings`);
    }
    if (structure?.view !== undefined) {
      if (!Number.isFinite(structure.view.azimuth) || !Number.isFinite(structure.view.elevation)) {
        errors.push(`${structure?.id ?? prefix} view angles must be finite`);
      }
      if (structure.view.zoom !== undefined && (!Number.isFinite(structure.view.zoom) || structure.view.zoom <= 0)) {
        errors.push(`${structure?.id ?? prefix} view zoom must be positive`);
      }
    }
  }

  for (const structure of manifest.structures) {
    if (!Array.isArray(structure?.distractorIds)) continue;
    const seen = new Set();
    for (const distractorId of structure.distractorIds) {
      if (distractorId === structure.id) errors.push(`${structure.id} cannot distract with itself`);
      if (!ids.has(distractorId)) errors.push(`${structure.id} has unknown distractor ${distractorId}`);
      if (seen.has(distractorId)) errors.push(`${structure.id} repeats distractor ${distractorId}`);
      seen.add(distractorId);
    }
  }

  const quizable = manifest.structures.filter((structure) => structure.quizable !== false);
  if (quizable.length > 0 && quizable.length < 4) errors.push("a quizable module needs at least four structures");
  return errors;
}
