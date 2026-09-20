import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import {createPdfCache,pdfRangeResponse,PDF_CACHE} from '../public/med25-pdf-cache.mjs';
const origin='https://med25.test',path='/study/reviews/cvs.pdf';
const sha=s=>createHash('sha256').update(s).digest('hex');
const versionUrl=(body,p=path)=>origin+p+'?v='+sha(body);
function fixture(options={}){
  const map=new Map(),calls=[],files=new Map([[path,'%PDF-1.7\noriginal source bytes\n%%EOF']]);
  let offline=false;
  const cache={match:async key=>map.get(typeof key==='string'?key:key.url)?.clone(),put:async(key,value)=>{if(options.quota)throw Error('quota');map.set(typeof key==='string'?key:key.url,value.clone());},keys:async()=>[...map.keys()].map(k=>new Request(k)),delete:async key=>map.delete(typeof key==='string'?key:key.url)};
  const caches={open:async name=>{assert.equal(name,PDF_CACHE);if(options.noStorage)throw Error('disabled');return cache;}};
  const fetch=async(input,init)=>{
    const url=new URL(input);calls.push({url:url.href,init});if(offline)throw Error('offline');
    if(url.pathname.endsWith('pdf-manifest.json')){
      const manifest={files:Object.fromEntries([...files].map(([p,b])=>[p,{version:sha(b),bytes:Buffer.byteLength(b)}]))};
      const etag='"'+sha(JSON.stringify(manifest))+'"';
      if(init?.headers?.['if-none-match']===etag)return new Response(null,{status:304,headers:{etag}});
      return Response.json(manifest,{headers:{etag}});
    }
    return new Response(files.get(url.pathname)??'not found',{status:files.has(url.pathname)?200:404,headers:{'content-type':'application/pdf',etag:'"pdf"'}});
  };
  return {pdf:createPdfCache({origin,fetch,caches,crypto:webcrypto,...options}),map,calls,files,offline:()=>{offline=true;}};
}
test('first download caches complete bytes; repeat downloads and opens make no PDF request',async()=>{
  const f=fixture(),body=f.files.get(path),url=versionUrl(body);
  const first=await f.pdf.load(url);assert.equal(first.fromCache,false);assert.equal(first.cached,true);assert.equal(await first.response.text(),body);
  f.offline();const second=await f.pdf.load(url+'#page=4');assert.equal(second.fromCache,true);assert.equal(await second.response.text(),body);assert.equal(f.calls.length,1);
});
test('a changed PDF fetches once under its new hash and removes only the superseded version',async()=>{
  const f=fixture(),oldUrl=versionUrl(f.files.get(path));await f.pdf.load(oldUrl);
  const other='/study/other.pdf';f.files.set(other,'%PDF-1.7\nother');const otherUrl=versionUrl(f.files.get(other),other);await f.pdf.load(otherUrl);
  f.files.set(path,'%PDF-1.7\nnew corrected edition');const nextUrl=versionUrl(f.files.get(path));await f.pdf.load(nextUrl);
  assert(!f.map.has(oldUrl));assert(f.map.has(nextUrl));assert(f.map.has(otherUrl));assert.equal((await f.pdf.load(nextUrl)).fromCache,true);assert.equal(f.calls.length,3);
});
test('unversioned past-paper URLs resolve content hashes and revalidate only their small manifest',async()=>{
  const f=fixture();await f.pdf.load(origin+path);await f.pdf.load(origin+path);
  assert.equal(f.calls.filter(c=>new URL(c.url).pathname===path).length,1);
  assert(f.calls.at(-1).init.headers['if-none-match']);
  f.files.set(path,'%PDF-1.7\nnew edition');const next=await f.pdf.load(origin+path);assert.equal(next.fromCache,false);assert(next.url.endsWith(sha(f.files.get(path))));
  f.offline();assert.equal((await f.pdf.load(origin+path)).fromCache,true);
});
test('simultaneous requests for one PDF share the download',async()=>{
  const f=fixture(),url=versionUrl(f.files.get(path));const rows=await Promise.all([f.pdf.load(url),f.pdf.load(url),f.pdf.load(url)]);
  assert.equal(f.calls.length,1);for(const row of rows)assert.equal(await row.response.text(),f.files.get(path));
});
test('range requests use full cached bytes, including suffix/open-ended/invalid ranges',async()=>{
  const f=fixture(),body=f.files.get(path),url=versionUrl(body);await f.pdf.load(url);f.offline();
  for(const [range,expected] of [['bytes=0-4','%PDF-'],['bytes=-5','%%EOF'],['bytes=5-',body.slice(5)]]){
    const {response}=await f.pdf.load(url);const part=await pdfRangeResponse(response,range);assert.equal(part.status,206);assert.equal(await part.text(),expected);assert(part.headers.has('content-range'));
  }
  assert.equal((await pdfRangeResponse((await f.pdf.load(url)).response,'bytes=9999-')).status,416);
  assert.equal((await pdfRangeResponse((await f.pdf.load(url)).response,'bytes=0-4','"not-current"')).status,200);
  assert.equal((await pdfRangeResponse((await f.pdf.load(url)).response,'bytes=0-1,3-4')).status,200);
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].init.headers.range,undefined);
});
test('storage errors never block an online download or falsely claim persistence',async()=>{
  for(const options of [{quota:true},{noStorage:true}]){const f=fixture(options),result=await f.pdf.load(versionUrl(f.files.get(path)));assert.equal(result.cached,false);assert.equal(await result.response.text(),f.files.get(path));}
});
test('non-PDF or wrong-version responses are never saved',async()=>{
  const f=fixture(),oldUrl=versionUrl(f.files.get(path));f.files.set(path,'%PDF-1.7\nchanged');await assert.rejects(f.pdf.load(oldUrl),/has changed/);assert.equal(f.map.size,0);
  f.files.set(path,'<html>error page</html>');await assert.rejects(f.pdf.load(versionUrl(f.files.get(path))),/did not return a PDF/);assert.equal(f.map.size,0);
});
test('PDF storage budget evicts only PDF entries and never caches partial responses',async()=>{
  const f=fixture({maxFiles:1});await f.pdf.load(origin+path);const other='/study/second.pdf';f.files.set(other,'%PDF-1.7\nsecond');await f.pdf.load(versionUrl(f.files.get(other),other));
  assert.equal([...f.map.keys()].filter(k=>new URL(k).pathname.endsWith('.pdf')).length,1);assert(f.map.has(origin+'/study/pdf-manifest.json'));
  const partial=createPdfCache({origin,fetch:async()=>new Response('%PDF-partial',{status:206}),caches:{open:async()=>{throw Error('disabled');}}});
  await assert.rejects(partial.load(origin+path+'?v='+sha('partial')),/complete PDF/);
});
test('only local study PDF URLs can enter the PDF cache',async()=>{
  const f=fixture();for(const url of ['https://external.test/a.pdf',origin+'/private/a.pdf',origin+'/study/a.png'])await assert.rejects(f.pdf.load(url),/Only local study PDFs/);assert.equal(f.calls.length,0);
});
