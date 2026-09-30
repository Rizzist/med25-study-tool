export const RETENTION_MS:number;
export const MAX_VISITS:number;
export type ActivityVisit={id:string;startedAt:number;lastSeenAt:number;activeMs:number};
export type ActivityReport={generatedAt:number;retentionDays:number;maxVisitsPerUser:number;users:Array<{userId:string;displayName:string|null;active:boolean;lastSeenAt:number|null;activeMs:number;visits:ActivityVisit[]}>};
export function createActivity():{record:(token:string|null,body:unknown)=>Promise<{recorded:boolean}>;report:(token:string|null)=>Promise<ActivityReport>};
