import type { AnatomyStructure } from '../types';
export const practicalMeshModules: Record<string, { asset: string; structures: AnatomyStructure[]; groups: {id:string;members:string[]}[] }>;
export function practicalMeshStructures(key: string): AnatomyStructure[];
