// A cached file is not an authenticated session. Never authorize from localStorage.
let pending;
export function requireStudySession(){
  if(!pending)pending=fetch('/api/auth/session',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)}).then(async response=>{
    if(response.status>=500)throw new Error('Authentication service unavailable.');
    const state=response.ok?await response.json():null;
    if(!state?.authenticated||state.mustChangePassword){const error=new Error('Please sign in before opening study content.');error.code='AUTH_REQUIRED';throw error;}
    return state;
  }).catch(error=>{if(error.code!=='AUTH_REQUIRED'){const unavailable=new Error('Connect to the internet to verify your sign-in.');unavailable.code='AUTH_UNAVAILABLE';throw unavailable;}throw error;}).finally(()=>{pending=undefined;});
  return pending;
}
export async function clearStudyCaches(){
  if(!globalThis.caches)return;
  const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('med25-')).map(name=>caches.delete(name)));
}
