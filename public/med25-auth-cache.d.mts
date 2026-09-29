export function requireStudySession():Promise<{authenticated:true;displayName:string|null;isAdmin:boolean;mustChangePassword:false;expiresAt:number}>;
export function clearStudyCaches():Promise<void>;
