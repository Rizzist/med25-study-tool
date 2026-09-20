import type {ReactNode} from 'react';

export type StudyIconName = 'practice' | 'papers' | 'book' | 'results' | 'download' | 'search' | 'arrow' | 'check' | 'layers' | 'heart' | 'flag';
const paths: Record<StudyIconName, ReactNode> = {
  practice: <><rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 9 1.5 1.5L12 8M14 9h3M8 15h9"/></>,
  papers: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>,
  book: <><path d="M12 5C8 2 4 3 2 4v15c3-1 6-1 10 2 4-3 7-3 10-2V4c-2-1-6-2-10 1Zm0 0v16"/></>,
  results: <><path d="M4 3v17h17M8 16v-4M13 16V8M18 16V5"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></>,
  search: <><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  layers: <><path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 17l10 5 10-5"/></>,
  heart: <><path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 1 9 8 15 7-6 12-11 8-15Z"/><path d="M4 11h4l2-4 3 8 2-4h5"/></>,
  flag: <><path d="M5 22V3m0 0c5-4 9 4 15 0v10c-6 4-10-4-15 0"/></>,
};
export function StudyIcon({name,className=''}:{name:StudyIconName;className?:string}) {
  return <svg className={'study-icon '+className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
