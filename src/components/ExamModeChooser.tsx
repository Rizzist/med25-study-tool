"use client";
import {useEffect,useRef} from 'react';
import type {GuidanceMode} from '@/src/lib/mcq/guided-exam.mjs';
import {StudyIcon} from './StudyIcon';

export function ExamModeChooser({onChoose,onCancel}:{onChoose:(mode:GuidanceMode)=>void;onCancel:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=dialog.current;el?.showModal();return()=>el?.close();},[]);
  return <dialog ref={dialog} className="exam-mode-dialog" aria-labelledby="exam-mode-title" onCancel={onCancel}>
    <div className="exam-mode-heading"><div><small>Respiratory · exam mode</small><h2 id="exam-mode-title">How would you like to study?</h2></div><button type="button" aria-label="Cancel exam start" onClick={onCancel}>×</button></div>
    <div className="exam-mode-choices">
      <button type="button" onClick={()=>onChoose('guided')}><StudyIcon name="book"/><strong>Guided</strong><span>Keep the review PDF beside your questions. After each answer, jump to the relevant paragraph or section.</span><small>Open-book support · scroll freely</small></button>
      <button type="button" onClick={()=>onChoose('unguided')}><StudyIcon name="practice"/><strong>Unguided</strong><span>Questions only, with no PDF alongside. Keep your selected instant or end-of-test feedback.</span><small>Independent recall</small></button>
    </div>
    <p>This choice is saved with your attempt. Guided mode provides review access even when answer feedback is set to the end.</p>
  </dialog>;
}
