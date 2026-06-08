import type { Exam } from '../types';

// src/exams/*.json 을 자동 수집한다. 파일 추가만으로 모의고사가 늘어난다.
const modules = import.meta.glob<{ default: Exam }>('../exams/*.json', { eager: true });

export const exams: Exam[] = Object.values(modules)
  .map(m => m.default)
  .sort((a, b) => a.group.localeCompare(b.group) || (a.affiliate || '').localeCompare(b.affiliate || '') || a.title.localeCompare(b.title));

export const examsById: Record<string, Exam> = Object.fromEntries(exams.map(e => [e.id, e]));

// 그룹사 → 모의고사 목록
export function examsByGroup(): { group: string; list: Exam[] }[] {
  const groups: string[] = [];
  const map: Record<string, Exam[]> = {};
  for (const e of exams) {
    if (!map[e.group]) { map[e.group] = []; groups.push(e.group); }
    map[e.group].push(e);
  }
  return groups.map(g => ({ group: g, list: map[g] }));
}
