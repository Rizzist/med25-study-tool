import type { MCQQuestion, MCQSource } from "./types";
export type AnatomySourceImage = {
  id: string; examId?: string; moduleKey?: string; title: string; path: string;
  width?: number; height?: number; alt: string; view?: string; markerMode?: "structure" | "label";
  source: MCQSource; attribution?: string;
  anatomy3d?: { modelKey: string; structureIds: string[] };
  labelMasks?: Array<{ x: number; y: number; width: number; height: number }>;
  regions: Array<{ id: string; label: string; description: string; x: number; y: number; width: number; height: number; structureId?: string; modelKey?: string; contextStructureIds?: string[]; distractorRegionIds?: string[] }>;
};
export function buildAnatomyQuestions(images: AnatomySourceImage[]): MCQQuestion[];
export function anatomyValidationErrors(question: MCQQuestion): string[];
