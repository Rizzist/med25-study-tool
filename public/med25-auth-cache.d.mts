export type StudySession={authenticated:true;displayName:string|null;isOwner:boolean;isAdmin:boolean;mustChangePassword:false;expiresAt:number};
export const SESSION_LEASE_MS:number;
export function createSessionCache(env?:{fetch?:typeof fetch;now?:()=>number;onUnauthorized?:()=>void}):{require:()=>Promise<StudySession>;seed:(value:StudySession)=>boolean;clear:()=>void;denied:()=>Error&{code:string}};
export function requireStudySession():Promise<StudySession>;
export function seedStudySession(value:StudySession):boolean;
export function invalidateStudySession():void;
export function denyStudySession():Error&{code:string};
export function clearStudyCaches():Promise<void>;
