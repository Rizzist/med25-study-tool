"use client";
/* eslint-disable @next/next/no-img-element -- local source-preserving anatomy figures */
import { useEffect, useMemo, useState } from "react";
import { anatomyStudyImages } from "../../lib/anatomy3d/study-catalog";
import { buildAnatomyQuestions, type AnatomySourceImage } from "../../lib/mcq/dynamic-anatomy.mjs";
import { buildLocationQuestions } from "../../lib/mcq/anatomy-location.mjs";
import { AnatomyImage } from "../AnatomyImage";
import AnatomyCoverageChecklist from './AnatomyCoverageChecklist';

export default function AnatomyStudyGallery({ examId, onExit, onExplore, initialImageId, onImageChange }: { examId: string; onExit: () => void; onExplore: (modelKey?:string) => void; initialImageId?:string; onImageChange?:(id:string)=>void }) {
  const [region, setRegion] = useState(anatomyStudyImages.find(image=>image.id===initialImageId)?.examId??examId);
  const [query, setQuery] = useState("");
  const [imageId, setImageId] = useState(initialImageId??"");
  const [practice, setPractice] = useState(false);
  const images = useMemo(() => anatomyStudyImages.filter(image => (region === "all" || (image.examId ?? "term2-respiratory") === region || image.moduleKey === region || region === "term2-respiratory" && image.moduleKey === "thoracic-wall") && `${image.title} ${image.regions.map(r => r.label).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [region, query]);
  const image = images.find(item => item.id === imageId) ?? images[0];
  const index = images.indexOf(image);
  useEffect(()=>{if(image)onImageChange?.(image.id);},[image,onImageChange]);
  function go(delta: number) { if (images.length) setImageId(images[(index + delta + images.length) % images.length].id); }
  return <section className="anatomy-study-gallery" aria-label="Labeled anatomy study atlas">
    <header className="anatomy-study-header"><div><h1>Anatomy · Source figures</h1><p>Study the original labels, then practise finding them.</p></div><button type="button" onClick={onExit}>Back to questions</button></header>
    <div className="anatomy-study-controls">
      <label>Region<select value={region} onChange={event => {setRegion(event.target.value); setImageId("");}}><option value="all">All anatomy</option><option value="term2-cvs">CVS & thorax</option><option value="term2-respiratory">Respiratory</option><option value="term2-limbs">Both limbs</option><option value="upper-limb">Upper limb</option><option value="lower-limb">Lower limb</option></select></label>
      <label>Find a figure or structure<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="e.g. humerus, carpals, knee" /></label>
      <label>Figure<select value={image?.id ?? ""} onChange={event => setImageId(event.target.value)}>{images.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    </div>
    <nav className="anatomy-study-navigation" aria-label="Figure navigation"><button type="button" disabled={!images.length} onClick={() => go(-1)}>← Previous figure</button><span aria-live="polite">{images.length ? index + 1 : 0} / {images.length}</span><button type="button" disabled={!images.length} onClick={() => go(1)}>Next figure →</button></nav>
    <div className="anatomy-study-modes"><button type="button" aria-pressed={!practice} onClick={() => setPractice(false)}>Study · labeled</button><button type="button" aria-pressed={practice} onClick={() => setPractice(true)}>Practice · find the label</button><button type="button" onClick={()=>onExplore(image?.moduleKey??image?.anatomy3d?.modelKey)}>Explore 3D atlas</button></div>
    <p className="anatomy-study-context-note">3D opens the corresponding region, not an exact reconstruction of every detail in this figure. Upper-limb 3D is right-sided; read each source figure’s view and laterality.</p>
    {image ? <StudyFigure key={`${image.id}:${practice}`} image={image} practice={practice} /> : <p role="status">No figures match. Try another region or search.</p>}
    {image?.moduleKey && <AnatomyCoverageChecklist moduleKey={image.moduleKey} />}
    <nav className="anatomy-study-navigation" aria-label="Bottom figure navigation"><button type="button" disabled={!images.length} onClick={() => go(-1)}>← Previous figure</button><button type="button" disabled={!images.length} onClick={() => go(1)}>Next figure →</button></nav>
  </section>;
}

function StudyFigure({ image, practice }: { image: AnatomySourceImage; practice: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [large, setLarge] = useState(false);
  const [failed, setFailed] = useState(false);
  const [targetIndex, setTargetIndex] = useState(0);
  const [answer, setAnswer] = useState<string>();
  const questions = useMemo(() => image.regions.length >= 4 ? buildLocationQuestions(buildAnatomyQuestions([image]).filter(question => question.id.endsWith("-v1"))) : [], [image]);
  const question = questions[targetIndex];
  const numbered=image.labelStyle==='numbered-key'||image.regions.some(region=>region.sourceNumber!=null);
  const masks = [...(image.labelMasks ?? []), ...(image.markerMode === "label"&&!numbered ? image.regions : [])];
  const source = [image.source.title, image.source.edition && `${image.source.edition} edition`, image.source.chapter && `Chapter ${image.source.chapter}`, image.source.figure && `Figure ${image.source.figure}`, image.source.page, image.source.lecture, image.source.slide && `Slide ${image.source.slide}`].filter(Boolean).join(" · ");
  return <article className="anatomy-study-figure">
    <h2>{image.title}</h2>
    {image.practiceNote && questions.length > 0 && <p className="anatomy-study-source">{image.practiceNote}</p>}
    {practice && question ? <>
      <div className="anatomy-study-prompt"><h3>{question.prompt}</h3><button type="button" onClick={() => {setTargetIndex(value => (value + 1) % questions.length);setAnswer(undefined);}}>Next structure →</button></div>
      <AnatomyImage key={question.id} question={question} media={question.media![0]} src={`/study/${image.path}`} revealed={Boolean(answer)} locationAnswered={Boolean(answer)} savedRegionId={answer} onLocationSubmit={id => setAnswer(id)} />
      {answer && <p role="status" className="anatomy-study-result">{answer === question.anatomy?.targetRegionId ? "✓ Correct." : "Not that location."} {question.explanation}</p>}
    </> : <>
      {practice && <p>{image.practiceNote ?? "This figure is available for self-testing; individually verified click targets have not yet been added."}</p>}
      <div className="anatomy-study-modes"><button type="button" disabled={!masks.length} aria-pressed={hidden} onClick={() => setHidden(value => !value)}>{hidden ? "Reveal labels" : "Hide labels"}</button><button type="button" aria-pressed={large} onClick={() => setLarge(value => !value)}>{large ? "Fit figure" : "Enlarge figure"}</button></div>
      {failed ? <p role="alert">Figure unavailable. Choose another source figure.</p> : <div className={`anatomy-study-image-scroll ${large ? "large" : ""}`}><div className="anatomy-study-image"><img src={`/study/${image.path}`} alt={hidden ? "Anatomy source figure with labels concealed for recall." : image.alt} onError={() => setFailed(true)} />{hidden && masks.map((mask, i) => <span key={i} className="source-label-mask" aria-hidden="true" style={{left:`${mask.x*100}%`,top:`${mask.y*100}%`,width:`${mask.width*100}%`,height:`${mask.height*100}%`}} />)}</div></div>}
      {!hidden && <details><summary>Mapped structures ({image.regions.length})</summary><dl>{image.regions.map(region => <div key={region.id}><dt>{region.label}</dt><dd>{region.description}</dd></div>)}</dl></details>}
    </>}
    <p className="anatomy-study-source">{source}</p>
  </article>;
}
