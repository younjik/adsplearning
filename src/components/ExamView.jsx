import { useEffect, useRef } from 'react';
import { EXAMS, QUESTIONS } from '../data';
import QuestionCard from './QuestionCard';

function fmtTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ExamView({
  exam,
  answers,
  onAnswer,
  onStartExam,
  onGotoExamQ,
  onExamPrev,
  onExamNext,
  onSubmitExam,
  onSelectReview,
  onRetryExam,
  onBackToExamHome,
  onResetExam,
}) {
  const detailRef = useRef(null);

  useEffect(() => {
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [exam.reviewQid]);

  if (exam.status === 'home') {
    return (
      <div className="content-col narrow">
        <div className="page-title">모의고사</div>
        <div className="page-sub">실전처럼 제한시간 안에 전 문항을 풀고, 채점 후 오답을 바로 확인합니다.</div>
        {EXAMS.map((e) => (
          <div className={`exam-card ${e.qids.length ? '' : 'locked'}`} key={e.id}>
            <div className="info">
              <div className="title">{e.label}</div>
              <div className="meta">{e.meta}</div>
            </div>
            {e.qids.length ? (
              <>
                <span className="chip open">응시 가능</span>
                {e.qids.some((id) => answers[id] !== undefined) && (
                  <button type="button" className="btn small danger" onClick={() => onResetExam(e.id)}>기록 삭제</button>
                )}
                <button type="button" className="btn primary" onClick={() => onStartExam(e.id)}>시작하기</button>
              </>
            ) : (
              <span className="chip locked">준비 중</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  const examEntry = EXAMS.find((e) => e.id === exam.examId);
  const qids = examEntry.qids;

  if (exam.status === 'running') {
    const qid = qids[exam.current];
    return (
      <div className="content-col narrow">
        <div className="exam-bar">
          <div className="etitle">{examEntry.label}</div>
          <div className="timer">{fmtTime(exam.remaining)}</div>
        </div>
        <div className="qdots">
          {qids.map((id, i) => (
            <button
              key={id}
              type="button"
              className={`qdot ${answers[id] !== undefined ? 'answered' : ''} ${i === exam.current ? 'current' : ''}`}
              onClick={() => onGotoExamQ(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <QuestionCard
          qid={qid}
          numLabel={`Q${exam.current + 1}`}
          bookmarkable={false}
          reveal={false}
          answered={answers[qid]}
          onAnswer={onAnswer}
        />
        <div className="exam-nav">
          <button type="button" className="btn" onClick={onExamPrev} disabled={exam.current === 0}>이전</button>
          {exam.current === qids.length - 1 ? (
            <button type="button" className="btn primary" onClick={onSubmitExam}>제출하기</button>
          ) : (
            <button type="button" className="btn primary" onClick={onExamNext}>다음</button>
          )}
        </div>
        {exam.current !== qids.length - 1 && (
          <div className="exam-early-submit">
            <button type="button" className="btn small" onClick={onSubmitExam}>
              여기까지 하고 채점하기 ({qids.filter((id) => answers[id] !== undefined).length}/{qids.length} 응답)
            </button>
          </div>
        )}
      </div>
    );
  }

  // result
  const correct = qids.filter((id) => answers[id] && answers[id].choice === QUESTIONS[id].answer).length;
  const pct = Math.round((correct / qids.length) * 100);
  const passed = pct >= 60;
  const reviewQid = exam.reviewQid || qids[0];

  return (
    <div className="content-col result">
      <div className="result-actions">
        <button type="button" className="btn" onClick={onBackToExamHome}>목록으로</button>
        <button type="button" className="btn primary" onClick={onRetryExam}>다시 응시하기</button>
      </div>
      <div className="score-hero">
        <div className="score-num">{correct} / {qids.length} ({pct}%)</div>
        <div className={`pass-badge ${passed ? 'good' : 'bad'}`}>{passed ? '합격' : '불합격'}</div>
        <div className="score-cap">실제 합격 기준은 과목별 40% 이상 · 평균 60점 이상입니다.</div>
      </div>
      <div className="result-split">
        <div className="review-list">
          {qids.map((id, i) => {
            const q = QUESTIONS[id];
            const ans = answers[id];
            const ok = ans && ans.choice === q.answer;
            const sel = reviewQid === id;
            return (
              <button
                key={id}
                type="button"
                className={`review-row ${sel ? 'selected' : ''}`}
                onClick={() => onSelectReview(id)}
              >
                <span className="rq">Q{i + 1}</span>
                <span className="rstem">{q.stem}</span>
                <span className={`tag ${ok ? 'good' : 'bad'}`}>{ok ? '정답' : '오답'}</span>
              </button>
            );
          })}
        </div>
        <select
          className="review-select"
          value={reviewQid}
          onChange={(e) => onSelectReview(e.target.value)}
        >
          {qids.map((id, i) => {
            const q = QUESTIONS[id];
            const ans = answers[id];
            const ok = ans && ans.choice === q.answer;
            const stem = q.stem.replace(/\s+/g, ' ').trim();
            const preview = stem.length > 28 ? `${stem.slice(0, 28)}…` : stem;
            return (
              <option key={id} value={id}>
                {`Q${i + 1} · ${ok ? '정답' : '오답'} · ${preview}`}
              </option>
            );
          })}
        </select>
        <div className="review-detail" ref={detailRef}>
          <QuestionCard
            qid={reviewQid}
            numLabel={`Q${qids.indexOf(reviewQid) + 1}`}
            bookmarkable={false}
            reveal={true}
            showRetry={false}
            answered={answers[reviewQid]}
          />
        </div>
      </div>
    </div>
  );
}
