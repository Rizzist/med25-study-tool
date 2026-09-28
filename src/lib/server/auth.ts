import 'server-only';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {NextResponse} from 'next/server';
import {createAuth,requestToken,AUTH_COOKIE,AuthError,type LoginResult} from './auth-core.mjs';
export const privateHeaders={'Cache-Control':'private, no-store, max-age=0','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store'};
export function authFailure(error:unknown){
  return NextResponse.json({error:error instanceof AuthError?error.message:'Sign-in is temporarily unavailable. Persistent authentication storage must be configured.',code:error instanceof AuthError?error.code:'AUTH_UNAVAILABLE'},{status:error instanceof AuthError?error.status:503,headers:privateHeaders});
}
export async function requireApiSession(request:Request){
  try{const session=await createAuth().session(requestToken(request));if(!session)return NextResponse.json({error:'Please sign in.',code:'LOGIN_REQUIRED'},{status:401,headers:privateHeaders});if(session.mustChangePassword)return NextResponse.json({error:'Change your password first.',code:'PASSWORD_CHANGE_REQUIRED'},{status:403,headers:privateHeaders});return null;}catch(error){return authFailure(error);}
}
export async function pageSession(){
  // Keep Next's dynamic-rendering signal outside the storage error handler.
  const token=(await cookies()).get(AUTH_COOKIE)?.value??null;
  try{return await createAuth().session(token);}catch{return null;}
}
export async function requirePageSession(){const session=await pageSession();if(!session)redirect('/login');if(session.mustChangePassword)redirect('/change-password');return session;}
export function assertSameOrigin(request:Request){
  const origin=request.headers.get('origin');
  if(!origin||origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site'||request.headers.get('x-med25-auth')!=='1'||!request.headers.get('content-type')?.startsWith('application/json'))throw new AuthError('Request rejected. Reload this page and try again.',403);
}
export async function readAuthBody(request:Request){
  assertSameOrigin(request);
  if(Number(request.headers.get('content-length')??0)>4096)throw new AuthError('Request too large.',413);
  const reader=request.body?.getReader();if(!reader)throw new AuthError('Missing request.');let size=0,text='';const decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw new AuthError('Request too large.',413);}text+=decoder.decode(value,{stream:true});}
  try{const body=JSON.parse(text+decoder.decode());if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();return body;}catch{throw new AuthError('Invalid request.');}
}
export function setSessionCookie(response:NextResponse,result:LoginResult){response.cookies.set(AUTH_COOKIE,result.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:result.maxAge});return response;}
