import { useEffect, useRef, useState } from 'react';
import type { Problem, RunOutcome, StdioExample, FunctionExample } from '../types';
import { problemsById } from '../data/problems';
import { conceptsById } from '../data/concepts';
import { runProblem, onRunnerStatus } from '../compiler/runner';
import { getProblem, saveCode, markSolved, isSolved } from '../storage/progress';
import CodeEditor from './CodeEditor';
import ResultPanel from './ResultPanel';
import Markdown from './Markdown';
import type { View } from './Sidebar';

interface Props {
  id: string;
  onNavigate: (v: View) => void;
}

export default function ProblemPage({ id, onNavigate }: Props) {
  const problem = problemsById[id] as Problem | undefined;

  const [code, setCode] = useState(() => getProblem(id)?.code ?? problem?.boilerplate ?? '');
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [mode, setMode] = useState<'run' | 'submit' | null>(null);
  const [toolStatus, setToolStatus] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [solved, setSolvedState] = useState(() => isSolved(id));

  // 패널 크기(드래그로 조절, localStorage에 기억)
  const workRef = useRef<HTMLDivElement>(null);
  const [descWidth, setDescWidth] = useState(() => clampNum(localStorage.getItem('cpp-desc-w'), 360, 220, 760));
  const [resultHeight, setResultHeight] = useState(() => clampNum(localStorage.getItem('cpp-result-h'), 220, 90, 700));
  useEffect(() => { localStorage.setItem('cpp-desc-w', String(descWidth)); }, [descWidth]);
  useEffect(() => { localStorage.setItem('cpp-result-h', String(resultHeight)); }, [resultHeight]);

  function startVDrag(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX, startW = descWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const move = (ev: MouseEvent) => setDescWidth(Math.max(220, Math.min(760, startW + (ev.clientX - startX))));
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  }
  function startHDrag(e: React.MouseEvent) {
    e.preventDefault();
    const startY = e.clientY, startH = resultHeight;
    const maxH = (workRef.current?.clientHeight ?? 800) - 170;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    const move = (ev: MouseEvent) => setResultHeight(Math.max(90, Math.min(Math.max(140, maxH), startH + (startY - ev.clientY))));
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  }

  useEffect(() => onRunnerStatus((_s, m) => setToolStatus(m)), []);

  if (!problem) return <div className="page"><p>문제를 찾을 수 없습니다: {id}</p></div>;

  function updateCode(v: string) {
    setCode(v);
    saveCode(id, v);
  }

  async function handleRun() {
    setRunning(true);
    setMode('run');
    setOutcome(null);
    try {
      const res = await runProblem(problem!, code, problem!.examples);
      setOutcome(res);
    } catch (e: any) {
      setOutcome({ ok: false, compileError: String(e?.message || e), cases: [], passedCount: 0, totalCount: 0 });
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    setRunning(true);
    setMode('submit');
    setOutcome(null);
    try {
      const all = [...problem!.examples, ...problem!.hiddenTests];
      const res = await runProblem(problem!, code, all);
      setOutcome(res);
      if (res.ok && res.passedCount === res.totalCount && res.totalCount > 0) {
        markSolved(id, code);
        setSolvedState(true);
      }
    } catch (e: any) {
      setOutcome({ ok: false, compileError: String(e?.message || e), cases: [], passedCount: 0, totalCount: 0 });
    } finally {
      setRunning(false);
    }
  }

  function resetCode() {
    if (confirm('작성한 코드를 보일러플레이트로 되돌릴까요?')) {
      updateCode(problem!.boilerplate);
    }
  }

  const concept = conceptsById[problem.concept];

  return (
    <div className="problem-layout" style={{ gridTemplateColumns: `${descWidth}px 6px minmax(0, 1fr)` }}>
      {/* 좌: 문제 설명 */}
      <div className="pane desc-pane">
        <div className="prob-header">
          <h1>{problem.title}</h1>
          <div className="prob-meta">
            <span className="badge">Lv.{problem.level}</span>
            <span className="badge mode">{problem.mode === 'stdio' ? '입출력(cin/cout)' : '함수 구현'}</span>
            {solved && <span className="badge solved">✓ 클리어</span>}
            {concept && (
              <button className="badge link" onClick={() => onNavigate({ kind: 'concept', id: concept.id })}>
                📖 {concept.title}
              </button>
            )}
          </div>
        </div>

        <Markdown>{problem.description}</Markdown>

        {problem.signature && (
          <Section title="함수 시그니처">
            <pre className="sig">
              {problem.signature.returnType} {problem.signature.name}(
              {problem.signature.params.map(p => `${p.type} ${p.name}`).join(', ')})
            </pre>
          </Section>
        )}

        {problem.constraints && problem.constraints.length > 0 && (
          <Section title="제한사항">
            <ul>{problem.constraints.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </Section>
        )}

        {problem.ioDescription && (
          <Section title="입출력 설명">
            <p><b>입력:</b> {problem.ioDescription.input}</p>
            <p><b>출력:</b> {problem.ioDescription.output}</p>
          </Section>
        )}

        <Section title="예제">
          {problem.examples.map((ex, i) => (
            <ExampleView key={i} ex={ex} index={i} mode={problem.mode} />
          ))}
        </Section>

        {problem.hints && problem.hints.length > 0 && (
          <details className="hints">
            <summary>💡 힌트 ({problem.hints.length})</summary>
            <ol>{problem.hints.map((h, i) => <li key={i}>{h}</li>)}</ol>
          </details>
        )}

        {problem.solution && (
          <details className="solution" open={showSolution}>
            <summary onClick={(e) => { e.preventDefault(); setShowSolution(s => !s); }}>
              {solved ? '✅ 모범답안 보기' : '🔒 모범답안 보기 (막혔을 때만)'}
            </summary>
            <pre className="solution-code">{problem.solution}</pre>
          </details>
        )}
      </div>

      {/* 좌우 너비 조절 핸들 */}
      <div className="vsplit" onMouseDown={startVDrag} title="좌우 너비 조절" />

      {/* 우측 작업영역: 에디터(위) + 결과 터미널(아래) */}
      <div className="work-pane" ref={workRef}>
        <div className="editor-toolbar">
          <span className="file-name">solution.cpp</span>
          <span className="zoom-hint">Ctrl + 휠 = 글씨 크기</span>
          <div className="spacer" />
          <button onClick={resetCode} className="ghost">초기화</button>
          <button onClick={handleRun} disabled={running} className="run">▶ 실행</button>
          <button onClick={handleSubmit} disabled={running} className="submit">✔ 제출</button>
        </div>
        <div className="editor-host">
          <CodeEditor value={code} onChange={updateCode} />
        </div>
        {/* 높이 조절 핸들 */}
        <div className="hsplit" onMouseDown={startHDrag} title="에디터 / 결과 높이 조절">
          <span className="grip" />
        </div>
        <div className="result-host" style={{ height: resultHeight }}>
          <ResultPanel running={running} outcome={outcome} mode={mode} toolStatus={toolStatus} />
        </div>
      </div>
    </div>
  );
}

function clampNum(v: string | null, d: number, min: number, max: number): number {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function ExampleView({ ex, index, mode }: { ex: StdioExample | FunctionExample; index: number; mode: string }) {
  if (mode === 'function') {
    const f = ex as FunctionExample;
    return (
      <div className="example">
        <div className="ex-num">예제 {index + 1}</div>
        <div className="ex-grid">
          <div><span className="ex-label">인자</span><pre>{JSON.stringify(f.args)}</pre></div>
          <div><span className="ex-label">반환</span><pre>{f.output}</pre></div>
        </div>
        {f.explanation && <div className="ex-expl">{f.explanation}</div>}
      </div>
    );
  }
  const s = ex as StdioExample;
  return (
    <div className="example">
      <div className="ex-num">예제 {index + 1}</div>
      <div className="ex-grid">
        <div><span className="ex-label">입력</span><pre>{s.input}</pre></div>
        <div><span className="ex-label">출력</span><pre>{s.output}</pre></div>
      </div>
      {s.explanation && <div className="ex-expl">{s.explanation}</div>}
    </div>
  );
}
