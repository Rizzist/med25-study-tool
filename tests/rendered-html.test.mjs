import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the MED//25 exam dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>MED\/\/25 Exam Sprint<\/title>/i);
  assert.match(html, /July 25 \+ July 29 exam sprint/i);
  assert.match(html, /Tissue Development &amp; Function/i);
  assert.match(html, /Cell &amp; Molecules/i);
  assert.match(html, /Priority exam/i);
  assert.match(html, /Codex tutor/i);
  assert.match(html, /Visual Guide/i);
  assert.match(html, /VISUAL LESSONS/i);
  assert.match(html, /histology/i);
  assert.match(html, /embryology/i);
  assert.doesNotMatch(html, /Your site is taking shape|starter loading skeleton/i);
});

test("source keeps answers hidden during sprints and supports the confirmed exam split", async () => {
  const [page, bridge, lessonGuide, manifestText, questionFiles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../scripts/codex-bridge.mjs", import.meta.url), "utf8"),
    readFile(new URL("../src/components/LessonGuide.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/bank/manifest.json", import.meta.url), "utf8"),
    readdir(new URL("../data/bank/questions/", import.meta.url)),
  ]);
  const manifest = JSON.parse(manifestText);

  assert.deepEqual(manifest.examDates, ["2026-07-25", "2026-07-29"]);
  assert.deepEqual(manifest.subjects.map((subject) => subject.id), [
    "histology",
    "embryology",
    "physiology",
    "biochemistry",
  ]);
  assert.ok(questionFiles.filter((name) => name.endsWith(".jsonl")).length >= 10);

  assert.match(page, /if \(phase === "active"\)/);
  assert.match(page, /End session/);
  assert.match(page, /Finish & grade/);
  assert.match(page, /if \(phase === "review"\)/);
  assert.match(page, /Ask Codex to audit my reasoning/);
  assert.match(page, /Open 90-second visual lesson/);
  assert.match(page, /tab === "Visual Guide" && <LessonGuide/);
  assert.match(page, /lessonForQuestion/);
  assert.match(page, /Tabs disappear during MCQs/);
  assert.match(page, /Guyton Chapters 1–8/);
  assert.match(page, /GUYTON 1–8/);
  assert.match(page, /Membrane physiology/);
  assert.match(page, /Biochemistry/);
  assert.match(page, /Practical \+ spotters/);
  assert.match(page, /reproductive histology/i);
  assert.match(page, /med25-study-progress-v1/);
  assert.match(page, /med25-session-archive-v1/);
  assert.match(page, /Past sprint results/);
  assert.match(page, /history: \[completedSession, \.\.\.current\.history\]/);
  assert.match(page, /Continue sprint/);
  assert.match(page, /Delete unfinished sprint/);
  assert.doesNotMatch(page, /maxSavedSessions/);
  assert.match(page, /active: null/);
  assert.match(page, /Wrong answers/);
  assert.match(page, /Retry these/);
  assert.match(page, /Clear .* saved progress/);
  assert.match(page, /window\.localStorage\.setItem/);
  assert.match(page, /wrongIds: \[\.\.\.new Set/);
  assert.match(page, /flaggedIds: flagged \? \[\.\.\.existing, questionId\] : existing/);
  assert.doesNotMatch(page, /cellbiology|Cell biology/);
  assert.match(page, /new URLSearchParams\(\{ limit: String\(sessionSize\), exam, collection: nextCollection \}\)/);
  assert.match(bridge, /JULY_25_HISTOLOGY_TOPICS/);
  assert.match(bridge, /Male reproductive system/);
  assert.match(bridge, /Female reproductive system/);
  assert.match(bridge, /JULY_25_EMBRYOLOGY_TOPICS/);
  assert.match(bridge, /JULY_25_PHYSIOLOGY_TOPICS/);
  assert.match(bridge, /"Cell physiology and homeostasis"/);
  assert.match(bridge, /"Membrane transport"/);
  assert.match(bridge, /"Membrane potentials"/);
  assert.match(bridge, /"Action potentials"/);
  assert.match(bridge, /Birth defects and prenatal diagnosis/);
  assert.match(bridge, /Neurotransmission and neurotransmitters/);
  assert.match(bridge, /JULY_29_BIOCHEMISTRY_TOPICS/);
  assert.match(bridge, /Practical biochemistry/);
  assert.match(bridge, /dna repair mechanisms/);
  assert.match(bridge, /Spectrophotometry/);
  assert.match(bridge, /DNA extraction/);
  assert.match(bridge, /POST" && url\.pathname === "\/api\/questions\/by-ids/);
  assert.match(bridge, /idSet\.has\(question\.id\) && matchesExam\(question, exam\)/);
  assert.match(bridge, /body\.preserveOrder === true/);
  assert.match(lessonGuide, /Full screen/);
  assert.match(lessonGuide, /Escape/);
  assert.doesNotMatch(bridge, /JULY_29_CELL_BIOLOGY_TOPICS/);
});
