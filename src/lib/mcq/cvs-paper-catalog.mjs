import {matchesCvsPaperScope} from './cvs-scope.mjs';

export function cvsTopicMapReady(topicMap) {
  return Boolean(topicMap && Array.isArray(topicMap.subjects) && Array.isArray(topicMap.topics)
    && topicMap.questions && typeof topicMap.questions === 'object' && !Array.isArray(topicMap.questions)
    && Object.keys(topicMap.questions).length);
}

/** Keep every scoped source item, including questions without a usable answer. */
export function scopeCvsDownloadCollection(collection, scope, topicMap) {
  if(scope === 'all') return collection;
  if(!cvsTopicMapReady(topicMap)) throw new Error('CVS topic mapping must load before filtering papers.');
  if(!Array.isArray(collection.questionIds) || collection.questionIds.length !== collection.sourceRecordCount) {
    throw new Error('The CVS paper catalog is missing source question IDs. Reload to update it.');
  }
  const questionIds = collection.questionIds.filter(id => matchesCvsPaperScope(topicMap.questions[id], scope));
  const selected = new Set(questionIds);
  const gradedQuestionIds = collection.gradedQuestionIds.filter(id => selected.has(id));
  return {...collection, cvsScope:scope, questionIds, gradedQuestionIds,
    title:`${collection.title} · ${scope === 'physio' ? 'Physio' : 'Non-Physio'}`,
    sourceRecordCount:questionIds.length, gradedQuestionCount:gradedQuestionIds.length,
    ungradedCount:questionIds.length-gradedQuestionIds.length};
}
