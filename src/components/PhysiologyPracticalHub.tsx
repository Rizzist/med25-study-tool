"use client";
/* eslint-disable @next/next/no-img-element -- untouched local course figures, opened at original resolution */
import { useState } from "react";
import { practicalCatalog as catalog, type PracticalStation } from "@/src/lib/physiology-practical";
import { selectPracticalStation, togglePracticalRead, usePracticalReading } from "@/src/lib/practical-reading-store";

type Props = {
  onPractice: (ids: string[], mode: "learn" | "exam", limit: number) => void;
  disabled: boolean;
  attemptedIds: string[];
  repairIds: string[];
  initialPanel?: "learn" | "watch" | "recall";
};
function Demonstration({ video }: { video: PracticalStation["videos"][number] }) {
  const [playing, setPlaying] = useState(false);
  const href = `https://www.youtube.com/watch?v=${video.id}`;
  return <article className="pp-video">
    <div className="pp-player">{playing
      ? <iframe title={video.title} src={`https://www.youtube-nocookie.com/embed/${video.id}`} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      : <button onClick={() => setPlaying(true)} aria-label={`Load video: ${video.title}`}><span aria-hidden="true">▶</span><b>Load demonstration</b><small>YouTube loads only when you choose</small></button>}
    </div>
    <div className="pp-video-copy"><small>{video.provider}</small><h3>{video.title}</h3><p>{video.note}</p><a href={href} target="_blank" rel="noreferrer">Watch on YouTube ↗</a><small className="pp-fallback">If the player is blocked, use the link. The lesson works without video.</small></div>
  </article>;
}
export function PhysiologyPracticalHub({ onPractice, disabled, attemptedIds, repairIds, initialPanel = "learn" }: Props) {
  const reading = usePracticalReading();
  const [panel, setPanel] = useState(initialPanel);
  const [figureIndex, setFigureIndex] = useState(0);
  const station = catalog.stations.find((item) => item.id === reading.selectedId) ?? catalog.stations[0];
  const index = catalog.stations.indexOf(station);
  const attempted = new Set(attemptedIds);
  const repair = new Set(repairIds);
  const stationRepairs = station.questionIds.filter((id) => repair.has(id));
  const figure = station.images[figureIndex] ?? station.images[0];
  const allIds = catalog.stations.flatMap((item) => item.questionIds);
  function choose(id: string) { selectPracticalStation(id); setFigureIndex(0); }
  return <div className="pp-hub">
    <header className="pp-hero">
      <div><p className="eyebrow">Term 2 / Hands-on revision</p><h1>Physiology, in practice.</h1><p>Watch it. Explain it. Rehearse it. Then test yourself.</p><div className="pp-stats"><span><b>{catalog.totals.stations}</b> stations</span><span><b>{catalog.totals.questions}</b> MCQs</span><span><b>{catalog.totals.images}</b> course figures</span><span><b>{catalog.totals.videos}</b> video links</span></div></div>
      <div className="pp-circuit"><small>YOUR REVISION CIRCUIT</small><strong>{reading.readIds.length}<span> / {catalog.totals.stations}</span></strong><label htmlFor="pp-progress">Stations rehearsed</label><progress id="pp-progress" max={catalog.totals.stations} value={reading.readIds.length} /><button className="primary" disabled={disabled} onClick={() => onPractice(allIds, "exam", 36)}>36-question mixed mock →</button><small>4 per station · answers after grading</small></div>
    </header>
    <details className="pp-scope"><summary>What this covers, safety and source corrections</summary><p>{catalog.basis}</p><p><b>Exam date:</b> 31 August 2026 — user-reported, not an official timetable.</p><p><b>Safety:</b> {catalog.safety}</p><p>{catalog.videoNote}</p><ul>{catalog.unresolved.map((note) => <li key={note}>{note}</li>)}</ul><div className="pp-references">{catalog.references.map((ref) => <a key={ref.url} href={ref.url} target="_blank" rel="noreferrer" title={ref.use}>{ref.title} ↗</a>)}</div></details>
    <div className="pp-safety" role="note">For blood-based stations, rehearse the explanation and calculation. Perform sampling and handling only under trained supervision.</div>
    {reading.storageError && <p role="alert" className="session-error">Checklist storage is unavailable. Progress may be lost on reload; your study content is still available.</p>}
    <div className="pp-layout">
      <aside className="pp-stations"><div className="pp-nav-title"><b>Study order</b><small>~{Math.round(catalog.totals.studyMinutes / 60 * 10) / 10}h + 50-min recall/mock</small></div><nav aria-label="Physiology practical stations">{catalog.stations.map((item, number) => <button key={item.id} className={item.id === station.id ? "active" : ""} aria-current={item.id === station.id ? "step" : undefined} onClick={() => choose(item.id)}><span className="pp-number">{String(number + 1).padStart(2, "0")}</span><span><b>{item.title}</b><small>{item.minutes} min · {item.questionIds.filter((id) => attempted.has(id)).length}/{item.questionIds.length} MCQs attempted{reading.readIds.includes(item.id) ? " · rehearsed ✓" : ""}</small></span></button>)}</nav><p>Use the numbered files in <b>MED SLIDES / TERM 2 / 08 Physiology Practical</b>. Start with file 00.</p></aside>
      <section className="pp-station" aria-label={station.title}>
        <header className="pp-station-header"><p className="eyebrow">Station {String(index + 1).padStart(2, "0")} / File {station.fileOrder} / {station.minutes} minutes</p><h2>{station.title}</h2><p>{station.subtitle}</p><div className="pp-controls"><button className="primary" disabled={disabled} onClick={() => onPractice(station.questionIds, "learn", station.questionIds.length)}>Practise {station.questionIds.length} MCQs →</button><button disabled={disabled || !stationRepairs.length} onClick={() => onPractice(stationRepairs, "learn", stationRepairs.length)}>Repair {stationRepairs.length}</button><label><input type="checkbox" checked={reading.readIds.includes(station.id)} onChange={() => togglePracticalRead(station.id)} disabled={!reading.ready} /> I can explain & rehearse this</label></div></header>
        <nav className="pp-panels" aria-label="Lesson view">{([['learn', '01 / Understand & rehearse'], ['watch', '02 / Figures & video'], ['recall', '03 / Recall & coverage']] as const).map(([id, label]) => <button key={id} aria-pressed={panel === id} className={panel === id ? 'active' : ''} onClick={() => setPanel(id)}>{label}</button>)}</nav>
        <div className="pp-panel" key={station.id + panel}>
          {panel === "learn" && <>
            <div className="pp-lead-grid"><section><h3>What you need to understand</h3><ul className="pp-essentials">{station.essentials.map((text) => <li key={text}>{text}</li>)}</ul></section><figure className="pp-lead-figure"><a href={`/study/${station.images[0].path}`} target="_blank" rel="noreferrer"><img src={`/study/${station.images[0].path}`} alt={station.images[0].title} /></a><figcaption>{station.images[0].title}<small>{station.images[0].locator} · tap to enlarge</small></figcaption><button onClick={() => setPanel("watch")}>See all figures & watch demonstration →</button></figure></div>
            <section className="pp-equipment"><h3>Recognise the equipment</h3><div>{station.equipment.map((name) => <span key={name}>{name}</span>)}</div></section>
            <section><h3>Rehearse aloud: action → reason</h3><ol className="pp-procedure">{station.steps.map((step, i) => <li key={step.action}><span>{String(i + 1).padStart(2, "0")}</span><div><h4>{step.action}</h4><p>{step.why}</p></div></li>)}</ol></section>
            <section className="pp-worked"><h3>Work it through</h3>{station.worked.map((example) => <article key={example.title}><h4>{example.title}</h4><p className="pp-formula">{example.formula}</p><p>{example.working}</p></article>)}</section>
            <section className="pp-traps"><h3>Do not memorise the mistake</h3>{station.traps.map((trap) => <article key={trap.wrong}><p><span>Trap / source error</span>{trap.wrong}</p><p><span>Use this instead</span>{trap.right}</p></article>)}</section>
            <button className="pp-next" onClick={() => setPanel("watch")}>Next: figures & video demonstrations →</button>
          </>}
          {panel === "watch" && <>
            <section className="pp-gallery"><div className="pp-gallery-nav">{station.images.map((item, i) => <button key={item.path} onClick={() => setFigureIndex(i)} aria-pressed={figure.path === item.path}>{i + 1}. {item.title}</button>)}</div><figure><a href={`/study/${figure.path}`} target="_blank" rel="noreferrer"><img src={`/study/${figure.path}`} alt={figure.title} /></a><figcaption><b>{figure.title}</b><p>{figure.caption}</p><small>{figure.locator} · click image for full resolution</small></figcaption></figure></section>
            <h3>Watch the technique</h3><p className="pp-muted">Pause after each step and explain why it is done. These external demonstrations supplement your slides; your laboratory’s SOP takes priority.</p><div className="pp-video-grid">{station.videos.map((video) => <Demonstration key={video.id} video={video} />)}</div>
            <button className="pp-next" onClick={() => setPanel("recall")}>Next: close the notes & recall →</button>
          </>}
          {panel === "recall" && <>
            <h3>Could you explain it to the examiner?</h3><p className="pp-muted">Answer aloud before revealing. Recognition alone is not practical competence.</p><div className="pp-recall">{station.recall.map((item) => <details key={item.prompt}><summary>{item.prompt}</summary><p>{item.answer}</p></details>)}</div>
            <h3>Objective → question coverage</h3><p className="pp-muted">This maps the authored revision objectives—not a guarantee of the official exam’s content. “Attempted” does not mean mastered.</p><div className="pp-coverage">{station.objectiveCoverage.map((item) => <article key={item.id}><div><h4>{item.title}</h4><small>{item.questionIds.length} linked questions · {item.questionIds.filter((id) => attempted.has(id)).length} attempted · {item.questionIds.filter((id) => repair.has(id)).length} to repair</small></div><button disabled={disabled} onClick={() => onPractice(item.questionIds, "learn", item.questionIds.length)}>Test this →</button></article>)}</div>
            <div className="pp-end"><div><h3>Run this station without feedback</h3><p>Eight questions. Explain your reasoning, then grade the whole set.</p></div><button className="primary" disabled={disabled} onClick={() => onPractice(station.questionIds, "exam", station.questionIds.length)}>Station mock →</button></div>
          </>}
        </div>
        <footer className="pp-source"><p><b>Local source:</b> {station.source} · {station.sourceRange}</p><p>Lesson checklist and question progress are separate and saved on this device. These are newly authored source-based questions, not official past papers.</p><div><button disabled={index === 0} onClick={() => choose(catalog.stations[index - 1].id)}>← Previous station</button><button disabled={index === catalog.stations.length - 1} onClick={() => { choose(catalog.stations[index + 1].id); setPanel("learn"); }}>Next station →</button></div></footer>
      </section>
    </div>
  </div>;
}
