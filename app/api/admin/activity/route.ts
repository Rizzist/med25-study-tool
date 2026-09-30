import {NextResponse} from 'next/server';
import {createActivity} from '@/src/lib/server/activity.mjs';
import {AuthError,requestToken} from '@/src/lib/server/auth-core.mjs';
import {privateHeaders} from '@/src/lib/server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  try{return NextResponse.json(await createActivity().report(requestToken(request)),{headers:privateHeaders});}
  catch(error){return NextResponse.json({error:error instanceof AuthError?error.message:'Activity unavailable.'},{status:error instanceof AuthError?error.status:503,headers:privateHeaders});}
}
