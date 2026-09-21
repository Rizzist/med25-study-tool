type Props = {
  title: string;
  completed: boolean;
  hasSession: boolean;
  answeredCount: number;
  correctCount: number;
  total: number;
  currentIndex: number;
  onOpen: () => void;
  onRestart: () => void;
};

export function FinalExamStatusBanner({title,completed,hasSession,answeredCount,correctCount,total,currentIndex,onOpen,onRestart}:Props) {
  const description = completed
    ? `${answeredCount} of ${total} answered · ${correctCount} correct (${Math.round(correctCount / Math.max(1,total) * 100)}%). Your result is saved.`
    : hasSession
      ? `${answeredCount} of ${total} answered. Resume at question ${currentIndex + 1}.`
      : 'Start the complete past-paper bank. Feedback appears immediately after every choice.';
  return <div className="final-exam-resume" aria-label="Past-paper progress">
    <div>
      <span>{completed ? 'FINAL EXAM COMPLETE' : hasSession ? 'PROGRESS SAVED AUTOMATICALLY' : 'SOURCE-TRACEABLE BANK'}</span>
      <h2>{title}</h2><p>{description}</p>
    </div>
    <div>
      <button className="primary" onClick={onOpen}>{completed ? 'Review answers →' : hasSession ? 'Continue final exam →' : 'Start final exam →'}</button>
      {hasSession && <button className="delete-sprint" onClick={onRestart}>Delete progress &amp; restart</button>}
    </div>
  </div>;
}
