export const isLocationQuestion = (question) => question.anatomy?.responseMode === 'locate' || question.anatomy3d?.responseMode === 'locate';
export const locationLabel = (question, regionId) => question.anatomy ? question.media?.find(media => media.id === question.anatomy?.imageId)?.annotations?.find(region => region.id === regionId)?.label : question.anatomy3d?.selectableStructures?.find(region => region.id === regionId)?.label;

// A restored location is the source of truth, never its separately saved score.
export function restoredLocationResponse(question, regionId) {
  if (!isLocationQuestion(question) || !locationLabel(question, regionId)) return undefined;
  return { selectedRegionId: regionId, selectedOptionId: locationOptionId(question, regionId) };
}

// Also protects resumed legacy sessions that may contain sibling targets.
export function canRevealAnatomyFigure(question, questions, hasAnswered) {
  return !question.anatomy || questions.every(item => item.id === question.id || item.anatomy?.imageId !== question.anatomy.imageId || hasAnswered(item));
}

// Hotspots are authored boxes, not segmentation masks. With source callouts the
// selectable area is the masked label/leader-line callout, not the entire organ.
export function regionAtPoint(regions, x, y) {
  if (![x, y].every(Number.isFinite) || x < 0 || y < 0 || x > 1 || y > 1) return undefined;
  const hits = regions.filter(r => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
  // Resolve overlap by the nearest center, independently of the correct target.
  return hits.sort((a,b) => Math.hypot(x-a.x-a.width/2,y-a.y-a.height/2) - Math.hypot(x-b.x-b.width/2,y-b.y-b.height/2))[0]?.id;
}

// Fixed outcome IDs reuse the validated session scoring/persistence contract.
// They are never rendered as selectable answer choices in location questions.
export function locationOptionId(question, regionId) {
  if (!isLocationQuestion(question)) return undefined;
  const regions = question.anatomy ? question.media?.find(m => m.id === question.anatomy.imageId)?.annotations ?? [] : question.anatomy3d?.selectableStructures ?? [];
  if (!regionId || !regions.some(r => r.id === regionId)) return 'C';
  return regionId === (question.anatomy?.targetRegionId ?? question.anatomy3d?.structureId) ? 'A' : 'B';
}

export function buildModelLocationQuestions(questions, manifests) {
  const seen = new Set();
  return questions.flatMap(question => {
    if (question.anatomy || !question.anatomy3d || isLocationQuestion(question)) return [];
    const {modelKey,structureId} = question.anatomy3d;
    const key = modelKey+':'+structureId;
    const manifest = manifests.find(item => item.modelKey === modelKey);
    const target = manifest?.structures.find(item=>item.id===structureId);
    if (!target || seen.has(key)) return [];
    seen.add(key);
    return [{...question,id:'locate3d-'+question.id,prompt:`Find ${target.label}. Click the structure in the 3D model, then submit your location.`,
      anatomy3d:{...question.anatomy3d,responseMode:'locate',selectableStructures:manifest.structures.map(({id,label})=>({id,label}))},
      options:[{id:'A',text:target.label},{id:'B',text:'A different structure'},{id:'C',text:'No mapped structure selected'},{id:'D',text:'Location not identified'}],correctOptionId:'A',
      explanation:target.description,distractorExplanations:{B:'Compare the selected structure with the correct target after feedback.',C:'Click a visible, mapped structure before submitting.',D:'The target was not located.'},
      learningObjective:`Locate ${target.label} in the regional 3D model.`,tags:[...question.tags,'anatomy-location-practice'],
    }];
  });
}

export function buildLocationQuestions(questions) {
  const seen = new Set();
  return questions.flatMap(question => {
    if (question.kind !== 'dynamic_anatomy' || isLocationQuestion(question)) return [];
    const key = `${question.anatomy.imageId}:${question.anatomy.targetRegionId}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const target = question.media?.find(m => m.id === question.anatomy.imageId)?.annotations?.find(r => r.id === question.anatomy.targetRegionId);
    if (!target) return [];
    const callout = question.anatomy.markerMode === 'label';
    return [{...question, id:`locate-${question.id.replace(/-v\d+$/, '')}`, revision:1,
      prompt: callout ? `Find ${target.label}. Select its masked callout on the image, following the leader line to the structure, then submit your location.` : `Find ${target.label}. Select its annotated area on the image, then submit your location.`,
      anatomy:{...question.anatomy,variant:1,responseMode:'locate'},
      options:[{id:'A',text:target.label},{id:'B',text:'A different annotated location'},{id:'C',text:'Outside the annotated locations'},{id:'D',text:'Location not identified'}],
      correctOptionId:'A',acceptedFreeText:[],
      explanation:`The correct location identifies ${target.label}. ${target.description}`,
      distractorExplanations:{B:'The selected location is not the requested target. Compare your selection with the revealed target and follow the full leader line where present.',C:'The selected point is outside the supported annotated areas. This image uses authored hotspots, not whole-organ pixel segmentation.',D:'The requested location was not identified. Find the revealed target, then explain its relation to adjacent anatomy.'},
      learningObjective:`Locate ${target.label} from its name, rather than naming an already highlighted structure.`,
      tags:[...question.tags,'anatomy-location-practice'],qualityFlags:[...question.qualityFlags,'authored-hotspots-not-pixel-segmentation']
    }];
  });
}
