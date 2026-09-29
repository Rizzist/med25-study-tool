export const STUDENT_ID:string;
export const AUTH_COOKIE:string;
export const SESSION_SECONDS:number;
export class AuthError extends Error {status:number;code:string;constructor(message:string,status?:number,code?:string)}
export type AccountConfig={id:string;name:string|null};
export type AuthSession={userId:string;displayName:string|null;mustChangePassword:boolean;expiresAt:number};
export type LoginResult={token:string;maxAge:number;mustChangePassword:boolean;displayName:string|null};
export function createAuth(options?:{store?:{read:()=>Promise<string|null>;cas:(before:string|null,after:string)=>Promise<boolean>};now?:()=>number;studentId?:string;accounts?:AccountConfig[]}):{configureAccounts:()=>Promise<{added:number;updated:number;accountCount:number}>;session:(token:string|null)=>Promise<AuthSession|null>;login:(username:unknown,password:unknown)=>Promise<LoginResult>;changePassword:(token:string|null,password:unknown,confirmation:unknown,currentPassword:unknown,displayName:unknown)=>Promise<LoginResult>;logout:(token:string|null)=>Promise<void>};
export function hashPassword(password:string):Promise<string>;
export function verifyPassword(password:string,hash:string):Promise<boolean>;
export function passwordProblem(value:unknown,studentId?:string):string|null;
export function displayNameProblem(value:unknown):string|null;
export function parseAccountConfig(raw?:string,legacyId?:string):AccountConfig[];
export function requestToken(request:Request):string|null;
export function safeReturnTo(value:unknown):string;
