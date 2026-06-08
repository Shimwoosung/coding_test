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
const TOPIC_ORDER = ['binary_search', 'stack', 'queue', 'greedy', 'dp', 'implementation'];

export const topics: string[] = [
  ...TOPIC_ORDER.filter(t => problems.some(p => p.topic === t)),
  ...Array.from(new Set(problems.map(p => p.topic))).filter(t => !TOPIC_ORDER.includes(t)).sort(),
];

export const TOPIC_LABELS: Record<string, string> = {
  binary_search: '이분 탐색',
  stack: '스택',
  queue: '큐 / BFS',
  greedy: '그리디',
  dp: 'DP',
  implementation: '구현 / 시뮬',
};

export function problemsByTopic(topic: string): Problem[] {
  return problems.filter(p => p.topic === topic);
}
