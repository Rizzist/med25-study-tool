// Builds a pdfmake document for one or more parsed past-paper exports: a cover
// block, numbered question cards with lettered options, the correct option and
// answer notes inline (questions + key), or a key table with provenance.
// Pure data in, document definition out; rendering happens in the browser.
import type {Column,Content,ContentText,TDocumentDefinitions,TableCell} from 'pdfmake/interfaces';
import {keyOf,type ExportBlock,type ParsedExport} from './parse-export.mjs';

export type PaperVariant='questions'|'key'|'both';
export type PaperPart={doc:ParsedExport;courseTitle:string;collection:{id:string;title:string;gradedQuestionCount?:number;sourceRecordCount?:number;ungradedCount?:number;date?:string|null}};
/** Bump when the layout changes so cached PDFs are regenerated. */
export const PAPER_PDF_TEMPLATE='2026-09-20.3';
export const paperFonts={latin:'NotoSans',arabic:'NotoSansArabic'};
const ink='#172a22',muted='#5f6f66',line='#d9dfd6',green='#126747',soft='#eef3ea',gold='#f6efd2',red='#9a3a30';
const kindLabel:Record<PaperVariant,string>={questions:'Questions',key:'Answer key & provenance',both:'Questions with answer key'};

/** Characters the bundled Noto fonts cannot draw, mapped to what they can (tests/paper-pdf.test.mjs checks coverage of every export). */
export const glyphFallbacks:Record<string,string>={'→':'->','←':'<-','↔':'<->','⇒':'=>','↑':'(up)','↓':'(down)','≈':'~'};
export const glyphSafe=(text:string)=>text.replace(/[→←↔⇒↑↓≈]/g,ch=>glyphFallbacks[ch]);
/** Splits text into runs so Arabic-script characters use the Arabic font. */
type TextStyle=Omit<ContentText,'text'>;
export function runs(text:string,base:TextStyle={}):Content {
  const parts:Content[]=[];
  for(const match of glyphSafe(text).matchAll(/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+(?:[\s،؛؟.,;:()؀-ۿ]*[؀-ۿ]+)*|[^؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+/g)){
    const value=match[0];
    const arabic=/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(value);
    parts.push({text:value,...base,...(arabic?{font:paperFonts.arabic}:{})});
  }
  return parts.length===1?parts[0]:{text:parts,...base};
}
const rowLayout={hLineWidth:()=>0,vLineWidth:()=>0,paddingLeft:()=>0,paddingRight:()=>0,paddingTop:()=>0,paddingBottom:()=>0};
const cardLayout={hLineWidth:()=>0.6,vLineWidth:()=>0.6,hLineColor:()=>line,vLineColor:()=>line,paddingLeft:()=>10,paddingRight:()=>10,paddingTop:()=>7,paddingBottom:()=>8};
const badge=(text:string,fill:string,color:string):ContentText=>({text,fillColor:fill,color,bold:true,fontSize:8.5,alignment:'center',margin:[0,1.5,0,0]});
function pathText(value:string):Content{
  const parts:Content[]=[];
  for(const match of value.matchAll(/(\/study\/[^\s)]+)|([^/]+|\/)/g)){
    if(match[1])parts.push({text:match[1],color:'#6c7d73',fontSize:7.5});else parts.push(runs(match[0]));
  }
  return {text:parts};
}
function meta(label:string,value:string):Content{return {text:[{text:label+' ',bold:true,color:'#45564d'},pathText(value)],fontSize:7.8,color:muted,lineHeight:1.15,margin:[0,3,0,0]};}
function cover(part:PaperPart,variant:PaperVariant,pageBreak=false):Content {
  const {doc,collection,courseTitle}=part;
  const chips:Column[]=[];
  const chip=(n:number|string,label:string)=>chips.push({table:{body:[[{text:[{text:String(n)+' ',color:green,bold:true},{text:label,bold:true}],fontSize:8.5,margin:[8,3,8,3]}]]},layout:{hLineWidth:()=>0.6,vLineWidth:()=>0.6,hLineColor:()=>line,vLineColor:()=>line,paddingLeft:()=>0,paddingRight:()=>0,paddingTop:()=>0,paddingBottom:()=>0},margin:[0,0,6,0],width:'auto'});
  if(collection.gradedQuestionCount!==undefined)chip(collection.gradedQuestionCount,'graded');
  if(collection.sourceRecordCount!==undefined)chip(collection.sourceRecordCount,'source items');
  if(collection.ungradedCount)chip(collection.ungradedCount,'ungraded');
  if(collection.date)chip('',collection.date);
  const intro=doc.intro.filter(p=>!/^\d+ retained source records/.test(p));
  const body:Content[]=[
    {columns:[{text:`MED//25 · ${courseTitle}`,color:green,bold:true,fontSize:8.5,characterSpacing:1.2},{text:collection.id,alignment:'right',color:muted,fontSize:8,characterSpacing:.5}]},
    {text:kindLabel[variant].toUpperCase(),color:green,bold:true,fontSize:7.5,characterSpacing:1,margin:[0,6,0,0]},
    runs(doc.title||collection.title,{fontSize:18,bold:true,lineHeight:1.1,margin:[0,6,0,6]}),
    ...intro.map((p):Content=>runs(p,{fontSize:9.2,color:muted,lineHeight:1.25,margin:[0,0,0,3]})),
    ...(chips.length?[{columns:chips,columnGap:0,margin:[0,6,0,0]} as Content]:[]),
    ...doc.sources.map((s):Content=>({text:[runs(s.name),{text:s.url?` · ${s.url}`:'',color:'#6c7d73',fontSize:7.5},runs(s.note?` — ${s.note}`:'')],fontSize:8.2,color:muted,margin:[0,4,0,0]})),
  ];
  return {table:{widths:['*'],body:[[{stack:body,fillColor:'#f7faf5',margin:[6,4,6,6]}]]},layout:{hLineWidth:()=>0.6,vLineWidth:()=>0.6,hLineColor:()=>line,vLineColor:()=>line,paddingLeft:()=>8,paddingRight:()=>8,paddingTop:()=>8,paddingBottom:()=>8},margin:[0,0,0,12],...(pageBreak?{pageBreak:'before' as const}:{})};
}
function part(title:string,count:number):Content{
  return {stack:[{text:[{text:title,fontSize:12.5,bold:true},{text:`   ${count}`,fontSize:8.5,color:muted,bold:false}],margin:[0,10,0,4]},{canvas:[{type:'line',x1:0,y1:0,x2:515,y2:0,lineWidth:1.2,lineColor:green}],margin:[0,0,0,8]}]};
}
function questionCard(q:ExportBlock,key:ExportBlock|undefined,withAnswer:boolean):Content {
  const k=key?keyOf(key):null;
  const rows:Content[]=[{columns:[{table:{widths:[Math.max(24,8+7*q.number.length)],body:[[{...badge(q.number,ink,'#d9f06b'),margin:[0,3,0,3]}]]},layout:rowLayout,width:'auto'},{text:q.id,fontSize:7.2,color:'#8a978f',margin:[8,4,0,0]}],margin:[0,0,0,4]}];
  q.paragraphs.forEach((p,i)=>rows.push(runs(p,{fontSize:10.2,bold:i===0,lineHeight:1.2,margin:[0,1,0,4]})));
  if(q.options.length)rows.push({table:{widths:[18,'*'],body:q.options.map((o):TableCell[]=>{const correct=withAnswer&&k?.letter===o.letter;return [badge(o.letter,correct?green:'#f7f9f4',correct?'#fff':'#45564d'),runs(o.text,{fontSize:9.8,lineHeight:1.2,margin:[2,1.5,0,1.5],...(correct?{bold:true,color:'#0f4d35'}:{})})];})},layout:{...rowLayout,paddingBottom:()=>2}});
  if(withAnswer){
    const answer:ContentText=k?.letter?{text:[{text:`Answer ${k.letter}`,bold:true,color:green},runs(k.text?` · ${k.text}`:'')],fontSize:9.3}:{text:[{text:'Not graded',bold:true},runs(k?.text?` · ${k.text}`:' · no defensible reviewed key')],fontSize:9.3,color:'#5d4a17'};
    rows.push({table:{widths:['*'],body:[[{...answer,fillColor:k?.letter?soft:gold,margin:[6,4,6,4]}]]},layout:rowLayout,margin:[0,6,0,0]});
    if(key?.fields['Existing answer note'])rows.push(meta('Note',key.fields['Existing answer note']));
    if(key?.fields['Provenance note'])rows.push(meta('Provenance',key.fields['Provenance note']));
    if(key?.fields['Key provenance'])rows.push(meta('Key source',key.fields['Key provenance']));
    for(const p of key?.paragraphs??[])rows.push(meta('',p));
  }
  for(const [field,value] of Object.entries(q.fields))if(field!=='Source')rows.push(meta(field,value));
  if(q.fields.Source)rows.push(meta('Source',q.fields.Source));
  return {table:{widths:['*'],body:[[{stack:rows}]]},layout:cardLayout,unbreakable:q.paragraphs.join(' ').length+q.options.reduce((n,o)=>n+o.text.length,0)<1400,margin:[0,0,0,6]};
}
function keyTable(doc:ParsedExport):Content {
  const head=(t:string):TableCell=>({text:t,fontSize:7.2,bold:true,color:muted,characterSpacing:.8,margin:[0,2,0,2]});
  const body:TableCell[][]=[[head('#'),head('KEY'),head('NOTES AND PROVENANCE')]];
  for(const key of doc.keys){
    const k=keyOf(key);
    const notes:Content[]=[];
    if(key.fields['Existing answer note'])notes.push(meta('Note',key.fields['Existing answer note']));
    if(key.fields['Provenance note'])notes.push(meta('Provenance',key.fields['Provenance note']));
    if(key.fields['Key provenance'])notes.push(meta('Key source',key.fields['Key provenance']));
    if(key.fields['Question source'])notes.push(meta('Question',key.fields['Question source']));
    for(const p of key.paragraphs)notes.push(meta('',p));
    notes.push({text:key.id,fontSize:7,color:'#8a978f',margin:[0,3,0,0]});
    body.push([{text:key.number,bold:true,color:green,fontSize:9.3},runs(k.letter?`${k.letter}${k.text?' · '+k.text:''}`:k.text||'Not graded',{bold:true,fontSize:9.3,...(k.letter?{}:{color:red})}),{stack:notes.length?notes:[{text:'—',color:muted}]}]);
  }
  return {table:{headerRows:1,dontBreakRows:true,widths:[26,74,'*'],body},layout:{hLineWidth:(i:number)=>i===0?0:0.6,vLineWidth:()=>0,hLineColor:()=>line,paddingLeft:()=>4,paddingRight:()=>4,paddingTop:()=>5,paddingBottom:()=>5}};
}
function partContent(p:PaperPart,variant:PaperVariant,pageBreak:boolean):Content[] {
  const keys=new Map(p.doc.keys.map(k=>[k.id,k]));
  const out:Content[]=[cover(p,variant,pageBreak)];
  if(variant!=='key'){out.push(part('Questions',p.doc.questions.length));for(const q of p.doc.questions)out.push(questionCard(q,keys.get(q.id),variant==='both'));}
  if(variant==='key'){out.push(part('Answer key & provenance',p.doc.keys.length));for(const t of p.doc.keyIntro)out.push(runs(t,{fontSize:9,color:muted,lineHeight:1.25,margin:[0,0,0,8]}));out.push(keyTable(p.doc));}
  if(variant==='both'&&p.doc.keyIntro.length)out.push(runs(p.doc.keyIntro.join(' '),{fontSize:8.5,color:muted,lineHeight:1.25,margin:[0,6,0,0]}));
  return out;
}
/** One PDF for one or more exports (several parts form a course bundle). */
export function buildPaperDocument(parts:PaperPart[],variant:PaperVariant,footerLabel:string):TDocumentDefinitions {
  return {
    pageSize:'A4',pageMargins:[40,40,40,50],
    info:{title:footerLabel,creator:'MED//25'},
    defaultStyle:{font:paperFonts.latin,fontSize:10,color:ink,lineHeight:1.2},
    content:parts.flatMap((p,i)=>partContent(p,variant,i>0)),
    footer:(page,total)=>({columns:[runs(footerLabel,{fontSize:7.5,color:'#6d7a72'}),{text:`Page ${page} of ${total}`,alignment:'right',fontSize:7.5,color:'#6d7a72'}],margin:[40,18,40,0]}),
  };
}
