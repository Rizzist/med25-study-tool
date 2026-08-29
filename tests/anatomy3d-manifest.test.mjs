import assert from "node:assert/strict";
import test from "node:test";
import { larynxManifest } from "../src/lib/anatomy3d/manifests/respiratory/larynx.manifest.mjs";
import { nasalManifest } from "../src/lib/anatomy3d/manifests/respiratory/nasal.manifest.mjs";
import { tracheaLungManifest } from "../src/lib/anatomy3d/manifests/respiratory/trachea-lung.manifest.mjs";
import { validateManifest } from "../src/lib/anatomy3d/validate.mjs";

const manifests = [larynxManifest, nasalManifest, tracheaLungManifest];

test("every anatomy 3D manifest satisfies the pure-data contract", () => {
  for (const manifest of manifests) {
    assert.deepEqual(validateManifest(manifest), [], manifest.modelKey);
  }
});
