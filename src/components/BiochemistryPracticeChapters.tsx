'use client';

import {useState} from 'react';
import {DEFAULT_RETAKE_CHAPTER_IDS, RETAKE_PRACTICE_CHAPTERS, retakeChapterQuestionIds, type RetakePracticeChapterIndex} from '@/src/lib/biochemistry/retake-practice-scope.mjs';
import {StudyIcon} from './StudyIcon';
import styles from './BiochemistryPracticeChapters.module.css';

export function BiochemistryPracticeChapters({index, selectedIds, onChange, disabled, onRetry}: {
  index?: RetakePracticeChapterIndex;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
  onRetry: () => void;
}) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const chapters = RETAKE_PRACTICE_CHAPTERS.filter(chapter => `${chapter.chapterLabel} ${chapter.title}`.toLowerCase().includes(query));
  const counts = new Map(index?.map(chapter => [chapter.id, chapter.questionCount]));
  const toggle = (id: string) => onChange(selectedIds.includes(id) ? selectedIds.filter(selected => selected !== id) : [...selectedIds, id]);
  return <details className={styles.panel} open>
    <summary><StudyIcon name="book"/><b>Choose chapters & slide extras</b><span>{selectedIds.length} selected</span></summary>
    <div className={styles.content}>
      <div className={styles.toolbar}>
        <label className={styles.search}><StudyIcon name="search"/><input aria-label="Find a biochemistry chapter" placeholder="Find a chapter or topic" value={search} onChange={event => setSearch(event.target.value)}/></label>
        <div className={styles.actions}>
          <button type="button" disabled={disabled} onClick={() => onChange([...DEFAULT_RETAKE_CHAPTER_IDS])}>Term 1 scope</button>
          <button type="button" disabled={disabled} onClick={() => onChange(RETAKE_PRACTICE_CHAPTERS.map(chapter => chapter.id))}>Select all</button>
          <button type="button" disabled={disabled} onClick={() => onChange([])}>Clear</button>
        </div>
      </div>
      <p className={styles.hint}>Lippincott, 6th edition. The confirmed Term 1 chapters and slide extras are selected by default. Supplementary chapters remain optional.</p>
      <div className={styles.grid} role="group" aria-label="Biochemistry practice chapters">
        {chapters.map(chapter => <label key={chapter.id} className={`${styles.chapter} ${selectedIds.includes(chapter.id) ? styles.selected : ''}`}>
          <input type="checkbox" checked={selectedIds.includes(chapter.id)} disabled={disabled || !index || !counts.get(chapter.id)} onChange={() => toggle(chapter.id)}/>
          <span className={styles.copy}><small>{chapter.chapterLabel}{chapter.coverage === 'supplementary' ? ' · Supplementary' : ''}</small><b>{chapter.title}</b></span>
          <span className={styles.count} aria-label={index ? `${counts.get(chapter.id) ?? 0} questions` : 'Loading count'}>{index ? counts.get(chapter.id) ?? 0 : '…'}</span>
        </label>)}
      </div>
      {!chapters.length && <p className={styles.hint}>No matching chapters. Try a chapter number or another topic.</p>}
      <p className={styles.hint} aria-live="polite">{index ? `${retakeChapterQuestionIds(index, selectedIds).length.toLocaleString()} unique questions in this selection` : 'Loading chapter counts…'} · Collections and saved-question filters below use this selection.</p>
      {!index && <button type="button" disabled={disabled} onClick={onRetry}>Retry chapter list</button>}
    </div>
  </details>;
}
