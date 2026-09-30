// Public resources only. Changing the UI shell must not invalidate study/PDF caches.
export const SHELL_CACHE='med25-public-shell-v1';
export const OFFLINE_URL='/pwa/offline.html';
export const SHELL_ASSETS=[OFFLINE_URL,'/manifest.webmanifest','/pwa/icon-192-v1.png','/pwa/icon-512-v1.png','/pwa/icon-maskable-v1.png','/pwa/apple-touch-icon-v1.png'];
export async function installPublicShell({caches=globalThis.caches,fetch=globalThis.fetch}={}){
  const cache=await caches.open(SHELL_CACHE);
  await Promise.all(SHELL_ASSETS.map(async url=>{const response=await fetch(url,{cache:'reload',credentials:'omit'});if(!response.ok||response.redirected)throw new Error('Public shell unavailable');await cache.put(url,response);}));
}
export async function removeOldShells(caches=globalThis.caches){
  await Promise.all((await caches.keys()).filter(name=>name.startsWith('med25-public-shell-')&&name!==SHELL_CACHE).map(name=>caches.delete(name)));
}
export async function networkPageOrOffline(request,{fetch=globalThis.fetch,caches=globalThis.caches}={}){
  try{return await fetch(request);}catch{
    try{const saved=await (await caches.open(SHELL_CACHE)).match(OFFLINE_URL);if(saved)return saved;}catch{/* Storage may be disabled or evicted. */}
    return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MED25 · Offline</title><h1>MED25 is offline</h1><p>Reconnect to verify your login and reopen your study space. Your saved progress has not been deleted.</p><a href="/">Try again</a></html>',{status:503,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }
}
