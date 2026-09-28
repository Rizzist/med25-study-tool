import {NextResponse} from 'next/server';
import {createAuth,requestToken} from '@/src/lib/server/auth-core.mjs';
import {authFailure,privateHeaders,readAuthBody,setSessionCookie} from '@/src/lib/server/auth';
export const runtime='nodejs';
export async function POST(request:Request){try{const body=await readAuthBody(request);const result=await createAuth().changePassword(requestToken(request),body.password,body.confirmation,body.currentPassword);return setSessionCookie(NextResponse.json({next:'/'},{headers:privateHeaders}),result);}catch(error){return authFailure(error);}}
