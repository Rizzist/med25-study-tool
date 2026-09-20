/* Content-addressed media survive app updates. Never cache API writes or answers. */
import {loadCachedPdf,pdfRangeResponse} from './med25-pdf-cache.mjs';
const MEDIA='med25-requested-media-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith('/study/'))return;
  if(url.pathname.toLowerCase().endsWith('.pdf')){
    event.respondWith(loadCachedPdf(url.href).then(({response})=>pdfRangeResponse(response,request.headers.get('range'),request.headers.get('if-range'))).catch(()=>fetch(request)));
    return;
  }
  if(request.headers.has('range'))return;
  // JSON has an explicit client data policy; audio/video remain on-demand browser downloads.
  if(!/\.(png|jpe?g|webp|svg|gif)$/i.test(url.pathname))return;
  event.respondWith((async()=>{
    let cache,saved;
    try {cache=await caches.open(MEDIA);saved=await cache.match(request);}catch{/* storage is optional */}
    if(saved&&url.searchParams.has('v'))return saved;
    try {
      const response=await fetch(request,{cache:'no-cache'});
      if(response.ok){
        try {if(cache){await cache.put(request,response.clone());const keys=await cache.keys();if(keys.length>180)await Promise.all(keys.slice(0,keys.length-180).map(k=>cache.delete(k)));}}catch{/* quota */}
      }
      return response;
    }catch(error){if(saved)return saved;throw error;}
  })());
});
