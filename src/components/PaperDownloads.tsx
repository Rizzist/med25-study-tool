"use client";
import {CachedPdfDownload} from './CachedPdfDownload';
import {PaperPdfDownload} from './PaperPdfDownload';
import {StudyIcon} from './StudyIcon';
import type {PaperSource} from '@/src/lib/paper-pdf/client';

/** One sourced past-paper collection as published in the downloads catalog. */
export type DownloadCollection={id:string;courseId:string;title:string;note:string;kind:string;courseMatch:string;defaultEligible:boolean;sourceRecordCount:number;gradedQuestionCount:number;ungradedCount:number;gradedQuestionIds:string[];date?:string|null;downloads:{questions:string;answerKey:string;questionsAndKey:string};originals:Array<{name:string;url:string}>};
const isPdf=(url:string)=>/\.pdf(?:[?#]|$)/i.test(url);
export const paperSource=(item:DownloadCollection,url:string):PaperSource=>({url,collection:{id:item.id,title:item.title,gradedQuestionCount:item.gradedQuestionCount,sourceRecordCount:item.sourceRecordCount,ungradedCount:item.ungradedCount,date:item.date??null}});
/** Every artefact of one paper as a download pill: typeset questions, answer key, both, and the originals. */
export function PaperDownloads({item,courseTitle}:{item:DownloadCollection;courseTitle:string}) {
  const original=(i:number)=>item.originals.length>1?`Original ${i+1}`:'Original';
  const footer=`MED//25 · ${courseTitle} · ${item.title}`;
  return <div className="paper-downloads" aria-label={`Downloads for ${item.title}`}>
    <PaperPdfDownload sources={[paperSource(item,item.downloads.questions)]} variant="questions" filename={`${item.id}-questions.pdf`} courseTitle={courseTitle} footerLabel={footer}><StudyIcon name="download"/>Questions</PaperPdfDownload>
    <PaperPdfDownload sources={[paperSource(item,item.downloads.answerKey)]} variant="key" filename={`${item.id}-answer-key.pdf`} courseTitle={courseTitle} footerLabel={footer}><StudyIcon name="download"/>Answer key</PaperPdfDownload>
    <PaperPdfDownload sources={[paperSource(item,item.downloads.questionsAndKey)]} variant="both" filename={`${item.id}-questions-and-answer-key.pdf`} courseTitle={courseTitle} footerLabel={footer}><StudyIcon name="download"/>Questions + key</PaperPdfDownload>
    {item.originals.map((file,i)=>isPdf(file.url)
      ?<CachedPdfDownload key={file.url+'-'+i} href={file.url}><StudyIcon name="download"/>{original(i)}<small>PDF</small></CachedPdfDownload>
      :<a className="dl-pill" key={file.url+'-'+i} href={file.url} download><StudyIcon name="download"/>{original(i)}<small>image</small></a>)}
  </div>;
}
/** The whole course's downloads in one panel, opened from the hub toolbar. */
export function DownloadLibrary({collections,courseTitle}:{collections:DownloadCollection[];courseTitle:string}) {
  return <div className="paper-download-library" aria-label="All downloads for this course">{collections.map(item=><div className="library-row" key={item.id}><b>{item.title}</b><PaperDownloads item={item} courseTitle={courseTitle}/></div>)}</div>;
}
