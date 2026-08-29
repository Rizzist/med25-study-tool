import assert from "node:assert/strict";
import test from "node:test";
import { nasalRealManifest } from "../src/lib/anatomy3d/manifests/respiratory/nasal-real.manifest.mjs";
import { larynxRealManifest } from "../src/lib/anatomy3d/manifests/respiratory/larynx-real.manifest.mjs";
import { tracheaLungRealManifest } from "../src/lib/anatomy3d/manifests/respiratory/trachea-lung-real.manifest.mjs";
import { validateManifest } from "../src/lib/anatomy3d/validate.mjs";

const manifests = [nasalRealManifest, larynxRealManifest, tracheaLungRealManifest];

test("every registered anatomy 3D manifest satisfies the pure-data contract", () => {
  for (const manifest of manifests) {
    assert.deepEqual(validateManifest(manifest), [], manifest.modelKey);
  }
});
