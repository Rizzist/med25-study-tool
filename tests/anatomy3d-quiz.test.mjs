import assert from "node:assert/strict";
import test from "node:test";
import { larynxRealManifest as larynxManifest } from "../src/lib/anatomy3d/manifests/respiratory/larynx-real.manifest.mjs";
import { buildAnatomyQuiz, validateQuizQuestion } from "../src/lib/anatomy3d/quiz.mjs";

test("anatomy quiz generation is deterministic for the same seed", () => {
  const first = buildAnatomyQuiz(larynxManifest, { seed: "resp-larynx-seed" });
  const second = buildAnatomyQuiz(larynxManifest, { seed: "resp-larynx-seed" });
  assert.deepEqual(first, second);
  assert.equal(first.length, larynxManifest.structures.filter((structure) => structure.quizable !== false).length);
});

test("anatomy questions have four unique options and identify the highlighted target", () => {
  const questions = buildAnatomyQuiz(larynxManifest, { seed: "validity-seed" });
  for (const question of questions) {
    assert.deepEqual(validateQuizQuestion(question), []);
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.text.toLocaleLowerCase())).size, 4);
    const correct = question.options.find((option) => option.id === question.correctOptionId);
    assert(correct);
    assert.equal(correct.text, question.label);
    assert.equal(
      larynxManifest.structures.find((structure) => structure.id === question.structureId)?.label,
      question.label,
    );
  }
});
