import { examIds } from "./exams.mjs";

const clean = (value) => Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string" && id.length > 0 && id.length <= 160))] : [];

export function createEmptyProgress() {
  return { version: 1, exams: Object.fromEntries(examIds.map((id) => [id, { wrongIds: [], flaggedIds: [] }])) };
}

export function parseProgress(raw) {
  const result = createEmptyProgress();
  if (!raw) return result;
  try {
    const value = JSON.parse(raw);
    for (const id of examIds) {
      result.exams[id] = { wrongIds: clean(value?.exams?.[id]?.wrongIds), flaggedIds: clean(value?.exams?.[id]?.flaggedIds) };
    }
    // Keep the existing practical-exam migration without discarding any Term 1 history.
    for (const key of ["wrongIds", "flaggedIds"]) {
      const practicalIds = result.exams.july25[key].filter((id) => id.startsWith("hpr-"));
      result.exams.aug22[key] = clean([...result.exams.aug22[key], ...practicalIds]);
      result.exams.july25[key] = result.exams.july25[key].filter((id) => !id.startsWith("hpr-"));
    }
    return result;
  } catch { return result; }
}
