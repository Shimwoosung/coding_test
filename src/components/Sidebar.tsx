import { problems, topics, TOPIC_LABELS, problemsByTopic } from '../data/problems';
import { concepts, conceptsById } from '../data/concepts';
import type { SyncState } from '../storage/progress';

export type View =
  | { kind: 'home' }
  | { kind: 'concept'; id: string }
  | { kind: 'problem'; id: string };

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  solvedIds: Set<string>;
  syncState: SyncState;
  syncMessage: string;
  onOpenSettings: () => void;
}

export default function Sidebar({ view, onNavigate, solvedIds, syncState, syncMessage, onOpenSettings }: Props) {
  const total = problems.length;
  const done = problems.filter(p => solvedIds.has(p.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const syncDot: Record<SyncState, string> = {
    off: '○', syncing: '◐', synced: '●', error: '⚠',
  };

  return (
    <aside className="sidebar">
      <div className="brand" onClick={() => onNavigate({ kind: 'home' })}>
        <span className="brand-logo">⌨</span>
        <span className="brand-name">C++ 코테 연습</span>
      </div>

      <div className="progress-block">
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        <div className="progress-text">{done} / {total} 문제 클리어 ({pct}%)</div>
      </div>

      <button className="sync-btn" onClick={onOpenSettings} title={syncMessage}>
        <span className={`sync-dot ${syncState}`}>{syncDot[syncState]}</span>
        {syncState === 'off' ? '동기화 설정' : syncState === 'error' ? '동기화 오류' : '동기화 ' + (syncState === 'syncing' ? '중…' : '완료')}
      </button>

      <nav className="nav">
        <div className="nav-section">
          <div className="nav-head">📖 개념</div>
          {concepts.map(c => (
            <button
              key={c.id}
              className={`nav-item ${view.kind === 'concept' && view.id === c.id ? 'active' : ''}`}
              onClick={() => onNavigate({ kind: 'concept', id: c.id })}
            >
              {c.title}
            </button>
          ))}
          {concepts.length === 0 && <div className="nav-empty">개념 파일이 없습니다.</div>}
        </div>

        <div className="nav-section">
          <div className="nav-head">🧩 문제</div>
          {topics.map(topic => {
            const list = problemsByTopic(topic);
            if (!list.length) return null;
            const doneInTopic = list.filter(p => solvedIds.has(p.id)).length;
            const hasConcept = !!conceptsById[topic];
            return (
              <div key={topic} className="stage-group">
                <div
                  className={`stage-label ${hasConcept ? 'clickable' : ''}`}
                  onClick={() => hasConcept && onNavigate({ kind: 'concept', id: topic })}
                  title={hasConcept ? '개념 설명 보기' : undefined}
                >
                  {TOPIC_LABELS[topic] || topic} <span className="topic-count">{doneInTopic}/{list.length}</span>
                </div>
                {list.map(p => {
                  const solved = solvedIds.has(p.id);
                  const active = view.kind === 'problem' && view.id === p.id;
                  return (
                    <button
                      key={p.id}
                      className={`nav-item problem ${active ? 'active' : ''}`}
                      onClick={() => onNavigate({ kind: 'problem', id: p.id })}
                    >
                      <span className={`check ${solved ? 'on' : ''}`}>{solved ? '✓' : '○'}</span>
                      <span className="problem-title">{p.title}</span>
                      <span className="lv">Lv.{p.level}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
          {problems.length === 0 && <div className="nav-empty">문제 파일이 없습니다.</div>}
        </div>
      </nav>
    </aside>
  );
}
