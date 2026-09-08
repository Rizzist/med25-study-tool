import type {AnatomyStructure} from '../types';
type XYZ=[number,number,number];
export const lowerPracticalConnective:{structures:(AnatomyStructure&{paths:XYZ[][];radius:number})[];cartilage:(AnatomyStructure&{boneId:string;bounds:{min:XYZ;max:XYZ};sphere?:{center:XYZ;radius:number};vertexRegions?:{axis:number;lessThanOrEqual?:number;greaterThanOrEqual?:number}[];normalConstraint?:{axis:number;lessThan?:number;greaterThan?:number}|null;normalOffset:number})[]};
export const lowerPracticalConnectiveStructures:AnatomyStructure[];
