export function requireStudySession():Promise<{authenticated:true;displayName:string|null;mustChangePassword:false;expiresAt:number}>;
export function clearStudyCaches():Promise<void>;
