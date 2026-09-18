import type {AnatomyStructure} from '../types';
export const practicalCompletionStructures: AnatomyStructure[];
export const practicalCompletion: {
  assets:{path:string;sha256:string;bytes:number}[];
  structures:AnatomyStructure[];
  groupAliases:{id:string;members:string[]}[];
  splitMuscleIds:string[];
  replaceProceduralIds:string[];
  parentRouteCorrections:{id:string;paths:[number,number,number][][]}[];
  contextNodes:string[];
  withheld:{id:string;reason?:string}[];
};
