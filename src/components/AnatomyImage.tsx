"use client";
/* eslint-disable @next/next/no-img-element -- source diagrams use the study media endpoint */
import { useState } from "react";
import { createPortal } from "react-dom";
import type { MCQMedia, MCQQuestion } from "@/src/lib/mcq/types";
import { isLocationQuestion, regionAtPoint } from "@/src/lib/mcq/anatomy-location.mjs";

export function AnatomyImage({ question, media, src, revealed, compact = false, testLayout = false, detailsContainer, onLocationSubmit, locationAnswered = false, savedRegionId }: { question: MCQQuestion; media: MCQMedia; src: string; revealed: boolean; compact?: boolean; testLayout?: boolean; detailsContainer?: HTMLElement | null; onLocationSubmit?: (regionId?: string) => void; locationAnswered?: boolean; savedRegionId?: string }) {
  const [selectedId, setSelectedId] = useState<string>();
  const [hoveredId, setHoveredId] = useState<string>();
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<string | null | undefined>(savedRegionId);
  const [submitted, setSubmitted] = useState(false);
  const locate = isLocationQuestion(question);
  const regions = media.annotations ?? [];
  const target = regions.find((region) => region.id === question.anatomy?.targetRegionId);
  const active = revealed ? regions.find((region) => region.id === (hoveredId ?? selectedId)) ?? target : undefined;
  const describeId = `${question.id}-${media.id}-structure`;
  const details = revealed ? <>
    <div className="anatomy-detail" id={describeId} role="status" aria-live="polite"><b>{active?.label ?? "Select a structure"}{active?.id === target?.id ? " · correct target" : ""}</b><p>{active?.description ?? "Hover, tap or focus a highlighted region to identify it."}</p></div>
    <div className="anatomy-region-list" aria-label="All annotated structures">{regions.map((region) => <button type="button" key={region.id} className={active?.id === region.id ? "selected" : ""} aria-pressed={selectedId === region.id} onClick={() => { setSelectedId(region.id); setHoveredId(undefined); }}>{region.label}</button>)}</div>
    <p className="anatomy-image-credit">{media.caption} {media.attribution}</p>
  </> : null;

  return <figure className={`anatomy-image ${locate ? "anatomy-location-image" : ""} ${expanded ? "expanded" : ""} ${compact ? "anatomy-image-test" : ""} ${question.anatomy?.markerMode === "label" ? "anatomy-callout-image" : ""}`}>
    <div className="anatomy-toolbar">{!compact && <span>{revealed ? "EXPLORE THE ANATOMY" : locate ? "FIND THE NAMED STRUCTURE" : "DYNAMIC ANATOMY · MARKER A"}</span>}<button type="button" onClick={() => setExpanded(!expanded)} aria-pressed={expanded}>{expanded ? "Fit image" : "Enlarge image"}</button></div>
    {failed ? <p className="session-error" role="alert">This source image could not load. Skip or flag this question; don’t guess from a missing image.</p> : <div className="anatomy-scroll"><div className="anatomy-stage" onClick={locate && !revealed ? (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setPendingRegion(regionAtPoint(regions, (event.clientX-rect.left)/rect.width, (event.clientY-rect.top)/rect.height) ?? null); setSubmitted(false);
    } : undefined}>
      <img src={src} alt={revealed ? media.alt : locate ? "Anatomical source diagram with numbered selectable locations; labels are hidden until feedback." : target ? "Anatomical source diagram. Identify the structure at marker A." : "Anatomical source diagram for this question."} onError={() => setFailed(true)} />
      {!revealed && media.labelMasks?.map((mask, index) => <span key={index} className="source-label-mask" aria-hidden="true" style={{ left: `${mask.x * 100}%`, top: `${mask.y * 100}%`, width: `${mask.width * 100}%`, height: `${mask.height * 100}%` }} />)}
      {target && (!locate || revealed) && <span className="anatomy-target" aria-label={locate ? "Correct location" : "Question marker A"} style={{ left: `${(target.x + target.width / 2) * 100}%`, top: `${(target.y + target.height / 2) * 100}%` }}><i>{locate ? "✓" : "A"}</i></span>}
      {locate && !revealed && regions.map((region, index) => <button type="button" key={region.id} className={`anatomy-location-hotspot ${pendingRegion === region.id ? "picked" : ""}`}
        aria-label={`Select location ${index+1}`} aria-pressed={pendingRegion === region.id}
        style={{ left:`${region.x*100}%`, top:`${region.y*100}%`, width:`${region.width*100}%`, height:`${region.height*100}%` }}
        onClick={(event) => {
          // Pointer clicks bubble to the stage's shared coordinate resolver;
          // keyboard activation has no coordinate and selects the focused box.
          if (event.detail === 0) { event.stopPropagation(); setPendingRegion(region.id); setSubmitted(false); }
        }}><span>{index+1}</span></button>)}
      {revealed && regions.map((region) => <button type="button" key={region.id}
        className={`anatomy-hotspot ${active?.id === region.id ? "active" : ""} ${target?.id === region.id ? "target" : ""}`}
        style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%` }}
        aria-label={region.label} aria-describedby={!testLayout || detailsContainer ? describeId : undefined} aria-pressed={selectedId === region.id}
        onPointerEnter={() => setHoveredId(region.id)} onPointerLeave={() => setHoveredId(undefined)}
        onFocus={() => setHoveredId(region.id)} onBlur={() => setHoveredId(undefined)} onClick={() => setSelectedId(region.id)}
      ><span>{region.label}</span></button>)}
    </div></div>}
    {locate && !revealed && !failed && <div className="anatomy-location-response">
      <span>{submitted || locationAnswered && pendingRegion === undefined ? "Location saved; feedback follows your session mode." : pendingRegion === undefined ? question.anatomy?.markerMode === "label" ? "Choose the masked callout linked to the named structure." : "Choose a numbered annotated area." : pendingRegion === null ? "Outside the supported hotspots—choose a numbered area." : `Location ${regions.findIndex(r=>r.id===pendingRegion)+1} selected.`}</span>
      <button type="button" disabled={!onLocationSubmit || pendingRegion == null || submitted} onClick={() => { onLocationSubmit?.(pendingRegion ?? undefined); setSubmitted(true); }}>Submit location</button>
    </div>}
    {locate && revealed && pendingRegion && <p className="anatomy-location-feedback">Your selected location: {regions.find(r=>r.id===pendingRegion)?.label}. Correct target: {target?.label}.</p>}
    {revealed ? testLayout ? detailsContainer && createPortal(details, detailsContainer) : details : !compact && <figcaption>{locate ? "Find the named structure using the selectable callout or annotated area." : "Identify A."} Labels and exploration unlock after you answer in Learn mode, or after grading in Exam mode.</figcaption>}
  </figure>;
}
