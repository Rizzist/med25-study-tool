"use client";
import {useRef,type ReactNode} from 'react';
import Link from 'next/link';
import {isTerm2Exam,type ExamId} from '@/src/lib/mcq/exams.mjs';
import {StudyIcon,type StudyIconName} from './StudyIcon';

const navigation: Array<{title:string;hint:string;icon:StudyIconName}> = [
  {title:'Practice MCQs',hint:'Learn & test yourself',icon:'practice'},
  {title:'Past exams',hint:'Original papers & keys',icon:'papers'},
  {title:'Review topics',hint:'Sections & review PDFs',icon:'book'},
  {title:'Results',hint:'Progress & weak points',icon:'results'},
];
/** Study chrome: a slim dark rail (desktop) or bottom tab bar (phone), one compact
 * course strip, and the page. Question sessions hide all of it (immersive). */
export function StudyShell({exam,courses,activeSection,onCourseChange,onSectionChange,status,immersive,children}:{
  exam:ExamId;courses:Array<{id:ExamId;title:string;date:string;count?:number}>;activeSection:string;
  onCourseChange:(id:ExamId)=>void;onSectionChange:(section:string)=>void;
  status:string;immersive:boolean;children:ReactNode;
}) {
  const term=isTerm2Exam(exam)?2:1;
  const lastCourse=useRef<Partial<Record<1|2,ExamId>>>({});
  const termCourses=courses.filter(c=>isTerm2Exam(c.id)===(term===2));
  function chooseCourse(id:ExamId) {
    if(id===exam)return;
    onCourseChange(id);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function chooseTerm(next:1|2) {
    if(next===term)return;
    lastCourse.current[term]=exam;
    const course=lastCourse.current[next]??courses.find(c=>isTerm2Exam(c.id)===(next===2))?.id;
    if(course)chooseCourse(course);
  }
  return <main className={'mcq-app '+(immersive?'mcq-immersive':'')}>
    <a className="mcq-skip-link" href="#study-content">Skip to study content</a>
    <aside className="mcq-sidebar">
      <div className="mcq-sidebar-brand"><Link className="mcq-brand" href="/">MED//25</Link><span>Term 1 + Term 2</span><small>July 25 · Aug 22 · Aug 25</small></div>
      <nav className="mcq-side-nav" aria-label="Study navigation">{navigation.map(item=>{
        const active=activeSection===item.title;
        return <button key={item.title} type="button" title={item.hint} className={active?'active':''} aria-current={active?'page':undefined} onClick={()=>{onSectionChange(item.title);window.scrollTo({top:0,behavior:'instant'});}}><StudyIcon name={item.icon}/><b>{item.title}</b></button>;
      })}</nav>
      <p className="mcq-sidebar-foot" role="status"><StudyIcon name="check"/><span>{status}</span></p>
    </aside>
    <div className="mcq-workspace">
      <header className="mcq-topbar">
        <Link className="mcq-brand mcq-topbar-brand" href="/">MED//25</Link>
        <div className="mcq-term-picker" role="group" aria-label="Choose term">{([1,2] as const).map(t=><button key={t} type="button" aria-pressed={term===t} onClick={()=>chooseTerm(t)}>Term {t}</button>)}</div>
        <nav className="mcq-course-picker" aria-label={`Term ${term} courses`}>{termCourses.map(c=>{
          const tba=/tba/i.test(c.date);
          return <button key={c.id} type="button" className={exam===c.id?'active':''} aria-pressed={exam===c.id} title={`${c.title} · ${c.date}`} onClick={()=>chooseCourse(c.id)}>
            <b>{c.title}</b>
            <small>{!tba&&<>{c.date.split(' · ')[0]}<i>·</i></>}{c.count===undefined?'Loading questions…':c.count===0?'No MCQs yet':`${c.count.toLocaleString()} MCQs`}</small>
          </button>;
        })}</nav>
      </header>
      <div className="mcq-content" id="study-content" tabIndex={-1}>{children}</div>
    </div>
  </main>;
}
