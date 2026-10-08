export const ACTIVITY_TIME_ZONE:'Asia/Tehran';
export type UsageVisit={id:string;startedAt:number;lastSeenAt:number;activeMs:number};
export type UsageDay={date:string;label:string;activeMs:number;visits:number};
export type UsageSeries={days:UsageDay[];totalActiveMs:number;totalVisits:number;recordedDays:number;unplottedVisits:number;unplottedActiveMs:number};
export function buildUsageSeries(visits:UsageVisit[],options?:{days?:7|30|90;now?:number}):UsageSeries;
export function formatActivityDuration(value:number):string;
