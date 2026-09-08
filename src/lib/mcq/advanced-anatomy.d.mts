import type { MCQQuestion } from './types';
import type { AnatomyModuleManifest } from '../anatomy3d/types';
export const FOUNDATION_LABELS: string[];
export const FOUNDATION_WRITTEN_IDS: Set<string>;
export function normalizedAnatomyLabel(label?: string): string;
export function isFoundationTarget(target?: string | {label?: string}): boolean;
export function anatomyPracticeExclusion(question: MCQQuestion, manifests?: AnatomyModuleManifest[]): string | undefined;
export function includeAdvancedAnatomyPractice(question: MCQQuestion, manifests?: AnatomyModuleManifest[]): boolean;
