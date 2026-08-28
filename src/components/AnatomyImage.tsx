"use client";
/* eslint-disable @next/next/no-img-element -- source diagrams use the study media endpoint */
import { useState } from "react";
import type { MCQMedia, MCQQuestion } from "@/src/lib/mcq/types";

export function AnatomyImage({ question, media, src, revealed }: { question: MCQQuestion; media: MCQMedia; src: string; revealed: boolean }) {
  const [selectedId, setSelectedId] = useState<string>();
  const [hoveredId, setHoveredId] = useState<string>();
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const regions = media.annotations ?? [];
  const target = regions.find((region) => region.id === question.anatomy?.targetRegionId);
  const active = revealed ? regions.find((region) => region.id === (hoveredId ?? selectedId)) ?? target : undefined;
  const describeId = `${question.id}-${media.id}-structure`;

  return <figure className={`anatomy-image ${expanded ? "expanded" : ""}`}>
    <div className="anatomy-toolbar"><span>{revealed ? "EXPLORE THE ANATOMY" : "DYNAMIC ANATOMY · MARKER A"}</span><button type="button" onClick={() => setExpanded(!expanded)} aria-pressed={expanded}>{expanded ? "Fit image" : "Enlarge image"}</button></div>
    {failed ? <p className="session-error" role="alert">This source image could not load. Skip or flag this question; don’t guess from a missing image.</p> : <div className="anatomy-scroll"><div className="anatomy-stage">
      <img src={src} alt={revealed ? media.alt : "Anatomical source diagram. Identify the structure at marker A."} onError={() => setFailed(true)} />
      {!revealed && media.labelMasks?.map((mask, index) => <span key={index} className="source-label-mask" aria-hidden="true" style={{ left: `${mask.x * 100}%`, top: `${mask.y * 100}%`, width: `${mask.width * 100}%`, height: `${mask.height * 100}%` }} />)}
      {target && <span className="anatomy-target" aria-label="Question marker A" style={{ left: `${(target.x + target.width / 2) * 100}%`, top: `${(target.y + target.height / 2) * 100}%` }}><i>A</i></span>}
      {revealed && regions.map((region) => <button type="button" key={region.id}
        className={`anatomy-hotspot ${active?.id === region.id ? "active" : ""} ${target?.id === region.id ? "target" : ""}`}
        style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%` }}
        aria-label={region.label} aria-describedby={describeId} aria-pressed={selectedId === region.id}
        onPointerEnter={() => setHoveredId(region.id)} onPointerLeave={() => setHoveredId(undefined)}
        onFocus={() => setHoveredId(region.id)} onBlur={() => setHoveredId(undefined)} onClick={() => setSelectedId(region.id)}
      ><span>{region.label}</span></button>)}
    </div></div>}
    {revealed ? <>
      <div className="anatomy-detail" id={describeId} role="status" aria-live="polite"><b>{active?.label ?? "Select a structure"}{active?.id === target?.id ? " · answer to A" : ""}</b><p>{active?.description ?? "Hover, tap or focus a highlighted region to identify it."}</p></div>
      <div className="anatomy-region-list" aria-label="All annotated structures">{regions.map((region) => <button type="button" key={region.id} className={active?.id === region.id ? "selected" : ""} aria-pressed={selectedId === region.id} onClick={() => { setSelectedId(region.id); setHoveredId(undefined); }}>{region.label}</button>)}</div>
      <figcaption>{media.caption} {media.attribution}</figcaption>
    </> : <figcaption>Identify A. Labels and all annotated regions unlock after you answer in Learn mode, or after grading in Exam mode. The same image tests different targets across questions.</figcaption>}
  </figure>;
}
