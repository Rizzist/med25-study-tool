"use client";
import { useState } from 'react';
import type { PaperBreakdown, PaperTopicMap, PaperSectionStats } from '@/src/lib/mcq/cvs-paper-state.mjs';
import styles from './CvsPastExams.module.css';

export function CvsWeaknessReport({ breakdown, topics, onReview }: {
    breakdown: PaperBreakdown;
    topics: PaperTopicMap | null;
    onReview: (ids: string[], title: string) => void;
}) {
    const [subject, setSubject] = useState('all');
    const [gapsOnly, setGapsOnly] = useState(true);
    const covered = new Set(breakdown.topics.map(row => row.id));
    const untested = topics?.topics.filter(row => row.id !== 'unclassified' && !covered.has(row.id)) ?? [];
    const filtered = breakdown.topics.filter(row => (subject === 'all' || row.subjectId === subject)
        && (!gapsOnly || row.incorrect > 0 || row.unanswered > 0 || row.ungraded > 0))
        .sort((a, b) => b.incorrect - a.incorrect || b.unanswered - a.unanswered || b.ungraded - a.ungraded || a.title.localeCompare(b.title));
    return <section className={styles.report} aria-label="CVS section weakness report">
        <header><p className="eyebrow">Your review priorities</p><h2>What should I revise next?</h2>
            <p>Start with mistakes, then unanswered topics. Accuracy is correct ÷ graded answers; unverified keys are excluded. A small sample or 100% on a few questions does not prove mastery.</p></header>
        <div className={styles.actions}>
            <button className="primary" disabled={!breakdown.wrongQuestionIds.length} onClick={() => onReview(breakdown.wrongQuestionIds, 'Wrong answers')}>Review wrong ({breakdown.wrongQuestionIds.length})</button>
            <button disabled={!breakdown.missedQuestionIds.length} onClick={() => onReview(breakdown.missedQuestionIds, 'Unanswered questions')}>Unanswered ({breakdown.missedQuestionIds.length})</button>
            <button disabled={!breakdown.ungradedQuestionIds.length} onClick={() => onReview(breakdown.ungradedQuestionIds, 'Answers needing source checking')}>Needs checking ({breakdown.ungradedQuestionIds.length})</button>
        </div>
        <div className={styles.subjects}>{breakdown.subjects.map(row => <button key={row.id} className={styles.subjectCard}
            aria-pressed={subject === row.id} onClick={() => setSubject(subject === row.id ? 'all' : row.id)}>
            <b>{row.title}</b><strong>{row.percentage === null ? 'Not graded' : row.percentage + '%'}</strong>
            <span>{row.answered}/{row.total} answered · {row.correct + row.incorrect} graded</span>
            <span>{row.incorrect} wrong · {row.unanswered} unanswered · {row.ungraded} ungraded</span>
            {(row.manualCorrect + row.manualIncorrect > 0) && <small>Includes {row.manualCorrect + row.manualIncorrect} self-marks</small>}
        </button>)}</div>
        <p className={styles.meta}>Lymphoid organ architecture is under Histology; blood cells, hemostasis and immune function are under Blood / lymph / immune. These are study categories, not official exam weightings.</p>
        <div className={styles.reportTools}><button aria-pressed={subject === 'all'} onClick={() => setSubject('all')}>All subjects</button>
            <label><input type="checkbox" checked={gapsOnly} onChange={e => setGapsOnly(e.target.checked)} /> Show gaps only</label></div>
        <p className={styles.meta}>Section names match the headings in 01 - Cardiovascular Review.pdf. Topics with more wrong answers appear first.</p>
        <div className={styles.topicRows}>{filtered.map(row => <TopicRow key={row.id} row={row} onReview={onReview} />)}</div>
        {!filtered.length && <p>No gaps in the graded items for this selection. Check untested sections below; this is not a completeness or mastery claim.</p>}
        {untested.length > 0 && <details className={styles.untested}><summary>{untested.length} review sections not tested by this paper</summary>
            <p>Not tested does not mean learned. A single past paper cannot cover the full course.</p><ul>{untested.map(row => <li key={row.id}>{row.title ?? row.label}</li>)}</ul>
        </details>}
    </section>;
}

function TopicRow({ row, onReview }: { row: PaperSectionStats; onReview: (ids: string[], title: string) => void }) {
    const graded = row.correct + row.incorrect;
    const status = !row.answered ? 'Not attempted' : !graded ? 'Needs answer checking' : row.incorrect ? 'Review mistakes' : graded < 3 ? 'Small sample' : 'No mistakes on graded items';
    return <article><div><span className={styles.meta}>{status}</span><h3>{row.title}</h3>
        <p><b>{row.percentage === null ? 'No score yet' : row.percentage + '% accuracy'}</b> · {row.correct}/{graded} graded correct · {row.answered}/{row.total} answered</p>
        <p className={styles.meta}>{row.incorrect} wrong · {row.unanswered} unanswered · {row.ungraded} ungraded{row.manualCorrect + row.manualIncorrect ? ' · includes ' + (row.manualCorrect + row.manualIncorrect) + ' self-marks' : ''}</p>
    </div><div className={styles.actions}>
        {row.wrongQuestionIds.length > 0 && <button onClick={() => onReview(row.wrongQuestionIds, row.title + ' · mistakes')}>Review mistakes</button>}
        <button onClick={() => onReview(row.questionIds, row.title)}>Open {row.total} questions</button>
    </div></article>;
}
