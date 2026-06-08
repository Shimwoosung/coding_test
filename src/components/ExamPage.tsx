import { useEffect, useState } from 'react';
import { examsById } from '../data/exams';
import { problemsById } from '../data/problems';
import { isSolved, subscribe } from '../storage/progress';
import { timer } from '../storage/timer';
import TimerWidget from './TimerWidget';
import type { View } from './Sidebar';

interface Props {
  id: string;
  onNavigate: (v: View) => void;
}

export function evaluate(solved: number, total: number): { grade: string; cls: string; msg: string } {
  const r = total ? solved / total : 0;
  if (r >= 1) return { grade: 'S', cls: 'pass', msg: '전부 해결! 실전에서도 통할 실력입니다. 시간 단축에 도전해보세요.' };
  if (r >= 0.7) return { grade: 'A', cls: 'pass', msg: '합격권입니다. 다만 틀린 유형은 반드시 복습하세요. 방심은 금물.' };
  if (r >= 0.5) return { grade: 'B', cls: 'warn', msg: '아슬아슬합니다. 이 정도로는 부족해요. 약한 유형을 집중 보강해야 합니다.' };
  if (r >= 0.3) return { grade: 'C', cls: 'fail', msg: '많이 부족합니다. 유형별 기초 문제부터 다시 쌓으세요. 더 풀어야 합니다.' };
  return { grade: 'D', cls: 'fail', msg: '아직 한참 멀었습니다. 개념 페이지부터 정독하고 매일 꾸준히 푸세요.' };
}

export default function ExamPage({ id, onNavigate }: Props) {
  const exam = examsById[id];
  const [, force] = useState(0);
  const [graded, setGraded] = useState(false);

  useEffect(() => subscribe(() => force(n => n + 1)), []);

  if (!exam) return <div className="page"><p>모의고사를 찾을 수 없습니다: {id}</p></div>;

  const probs = exam.problemIds.map(pid => problemsById[pid]).filter(Boolean);
  const solvedCount = probs.filter(p => isSolved(p.id)).length;
  const evalResult = evaluate(solvedCount, probs.length);

  function startExam() {
    timer.startMinutes(exam.timeLimitMinutes, `모의고사 · ${exam.affiliate || exam.group}`);
    setGraded(false);
  }

  return (
    <div className="page exam-page">
      <div className="exam-header">
        <div className="exam-badges">
          <span className="badge group">{exam.group}</span>
          {exam.affiliate && exam.affiliate !== exam.group && <span className="badge">{exam.affiliate}</span>}
          <span className="badge time">⏱ 제한 {exam.timeLimitMinutes}분</span>
          <span className="badge">{probs.length}문제</span>
        </div>
        <h1>{exam.title}</h1>
        {exam.description && <p className="exam-desc">{exam.description}</p>}
        <div className="exam-actions">
          <button className="primary big" onClick={startExam}>▶ 시험 시작 (타이머 {exam.timeLimitMinutes}분)</button>
          <button className="big" onClick={() => setGraded(true)}>채점하기</button>
          <TimerWidget inline />
        </div>
      </div>

      {graded && (
        <div className={`exam-result ${evalResult.cls}`}>
          <div className="exam-grade">{evalResult.grade}</div>
          <div className="exam-result-body">
            <div className="exam-score">{solvedCount} / {probs.length} 해결</div>
            <div className="exam-eval">{evalResult.msg}</div>
          </div>
        </div>
      )}

      <div className="exam-list">
        {probs.map((p, i) => {
          const done = isSolved(p.id);
          return (
            <div key={p.id} className={`exam-item ${done ? 'done' : ''}`}>
              <span className="exam-num">{i + 1}</span>
              <span className={`check ${done ? 'on' : ''}`}>{done ? '✓' : '○'}</span>
              <span className="exam-item-title">{p.title}</span>
              <span className="lv">Lv.{p.level}</span>
              <button className="solve-btn" onClick={() => onNavigate({ kind: 'problem', id: p.id })}>
                {done ? '다시 풀기' : '풀기 →'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="exam-foot">
        ※ “시험 시작”을 누르면 우상단 타이머가 제한시간으로 시작됩니다. 각 문제를 풀고( ✔ 제출로 클리어 ),
        돌아와 “채점하기”로 점수와 평가를 확인하세요. 진행상황은 자동 저장·동기화됩니다.
      </p>
    </div>
  );
}
