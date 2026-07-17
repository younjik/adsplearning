import { useEffect, useRef, useState } from 'react';
import { SUBJECTS, QUESTIONS, EXAMS, subjectOfChapter, subjectPracticeQuestionIds } from './data';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import StudyView from './components/StudyView';
import ExamView from './components/ExamView';
import WrongNotesView from './components/WrongNotesView';
import BookmarksView from './components/BookmarksView';
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

function freshExam() {
  return { examId: null, status: 'home', current: 0, remaining: 0, reviewQid: null };
}

export default function App() {
  const [tab, setTab] = useState('study');
  const [expanded, setExpanded] = useState(new Set(['s1']));
  const [selectedItem, setSelectedItem] = useState('c1');
  const [answers, setAnswers] = useState({});
  const [bookmarks, setBookmarks] = useState(new Set());
  const [wrongFilter, setWrongFilter] = useState('all');
  const [exam, setExam] = useState(freshExam());
  const [scrollTarget, setScrollTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const timerRef = useRef(null);
  const highlightTimerRef = useRef(null);

  useEffect(() => {
    clearTimeout(highlightTimerRef.current);
    if (scrollTarget) {
      highlightTimerRef.current = setTimeout(() => setScrollTarget(null), 2500);
    }
    return () => clearTimeout(highlightTimerRef.current);
  }, [scrollTarget]);

  useEffect(() => {
    if (exam.status !== 'running') {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setExam((prev) => {
        if (prev.status !== 'running') return prev;
        if (prev.remaining <= 1) {
          return { ...prev, remaining: 0, status: 'result', reviewQid: examQids(prev.examId)[0] };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [exam.status]);

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
  function handleToggleSubject(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function handleGoto(target, topicId) {
    setTab('study');
    setSelectedItem(target);
    setScrollTarget(topicId || null);
    setSidebarOpen(false);
    const subjectId = target.startsWith('practice:') ? target.split(':')[1] : subjectOfChapter(target)?.id;
    if (subjectId) setExpanded((prev) => new Set(prev).add(subjectId));
  }
  function handleSelectItem(item) {
    setSelectedItem(item);
    setScrollTarget(null);
    setSidebarOpen(false);
  }
  function handleSelectSection(chapterId, sectionIndex) {
    setSelectedItem(chapterId);
    setScrollTarget(`section:${sectionIndex}`);
    setSidebarOpen(false);
  }
  function handleSwitchTab(nextTab) {
    setTab(nextTab);
    setSidebarOpen(false);
  }
  function handleStartExam(examId) {
    const entry = EXAMS.find((e) => e.id === examId);
    if (!entry || entry.qids.length === 0) return;
    setAnswers((prev) => {
      const next = { ...prev };
      entry.qids.forEach((id) => delete next[id]);
      return next;
    });
    setExam({ examId, status: 'running', current: 0, remaining: entry.seconds, reviewQid: null });
  }
  function handleSubmitExam() {
    setExam((prev) => ({ ...prev, status: 'result', reviewQid: examQids(prev.examId)[0] }));
  }
  function handleRetryExam() {
    setExam((prev) => {
      const qids = examQids(prev.examId);
      setAnswers((prevAnswers) => {
        const next = { ...prevAnswers };
        qids.forEach((id) => delete next[id]);
        return next;
      });
      const entry = EXAMS.find((e) => e.id === prev.examId);
      return { examId: prev.examId, status: 'running', current: 0, remaining: entry.seconds, reviewQid: null };
    });
  }

  const progress = {
    done: ALL_CHAPTERS.filter((c) => isChapterComplete(c, answers)).length,
    total: ALL_CHAPTERS.length,
  };

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
          {tab === 'study' && (
            <StudyView
              selectedItem={selectedItem}
              answers={answers}
              bookmarks={bookmarks}
              scrollTarget={scrollTarget}
              onAnswer={handleAnswer}
              onRetry={handleRetry}
              onToggleBookmark={handleToggleBookmark}
              onGotoChapter={handleGoto}
            />
          )}
          {tab === 'exam' && (
            <ExamView
              exam={exam}
              answers={answers}
              onAnswer={handleAnswer}
              onStartExam={handleStartExam}
              onGotoExamQ={(idx) => setExam((prev) => ({ ...prev, current: idx }))}
              onExamPrev={() => setExam((prev) => ({ ...prev, current: Math.max(0, prev.current - 1) }))}
              onExamNext={() => setExam((prev) => ({ ...prev, current: Math.min(examQids(prev.examId).length - 1, prev.current + 1) }))}
              onSubmitExam={handleSubmitExam}
              onSelectReview={(qid) => setExam((prev) => ({ ...prev, reviewQid: qid }))}
              onRetryExam={handleRetryExam}
              onBackToExamHome={() => setExam(freshExam())}
            />
          )}
          {tab === 'wrong' && (
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
          )}
          {tab === 'bookmarks' && (
            <BookmarksView bookmarks={bookmarks} onGoto={handleGoto} />
          )}
        </div>
      </div>
    </>
  );
}
