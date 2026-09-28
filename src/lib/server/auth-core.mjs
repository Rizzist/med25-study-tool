import {scrypt as scryptCallback,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {authStore} from './auth-store.mjs';
const scrypt=promisify(scryptCallback);
// Server only. No registration route, other users, or reusable client-side password.
export const STUDENT_ID=process.env.MED25_STUDENT_ID??'';
export const AUTH_COOKIE='med25_session';
export const SESSION_SECONDS=60*60*24*7;
const LIMITED_SECONDS=60*15;
const WINDOW=15*60*1000;
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
export function passwordProblem(value,studentId=STUDENT_ID){
  if(typeof value!=='string'||value.length<12||value.length>128)return 'Use 12–128 characters for your new password.';
  if(value.trim().length<12||(studentId&&value.includes(studentId)))return 'Choose a password that is not your student ID.';
  if(/^(.)\1+$/.test(value)||['password1234','123456789012','qwertyuiop12','abcdefghijkl'].includes(value.toLowerCase()))return 'Choose a less predictable password or passphrase.';
  return null;
}
function decode(raw,studentId){
  if(raw===null)return null;
  const state=JSON.parse(raw);
  if(state.schema!==1||state.userId!==studentId||typeof state.passwordHash!=='string'||typeof state.mustChangePassword!=='boolean'||!Array.isArray(state.sessions)||!Number.isInteger(state.attempts?.count)||!Number.isFinite(state.attempts?.start))throw new Error('Invalid authentication state; refusing to reset account.');
  return state;
}
function validSession(state,token,now){
  if(!state||typeof token!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(token))return null;
  const session=state.sessions.find(s=>s.hash===digest(token)&&s.expiresAt>now);
  return session?{userId:state.userId,mustChangePassword:state.mustChangePassword||session.limited,expiresAt:session.expiresAt}:null;
}
export function createAuth({store=authStore(),now=Date.now,studentId=STUDENT_ID}={}){
  if(typeof studentId!=='string'||!/^\d{5,32}$/.test(studentId))throw new AuthError('The authorized student account is not configured.',503,'AUTH_UNAVAILABLE');
  async function mutate(fn){
    for(let i=0;i<12;i++){const raw=await store.read(),state=decode(raw,studentId);const result=await fn(state);if(result.unchanged)return result.value;if(await store.cas(raw,JSON.stringify(result.state)))return result.value;}
    throw new AuthError('Please retry in a moment.',503);
  }
  async function initialize(){
    if(await store.read()!==null)return;
    const initial={schema:1,userId:studentId,passwordHash:await hashPassword(studentId),mustChangePassword:true,sessions:[],attempts:{start:now(),count:0}};
    await store.cas(null,JSON.stringify(initial));
  }
  function issue(state,limited){
    const token=randomBytes(32).toString('base64url');const seconds=limited?LIMITED_SECONDS:SESSION_SECONDS;
    state.sessions=state.sessions.filter(s=>s.expiresAt>now()).slice(-9);
    state.sessions.push({hash:digest(token),limited,expiresAt:now()+seconds*1000});
    return {token,maxAge:seconds,mustChangePassword:limited};
  }
  async function reserveAttempt(){
    return mutate(state=>{
      if(!state)throw new AuthError('Please retry.',503);
      if(now()-state.attempts.start>=WINDOW)state.attempts={start:now(),count:0};
      if(state.attempts.count>=12)throw new AuthError('Too many attempts. Try again in 15 minutes.',429,'RATE_LIMITED');
      state.attempts.count++;return {state,value:state.passwordHash};
    });
  }
  return {
    async session(token){if(!token)return null;return validSession(decode(await store.read(),studentId),token,now());},
    async login(username,password){
      if(typeof username!=='string'||typeof password!=='string'||username.length>80||password.length>128)throw new AuthError('Invalid student ID or password.',401);
      await initialize();const hash=await reserveAttempt();const valid=await verifyPassword(password,hash);
      if(username!==studentId)throw new AuthError('This student account is not supported. MED25 is currently available only to its authorized student account.',401,'UNSUPPORTED_ACCOUNT');
      if(!valid)throw new AuthError('Incorrect password. Please try again.',401,'INCORRECT_PASSWORD');
      return mutate(state=>{if(!state||state.passwordHash!==hash)throw new AuthError('Invalid student ID or password.',401);state.attempts={start:now(),count:0};return {state,value:issue(state,state.mustChangePassword)};});
    },
    async changePassword(token,password,confirmation,currentPassword){
      const snapshot=decode(await store.read(),studentId),session=validSession(snapshot,token,now());
      if(!session)throw new AuthError('Please sign in again.',401);
      const problem=passwordProblem(password,studentId);if(problem)throw new AuthError(problem);
      if(password!==confirmation)throw new AuthError('The new passwords do not match.');
      if(!session.mustChangePassword){await reserveAttempt();if(typeof currentPassword!=='string'||currentPassword.length>128||!await verifyPassword(currentPassword,snapshot.passwordHash))throw new AuthError('Current password is incorrect.',400);}
      if(await verifyPassword(password,snapshot.passwordHash))throw new AuthError('Choose a different password.');
      const hash=await hashPassword(password);
      return mutate(state=>{if(!validSession(state,token,now())||state.passwordHash!==snapshot.passwordHash)throw new AuthError('Please sign in again.',401);state.passwordHash=hash;state.mustChangePassword=false;state.sessions=[];state.attempts={start:now(),count:0};return {state,value:issue(state,false)};});
    },
    async logout(token){if(!token)return;await mutate(state=>{if(!state)return {unchanged:true};state.sessions=state.sessions.filter(s=>s.hash!==digest(token));return {state};});},
  };
}
export function requestToken(request){return request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(AUTH_COOKIE+'='))?.slice(AUTH_COOKIE.length+1)??null;}
export function safeReturnTo(value){if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return '/';const url=new URL(value,'https://med25.invalid');return url.origin==='https://med25.invalid'&&url.pathname==='/'?url.pathname+url.search:'/';}
