import type {MCQQuestion} from './types';

const DATA_CACHE='med25-mcq-data-v1';
const inFlight=new Map<string,Promise<unknown>>();
const courseVersions=new Map<string,string>();
type Catalog={exams:Array<{id:string;version:string}>};
async function store(url:string,response:Response) {
  try {
    const cache=await caches.open(DATA_CACHE); await cache.put(url,response);
    const keys=await cache.keys();
    if(keys.length>400) await Promise.all(keys.slice(0,keys.length-400).map(key=>cache.delete(key)));
  } catch { /* Private browsing / quota cannot block studying. */ }
}
/** Versioned files are immutable; mutable manifests revalidate, with offline fallback. */
export async function cachedJson<T>(url:string,revalidate=false):Promise<T> {
  const key=new URL(url,window.location.origin).href;
  if(inFlight.has(key))return inFlight.get(key) as Promise<T>;
  const task=(async()=>{
    let saved:Response|undefined;
    try {saved=await (await caches.open(DATA_CACHE)).match(key);} catch { /* optional */ }
    const immutable=new URL(key).searchParams.has('v');
    if(saved&&immutable&&!revalidate)return saved.json() as Promise<T>;
    try {
      const etag=saved?.headers.get('etag');
      const response=await fetch(key,{cache:'no-cache',headers:etag?{'if-none-match':etag}:undefined,signal:AbortSignal.timeout(12000)});
      if(response.status===304&&saved)return saved.json() as Promise<T>;
      if(!response.ok)throw Error('Could not load '+new URL(key).pathname);
      const payload=await response.clone().json();
      await store(key,response);
      return payload as T;
    } catch(error) {if(saved)return saved.json() as Promise<T>;throw error;}
  })();
  inFlight.set(key,task);
  try {return await task;} finally {inFlight.delete(key);}
}
export function setQuestionCacheVersion(exam:string,version:string) {courseVersions.set(exam,version);}
async function versionFor(exam:string) {
  if(courseVersions.has(exam))return courseVersions.get(exam)!;
  const catalog=await cachedJson<Catalog>('/study/runtime/catalog.json');
  for(const course of catalog.exams)courseVersions.set(course.id,course.version);
  return courseVersions.get(exam);
}
function questionUrl(exam:string,version:string,id:string,purpose:string) {
  return new URL('/__med25_cached_question/'+encodeURIComponent(exam)+'/'+encodeURIComponent(id)+'?v='+encodeURIComponent(version)+'&purpose='+purpose,location.origin).href;
}
/** Cache actual selected questions, never a randomized sprint request/response by URL. */
export async function rememberQuestions(exam:string,questions:MCQQuestion[],purpose='practice') {
  try {
    const version=await versionFor(exam);if(!version)return;
    const cache=await caches.open(DATA_CACHE);
    await Promise.all(questions.map(q=>cache.put(questionUrl(exam,version,q.id,purpose),new Response(JSON.stringify(q),{headers:{'content-type':'application/json'}}))));
    const keys=await cache.keys();if(keys.length>1800)await Promise.all(keys.slice(0,keys.length-1800).map(k=>cache.delete(k)));
  } catch { /* Answers are saved separately; cached question data is expendable. */ }
}
export async function recallQuestions(exam:string,ids:string[],purpose='practice'):Promise<MCQQuestion[]|null> {
  try {
    const version=await versionFor(exam);if(!version)return null;
    const cache=await caches.open(DATA_CACHE);
    const rows=await Promise.all(ids.map(async id=>{
      const response=await cache.match(questionUrl(exam,version,id,purpose))??(purpose==='history'?await cache.match(questionUrl(exam,version,id,'practice')):undefined);
      return response?await response.json() as MCQQuestion:null;
    }));
    return rows.every((q,i)=>q?.id===ids[i])?rows as MCQQuestion[]:null;
  } catch {return null;}
}
