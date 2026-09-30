import fs from 'node:fs';
// Editorial staging only: geometry separates stems, choices and source marks.
// This does not approve a key or publish a question.
const [input,output]=process.argv.slice(2);
const pages=JSON.parse(fs.readFileSync(input,'utf8'));
const promptHeight=pages.flatMap(p=>p.lines).find(l=>/1-|-1$/.test(l.text)&&l.height>12)?.height;
const optionHeight=promptHeight*13/14;
let rows=[],current=null;
for(const page of pages){
 for(const line of page.lines.filter(l=>Math.abs(l.height-promptHeight)<.2||Math.abs(l.height-optionHeight)<.2).sort((a,b)=>b.y-a.y||a.x-b.x)){
  const prompt=Math.abs(line.height-promptHeight)<.2;
  const number=prompt&&(line.text.match(/^(\d+)\s*-+/)?.[1]??line.text.match(/-\s*(\d+)$/)?.[1]);
  if(number&&(!current||Number(number)===current.number+1)){
   if(current)rows.push(current);
   current={number:Number(number),sourceNumber:String(number),page:page.page,prompt:'',options:[],geometry:[]};
  }
  if(!current)continue;
  if(prompt){current.prompt+=' '+line.text.replace(/^\d+\s*-+|\s*-\s*\d+$/g,'');}
  else {current.options.push(line.text);current.geometry.push({...line,page:page.page});}
 }
}
if(current)rows.push(current);
for(const q of rows){
 q.prompt=q.prompt.trim();
 const candidates=q.geometry.map((o,i)=>({i,d:Math.min(...pages.find(p=>p.page===o.page).lines.filter(l=>l.text.includes('\uE013')).map(l=>Math.abs(o.y-l.y-3.6)))})).sort((a,b)=>a.d-b.d);
 q.providedKey=candidates[0]?.d<16?String.fromCharCode(65+candidates[0].i):null;
 delete q.geometry;
}
fs.writeFileSync(output,JSON.stringify(rows,null,2)+'\n');
console.log(rows.length,rows.filter(q=>q.options.length!==4).map(q=>[q.number,q.options.length]));
