import assert from "node:assert/strict";
import test from "node:test";
import { demoManifest } from "../src/lib/anatomy3d/manifests/respiratory/_demo.manifest.mjs";
import { buildAnatomyQuiz, validateQuizQuestion } from "../src/lib/anatomy3d/quiz.mjs";

test("anatomy quiz generation is deterministic for the same seed", () => {
  const first = buildAnatomyQuiz(demoManifest, { seed: "resp-demo-seed" });
  const second = buildAnatomyQuiz(demoManifest, { seed: "resp-demo-seed" });
  assert.deepEqual(first, second);
  assert.equal(first.length, demoManifest.structures.length);
});

test("anatomy questions have four unique options and identify the highlighted target", () => {
  const questions = buildAnatomyQuiz(demoManifest, { seed: "validity-seed" });
  for (const question of questions) {
    assert.deepEqual(validateQuizQuestion(question), []);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.text.toLocaleLowerCase())).size, 4);
    const correct = question.options.find((option) => option.id === question.correctOptionId);
    assert(correct);
    assert.equal(correct.text, question.label);
    assert.equal(
      demoManifest.structures.find((structure) => structure.id === question.structureId)?.label,
      question.label,
    );
  }
});
