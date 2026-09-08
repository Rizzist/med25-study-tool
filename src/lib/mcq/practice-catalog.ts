import retirements from '@/data/term2/anatomy-practice-retirements.json';

const retired = new Set(Object.keys(retirements.questions));
type Catalog = { concepts: { objectives: { id:string; questionIds:string[] }[] }[] };
// Keep all theory/source text. Only practice links disappear from the live view;
// the raw catalogs remain the historical source-coverage audit.
export function livePracticeCatalog<T extends Catalog>(catalog:T):T {
  return {...catalog,concepts:catalog.concepts.map(concept=>({...concept,objectives:concept.objectives.map(objective=>({...objective,questionIds:objective.questionIds.filter(id=>!retired.has(id))}))}))};
}
export function livePracticeIndex<T>(index:Record<string,T>):Record<string,T> {
  return Object.fromEntries(Object.entries(index).filter(([id])=>!retired.has(id)));
}
export function livePracticeDataset<T extends {catalog:Catalog;index:Record<string,{dedupeKey:string}>;coverage:{questionCount:number;distinctPracticeItems:number;unsampledObjectiveIds:string[]}}>(dataset:T):T {
  const catalog=livePracticeCatalog(dataset.catalog),index=livePracticeIndex(dataset.index);
  return {...dataset,catalog,index,coverage:{...dataset.coverage,questionCount:Object.keys(index).length,distinctPracticeItems:new Set(Object.values(index).map(item=>item.dedupeKey)).size,unsampledObjectiveIds:catalog.concepts.flatMap(c=>c.objectives.filter(o=>!o.questionIds.length).map(o=>o.id))}};
}
