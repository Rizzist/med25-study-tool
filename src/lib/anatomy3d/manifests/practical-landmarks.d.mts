import type {AnatomyStructure} from '../types';
export const practicalLandmarkModules: Record<string,(AnatomyStructure & {position:[number,number,number];radius:number})[]>;
export function practicalLandmarkStructures(key:string):AnatomyStructure[];
