export const STUDENT_ID:string;
export const ADMIN_STUDENT_ID:string;
export const AUTH_COOKIE:string;
export const SESSION_SECONDS:number;
export class AuthError extends Error {status:number;code:string;constructor(message:string,status?:number,code?:string)}
export type AccountConfig={id:string;name:string|null};
export type AccountRole='owner'|'admin'|'student';
export type AuthSession={userId:string;displayName:string|null;role:AccountRole;isOwner:boolean;isAdmin:boolean;mustChangePassword:boolean;expiresAt:number};
export type LoginResult={token:string;maxAge:number;mustChangePassword:boolean;displayName:string|null};
export type ManagedAccount={userId:string;displayName:string|null;active:boolean;mustChangePassword:boolean;sessionCount:number;role:AccountRole;isOwner:boolean;isAdmin:boolean};
export function createAuth(options?:{store?:{read:()=>Promise<string|null>;cas:(before:string|null,after:string)=>Promise<boolean>};now?:()=>number;studentId?:string;accounts?:AccountConfig[];adminId?:string}):{configureAccounts:()=>Promise<{added:number;updated:number;accountCount:number}>;session:(token:string|null)=>Promise<AuthSession|null>;login:(username:unknown,password:unknown)=>Promise<LoginResult>;changePassword:(token:string|null,password:unknown,confirmation:unknown,currentPassword:unknown,displayName:unknown)=>Promise<LoginResult>;logout:(token:string|null)=>Promise<void>;listAccounts:(token:string|null)=>Promise<ManagedAccount[]>;addAccount:(token:string|null,userId:unknown,displayName:unknown)=>Promise<ManagedAccount>;updateAccount:(token:string|null,userId:unknown,displayName:unknown)=>Promise<{updated:true}>;removeAccount:(token:string|null,userId:unknown)=>Promise<{removed:true}>;resetAccount:(token:string|null,userId:unknown)=>Promise<{reset:true}>;setAccountRole:(token:string|null,userId:unknown,role:unknown)=>Promise<ManagedAccount>};
export function hashPassword(password:string):Promise<string>;
export function verifyPassword(password:string,hash:string):Promise<boolean>;
export function passwordProblem(value:unknown,studentId?:string):string|null;
export function displayNameProblem(value:unknown):string|null;
export function parseAccountConfig(raw?:string,legacyId?:string):AccountConfig[];
export function requestToken(request:Request):string|null;
export function safeReturnTo(value:unknown):string;
