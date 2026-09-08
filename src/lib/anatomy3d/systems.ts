// Anatomical LAYER taxonomy — groups the low-level `tissue` tag every structure already carries
// into user-facing SYSTEMS, so the trainer can peel the anatomy one system at a time (like an atlas).
//
// Pure data + helpers, relative imports only, erasable TS (no enum / namespace / parameter props) so
// node can type-strip and run it headlessly alongside the rest of `src/lib/anatomy3d/`.

import type { Tissue, AnatomyStructure, AnatomyModuleManifest } from "./types.ts";

export type AnatomySystem =
  | "skeleton"
  | "cartilage"
  | "muscle"
  | "airway"
  | "cavity"
  | "arteries"
  | "veins"
  | "nerves"
  | "fat"
  | "connective"
  | "organs";

// Every Tissue maps to exactly one system. Typed as `Record<Tissue, …>` so `tsc` refuses to compile
// if a future tissue is added to the union without being classified here (belt to the runtime test's
// braces).
export const tissueToSystem: Record<Tissue, AnatomySystem> = {
  bone: "skeleton",
  cartilage: "cartilage",
  muscle: "muscle",
  // `airway` and `cavity` are separate systems: `airway` is the respiratory conduit lining, whereas
  // `cavity` covers non-air spaces too (joint capsules, heart-chamber lumens, the pericardial and
  // pleural cavities), so they must not collapse into one "air spaces" label.
  airway: "airway",
  cavity: "cavity",
  artery: "arteries",
  vein: "veins",
  nerve: "nerves",
  fat: "fat",
  ligament: "connective",
  tendon: "connective",
  fascia: "connective",
  membrane: "connective",
  lung: "organs",
  gland: "organs",
  mucosa: "organs",
};

export type AnatomySystemMeta = {
  id: AnatomySystem;
  label: string;
  order: number;
};

// Canonical display order (superficial/structural -> deep/organ), used for chip ordering.
export const SYSTEMS: AnatomySystemMeta[] = [
  { id: "skeleton", label: "Bone", order: 0 },
  { id: "cartilage", label: "Cartilage", order: 1 },
  { id: "muscle", label: "Muscle", order: 2 },
  { id: "airway", label: "Airways", order: 3 },
  { id: "cavity", label: "Cavities", order: 4 },
  { id: "arteries", label: "Arteries", order: 5 },
  { id: "veins", label: "Veins", order: 6 },
  { id: "nerves", label: "Nerves", order: 7 },
  { id: "fat", label: "Fat", order: 8 },
  { id: "connective", label: "Connective tissue", order: 9 },
  { id: "organs", label: "Organs", order: 10 },
];

export function systemForStructure(structure: AnatomyStructure): AnatomySystem {
  return tissueToSystem[structure.tissue];
}

// The systems actually present in a manifest, in canonical `SYSTEMS` order (deduplicated).
export function systemsInManifest(manifest: AnatomyModuleManifest): AnatomySystemMeta[] {
  const present = new Set<AnatomySystem>();
  for (const structure of manifest.structures) present.add(tissueToSystem[structure.tissue]);
  return SYSTEMS.filter((system) => present.has(system.id));
}
