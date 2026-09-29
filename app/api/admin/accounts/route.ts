import {NextResponse} from 'next/server';
import {createAuth,requestToken,AuthError} from '@/src/lib/server/auth-core.mjs';
import {authFailure,privateHeaders,readAuthBody} from '@/src/lib/server/auth';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:Request){
  try{return NextResponse.json({accounts:await createAuth().listAccounts(requestToken(request))},{headers:privateHeaders});}
  catch(error){return authFailure(error);}
}
export async function POST(request:Request){
  try{
    const body=await readAuthBody(request),auth=createAuth(),token=requestToken(request);
    if('role' in body||'isAdmin' in body||'isOwner' in body)throw new AuthError('Use the owner role control to change roles.');
    if(body.action==='reset')return NextResponse.json(await auth.resetAccount(token,body.userId),{headers:privateHeaders});
    if(body.action!==undefined)throw new AuthError('Unknown account action.');
    return NextResponse.json(await auth.addAccount(token,body.userId,body.displayName),{status:201,headers:privateHeaders});
  }catch(error){return authFailure(error);}
}
export async function PATCH(request:Request){
  try{
    const body=await readAuthBody(request),auth=createAuth(),token=requestToken(request);
    if(body.action==='role')return NextResponse.json(await auth.setAccountRole(token,body.userId,body.role),{headers:privateHeaders});
    if(body.action!==undefined||'role' in body||'isAdmin' in body||'isOwner' in body)throw new AuthError('Use the owner role control to change roles.');
    return NextResponse.json(await auth.updateAccount(token,body.userId,body.displayName),{headers:privateHeaders});
  }
  catch(error){return authFailure(error);}
}
export async function DELETE(request:Request){
  try{const body=await readAuthBody(request);return NextResponse.json(await createAuth().removeAccount(requestToken(request),body.userId),{headers:privateHeaders});}
  catch(error){return authFailure(error);}
}
