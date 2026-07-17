import { QUESTIONS, chapterName } from '../data';

export default function QuestionCard({
  qid,
  numLabel = 'Q',
  label,
  bookmarkable = true,
  reveal = true,
  showRetry = true,
  answered,
  isBookmarked,
  onAnswer,
  onRetry,
  onToggleBookmark,
  onGotoChapter,
}) {
  const q = QUESTIONS[qid];
  const isCorrect = answered !== undefined ? answered.choice === q.answer : null;
  const showFeedback = reveal && answered !== undefined;
  const cardClass = ['qcard', showFeedback ? (isCorrect ? 'correct' : 'incorrect') : ''].join(' ').trim();

  return (
    <div className={cardClass}>
      {label && <div className="note-src">{label}</div>}
      <div className="qhead">
        <span className="qnum">{numLabel}</span>
        <span className="qstem">{q.stem}</span>
        {bookmarkable && (
          <button
            type="button"
            className={`star-btn ${isBookmarked ? 'on' : ''}`}
            aria-label="북마크"
            onClick={() => onToggleBookmark(qid)}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
        )}
      </div>
      {q.code && <pre className="q-code">{q.code}</pre>}
      {q.table && (
        <div className="table-scroll">
          <table className="q-table">
            <tbody>
              <tr>{q.table.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
              {q.table.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="options">
        {q.options.map((opt, i) => {
          let optClass = 'opt';
          if (showFeedback) {
            optClass += ' disabled';
            if (i === q.answer) optClass += ' correct-opt';
            else if (i === answered.choice) optClass += ' wrong-opt';
          }
          return (
            <label className={optClass} key={i}>
              <input
                type="radio"
                name={qid}
                disabled={showFeedback}
                checked={answered !== undefined && answered.choice === i}
                onChange={() => onAnswer(qid, i)}
              />
              <span className="bubble"></span>
              <span className="opt-text">{opt}</span>
            </label>
          );
        })}
      </div>
      {showFeedback && (
        <>
          <div className={`explain ${isCorrect ? 'good' : 'bad'}`}>
            {isCorrect ? '정답입니다. ' : '오답입니다. '}
            {q.explain}
          </div>
          {!isCorrect && q.chapterId && onGotoChapter && (
            <div className="chapter-link-row">
              <span>관련 이론</span>
              <button type="button" className="chapter-link-btn" onClick={() => onGotoChapter(q.chapterId, q.topicId)}>
                {chapterName(q.chapterId)} 보기 →
              </button>
            </div>
          )}
          {showRetry && (
            <div className="qfoot">
              <button type="button" className="btn small" onClick={() => onRetry(qid)}>
                다시 풀기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
