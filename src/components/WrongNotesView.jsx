import { useEffect, useState } from 'react';
import { QUESTIONS, SUBJECTS, EXAMS } from '../data';
import QuestionCard from './QuestionCard';

export default function WrongNotesView({ answers, bookmarks, wrongFilter, onSetWrongFilter, onAnswer, onRetry, onToggleBookmark, onGotoChapter, scrollToQid }) {
  const wrongIds = Object.keys(answers).filter((id) => answers[id].choice !== QUESTIONS[id].answer);
  const [highlightQid, setHighlightQid] = useState(null);

  useEffect(() => {
    if (!scrollToQid) return;
    document.getElementById(`qcard-${scrollToQid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightQid(scrollToQid);
    const t = setTimeout(() => setHighlightQid(null), 2500);
    return () => clearTimeout(t);
  }, [scrollToQid]);

  if (wrongIds.length === 0) {
    return (
      <div className="content-col">
        <div className="page-title">오답노트</div>
        <div className="page-sub">틀린 문제만 모아 다시 풀어볼 수 있습니다.</div>
        <div className="empty-box">
          <div className="dot"></div>
          아직 틀린 문제가 없습니다 — 학습 탭에서 기출문제를 풀어보세요.
        </div>
      </div>
    );
  }

  const groups = {};
  wrongIds.forEach((id) => {
    const q = QUESTIONS[id];
    const key = q.examId ? `exam:${q.examId}` : `subject:${q.subjectId}`;
    if (!groups[key]) {
      const label = q.examId ? EXAMS.find((e) => e.id === q.examId).label : SUBJECTS.find((s) => s.id === q.subjectId).name;
      groups[key] = { label, ids: [] };
    }
    groups[key].ids.push(id);
  });
  const filterKeys = Object.keys(groups);
  const activeFilter = wrongFilter === 'all' || groups[wrongFilter] ? wrongFilter : 'all';
  const shownIds = activeFilter === 'all' ? wrongIds : groups[activeFilter].ids;

  return (
    <div className="content-col">
      <div className="page-title">오답노트</div>
      <div className="page-sub">틀린 문제 {wrongIds.length}개 · 다시 풀어서 맞히면 목록에서 사라집니다.</div>
      <div className="wrong-tabs">
        <button
          type="button"
          className={`wtab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onSetWrongFilter('all')}
        >
          전체 <span className="cnt">{wrongIds.length}</span>
        </button>
        {filterKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={`wtab ${activeFilter === key ? 'active' : ''}`}
            onClick={() => onSetWrongFilter(key)}
          >
            {groups[key].label} <span className="cnt">{groups[key].ids.length}</span>
          </button>
        ))}
      </div>
      {shownIds.map((id) => {
        const q = QUESTIONS[id];
        const label = q.examId ? EXAMS.find((e) => e.id === q.examId).label : SUBJECTS.find((s) => s.id === q.subjectId).name;
        return (
          <QuestionCard
            key={id}
            qid={id}
            numLabel="Q"
            label={label}
            bookmarkable={!q.examId}
            answered={answers[id]}
            isBookmarked={bookmarks.has(id)}
            highlighted={id === highlightQid}
            onAnswer={onAnswer}
            onRetry={onRetry}
            onToggleBookmark={onToggleBookmark}
            onGotoChapter={onGotoChapter}
          />
        );
      })}
    </div>
  );
}
