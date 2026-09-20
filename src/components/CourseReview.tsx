"use client";
import {useEffect,useMemo,useState} from 'react';
import {cachedJson} from '@/src/lib/mcq/client-cache';
import {reviewBreakdown,type ReviewCourse,type ReviewOutcome} from '@/src/lib/mcq/review-results.mjs';
import {isTerm2Exam} from '@/src/lib/mcq/exams.mjs';
import {CachedPdfDownload} from './CachedPdfDownload';
import {StudyIcon} from './StudyIcon';

function useReview(exam:string) {
  const [course,setCourse]=useState<ReviewCourse|null>(null),[error,setError]=useState('');
  useEffect(()=>{let cancelled=false;setCourse(null);setError('');
    if(isTerm2Exam(exam))void cachedJson<{courses:Record<string,{url:string}>}>('/study/reviews/index.json').then(index=>{
      if(!index.courses[exam])throw Error('No review document is available for this course.');
      return cachedJson<ReviewCourse>(index.courses[exam].url);
    }).then(data=>{if(!cancelled)setCourse(data);}).catch(e=>{if(!cancelled)setError(e.message);});
    return()=>{cancelled=true;};
  },[exam]);
  return {course:course?.examId===exam?course:null,error};
}
function sectionUrl(course:ReviewCourse,id:string) {const s=course.sections.find(s=>s.id===id),v=course.volumes.find(v=>v.id===s?.volumeId);return v&&s?v.url+'#page='+s.pdfPage:undefined;}
/** Review PDF download pills for the course header. */
export function ReviewDownloads({exam}:{exam:string}) {
  const {course,error}=useReview(exam);
  if(!isTerm2Exam(exam))return null;
  return error?<span className="pill-note" role="alert">{error}</span>:!course?<span className="pill-note" role="status">Loading review PDFs…</span>:<ReviewDownloadLinks course={course}/>;
}
function ReviewDownloadLinks({course}:{course:ReviewCourse}) {
  return <div className="review-downloads" aria-label="Course review PDFs">{course.volumes.map(v=><CachedPdfDownload key={v.id} href={v.url}><StudyIcon name="download"/>{course.volumes.length>1?v.title:'Review PDF'}<small>{v.pageCount} pp</small></CachedPdfDownload>)}</div>;
}
const subjectLabels:Record<string,string>={anatomy:'Anatomy',histology:'Histology',embryology:'Embryology',physiology:'Physiology',biochemistry:'Biochemistry',reference:'Reference & checklists'};
const subjectOrder=['anatomy','histology','embryology','physiology','biochemistry','reference'];
export function ReviewTopics({exam,onPractice,disabled=false,subjectOf}:{exam:string;onPractice:(ids:string[])=>void;disabled?:boolean;subjectOf?:(questionId:string)=>string|undefined}) {
  const {course,error}=useReview(exam);
  const [search,setSearch]=useState(''),[volume,setVolume]=useState('all'),[practiceOnly,setPracticeOnly]=useState(false),[subject,setSubject]=useState('all');
  const questionsBySection=useMemo(()=>{
    const grouped=new Map<string,{ids:string[];suggested:number}>();
    for(const [id,mapping] of Object.entries(course?.questions??{})){
      if(!mapping.livePractice||!mapping.sectionId)continue;
      const row=grouped.get(mapping.sectionId)??{ids:[],suggested:0};
      row.ids.push(id);if(mapping.uncertain)row.suggested++;grouped.set(mapping.sectionId,row);
    }
    return grouped;
  },[course]);
  // A section belongs to the subject most of its mapped MCQs belong to. Sections without
  // MCQs (orientation pages, checklists) join the surrounding block, so the TOC keeps its order.
  const sectionSubject=useMemo(()=>{
    const out=new Map<string,string>();
    if(!course||!subjectOf)return out;
    const majority=course.sections.map(s=>{
      const counts=new Map<string,number>();
      for(const id of questionsBySection.get(s.id)?.ids??[]){const value=subjectOf(id);if(value)counts.set(value,(counts.get(value)??0)+1);}
      return [...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]??null;
    });
    let previous:string|null=null;
    course.sections.forEach((s,i)=>{
      let value=majority[i];
      if(!value){const next=majority.slice(i+1).find(Boolean)??null;value=previous??next??'reference';}
      out.set(s.id,value);previous=value;
    });
    return out;
  },[course,questionsBySection,subjectOf]);
  if(error)return <p role="alert" className="mcq-alert error">{error} Your MCQs still work; retry this tab when connected.</p>;
  if(!course)return <p role="status" className="mcq-loading">Loading this course’s PDF table of contents…</p>;
  const subjects=subjectOrder.filter(id=>[...sectionSubject.values()].includes(id));
  const bySubject=subjects.length>=2;
  const words=search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filtered=course.sections.filter(s=>(volume==='all'||s.volumeId===volume)&&(subject==='all'||!bySubject||sectionSubject.get(s.id)===subject)&&words.every(word=>s.title.toLowerCase().includes(word))&&(!practiceOnly||questionsBySection.has(s.id)));
  const groups=bySubject
    ?subjects.map(id=>({key:id,title:subjectLabels[id]??id,sections:filtered.filter(s=>sectionSubject.get(s.id)===id)}))
    :course.volumes.map(v=>({key:v.id,title:v.title,sections:filtered.filter(s=>s.volumeId===v.id)}));
  const countFor=(id:string)=>course.sections.filter(s=>sectionSubject.get(s.id)===id).length;
  return <section className="review-topics">
    <div className="section-head"><h2>Review sections<span>{filtered.length} of {course.sections.length}</span></h2><p>Read a section at its exact PDF page, or practise the MCQs mapped to it. {bySubject?'Sections are grouped by the subject of their questions; ':''}reference-only sections have no mapped questions yet.</p></div>
    {bySubject&&<div className="chip-set review-subjects" role="group" aria-label="Subject">
      <button type="button" aria-pressed={subject==='all'} onClick={()=>setSubject('all')}>All<b>{course.sections.length}</b></button>
      {subjects.map(id=><button key={id} type="button" aria-pressed={subject===id} onClick={()=>setSubject(id)}>{subjectLabels[id]??id}<b>{countFor(id)}</b></button>)}
    </div>}
    <div className="review-finder">
      <label className="mcq-search"><span className="mcq-sr-only">Find a section</span><span className="review-search-field"><StudyIcon name="search"/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sections, e.g. cardiac cycle"/></span></label>
      {course.volumes.length>1&&<label className="review-volume-filter"><span className="mcq-sr-only">Review volume</span><select value={volume} onChange={e=>setVolume(e.target.value)}><option value="all">All volumes</option>{course.volumes.map(v=><option key={v.id} value={v.id}>{v.title}</option>)}</select></label>}
      <label className="review-practice-filter pill"><input type="checkbox" checked={practiceOnly} onChange={e=>setPracticeOnly(e.target.checked)}/>With MCQs only</label>
    </div>
    {!filtered.length&&<div className="mcq-empty"><StudyIcon name="search"/><b>No matching sections</b><p>Try a different phrase or clear your filters.</p><button type="button" className="pill small" onClick={()=>{setSearch('');setVolume('all');setPracticeOnly(false);setSubject('all');}}>Clear filters</button></div>}
    {groups.map(group=>{
      if(!group.sections.length)return null;
      const mapped=group.sections.filter(s=>questionsBySection.has(s.id)).length;
      return <section className="review-volume" key={group.key} aria-label={group.title}><h3><StudyIcon name={bySubject?'layers':'book'}/>{group.title}<span>{group.sections.length} sections · {mapped} with MCQs</span></h3><ol className="review-section-list">{group.sections.map(s=>{
        const {ids,suggested}=questionsBySection.get(s.id)??{ids:[],suggested:0};
        return <li key={s.id} className={!ids.length?'review-reference-only':''}>
          <span className="review-card-index">{String(course.sections.indexOf(s)+1).padStart(2,'0')}</span>
          <div className="review-card-copy"><h4 title={s.title}>{s.title}</h4><p>{ids.length?`${ids.length} MCQ${ids.length===1?'':'s'}`:'Reference'}{suggested>0&&<small title="Suggested matches · confirm relevance">· {suggested} suggested</small>}</p></div>
          <div className="review-card-actions"><a href={sectionUrl(course,s.id)} target="_blank" rel="noreferrer" aria-label={`Read ${s.title}, PDF page ${s.pdfPage}`}><StudyIcon name="book"/>p. {s.pdfPage}</a><button type="button" className="pill accent" disabled={disabled||!ids.length} onClick={()=>onPractice(ids)} aria-label={`Practise section: ${s.title}`}>Practise<StudyIcon name="arrow"/></button></div>
        </li>;
      })}</ol></section>;
    })}
  </section>;
}
export function CourseReviewReport({exam,outcomes,onPractice,reviewOnly=false}:{exam:string;outcomes:ReviewOutcome[];onPractice?:(ids:string[])=>void;reviewOnly?:boolean}) {
  const {course,error}=useReview(exam),term2=isTerm2Exam(exam);
  if(term2&&!course&&!error)return <p role="status" className="mcq-loading">Matching your answers to review sections…</p>;
  const rows=reviewBreakdown(outcomes,course);
  return <section className="course-review-report" aria-label="Review section results"><h2>Your next review steps</h2><p>Green shows correct answers among those you attempted. Skipped and ungraded items are listed separately. This is a snapshot of tested material, not a mastery score for the entire course.</p>{error&&<p role="alert" className="mcq-alert">Review mapping unavailable. Showing question topics instead; your answers are safe.</p>}
    <div className="review-bars">{rows.map(row=><article key={row.id}><div className="review-bar-heading"><b>{row.title}</b><strong>{row.percent===null?'Not assessed':row.percent+'%'}</strong></div><div className="review-bar" role="img" aria-label={`${row.correct} correct of ${row.answered} answered`}><span style={{width:(row.percent??0)+'%'}}/></div><small>{row.correct}/{row.answered} answered correctly · {row.skipped} skipped{row.ungraded?' · '+row.ungraded+' ungraded':''}{row.uncertain?' · Suggested review match; confirm relevance':''}</small><div className="review-bar-actions">{course&&row.sectionId&&<a href={sectionUrl(course,row.sectionId)} target="_blank" rel="noreferrer">{row.missedIds.length?'Review this section':'Revisit section'} ↗</a>}{onPractice&&row.missedIds.length>0&&<button type="button" onClick={()=>onPractice(row.missedIds)}>{reviewOnly?'Review':'Retry'} {row.missedIds.length} to strengthen this</button>}</div></article>)}</div>
    {!rows.length&&<p>Complete some questions to see your review priorities.</p>}
    {term2&&course&&<details><summary>What this session did not assess</summary><p>{course.sections.filter(s=>!rows.some(r=>r.sectionId===s.id&&r.answered>0&&!r.uncertain)).length} review sections were not tested. They are not counted as incorrect or mastered. Use the Review topics tab for the full table of contents.</p></details>}
  </section>;
}
