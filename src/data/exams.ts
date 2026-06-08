import type { Exam } from '../types';

// src/exams/*.json 을 자동 수집한다. 파일 추가만으로 모의고사가 늘어난다.
const modules = import.meta.glob<{ default: Exam }>('../exams/*.json', { eager: true });

export const exams: Exam[] = Object.values(modules)
  .map(m => m.default)
  .sort((a, b) => a.group.localeCompare(b.group) || (a.affiliate || '').localeCompare(b.affiliate || '') || a.title.localeCompare(b.title));

export const examsById: Record<string, Exam> = Object.fromEntries(exams.map(e => [e.id, e]));

// 그룹사 → 계열사 → 회차 목록 (사이드바 트리)
export interface ExamAffiliate { affiliate: string; list: Exam[]; }
export interface ExamGroup { group: string; affiliates: ExamAffiliate[]; }

export function examTree(): ExamGroup[] {
  const groups: ExamGroup[] = [];
  const gmap: Record<string, ExamGroup> = {};
  const amap: Record<string, ExamAffiliate> = {};
  for (const e of exams) {
    let g = gmap[e.group];
    if (!g) { g = { group: e.group, affiliates: [] }; gmap[e.group] = g; groups.push(g); }
    const aff = e.affiliate || e.group;
    const akey = e.group + '||' + aff;
    let a = amap[akey];
    if (!a) { a = { affiliate: aff, list: [] }; amap[akey] = a; g.affiliates.push(a); }
    a.list.push(e);
  }
  for (const g of groups) for (const a of g.affiliates) a.list.sort((x, y) => (x.round || 0) - (y.round || 0));
  return groups;
}
