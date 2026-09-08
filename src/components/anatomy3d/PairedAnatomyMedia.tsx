"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnatomyImage } from "../AnatomyImage";
import AnatomyViewer from "./AnatomyViewer";
import { getAnatomyModule } from "@/src/lib/anatomy3d/registry";
import { systemsInManifest, systemForStructure } from "@/src/lib/anatomy3d/systems";
import { buildAnatomyQuestions } from "@/src/lib/mcq/dynamic-anatomy.mjs";
import { allStudyImages as images } from "@/src/lib/anatomy3d/study-catalog";
import type { MCQQuestion } from "@/src/lib/mcq/types";
import type { CameraView } from "@/src/lib/anatomy3d/types";
import { compositeStructureId } from "@/src/lib/anatomy3d/composite";
import { isLocationQuestion } from "@/src/lib/mcq/anatomy-location.mjs";
import ModelLocationQuestion from "./ModelLocationQuestion";

const existingFigureModels: Record<string, string> = {
  "term2/cvs/heart1-slide6-pericardium-wall.png": "heart",
  "term2/cvs/heart2-slide8-coronary-anterior.png": "heart",
  "term2/cvs/heart3-slide9-coronary-ostia.png": "heart",
  "term2/cvs/mediastinum1-slide4-cardiac-plexus.png": "mediastinum",
};
function sourceView(view = ""): CameraView | undefined {
  const direction = view.toLowerCase();
  if (/^posterior|^dorsal/.test(direction)) return { azimuth: Math.PI, elevation: 0.1, zoom: 1.1 };
  if (/inferior|plantar/.test(direction)) return { azimuth: 0, elevation: -1.2, zoom: 1.1 };
  if (/superior/.test(direction)) return { azimuth: 0, elevation: 1.2, zoom: 1.1 };
  if (/lateral|sagittal|medial/.test(direction)) return { azimuth: /right/.test(direction) ? -Math.PI / 2 : Math.PI / 2, elevation: 0.1, zoom: 1.1 };
  if (/anterior|palmar/.test(direction)) return { azimuth: 0, elevation: 0.1, zoom: 1.1 };
}

