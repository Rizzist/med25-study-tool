import {neon} from '@neondatabase/serverless';

export const AUTH_TABLE_SQL=`CREATE TABLE IF NOT EXISTS public.med25_auth_state (
  record_key text PRIMARY KEY,
  state_json text NOT NULL CHECK (jsonb_typeof(state_json::jsonb) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
)`;

/** A single private, durable account record. SQL parameters never enter query text. */
export function postgresAuthStore({connectionString,key='med25:private-auth:v1',sqlFactory=neon}){
  let parsed;
  try{parsed=new URL(connectionString);}catch{throw new Error('Invalid MED25 database configuration.');}
  if(!['postgres:','postgresql:'].includes(parsed.protocol)||!parsed.hostname.endsWith('.neon.tech')||!parsed.username||!parsed.password||parsed.pathname==='/')throw new Error('A dedicated Neon Postgres connection is required.');
  if(parsed.searchParams.get('sslmode')==='disable')throw new Error('Database encryption must remain enabled.');
  const sql=sqlFactory(connectionString);
  async function query(text,values=[]){
    try{return await sql.query(text,values,{fetchOptions:{cache:'no-store',signal:AbortSignal.timeout(10000)}});}
    catch{throw new Error('Authentication database unavailable.');}
  }
  return {
    async read(){const rows=await query('SELECT state_json FROM public.med25_auth_state WHERE record_key = $1',[key]);return rows[0]?.state_json??null;},
    async cas(before,after){
      const rows=before===null
        ?await query('INSERT INTO public.med25_auth_state (record_key, state_json) VALUES ($1, $2) ON CONFLICT (record_key) DO NOTHING RETURNING record_key',[key,after])
        :await query('UPDATE public.med25_auth_state SET state_json = $2, updated_at = now() WHERE record_key = $1 AND state_json = $3 RETURNING record_key',[key,after,before]);
      return rows.length===1;
    },
    async provision(){await query(AUTH_TABLE_SQL);},
  };
}
