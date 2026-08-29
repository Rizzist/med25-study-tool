import { listAnatomyModules } from "../src/lib/anatomy3d/registry.ts";
import { validateManifest } from "../src/lib/anatomy3d/validate.mjs";

function requestedModel(argv) {
  const index = argv.indexOf("--model");
  if (index === -1) return null;
  const modelKey = argv[index + 1];
  if (!modelKey || modelKey.startsWith("--")) throw new Error("--model requires a registry model key");
  return modelKey;
}

const modelKey = requestedModel(process.argv.slice(2));
const registrations = listAnatomyModules().filter((registration) => (
  modelKey === null || registration.manifest.modelKey === modelKey || registration.manifest.id === modelKey
));

if (modelKey !== null && registrations.length === 0) {
  throw new Error(`Unknown anatomy model: ${modelKey}`);
}

const failures = [];
for (const registration of registrations) {
  const { manifest } = registration;
  const manifestErrors = validateManifest(manifest);
  for (const error of manifestErrors) failures.push(`${manifest.modelKey}: ${error}`);

  const labelKeys = manifest.structures.map((structure) => structure.label.trim().toLocaleLowerCase());
  if (new Set(labelKeys).size !== labelKeys.length) failures.push(`${manifest.modelKey}: duplicate labels`);
  const manifestIds = new Set(manifest.structures.map((structure) => structure.id));
  const handle = await registration.createModel();
  let meshCount = 0;

  try {
    for (const structure of manifest.structures.filter((candidate) => candidate.quizable !== false)) {
      const objects = handle.structures.get(structure.id) ?? [];
      if (objects.length === 0) failures.push(`${manifest.modelKey}: ${structure.id} has no model objects`);
      for (const object of objects) {
        if (object.userData.structureId !== structure.id) {
          failures.push(`${manifest.modelKey}: structure map mismatch for ${structure.id}`);
        }
      }
    }

    handle.root.traverse((object) => {
      if (!("isMesh" in object) || object.isMesh !== true) return;
      meshCount += 1;
      const structureId = object.userData.structureId;
      if (typeof structureId !== "string" || !manifestIds.has(structureId)) {
        failures.push(`${manifest.modelKey}: mesh ${object.name || "<unnamed>"} has an unknown structureId`);
      }
      if (typeof structureId === "string" && !(handle.structures.get(structureId) ?? []).includes(object)) {
        failures.push(`${manifest.modelKey}: mesh ${object.name || "<unnamed>"} is missing from the structures map`);
      }
    });

    console.log(`✓ ${manifest.modelKey}: ${manifest.structures.length} structures, ${meshCount} meshes`);
  } finally {
    handle.dispose();
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${registrations.length} anatomy model${registrations.length === 1 ? "" : "s"}.`);
}
