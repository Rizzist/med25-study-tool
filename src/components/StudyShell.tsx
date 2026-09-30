"use client";
import {useRef,type ReactNode} from 'react';
import Link from 'next/link';
import {isTerm2Exam,type ExamId} from '@/src/lib/mcq/exams.mjs';
import {StudyIcon,type StudyIconName} from './StudyIcon';
import {SignOutButton,useAuthAccount} from './AuthBoundary';
import {InstallAppButton} from './PwaProvider';

const navigation: Array<{title:string;hint:string;icon:StudyIconName;disabled?:boolean;shortTitle?:string}> = [
  {title:'Practice MCQs',hint:'Learn & test yourself',icon:'practice'},
  {title:'Past exams',hint:'Original papers & keys',icon:'papers'},
  {title:'Review topics',hint:'Sections & review PDFs',icon:'book'},
  {title:'Results',hint:'Progress & weak points',icon:'results'},
  {title:'Med School Books',shortTitle:'Books',hint:'Med School Books · coming soon',icon:'book',disabled:true},
  {title:'School Map',hint:'TUMS campus, rooms & travel',icon:'map'},
];
/** Study chrome: a slim dark rail (desktop) or bottom tab bar (phone), one compact
 * course strip, and the page. Question sessions hide all of it (immersive). */
export function StudyShell({exam,courses,activeSection,onCourseChange,onSectionChange,status,immersive,children}:{
  exam:ExamId;courses:Array<{id:ExamId;title:string;date:string;count?:number}>;activeSection:string;
  onCourseChange:(id:ExamId)=>void;onSectionChange:(section:string)=>void;
  status:string;immersive:boolean;children:ReactNode;
}) {
  const {displayName,canAccessAdmin}=useAuthAccount();
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
        return <button key={item.title} type="button" title={item.hint} disabled={item.disabled} aria-label={item.disabled?item.hint:undefined} className={active?'active':''} aria-current={active?'page':undefined} onClick={()=>{if(item.disabled)return;onSectionChange(item.title);window.scrollTo({top:0,behavior:'instant'});}}><StudyIcon name={item.icon}/><b>{item.shortTitle?<><span className="nav-full-title">{item.title}</span><span className="nav-short-title">{item.shortTitle}</span></>:item.title}{item.disabled&&<small className="nav-soon">Soon</small>}</b></button>;
      })}</nav>
      <div className="mcq-account"><strong>{displayName??'Student'}</strong>{canAccessAdmin&&<a href="/admin">Accounts</a>}<a href="/change-password">Password</a><SignOutButton/><InstallAppButton/><ActivityNotice/></div>
      <p className="mcq-sidebar-foot" role="status"><StudyIcon name="check"/><span>{status}</span></p>
    </aside>
    <div className="mcq-workspace">
      <div className="mcq-account-mobile"><strong>{displayName??'Student'}</strong>{canAccessAdmin&&<a href="/admin">Accounts</a>}<a href="/change-password">Password</a><SignOutButton/><InstallAppButton/><ActivityNotice/></div>
      {activeSection!=='School Map'&&<header className="mcq-topbar">
        <Link className="mcq-brand mcq-topbar-brand" href="/">MED//25</Link>
        <div className="mcq-term-picker" role="group" aria-label="Choose term">{([1,2] as const).map(t=><button key={t} type="button" aria-pressed={term===t} onClick={()=>chooseTerm(t)}>Term {t}</button>)}</div>
        <nav className="mcq-course-picker" aria-label={`Term ${term} courses`}>{termCourses.map(c=>{
          const tba=/tba/i.test(c.date);
          return <button key={c.id} type="button" className={exam===c.id?'active':''} aria-pressed={exam===c.id} title={`${c.title} · ${c.date}`} onClick={()=>chooseCourse(c.id)}>
            <b>{c.title}</b>
            <small>{!tba&&<>{c.date.split(' · ')[0]}<i>·</i></>}{c.count===undefined?'Loading questions…':c.count===0?'No MCQs yet':`${c.count.toLocaleString()} MCQs`}</small>
          </button>;
        })}</nav>
      </header>}
      <div className="mcq-content" id="study-content" tabIndex={-1}>{children}</div>
    </div>
  </main>;
}
function ActivityNotice(){return <details className="activity-notice"><summary>Activity privacy</summary><p>The owner can see visit times and approximate active duration. No answers, keystrokes, IP addresses or outside browsing are recorded. Hidden tabs and idle time are excluded. Up to 100 visits per account; entries older than 90 days are pruned when next accessed.</p></details>;}