export default function PairedAnatomyMedia({ question, revealed, initialView = "2d", imageSrc, settingsOpen = false, testLayout = false, settingsContainer, onLocationSubmit, locationAnswered, savedRegionId }: {
  question: MCQQuestion; revealed: boolean; initialView?: "2d" | "3d"; imageSrc?: string; settingsOpen?: boolean; testLayout?: boolean; settingsContainer?: HTMLElement | null; onLocationSubmit?: (regionId?: string) => void; locationAnswered?: boolean; savedRegionId?: string;
}) {
  const [view, setView] = useState(initialView);
  const [selection, setSelection] = useState<{ modelKey: string; id: string } | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [hiddenSystems, setHiddenSystems] = useState<string[]>([]);
  const [figureOnly, setFigureOnly] = useState(false);
  const [allLabels, setAllLabels] = useState(false);
  // Reverse pairing preserves the original question, options and progress.
  const image = useMemo(() => images.find((item) => item.id === question.anatomy?.imageId)
    ?? (!question.anatomy && question.anatomy3d ? images.find((item) => item.regions.some((region) => region.structureId === question.anatomy3d?.structureId && (region.modelKey ?? item.moduleKey) === question.anatomy3d?.modelKey)) : undefined), [question]);
  const displayQuestion = useMemo(() => {
    if (question.anatomy || !image) return question;
    const paired = buildAnatomyQuestions([image]).find((item) => item.anatomy3d?.structureId === question.anatomy3d?.structureId && item.anatomy3d?.modelKey === question.anatomy3d?.modelKey);
    return paired ? { ...question, media: paired.media, anatomy: paired.anatomy } : question;
  }, [question, image]);
  const media = displayQuestion.media?.find((item) => item.id === displayQuestion.anatomy?.imageId) ?? displayQuestion.media?.[0];
  const baseModelKey = question.anatomy3d?.modelKey ?? question.anatomy?.modelKey ?? image?.moduleKey ?? (media ? existingFigureModels[media.path] : undefined);
  const modelKey = revealed && selection ? selection.modelKey : baseModelKey;
  const joined = image?.examId === "term2-cvs" && (modelKey === "heart" || modelKey === "mediastinum");
  const displayModelKey = joined ? "thorax-image-composite" : modelKey;
  const manifest = useMemo(() => displayModelKey ? getAnatomyModule(displayModelKey)?.manifest : undefined, [displayModelKey]);
  const displayedId = (owner: string, id: string) => joined ? compositeStructureId(owner, id) : id;
  const target = manifest?.structures.find((item) => question.anatomy3d && item.id === displayedId(question.anatomy3d.modelKey, question.anatomy3d.structureId));
  const selected = manifest?.structures.find((item) => revealed && selection && item.id === displayedId(selection.modelKey, selection.id)) ?? target;
  const contextIds = useMemo(() => image ? [...new Set(image.regions.filter((region) => joined ? ["heart", "mediastinum"].includes(region.modelKey ?? image.moduleKey ?? "") : (region.modelKey ?? image.moduleKey) === modelKey).flatMap((region) => [...(region.structureId ? [region.structureId] : []), ...(region.contextStructureIds ?? [])].map((id) => joined ? compositeStructureId(region.modelKey ?? image.moduleKey ?? "", id) : id)))]
    : question.anatomy3d?.contextStructureIds ?? question.anatomy?.contextStructureIds ?? [], [image, modelKey, question, joined]);
  const locating = isLocationQuestion(question) && !revealed;
  const mappedLocations = image?.regions.flatMap(region => region.structureId ? [{regionId:region.id,id:displayedId(region.modelKey??image.moduleKey??'',region.structureId),label:region.label}] : []) ?? [];
  const uniqueLocations = mappedLocations.filter(item=>mappedLocations.filter(other=>other.id===item.id).length===1 && manifest?.structures.some(s=>s.id===item.id));
  const canLocate3D = Boolean(target && uniqueLocations.some(item=>item.id===target.id && item.regionId===question.anatomy?.targetRegionId));
  const effectiveView = locating && media && !canLocate3D ? "2d" : !media ? "3d" : !manifest ? "2d" : view;
  const visibleControls = controlsOpen || settingsOpen;
  const hiddenIds = useMemo(() => new Set((manifest?.structures ?? []).filter((item) => (
    item.id !== selected?.id && (hiddenSystems.includes(systemForStructure(item)) || (figureOnly && contextIds.length > 0 && !contextIds.includes(item.id)))
  )).map((item) => item.id)), [manifest, selected, hiddenSystems, figureOnly, contextIds]);
  const viewPose = useMemo(() => sourceView(image?.view), [image]);
  // Full-length venae cavae belong in the scene, but their abdominal/neck extent must not
  // shrink a heart-surface question into a distant speck. Frame the source's cardiac parts.
  const framingIds = joined && baseModelKey === "heart" && contextIds.some((id) => id.startsWith("heart-joined-"))
    ? contextIds.filter((id) => id.startsWith("heart-joined-")) : contextIds;
  const secondary = (content: React.ReactNode) => testLayout ? settingsContainer && createPortal(content, settingsContainer) : content;

  if (!question.anatomy && question.anatomy3d?.responseMode === "locate") return <ModelLocationQuestion key={question.id} question={question} revealed={revealed} savedRegionId={savedRegionId} onSubmit={onLocationSubmit} />;

  return <section className="anatomy-paired-media" aria-label="Anatomy question visual">
    <div className="anatomy-view-bar">
      <div role="group" aria-label="View this question">
        {media && <button type="button" aria-pressed={effectiveView === "2d"} onClick={() => setView("2d")}>2D Image</button>}
        {manifest && <button type="button" disabled={locating && !canLocate3D} title={locating && !canLocate3D ? "This callout has no unambiguous separate 3D target. Use the source image; context unlocks with feedback." : undefined} aria-pressed={effectiveView === "3d"} onClick={() => setView("3d")}>{question.anatomy3d ? "3D Model" : "3D Context"}{locating && !canLocate3D ? " · after feedback" : ""}</button>}
      </div>
      {effectiveView === "3d" && !testLayout && <button type="button" className="anatomy-view-settings" aria-expanded={controlsOpen} onClick={() => setControlsOpen(!controlsOpen)}>View settings</button>}
    </div>
    {effectiveView === "2d" && media && <AnatomyImage key={question.id + ":image"} question={displayQuestion} media={media} src={imageSrc ?? "/study/" + media.path} revealed={revealed} compact testLayout={testLayout} detailsContainer={settingsContainer} onLocationSubmit={onLocationSubmit} locationAnswered={locationAnswered} savedRegionId={savedRegionId} />}
    {effectiveView === "3d" && manifest && locating && canLocate3D && <ModelLocationQuestion key={question.id+':paired-locate'}
      question={{...question,anatomy:undefined,media:undefined,anatomy3d:{modelKey:manifest.modelKey,structureId:target!.id,responseMode:'locate',selectableStructures:uniqueLocations.map(({id,label})=>({id,label}))}}}
      revealed={false} savedRegionId={uniqueLocations.find(item=>item.regionId===savedRegionId)?.id}
      onSubmit={id=>{const region=uniqueLocations.find(item=>item.id===id);if(region)onLocationSubmit?.(region.regionId);}} />}
    {effectiveView === "3d" && manifest && !(locating && canLocate3D) && <>
      {visibleControls && secondary(<div className="anatomy-view-options">
        <div role="group" aria-label="Anatomy layers">{systemsInManifest(manifest).map((system) => <button key={system.id} type="button" aria-pressed={!hiddenSystems.includes(system.id)} onClick={() => setHiddenSystems((current) => current.includes(system.id) ? current.filter((id) => id !== system.id) : [...current, system.id])}><i className={"anatomy3d-layer-dot " + system.id} />{system.label}</button>)}</div>
        {contextIds.length > 0 && <label><input type="checkbox" checked={figureOnly} onChange={(event) => setFigureOnly(event.target.checked)} /> Focus on structures from this figure</label>}
        {revealed && <label><input type="checkbox" checked={allLabels} onChange={(event) => setAllLabels(event.target.checked)} /> Show all 3D labels</label>}
      </div>)}
      <AnatomyViewer key={displayModelKey} modelKey={manifest.modelKey} focusStructureId={selected?.id} pickEnabled={revealed} showLabels={revealed}
        preferredView={viewPose} framingStructureIds={framingIds} hiddenStructureIds={hiddenIds} labelMode={allLabels ? "all" : "active"}
        onPick={(id) => { const [owner, part] = id.split("-joined-"); setSelection(joined && part ? { modelKey: owner, id: part } : { modelKey: manifest.modelKey, id }); }} controlsVisible={visibleControls} className="anatomy-exam-viewer" />
      {!question.anatomy3d && <p className="anatomy-fidelity">Regional context only — this question has no separate 3D target. Answer from the 2D figure.</p>}
      {modelKey === "upper-limb" && media && <p className="anatomy-fidelity">3D shows the right upper limb. Some source figures show the left; compare homologous structures, not screen position.</p>}
      {target?.schematic && <p className="anatomy-fidelity">Highlighted structure is schematic, not a segmented scan.</p>}
      {revealed && secondary(<div className="anatomy-paired-description" aria-live="polite"><b>{selected?.label ?? "Figure anatomy"}</b><p>{selected?.description}</p>
        {image && <div aria-label="Structures from this figure">{image.regions.map((region) => {
          const owner = getAnatomyModule(region.modelKey ?? image.moduleKey ?? "")?.manifest;
          const structure = owner?.structures.find((item) => item.id === region.structureId);
          return structure && owner ? <button key={region.id} type="button" aria-pressed={selected?.id === displayedId(owner.modelKey, structure.id)} onClick={() => setSelection({ modelKey: owner.modelKey, id: structure.id })}>{region.label}{structure.schematic ? " · schematic" : ""}</button>
            : region.contextStructureIds?.length && owner ? <button key={region.id} type="button" onClick={() => setSelection({ modelKey: owner.modelKey, id: region.contextStructureIds![0] })}>{region.label} · related 3D tree, not the exact callout</button>
            : <span key={region.id} className="anatomy-context-only" title={region.description}>{region.label} · 2D only</span>;
        })}</div>}
      </div>)}
    </>}
  </section>;
}
