"use client";
import {useState} from 'react';
import coverage from '@/data/term2/anatomy-practical-coverage.json';

const statusLabels:Record<string,string>={'3d-scan':'3D · source mesh','3d-schematic':'3D · diagrammatic','2d-callout':'2D named target','regional-context':'Regional figure only','book-reference':'Book review needed'};
export default function AnatomyCoverageChecklist({moduleKey}:{moduleKey:string}){
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('all');
  const checklist=coverage.modules[moduleKey as keyof typeof coverage.modules];
  if(!checklist)return null;
  const rows=checklist.rows.filter(row=>(filter==='all'||filter==='no-3d'&&!row.status.startsWith('3d')||filter==='book'&&['book-reference','regional-context'].includes(row.status))&&`${row.label} ${row.tissue} ${row.group}`.toLowerCase().includes(query.toLowerCase()));
  const no3d=checklist.rows.filter(row=>!row.status.startsWith('3d')).length;
  return <details className="anatomy-coverage-checklist">
    <summary>Practical coverage checklist · {checklist.rows.length} audited items · {no3d} without a dedicated 3D target</summary>
    <p>{checklist.scope}</p><p>Scan meshes, approximate landmark pins, and schematic soft tissues are distinguished below. A grouped model is not proof that every constituent has its own label. Book-only items are explicitly listed rather than silently omitted.</p>
    <div className="anatomy-coverage-filters"><label>Find structure<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="e.g. interossei, ligament, nerve" /></label><label>Show<select value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">All audited items</option><option value="no-3d">No dedicated 3D target</option><option value="book">Needs book review</option></select></label><span>{rows.length} shown</span></div>
    <div className="anatomy-coverage-table"><table><thead><tr><th>Structure</th><th>Representation</th><th>Study source</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><th scope="row">{row.label}<small>{row.group||row.tissue}</small></th><td>{statusLabels[row.status]}{row.note&&<small>{row.note}</small>}</td><td>{row.figures.map(figure=><a key={figure.imageId} href={`/study/${figure.path}`} target="_blank" rel="noreferrer">{figure.title}</a>)}{(row.chapters.length>0||row.pdfPages.length>0)&&<small>Gray’s 42nd{row.chapters.length?` · Chapter ${row.chapters.join(', ')}`:''}{row.pdfPages.length?` · review PDF pages ${row.pdfPages.slice(0,4).join(', ')}${row.pdfPages.length>4?'…':''}`:''}</small>}</td></tr>)}</tbody></table></div>
  </details>;
}
