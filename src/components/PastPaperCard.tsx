import type {ReactNode} from 'react';
import {StudyIcon} from './StudyIcon';

/** Shared source-paper presentation; each engine keeps its existing saved answers.
 * `featured` marks curated sets (Core / Non-core) that sit in the same grid as the papers. */
export function PastPaperCard({title,label,note,children,featured=false,badge}:{title:string;label:string;note:string;children:ReactNode;featured?:boolean;badge?:string}) {
  return <article className={'past-paper-card'+(featured?' featured':'')}>
    <div className="past-paper-top"><span className="past-paper-label"><StudyIcon name={featured?'layers':'papers'}/>{label}</span><details className="past-paper-note"><summary>Source details</summary><p>{note}</p></details></div>
    <h2>{badge&&<span className="past-paper-badge">{badge}</span>}{title}</h2>
    {children}
  </article>;
}
