import { QUESTIONS, chapterName } from '../data';

export default function BookmarksView({ bookmarks, onGoto }) {
  const ids = Array.from(bookmarks);

  if (ids.length === 0) {
    return (
      <div className="content-col">
        <div className="page-title">북마크</div>
        <div className="page-sub">헷갈리는 이론이나 문제를 별표로 표시해두면 여기 모입니다.</div>
        <div className="empty-box">
          <div className="dot"></div>
          아직 북마크한 항목이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="content-col">
      <div className="page-title">북마크</div>
      <div className="page-sub">저장된 항목 {ids.length}개</div>
      {ids.map((id) => {
        if (id.startsWith('chapter:')) {
          const cid = id.split(':')[1];
          return (
            <div className="bm-row" key={id}>
              <span className="kind">이론</span>
              <span className="label">{chapterName(cid)}</span>
              <button type="button" className="btn small" onClick={() => onGoto(cid)}>이동</button>
            </div>
          );
        }
        const q = QUESTIONS[id];
        return (
          <div className="bm-row" key={id}>
            <span className="kind">문제</span>
            <span className="label">{q.stem}</span>
            <button type="button" className="btn small" onClick={() => onGoto(`practice:${q.subjectId}`)}>이동</button>
          </div>
        );
      })}
    </div>
  );
}
