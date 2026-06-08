import type { Problem } from '../types';

// src/problems/*.json 을 빌드 시 자동 수집한다. 파일 추가만으로 문제가 늘어난다.
const modules = import.meta.glob<{ default: Problem }>('../problems/*.json', { eager: true });

export const problems: Problem[] = Object.values(modules)
  .map(m => m.default)
  .sort((a, b) => (a.stage - b.stage) || a.id.localeCompare(b.id));

export const problemsById: Record<string, Problem> = Object.fromEntries(
  problems.map(p => [p.id, p]),
);

export const stages: number[] = Array.from(new Set(problems.map(p => p.stage))).sort((a, b) => a - b);
