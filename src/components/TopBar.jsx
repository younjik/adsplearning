const TABS = [
  ['study', '학습'],
  ['exam', '모의고사'],
  ['wrong', '오답노트'],
  ['bookmarks', '북마크'],
];

export default function TopBar({ tab, onSwitchTab, progress }) {
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="topbar">
      <div className="wordmark">
        <span className="brand-mark">ADsP</span>
        <span className="brand-sub">학습노트</span>
      </div>
      <div className="tabs">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab-btn ${tab === id ? 'active' : ''}`}
            onClick={() => onSwitchTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="header-progress" title="전체 챕터 중 학습을 완료한 챕터의 비율">
        <span>전체 진행률</span>
        <div className="bar"><i style={{ width: `${pct}%` }}></i></div>
        <b>{pct}%</b>
        <span className="detail">({progress.done}/{progress.total} 챕터)</span>
      </div>
    </div>
  );
}
