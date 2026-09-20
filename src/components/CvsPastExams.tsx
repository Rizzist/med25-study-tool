"use client";
/* eslint-disable @next/next/no-img-element -- original local exam figures */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    CVS_PAPER_STORAGE_KEY, emptyPaperProgress, readPaperProgress, newPaperAttempt,
    restorePaperAttempt, gradePaper, answerPaperQuestion, questionFeedback, gradePaperBreakdown,
    type Paper, type PaperProgress, type PaperAttempt, type PaperResult,
    type PaperTopicMap, type PaperFeedbackMode,
} from '@/src/lib/mcq/cvs-paper-state.mjs';
import { CvsWeaknessReport } from './CvsWeaknessReport';
import {CourseReviewReport} from './CourseReview';
import {PastPaperCard} from './PastPaperCard';
import {PaperDownloads,type DownloadCollection} from './PaperDownloads';
import {StudyIcon} from './StudyIcon';
import {cachedJson} from '@/src/lib/mcq/client-cache';
import { answerResolution, applyAnswerOverlay, combinedPaperId, createCombinedPaper, type AnswerOverlay } from '@/src/lib/mcq/cvs-paper-enhancements.mjs';
import styles from './CvsPastExams.module.css';
import reviewedCounts from '../../public/study/cvs-past-papers/ai-summary.json';
import coreData from '../../public/study/cvs-past-papers/core-exam.json';
import {coreExamId, createCoreExam, type CoreExamManifest} from '@/src/lib/mcq/cvs-core-exam.mjs';
import nonCoreData from '../../public/study/cvs-past-papers/noncore-anatomy.json';
import {NON_CORE_ANATOMY_ID, createNonCoreAnatomyExam, type NonCoreAnatomyManifest} from '@/src/lib/mcq/cvs-noncore-anatomy.mjs';

const answerCounts: Record<string, {proposed:number;unresolved:number;corrections:number}> = reviewedCounts;
const coreManifest: CoreExamManifest = coreData;
const nonCoreManifest: NonCoreAnatomyManifest = nonCoreData;
const nonCoreTopicCounts = [...new Set(nonCoreManifest.questions.map(row => row.topicId))].map(id => ({
    id, title: nonCoreManifest.questions.find(row => row.topicId === id)!.topicTitle,
    count: nonCoreManifest.questions.filter(row => row.topicId === id).length,
}));
const coreAnatomyCount = coreManifest.questions.filter(row => row.subjectId === 'anatomy').length;
const coreTopics = [...new Map(coreManifest.questions.map(row => [row.topicId, row])).values()]
    .sort((a,b) => b.topicPaperCount-a.topicPaperCount);

type Entry = { id: string; title: string; note: string; count: number; keyed: number; file: string; fingerprint: string; category: string };
type Index = { papers: Entry[]; referenceNote: string };

