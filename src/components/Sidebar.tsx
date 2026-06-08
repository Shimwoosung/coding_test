import { problems, topics, TOPIC_LABELS, problemsByTopic, tierOf, TIERS } from '../data/problems';
import { concepts, conceptsById } from '../data/concepts';
import { examsByGroup } from '../data/exams';
import type { SyncState } from '../storage/progress';

export type View =
  | { kind: 'home' }
  | { kind: 'concept'; id: string }
  | { kind: 'problem'; id: string }
  | { kind: 'exam'; id: string };

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  solvedIds: Set<string>;
  syncState: SyncState;
  syncMessage: string;
  onOpenSettings: () => void;
  onCollapse: () => void;
}

const TIER_CLASS: Record<string, string> = { '기초': 'tier-1', '중간': 'tier-2', '심화': 'tier-3' };

export default function Sidebar({ view, onNavigate, solvedIds, syncState, syncMessage, onOpenSettings, onCollapse }: Props) {
  const total = problems.length;
  const done = problems.filter(p => solvedIds.has(p.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const groups = examsByGroup();

  const syncDot: Record<SyncState, string> = { off: '○', syncing: '◐', synced: '●', error: '⚠' };

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand" onClick={() => onNavigate({ kind: 'home' })}>
          <span className="brand-logo">⌨</span>
          <span className="brand-name">C++ 코테 연습</span>
        </div>
        <button className="collapse-btn" onClick={onCollapse} title="사이드바 접기">◀</button>
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
        {/* 개념 */}
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
        </div>

        {/* 모의고사 */}
        {groups.length > 0 && (
          <div className="nav-section">
            <div className="nav-head">📝 모의고사 (회사별)</div>
            {groups.map(({ group, list }) => (
              <div key={group} className="stage-group">
                <div className="stage-label">{group}</div>
                {list.map(e => (
                  <button
                    key={e.id}
                    className={`nav-item exam ${view.kind === 'exam' && view.id === e.id ? 'active' : ''}`}
                    onClick={() => onNavigate({ kind: 'exam', id: e.id })}
                  >
                    <span className="exam-ico">🏢</span>
                    <span className="problem-title">{e.affiliate || e.title}</span>
                    <span className="lv">{e.timeLimitMinutes}분</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* 문제 (유형 → 난이도) */}
        <div className="nav-section">
          <div className="nav-head">🧩 문제 (유형별)</div>
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
                {TIERS.map(tier => {
                  const tlist = list.filter(p => tierOf(p) === tier);
                  if (!tlist.length) return null;
                  return (
                    <div key={tier} className="tier-group">
                      <div className={`tier-label ${TIER_CLASS[tier]}`}>{tier}</div>
                      {tlist.map(p => {
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
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
