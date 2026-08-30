"use client";
/* eslint-disable @next/next/no-img-element -- inspected local source originals, with attribution */
import { useState } from 'react';
import type { PracticalVisualCase } from '@/src/lib/physiology-practical';

export function PracticalCaseFigure({ item, src, revealed }: { item: PracticalVisualCase; src: string; revealed: boolean }) {
  const [zoom, setZoom] = useState(1);
  const [annotations, setAnnotations] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  return <figure className="pp-case-figure">
    <div className="pp-case-tools"><span>{item.scope === 'extension' ? 'Extension · not confirmed exam scope' : 'Course-transfer visual problem'}</span><div>
      <button type="button" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - .5))} aria-label="Zoom image out">−</button>
      <output aria-live="polite">{Math.round(zoom * 100)}%</output>
      <button type="button" disabled={zoom >= 3} onClick={() => setZoom((z) => Math.min(3, z + .5))} aria-label="Zoom image in">+</button>
      <button type="button" disabled={zoom === 1} onClick={() => setZoom(1)}>Fit</button>
      {revealed && <button type="button" aria-pressed={annotations} onClick={() => setAnnotations(!annotations)}>{annotations ? 'Hide' : 'Show'} annotations</button>}
    </div></div>
    <div className="pp-case-viewport" tabIndex={0} role="region" aria-label="Scrollable source image; use arrow keys or touch to pan when zoomed">
      <div className="pp-case-image-content" style={{ width: `${zoom * 100}%` }}>
        <img src={src} alt={`${item.title}. ${revealed ? 'Worked interpretation appears below.' : 'Inspect the tracing or figure before choosing an answer.'}`} />
        {!revealed && item.masks.map((m, i) => <span key={i} className="pp-case-mask" aria-hidden="true" style={{ left:`${m.x*100}%`,top:`${m.y*100}%`,width:`${m.width*100}%`,height:`${m.height*100}%` }} />)}
        {revealed && annotations && item.annotations.map((a) => <button type="button" key={a.label} className={`pp-case-marker ${active === a.label ? 'active' : ''}`} aria-label={`${a.label}: ${a.text}`} onMouseEnter={() => setActive(a.label)} onFocus={() => setActive(a.label)} onClick={() => setActive(a.label)} style={{ left:`${a.x*100}%`,top:`${a.y*100}%`,width:`${a.width*100}%`,height:`${a.height*100}%` }}><span>{a.label}</span></button>)}
      </div>
    </div>
    <figcaption><span>Zoom changes display size—not the recording&apos;s time or voltage calibration. {item.masks.length > 0 && !revealed && 'Printed answer labels are covered until feedback.'}</span><small>{item.source.provider} · {item.source.attribution} · {item.source.licenseUrl ? <a href={item.source.licenseUrl} target="_blank" rel="noreferrer">{item.source.license}</a> : item.source.license}</small></figcaption>
    {revealed && <div className="pp-case-feedback">
      <h4>Read the evidence</h4>
      <ol className="pp-case-annotations">{item.annotations.map((a) => <li key={a.label} className={active === a.label ? 'active' : ''}><button type="button" onFocus={() => setActive(a.label)} onMouseEnter={() => setActive(a.label)} onClick={() => { setAnnotations(true); setActive(a.label); }} aria-label={`Highlight region ${a.label}`}><b>{a.label}</b></button><p>{a.text}</p></li>)}</ol>
      <h4>Connect it to the theory</h4>{item.overview.map((text) => <p key={text}>{text}</p>)}
      <p className="pp-case-license">{item.source.note}</p>
      <div className="pp-case-source-links">{item.source.url && <a href={item.source.url} target="_blank" rel="noreferrer">Source interpretation / reference ↗</a>}{item.source.fileUrl && <a href={item.source.fileUrl} target="_blank" rel="noreferrer">Original figure & attribution ↗</a>}</div>
    </div>}
  </figure>;
}
