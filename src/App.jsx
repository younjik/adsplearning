import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { SUBJECTS, QUESTIONS, EXAMS, subjectOfChapter, subjectPracticeQuestionIds } from './data';
import { loadUserData, saveUserData } from './firebase';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import StudyView from './components/StudyView';
import ExamView from './components/ExamView';
import WrongNotesView from './components/WrongNotesView';
import BookmarksView from './components/BookmarksView';
import PinScreen from './components/PinScreen';
import './index.css';

const ALL_CHAPTERS = SUBJECTS.flatMap((s) => s.chapters);

function isChapterComplete(chapter, answers) {
  if (!chapter.built) return false;
  const subject = subjectOfChapter(chapter.id);
  const qids = subjectPracticeQuestionIds(subject.id);
  return qids.length > 0 && qids.every((id) => answers[id] !== undefined);
}

function examQids(examId) {
  return EXAMS.find((e) => e.id === examId)?.qids || [];
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pin, setPin] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [expanded, setExpanded] = useState(new Set(['s1']));
  const [answers, setAnswers] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  const [wrongFilter, setWrongFilter] = useState('all');
  const [scrollTarget, setScrollTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [examRunState, setExamRunState] = useState({ remaining: 0, current: 0, reviewQid: null });

  const timerRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const dataReadyRef = useRef(false);

  // URL에서 현재 화면 상태 추출
  const path = location.pathname;
  const tab = path.startsWith('/exam') ? 'exam'
    : path.startsWith('/wrong') ? 'wrong'
    : path.startsWith('/bookmarks') ? 'bookmarks'
    : 'study';
  const selectedItem = path.startsWith('/study/') ? path.slice(7) : 'c1';
  const examUrlMatch = path.match(/^\/exam\/([^/]+)(\/result)?$/);
  const examId = examUrlMatch ? examUrlMatch[1] : null;
  const examStatus = examUrlMatch ? (examUrlMatch[2] ? 'result' : 'running') : 'home';
  const exam = { examId, status: examStatus, ...examRunState };

  // 타이머
  useEffect(() => {
    if (examStatus !== 'running') {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setExamRunState((prev) => {
        if (prev.remaining <= 1) return { ...prev, remaining: 0 };
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [examStatus]);

  // 시간 종료 시 결과 화면으로
  useEffect(() => {
    if (examStatus === 'running' && examRunState.remaining === 0 && examId) {
      setExamRunState((prev) => ({ ...prev, reviewQid: examQids(examId)[0] }));
      navigate('/exam/' + examId + '/result');
    }
  }, [examRunState.remaining]);

  // 하이라이트 타이머
  useEffect(() => {
    clearTimeout(highlightTimerRef.current);
    if (scrollTarget) {
      highlightTimerRef.current = setTimeout(() => setScrollTarget(null), 2500);
    }
    return () => clearTimeout(highlightTimerRef.current);
  }, [scrollTarget]);

  // PIN 로그인
  async function handlePinSubmit(enteredPin) {
    setPinLoading(true);
    const data = await loadUserData(enteredPin);
    if (data) {
      setAnswers(data.answers || {});
      setBookmarks(new Set(data.bookmarks || []));
      setExpanded(new Set(data.expanded || ['s1']));
      if (data.lastPath) navigate(data.lastPath);
    }
    setPin(enteredPin);
    setPinLoading(false);
    dataReadyRef.current = true;
  }

  // 자동 저장
  useEffect(() => {
    if (!pin || !dataReadyRef.current) return;
    const timer = setTimeout(() => {
      saveUserData(pin, {
        answers,
        bookmarks: [...bookmarks],
        expanded: [...expanded],
        lastPath: location.pathname,
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [answers, bookmarks, expanded, location.pathname, pin]);

  // 네비게이션 핸들러
  function handleSwitchTab(nextTab) {
    if (nextTab === 'study') navigate('/study/c1');
    else navigate('/' + nextTab);
    setSidebarOpen(false);
  }
  function handleSelectItem(item) {
    navigate('/study/' + item);
    setScrollTarget(null);
    setSidebarOpen(false);
  }
  function handleSelectSection(chapterId, sectionIndex) {
    navigate('/study/' + chapterId);
    setScrollTarget(`section:${sectionIndex}`);
    setSidebarOpen(false);
  }
  function handleGoto(target, topicId) {
    navigate('/study/' + target);
    setScrollTarget(topicId || null);
    setSidebarOpen(false);
    const subjectId = target.startsWith('practice:') ? target.split(':')[1] : subjectOfChapter(target)?.id;
    if (subjectId) setExpanded((prev) => new Set(prev).add(subjectId));
  }
  function handleToggleSubject(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // 답변 핸들러
  function handleAnswer(qid, choice) {
    setAnswers((prev) => ({ ...prev, [qid]: { choice, correct: choice === QUESTIONS[qid].answer } }));
  }
  function handleRetry(qid) {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
  }
  function handleToggleBookmark(id) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // 모의고사 핸들러
  function handleStartExam(eid) {
    const entry = EXAMS.find((e) => e.id === eid);
    if (!entry || entry.qids.length === 0) return;
    setAnswers((prev) => {
      const next = { ...prev };
      entry.qids.forEach((id) => delete next[id]);
      return next;
    });
    setExamRunState({ remaining: entry.seconds, current: 0, reviewQid: null });
    navigate('/exam/' + eid);
  }
  function handleSubmitExam() {
    setExamRunState((prev) => ({ ...prev, reviewQid: examQids(examId)[0] }));
    navigate('/exam/' + examId + '/result');
  }
  function handleRetryExam() {
    const entry = EXAMS.find((e) => e.id === examId);
    setAnswers((prev) => {
      const next = { ...prev };
      examQids(examId).forEach((id) => delete next[id]);
      return next;
    });
    setExamRunState({ remaining: entry.seconds, current: 0, reviewQid: null });
    navigate('/exam/' + examId);
  }
  function handleResetPractice(subjectId) {
    if (!window.confirm('실행하면 푼 문제가 저장이 안 됩니다.\n초기화하시겠어요?')) return;
    const qids = subjectPracticeQuestionIds(subjectId);
    setAnswers((prev) => {
      const next = { ...prev };
      qids.forEach((id) => delete next[id]);
      return next;
    });
  }
  function handleResetExam(eid) {
    if (!window.confirm('실행하면 푼 문제가 저장이 안 됩니다.\n초기화하시겠어요?')) return;
    const qids = examQids(eid);
    setAnswers((prev) => {
      const next = { ...prev };
      qids.forEach((id) => delete next[id]);
      return next;
    });
  }

  const progress = {
    done: ALL_CHAPTERS.filter((c) => isChapterComplete(c, answers)).length,
    total: ALL_CHAPTERS.length,
  };

  const examProps = {
    exam,
    answers,
    onAnswer: handleAnswer,
    onStartExam: handleStartExam,
    onGotoExamQ: (idx) => setExamRunState((prev) => ({ ...prev, current: idx })),
    onExamPrev: () => setExamRunState((prev) => ({ ...prev, current: Math.max(0, prev.current - 1) })),
    onExamNext: () => setExamRunState((prev) => ({ ...prev, current: Math.min(examQids(examId).length - 1, prev.current + 1) })),
    onSubmitExam: handleSubmitExam,
    onSelectReview: (qid) => setExamRunState((prev) => ({ ...prev, reviewQid: qid })),
    onRetryExam: handleRetryExam,
    onBackToExamHome: () => navigate('/exam'),
    onResetExam: handleResetExam,
  };

  if (!pin) {
    return <PinScreen onSubmit={handlePinSubmit} loading={pinLoading} />;
  }

  return (
    <>
      <TopBar
        tab={tab}
        onSwitchTab={handleSwitchTab}
        progress={progress}
        showSidebarToggle={tab === 'study'}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />
      <div className="layout">
        {tab === 'study' && (
          <Sidebar
            expanded={expanded}
            selectedItem={selectedItem}
            answers={answers}
            onToggleSubject={handleToggleSubject}
            onSelectItem={handleSelectItem}
            onSelectSection={handleSelectSection}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        <div className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/study/c1" replace />} />
            <Route
              path="/study/:itemId"
              element={
                <StudyView
                  selectedItem={selectedItem}
                  answers={answers}
                  bookmarks={bookmarks}
                  scrollTarget={scrollTarget}
                  onAnswer={handleAnswer}
                  onRetry={handleRetry}
                  onToggleBookmark={handleToggleBookmark}
                  onGotoChapter={handleGoto}
                  onResetPractice={handleResetPractice}
                />
              }
            />
            <Route path="/exam" element={<ExamView {...examProps} />} />
            <Route path="/exam/:examId" element={<ExamView {...examProps} />} />
            <Route path="/exam/:examId/result" element={<ExamView {...examProps} />} />
            <Route
              path="/wrong"
              element={
                <WrongNotesView
                  answers={answers}
                  bookmarks={bookmarks}
                  wrongFilter={wrongFilter}
                  onSetWrongFilter={setWrongFilter}
                  onAnswer={handleAnswer}
                  onRetry={handleRetry}
                  onToggleBookmark={handleToggleBookmark}
                  onGotoChapter={handleGoto}
                />
              }
            />
            <Route path="/bookmarks" element={<BookmarksView bookmarks={bookmarks} onGoto={handleGoto} />} />
          </Routes>
        </div>
      </div>
    </>
  );
}
