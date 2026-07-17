import { SUBJECTS, THEORY, subjectPracticeQuestionIds } from '../data';

export default function Sidebar({ expanded, selectedItem, answers, onToggleSubject, onSelectItem, onSelectSection, open: mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}
      <div className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      {SUBJECTS.map((s) => {
        const open = expanded.has(s.id);
        const practiceId = `practice:${s.id}`;
        const practiceQids = subjectPracticeQuestionIds(s.id);
        const practiceDone = practiceQids.filter((id) => answers[id] !== undefined).length;
        return (
          <div className="subject" key={s.id}>
            <button
              type="button"
              className={`subject-head ${open ? 'open' : ''}`}
              onClick={() => onToggleSubject(s.id)}
            >
              <span className="chev">▶</span>
              <span>{s.name}</span>
            </button>
            {open && (
              <div className="chapter-list">
                {s.chapters.map((c) => {
                  const sel = c.id === selectedItem;
                  const theory = c.built ? THEORY[c.id] : null;
                  return (
                    <div key={c.id}>
                      <button
                        type="button"
                        className={`chapter-row ${sel ? 'selected' : ''} ${c.built ? '' : 'placeholder'}`}
                        onClick={() => onSelectItem(c.id)}
                      >
                        <span className="name">{c.name}</span>
                        {!c.built && <span className="frac">준비중</span>}
                      </button>
                      {theory && (
                        <div className="section-list">
                          {theory.sections.map((section, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="section-row"
                              onClick={() => onSelectSection(c.id, idx)}
                            >
                              {section.title.replace(/^SECTION\s*/, '')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  className={`chapter-row practice-row ${practiceId === selectedItem ? 'selected' : ''} ${practiceQids.length ? '' : 'placeholder'}`}
                  onClick={() => onSelectItem(practiceId)}
                >
                  <span className="name">예상문제</span>
                  <span className="frac">{practiceQids.length ? `${practiceDone}/${practiceQids.length}` : '준비중'}</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
      </div>
    </>
  );
}
