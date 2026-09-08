import assert from "node:assert/strict";
import test from "node:test";
import { listAnatomyModules } from "../src/lib/anatomy3d/registry.ts";
import { validateManifest } from "../src/lib/anatomy3d/validate.mjs";

const manifests = listAnatomyModules().map((registration) => registration.manifest);

test("every registered anatomy 3D manifest satisfies the pure-data contract", () => {
  for (const manifest of manifests) {
    assert.deepEqual(validateManifest(manifest), [], manifest.modelKey);
  }
});

test("the Term 2 anatomy atlas exposes the full registered cardiovascular, respiratory and limb target sets", () => {
  const counts = new Map();
  for (const manifest of manifests) {
    const quizable = manifest.structures.filter((structure) => structure.quizable !== false);
    const current = counts.get(manifest.region) ?? { total: 0, real: 0, schematic: 0 };
    current.total += quizable.length;
    current.real += quizable.filter((structure) => !structure.schematic).length;
    current.schematic += quizable.filter((structure) => structure.schematic).length;
    counts.set(manifest.region, current);

    for (const structure of quizable) {
      assert.ok(structure.description.length >= 24, `${manifest.modelKey}/${structure.id}: description is too thin`);
      assert.ok(structure.keyPoints?.length >= 1, `${manifest.modelKey}/${structure.id}: missing study checkpoints`);
    }
  }

  assert.deepEqual(counts.get("cvs"), { total: 169, real: 74, schematic: 95 });
  assert.deepEqual(counts.get("respiratory"), { total: 106, real: 37, schematic: 69 });
  assert.deepEqual(counts.get("upper-limb"), { total: 131, real: 71, schematic: 60 });
  assert.deepEqual(counts.get("lower-limb"), { total: 123, real: 78, schematic: 45 });

  const cvsModules = manifests.filter((manifest) => manifest.region === "cvs");
  assert.deepEqual(cvsModules.map((manifest) => manifest.modelKey), ["thoracic-wall", "heart", "mediastinum"]);
  assert.deepEqual(
    cvsModules.map((manifest) => manifest.structures.filter(
      (structure) => structure.quizable !== false && structure.tissue === "nerve",
    ).length),
    [10, 10, 13],
  );
  const cvsNerves = manifests
    .filter((manifest) => manifest.region === "cvs")
    .flatMap((manifest) => manifest.structures)
    .filter((structure) => structure.quizable !== false && structure.tissue === "nerve");
  const respiratoryNerves = manifests
    .filter((manifest) => manifest.region === "respiratory")
    .flatMap((manifest) => manifest.structures)
    .filter((structure) => structure.quizable !== false && structure.tissue === "nerve");
  const upperLimb = manifests.find((manifest) => manifest.region === "upper-limb");
  const lowerLimb = manifests.find((manifest) => manifest.region === "lower-limb");
  assert.equal(cvsNerves.length, 33);
  assert.equal(respiratoryNerves.length, 40);
  assert.equal(upperLimb.structures.filter((structure) => structure.tissue === "nerve").length, 49);
  assert.equal(lowerLimb.structures.filter((structure) => structure.tissue === "nerve").length, 33);
  assert.ok(cvsNerves.every((structure) => structure.schematic));
  assert.ok(respiratoryNerves.every((structure) => structure.schematic));
  assert.ok(upperLimb.structures.filter((structure) => structure.tissue === "nerve").every((structure) => structure.schematic));
  assert.ok(lowerLimb.structures.filter((structure) => structure.tissue === "nerve").every((structure) => structure.schematic));
});
