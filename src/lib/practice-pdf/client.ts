import {requireStudySession} from '../../../public/med25-auth-cache.mjs';
import type {MCQQuestion} from '../mcq/types';
import {renderStudyPdf,type PaperResult} from '../paper-pdf/client';
import {buildPracticeDocument,PRACTICE_PDF_TEMPLATE,type PracticeFigures} from './document';
import {preparePracticeFigures} from './media';
import type {TDocumentDefinitions} from 'pdfmake/interfaces';

export const PRACTICE_PDF_CACHE='med25-practice-pdfs-v1';
export type PracticePdfRequest={exam:string;title:string;version:string;questionIds:string[];loadQuestions:(ids:string[])=>Promise<MCQQuestion[]>;progress?:(text:string)=>void};
type Env={authorize?:()=>Promise<unknown>;caches?:CacheStorage;crypto?:Crypto;origin?:string;render?:(definition:TDocumentDefinitions)=>Promise<Blob>;figures?:(questions:MCQQuestion[],progress?:PracticePdfRequest['progress'])=>Promise<PracticeFigures>};

export function createPracticePdf(env:Env={}){
  const pending=new Map<string,Promise<PaperResult>>(),latest=new Map<string,string>();
  async function prune(cache:Cache,key:string){
    let retained=0;const path=new URL(key).pathname;
    for(const request of (await cache.keys()).slice().reverse()){
      if(request.url===key||request.url===latest.get(path)){retained++;continue;}
      if(new URL(request.url).pathname===path||retained>=24)await cache.delete(request);else retained++;
    }
  }
  return async function practicePdf(request:PracticePdfRequest):Promise<PaperResult>{
    await (env.authorize??requireStudySession)();
    const ids=[...new Set(request.questionIds)];
    if(!ids.length||!request.version)throw new Error('The practice catalog is still loading. Please retry in a moment.');
    const fingerprint=JSON.stringify({template:PRACTICE_PDF_TEMPLATE,exam:request.exam,title:request.title,version:request.version,ids});
    // Deduplicate before asynchronous hashing, including very fast cached/text-only exports.
    if(!pending.has(fingerprint))pending.set(fingerprint,(async()=>{
      const bytes=await (env.crypto??globalThis.crypto).subtle.digest('SHA-256',new TextEncoder().encode(fingerprint));
      const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
      const key=new URL(`/study/practice-pdf/${encodeURIComponent(request.exam)}.pdf?v=${hash}`,env.origin??location.origin).href;
      latest.set(new URL(key).pathname,key);
      let cache:Cache|undefined;try{cache=await (env.caches??globalThis.caches)?.open(PRACTICE_PDF_CACHE);}catch{/* Optional device cache. */}
      const hit=await cache?.match(key).catch(()=>undefined);
      if(hit?.status===200){await prune(cache!,key).catch(()=>{});return {blob:await hit.blob(),fromCache:true,cached:true,key};}
      const questions:MCQQuestion[]=[];
      for(let start=0;start<ids.length;start+=150){
        request.progress?.(`Loading questions ${start+1}–${Math.min(ids.length,start+150)} of ${ids.length}…`);
        const batch=ids.slice(start,start+150),loaded=await request.loadQuestions(batch),byId=new Map(loaded.map(q=>[q.id,q]));
        for(const id of batch){const q=byId.get(id);if(!q||q.status!=='verified')throw new Error('The practice bank changed or did not load completely. Refresh the course and retry.');questions.push(q);}
      }
      const figures=await (env.figures??preparePracticeFigures)(questions,request.progress);
      request.progress?.(`Creating PDF · ${questions.length} questions and answer key…`);
      const blob=await (env.render??renderStudyPdf)(buildPracticeDocument(request.title,questions,figures));
      // A long export must not repopulate protected caches after the student signs out.
      await (env.authorize??requireStudySession)();
      let cached=false;
      if(cache){try{await cache.put(key,new Response(blob,{headers:{'content-type':'application/pdf'}}));cached=true;await prune(cache,key);}catch{/* Downloads still work when storage is full. */}}
      return {blob,fromCache:false,cached,key};
    })().finally(()=>pending.delete(fingerprint)));
    return pending.get(fingerprint)!;
  };
}
export const practicePdf=createPracticePdf();
