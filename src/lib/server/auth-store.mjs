import {mkdir,readFile,writeFile,rename,unlink,rmdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {postgresAuthStore} from './auth-postgres.mjs';

export class AuthStorageError extends Error {}

/** One versioned record, atomically compared/replaced. Never use ephemeral Vercel files. */
export function authStore(env=process.env) {
  // An explicit MED25 prefix prevents accidentally sharing another project's database.
  // Explicit local file mode also isolates test servers from .env.local cloud credentials.
  if(env.MED25_AUTH_STORAGE==='file'&&env.VERCEL)throw new AuthStorageError('Persistent authentication storage is not configured.');
  if(env.MED25_AUTH_STORAGE!=='file'&&env.MED25_DATABASE_URL){
    return postgresAuthStore({connectionString:env.MED25_DATABASE_URL,key:env.MED25_AUTH_KEY??'med25:private-auth:v1'});
  }
  if(env.MED25_AUTH_STORAGE==='neon')throw new AuthStorageError('MED25 database configuration is missing.');
  const url=env.UPSTASH_REDIS_REST_URL??env.KV_REST_API_URL;
  const token=env.UPSTASH_REDIS_REST_TOKEN??env.KV_REST_API_TOKEN;
  if(env.MED25_AUTH_STORAGE!=='file'&&(url||token)){
    if(!url||!token)throw new AuthStorageError('Both authentication storage settings are required.');
    if(!url.startsWith('https://'))throw new AuthStorageError('Authentication requires HTTPS storage.');
    const key=env.MED25_AUTH_KEY??'med25:private-auth:v1';
    async function command(args){
      try{
        const response=await fetch(url,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify(args),cache:'no-store',signal:AbortSignal.timeout(7000)});
        if(!response.ok)throw new Error();const data=await response.json();if(data.error)throw new Error();return data.result;
      }catch{throw new AuthStorageError('Authentication storage unavailable.');}
    }
    return {read:()=>command(['GET',key]),cas:(before,after)=>command(['EVAL',"local v=redis.call('GET',KEYS[1]); if (ARGV[1]=='nil' and not v) or (ARGV[1]=='value' and v==ARGV[2]) then redis.call('SET',KEYS[1],ARGV[3]); return 1 else return 0 end",1,key,before===null?'nil':'value',before??'',after]).then(Boolean)};
  }
  if(env.VERCEL||env.NODE_ENV==='production'&&env.MED25_AUTH_STORAGE!=='file')throw new AuthStorageError('Persistent authentication storage is not configured.');
  // Local-only path is deliberately dynamic; never trace the entire checkout into a function.
  const file=env.MED25_AUTH_FILE?path.resolve(/*turbopackIgnore: true*/ env.MED25_AUTH_FILE):path.join(process.cwd(),'.med25-auth','state.json');
  const dir=path.dirname(file),lock=file+'.lock';
  async function read(){try{return await readFile(file,'utf8');}catch(error){if(error.code==='ENOENT')return null;throw new AuthStorageError('Authentication storage unavailable.');}}
  return {read,async cas(before,after){
    await mkdir(dir,{recursive:true,mode:0o700});
    let acquired=false;
    for(let i=0;i<100;i++){try{await mkdir(lock,{mode:0o700});acquired=true;break;}catch(error){if(error.code!=='EEXIST')throw error;await new Promise(r=>setTimeout(r,25));}}
    if(!acquired)throw new AuthStorageError('Authentication storage busy.');
    const temporary=file+'.'+randomUUID()+'.tmp';
    try{if(await read()!==before)return false;await writeFile(temporary,after,{flag:'wx',mode:0o600});await rename(temporary,file);return true;}
    finally{await unlink(temporary).catch(()=>{});await rmdir(lock);}
  }};
}
