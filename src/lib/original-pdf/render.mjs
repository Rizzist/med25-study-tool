/** Original bytes stay original: embed full-resolution images; copy PDF pages without rasterizing. */
export async function renderOriginalPdf(sources,title){
 const {PDFDocument}=await import('pdf-lib');
 const output=await PDFDocument.create();
 output.setTitle(title);output.setProducer('MED25 original-source bundle');
 for(const source of sources){
  if(source.kind==='pdf'){
   const input=await PDFDocument.load(source.bytes);
   if(!input.getPageCount())throw new Error('An original PDF contains no pages.');
   for(const page of await output.copyPages(input,input.getPageIndices()))output.addPage(page);
  }else{
   const image=source.kind==='png'?await output.embedPng(source.bytes):await output.embedJpg(source.bytes);
   // Source aspect ratio, no crop, no text overlays, and no image resampling.
   const scale=Math.min(1,842/Math.max(image.width,image.height));
   const width=image.width*scale,height=image.height*scale;
   output.addPage([width,height]).drawImage(image,{x:0,y:0,width,height});
  }
 }
 if(!output.getPageCount())throw new Error('No original pages are available.');
 return new Blob([await output.save()],{type:'application/pdf'});
}
