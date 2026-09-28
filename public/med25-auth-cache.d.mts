export function requireStudySession():Promise<{authenticated:true;mustChangePassword:false;expiresAt:number}>;
export function clearStudyCaches():Promise<void>;
