export type LabelLocation={id:string;label:string};
export function placeAnatomyLabel(assignments:Record<string,string>,locationId:string,labelId:string,locations:LabelLocation[],labels:LabelLocation[]):Record<string,string>;
export function gradeAnatomyLabels(assignments:Record<string,string>,locations:LabelLocation[],labels:LabelLocation[]):{labelId:string;locationId?:string;correct:boolean}[];
export function restoreLabelBoard(raw:string|null,boardId:string,locations:LabelLocation[],labels:LabelLocation[]):{assignments:Record<string,string>;graded:boolean}|null;
