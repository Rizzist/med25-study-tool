"use client";
import type {CvsScope} from '@/src/lib/mcq/cvs-scope.mjs';
import {CVS_NONPHYSIO_REVIEW,CVS_PHYSIO_REVIEW} from '@/src/lib/mcq/cvs-review-scope.mjs';
import {StudyIcon} from './StudyIcon';

/** The upcoming exam comes first; the physiology exam has already been sat. */
const PORTIONS:{id:CvsScope;title:string;detail:string;status?:{label:string;tone:'next'|'done'};reviewPages?:number}[]=[
  {id:'non-physio',title:'Non-Physiology',detail:'Anatomy · Histology · Embryology',status:{label:'Next exam',tone:'next'},reviewPages:CVS_NONPHYSIO_REVIEW.volume.pageCount},
  {id:'physio',title:'Physiology',detail:'Heart, circulation and blood physiology',status:{label:'Exam done',tone:'done'},reviewPages:CVS_PHYSIO_REVIEW.volume.pageCount},
  {id:'all',title:'All CVS',detail:'Whole course · original results'},
];

export function CvsPortionPicker({scope,onChange,counts,disabled=false}:{scope:CvsScope;onChange:(scope:CvsScope)=>void;counts:Record<CvsScope,number>|null;disabled?:boolean}) {
  return <section className="cvs-portions" aria-label="CVS exam portion">
    <div className="cvs-portions-head"><span>Exam portion</span><p>Practice, past papers, review topics and results follow your choice. Remembered on this device.</p></div>
    <div className="cvs-portion-grid" role="radiogroup" aria-label="CVS exam portion">
      {PORTIONS.map(portion=><button key={portion.id} type="button" role="radio" aria-checked={scope===portion.id} disabled={disabled}
        className={'cvs-portion'+(portion.status?' is-'+portion.status.tone:'')} onClick={()=>onChange(portion.id)}>
        <span className="cvs-portion-top"><b>{portion.title}</b>{portion.status&&<em>{portion.status.label}</em>}</span>
        <span className="cvs-portion-detail">{portion.detail}</span>
        <span className="cvs-portion-meta"><span><strong>{counts?counts[portion.id].toLocaleString():'…'}</strong> MCQs</span>
          {portion.reviewPages&&<span className="cvs-portion-book"><StudyIcon name="book"/>{portion.reviewPages}-page review</span>}</span>
      </button>)}
    </div>
  </section>;
}
