import assert from "node:assert/strict";
import test from "node:test";
import { demoManifest } from "../src/lib/anatomy3d/manifests/respiratory/_demo.manifest.mjs";
import { validateManifest } from "../src/lib/anatomy3d/validate.mjs";

const manifests = [demoManifest];

test("every anatomy 3D manifest satisfies the pure-data contract", () => {
  for (const manifest of manifests) {
    assert.deepEqual(validateManifest(manifest), [], manifest.modelKey);
  }
});
