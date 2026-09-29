// A short, in-memory lease avoids an auth request per cached asset. Never trust
// localStorage as authorization; cold pages are authenticated by the server.
export const SESSION_LEASE_MS=15*60*1000;
function authError(code,message){return Object.assign(new Error(message),{code});}
export function createSessionCache({fetch:network=(...args)=>globalThis.fetch(...args),now=Date.now,onUnauthorized=()=>{}}={}){
  let state=null,freshUntil=0,pending,version=0;
  function clear(){version++;state=null;freshUntil=0;pending=undefined;}
  function seed(value){
    if(value?.authenticated!==true||value.mustChangePassword!==false||!Number.isFinite(value.expiresAt)||value.expiresAt<=now())return false;
    state=value;freshUntil=Math.min(now()+SESSION_LEASE_MS,value.expiresAt);return true;
  }
  function denied(){clear();onUnauthorized();return authError('AUTH_REQUIRED','Please sign in before opening study content.');}
  function require(){
    if(state&&now()<freshUntil)return Promise.resolve(state);
    if(pending)return pending;
    const requestedVersion=version;
    const task=Promise.resolve().then(async()=>{
      try{
        const response=await network('/api/auth/session',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)});
        if(requestedVersion!==version)throw authError('AUTH_REQUIRED','Session changed.');
        if(response.status===401||response.status===403)throw denied();
        if(!response.ok)throw authError('AUTH_UNAVAILABLE','Sign-in verification is temporarily unavailable.');
        const value=await response.json();
        if(requestedVersion!==version)throw authError('AUTH_REQUIRED','Session changed.');
        if(!seed(value))throw denied();
        return value;
      }catch(error){
        if(error.code==='AUTH_REQUIRED')throw error;
        throw authError('AUTH_UNAVAILABLE','Connect to verify your sign-in before loading more content.');
      }finally{if(pending===task)pending=undefined;}
    });
    pending=task;return task;
  }
  return {require,seed,clear,denied};
}
function notifyUnauthorized(){
  if(typeof window!=='undefined')window.dispatchEvent(new Event('med25-auth-required'));
  else if(globalThis.clients)void globalThis.clients.matchAll({type:'window'}).then(clients=>clients.forEach(client=>client.postMessage({type:'med25-auth-required'})));
}
const shared=createSessionCache({onUnauthorized:notifyUnauthorized});
export const requireStudySession=()=>shared.require();
export const seedStudySession=value=>shared.seed(value);
export const invalidateStudySession=()=>shared.clear();
export const denyStudySession=()=>shared.denied();
export async function clearStudyCaches(){
  invalidateStudySession();
  if(typeof navigator!=='undefined')navigator.serviceWorker?.controller?.postMessage({type:'med25-auth-clear'});
  if(!globalThis.caches)return;
  const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('med25-')).map(name=>caches.delete(name)));
}
