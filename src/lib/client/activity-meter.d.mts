export const IDLE_MS:number;
export const REPORT_INTERVAL_MS:number;
export function createActivityMeter(options?:{now?:()=>number;active?:boolean}):{interact:()=>void;setActive:(value:boolean)=>void;snapshot:()=>number};
