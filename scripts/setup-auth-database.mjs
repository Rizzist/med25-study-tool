// Explicit owner-run setup; never executed on a public request or during a build.
import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {postgresAuthStore} from '../src/lib/server/auth-postgres.mjs';
import {createAuth,parseAccountConfig} from '../src/lib/server/auth-core.mjs';

try{
  const env={...parseEnv(await readFile('.env.local','utf8')),...process.env};
  const accounts=parseAccountConfig(env.MED25_AUTH_ACCOUNTS,env.MED25_STUDENT_ID);
  if(!env.MED25_DATABASE_URL)throw Error('MED25_DATABASE_URL must point to the dedicated MED25 database.');
  const store=postgresAuthStore({connectionString:env.MED25_DATABASE_URL,key:env.MED25_AUTH_KEY??'med25:private-auth:v1'});
  await store.provision();
  if(process.argv.includes('--import-local')){
    const local=JSON.parse(await readFile('.med25-auth/state.json','utf8'));
    if(local.schema!==1||!accounts.some(account=>account.id===local.userId)||!/^scrypt\$65536\$8\$2\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(local.passwordHash)||typeof local.mustChangePassword!=='boolean')throw Error('Local account did not pass validation. Nothing imported.');
    // Preserve the existing password, not local session tokens or an old rate limit.
    const record=JSON.stringify({...local,sessions:[],attempts:{start:Date.now(),count:0}});
    if(!await store.cas(null,record))throw Error('A cloud account already exists. Refusing to overwrite it.');
    console.log('Local password hash migrated to MED25 database. Existing local sessions were not copied.');
  }
  const summary=await createAuth({store,accounts}).configureAccounts();
  console.log(`MED25 authentication table ready for ${summary.accountCount} account(s). No credential values printed.`);
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
