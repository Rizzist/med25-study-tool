import assert from "node:assert/strict";
import test from "node:test";
import { TISSUES } from "../src/lib/anatomy3d/validate.mjs";
import { tissueToSystem, SYSTEMS, systemsInManifest } from "../src/lib/anatomy3d/systems.ts";
import { larynxRealManifest } from "../src/lib/anatomy3d/manifests/respiratory/larynx-real.manifest.mjs";

test("tissueToSystem classifies every Tissue into a known system", () => {
  const systemIds = new Set(SYSTEMS.map((system) => system.id));
  for (const tissue of TISSUES) {
    const system = tissueToSystem[tissue];
    assert.ok(system, `tissue "${tissue}" is not mapped to a system`);
    assert.ok(systemIds.has(system), `tissue "${tissue}" maps to unknown system "${system}"`);
  }
  // No stray keys beyond the known tissues (guards against typos / removed tissues).
  assert.deepEqual(new Set(Object.keys(tissueToSystem)), new Set(TISSUES));
});

test("systemsInManifest returns present systems in canonical order without duplicates", () => {
  const systems = systemsInManifest(larynxRealManifest);
  const orders = systems.map((system) => system.order);
  assert.deepEqual(orders, [...orders].sort((a, b) => a - b), "systems must be in canonical order");
  assert.equal(new Set(systems.map((system) => system.id)).size, systems.length, "no duplicates");
  const expected = new Set(larynxRealManifest.structures.map((structure) => tissueToSystem[structure.tissue]));
  assert.deepEqual(new Set(systems.map((system) => system.id)), expected);
});
