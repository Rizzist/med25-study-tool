import type { AnatomyModuleManifest, CameraView } from "./types";

export type AnatomyQuizOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
};

export type AnatomyQuizKind = "identify" | "system";

export type AnatomyQuestion = {
  id: string;
  /**
   * "identify" — pick the highlighted structure's name (label is the structure's label).
   * "system"   — pick the system the highlighted structure belongs to (label is the system's label).
   */
  kind: AnatomyQuizKind;
  moduleId: string;
  structureId: string;
  prompt: string;
  options: AnatomyQuizOption[];
  correctOptionId: string;
  explanation: string;
  distractorExplanations: Record<string, string>;
  difficulty: 1 | 2 | 3;
  view?: CameraView;
  label: string;
};

export function buildAnatomyQuiz(
  manifest: AnatomyModuleManifest,
  options: { seed: string | number; count?: number; structureIds?: string[] },
): AnatomyQuestion[];

export function validateQuizQuestion(question: AnatomyQuestion): string[];
