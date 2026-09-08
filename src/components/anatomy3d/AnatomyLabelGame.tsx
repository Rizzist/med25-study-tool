"use client";
/* eslint-disable @next/next/no-img-element -- original anatomy source figures */

import { useEffect, useMemo, useRef, useState } from "react";
import visual from "@/data/term2/anatomy-visual-images.json";
import legacy from "@/data/term2/anatomy-images.json";
import type { AnatomySourceImage } from "@/src/lib/mcq/dynamic-anatomy.mjs";
import type { AnatomyModuleManifest } from "@/src/lib/anatomy3d/types";
import { placeAnatomyLabel, gradeAnatomyLabels, restoreLabelBoard } from "@/src/lib/anatomy3d/label-game.mjs";
import { shuffleAnatomy } from "@/src/lib/anatomy3d/visual-session.mjs";
import { regionAtPoint } from "@/src/lib/mcq/anatomy-location.mjs";
import AnatomyViewer, { type AnatomyViewerHandle } from "./AnatomyViewer";
import { systemsInManifest, systemForStructure } from "@/src/lib/anatomy3d/systems";
import { isFoundationTarget } from "@/src/lib/mcq/advanced-anatomy.mjs";

type Board={id:string;title:string;image?:AnatomySourceImage;model?:AnatomyModuleManifest;labels:{id:string;label:string;description:string}[]};
export default function AnatomyLabelGame({examId,modules,onExit}:{examId:string;modules:AnatomyModuleManifest[];onExit:()=>void}) {
  const boards=useMemo<Board[]>(()=>[
    ...([...visual.images,...legacy.images] as AnatomySourceImage[]).filter(image=>image.examId===examId || !image.examId&&examId==='term2-respiratory').map(image=>({id:image.id,title:image.title,image,labels:image.regions.filter(region=>!isFoundationTarget(region))})).filter(board=>board.labels.length),
    ...modules.flatMap(model=>{
      const targets=model.structures.filter(item=>item.quizable!==false&&!isFoundationTarget(item));
      return Array.from({length:Math.ceil(targets.length/12)},(_,index)=>({id:`${model.modelKey}:round:${index}`,title:`${model.title} · labels ${index*12+1}–${Math.min(targets.length,(index+1)*12)}`,model,labels:targets.slice(index*12,(index+1)*12)}));
    })],[examId,modules]);
  const [boardId,setBoardId]=useState(()=>{
    try {return typeof window==='undefined'?boards[0]?.id:window.localStorage.getItem(`med25.label-board:${examId}`)??boards[0]?.id;}catch{return boards[0]?.id;}
  });
  const board=boards.find(item=>item.id===boardId)??boards[0];
  useEffect(()=>{try{window.localStorage.setItem(`med25.label-board:${examId}`,board.id);}catch{}},[board,examId]);
  return <section className="anatomy-label-game">
    <header className="anatomy-exam-header"><div className="anatomy-exam-title"><b>Anatomy · Drag labels</b><label>Figure / model<select aria-label="Label game figure or model" value={board.id} onChange={event=>setBoardId(event.target.value)}><optgroup label="2D source figures">{boards.filter(item=>item.image).map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</optgroup><optgroup label="3D model rounds">{boards.filter(item=>item.model).map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</optgroup></select></label></div><button type="button" className="anatomy-settings-trigger" onClick={onExit}>Back to questions</button></header>
    <LabelBoard key={board.id} board={board} examId={examId} onNext={()=>setBoardId(boards[(boards.indexOf(board)+1)%boards.length].id)} />
  </section>;
}

function LabelBoard({board,examId,onNext}:{board:Board;examId:string;onNext:()=>void}) {
  const locations: {id:string;label:string;description:string}[]=board.image?.regions??board.model!.structures;
  const storageKey=`med25.label-game.v2:${examId}:${board.id}`;
  const [initial]=useState(()=>{try{return typeof window==='undefined'?null:restoreLabelBoard(window.localStorage.getItem(storageKey),board.id,locations,board.labels);}catch{return null;}});
  const [assignments,setAssignments]=useState<Record<string,string>>(initial?.assignments??{});
  const [graded,setGraded]=useState(initial?.graded??false);
  const [selected,setSelected]=useState<string>();
  const [notice,setNotice]=useState('Drag a label onto the image or model. You can also select a label, then click a location.');
  const [failed,setFailed]=useState(false);
  const [modelReady,setModelReady]=useState(Boolean(board.image));
  const [large,setLarge]=useState(false);
  const [hiddenSystems,setHiddenSystems]=useState<string[]>([]);
  const [reviewId,setReviewId]=useState<string>();
  const [keyboardLocation,setKeyboardLocation]=useState<string>();
  const viewer=useRef<AnatomyViewerHandle>(null);
  const boardRef=useRef<HTMLDivElement>(null);
  const labels=useMemo(()=>shuffleAnatomy(board.labels,board.id+':labels'),[board]);
  const results=gradeAnatomyLabels(assignments,locations,board.labels);
  const masks=[...(board.image?.labelMasks??[]),...(board.image?.markerMode==='label'?board.image.regions:[])];
  const score=results.filter(item=>item.correct).length;
  const hidden=useMemo(()=>new Set(board.model?.structures.filter(s=>hiddenSystems.includes(systemForStructure(s))).map(s=>s.id)??[]),[board,hiddenSystems]);
  useEffect(()=>{try{window.localStorage.setItem(storageKey,JSON.stringify({version:1,boardId:board.id,labelIds:board.labels.map(label=>label.id),assignments,graded}));}catch{}},[storageKey,board,assignments,graded]);
  function place(locationId?:string,labelId=selected) {
    if(graded||failed||!modelReady||!locationId||!labelId||hidden.has(locationId))return;
    const next=placeAnatomyLabel(assignments,locationId,labelId,locations,board.labels);
    if(next===assignments){setNotice('Choose one of the mapped locations.');return;}
    setAssignments(next);setSelected(undefined);setKeyboardLocation(undefined);setNotice('Label placed. Correctness stays hidden until you check the board.');
  }
  function locationAt(x:number,y:number) {
    if(board.image){const rect=boardRef.current?.getBoundingClientRect();return rect?regionAtPoint(board.image.regions,(x-rect.left)/rect.width,(y-rect.top)/rect.height):undefined;}
    return viewer.current?.pickAtPoint(x,y)??undefined;
  }
  function drop(event:React.DragEvent) {
    event.preventDefault();
    const label=event.dataTransfer.getData('application/x-med25-label');
    const location=locationAt(event.clientX,event.clientY);
    if(location)place(location,label);else setNotice('Outside a mapped location. Try the numbered target or zoom in.');
  }
  return <>
    <div className="anatomy-label-workspace" onKeyDown={event=>{if(event.key==='Escape'){setSelected(undefined);setKeyboardLocation(undefined);setNotice('Selection cancelled.');}}}>
      <div className="anatomy-label-visual" onDragOver={event=>{if(!graded)event.preventDefault();}} onDrop={drop}>
        {board.image ? <><button type="button" className="anatomy-game-zoom" onClick={()=>setLarge(value=>!value)}>{large?'Fit figure':'Enlarge figure'}</button><div className={`anatomy-game-scroll ${large?'large':''}`}>
          {failed?<p role="alert">Image unavailable. Choose another figure; do not guess from missing anatomy.</p>:<div ref={boardRef} className="anatomy-game-image" onClick={event=>{if(event.detail>0)place(locationAt(event.clientX,event.clientY));}}>
            <img src={'/study/'+board.image.path} alt={graded?board.image.alt:'Anatomy figure with hidden labels and numbered drop locations.'} onError={()=>setFailed(true)} />
            {!graded&&masks.map((mask,index)=><span key={index} className="source-label-mask" style={{left:`${mask.x*100}%`,top:`${mask.y*100}%`,width:`${mask.width*100}%`,height:`${mask.height*100}%`}} />)}
            {board.image.regions.map((region,index)=>{
              const label=labels.find(item=>item.id===assignments[region.id]);
              const result=results.find(item=>item.labelId===label?.id);
              return <button type="button" key={region.id} className={`anatomy-game-target ${label?'placed':''} ${graded?(label?(result?.correct?'correct':'wrong'):board.labels.some(item=>item.id===region.id)?'unanswered':''):''} ${(graded?reviewId:keyboardLocation)===region.id?'preview':''}`} style={{left:`${region.x*100}%`,top:`${region.y*100}%`,width:`${region.width*100}%`,height:`${region.height*100}%`}} aria-label={graded?`${region.label}: ${label?.label??'unassigned'}`:`Location ${index+1}${label?', assigned':''}`} onClick={event=>{if(event.detail===0){event.stopPropagation();place(region.id);}if(graded)setReviewId(region.id);}}><span>{index+1}{label?' ●':''}</span></button>;
            })}
          </div>}
        </div></>:<>
          <div className="anatomy-model-layers">{systemsInManifest(board.model!).map(system=><button key={system.id} type="button" aria-pressed={!hiddenSystems.includes(system.id)} onClick={()=>{setKeyboardLocation(undefined);setHiddenSystems(ids=>ids.includes(system.id)?ids.filter(id=>id!==system.id):[...ids,system.id]);}}>{system.label}</button>)}</div>
          <AnatomyViewer ref={viewer} modelKey={board.model!.modelKey} onReady={()=>setModelReady(true)} focusStructureId={graded?reviewId:keyboardLocation} showLabels={graded} labelMode="active" pickEnabled={!graded&&modelReady} focusOnPick={false} pickCandidateIds={selected?[selected]:undefined} onPick={id=>place(id)} hiddenStructureIds={graded?new Set():hidden} className="anatomy-game-viewer" />
        </>}
      </div>
      <aside className="anatomy-game-labels" aria-label="Labels to place"><h2>{graded?`${score} / ${labels.length} correct`:`${Object.keys(assignments).length} / ${labels.length} placed`}</h2>
        <p>{graded?'Select a label to inspect its correct anatomy.':'Drag to a location, or select a label then a target. Selecting a placed label lets you move it.'}</p>
        {labels.map(label=>{
          const result=results.find(item=>item.labelId===label.id)!;
          const locationIndex=locations.findIndex(item=>item.id===result.locationId);
          return <button type="button" draggable={!graded} key={label.id} aria-pressed={selected===label.id} className={`${selected===label.id?'selected':''} ${graded?(result.correct?'correct':'wrong'):result.locationId?'assigned':''}`} onDragStart={event=>{setSelected(label.id);event.dataTransfer.setData('application/x-med25-label',label.id);event.dataTransfer.effectAllowed='move';}} onDragEnd={()=>setSelected(undefined)} onClick={()=>{if(graded)setReviewId(label.id);else setSelected(label.id);}}>{label.label}<small>{graded?(result.correct?'✓ Correct':result.locationId?'× Incorrect':'Not placed'):locationIndex>=0?`Placed at location ${locationIndex+1}`:'Not placed'}</small></button>;
        })}
        {!graded&&selected&&<div className="anatomy-game-accessible"><label>Preview a numbered location<select aria-label="Preview a numbered location" value={keyboardLocation??""} onChange={event=>setKeyboardLocation(event.target.value||undefined)}><option value="">Choose location</option>{locations.filter(item=>!hidden.has(item.id)).map(item=><option key={item.id} value={item.id}>Location {locations.indexOf(item)+1}</option>)}</select></label><button type="button" disabled={failed||!modelReady||!keyboardLocation||hidden.has(keyboardLocation)} onClick={()=>place(keyboardLocation)}>Place selected label</button></div>}
        {graded&&reviewId&&<p className="anatomy-game-explanation"><b>{locations.find(item=>item.id===reviewId)?.label}</b><br/>{locations.find(item=>item.id===reviewId)?.description}</p>}
        {graded&&board.image&&<p className="anatomy-image-credit">{board.image.source.title} · {board.image.source.chapter} · {board.image.source.page?`Page ${board.image.source.page}`:`Slide ${board.image.source.slide}`} {board.image.attribution}</p>}
      </aside>
    </div>
    <footer className="anatomy-game-footer"><p role="status">{notice}</p><div><button type="button" onClick={()=>{setAssignments({});setGraded(false);setSelected(undefined);setReviewId(undefined);setKeyboardLocation(undefined);setNotice('Board reset. Place the labels again.');}}>Reset board</button>{graded?<button type="button" onClick={onNext}>Next board →</button>:<button type="button" disabled={failed||!modelReady||!Object.keys(assignments).length} onClick={()=>{setGraded(true);setSelected(undefined);setKeyboardLocation(undefined);setNotice('Board checked. Unplaced labels count as unanswered.');}}>Check board</button>}</div></footer>
  </>;
}
