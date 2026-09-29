import {NextResponse} from 'next/server';
import {createAuth,requestToken} from '@/src/lib/server/auth-core.mjs';
import {authFailure,privateHeaders,setSessionCookie} from '@/src/lib/server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  try{
    const token=requestToken(request),session=await createAuth().session(token,{renew:true});
    const response=NextResponse.json(session?{authenticated:true,displayName:session.displayName,isOwner:session.isOwner,isAdmin:session.isAdmin,mustChangePassword:session.mustChangePassword,expiresAt:session.expiresAt}:{authenticated:false},{status:session?200:401,headers:privateHeaders});
    if(session&&!session.mustChangePassword&&token)setSessionCookie(response,{...session,token,maxAge:Math.max(0,Math.floor((session.expiresAt-Date.now())/1000))});
    return response;
  }catch(error){return authFailure(error);}
}
