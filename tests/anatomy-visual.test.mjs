import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { buildAnatomyQuestions, anatomyValidationErrors } from "../src/lib/mcq/dynamic-anatomy.mjs";
import { parseAnatomySession, selectAnatomySession } from "../src/lib/anatomy3d/visual-session.mjs";
import { getAnatomyModule } from "../src/lib/anatomy3d/registry.ts";
import { Group, Mesh, BoxGeometry } from "three";
import { tissueMaterial, applyDim, clearDim } from "../src/lib/anatomy3d/materials.ts";
import { reconcileImageMeshGroups } from "../src/lib/anatomy3d/models/image-mesh-groups.ts";

const catalog = JSON.parse(readFileSync(new URL("../data/term2/anatomy-visual-images.json", import.meta.url))).images;
const questions = buildAnatomyQuestions(catalog);

test("anatomy exam reserves viewport space for all choices and keeps teaching in an explicit review", () => {
  const trainer = readFileSync(new URL("../src/components/anatomy3d/AnatomyTrainer.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(trainer, /anatomy-exam-title/);
  assert.doesNotMatch(trainer, /<b>MED\/\/25<\/b>/);
  assert.match(trainer, /<dialog ref=\{reviewRef\}/);
  assert.match(trainer, /reviewRef\.current\?\.showModal\(\)/);
  assert.match(trainer, /Review answer/);
  assert.match(trainer, /revealed && <><p>\{question\.prompt\}/, "Review must obey delayed-feedback gating");
  assert.match(styles, /@media\(min-width:701px\)/);
  assert.match(styles, /grid-template-rows:auto minmax\(0,1fr\) auto/);
  assert.match(styles, /\.anatomy-exam-options\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /max-height:max\(280px,calc\(100dvh - 350px\)\)/, "Diagrams remain legible without forcing a clipped viewport");
  assert.match(styles, /\.anatomy-test-immersive\{height:auto;min-height:100dvh/, "Desktop page scroll remains available");
});

test("all original figure callouts have valid answer variants, masks, sources and a 3D context", () => {
  assert.equal(catalog.length, 57);
  for (const image of catalog) {
    assert.ok(existsSync(new URL("../public/study/" + image.path, import.meta.url)));
    assert.ok(image.source.page || image.source.slide);
    assert.ok(getAnatomyModule(image.moduleKey));
    assert.equal(new Set(image.regions.map((r) => r.label.toLowerCase())).size, image.regions.length);
    for (const region of image.regions) {
      const variants = questions.filter((q) => q.anatomy.imageId === image.id && q.anatomy.targetRegionId === region.id);
      assert.ok(variants.length > 0, region.id);
      for (const q of variants) {
        assert.deepEqual(anatomyValidationErrors(q), [], q.id);
        assert.equal(q.options.find((o) => o.id === q.correctOptionId).text, region.label);
        assert.ok(q.anatomy.modelKey);
        assert.ok(q.media[0].labelMasks.some((m) => m.x <= region.x && m.y <= region.y && m.x + m.width >= region.x + region.width && m.y + m.height >= region.y + region.height), region.id);
        assert.ok(!q.tags.some((tag) => /past[- ]exam|final[- ]bank/.test(tag)));
        if (q.anatomy3d) assert.ok(getAnatomyModule(q.anatomy3d.modelKey).manifest.structures.some((s) => s.id === q.anatomy3d.structureId));
        else assert.equal(region.structureId, undefined, "A missing mesh must not silently point to its parent");
      }
    }
  }
});

test("mixed tests interleave figures and retain only one variant per target", () => {
  const models = Array.from({ length: 8 }, (_, i) => ({ id: `test-model-${i}`, tags: [], anatomy3d: { modelKey: "upper-limb", structureId: `fixture-target-${i}` }, options: [{ id: "A" }] }));
  const pool = [...questions.filter((q) => q.tags.includes("exam-term2-limbs")), ...models];
  const session = selectAnatomySession(pool, { count: 30, seed: "test", feedback: "exam" });
  assert.deepEqual(session, selectAnatomySession(pool, { count: 30, seed: "test", feedback: "exam" }));
  assert.equal(session.length, 30);
  assert.equal(session.filter((item) => item.initialView === "2d").length, 24);
  const imageItems = session.filter((item) => item.question.anatomy);
  const keys = imageItems.map(({ question: q }) => q.anatomy.imageId + ":" + q.anatomy.targetRegionId);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(new Set(imageItems.slice(0, 10).map(({ question: q }) => q.anatomy.imageId)).size >= 8);
  assert.ok(selectAnatomySession(pool, { format: "3d" }).every((item) => item.initialView === "3d" && item.question.anatomy3d));
});

test("restoring a test validates answers, bounds its cursor and preserves deferred feedback", () => {
  const selected = questions.slice(0, 4);
  const saved = JSON.stringify({ version: 1, ids: selected.map((q) => q.id), answers: { [selected[0].id]: "A", [selected[1].id]: "not-an-option" }, index: 999, graded: false, feedback: "exam" });
  const restored = parseAnatomySession(saved, selected);
  assert.equal(restored.index, 3);
  assert.equal(restored.answers[selected[0].id], "A");
  assert.equal(restored.answers[selected[1].id], undefined);
  assert.equal(restored.graded, false);
  assert.equal(restored.feedback, "exam");
  assert.equal(parseAnatomySession(saved, []), null, "Cannot restore another exam's questions");
  assert.equal(parseAnatomySession("broken", selected), null);
});

test("a bronchial tree is context only and cannot replace the proximal bronchus answer", () => {
  const image = catalog.find((image) => image.id === "resp-2d-segmental-bronchi-gray");
  assert.equal(image.regions.find((region) => region.label === "Left main bronchus").structureId, "left-main-bronchus");
  const segment = image.regions.find((region) => region.label === "Right apical segmental bronchus (B1)");
  assert.equal(segment.structureId, undefined);
  assert.ok(segment.contextStructureIds.length > 0);
  assert.ok(questions.filter((q) => q.anatomy.targetRegionId === segment.id && q.anatomy.imageId === image.id).every((q) => !q.anatomy3d));
});

test("aggregate thenar selection reuses component geometry and does not dim a selected component", () => {
  const root = new Group();
  const ids = ["thenar-muscle-group", "visual-abductor-pollicis-brevis", "visual-flexor-pollicis-brevis-superficial-head", "visual-opponens-pollicis"];
  const entries = ids.map((id) => { const mesh = new Mesh(new BoxGeometry(), tissueMaterial("muscle")); mesh.userData.structureId = id; root.add(mesh); return [id, [mesh]]; });
  const map = new Map(entries), formerAggregate = map.get(ids[0])[0];
  const aliases = reconcileImageMeshGroups(map, "upper-limb");
  assert.equal(formerAggregate.parent, null);
  assert.equal(root.children.length, 3);
  assert.deepEqual(aliases.get(ids[0]), ids.slice(1));
  assert.deepEqual(map.get(ids[0]), ids.slice(1).flatMap((id) => map.get(id)));
  applyDim(map, [ids[1]]);
  assert.equal(map.get(ids[1])[0].material.opacity, 1, "Alias must not re-dim the highlighted component");
  assert.equal(map.get(ids[2])[0].material.opacity, 0.4);
  clearDim(map);
  for (const object of root.children) { object.geometry.dispose(); object.material.dispose(); }
});

test("dimming never increases the opacity of transparent anatomical shells", () => {
  const shell = new Mesh(new BoxGeometry(), tissueMaterial("cavity"));
  shell.material.opacity = 0.05;
  const map = new Map([["pericardium", [shell]], ["alias", [shell]]]);
  applyDim(map, []);
  assert.ok(Math.abs(shell.material.opacity - 0.02) < 1e-9);
  clearDim(map);
  assert.equal(shell.material.opacity, 0.05);
  shell.geometry.dispose(); shell.material.dispose();
});
