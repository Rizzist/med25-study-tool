import {NextResponse} from 'next/server';
import {createAuth,safeReturnTo} from '@/src/lib/server/auth-core.mjs';
import {authFailure,privateHeaders,readAuthBody,setSessionCookie} from '@/src/lib/server/auth';
export const runtime='nodejs';
export async function POST(request:Request){try{const body=await readAuthBody(request);const result=await createAuth().login(body.username,body.password);return setSessionCookie(NextResponse.json({next:result.mustChangePassword?'/change-password':safeReturnTo(body.next)},{headers:privateHeaders}),result);}catch(error){return authFailure(error);}}
