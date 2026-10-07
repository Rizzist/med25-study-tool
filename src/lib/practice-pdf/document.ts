import type {Content,TDocumentDefinitions} from 'pdfmake/interfaces';
import type {MCQQuestion} from '../mcq/types';
import {buildPaperDocument,PAPER_PDF_TEMPLATE,type PaperPart,type PaperVariant} from '../paper-pdf/document';

// Include the shared layout version so future past-paper styling updates invalidate these too.
export const PRACTICE_PDF_TEMPLATE=`2026-10-07.2:${PAPER_PDF_TEMPLATE}`;
export type PracticePdfVariant=Extract<PaperVariant,'questions'|'both'>;
export type PracticeFigure={image?:string;link?:string;label?:string};
export type PracticeFigures=Record<string,PracticeFigure[]>;
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

/** Adapt the practice bank to the same cover, question cards and inline keys as PYQs. */
export function buildPracticeDocument(title:string,questions:MCQQuestion[],variant:PracticePdfVariant,figures:PracticeFigures={}):TDocumentDefinitions {
  const part:PaperPart={courseTitle:title,collection:{id:'practice-bank',title:`${title} · Practice MCQs`},
    doc:{title:`${title} · Practice MCQs`,intro:[`${questions.length} generated practice questions. Full course bank, independent of session length or collection filters. Not a past exam paper.`],meta:{},sources:[],questions:[],keys:[],keyIntro:[]},questionExtras:{}};
  questions.forEach((q,index)=>{
    if(q.kind==='dynamic_anatomy_3d')throw new Error(`Archived 3D item ${q.id} cannot be exported without a verified 2D figure.`);
    if(q.media?.length!==(figures[q.id]?.length??0)&&q.media?.length)throw new Error(`Missing question media for ${q.id}.`);
    const number=String(index+1),locate=isPaperLocation(q);
    const source=[q.source.title,q.source.chapter,q.source.page?`p. ${q.source.page}`:'',q.source.slide?`slide ${q.source.slide}`:''].filter(Boolean).join(' · ');
    const options=locate?[]:q.options.map((o,i)=>({letter:letter(i),text:o.text}));
    part.doc.questions.push({id:q.id,number,paragraphs:[q.prompt,...locate?['Write the location number from the figure: __________']:[]],options,fields:{}});
    const notes=[q.explanation,`Reference: ${source}`,...q.media?.filter(m=>m.transcript).map(m=>`Media transcript: ${m.transcript}`)??[],...q.media?.filter(m=>m.attribution).map(m=>m.attribution!)??[]];
    // Neither explanations, references, nor answer metadata enter the questions-only document.
    if(variant==='both')part.doc.keys.push({id:q.id,number,paragraphs:notes,options:[],fields:{}});
    const accepted=new Set([q.correctOptionId,...q.acceptedOptionIds??[]]);
    part.questionExtras![q.id]={
      ...(variant==='both'?{answer:{text:practiceAnswer(q),correctLetters:locate?[]:q.options.flatMap((o,i)=>accepted.has(o.id)?[letter(i)]:[])}}:{}),
      media:(figures[q.id]??[]).map((f):Content=>f.image
        ?{image:f.image,fit:[490,260],alignment:'center',margin:[0,3,0,8]}
        :{text:f.label??'Open question media (online)',link:f.link,color:'#126747',decoration:'underline',fontSize:9,margin:[0,3,0,8]}),
      unbreakable:!(q.media?.length)&&q.prompt.length+q.options.reduce((n,o)=>n+o.text.length,0)+(variant==='both'?notes.join(' ').length:0)<1400,
    };
  });
  return buildPaperDocument([part],variant,`${title} · Practice MCQs · ${variant==='both'?'Questions + key':'Questions only'}`);
}