export function CvsPastExams({ onSessionActiveChange, downloads }: { onSessionActiveChange?: (active: boolean) => void; downloads?: Record<string, DownloadCollection> }) {
    const [catalog, setCatalog] = useState<Index | null>(null);
    const [paper, setPaper] = useState<Paper | null>(null);
    const [topics, setTopics] = useState<PaperTopicMap | null>(null);
    const [progress, setProgress] = useState<PaperProgress>(emptyPaperProgress);
    const [error, setError] = useState('');
    const [storageWarning, setStorageWarning] = useState('');
    const [mappingWarning, setMappingWarning] = useState('');
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [sourceOpen, setSourceOpen] = useState(false);
    const [confirmFinish, setConfirmFinish] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [filter, setFilter] = useState<{ title: string; ids: string[] } | null>(null);
    const [mode, setMode] = useState<PaperFeedbackMode>('instant');
    const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
    const [answerWarning, setAnswerWarning] = useState('');
    const overlayRequest = useRef<Promise<AnswerOverlay | null> | null>(null);
    const request = useRef(0);
    const progressRef = useRef(progress);
    const questionHeading = useRef<HTMLHeadingElement>(null);
    const sessionHeader = useRef<HTMLElement>(null);
    const active = Boolean(paper);
    useEffect(() => {
        onSessionActiveChange?.(active);
        return () => onSessionActiveChange?.(false);
    }, [active, onSessionActiveChange]);
    useEffect(() => {
        if (active) sessionHeader.current?.scrollIntoView({ block: 'start' });
    }, [active, reportOpen]);

    useEffect(() => {
        let cancelled = false;
        try {
            const saved = readPaperProgress(localStorage.getItem(CVS_PAPER_STORAGE_KEY));
            progressRef.current = saved;
            setProgress(saved);
        } catch { setStorageWarning('Storage is unavailable. Answers remain in this tab only.'); }
        setReady(true);
        cachedJson<Index>('/study/cvs-past-papers/index.json').then(data => { if (!cancelled) setCatalog(data); })
          .catch(e => { if (!cancelled) setError(e.message); });
        cachedJson<PaperTopicMap>('/study/cvs-past-papers/topic-map.json').then(data => { if (!cancelled) setTopics(data); })
          .catch(() => { if (!cancelled) setMappingWarning('Topic mapping unavailable. Your answers are still saved; reopen the paper later for section results.'); });
        return () => { cancelled = true; request.current++; };
    }, []);

    function save(next: PaperProgress) {
        progressRef.current = next;
        setProgress(next);
        try {
            localStorage.setItem(CVS_PAPER_STORAGE_KEY, JSON.stringify(next));
            setStorageWarning('');
        } catch { setStorageWarning('Answers are kept in this tab, but browser storage could not save them.'); }
    }
    function updateAttempt(next: PaperAttempt) {
        const current = progressRef.current;
        save({ ...current, attempts: { ...current.attempts, [next.paperId]: next } });
    }
    const attempt = paper ? progress.attempts[paper.id] : undefined;
    const q = paper && attempt ? paper.questions[attempt.index] : undefined;
    const finished = Boolean(attempt?.completedAt);
    const breakdown = useMemo(() => paper && attempt ? gradePaperBreakdown(paper, attempt, topics) : null, [paper, attempt, topics]);

    async function loadPaper(entry: Entry): Promise<Paper> {
        const original = await cachedJson<Paper>(entry.file+'?v='+encodeURIComponent(entry.fingerprint));
        if (!overlayRequest.current) overlayRequest.current = cachedJson<AnswerOverlay>('/study/cvs-past-papers/ai-answers.json',true).then(data=>{setAnswerWarning('');return data;}).catch(() => { setAnswerWarning('AI answer review could not load. Supplied keys still work; missing keys remain ungraded. Exit and reopen to retry.'); overlayRequest.current = null; return null; });
        const overlay = await overlayRequest.current;
        // Never overwrite an attempt based on corrected choices with an unavailable overlay.
        if (!overlay && Object.values(progressRef.current.attempts).some(attempt => original.questions.some(q => attempt.correctionRevisions?.[q.id]))) {
            throw new Error('The reviewed answer layer is unavailable. Your corrected-choice answers are safe; retry opening the paper.');
        }
        return applyAnswerOverlay(original, overlay);
    }

    function enter(p: Paper, restart: boolean) {
        if (!p.questions.length) throw new Error('This source has no exam-ready items. Read its transcript in the archive.');
        const previous = progressRef.current.attempts[p.id];
        let saved = restart ? null : restorePaperAttempt(previous, p);
        // Updating a curated set must not discard answers to retained questions.
        if (!restart && !saved && previous && (p.id.startsWith('cvs-core-exam:') || p.id === NON_CORE_ANATOMY_ID)) {
            saved = restorePaperAttempt({...previous,fingerprint:p.fingerprint,completedAt:null,index:0},p);
            if (saved) saved.index = Math.max(0,p.questions.findIndex(q => !saved!.answers[q.id]?.trim()));
        }
        const next = saved ?? newPaperAttempt(p, undefined, mode);
        updateAttempt(next);
        setPaper(p); setReportOpen(Boolean(next.completedAt)); setFilter(null);
        setSourceOpen(false); setConfirmFinish(false);
    }

    async function open(entry: Entry, restart = false) {
        if (restart && !window.confirm('Start a new attempt? Your latest completed result stays saved.')) return;
        const id = ++request.current;
        setLoading(true); setError('');
        try {
            const p = await loadPaper(entry);
            if (id !== request.current) return;
            enter(p, restart);
        } catch (e) { if (id === request.current) setError(e instanceof Error ? e.message : 'Could not open paper.'); }
        finally { if (id === request.current) setLoading(false); }
    }
    async function openCombined(restart = false, paperIds = selectedPapers) {
        if (!catalog || !paperIds.length) return;
        if (restart && !window.confirm('Start a new combined attempt? The latest completed result stays saved.')) return;
        const id = ++request.current;
        setLoading(true); setError('');
        try {
            const entries = catalog.papers.filter(entry => paperIds.includes(entry.id));
            if (entries.length !== new Set(paperIds).size) throw new Error('A selected paper is no longer available. Choose the papers again.');
            const papers = await Promise.all(entries.map(loadPaper));
            if (id !== request.current) return;
            enter(createCombinedPaper(papers), restart);
        } catch (e) { if (id === request.current) setError(e instanceof Error ? e.message : 'Could not combine papers.'); }
        finally { if (id === request.current) setLoading(false); }
    }
    async function openCore(scope: 'all' | 'anatomy', restart = false) {
        if (!catalog) return;
        if (restart && !window.confirm('Start a new Core Exam attempt? Your latest completed result stays saved.')) return;
        const id = ++request.current;
        setLoading(true); setError('');
        try {
            const rows = coreManifest.questions.filter(row => scope !== 'anatomy' || row.subjectId === 'anatomy');
            const ids = new Set(rows.map(row => row.paperId));
            const sources = await Promise.all(catalog.papers.filter(entry => ids.has(entry.id)).map(loadPaper));
            if (id !== request.current) return;
            enter(createCoreExam(coreManifest, sources, scope), restart);
        } catch (e) { if (id === request.current) setError(e instanceof Error ? e.message : 'Could not open Core Exam.'); }
        finally { if (id === request.current) setLoading(false); }
    }
    async function openNonCoreAnatomy(restart = false) {
        if (!catalog) return;
        if (restart && !window.confirm('Start a new Non-core Anatomy attempt? Your latest completed result stays saved.')) return;
        const id = ++request.current;
        setLoading(true); setError('');
        try {
            const ids = new Set(nonCoreManifest.questions.map(row => row.paperId));
            const sources = await Promise.all(catalog.papers.filter(entry => ids.has(entry.id)).map(loadPaper));
            if (id !== request.current) return;
            enter(createNonCoreAnatomyExam(nonCoreManifest, sources, coreManifest), restart);
        } catch (e) { if (id === request.current) setError(e instanceof Error ? e.message : 'Could not open Non-core Anatomy.'); }
        finally { if (id === request.current) setLoading(false); }
    }
    function submit(value: string) {
        if (!paper || !q) return;
        const current = progressRef.current.attempts[paper.id];
        if (current) updateAttempt(answerPaperQuestion(paper, current, q.id, value));
    }
    function finish() {
        if (!paper) return;
        const current = progressRef.current;
        const saved = current.attempts[paper.id];
        if (!saved || saved.completedAt) return;
        const now = new Date().toISOString();
        const next = { ...saved, completedAt: now };
        const result = { ...gradePaper(paper, next, now), sectionStats: gradePaperBreakdown(paper, next, topics) };
        save({ ...current, attempts: { ...current.attempts, [paper.id]: next }, latest: { ...current.latest, [paper.id]: result } });
        setConfirmFinish(false); setSourceOpen(false); setReportOpen(true); setFilter(null);
    }
    function manual(value: string) {
        if (!paper || !q) return;
        const current = progressRef.current;
        const saved = current.attempts[paper.id];
        if (!saved?.answers[q.id]) return;
        const next = { ...saved, manual: { ...saved.manual, [q.id]: value } };
        const latest = saved.completedAt ? {
            ...current.latest,
            [paper.id]: { ...gradePaper(paper, next, saved.completedAt), sectionStats: gradePaperBreakdown(paper, next, topics) },
        } : current.latest;
        save({ ...current, attempts: { ...current.attempts, [paper.id]: next }, latest });
    }
    function move(index: number) {
        if (!paper) return;
        const saved = progressRef.current.attempts[paper.id];
        if (!saved) return;
        updateAttempt({ ...saved, index: Math.max(0, Math.min(index, paper.questions.length - 1)) });
        setSourceOpen(false); setConfirmFinish(false);
        requestAnimationFrame(() => questionHeading.current?.focus());
    }
    function review(ids: string[], title: string) {
        if (!paper || !ids.length) return;
        setFilter({ title, ids }); setReportOpen(false);
        move(paper.questions.findIndex(item => item.id === ids[0]));
    }

    if (error && !catalog) return <section className={styles.root}><p role="alert">{error}</p><button onClick={() => window.location.reload()}>Retry</button></section>;
    if (!catalog || !ready) return <p role="status">Loading your CVS papers…</p>;
    if (!paper || !attempt || !q) return <div className="cvs-hub" aria-label="CVS past exams">
        {storageWarning && <p role="alert" className="mcq-alert">{storageWarning}</p>}{error && <p role="alert" className="mcq-alert error">{error}</p>}
        {loading && <p role="status" className="mcq-loading">Opening your past paper…</p>}
        <div className="pill-row hub-tools">
            <div className="seg" role="group" aria-label="Feedback mode"><button type="button" aria-pressed={mode === 'instant'} onClick={() => setMode('instant')}>Learn · instant feedback</button><button type="button" aria-pressed={mode === 'deferred'} onClick={() => setMode('deferred')}>Exam · mark at the end</button></div>
            <details className="hub-note"><summary>About the answers</summary><p>Slightly stronger colors distinguish reference-reviewed answers from supplied keys. Review provenance and references are available with each answer. These are study answers, not certified university keys. Feedback mode applies to new attempts.</p></details>
        </div>
        <section className="paper-combiner" aria-label="Combine past papers">
            <div className="section-head compact"><h3><StudyIcon name="layers"/>Combine papers</h3><p>One continuous session with a combined subject and review-section report. Individual-paper attempts stay separate; repeated questions from different papers are retained.</p><div className="pill-row"><button type="button" className="pill small" disabled={loading} onClick={() => setSelectedPapers(catalog.papers.map(p => p.id))}>Select all</button><button type="button" className="pill small" disabled={loading || !selectedPapers.length} onClick={() => setSelectedPapers([])}>Clear</button></div></div>
            <div className="paper-selection">{catalog.papers.map(entry => <label key={entry.id}>
                <input type="checkbox" disabled={loading} checked={selectedPapers.includes(entry.id)} onChange={e => setSelectedPapers(ids => e.target.checked ? [...ids, entry.id] : ids.filter(id => id !== entry.id))} />
                {entry.title}<small>{entry.count}</small>
            </label>)}</div>
            <div className="paper-combiner-footer"><span>{selectedPapers.length} papers · {catalog.papers.filter(p => selectedPapers.includes(p.id)).reduce((n, p) => n + p.count, 0)} questions</span><div className="pill-row"><button type="button" className="primary" disabled={loading || !selectedPapers.length} onClick={() => void openCombined()}>{progress.attempts[combinedPaperId(selectedPapers)] ? 'Resume combined · results' : 'Start combined session'}<StudyIcon name="arrow"/></button>{progress.attempts[combinedPaperId(selectedPapers)] && <button type="button" className="pill" disabled={loading} onClick={() => void openCombined(true)}>New combined attempt</button>}</div></div>
            {Object.values(progress.attempts).some(a => a.sourcePaperIds?.length) && <details className="paper-saved-combinations"><summary>Saved combined sessions</summary>
                {Object.values(progress.attempts).filter(a => a.sourcePaperIds?.length).map(saved => <article key={saved.paperId}>
                    <b>{saved.sourcePaperIds!.map(id => catalog.papers.find(p => p.id === id)?.title ?? id).join(' + ')}</b>
                    {progress.latest[saved.paperId] ? <Result result={progress.latest[saved.paperId]} /> : <p>Ready to resume</p>}
                    <button type="button" className="pill small" disabled={loading} onClick={() => { setSelectedPapers(saved.sourcePaperIds!); void openCombined(false, saved.sourcePaperIds); }}>{saved.completedAt ? 'Results & review' : 'Resume'}</button>
                </article>)}
            </details>}
        </section>
        <div className="paper-grid">
            <PastPaperCard featured badge="★ Start here" label="Core exam · repeated PYQs first" title="Core Exam" note={`${coreManifest.methodology} ${coreManifest.limitation}`}>
                <p className="paper-counts">{coreManifest.subjects.map((subject, i) => <span key={subject.id}>{i > 0 && <i>·</i>}<b>{subject.count}</b> {subject.title}</span>)}</p>
                <p className="paper-lead">Repeated concepts first: {coreManifest.questions.length} selected questions, {coreManifest.repeatedPatternCount} repeated patterns, one representative per pattern. Priority, not a prediction.</p>
                {(['all','anatomy'] as const).filter(scope => progress.latest[coreExamId(scope)]).map(scope => <Result key={scope} result={progress.latest[coreExamId(scope)]} stale={progress.latest[coreExamId(scope)].total !== (scope === 'all' ? coreManifest.questions.length : coreAnatomyCount)} />)}
                <div className="paper-card-actions">{(['all','anatomy'] as const).map(scope => {
                    const saved = progress.attempts[coreExamId(scope)];
                    return <button key={scope} type="button" className={scope === 'all' ? 'primary' : 'pill'} disabled={loading} onClick={() => void openCore(scope)}>
                        {saved ? saved.completedAt ? 'Results' : 'Resume' : 'Start'} · {scope === 'all' ? `Full core · ${coreManifest.questions.length}` : `Anatomy · ${coreAnatomyCount}`}
                    </button>;
                })}{(['all','anatomy'] as const).filter(scope => progress.attempts[coreExamId(scope)]).map(scope => <button key={scope + '-new'} type="button" className="pill" disabled={loading} onClick={() => void openCore(scope, true)}>New {scope === 'all' ? 'full' : 'anatomy'} attempt</button>)}</div>
                <details className="paper-evidence"><summary>Why these questions?</summary>
                    <p>{coreManifest.methodology}</p>
                    <p>Repeated questions appear first. After answering, open “Repeated-question sources” to see their matches. The list shows <b>topic coverage</b>, not identical-question repeats or predicted probabilities.</p>
                    <div className="topic-list">{coreTopics.map(row => <div key={row.topicId}><span>{row.topicTitle}</span><b>{row.topicPaperCount}/{coreManifest.evidencePaperIds.length} papers</b></div>)}</div>
                    <p>{coreManifest.limitation}</p>
                </details>
            </PastPaperCard>
            <PastPaperCard featured badge="02 · Beyond core" label="Non-core anatomy · original PYQs" title="Non-core Anatomy" note={`${nonCoreManifest.methodology} ${nonCoreManifest.limitation}`}>
                <p className="paper-counts"><b>{nonCoreManifest.questions.length}</b> distinct questions<i>·</i>{nonCoreManifest.questions.filter(row => row.hasImage).length} image spotters</p>
                <p className="paper-lead">The unusual details, exceptions and one-offs. Core questions and known repeat variants are excluded; duplicate copies are collapsed.</p>
                {progress.latest[NON_CORE_ANATOMY_ID] ? <Result result={progress.latest[NON_CORE_ANATOMY_ID]} stale={progress.latest[NON_CORE_ANATOMY_ID].total !== nonCoreManifest.questions.length} /> : <p className="paper-saved-result">Not attempted yet</p>}
                <div className="paper-card-actions">
                    <button type="button" className="primary" disabled={loading} onClick={() => void openNonCoreAnatomy()}>{progress.attempts[NON_CORE_ANATOMY_ID] ? progress.attempts[NON_CORE_ANATOMY_ID].completedAt ? 'Results & review' : 'Resume' : 'Start'} · {nonCoreManifest.questions.length}</button>
                    {progress.attempts[NON_CORE_ANATOMY_ID] && <button type="button" className="pill" disabled={loading} onClick={() => void openNonCoreAnatomy(true)}>New attempt</button>}
                </div>
                <details className="paper-evidence"><summary>Coverage &amp; excluded items</summary>
                    <p>{nonCoreManifest.candidateCount} anatomy source questions accounted for: {nonCoreManifest.excludedCore.length} Core overlaps, {nonCoreManifest.duplicates.length} additional duplicate copies, {nonCoreManifest.questions.length} in this test, and {nonCoreManifest.withheld.length} held for clarification.</p>
                    <div className="topic-list">{nonCoreTopicCounts.map(topic => <div key={topic.id}><span>{topic.title}</span><b>{topic.count} questions</b></div>)}</div>
                    <p>{nonCoreManifest.methodology}</p><p>{nonCoreManifest.limitation}</p>
                    <details><summary>{nonCoreManifest.withheld.length} unresolved items · original sources, not scored</summary>
                        <ul className={styles.heldItems}>{nonCoreManifest.withheld.map(item => <li key={item.questionId}>
                            <a href={item.sourcePage} target="_blank" rel="noreferrer">{catalog.papers.find(entry => entry.id === item.paperId)?.title ?? item.paperId} · Q{item.questionId.split('-q').pop()}</a>
                            <p>{item.prompt}</p><small>{item.reason}</small>
                        </li>)}</ul>
                    </details>
                </details>
            </PastPaperCard>
            {catalog.papers.map(entry => {
                const result = progress.latest[entry.id], saved = progress.attempts[entry.id];
                const same = saved?.fingerprint === entry.fingerprint;
                return <PastPaperCard key={entry.id} title={entry.title} label={entry.category} note={entry.note}>
                    <p className="paper-counts"><b>{entry.count}</b> questions<i>·</i><b>{entry.keyed + (answerCounts[entry.id]?.proposed ?? 0)}</b> with answers{answerCounts[entry.id]?.unresolved ? <><i>·</i>{answerCounts[entry.id].unresolved} unresolved</> : null}</p>
                    {result ? <Result result={result} stale={result.fingerprint !== entry.fingerprint} /> : <p className="paper-saved-result">{same ? `${Object.values(saved.answers).filter(v => v?.trim()).length}/${entry.count} answered · saved on this device` : 'Not attempted yet'}</p>}
                    <div className="paper-card-actions"><button type="button" className="primary" disabled={loading} onClick={() => void open(entry)}>{same ? saved.completedAt ? 'Results & review' : 'Resume paper' : 'Take paper'}</button>
                        {same && <button type="button" className="pill" disabled={loading} onClick={() => void open(entry, true)}>New attempt</button>}</div>
                    {downloads?.[entry.id] && <PaperDownloads item={downloads[entry.id]} courseTitle="CVS" />}
                </PastPaperCard>;
            })}
        </div>
        <p className="mcq-note">{catalog.referenceNote}</p>
    </div>;

    const answered = paper.questions.filter(item => attempt.answers[item.id]?.trim()).length;
    const value = attempt.answers[q.id] ?? '';
    const locked = finished || Boolean(value.trim());
    const reveal = finished || (attempt.feedbackMode !== 'deferred' && Boolean(value.trim()));
    const feedback = questionFeedback(q, value);
    const resolution = answerResolution(q);
    const reliableKey = resolution.key;
    const aiGraded = resolution.kind === 'ai';
    const mapped = topics?.questions[q.id];
    const topic = topics?.topics.find(item => item.id === mapped?.topicId);
    const subject = topics?.subjects.find(item => item.id === mapped?.subjectId);
    const coreEvidence = paper.id.startsWith('cvs-core-exam:') ? coreManifest.questions.find(row => row.questionId === q.id) : null;
    const visibleQuestions = filter ? paper.questions.filter(item => filter.ids.includes(item.id)) : paper.questions;
    const visibleIndex = visibleQuestions.findIndex(item => item.id === q.id);
    const result = finished && attempt.completedAt ? { ...gradePaper(paper, attempt, attempt.completedAt), sectionStats: breakdown ?? undefined } : progress.latest[paper.id];
    return <section data-cvs-paper-session="active" className={styles.root + ' ' + styles.session} aria-label={paper.title + ' exam'}>
        <header ref={sessionHeader} className={styles.examHeader}><div>
            <span className={styles.meta}>{attempt.feedbackMode === 'deferred' ? 'Exam · answers after marking' : 'Learn · instant feedback'} · {answered}/{paper.questions.length} answered</span>
            <h1>{paper.title}</h1></div>
            <button onClick={() => { request.current++; setPaper(null); setFilter(null); }}>Save &amp; exit</button>
        </header>
        {storageWarning && <p role="alert">{storageWarning}</p>}{mappingWarning && <p className={styles.warning}>{mappingWarning}</p>}{answerWarning && <p role="alert" className={styles.warning}>{answerWarning}</p>}
        {reportOpen && finished && breakdown ? <>
            {result && <Result result={result} />}
            <CourseReviewReport reviewOnly exam="term2-cvs" outcomes={paper.questions.map(item=>({questionId:item.id,answered:Boolean(attempt.answers[item.id]?.trim()),correct:questionFeedback(item,attempt.answers[item.id])==='correct'||(!answerResolution(item).key&&attempt.manual[item.id]==='correct'),gradable:Boolean(answerResolution(item).key)||['correct','incorrect'].includes(attempt.manual[item.id]),topic:topics?.questions[item.id]?.topicId}))} onPractice={ids=>review(ids,'Questions to review')}/>
            <details><summary>Subject breakdown &amp; paper review controls</summary><CvsWeaknessReport breakdown={breakdown} topics={topics} onReview={review}/></details>
            <button onClick={() => { setFilter(null); setReportOpen(false); }}>Review all questions</button>
        </> : <>
            <div className={styles.sessionTools}>
                <span>Question {visibleIndex + 1}/{visibleQuestions.length}{filter ? ' · filtered review' : ''}</span>
                {finished && <button onClick={() => setReportOpen(true)}>Section results</button>}
                <details className={styles.jump}><summary>Jump to question</summary>
                    <nav className={styles.navigator} aria-label="Question navigation">{visibleQuestions.map(item => {
                        const index = paper.questions.indexOf(item);
                        return <button key={item.id} aria-current={index === attempt.index ? 'step' : undefined}
                            aria-label={'Question ' + (index + 1) + (item.originPaper ? ' · ' + item.originPaper.title + ' · original ' + item.number : '') + (attempt.answers[item.id] ? ' answered' : '')}
                            className={attempt.answers[item.id] ? styles.answered : ''} onClick={() => move(index)}>{index + 1}</button>;
                    })}</nav>
                </details>
            </div>
            <progress className={styles.progress} value={answered} max={paper.questions.length} aria-label="Questions answered" />
            {filter && <div className={styles.filter}><span>{filter.title}</span><button onClick={() => setFilter(null)}>Show all</button></div>}
            <article className={styles.question}>
                <div className={styles.topic}><span>{subject?.title ?? subject?.label ?? 'CVS'}</span><span>{topic?.title ?? topic?.label ?? 'Source question'}</span></div>
                {coreEvidence && <p className={styles.coreQuestionNote}>{coreEvidence.repeatSourceIds.length >= 2
                    ? `Repeated question pattern · ${coreEvidence.repeatSourceIds.length} source sets (${coreEvidence.questionRepeatPaperIds.length} dated TUMS papers).`
                    : 'Core coverage question.'} Topic appears in {coreEvidence.topicPaperCount}/{coreManifest.evidencePaperIds.length} dated theory papers. Historical counts, not a prediction.</p>}
                <span className={styles.meta}>{q.originPaper && <>{q.originPaper.title} · </>}Original Q{q.number} · source page {q.page}</span>
                <h2 ref={questionHeading} tabIndex={-1} dir="auto">{q.prompt}</h2>
                {q.issues.length > 0 && <details className={styles.sourceWarning}><summary>{q.originalOptions ? 'Source-checked transcription correction' : 'Original source / transcription flags'}{!reliableKey ? ' · ungraded' : ''}</summary><p>{q.issues.join('. ')}</p>{q.originalOptions && <p>Displayed choices were corrected against the source scan. The original file is unchanged. Previous answers to changed choices must be entered again.</p>}</details>}
                {q.media && <img className={styles.figure} src={q.media} alt={'Original figure for question ' + q.number} />}
                <PaperAnswer key={q.id} options={q.options} value={value} locked={locked} correctKey={reveal ? reliableKey : null} aiGraded={aiGraded} onSubmit={submit} />
                {reveal && <section className={styles.feedback + ' ' + (feedback === 'correct' ? aiGraded ? styles.aiCorrect : styles.correct : feedback === 'incorrect' ? aiGraded ? styles.aiIncorrect : styles.incorrect : styles.neutral)} aria-live="polite">
                    <h3>{feedback === 'correct' ? '✓ Correct' : feedback === 'incorrect' ? '✕ Incorrect' : feedback === 'unanswered' ? 'Not answered' : 'Answer saved · unresolved question'}</h3>
                    {reliableKey ? <p><b>Correct answer: {reliableKey}.</b> {q.options['ABCDEF'.indexOf(reliableKey)]}</p> : <p>No defensible reviewed answer is available for automatic marking. This is not counted as a wrong answer.</p>}
                    {q.aiAnswer && <div className={styles.aiExplanation}><p>{q.aiAnswer.explanation}</p>{q.aiAnswer.caveat && <p><b>Qualification:</b> {q.aiAnswer.caveat}</p>}
                        <details><summary>References &amp; provenance</summary><p className={styles.meta}>Reference-based answer · {q.aiAnswer.confidence} confidence · machine-assisted review, not a university answer key</p><ul>{q.aiAnswer.references.map((ref, i) => <li key={i}><a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a></li>)}</ul></details></div>}
                    {q.keyNote && <details><summary>Answer-key provenance</summary><p>{q.keyNote}</p>{!reliableKey && q.providedKey && <p>Unverified source mark: {q.providedKey}</p>}</details>}
                    {coreEvidence && coreEvidence.repeatMatches.length > 1 && <details><summary>Repeated-question sources</summary>
                        <p>Exact or closely worded variants; not necessarily verbatim copies. Each source set counts once. Undated fragments and IUMS tests are not independent dated TUMS exams.</p>
                        <ul>{coreEvidence.repeatMatches.map(match => <li key={match.questionId}><a href={match.sourcePage} target="_blank" rel="noreferrer">{catalog.papers.find(p=>p.id===match.paperId)?.title ?? match.paperId}</a> — {match.prompt}</li>)}</ul>
                    </details>}
                    {!reliableKey && value.trim() && <fieldset className={styles.selfMark}><legend>Optional self-mark · reported separately</legend>
                        {[['correct', 'I was correct'], ['incorrect', 'I was incorrect'], ['ungraded', 'Leave ungraded']].map(([status, label]) =>
                            <button key={status} aria-pressed={(attempt.manual[q.id] ?? 'ungraded') === status} onClick={() => manual(status)}>{label}</button>)}
                    </fieldset>}
                </section>}
                {locked && !finished && <p className={styles.meta}>First answer saved. You can review it; changing it cannot inflate your score.</p>}
                <footer className={styles.actions}>
                    <button disabled={visibleIndex <= 0} onClick={() => move(paper.questions.indexOf(visibleQuestions[visibleIndex - 1]))}>← Previous</button>
                    {visibleIndex < visibleQuestions.length - 1 && <button className="primary" onClick={() => move(paper.questions.indexOf(visibleQuestions[visibleIndex + 1]))}>Next question →</button>}
                    {!finished ? <button onClick={() => setConfirmFinish(true)}>Finish &amp; see weak points</button> : <button onClick={() => setReportOpen(true)}>Back to results</button>}
                </footer>
                {confirmFinish && <section role="alert" className={styles.confirm}><p>{paper.questions.length - answered} questions unanswered. Finish and save your section report? This attempt will be locked for review.</p>
                    <div className={styles.actions}><button className="primary" onClick={finish}>Finish and save result</button><button onClick={() => setConfirmFinish(false)}>Keep answering</button></div></section>}
                <details className={styles.source}><summary>Source &amp; what to review</summary>
                    {topic?.reviewLocator && <p><b>Review notes:</b> {topic.reviewLocator.documentTitle} → {topic.reviewLocator.sectionTitle}</p>}
                    <p>Original pages may contain handwritten answers. Opening them is a study aid, not a closed-book attempt.</p>
                    <div className={styles.actions}><button onClick={() => setSourceOpen(v => !v)}>{sourceOpen ? 'Hide original page' : 'Show original page'}</button>
                        <a href={q.originPaper?.transcriptUrl ?? paper.transcriptUrl} target="_blank" rel="noreferrer">Questions + answer notes (.md)</a><a href={q.originPaper?.sourceUrl ?? paper.sourceUrl} target="_blank" rel="noreferrer">Source document</a></div>
                    {sourceOpen && <img className={styles.scan} src={q.sourcePage} alt={'Source page ' + q.page + '; may include student marks'} />}
                </details>
            </article>
        </>}
    </section>;
}

