import {NextResponse} from 'next/server';
import {createActivity} from '@/src/lib/server/activity.mjs';
import {AuthError,requestToken} from '@/src/lib/server/auth-core.mjs';
import {privateHeaders,readAuthBody} from '@/src/lib/server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  try{const body=await readAuthBody(request);await createActivity().record(requestToken(request),body);return new NextResponse(null,{status:204,headers:privateHeaders});}
  catch(error){return NextResponse.json({error:error instanceof AuthError?error.message:'Activity unavailable.'},{status:error instanceof AuthError?error.status:503,headers:privateHeaders});}
}
