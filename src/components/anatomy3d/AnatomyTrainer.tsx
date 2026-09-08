"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { anatomyImagesForExam } from "@/src/lib/anatomy3d/study-catalog";
import { buildAnatomyQuestions } from "@/src/lib/mcq/dynamic-anatomy.mjs";
import { listAnatomyModules } from "@/src/lib/anatomy3d/registry";
import { buildAnatomyQuiz } from "@/src/lib/anatomy3d/quiz.mjs";
import { parseAnatomySession, selectAnatomySession, type AnatomySessionItem } from "@/src/lib/anatomy3d/visual-session.mjs";
import type { MCQQuestion } from "@/src/lib/mcq/types";
import PairedAnatomyMedia from "./PairedAnatomyMedia";
import AnatomyExplorer from "./AnatomyExplorer";
import AnatomyStudyGallery from "./AnatomyStudyGallery";
import { buildLocationQuestions, buildModelLocationQuestions, isLocationQuestion, locationOptionId, locationLabel, canRevealAnatomyFigure } from "@/src/lib/mcq/anatomy-location.mjs";
import AnatomyLabelGame from "./AnatomyLabelGame";
import { includeAdvancedAnatomyPractice } from "@/src/lib/mcq/advanced-anatomy.mjs";

export function AnatomyTrainer({ regions, onExit }: { regions: string[]; onExit?: () => void }) {
  const modules = useMemo(() => regions.flatMap((region) => listAnatomyModules(region)), [regions]);
  const examId = regions.includes("cvs") ? "term2-cvs" : regions.includes("respiratory") ? "term2-respiratory" : "term2-limbs";
  const title = examId === "term2-cvs" ? "CVS" : examId === "term2-respiratory" ? "Respiratory" : "Upper & Lower Limbs";
  const storageKey = `med25.anatomy-visual.session.v2:${examId}`;
  const restorePool = useMemo<MCQQuestion[]>(() => {
    const images = anatomyImagesForExam(examId, true).filter(image => image.regions.length >= 4);
    const diagrams = buildAnatomyQuestions(images);
    const models = modules.flatMap(({ manifest }) => buildAnatomyQuiz(manifest, { seed: "visual-atlas-v2" }).map((item) => ({
      schemaVersion: "1.0.0", id: `atlas-${item.id}`, revision: 1, status: "verified", kind: "dynamic_anatomy_3d", subject: "anatomy",
      topic: manifest.title, chapter: manifest.title, difficulty: item.difficulty, prompt: item.prompt,
      options: item.options, correctOptionId: item.correctOptionId, explanation: item.explanation,
      distractorExplanations: item.distractorExplanations, learningObjective: "Recognize the highlighted anatomical structure and its relationships.",
      source: { title: "BodyParts3D and the regional anatomy study atlas", chapter: manifest.title },
      anatomy3d: { modelKey: manifest.modelKey, structureId: item.structureId },
      tags: ["term-2", `exam-${examId}`, "anatomy-visual-atlas"], examPriority: "standard", qualityFlags: [],
    } as MCQQuestion)));
    return [...diagrams, ...buildLocationQuestions(diagrams), ...models, ...buildModelLocationQuestions(models, modules.map(item=>item.manifest))].filter(q=>includeAdvancedAnatomyPractice(q,modules.map(item=>item.manifest)));
  }, [examId, modules]);
  const pool=useMemo(()=>{
    const currentIds=new Set(anatomyImagesForExam(examId).map(image=>image.id));
    return restorePool.filter(question=>!question.anatomy||currentIds.has(question.anatomy.imageId));
  },[restorePool,examId]);
  const [initial] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = parseAnatomySession(window.localStorage.getItem(storageKey), restorePool) ?? parseAnatomySession(window.localStorage.getItem(storageKey.replace('.v2:', '.v1:')), restorePool);
        if (saved) return saved;
      }
    } catch { /* Session still works without browser storage. */ }
    return { items: selectAnatomySession(pool, { seed: "first-visual-session", count: 30 }), index: 0, answers: {} as Record<string,string>, locations: {} as Record<string,string>, graded: false, feedback: "learn" as const };
  });
  const [items, setItems] = useState<AnatomySessionItem[]>(initial.items);
  const [index, setIndex] = useState(initial.index);
  const [answers, setAnswers] = useState<Record<string, string>>(initial.answers);
  const [locations, setLocations] = useState<Record<string, string>>(initial.locations);
  const [graded, setGraded] = useState(initial.graded);
  const [feedback, setFeedback] = useState<"learn" | "exam">(initial.feedback);
  const [nextFeedback, setNextFeedback] = useState<"learn" | "exam">(initial.feedback);
  const [settings, setSettings] = useState(false);
  const [moduleKey, setModuleKey] = useState("all");
  const [format, setFormat] = useState<"2d" | "3d" | "mixed">("mixed");
  const [direction, setDirection] = useState<"mixed" | "identify" | "locate">(()=>initial.items.every(item=>isLocationQuestion(item.question))?'locate':initial.items.some(item=>isLocationQuestion(item.question))?'mixed':'identify');
  const [activeDirection, setActiveDirection] = useState(direction);
  const [count, setCount] = useState(30);
  const [exploring, setExploring] = useState(false);
  const [studying, setStudying] = useState(false);
  const [galleryImageId,setGalleryImageId]=useState('');
  const [exploreModelKey,setExploreModelKey]=useState<string>();
  const [labelGame, setLabelGame] = useState(false);
  const [settingsContainer, setSettingsContainer] = useState<HTMLDivElement | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewRef = useRef<HTMLDialogElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reviewOpen) reviewRef.current?.showModal();
    else reviewRef.current?.close();
  }, [reviewOpen]);

  useEffect(() => {
    if (!items.length) return;
    try {
      const snapshot=JSON.stringify({ version: 1, ids: items.map((item) => item.question.id), views: items.map((item) => item.initialView), answers, locations, index, graded, feedback });
      window.localStorage.setItem(storageKey,snapshot);
      window.localStorage.setItem(`${storageKey}:mode:${activeDirection}`,snapshot);
    } catch { /* Keep progress in memory. */ }
  }, [items, answers, locations, index, graded, feedback, storageKey,activeDirection]);

  function startSession() {
    setActiveDirection(direction);
    setItems(selectAnatomySession(pool, { seed: `${Date.now()}`, count, moduleKey, format, direction, feedback: nextFeedback }));
    setIndex(0); setAnswers({}); setLocations({}); setGraded(false); setFeedback(nextFeedback); setSettings(false); setReviewOpen(false);
  }
  function startDirection(next: "mixed" | "identify" | "locate") {
    setDirection(next); setActiveDirection(next);
    try {
      const saved=parseAnatomySession(window.localStorage.getItem(`${storageKey}:mode:${next}`),restorePool);
      if(saved){setItems(saved.items);setAnswers(saved.answers);setLocations(saved.locations);setIndex(saved.index);setGraded(saved.graded);setFeedback(saved.feedback);setReviewOpen(false);return;}
    }catch{}
    setItems(selectAnatomySession(pool, {seed:`${Date.now()}`,count,moduleKey,format,direction:next,feedback:nextFeedback}));
    setIndex(0); setAnswers({}); setLocations({}); setGraded(false); setFeedback(nextFeedback); setReviewOpen(false);
  }
  function go(next: number) {
    setIndex(next); setReviewOpen(false);
    if (window.matchMedia("(max-width: 700px)").matches) questionRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  const exploreRegion=listAnatomyModules().find(item=>item.manifest.modelKey===exploreModelKey)?.manifest.region;
  const explorer=<div className="anatomy-explorer-shell"><div className="anatomy-study-modes"><button type="button" className="anatomy-explorer-back" onClick={() => {setExploring(false);setStudying(false);}}>← Back to anatomy test</button><button type="button" onClick={() => {setExploring(false);setStudying(true);}}>Study 2D · labeled figures</button></div><AnatomyExplorer regions={exploreRegion&&!regions.includes(exploreRegion)?[exploreRegion]:regions} initialModelKey={exploreModelKey} /></div>;
  // Keep the gallery mounted while exploring: filters, masked labels and the
  // current practice target/answer survive a 2D → 3D → 2D round trip.
  if (studying) return <><div hidden={exploring}><AnatomyStudyGallery examId={examId} initialImageId={galleryImageId} onImageChange={setGalleryImageId} onExit={() => setStudying(false)} onExplore={key => {setExploreModelKey(key);setExploring(true);}} /></div>{exploring&&explorer}</>;
  if (exploring) return explorer;
  if (labelGame) return <AnatomyLabelGame examId={examId} modules={modules.map(item=>item.manifest)} onExit={() => setLabelGame(false)} />;
  const item = items[index];
  const question = item?.question;
  const answered = items.filter(({ question: q }) => answers[q.id]).length;
  const correct = items.filter(({ question: q }) => answers[q.id] === q.correctOptionId).length;
  const figureReady = Boolean(question && canRevealAnatomyFigure(question, items.map(item => item.question), q => Boolean(answers[q.id])));
  const revealed = graded || (feedback === "learn" && Boolean(question && answers[question.id]) && figureReady);
  const figureCount = new Set(pool.flatMap((q) => q.anatomy ? [q.anatomy.imageId] : [])).size;
  const imageTargets = [...new Map(pool.filter((q) => q.anatomy).map((q) => [q.anatomy!.imageId + ":" + q.anatomy!.targetRegionId, q])).values()];
  const pairedTargets = imageTargets.filter((q) => q.anatomy3d).length;

  return <section className="anatomy-exam" aria-label="Anatomy 2D and 3D test">
    <header className="anatomy-exam-header">
      <div className="anatomy-exam-title"><b>{title} · Anatomy</b><span>{question && isLocationQuestion(question) ? "Find the location" : "Identification MCQ"} · Question {items.length ? index + 1 : 0} of {items.length} · {graded ? `${correct} / ${items.length} correct` : `${answered} answered`}</span>
        <div className="anatomy-practice-modes" aria-label="Start an anatomy activity"><button type="button" aria-pressed={activeDirection==='identify'} onClick={()=>startDirection("identify")}>Identify · MCQs</button><button type="button" aria-pressed={activeDirection==='locate'} onClick={()=>startDirection("locate")}>Find · click location</button><button type="button" aria-pressed={activeDirection==='mixed'} onClick={()=>startDirection("mixed")}>Mixed</button><button type="button" onClick={()=>setLabelGame(true)}>Drag labels</button></div>
      </div>
      <div className="anatomy-study-modes"><button type="button" onClick={() => setStudying(true)}>Study 2D figures</button><button type="button" className="anatomy-settings-trigger" aria-expanded={settings} aria-controls="anatomy-exam-settings" onClick={() => setSettings(!settings)}>⚙ Settings</button></div>
    </header>
    {settings && <section id="anatomy-exam-settings" className="anatomy-exam-settings" aria-label="Anatomy test settings">
      <div className="anatomy-settings-heading"><h2>Test settings</h2><button type="button" onClick={() => setSettings(false)} aria-label="Close settings">×</button></div>
      <div className="anatomy-settings-grid">
        <label>Region<select value={moduleKey} onChange={(event) => setModuleKey(event.target.value)}><option value="all">All {title} anatomy</option>{modules.map(({ manifest }) => <option key={manifest.modelKey} value={manifest.modelKey}>{manifest.title}</option>)}</select></label>
        <label>Question views<select value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="mixed">Mostly 2D · some 3D</option><option value="2d">Source diagrams</option><option value="3d">Start in 3D</option></select></label>
        <label>Question direction<select value={direction} onChange={(event) => setDirection(event.target.value as typeof direction)}><option value="mixed">Both directions</option><option value="identify">Name the marked structure · MCQ</option><option value="locate">Given its name · click its location</option></select></label>
        <label>Questions<select value={count} onChange={(event) => setCount(Number(event.target.value))}>{[10,20,30,50,100,250,1000].map((n) => <option key={n} value={n}>{n === 1000 ? "All available targets" : n}</option>)}</select></label>
        <label>Answers for new test<select value={nextFeedback} onChange={(event) => setNextFeedback(event.target.value as typeof nextFeedback)}><option value="learn">Learn · reveal after answering</option><option value="exam">Test · reveal after grading</option></select></label>
      </div>
      <p>{figureCount} source figures · {imageTargets.length} labeled targets. {pairedTargets} have a separate 3D target; {imageTargets.length - pairedTargets} use regional 3D context only. Schematic structures are marked. Switching views keeps the same question.</p>
      <p>Learn uses one target per figure so revealed labels cannot answer a later question. Test mode can include more targets from each figure. Start a new test to apply these settings to a saved session.</p>
      <p>Advanced regional spotters: elementary whole-organ/bone recognition and “which system?” questions are excluded. The full anatomy remains available for context and exploration.</p>
      <div className="anatomy-settings-actions"><button type="button" onClick={startSession}>Start new test</button><button type="button" onClick={() => { setExploring(true); setSettings(false); }}>Explore the full 3D atlas</button>{onExit && <button type="button" onClick={onExit}>Back to study</button>}</div>
      <div ref={setSettingsContainer} className="anatomy-settings-visual" />
    </section>}
    {!question ? <div className="anatomy-exam-empty"><p>No questions match these settings.</p><button type="button" onClick={() => setSettings(true)}>Change settings</button></div> : <>
      <div ref={questionRef} className={`anatomy-exam-question ${isLocationQuestion(question) ? "is-locate" : ""}`} tabIndex={-1}>
        {isLocationQuestion(question) && <h1>{question.prompt}</h1>}
        <PairedAnatomyMedia key={question.id} question={question} revealed={revealed} initialView={item.initialView} settingsOpen={settings} settingsContainer={settingsContainer} testLayout locationAnswered={Boolean(answers[question.id])} savedRegionId={locations[question.id]} onLocationSubmit={(regionId) => { const outcome = locationOptionId(question, regionId); if (!revealed && outcome && regionId) { setAnswers(current => ({...current,[question.id]:outcome})); setLocations(current => ({...current,[question.id]:regionId})); } }} />
        {!isLocationQuestion(question) && <h1>{question.prompt}</h1>}
        {feedback === "learn" && answers[question.id] && !figureReady && !graded && <p className="anatomy-location-instruction">Answer saved. This older session reuses the figure; feedback unlocks after its other targets are answered or after grading.</p>}
        {isLocationQuestion(question) ? <p className="anatomy-location-instruction">{revealed ? answers[question.id] === question.correctOptionId ? "✓ Correct location. Open Review answer for the explanation." : "Compare your location with the revealed target, then open Review answer." : "Choose a numbered location and submit it above. In test mode, correctness stays hidden until grading."}</p> : <div className="anatomy-exam-options" role="group" aria-label="Answer choices">
          {question.options.map((option) => <button type="button" key={option.id} disabled={revealed} aria-pressed={answers[question.id] === option.id}
            className={revealed ? option.id === question.correctOptionId ? "correct" : answers[question.id] === option.id ? "wrong" : "" : answers[question.id] === option.id ? "chosen" : ""}
            onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}>
            <span>{option.id}</span><div><b>{option.text}</b>{revealed && <small>{option.id === question.correctOptionId ? "Correct answer" : answers[question.id] === option.id ? "Your answer" : ""}</small>}</div>
          </button>)}
        </div>}
      </div>
      <footer className="anatomy-exam-footer"><button type="button" disabled={index === 0} onClick={() => go(index - 1)}>← Previous</button>
        {revealed ? <button type="button" onClick={() => setReviewOpen(true)}>Review answer</button> : <button type="button" onClick={() => setGraded(true)}>Grade test{answered < items.length ? ` (${items.length - answered} unanswered)` : ""}</button>}
        {index < items.length - 1 ? <button type="button" className="primary" onClick={() => go(index + 1)}>Next →</button> : <button type="button" className="primary" onClick={() => setGraded(true)}>Finish & grade</button>}
      </footer>
      <dialog ref={reviewRef} className="anatomy-answer-review" aria-labelledby="anatomy-review-title" onClose={() => setReviewOpen(false)}>
        <div className="anatomy-settings-heading"><h2 id="anatomy-review-title">Answer & explanation</h2><button type="button" onClick={() => setReviewOpen(false)} aria-label="Close answer review">×</button></div>
        {revealed && <><p>{question.prompt}</p>{isLocationQuestion(question) ? <section><p><b>Your location:</b> {locationLabel(question, locations[question.id]) ?? (answers[question.id] ? "Location outcome saved; exact point unavailable in this older session." : "Not answered")}</p><p>{question.explanation}</p></section> : <div className="anatomy-review-options">{question.options.map((option) => <section key={option.id} className={option.id === question.correctOptionId ? "correct" : answers[question.id] === option.id ? "wrong" : ""}><h3>{option.id}. {option.text}{option.id === question.correctOptionId ? " · Correct" : answers[question.id] === option.id ? " · Your answer" : ""}</h3><p>{option.id === question.correctOptionId ? question.explanation : question.distractorExplanations[option.id]}</p></section>)}</div>}
        <div className="anatomy-exam-source"><b>Source and learning objective</b><p>{question.learningObjective}</p><p>{[question.source.title, question.source.edition, question.source.chapter, question.source.figure, question.source.page && `Page ${question.source.page}`, question.source.lecture, question.source.slide && `Slide ${question.source.slide}`].filter(Boolean).join(" · ")}</p></div></>}
      </dialog>
    </>}
  </section>;
}

export default AnatomyTrainer;
