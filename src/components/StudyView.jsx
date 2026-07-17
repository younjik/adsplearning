import { useEffect, useRef } from 'react';
import { SUBJECTS, THEORY, subjectOfChapter, subjectPracticeQuestionIds } from '../data';
import QuestionCard from './QuestionCard';

function TheoryBlock({ block }) {
  switch (block.type) {
    case 'h':
      return <h3 className="theory-h">{block.text}</h3>;
    case 'p':
      return <p>{block.text}</p>;
    case 'list':
      return (
        <ul className="theory-list">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'table':
      return (
        <div className="table-scroll">
          <table>
            <tbody>
              <tr>{block.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
              {block.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'tip':
      return (
        <div className="callout">
          <div className="callout-title">{block.title}</div>
          <p>{block.text}</p>
        </div>
      );
    default:
      return null;
  }
}

// Groups a flat block list into chunks starting at each heading ('h') block,
// so a single topic (heading + its content) can be highlighted as a unit.
function groupByHeading(blocks) {
  const groups = [];
  blocks.forEach((block) => {
    if (block.type === 'h' || groups.length === 0) {
      groups.push({ id: block.id || null, blocks: [block] });
    } else {
      groups[groups.length - 1].blocks.push(block);
    }
  });
  return groups;
}

function ChapterTheory({ chapterId, bookmarks, onToggleBookmark, scrollTarget }) {
  const chapterDef = SUBJECTS.flatMap((s) => s.chapters).find((c) => c.id === chapterId);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollTarget && scrollRef.current) {
      const isSection = scrollTarget.startsWith('section:');
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: isSection ? 'start' : 'center' });
    }
  }, [scrollTarget, chapterId]);

  if (!chapterDef.built) {
    return (
      <div className="content-col">
        <div className="eyebrow">{subjectOfChapter(chapterId).name}</div>
        <div className="chapter-title-row"><h1>{chapterDef.name}</h1></div>
        <div className="empty-box">
          <div className="dot"></div>
          PDF 반영 후 이 챕터의 이론이 채워집니다.
        </div>
      </div>
    );
  }

  const theory = THEORY[chapterId];
  const chapterBmKey = `chapter:${chapterId}`;
  const isBm = bookmarks.has(chapterBmKey);

  return (
    <div className="content-col">
      <div className="eyebrow">{theory.subjectLabel}</div>
      <div className="chapter-title-row">
        <h1>{chapterDef.name}</h1>
        <button
          type="button"
          className={`star-btn ${isBm ? 'on' : ''}`}
          aria-label="챕터 북마크"
          onClick={() => onToggleBookmark(chapterBmKey)}
        >
          {isBm ? '★' : '☆'}
        </button>
      </div>
      {theory.sections.map((section, i) => {
        const isSectionTarget = scrollTarget === `section:${i}`;
        return (
          <div className="theory-section" key={i}>
            <h2 className="section-title" ref={isSectionTarget ? scrollRef : null}>{section.title}</h2>
            {section.tags && (
              <div className="tag-row">
                {section.tags.map((tag, j) => <span className="tag-chip" key={j}>{tag}</span>)}
              </div>
            )}
            <div className="theory">
              {groupByHeading(section.blocks).map((group, j) => {
                const isHighlighted = group.id && group.id === scrollTarget;
                return (
                  <div
                    key={j}
                    ref={isHighlighted ? scrollRef : null}
                    className={`topic-group ${isHighlighted ? 'highlight' : ''}`}
                  >
                    {group.blocks.map((block, k) => <TheoryBlock block={block} key={k} />)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SubjectPractice({ subjectId, answers, bookmarks, onAnswer, onRetry, onToggleBookmark, onGotoChapter }) {
  const subject = SUBJECTS.find((s) => s.id === subjectId);
  const qids = subjectPracticeQuestionIds(subjectId);

  if (qids.length === 0) {
    return (
      <div className="content-col">
        <div className="eyebrow">{subject.name}</div>
        <div className="chapter-title-row"><h1>예상문제</h1></div>
        <div className="empty-box">
          <div className="dot"></div>
          PDF 반영 후 이 과목의 예상문제가 채워집니다.
        </div>
      </div>
    );
  }

  return (
    <div className="content-col">
      <div className="eyebrow">{subject.name}</div>
      <div className="chapter-title-row"><h1>예상문제</h1></div>
      <div className="page-sub">과목의 이론을 마무리하며 풀어보는 문제 {qids.length}개입니다.</div>
      {qids.map((qid, i) => (
        <QuestionCard
          key={qid}
          qid={qid}
          numLabel={`Q${i + 1}`}
          answered={answers[qid]}
          isBookmarked={bookmarks.has(qid)}
          onAnswer={onAnswer}
          onRetry={onRetry}
          onToggleBookmark={onToggleBookmark}
          onGotoChapter={onGotoChapter}
        />
      ))}
    </div>
  );
}

export default function StudyView({ selectedItem, answers, bookmarks, scrollTarget, onAnswer, onRetry, onToggleBookmark, onGotoChapter }) {
  useEffect(() => {
    if (!scrollTarget) {
      window.scrollTo(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on navigation, not when scrollTarget later clears itself
  }, [selectedItem]);

  if (selectedItem.startsWith('practice:')) {
    const subjectId = selectedItem.split(':')[1];
    return (
      <SubjectPractice
        subjectId={subjectId}
        answers={answers}
        bookmarks={bookmarks}
        onAnswer={onAnswer}
        onRetry={onRetry}
        onToggleBookmark={onToggleBookmark}
        onGotoChapter={onGotoChapter}
      />
    );
  }
  return (
    <ChapterTheory
      chapterId={selectedItem}
      bookmarks={bookmarks}
      onToggleBookmark={onToggleBookmark}
      scrollTarget={scrollTarget}
    />
  );
}
