"use client";

import { useMemo, useState } from "react";
import type { MCQQuestion } from "@/src/lib/mcq/types";
import { getAnatomyModule } from "@/src/lib/anatomy3d/registry";
import AnatomyViewer from "./AnatomyViewer";

export function AnatomyQuestion({ question, revealed }: { question: MCQQuestion; revealed: boolean }) {
  const registration = question.anatomy3d ? getAnatomyModule(question.anatomy3d.modelKey) : undefined;
  const manifest = registration?.manifest;
  const target = manifest?.structures.find((structure) => structure.id === question.anatomy3d?.structureId);
  const [selection, setSelection] = useState<{ questionId: string; structureId: string } | null>(null);
  const selectedId = selection?.questionId === question.id ? selection.structureId : null;
  const selected = useMemo(
    () => manifest?.structures.find((structure) => structure.id === (revealed ? selectedId : null)) ?? target,
    [manifest, revealed, selectedId, target],
  );
  if (!question.anatomy3d || !manifest || !target) return <p role="alert">This 3D question could not load its verified model target.</p>;
  return <figure className="question-anatomy3d">
    <div className="question-anatomy3d-head"><span>Interactive 3D anatomy</span><small>{manifest.title} · rotate, zoom and section before answering</small></div>
    <AnatomyViewer
      modelKey={question.anatomy3d.modelKey}
      focusStructureId={selected?.id ?? target.id}
      pickEnabled={revealed}
      showLabels={revealed}
      onPick={(id) => setSelection({ questionId: question.id, structureId: id })}
      className="question-anatomy3d-viewer"
    />
    <figcaption>{revealed
      ? <><b>{selected?.label}</b><span>{selected?.description}</span><small>Tap any visible structure to explore it. The originally highlighted answer was {target.label}.</small></>
      : <><b>Which structure is highlighted?</b><span>Labels and free exploration unlock after you answer; closed-book test mode waits until grading.</span></>}
    </figcaption>
  </figure>;
}

export default AnatomyQuestion;
