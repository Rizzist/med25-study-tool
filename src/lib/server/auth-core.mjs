import {scrypt as scryptCallback,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {authStore} from './auth-store.mjs';

const scrypt=promisify(scryptCallback);
// Server only. Account IDs and names are supplied by private environment configuration.
export const STUDENT_ID=process.env.MED25_STUDENT_ID??'';
export const ADMIN_STUDENT_ID=process.env.MED25_ADMIN_STUDENT_ID??STUDENT_ID;
export const AUTH_COOKIE='med25_session';
export const SESSION_SECONDS=60*60*24*7;
const LIMITED_SECONDS=60*15;
const WINDOW=15*60*1000;
const MAX_ATTEMPTS=12;
export class AuthError extends Error {constructor(message,status=400,code='AUTH_ERROR'){super(message);this.status=status;this.code=code;}}

export async function hashPassword(password){
  const salt=randomBytes(16).toString('hex');
  const key=await scrypt(password,salt,32,{N:65536,r:8,p:2,maxmem:128*1024*1024});
  return `scrypt$65536$8$2$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password,encoded){
  const [algorithm,n,r,p,salt,hash,...extra]=String(encoded).split('$');
  if(algorithm!=='scrypt'||n!=='65536'||r!=='8'||p!=='2'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(hash)||extra.length)return false;
  const key=await scrypt(password,salt,32,{N:65536,r:8,p:2,maxmem:128*1024*1024});
  return timingSafeEqual(key,Buffer.from(hash,'hex'));
}
const digest=value=>createHash('sha256').update(value).digest('hex');
function managedUserId(value){if(typeof value!=='string'||!/^\d{5,32}$/.test(value))throw new AuthError('Enter a valid student ID.');return value;}
export function passwordProblem(value,studentId=STUDENT_ID){
  if(typeof value!=='string'||value.length<12||value.length>128)return 'Use 12–128 characters for your new password.';
  if(value.trim().length<12||(studentId&&value.includes(studentId)))return 'Choose a password that is not your student ID.';
  if(/^(.)\1+$/.test(value)||['password1234','123456789012','qwertyuiop12','abcdefghijkl'].includes(value.toLowerCase()))return 'Choose a less predictable password or passphrase.';
  return null;
}
export function displayNameProblem(value){
  if(typeof value!=='string'||value.trim().length<2||value.trim().length>80)return 'Enter your full name (2–80 characters).';
  if(!/^[\p{L}\p{M}][\p{L}\p{M} .’'\-]*$/u.test(value.trim()))return 'Use letters, spaces, apostrophes, periods, or hyphens in your name.';
  return null;
}
export function parseAccountConfig(raw=process.env.MED25_AUTH_ACCOUNTS,legacyId=STUDENT_ID){
  let accounts;
  if(raw){try{accounts=JSON.parse(raw);}catch{throw new AuthError('The authorized student accounts are not configured correctly.',503,'AUTH_UNAVAILABLE');}}
  else accounts=legacyId?[{id:legacyId,name:null}]:[];
  if(!Array.isArray(accounts)||accounts.length<1||accounts.length>20)throw new AuthError('The authorized student accounts are not configured correctly.',503,'AUTH_UNAVAILABLE');
  const seen=new Set();
  return accounts.map(entry=>{
    const id=entry?.id,name=entry?.name??null;
    if(typeof id!=='string'||!/^\d{5,32}$/.test(id)||seen.has(id)||(name!==null&&displayNameProblem(name)))throw new AuthError('The authorized student accounts are not configured correctly.',503,'AUTH_UNAVAILABLE');
    seen.add(id);return {id,name:name===null?null:name.trim()};
  });
}
function validAttempts(value){return Number.isInteger(value?.count)&&Number.isFinite(value?.start);}
function validAccount(account,id){return account?.userId===id&&(account.displayName===null||typeof account.displayName==='string')&&typeof account.passwordHash==='string'&&typeof account.mustChangePassword==='boolean'&&Array.isArray(account.sessions)&&validAttempts(account.attempts)&&(account.active===undefined||typeof account.active==='boolean');}
function decode(raw){
  if(raw===null)return null;
  const state=JSON.parse(raw);
  if(state.schema===1){
    if(typeof state.userId!=='string'||typeof state.passwordHash!=='string'||typeof state.mustChangePassword!=='boolean'||!Array.isArray(state.sessions)||!validAttempts(state.attempts))throw new Error('Invalid authentication state; refusing to reset accounts.');
    return state;
  }
  if(state.schema!==2||!state.accounts||Array.isArray(state.accounts)||typeof state.accounts!=='object'||!validAttempts(state.unsupportedAttempts))throw new Error('Invalid authentication state; refusing to reset accounts.');
  for(const [id,account] of Object.entries(state.accounts))if(!validAccount(account,id))throw new Error('Invalid authentication state; refusing to reset accounts.');
  return state;
}
function validSession(state,token,now,adminId){
  if(!state||state.schema!==2||typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  for(const [id,account] of Object.entries(state.accounts)){
    if(account.active===false)continue;
    const session=account.sessions.find(item=>item.hash===digest(token)&&item.expiresAt>now);
    if(session)return {userId:id,displayName:account.displayName,isAdmin:id===adminId,mustChangePassword:account.mustChangePassword||session.limited,expiresAt:session.expiresAt};
  }
  return null;
}

export function createAuth({store=authStore(),now=Date.now,accounts,studentId,adminId}={}){
  const configured=accounts!==undefined?parseAccountConfig(JSON.stringify(accounts),''):studentId!==undefined?parseAccountConfig('',studentId):parseAccountConfig();
  const effectiveAdminId=adminId||process.env.MED25_ADMIN_STUDENT_ID||studentId||STUDENT_ID||configured[0].id;
  if(!/^\d{5,32}$/.test(effectiveAdminId))throw new AuthError('The administrator account is not configured correctly.',503,'AUTH_UNAVAILABLE');
  async function mutate(fn){
    for(let i=0;i<12;i++){
      const raw=await store.read(),state=decode(raw),result=await fn(state);
      if(result.unchanged)return result.value;
      if(await store.cas(raw,JSON.stringify(result.state)))return result.value;
    }
    throw new AuthError('Please retry in a moment.',503);
  }
  async function configuredState(state){
    const timestamp=now(),hashes=new Map(await Promise.all(configured.map(async account=>[account.id,await hashPassword(account.id)])));
    if(state?.schema===1){
      const legacy=configured.find(account=>account.id===state.userId);
      if(!legacy)throw new Error('The existing authentication account is not in the authorized account list.');
      state={schema:2,accounts:{[state.userId]:{userId:state.userId,displayName:legacy.name,active:true,passwordHash:state.passwordHash,mustChangePassword:state.mustChangePassword,sessions:state.sessions,attempts:state.attempts}},unsupportedAttempts:{start:timestamp,count:0}};
    }else if(!state)state={schema:2,accounts:{},unsupportedAttempts:{start:timestamp,count:0}};
    let added=0,updated=0;
    for(const config of configured){
      const existing=state.accounts[config.id];
      if(!existing){state.accounts[config.id]={userId:config.id,displayName:config.name,active:true,passwordHash:hashes.get(config.id),mustChangePassword:true,sessions:[],attempts:{start:timestamp,count:0}};added++;}
      else if(existing.displayName===null&&config.name!==null){existing.displayName=config.name;updated++;}
    }
    return {state,summary:{added,updated,accountCount:Object.keys(state.accounts).length}};
  }
  async function configureAccounts(){
    return mutate(async state=>{const result=await configuredState(state);return {state:result.state,value:result.summary};});
  }
  async function ensureInitialized(){
    const state=decode(await store.read());
    if(state?.schema===2)return;
    await configureAccounts();
  }
  function issue(account,limited){
    const token=randomBytes(32).toString('base64url'),seconds=limited?LIMITED_SECONDS:SESSION_SECONDS;
    account.sessions=account.sessions.filter(session=>session.expiresAt>now()).slice(-9);
    account.sessions.push({hash:digest(token),limited,expiresAt:now()+seconds*1000});
    return {token,maxAge:seconds,mustChangePassword:limited,displayName:account.displayName};
  }
  async function reserveAttempt(userId){
    return mutate(state=>{
      if(!state||state.schema!==2)throw new AuthError('Please retry.',503);
      const account=state.accounts[userId],attempts=account?.attempts??state.unsupportedAttempts;
      if(now()-attempts.start>=WINDOW){attempts.start=now();attempts.count=0;}
      if(attempts.count>=MAX_ATTEMPTS)throw new AuthError('Too many attempts. Try again in 15 minutes.',429,'RATE_LIMITED');
      attempts.count++;
      const fallback=Object.values(state.accounts)[0]?.passwordHash;
      return {state,value:account?.passwordHash??fallback};
    });
  }
  return {
    configureAccounts,
    async session(token){if(!token)return null;await ensureInitialized();return validSession(decode(await store.read()),token,now(),effectiveAdminId);},
    async login(username,password){
      if(typeof username!=='string'||typeof password!=='string'||username.length>80||password.length>128)throw new AuthError('Invalid student ID or password.',401);
      await ensureInitialized();
      const state=decode(await store.read());
      const account=state?.schema===2?state.accounts[username]:null;
      if(!account||account.active===false){
        const hash=await reserveAttempt(username);if(hash)await verifyPassword(password,hash);
        throw new AuthError('This student account is not supported. Ask the MED25 owner to add your student ID.',401,'UNSUPPORTED_ACCOUNT');
      }
      const hash=await reserveAttempt(username),valid=await verifyPassword(password,hash);
      if(!valid)throw new AuthError('Incorrect password. Please try again.',401,'INCORRECT_PASSWORD');
      return mutate(current=>{
        const account=current?.schema===2?current.accounts[username]:null;
        if(!account||account.passwordHash!==hash)throw new AuthError('Invalid student ID or password.',401);
        account.attempts={start:now(),count:0};return {state:current,value:issue(account,account.mustChangePassword)};
      });
    },
    async changePassword(token,password,confirmation,currentPassword,displayName){
      await ensureInitialized();
      const snapshot=decode(await store.read()),session=validSession(snapshot,token,now(),effectiveAdminId);
      if(!session)throw new AuthError('Please sign in again.',401);
      const account=snapshot.accounts[session.userId],nameProblem=displayNameProblem(displayName);
      if(nameProblem)throw new AuthError(nameProblem);
      const problem=passwordProblem(password,session.userId);if(problem)throw new AuthError(problem);
      if(password!==confirmation)throw new AuthError('The new passwords do not match.');
      if(!session.mustChangePassword){await reserveAttempt(session.userId);if(typeof currentPassword!=='string'||currentPassword.length>128||!await verifyPassword(currentPassword,account.passwordHash))throw new AuthError('Current password is incorrect.',400);}
      if(await verifyPassword(password,account.passwordHash))throw new AuthError('Choose a different password.');
      const hash=await hashPassword(password),normalizedName=displayName.trim();
      return mutate(state=>{
        const currentSession=validSession(state,token,now(),effectiveAdminId),current=currentSession?state.accounts[currentSession.userId]:null;
        if(!current||currentSession.userId!==session.userId||current.passwordHash!==account.passwordHash)throw new AuthError('Please sign in again.',401);
        current.passwordHash=hash;current.displayName=normalizedName;current.mustChangePassword=false;current.sessions=[];current.attempts={start:now(),count:0};
        return {state,value:issue(current,false)};
      });
    },
    async logout(token){
      if(!token)return;await ensureInitialized();
      await mutate(state=>{
        if(!state||state.schema!==2)return {unchanged:true};
        let changed=false;for(const account of Object.values(state.accounts)){const before=account.sessions.length;account.sessions=account.sessions.filter(session=>session.hash!==digest(token));changed ||= before!==account.sessions.length;}
        return changed?{state}:{unchanged:true};
      });
    },
    async listAccounts(token){
      await ensureInitialized();const state=decode(await store.read()),session=validSession(state,token,now(),effectiveAdminId);
      if(!session)throw new AuthError('Please sign in again.',401);
      if(!session.isAdmin)throw new AuthError('Administrator access required.',403,'ADMIN_REQUIRED');
      return Object.values(state.accounts).map(account=>({userId:account.userId,displayName:account.displayName,active:account.active!==false,mustChangePassword:account.mustChangePassword,sessionCount:account.sessions.filter(item=>item.expiresAt>now()).length,isAdmin:account.userId===effectiveAdminId})).sort((a,b)=>Number(b.isAdmin)-Number(a.isAdmin)||(a.displayName??a.userId).localeCompare(b.displayName??b.userId));
    },
    async addAccount(token,userId,displayName){
      userId=managedUserId(userId);
      const nameProblem=displayNameProblem(displayName);if(nameProblem)throw new AuthError(nameProblem);
      const snapshot=decode(await store.read()),adminSession=validSession(snapshot,token,now(),effectiveAdminId);if(!adminSession)throw new AuthError('Please sign in again.',401);if(!adminSession.isAdmin)throw new AuthError('Administrator access required.',403,'ADMIN_REQUIRED');
      const hash=await hashPassword(userId),normalizedName=displayName.trim();
      return mutate(state=>{
        const session=validSession(state,token,now(),effectiveAdminId);if(!session)throw new AuthError('Please sign in again.',401);if(!session.isAdmin)throw new AuthError('Administrator access required.',403,'ADMIN_REQUIRED');
        const existing=state.accounts[userId];if(existing&&existing.active!==false)throw new AuthError('That student account already exists.',409,'ACCOUNT_EXISTS');
        state.accounts[userId]={userId,displayName:normalizedName,active:true,passwordHash:hash,mustChangePassword:true,sessions:[],attempts:{start:now(),count:0}};
        return {state,value:{userId,displayName:normalizedName,active:true,mustChangePassword:true,sessionCount:0,isAdmin:userId===effectiveAdminId}};
      });
    },
    async updateAccount(token,userId,displayName){
      userId=managedUserId(userId);
      const nameProblem=displayNameProblem(displayName);if(nameProblem)throw new AuthError(nameProblem);
      return mutate(state=>{
        const session=validSession(state,token,now(),effectiveAdminId);if(!session)throw new AuthError('Please sign in again.',401);if(!session.isAdmin)throw new AuthError('Administrator access required.',403,'ADMIN_REQUIRED');
        const account=state.accounts[userId];if(!account)throw new AuthError('Student account not found.',404,'ACCOUNT_NOT_FOUND');account.displayName=displayName.trim();
        return {state,value:{updated:true}};
      });
    },
    async removeAccount(token,userId){
      userId=managedUserId(userId);
      return mutate(state=>{
        const session=validSession(state,token,now(),effectiveAdminId);if(!session)throw new AuthError('Please sign in again.',401);if(!session.isAdmin)throw new AuthError('Administrator access required.',403,'ADMIN_REQUIRED');
        if(userId===effectiveAdminId)throw new AuthError('The owner account cannot be removed.',400,'OWNER_PROTECTED');
        const account=state.accounts[userId];if(!account||account.active===false)throw new AuthError('Student account not found.',404,'ACCOUNT_NOT_FOUND');account.active=false;account.sessions=[];
        return {state,value:{removed:true}};
      });
    },
    async resetAccount(token,userId){
      userId=managedUserId(userId);
      if(userId===effectiveAdminId)throw new AuthError('Use Change password for the owner account.',400,'OWNER_PROTECTED');
      const snapshot=decode(await store.read()),adminSession=validSession(snapshot,token,now(),effectiveAdminId);if(!adminSession)throw new AuthError('Please sign in again.',401);if(!adminSession.isAdmin)throw new AuthError('Administrator access required.',403,'ADMIN_REQUIRED');
      const hash=await hashPassword(userId);
      return mutate(state=>{
        const session=validSession(state,token,now(),effectiveAdminId);if(!session)throw new AuthError('Please sign in again.',401);if(!session.isAdmin)throw new AuthError('Administrator access required.',403,'ADMIN_REQUIRED');
        const account=state.accounts[userId];if(!account||account.active===false)throw new AuthError('Student account not found.',404,'ACCOUNT_NOT_FOUND');account.passwordHash=hash;account.mustChangePassword=true;account.sessions=[];account.attempts={start:now(),count:0};
        return {state,value:{reset:true}};
      });
    },
  };
}
export function requestToken(request){return request.headers.get('cookie')?.split(';').map(value=>value.trim()).find(value=>value.startsWith(AUTH_COOKIE+'='))?.slice(AUTH_COOKIE.length+1)??null;}
export function safeReturnTo(value){if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '/';const url=new URL(value,'https://med25.invalid');return url.origin==='https://med25.invalid'&&url.pathname==='/'?url.pathname+url.search:'/';}
