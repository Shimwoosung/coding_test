import type { Problem } from '../types';

// src/problems/*.json 을 빌드 시 자동 수집한다. 파일 추가만으로 문제가 늘어난다.
const modules = import.meta.glob<{ default: Problem }>('../problems/*.json', { eager: true });

export const problems: Problem[] = Object.values(modules)
  .map(m => m.default)
  .sort((a, b) => (a.stage - b.stage) || a.id.localeCompare(b.id));

export const problemsById: Record<string, Problem> = Object.fromEntries(
  problems.map(p => [p.id, p]),
);

// 토픽(개념) 단위로 묶어 보여준다. stage 는 토픽 내부 난이도(0~5)로 사용.
// 학습 순서(기초 → 자료구조 → 전략 → 그래프)로 정렬.
const TOPIC_ORDER = [
  // 기초
  'implementation', 'sorting', 'binary_search', 'two_pointer', 'prefix_sum',
  // 자료구조
  'stack', 'queue', 'hash',
  // 전략
  'greedy', 'dp', 'backtracking', 'bitmask',
  // 그래프
  'graph', 'shortest_path', 'dsu', 'tree',
];

export const topics: string[] = [
  ...TOPIC_ORDER.filter(t => problems.some(p => p.topic === t)),
  ...Array.from(new Set(problems.map(p => p.topic))).filter(t => !TOPIC_ORDER.includes(t)).sort(),
];

export const TOPIC_LABELS: Record<string, string> = {
  implementation: '구현 / 시뮬',
  sorting: '정렬',
  binary_search: '이분 탐색',
  two_pointer: '투 포인터',
  prefix_sum: '누적 합',
  stack: '스택',
  queue: '큐 / BFS',
  hash: '해시',
  greedy: '그리디',
  dp: 'DP',
  backtracking: '백트래킹',
  bitmask: '비트마스크',
  graph: '그래프',
  shortest_path: '최단 경로',
  dsu: '분리집합 (DSU)',
  tree: '트리',
};

export function problemsByTopic(topic: string): Problem[] {
  return problems.filter(p => p.topic === topic);
}
