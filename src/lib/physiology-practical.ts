import catalog from "@/data/term2/physiology-practical.json";

export const practicalCatalog = catalog;
export type PracticalStation = (typeof catalog.stations)[number];
const questionIds = new Set(catalog.stations.flatMap((station) => station.questionIds));
export function cleanPracticalIds(exam: unknown, value: unknown): string[] | undefined {
  if (exam !== catalog.examId || !Array.isArray(value)) return undefined;
  const ids = [...new Set(value.filter((id): id is string => typeof id === "string" && questionIds.has(id)))];
  return ids.length ? ids : undefined;
}
