import {requireStudySession,denyStudySession} from '../../../public/med25-auth-cache.mjs';

export const ORIGINAL_PDF_CACHE='med25-original-pdfs-v1';
const INDEX='/study/originals-manifest.json',TEMPLATE='original-source-pages-v1';
type FileInfo={version:string;bytes:number;kind:'pdf'|'jpeg'|'png'};
type Manifest={collections:Record<string,{sources:string[]}>;files:Record<string,FileInfo>};
type Source={kind:FileInfo['kind'];bytes:ArrayBuffer};
type Result={blob:Blob;key:string;cached:boolean;fromCache:boolean};
type Env={authorize?:()=>Promise<unknown>;fetch?:typeof fetch;caches?:CacheStorage;crypto?:Crypto;origin?:string;maxBytes?:number;maxFiles?:number;render?:(sources:Source[],title:string)=>Promise<Blob>};

export function createOriginalPdf(env:Env={}){
 const pending=new Map<string,Promise<Result>>(),latest=new Map<string,string>();
 const origin=()=>env.origin??globalThis.location.origin;
 const network=(url:string,headers?:HeadersInit)=>(env.fetch??globalThis.fetch)(url,{cache:'no-cache',headers});
 const hash=async(bytes:BufferSource)=>Array.from(new Uint8Array(await (env.crypto??globalThis.crypto).subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 const match=async(cache:Cache|null,key:string)=>{try{return await cache?.match(key);}catch{return undefined;}};
 let manifestRequest:Promise<Manifest>|undefined;
 async function index(cache:Cache|null){
  if(manifestRequest)return manifestRequest;
  const key=new URL(INDEX,origin()).href;
  manifestRequest=(async()=>{
   const saved=await match(cache,key);
   try{
    const etag=saved?.headers.get('etag');
    const response=await network(key,etag?{'if-none-match':etag}:undefined);
    if(response.status===401||response.status===403)throw denyStudySession();
    if(response.status===304&&saved)return await saved.json() as Manifest;
    if(!response.ok)throw new Error('Original-source index unavailable.');
    const data=await response.clone().json() as Manifest;
    if(!data.collections||!data.files)throw new Error('Invalid original-source index.');
    try{await cache?.put(key,response);}catch{/* Optional storage. */}
    return data;
   }catch(error){
    if((error as {code?:string}).code==='AUTH_REQUIRED')throw error;
    if(saved)return await saved.json() as Manifest;
    throw new Error('Connect to load the original-source index, then retry.');
   }
  })();
  try{return await manifestRequest;}finally{manifestRequest=undefined;}
 }
 async function prune(cache:Cache,keep:string){
  let size=0,count=0;
  const keys=await cache.keys();
  // Current output first, then newest entries. The index is small and never evicted here.
  const ordered=[keep,...keys.map(k=>k.url).reverse().filter(k=>k!==keep)];
  for(const key of ordered){
   if(new URL(key).pathname===INDEX)continue;
   const response=await match(cache,key);if(!response)continue;
   const bytes=Number(response.headers.get('content-length')??0);
   const stale=new URL(key).pathname===new URL(keep).pathname&&key!==keep&&key!==latest.get(new URL(keep).pathname);
   if(stale||count>=(env.maxFiles??128)||size+bytes>(env.maxBytes??256*1024*1024))await cache.delete(key);
   else{size+=bytes;count++;}
  }
 }
 async function store(cache:Cache|null,key:string,blob:Blob){
  if(!cache||blob.size>(env.maxBytes??256*1024*1024))return false;
  try{await cache.put(key,new Response(blob,{headers:{'content-type':blob.type,'content-length':String(blob.size)}}));return true;}catch{return false;}
 }
 return async function originalPdf(request:{collectionId:string;title:string}):Promise<Result>{
  await (env.authorize??requireStudySession)();
  let cache:Cache|null=null;try{cache=await (env.caches??globalThis.caches).open(ORIGINAL_PDF_CACHE);}catch{/* Private mode still downloads. */}
  const manifest=await index(cache),urls=manifest.collections[request.collectionId]?.sources;
  if(!urls?.length)throw new Error('No original pages are available for this paper.');
  const sources=urls.map(url=>{
   const resolved=new URL(url,origin()),file=manifest.files[url];
   if(resolved.origin!==origin()||!resolved.pathname.startsWith('/study/')||!/^\/study\/.+\.(pdf|jpe?g|png)$/i.test(url)||!file||!['pdf','jpeg','png'].includes(file.kind)||!/^[a-f0-9]{64}$/.test(file.version))throw new Error('Invalid original-source file.');
   return {url:resolved.href,...file};
  });
  const version=await hash(new TextEncoder().encode(JSON.stringify({template:TEMPLATE,title:request.title,sources})));
  const key=new URL(`/study/original-bundle/${encodeURIComponent(request.collectionId)}.pdf?v=${version}`,origin()).href;
  latest.set(new URL(key).pathname,key);
  const saved=await match(cache,key);
  if(saved?.status===200){if(cache)await prune(cache,key).catch(()=>{});return {blob:await saved.blob(),key,cached:true,fromCache:true};}
  if(!pending.has(key)){
   const task=(async()=>{
    const inputs:Source[]=[];
    for(const source of sources){
     const url=new URL(source.url);url.searchParams.set('v',source.version);
     const hit=await match(cache,url.href);
     let bytes:ArrayBuffer;
     if(hit?.status===200)bytes=await hit.arrayBuffer();
     else{
      const response=await network(url.href);
      if(response.status===401||response.status===403)throw denyStudySession();
      if(response.status!==200)throw new Error('An original page could not download. Retry; no partial PDF was saved.');
      bytes=await response.arrayBuffer();
     }
     if(await hash(bytes)!==source.version)throw new Error('An original has changed. Reload the course and try again.');
     if(hit?.status!==200){
      await store(cache,url.href,new Blob([bytes],{type:source.kind==='pdf'?'application/pdf':`image/${source.kind}`}));
      // Bound storage even if a later page fails or the browser closes mid-download.
      if(cache)await prune(cache,url.href).catch(()=>{});
     }
     inputs.push({kind:source.kind,bytes});
    }
    const render=env.render??(await import('./render.mjs')).renderOriginalPdf;
    const blob=await render(inputs,request.title);
    await (env.authorize??requireStudySession)();
    const cached=latest.get(new URL(key).pathname)===key&&await store(cache,key,blob);
    // A slow older render must not evict a newer edition that finished first.
    if(cache)await prune(cache,latest.get(new URL(key).pathname)??key).catch(()=>{});
    return {blob,key,cached,fromCache:false};
   })().finally(()=>pending.delete(key));
   pending.set(key,task);
  }
  return pending.get(key)!;
 };
}
export const originalPdf=createOriginalPdf();
