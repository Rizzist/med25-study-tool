import {NextRequest,NextResponse} from 'next/server';
import {createAuth,requestToken,safeReturnTo} from './src/lib/server/auth-core.mjs';

const publicPaths=new Set(['/login','/change-password','/api/auth/login','/api/auth/password','/api/auth/logout','/api/auth/session','/favicon.svg','/favicon.ico','/med25-sw.js','/med25-pdf-cache.mjs','/med25-auth-cache.mjs']);
export async function proxy(request:NextRequest){
  const pathname=request.nextUrl.pathname;
  if(publicPaths.has(pathname)||pathname.startsWith('/_next/static/')||process.env.NODE_ENV==='development'&&pathname.startsWith('/_next/'))return NextResponse.next();
  let session;
  try{session=await createAuth().session(requestToken(request));}catch{return NextResponse.json({error:'Authentication service unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});}
  const full=session&&!session.mustChangePassword;
  if(!full){
    if(pathname.startsWith('/api/')||pathname.startsWith('/study/')||pathname.startsWith('/anatomy3d/')||pathname==='/_next/image'||/\.[a-z\d]+$/i.test(pathname))return NextResponse.json({error:'Authentication required.',code:session?'PASSWORD_CHANGE_REQUIRED':'LOGIN_REQUIRED'},{status:session?403:401,headers:{'Cache-Control':'no-store'}});
    const url=request.nextUrl.clone();url.pathname=session?'/change-password':'/login';url.search='';if(!session)url.searchParams.set('next',safeReturnTo(pathname+request.nextUrl.search));return NextResponse.redirect(url);
  }
  const response=NextResponse.next();response.headers.set('Cache-Control','private, no-store, max-age=0');response.headers.set('CDN-Cache-Control','no-store');response.headers.set('Vercel-CDN-Cache-Control','no-store');return response;
}
export const config={matcher:['/((?!_next/static|_next/webpack-hmr).*)']};