function PaperAnswer({ options, value, locked, correctKey, aiGraded, onSubmit }: {
    options: string[]; value: string; locked: boolean; correctKey: string | null; aiGraded:boolean; onSubmit: (value: string) => void;
}) {
    const [draft, setDraft] = useState(value);
    const completeChoices = options.length >= 2 && options.length <= 6 && options.every(option => option.trim());
    return <fieldset className={styles.options}><legend className={styles.srOnly}>Your answer</legend>
        {completeChoices ? options.map((option, index) => {
            const letter = 'ABCDEF'[index], selected = value === letter;
            const right = correctKey === letter, wrong = Boolean(correctKey && selected && !right);
            return <button type="button" key={letter} aria-pressed={selected} aria-disabled={locked}
                className={[styles.option, selected ? styles.chosen : '', right ? aiGraded ? styles.aiCorrect : styles.optionCorrect : '', wrong ? aiGraded ? styles.aiIncorrect : styles.optionWrong : ''].join(' ')}
                onClick={() => { if (!locked) onSubmit(letter); }}>
                <b className={styles.letter}>{letter}</b><span dir="auto">{option}</span>
                {(right || selected) && <span className={styles.optionStatus}>{right ? '✓ Correct' : wrong ? '✕ Your answer' : 'Selected'}</span>}
            </button>;
        }) : <>
            {options.length > 0 && <details><summary>Partially recovered choices · check source</summary>
                {options.map((option, index) => <p key={index}><b>{'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[index] ?? index + 1}.</b> {option.trim() || '[Unreadable option — see original]'}</p>)}
            </details>}
            <label>Your answer (letter or full text)<textarea value={locked ? value : draft} disabled={locked} onChange={event => setDraft(event.target.value)} /></label>
            {!locked && <button className="primary" disabled={!draft.trim()} onClick={() => onSubmit(draft)}>Submit answer</button>}
        </>}
    </fieldset>;
}

function Result({ result, stale = false }: { result: PaperResult; stale?: boolean }) {
    return <section className={styles.result} aria-label="Latest final result">
        <b>Latest result: {result.sectionStats?.overall.percentage != null ? result.sectionStats.overall.percentage + '% accuracy on graded answers' : 'No graded answers yet'}</b>
        {result.keyed > 0 && <span>{result.matched}/{result.keyed} source-key matches ({result.percentage}%)</span>}
        {!!result.aiKeyed && <span>{result.aiMatched}/{result.aiKeyed} reference-reviewed matches</span>}
        <span>{result.manualGraded ? result.manualCorrect + '/' + result.manualGraded + ' self-marked correct · ' : ''}{result.sectionStats ? result.sectionStats.overall.ungraded + ' answered, ungraded' : result.ungraded + ' unkeyed/ungraded items (may be unanswered)'} · {result.unanswered} unanswered</span>
        <small>Match counts include unanswered items in their denominators. Section accuracy uses graded answers only. Older saved results retain the grading available at completion; open Results &amp; review to recalculate.</small>
        <time dateTime={result.completedAt}>{new Date(result.completedAt).toLocaleString()}</time>
        {stale && <small>From an earlier paper revision; preserved for reference.</small>}
    </section>;
}
