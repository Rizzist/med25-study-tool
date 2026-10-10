"use client";
import {CachedPdfDownload} from './CachedPdfDownload';
import {PaperPdfDownload} from './PaperPdfDownload';
import {OriginalPdfDownload} from './OriginalPdfDownload';
import {StudyIcon} from './StudyIcon';
import type {PaperSource} from '@/src/lib/paper-pdf/client';
import type {CvsScope} from '@/src/lib/mcq/cvs-scope.mjs';
import {retakePdfFilename} from '@/src/lib/mcq/retake-paper-scope.mjs';
import type {SourcePaper} from '@/src/lib/mcq/past-paper-catalog.mjs';

/** One sourced past-paper collection as published in the downloads catalog. */
export type DownloadCollection={id:string;courseId:string;title:string;note:string;kind:string;courseMatch:string;defaultEligible:boolean;sourceRecordCount:number;gradedQuestionCount:number;ungradedCount:number;gradedQuestionIds:string[];questionIds?:string[];takeableQuestionIds?:string[];cvsScope?:CvsScope;fullPaper?:DownloadCollection;independent?:boolean;distilled?:boolean;originalCollectionId?:string;duplicateOf?:string;limbQuestionIds?:{upper:string[];lower:string[]};limbSourceCounts?:{upper:number;lower:number};date?:string|null;downloads:{questions:string;answerKey:string;questionsAndKey:string};originals:Array<{name:string;url:string}>;sourceOnly?:boolean;sourcePaperIds?:string[];sourcePapers?:SourcePaper[]};
const isPdf=(url:string)=>/\.pdf(?:[?#]|$)/i.test(url);
export const paperSource=(item:DownloadCollection,url:string):PaperSource=>({url,collection:{id:item.id,title:item.title,gradedQuestionCount:item.gradedQuestionCount,sourceRecordCount:item.sourceRecordCount,ungradedCount:item.ungradedCount,date:item.date??null},...(item.cvsScope&&item.cvsScope!=='all'?{questionSelection:{ids:item.questionIds??[],label:item.cvsScope==='physio'?'Physio':'Non-Physio'}}:{})});
/** Every artefact of one paper as a download pill: typeset questions, answer key, both, and the originals. */
export function PaperDownloads({item,courseTitle}:{item:DownloadCollection;courseTitle:string}) {
  // Text transcripts already have Questions / Key downloads; they are not scan pages.
  const originals=item.originals.filter(file=>/\.(pdf|jpe?g|png)(?:[?#]|$)/i.test(file.url));
  const documents=item.originals.filter(file=>/\.docx(?:[?#]|$)/i.test(file.url));
  const footer=`MED//25 · ${courseTitle} · ${item.title}`;
  const scoped=Boolean(item.distilled||(item.cvsScope&&item.cvsScope!=='all'));
  const filename=(item.distilled?item.id.replace(/-distilled$/,''):item.id)+(item.cvsScope&&item.cvsScope!=='all'?`-cvs-${item.cvsScope}`:'');
  return <div className="paper-downloads" aria-label={`Downloads for ${item.title}`}>
    {!item.sourceOnly&&<>
    <PaperPdfDownload sources={[paperSource(item,item.downloads.questions)]} variant="questions" filename={retakePdfFilename(`${filename}-questions`,item.distilled)} courseTitle={courseTitle} footerLabel={footer}><StudyIcon name="download"/>Questions</PaperPdfDownload>
    <PaperPdfDownload sources={[paperSource(item,item.downloads.answerKey)]} variant="key" filename={retakePdfFilename(`${filename}-answer-key`,item.distilled)} courseTitle={courseTitle} footerLabel={footer}><StudyIcon name="download"/>Answer key</PaperPdfDownload>
    <PaperPdfDownload sources={[paperSource(item,item.downloads.questionsAndKey)]} variant="both" filename={retakePdfFilename(`${filename}-questions-and-answer-key`,item.distilled)} courseTitle={courseTitle} footerLabel={footer}><StudyIcon name="download"/>Questions + key</PaperPdfDownload>
    {originals.length===1&&isPdf(originals[0].url)
      ?<CachedPdfDownload href={originals[0].url}><StudyIcon name="download"/>{scoped?'Complete original':'Original'}<small>PDF</small></CachedPdfDownload>
      :originals.length>0&&<OriginalPdfDownload collectionId={item.originalCollectionId??item.id} title={item.title} label={scoped?'Complete original':undefined}/>}
    {documents.map(file=><a key={file.url} className="pill" href={file.url} download><StudyIcon name="download"/>{scoped?'Complete original document':'Original document'}<small>DOCX</small></a>)}
    </>}
    {item.sourcePapers?.filter(paper=>![...originals,...documents].some(file=>file.url===paper.url||file.url===paper.duplicateOfUrl)).map(paper=><div className="paper-original-version" key={paper.id}>
      {!item.sourceOnly&&<small>{paper.title}</small>}
      <div className="pill-row">{paper.format==='PDF'?<>
        <a className="pill" href={paper.url} target="_blank" rel="noreferrer"><StudyIcon name="book"/>Read original</a>
        <CachedPdfDownload href={paper.url}><StudyIcon name="download"/>Download original<small>PDF</small></CachedPdfDownload>
      </>:<a className="pill" href={paper.url} download><StudyIcon name="download"/>Original document<small>DOCX</small></a>}</div>
    </div>)}
  </div>;
}
/** The whole course's downloads in one panel, opened from the hub toolbar. */
export function DownloadLibrary({collections,courseTitle}:{collections:DownloadCollection[];courseTitle:string}) {
  return <div className="paper-download-library" aria-label="All downloads for this course">{collections.map(item=><div className="library-row" key={item.id}><b>{item.title}</b><PaperDownloads item={item} courseTitle={courseTitle}/></div>)}</div>;
}
