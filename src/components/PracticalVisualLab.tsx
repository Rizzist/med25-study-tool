"use client";
import { useState } from 'react';
import { practicalCatalog as catalog } from '@/src/lib/physiology-practical';
import { PracticalCaseFigure } from './PracticalCaseFigure';

export function PracticalVisualLab({ stationId, disabled, attemptedIds, onPractice }: { stationId:string; disabled:boolean; attemptedIds:string[]; onPractice:(ids:string[], mode:'learn'|'exam', limit:number)=>void }) {
  const [includeExtension, setIncludeExtension] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const allCases = catalog.visualCases.filter((c) => c.stationId === stationId);
  const cases = allCases.filter((c) => includeExtension || c.scope !== 'extension');
  const item = cases.find((c) => c.id === selectedId) ?? cases[0];
  const position = item ? cases.indexOf(item) : 0;
  const sourceLinks = catalog.externalPractice.filter((s) => s.stations.includes(stationId));
  const ids = cases.flatMap((c) => c.questionIds);
  function choose(id:string) { setSelectedId(id); setRevealedId(null); }
  return <section className="pp-visual-lab" aria-label="Visual problem lab">
    <header><p className="eyebrow">Observe → explain → apply</p><h3>Visual problem lab</h3><p>{allCases.length} cases · {allCases.reduce((n,c)=>n+c.questionIds.length,0)} image questions. Each figure supports four different problems, not four copies of the same identification question.</p></header>
    {allCases.some((c) => c.scope === 'extension') && <div className="pp-case-scope"><label><input type="checkbox" checked={includeExtension} onChange={(event) => {setIncludeExtension(event.target.checked);setRevealedId(null);}} /> Include extension cases</label><p>Start with course-transfer methods for tomorrow. Extension adds keyed rhythm/conduction examples; their inclusion on your exam is not confirmed.</p></div>}
    <div className="pp-question-actions"><p>{cases.length} cases shown · {ids.filter((id) => attemptedIds.includes(id)).length}/{ids.length} questions attempted</p><button disabled={disabled || !ids.length} onClick={() => onPractice(ids,'exam',Math.min(ids.length,20))}>Mixed image mock: {Math.min(ids.length,20)} →</button></div>
    {item && <>
      <label className="pp-case-picker">Choose a case<select value={item.id} onChange={(event) => choose(event.target.value)}>{cases.map((c) => <option key={c.id} value={c.id}>{c.title} · {c.scope === 'extension' ? 'Extension' : 'Course transfer'}</option>)}</select></label>
      <div className="pp-case-heading"><div><small>{position + 1} / {cases.length} · {item.scope === 'extension' ? 'EXTENSION' : 'COURSE TRANSFER'}</small><h4>{item.title}</h4></div><div><button disabled={position === 0} onClick={() => choose(cases[position-1].id)}>← Previous</button><button disabled={position === cases.length-1} onClick={() => choose(cases[position+1].id)}>Next →</button></div></div>
      <PracticalCaseFigure key={item.id} item={item} src={`/study/${item.path}`} revealed={revealedId === item.id} />
      <div className="pp-case-actions"><button className="primary" disabled={disabled} onClick={() => onPractice(item.questionIds,'learn',item.questionIds.length)}>Practise these {item.questionIds.length} questions →</button><button disabled={disabled} onClick={() => onPractice(item.questionIds,'exam',item.questionIds.length)}>Test without feedback</button><button aria-expanded={revealedId === item.id} onClick={() => setRevealedId(revealedId === item.id ? null : item.id)}>{revealedId === item.id ? 'Hide worked interpretation' : 'Study worked interpretation (reveals answer)'}</button></div>
      <p className="pp-muted">In practice, annotations appear after your answer. In mock mode, they appear only after grading. This lesson&apos;s study button deliberately reveals the interpretation.</p>
    </>}
    <section className="pp-external-practice"><h4>More answered problem sets on the web</h4><p>Independent practice—not official TUMS past papers. External questions are linked, not copied. Your course methods take priority.</p>{sourceLinks.map((s) => <article key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a><p>{s.use}</p></article>)}</section>
  </section>;
}
