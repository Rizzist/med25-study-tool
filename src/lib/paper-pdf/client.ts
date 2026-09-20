// Typesets past-paper PDFs in the browser on demand and keeps them in Cache Storage.
// A PDF is keyed by a content hash of its Markdown sources, the layout template
// version and the variant, so an edited paper or a new layout produces a new key
// and the stale copy is evicted the next time that paper is requested. Answers and
// results never enter this cache; it holds only regenerable documents.
import {parseExport} from './parse-export.mjs';
import {buildPaperDocument,PAPER_PDF_TEMPLATE,paperFonts,type PaperPart,type PaperVariant} from './document';
import type {TDocumentDefinitions} from 'pdfmake/interfaces';

export const PAPER_PDF_CACHE='med25-paper-pdfs-v1';
export type PaperSource={url:string;collection:PaperPart['collection']};
export type PaperRequest={sources:PaperSource[];variant:PaperVariant;courseTitle:string;footerLabel:string};
export type PaperResult={blob:Blob;fromCache:boolean;cached:boolean;key:string};
type Env={fetch?:typeof fetch;caches?:CacheStorage;crypto?:Crypto;origin?:string;render?:(definition:TDocumentDefinitions)=>Promise<Blob>;maxFiles?:number};
type PdfMakeLike={addFonts:(fonts:Record<string,Record<string,string>>)=>void;addVirtualFileSystem:(vfs:Record<string,string>)=>void;createPdf:(definition:TDocumentDefinitions,options?:Record<string,unknown>)=>{getBlob:()=>Promise<Blob>}};
const fontFiles={[paperFonts.latin]:{normal:'NotoSans-Regular.ttf',bold:'NotoSans-Bold.ttf'},[paperFonts.arabic]:{normal:'NotoSansArabic-Regular.ttf',bold:'NotoSansArabic-Regular.ttf'}};
let fontVfs:Promise<Record<string,string>>|undefined;
let engine:Promise<PdfMakeLike>|undefined;

const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
function base64(bytes:ArrayBuffer) {
  let binary='';const view=new Uint8Array(bytes);
  for(let i=0;i<view.length;i+=0x8000)binary+=String.fromCharCode(...view.subarray(i,i+0x8000));
  return btoa(binary);
}
/** Fonts are fetched once per session (the browser caches the files) and handed to pdfmake as a virtual file system. */
async function loadFonts(env:Env) {
  fontVfs??=(async()=>{
    const network=env.fetch??globalThis.fetch,origin=env.origin??globalThis.location.origin;
    const files=[...new Set(Object.values(fontFiles).flatMap(f=>Object.values(f)))];
    const entries=await Promise.all(files.map(async name=>{
      const response=await network(new URL('/fonts/'+name,origin).href);
      if(!response.ok)throw new Error('The PDF fonts could not be loaded. Check your connection and retry.');
      return [name,base64(await response.arrayBuffer())] as const;
    }));
    return Object.fromEntries(entries);
  })();
  try{return await fontVfs;}catch(error){fontVfs=undefined;throw error;}
}
async function defaultRender(definition:TDocumentDefinitions,env:Env):Promise<Blob> {
  engine??=import('pdfmake/build/pdfmake').then(module=>((module as {default?:PdfMakeLike}).default??(module as unknown as PdfMakeLike)));
  const [pdfMake,vfs]=await Promise.all([engine,loadFonts(env)]);
  const fonts=Object.fromEntries(Object.entries(fontFiles).map(([name,f])=>[name,{normal:f.normal,bold:f.bold,italics:f.normal,bolditalics:f.bold}]));
  pdfMake.addVirtualFileSystem(vfs);
  pdfMake.addFonts(fonts);
  return pdfMake.createPdf(definition).getBlob();
}
async function sha256(env:Env,text:string) {
  const crypto=env.crypto??globalThis.crypto;
  return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
}
/** Builds the generator. `env` lets tests inject fetch, caches, crypto and a fake renderer. */
export function createPaperPdf(env:Env={}) {
  const pending=new Map<string,Promise<PaperResult>>(),latest=new Map<string,string>();
  const network=(input:string)=>(env.fetch??globalThis.fetch)(input,{cache:'no-cache'});
  const origin=()=>env.origin??globalThis.location.origin;
  async function open(){try{return await (env.caches??globalThis.caches).open(PAPER_PDF_CACHE);}catch{return null;}}
  async function prune(cache:Cache,current:string) {
    // Drop older versions of this document, then the oldest entries beyond the cap. Only this cache is touched.
    // The newest key computed for this path in this session is always kept, so a slow render that finishes
    // after a fresher one cannot evict the fresher copy.
    const keys=await cache.keys();
    const path=new URL(current).pathname;let kept=0;
    for(const request of keys.slice().reverse()){
      if(request.url===current||request.url===latest.get(path)){kept++;continue;}
      if(new URL(request.url).pathname===path||kept>=(env.maxFiles??60))await cache.delete(request);
      else kept++;
    }
  }
  return async function paperPdf(request:PaperRequest):Promise<PaperResult> {
    if(!request.sources.length)throw new Error('Nothing to typeset.');
    const texts=await Promise.all(request.sources.map(async source=>{
      const url=new URL(source.url,origin());
      if(url.origin!==origin()||!url.pathname.startsWith('/study/')||!url.pathname.endsWith('.md'))throw new Error('Only local study exports can be typeset.');
      const response=await network(url.href);
      if(!response.ok)throw new Error('The paper export could not be loaded. Please retry when connected.');
      return response.text();
    }));
    const name=request.sources.length===1?request.sources[0].collection.id:`${request.sources.map(s=>s.collection.id).join('+').slice(0,40)}-bundle`;
    const version=await sha256(env,JSON.stringify({template:PAPER_PDF_TEMPLATE,fonts:fontFiles,variant:request.variant,footer:request.footerLabel,course:request.courseTitle,collections:request.sources.map(s=>s.collection),texts}));
    const key=new URL(`/study/paper-pdf/${encodeURIComponent(name)}-${request.variant}.pdf?v=${version}`,origin()).href;
    latest.set(new URL(key).pathname,key);
    const cache=await open();
    const saved=await cache?.match(key).catch(()=>undefined);
    if(saved?.status===200){
      // A hit also tidies superseded versions of this document (e.g. a slow render that finished after a fresher one).
      if(cache)await prune(cache,key).catch(()=>{/* best effort */});
      return {blob:await saved.blob(),fromCache:true,cached:true,key};
    }
    if(!pending.has(key)){
      const task=(async()=>{
        const parts:PaperPart[]=request.sources.map((source,i)=>({doc:parseExport(texts[i]),courseTitle:request.courseTitle,collection:source.collection}));
        const definition=buildPaperDocument(parts,request.variant,request.footerLabel);
        const blob=await (env.render??(d=>defaultRender(d,env)))(definition);
        let cached=false;
        if(cache){
          try{await cache.put(key,new Response(blob,{headers:{'content-type':'application/pdf','content-length':String(blob.size),'x-paper-pdf-template':PAPER_PDF_TEMPLATE}}));cached=true;}
          catch{/* quota or private browsing: the download still works */}
          if(cached)await prune(cache,key).catch(()=>{/* pruning is best effort */});
        }
        return {blob,fromCache:false,cached,key};
      })().finally(()=>pending.delete(key));
      pending.set(key,task);
    }
    return pending.get(key)!;
  };
}
export const paperPdf=createPaperPdf();
