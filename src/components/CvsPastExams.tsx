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
import { answerResolution, applyAnswerOverlay, combinedPaperId, createCombinedPaper, type AnswerOverlay } from '@/src/lib/mcq/cvs-paper-enhancements.mjs';
import styles from './CvsPastExams.module.css';
import reviewedCounts from '../../public/study/cvs-past-papers/ai-summary.json';

const answerCounts: Record<string, {proposed:number;unresolved:number;corrections:number}> = reviewedCounts;

type Entry = { id: string; title: string; note: string; count: number; keyed: number; file: string; fingerprint: string; category: string };
type Index = { papers: Entry[]; referenceNote: string };

export function CvsPastExams({ onSessionActiveChange }: { onSessionActiveChange?: (active: boolean) => void }) {
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
        fetch('/study/cvs-past-papers/index.json').then(r => {
            if (!r.ok) throw new Error('Could not load the paper list.');
            return r.json();
        }).then(data => { if (!cancelled) setCatalog(data); })
          .catch(e => { if (!cancelled) setError(e.message); });
        fetch('/study/cvs-past-papers/topic-map.json').then(r => {
            if (!r.ok) throw new Error('Topic mapping could not load.');
            return r.json();
        }).then(data => { if (!cancelled) setTopics(data); })
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
        const response = await fetch(entry.file);
        if (!response.ok) throw new Error('Could not load ' + entry.title + '. Please retry.');
        const original: Paper = await response.json();
        if (!overlayRequest.current) overlayRequest.current = fetch('/study/cvs-past-papers/ai-answers.json').then(r => {
            if (!r.ok) throw new Error('Answer review unavailable');
            setAnswerWarning('');
            return r.json();
        }).catch(() => { setAnswerWarning('AI answer review could not load. Supplied keys still work; missing keys remain ungraded. Exit and reopen to retry.'); overlayRequest.current = null; return null; });
        const overlay = await overlayRequest.current;
        // Never overwrite an attempt based on corrected choices with an unavailable overlay.
        if (!overlay && Object.values(progressRef.current.attempts).some(attempt => original.questions.some(q => attempt.correctionRevisions?.[q.id]))) {
            throw new Error('The reviewed answer layer is unavailable. Your corrected-choice answers are safe; retry opening the paper.');
        }
        return applyAnswerOverlay(original, overlay);
    }

    function enter(p: Paper, restart: boolean) {
        if (!p.questions.length) throw new Error('This source has no exam-ready items. Read its transcript in the archive.');
        const saved = restart ? null : restorePaperAttempt(progressRef.current.attempts[p.id], p);
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
    if (!paper || !attempt || !q) return <section className={styles.root} aria-label="CVS past exams">
        <header><p className="eyebrow">CVS · Final Exam · past papers only</p><h1>Choose your paper</h1>
            <p>Tap an answer for instant feedback. Finish to see your weak subjects and exact review sections. Progress and the latest result for each paper stay saved in this browser.</p></header>
        <div className={styles.modePicker} aria-label="Feedback mode">
            <button aria-pressed={mode === 'instant'} onClick={() => setMode('instant')}>Learn · instant feedback</button>
            <button aria-pressed={mode === 'deferred'} onClick={() => setMode('deferred')}>Exam · mark at the end</button>
        </div>
        <details className={styles.note}><summary>About the answers</summary><p>Slightly stronger colors distinguish reference-reviewed answers from supplied keys. Review provenance and references are available with each answer. These are study answers, not certified university keys. Feedback mode applies to new attempts.</p></details>
        {storageWarning && <p role="alert">{storageWarning}</p>}{error && <p role="alert">{error}</p>}
        {loading && <p role="status">Opening your past paper…</p>}
        <section className={styles.aggregator} aria-label="Combine past papers">
            <header><h2>Combine past papers</h2><p>One continuous session, with a combined subject and review-section report. Your individual-paper attempts stay separate. Repeated questions from different papers are retained.</p></header>
            <div className={styles.actions}><button disabled={loading} onClick={() => setSelectedPapers(catalog.papers.map(p => p.id))}>Select all</button><button disabled={loading || !selectedPapers.length} onClick={() => setSelectedPapers([])}>Clear selection</button></div>
            <div className={styles.paperSelection}>{catalog.papers.map(entry => <label key={entry.id}>
                <input type="checkbox" disabled={loading} checked={selectedPapers.includes(entry.id)} onChange={e => setSelectedPapers(ids => e.target.checked ? [...ids, entry.id] : ids.filter(id => id !== entry.id))} />
                <span>{entry.title}<small>{entry.count} questions · {entry.keyed + (answerCounts[entry.id]?.proposed ?? 0)} with answers</small></span>
            </label>)}</div>
            <p>{selectedPapers.length} papers selected · {catalog.papers.filter(p => selectedPapers.includes(p.id)).reduce((n, p) => n + p.count, 0)} questions</p>
            <div className={styles.actions}><button className="primary" disabled={loading || !selectedPapers.length} onClick={() => void openCombined()}>
                {progress.attempts[combinedPaperId(selectedPapers)] ? 'Resume combined / view results' : 'Start combined session'}</button>
                {progress.attempts[combinedPaperId(selectedPapers)] && <button disabled={loading} onClick={() => void openCombined(true)}>New combined attempt</button>}</div>
            {Object.values(progress.attempts).some(a => a.sourcePaperIds?.length) && <details><summary>Saved combined sessions</summary>
                {Object.values(progress.attempts).filter(a => a.sourcePaperIds?.length).map(saved => <article className={styles.savedCombined} key={saved.paperId}>
                    <b>{saved.sourcePaperIds!.map(id => catalog.papers.find(p => p.id === id)?.title ?? id).join(' + ')}</b>
                    {progress.latest[saved.paperId] && <Result result={progress.latest[saved.paperId]} />}
                    <button disabled={loading} onClick={() => { setSelectedPapers(saved.sourcePaperIds!); void openCombined(false, saved.sourcePaperIds); }}>{saved.completedAt ? 'Results & review' : 'Resume combined session'}</button>
                </article>)}
            </details>}
        </section>
        <div className={styles.papers}>{catalog.papers.map(entry => {
            const result = progress.latest[entry.id], saved = progress.attempts[entry.id];
            const same = saved?.fingerprint === entry.fingerprint;
            return <article key={entry.id}><span className={styles.meta}>{entry.category}</span><h2>{entry.title}</h2><p>{entry.note}</p>
                <p><b>{entry.count}</b> questions · <b>{entry.keyed + (answerCounts[entry.id]?.proposed ?? 0)}</b> with answers{answerCounts[entry.id]?.unresolved ? ` · ${answerCounts[entry.id].unresolved} unresolved` : ''}</p>
                {result ? <Result result={result} stale={result.fingerprint !== entry.fingerprint} /> : <p className={styles.meta}>No completed result yet</p>}
                <div className={styles.actions}><button className="primary" disabled={loading} onClick={() => void open(entry)}>{same ? saved.completedAt ? 'Results & review' : 'Resume paper' : 'Take paper'}</button>
                    {same && <button disabled={loading} onClick={() => void open(entry, true)}>New attempt</button>}</div>
            </article>;
        })}</div><p className={styles.note}>{catalog.referenceNote}</p>
    </section>;

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
            <CvsWeaknessReport breakdown={breakdown} topics={topics} onReview={review} />
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
