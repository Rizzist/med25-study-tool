import {NextResponse} from 'next/server';
import {createAuth,requestToken,AUTH_COOKIE} from '@/src/lib/server/auth-core.mjs';
import {authFailure,privateHeaders,assertSameOrigin} from '@/src/lib/server/auth';
export const runtime='nodejs';
export async function POST(request:Request){try{assertSameOrigin(request);await createAuth().logout(requestToken(request));const response=NextResponse.json({next:'/login'},{headers:privateHeaders});response.cookies.set(AUTH_COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return response;}catch(error){return authFailure(error);}}
