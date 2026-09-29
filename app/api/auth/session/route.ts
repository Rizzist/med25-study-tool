import {NextResponse} from 'next/server';
import {createAuth,requestToken} from '@/src/lib/server/auth-core.mjs';
import {authFailure,privateHeaders} from '@/src/lib/server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const session=await createAuth().session(requestToken(request));return NextResponse.json(session?{authenticated:true,displayName:session.displayName,mustChangePassword:session.mustChangePassword,expiresAt:session.expiresAt}:{authenticated:false},{status:session?200:401,headers:privateHeaders});}catch(error){return authFailure(error);}}
