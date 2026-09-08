"use client";

import { useMemo, useState } from "react";
import AnatomyViewer from "./AnatomyViewer";
import { getAnatomyModule } from "@/src/lib/anatomy3d/registry";
import { systemsInManifest, systemForStructure } from "@/src/lib/anatomy3d/systems";
import { locationLabel } from "@/src/lib/mcq/anatomy-location.mjs";
import type { MCQQuestion } from "@/src/lib/mcq/types";

export default function ModelLocationQuestion({ question, revealed, savedRegionId, onSubmit }: { question: MCQQuestion; revealed: boolean; savedRegionId?: string; onSubmit?: (id: string) => void }) {
  const [pending, setPending] = useState(savedRegionId);
  const [submitted, setSubmitted] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [hiddenSystems, setHiddenSystems] = useState<string[]>([]);
  const manifest = getAnatomyModule(question.anatomy3d!.modelKey)!.manifest;
  const targetId = question.anatomy3d!.structureId;
  const hidden = useMemo(() => new Set(manifest.structures.filter(s => hiddenSystems.includes(systemForStructure(s))).map(s => s.id)), [manifest, hiddenSystems]);
  const options = question.anatomy3d?.selectableStructures ?? [];
  return <section className="anatomy-paired-media anatomy-model-location" aria-label="Find the named structure in 3D">
    <div className="anatomy-model-layers" aria-label="Peel away layers">{systemsInManifest(manifest).map(system => <button type="button" key={system.id} aria-pressed={!hiddenSystems.includes(system.id)} onClick={() => { setHiddenSystems(ids => ids.includes(system.id) ? ids.filter(id => id !== system.id) : [...ids, system.id]); setPending(undefined); setSubmitted(false); }}>{system.label}</button>)}</div>
    <AnatomyViewer modelKey={manifest.modelKey} onReady={()=>setModelReady(true)} focusStructureId={revealed ? targetId : pending} pickEnabled={!revealed&&modelReady} focusOnPick={false} pickCandidateIds={[targetId]} showLabels={revealed} labelMode="active" hiddenStructureIds={revealed ? new Set() : hidden} controlsVisible onPick={id => { if (locationLabel(question,id)) { setPending(id); setSubmitted(false); } }} className="anatomy-exam-viewer" />
    {revealed ? <p className="anatomy-location-feedback">Your selection: {locationLabel(question,savedRegionId) ?? "Not answered"}. Correct: {locationLabel(question,targetId)}.</p> : <div className="anatomy-location-response">
      <span>{submitted ? "Location saved. Correctness stays hidden until feedback." : pending ? "Your selection is outlined—not graded yet." : "Click a structure. Hide overlying layers to pick deep anatomy; X-ray changes visibility only."}</span>
      <label className="anatomy-keyboard-location">Keyboard location<select aria-label="Inspect a numbered 3D location" value={pending ?? ""} onChange={event => { setPending(event.target.value || undefined); setSubmitted(false); }}><option value="">Select a location</option>{options.filter(item=>!hidden.has(item.id)).map((item,index)=><option key={item.id} value={item.id}>Location {index+1}</option>)}</select></label>
      <button type="button" disabled={!modelReady || !pending || submitted || !onSubmit} onClick={() => { if (modelReady && pending) { onSubmit?.(pending); setSubmitted(true); } }}>Submit location</button>
    </div>}
  </section>;
}
