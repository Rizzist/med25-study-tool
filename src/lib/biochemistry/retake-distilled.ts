import type {Content,TDocumentDefinitions} from 'pdfmake/interfaces';
import type {CoreEvidence,CoreManifest} from '../mcq/curated-core.mjs';
import type {DownloadCollection} from '../../components/PaperDownloads';
import {paperFonts,runs} from '../paper-pdf/document';
import {requireStudySession} from '../../../public/med25-auth-cache.mjs';

export const RETAKE_CORE_URL='/study/biochemistry-retake/core-exam-distilled.json';
export const RETAKE_GUIDE_URL='/study/biochemistry-retake/guide-distilled.json';
export type RetakeCoreManifest=Omit<CoreManifest,'questions'|'papers'>&{
  sourceFamilyCount:number;gradedSourceQuestionCount:number;sourceUnitLabel:string;
  questions:Array<CoreEvidence&{questionText:string}>;
  papers:Array<{id:string;title:string;url:string;familyId:string;role:'exam'|'recall'|'practice';reason:string}>;
  downloadCollection:DownloadCollection;
};
export type RetakeGuideConcept={id:string;title:string;summary:string;keyPoints:string[];sourceEvidence:string[];correctionSourceUrl?:string};
export type RetakeGuideSource={id:string;paperId:string;title:string;number:number|string;url:string};
export type RetakeGuideSection={chapterId:string;title:string;focus:string;pdfPage:number;reviewUrl:string;sourceQuestions:RetakeGuideSource[];concepts:RetakeGuideConcept[]};
export type RetakeDistilledGuide={title:string;scope:string;conceptCount:number;sourceQuestionCount:number;reviewUrl:string;fingerprint:string;sections:RetakeGuideSection[]};

const ink='#172a22',muted='#58675e',gold='#8b6a22';
/** Same protected renderer and embedded fonts as source-paper downloads. */
export function buildRetakeGuideDocument(guide:RetakeDistilledGuide,origin:string):TDocumentDefinitions {
  const link=(path:string)=>new URL(path,origin).href;
  const content:Content[]=[
    {text:'MED//25 · BIOCHEMISTRY I',fontSize:9,bold:true,color:gold,characterSpacing:1.3},
    runs(guide.title,{fontSize:23,bold:true,margin:[0,7,0,8]}),
    runs(guide.scope,{fontSize:9.5,color:muted,lineHeight:1.2,margin:[0,0,0,8]}),
    {text:`${guide.conceptCount} reviewed concepts · ${guide.sections.length} sections`,fontSize:10,bold:true,color:gold,margin:[0,0,0,5]},
    {text:'A focused selection from the reviewed course material, supported by original past-paper questions. It does not replace the complete syllabus or the source papers.',fontSize:9,color:muted,margin:[0,0,0,7]},
    {text:'Complete reviewed course PDF',link:link(guide.reviewUrl),color:gold,fontSize:9,decoration:'underline',margin:[0,0,0,15]},
  ];
  for(const section of guide.sections){
    const heading:Content[]=[
      runs(section.title,{fontSize:15,bold:true,color:ink,margin:[0,13,0,4]}),
      runs(section.focus,{fontSize:9.5,color:gold,lineHeight:1.15,margin:[0,0,0,7]}),
    ];
    for(const [index,concept] of section.concepts.entries()){
      const card:Content[]=[
        ...(index===0?heading:[]),
        runs(concept.title,{fontSize:10.5,bold:true,margin:[0,7,0,4]}),
        {ul:concept.keyPoints.map(point=>runs(point)),fontSize:9.2,lineHeight:1.18,margin:[8,0,0,4]},
        runs(concept.summary,{fontSize:9,color:muted,lineHeight:1.17,margin:[0,0,0,5]}),
      ];
      if(concept.correctionSourceUrl)card.push({text:'Reviewed clarification · clinical guideline',link:concept.correctionSourceUrl,fontSize:8,color:gold,decoration:'underline',margin:[0,0,0,5]});
      content.push({stack:card,unbreakable:true});
    }
    const evidence:Content[]=section.sourceQuestions.map(source=>({text:`${source.title} · Q${source.number}`,link:link(source.url),color:gold,fontSize:8,decoration:'underline',margin:[0,2,0,0]}));
    content.push({stack:[{text:'Original question evidence',fontSize:8.5,bold:true,margin:[0,8,0,2]},...evidence],margin:[0,0,0,9]});
  }
  return {
    pageSize:'A4',pageMargins:[40,42,40,44],defaultStyle:{font:paperFonts.latin,fontSize:9.2,color:ink},
    info:{title:guide.title,author:'MED//25',subject:'Biochemistry I distilled past-paper guide'},
    footer:(page,pages)=>({columns:[{text:'MED//25 · Biochemistry I · Distilled guide',fontSize:8,color:muted},{text:`${page} / ${pages}`,fontSize:8,color:muted,alignment:'right'}],margin:[40,14,40,0]}),
    content,
  };
}
type GuidePdfEnvironment={authorize?:()=>Promise<unknown>;origin?:string;render?:(definition:TDocumentDefinitions)=>Promise<Blob>};
export async function retakeGuidePdf(guide:RetakeDistilledGuide,env:GuidePdfEnvironment={}):Promise<Blob>{
  const authorize=env.authorize??requireStudySession;
  await authorize();
  if(!guide.fingerprint||!guide.sections.length)throw new Error('The guide has not loaded completely. Refresh and retry.');
  const render=env.render??(await import('../paper-pdf/client')).renderStudyPdf;
  const blob=await render(buildRetakeGuideDocument(guide,env.origin??location.origin));
  // Recheck after a long render so a sign-out cannot be followed by a protected save.
  await authorize();
  return blob;
}
