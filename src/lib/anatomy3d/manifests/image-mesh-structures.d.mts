import type { AnatomyStructure } from "../types";
export const imageMeshModules: Record<string, { asset: string; structures: AnatomyStructure[]; source: Record<string, string> }>;
export function imageMeshStructures(modelKey: string): AnatomyStructure[];
