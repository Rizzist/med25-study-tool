import assert from "node:assert/strict";
import test from "node:test";
import { larynxRealManifest as larynxManifest } from "../src/lib/anatomy3d/manifests/respiratory/larynx-real.manifest.mjs";
import { buildAnatomyQuiz, validateQuizQuestion } from "../src/lib/anatomy3d/quiz.mjs";
import { isFoundationTarget } from "../src/lib/mcq/advanced-anatomy.mjs";
import { listAnatomyModules } from "../src/lib/anatomy3d/registry.ts";

test("anatomy quiz generation is deterministic for the same seed", () => {
  const first = buildAnatomyQuiz(larynxManifest, { seed: "resp-larynx-seed" });
  const second = buildAnatomyQuiz(larynxManifest, { seed: "resp-larynx-seed" });
  assert.deepEqual(first, second);
  assert.equal(first.length, larynxManifest.structures.filter((structure) => structure.quizable !== false && !isFoundationTarget(structure)).length);
});

test("anatomy questions have four unique options and identify the highlighted target", () => {
  const questions = buildAnatomyQuiz(larynxManifest, { seed: "validity-seed" });
  const byId = new Map(larynxManifest.structures.map((structure) => [structure.id, structure]));
  for (const question of questions) {
    assert.deepEqual(validateQuizQuestion(question), []);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.text.toLocaleLowerCase())).size, 4);
    const correct = question.options.find((option) => option.id === question.correctOptionId);
    assert(correct);
    assert.equal(correct.text, question.label);
    // The highlighted structure is always a real structure in the module (viewer focus target).
    assert.ok(byId.has(question.structureId));
    if (question.kind === "identify") {
      // Identify variant: the correct label names the highlighted structure itself.
      assert.equal(byId.get(question.structureId)?.label, question.label);
    }
  }
});

// TASK 1 — a small visible layer (fewer than four structures) must still quiz: the correct answer
// stays a visible structure while distractor LABELS are borrowed from the rest of the module.
test("a two-to-three structure visible set still yields valid four-option questions", () => {
  const nerveIds = larynxManifest.structures
    .filter((structure) => structure.tissue === "nerve")
    .slice(0, 3)
    .map((structure) => structure.id);
  assert.ok(nerveIds.length >= 2 && nerveIds.length < 4, "expected a small (2-3) visible nerve set");
  const visible = new Set(nerveIds);

  const questions = buildAnatomyQuiz(larynxManifest, { seed: "small-set", structureIds: nerveIds });
  assert.equal(questions.length, nerveIds.length);

  let borrowedAppeared = false;
  for (const question of questions) {
    assert.deepEqual(validateQuizQuestion(question), []);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.text.toLocaleLowerCase())).size, 4);
    // The highlighted target is always one of the currently-visible structures...
    assert.ok(visible.has(question.structureId));
    if (question.kind === "identify") {
      // ...and for identify questions the correct answer is that visible structure.
      const correct = question.options.find((option) => option.id === question.correctOptionId);
      assert.equal(correct.text, larynxManifest.structures.find((s) => s.id === question.structureId).label);
      // At least one distractor label is borrowed from a structure outside the visible set.
      const visibleLabels = new Set(
        nerveIds.map((id) => larynxManifest.structures.find((s) => s.id === id).label.toLocaleLowerCase()),
      );
      const distractors = question.options.filter((option) => option.id !== question.correctOptionId);
      if (distractors.some((option) => !visibleLabels.has(option.text.toLocaleLowerCase()))) borrowedAppeared = true;
    }
  }
  // With only 2-3 same-system nerves visible, at least one identify question must borrow a label.
  assert.ok(borrowedAppeared, "distractor labels should be borrowed from the module when visible set is small");
});

// TASK 2 — distractors prefer the same system (tissue -> system) as the target.
test("distractors prefer the same system as the target when available", () => {
  // Two systems only (muscle + cartilage) so the relational variant is disabled and every question
  // is an identify question with a clear, deterministic same-system preference to assert.
  const manifest = {
    id: "same-system-fixture",
    region: "test",
    modelKey: "same-system-fixture",
    title: "Same-system fixture",
    subject: "anatomy",
    blurb: "",
    structures: [
      { id: "m1", label: "Muscle One", tissue: "muscle", description: "d", difficulty: 1 },
      { id: "m2", label: "Muscle Two", tissue: "muscle", description: "d", difficulty: 1 },
      { id: "m3", label: "Muscle Three", tissue: "muscle", description: "d", difficulty: 1 },
      { id: "m4", label: "Muscle Four", tissue: "muscle", description: "d", difficulty: 1 },
      { id: "c1", label: "Cartilage One", tissue: "cartilage", description: "d", difficulty: 1 },
      { id: "c2", label: "Cartilage Two", tissue: "cartilage", description: "d", difficulty: 1 },
    ],
  };
  const tissueByLabel = new Map(manifest.structures.map((structure) => [structure.label, structure.tissue]));

  const questions = buildAnatomyQuiz(manifest, { seed: "pref-seed" });
  const muscleQuestion = questions.find((question) => question.structureId === "m1");
  assert.ok(muscleQuestion);
  assert.equal(muscleQuestion.kind, "identify");
  const distractors = muscleQuestion.options.filter((option) => option.id !== muscleQuestion.correctOptionId);
  assert.equal(distractors.length, 3);
  // Three other muscles exist, so all three distractors must be muscles (same system), never cartilage.
  assert.ok(
    distractors.every((option) => tissueByLabel.get(option.text) === "muscle"),
    "same-system muscle distractors should be chosen over other-system structures",
  );
});

test("all advanced targets get identification questions, never elementary system classification", () => {
  for (const {manifest} of listAnatomyModules()) {
    const questions=buildAnatomyQuiz(manifest,{seed:"advanced-regression"});
    const targets=manifest.structures.filter(s=>s.quizable!==false&&!isFoundationTarget(s));
    assert.deepEqual(questions.map(q=>q.structureId).sort(),targets.map(s=>s.id).sort());
    for (const question of questions) {
      assert.deepEqual(validateQuizQuestion(question),[]);
      assert.equal(question.kind,"identify");
      assert(!isFoundationTarget(question.label));
      assert.equal(question.options.find(o=>o.id===question.correctOptionId).text,targets.find(s=>s.id===question.structureId).label);
    }
  }
});
