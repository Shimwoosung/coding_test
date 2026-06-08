import { problems, stages } from '../data/problems';
import { concepts } from '../data/concepts';
import type { View } from './Sidebar';

interface Props {
  onNavigate: (v: View) => void;
  solvedIds: Set<string>;
}

export default function Home({ onNavigate, solvedIds }: Props) {
  const done = problems.filter(p => solvedIds.has(p.id)).length;
  return (
    <div className="page home">
      <h1>C++ 코딩테스트 연습 🧑‍💻</h1>
      <p className="lead">
        브라우저에서 바로 C++를 컴파일·실행하고 테스트케이스로 채점하는 학습 도구입니다.
        설치 없이(서버·g++ 불필요) 동작하며, 진행상황은 GitHub Gist로 어디서든 동기화됩니다.
      </p>

      <div className="home-cards">
        <div className="home-card">
          <div className="big">{done}/{problems.length}</div>
          <div>클리어한 문제</div>
        </div>
        <div className="home-card">
          <div className="big">{concepts.length}</div>
          <div>개념 페이지</div>
        </div>
        <div className="home-card">
          <div className="big">{stages.length}</div>
          <div>단계</div>
        </div>
      </div>

      <h2>이렇게 사용하세요</h2>
      <ol className="howto">
        <li>왼쪽 <b>개념</b>에서 알고리즘을 익힙니다.</li>
        <li><b>문제</b>를 골라 가운데 에디터에 C++를 작성합니다.</li>
        <li><b>▶ 실행</b>으로 예제를, <b>✔ 제출</b>로 숨김 테스트까지 채점합니다.</li>
        <li>전부 통과하면 문제가 클리어됩니다.</li>
      </ol>

      <h2>바로 시작</h2>
      <div className="quick-list">
        {problems.slice(0, 6).map(p => (
          <button key={p.id} className="quick-item" onClick={() => onNavigate({ kind: 'problem', id: p.id })}>
            <span className={`check ${solvedIds.has(p.id) ? 'on' : ''}`}>{solvedIds.has(p.id) ? '✓' : '○'}</span>
            {p.title} <span className="lv">Lv.{p.level}</span>
          </button>
        ))}
      </div>

      <p className="first-run-note">
        ⏳ <b>최초 1회</b> 문제를 실행하면 C++ 컴파일러(clang/libc++, 약 60MB)를 내려받습니다.
        이후에는 브라우저 캐시에서 빠르게 동작합니다.
      </p>
    </div>
  );
}
