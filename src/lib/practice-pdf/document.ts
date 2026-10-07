import type {Content,TDocumentDefinitions} from 'pdfmake/interfaces';
import type {MCQQuestion} from '../mcq/types';
import {paperFonts,runs} from '../paper-pdf/document';

export const PRACTICE_PDF_TEMPLATE='2026-10-07.1';
export type PracticeFigure={image?:string;link?:string;label?:string};
export type PracticeFigures=Record<string,PracticeFigure[]>;
const green='#126747',ink='#172a22',muted='#617268';
const letter=(index:number)=>String.fromCharCode(65+index);
export const isPaperLocation=(q:MCQQuestion)=>q.kind==='dynamic_anatomy'&&q.anatomy?.responseMode==='locate';

export function practiceAnswer(q:MCQQuestion):string {
  if(isPaperLocation(q)){
    const regions=q.media?.find(m=>m.annotations?.some(a=>a.id===q.anatomy?.targetRegionId))?.annotations??[];
    const index=regions.findIndex(a=>a.id===q.anatomy?.targetRegionId);
    if(index<0)throw new Error(`Missing image target for ${q.id}.`);
    return `Location ${index+1} · ${regions[index].label}`;
  }
  const accepted=new Set([q.correctOptionId,...q.acceptedOptionIds??[]]);
  const answers=q.options.flatMap((o,i)=>accepted.has(o.id)?[`${letter(i)} · ${o.text}`]:[]);
  if(!answers.length)throw new Error(`Missing answer key for ${q.id}.`);
  return answers.join(' / ');
}

/** All questions first, then a separate answer/explanation section; no student data. */
export function buildPracticeDocument(title:string,questions:MCQQuestion[],figures:PracticeFigures={}):TDocumentDefinitions {
  const content:Content[]=[
    {text:'MED//25 · PRACTICE BANK',fontSize:9,bold:true,color:green,characterSpacing:1},
    runs(`${title} · Practice MCQs`,{fontSize:22,bold:true,margin:[0,8,0,8]}),
    runs(`${questions.length} practice questions · Answer key and explanations at the end`,{fontSize:10,color:muted}),
    {text:'Generated study questions, not a past exam paper. The full course bank is included, independent of session length or collection filters.',fontSize:9,color:muted,margin:[0,5,0,14]},
  ];
  questions.forEach((q,index)=>{
    if(q.kind==='dynamic_anatomy_3d')throw new Error(`Archived 3D item ${q.id} cannot be exported without a verified 2D figure.`);
    if(q.media?.length!==(figures[q.id]?.length??0)&&q.media?.length)throw new Error(`Missing question media for ${q.id}.`);
    const body:Content[]=[
      runs(`${index+1}.  ${q.prompt}`,{bold:true,fontSize:10.5,lineHeight:1.15,margin:[0,0,0,6]}),
      ...(figures[q.id]??[]).map((f):Content=>f.image
        ?{image:f.image,fit:[495,280],alignment:'center',margin:[0,3,0,8]}
        :{text:f.label??'Open question media (online)',link:f.link,color:green,decoration:'underline',fontSize:9,margin:[0,3,0,8]}),
    ];
    if(isPaperLocation(q))body.push({text:'Write the location number from the figure: __________',fontSize:10,margin:[0,2,0,4]});
    else q.options.forEach((o,i)=>body.push(runs(`${letter(i)}.  ${o.text}`,{fontSize:10,margin:[12,2,0,2]})));
    const short=q.prompt.length+q.options.reduce((n,o)=>n+o.text.length,0)<1000&&(q.media?.length??0)<=1;
    content.push({stack:body,unbreakable:short,margin:[0,5,0,13]});
  });
  content.push({text:'Answer key & explanations',pageBreak:'before',fontSize:19,bold:true,color:green,margin:[0,0,0,14]});
  questions.forEach((q,index)=>{
    const source=[q.source.title,q.source.chapter,q.source.page?`p. ${q.source.page}`:'',q.source.slide?`slide ${q.source.slide}`:''].filter(Boolean).join(' · ');
    content.push({stack:[
      runs(`${index+1}.  ${practiceAnswer(q)}`,{bold:true,color:green,fontSize:10.5,margin:[0,0,0,4]}),
      runs(q.explanation,{fontSize:9.5,lineHeight:1.2,margin:[0,0,0,5]}),
      ...q.media?.filter(m=>m.transcript).map(m=>runs(`Media transcript: ${m.transcript}`,{fontSize:9,margin:[0,0,0,4]}))??[],
      runs(`${q.topic} · ${q.id}`,{fontSize:7.5,color:muted}),
      runs(`Reference: ${source}`,{fontSize:7.5,color:muted,margin:[0,2,0,0]}),
      ...q.media?.filter(m=>m.attribution).map(m=>runs(m.attribution!,{fontSize:7.5,color:muted}))??[],
    ],unbreakable:q.explanation.length<1800,margin:[0,0,0,14]});
  });
  return {pageSize:'A4',pageMargins:[42,38,42,46],info:{title:`${title} · Practice MCQs`,creator:'MED//25'},
    defaultStyle:{font:paperFonts.latin,fontSize:10,color:ink},content,
    footer:(page,total)=>({columns:[runs(`${title} · Practice MCQs`,{fontSize:7.5,color:muted}),{text:`${page} / ${total}`,fontSize:7.5,color:muted,alignment:'right'}],margin:[42,17,42,0]}),
  };
}
