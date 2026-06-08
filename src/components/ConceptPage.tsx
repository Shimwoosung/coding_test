import { conceptsById } from '../data/concepts';
import { problems } from '../data/problems';
import Markdown from './Markdown';
import type { View } from './Sidebar';

interface Props {
  id: string;
  onNavigate: (v: View) => void;
}

export default function ConceptPage({ id, onNavigate }: Props) {
  const concept = conceptsById[id];
  if (!concept) return <div className="page"><p>개념 페이지를 찾을 수 없습니다: {id}</p></div>;

  const related = problems.filter(p => p.concept === id);

  return (
    <div className="page concept-page">
      <Markdown>{concept.body}</Markdown>

      {related.length > 0 && (
        <div className="related">
          <h3>관련 문제</h3>
          <ul>
            {related.map(p => (
              <li key={p.id}>
                <button className="link" onClick={() => onNavigate({ kind: 'problem', id: p.id })}>
                  {p.title} <span className="lv">Lv.{p.level}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
