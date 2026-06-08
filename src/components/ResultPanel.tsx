import type { RunOutcome } from '../types';

interface Props {
  running: boolean;
  outcome: RunOutcome | null;
  mode: 'run' | 'submit' | null;
  toolStatus: string;
}

export default function ResultPanel({ running, outcome, mode, toolStatus }: Props) {
  if (running) {
    return (
      <div className="result-panel">
        <div className="result-status running">
          <span className="spinner" /> 컴파일/실행 중…
          {toolStatus && <div className="tool-status">{toolStatus}</div>}
        </div>
      </div>
    );
  }

  if (!outcome) {
    return (
      <div className="result-panel">
        <div className="result-empty">
          “실행”으로 예제 테스트케이스를 돌려보고, “제출”로 숨김 테스트까지 채점하세요.
          {toolStatus && <div className="tool-status">{toolStatus}</div>}
        </div>
      </div>
    );
  }

  if (!outcome.ok) {
    return (
      <div className="result-panel">
        <div className="result-status fail">⚠ 컴파일 에러</div>
        <pre className="compile-error">{outcome.compileError}</pre>
      </div>
    );
  }

  const allPass = outcome.passedCount === outcome.totalCount && outcome.totalCount > 0;

  return (
    <div className="result-panel">
      <div className={`result-status ${allPass ? 'pass' : 'fail'}`}>
        {allPass ? '✓' : '✗'} {mode === 'submit' ? '제출 채점' : '예제 실행'} ·{' '}
        {outcome.passedCount}/{outcome.totalCount} 통과
        {mode === 'submit' && allPass && <span className="cleared-badge">문제 클리어! 🎉</span>}
      </div>

      <div className="case-list">
        {outcome.cases.map((c) => (
          <div key={c.index} className={`case-card ${c.pass ? 'pass' : 'fail'}`}>
            <div className="case-head">
              <span className="case-title">테스트 {c.index + 1}</span>
              <span className={`case-tag ${c.pass ? 'pass' : 'fail'}`}>
                {c.pass ? '통과' : '실패'}
              </span>
            </div>
            <div className="case-body">
              <Field label="입력" value={c.input} />
              <Field label="기대값" value={c.expected} />
              <Field label="실제값" value={c.error ? '' : c.actual} />
              {c.error && <Field label="오류" value={c.error} cls="err" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <pre className={`field-value ${cls || ''}`}>{value === '' ? '(없음)' : value}</pre>
    </div>
  );
}
