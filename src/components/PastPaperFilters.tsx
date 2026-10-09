"use client";
import styles from './PastPaperFilters.module.css';
export function PastPaperFilters({query,filter,onQuery,onFilter,shown,total}:{query:string;filter:string;onQuery:(value:string)=>void;onFilter:(value:string)=>void;shown:number;total:number}){
  return <div className={styles.filters}>
    <label htmlFor="past-paper-search">Find a paper<input id="past-paper-search" type="search" value={query} onChange={event=>onQuery(event.target.value)} placeholder="Title, year or subject…"/></label>
    <label htmlFor="past-paper-filter">Show<select id="past-paper-filter" value={filter} onChange={event=>onFilter(event.target.value)}><option value="all">All papers</option><option value="course">Course papers</option><option value="scored">Available to take</option><option value="theory">Theory</option><option value="practical">Practicals</option><option value="supplement">Supplements / other programs</option></select></label>
    <p role="status">{shown} of {total} papers and collections</p>
  </div>;
}
