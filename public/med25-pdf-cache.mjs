// Shared by the download button and service worker. Answers never enter this cache.
export const PDF_CACHE='med25-pdfs-v1';
const MANIFEST='/study/pdf-manifest.json';
export function createPdfCache(env={}) {
  const network=(...args)=>(env.fetch??globalThis.fetch)(...args);
  const storage=()=>env.caches??globalThis.caches;
  const origin=()=>env.origin??globalThis.location.origin;
  const pending=new Map();let manifestRequest;
  async function open(){try{return await storage().open(PDF_CACHE);}catch{return null;}}
  async function match(cache,key){try{return await cache?.match(key);}catch{return undefined;}}
  async function manifest(cache) {
    if(manifestRequest)return manifestRequest;
    const key=new URL(MANIFEST,origin()).href;
    manifestRequest=(async()=>{
      const saved=await match(cache,key),etag=saved?.headers.get('etag');
      try {
        const response=await network(key,{cache:'no-cache',headers:etag?{'if-none-match':etag}:undefined});
        if(response.status===304&&saved)return saved.json();
        if(!response.ok)throw Error('PDF index unavailable');
        const data=await response.clone().json();
        try{await cache?.put(key,response);}catch{/* quota / private browsing */}
        return data;
      }catch{try{return await saved?.json();}catch{return null;}}
    })();
    try{return await manifestRequest;}finally{manifestRequest=undefined;}
  }
  async function prune(cache,current,size) {
    const keys=await cache.keys();let total=size,count=1;
    const currentUrl=new URL(current);
    // Keep at most 256 MiB / 48 PDFs, newest downloads first. Never clear other caches.
    for(const key of keys.reverse()){
      if(key.url===current||!new URL(key.url).pathname.toLowerCase().endsWith('.pdf'))continue;
      const url=new URL(key.url),old=await cache.match(key);
      const bytes=Number(old?.headers.get('content-length')??0);
      if(url.pathname===currentUrl.pathname||total+bytes>(env.maxBytes??256*1024*1024)||count>=(env.maxFiles??48))await cache.delete(key);
      else{total+=bytes;count++;}
    }
  }
  async function load(input) {
    const url=new URL(input,origin());url.hash='';
    if(url.origin!==origin()||!url.pathname.startsWith('/study/')||!url.pathname.toLowerCase().endsWith('.pdf'))throw Error('Only local study PDFs can be cached.');
    const cache=await open();
    if(!url.searchParams.has('v')) {
      const index=await manifest(cache),version=index?.files?.[url.pathname]?.version;
      if(version)url.searchParams.set('v',version);
    }
    const key=url.href,version=url.searchParams.get('v');
    const cached=await match(cache,key);
    if(version&&cached?.status===200)return {response:cached,fromCache:true,cached:true,url:key};
    if(!pending.has(key)){
      const task=(async()=>{
        // Always fetch a complete entity. A 206 must never replace the full cached file.
        const response=await network(key,{cache:'no-cache',headers:{accept:'application/pdf'}});
        if(response.status!==200)throw Error('Could not download the complete PDF. Please retry when connected.');
        const bytes=await response.arrayBuffer();
        if(!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-'))throw Error('The server did not return a PDF.');
        const crypto=env.crypto??globalThis.crypto;
        if(version&&/^[a-f0-9]{64}$/i.test(version)&&crypto?.subtle){
          const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
          if(digest!==version.toLowerCase())throw Error('This PDF has changed. Reload the course to use its updated version.');
        }
        const headers=new Headers(response.headers);
        headers.delete('content-encoding');headers.delete('content-range');headers.delete('vary');
        headers.set('content-type','application/pdf');headers.set('content-length',String(bytes.byteLength));headers.set('accept-ranges','bytes');
        const full=new Response(bytes,{status:200,headers});let cached=false;
        if(cache&&version&&bytes.byteLength<=(env.maxBytes??256*1024*1024)){
          try{
            await cache.put(key,full.clone());cached=true;
            await prune(cache,key,bytes.byteLength);
          }catch{/* Download still succeeds if optional storage is full/unavailable. */}
        }
        return {response:full,fromCache:false,cached,url:key};
      })();
      pending.set(key,task);
    }
    const task=pending.get(key);
    try{const result=await task;return {...result,response:result.response.clone()};}
    finally{if(pending.get(key)===task)pending.delete(key);}
  }
  return {load};
}
const shared=createPdfCache();
export const loadCachedPdf=input=>shared.load(input);

/** Browser PDF viewers ask for byte ranges, even when the complete PDF is cached. */
export async function pdfRangeResponse(response,range,ifRange) {
  if(!range||ifRange&&(ifRange!==response.headers.get('etag')&&ifRange!==response.headers.get('last-modified')))return response;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if(!match||(!match[1]&&!match[2]))return response; // Multi-range/unsupported: a full 200 is valid.
  const blob=await response.blob(),size=blob.size;
  const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||start>end)return new Response(null,{status:416,headers:{'content-range':`bytes */${size}`}});
  const headers=new Headers(response.headers);headers.set('content-range',`bytes ${start}-${end}/${size}`);headers.set('content-length',String(end-start+1));
  return new Response(blob.slice(start,end+1),{status:206,headers});
}
