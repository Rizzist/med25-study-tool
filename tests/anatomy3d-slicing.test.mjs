import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const viewerSource = fs.readFileSync(new URL("../src/components/anatomy3d/AnatomyViewer.tsx", import.meta.url), "utf8");
const questionSource = fs.readFileSync(new URL("../src/components/anatomy3d/AnatomyQuestion.tsx", import.meta.url), "utf8");

test("the shared anatomy viewer provides anatomical-plane clipping with depth and side controls", () => {
  for (const plane of ["sagittal", "coronal", "transverse"]) {
    assert.match(viewerSource, new RegExp(`\\b${plane}\\b`), `${plane} control is missing`);
  }
  assert.match(viewerSource, /new THREE\.Plane\(\)/);
  assert.match(viewerSource, /renderer\.clippingPlanes/);
  assert.match(viewerSource, /type="range"/);
  assert.match(viewerSource, /Flip side/);
  assert.match(viewerSource, /clipPlane\.distanceToPoint\(intersection\.point\)/, "picking must ignore clipped fragments");
});

test("embedded MCQs use the same sliceable viewer before grading", () => {
  assert.match(questionSource, /<AnatomyViewer/);
  assert.match(questionSource, /rotate, zoom and section before answering/);
  assert.match(questionSource, /pickEnabled=\{revealed\}/, "free picking should still unlock only after grading");
});
