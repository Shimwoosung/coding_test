// 문제/개념 데이터 및 실행 결과 타입 정의

export type ProblemMode = 'stdio' | 'function';

export interface IoDescription {
  input: string;
  output: string;
}

export interface StdioExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface FunctionExample {
  args: unknown[];
  output: string;
  explanation?: string;
}

export interface ParamDef {
  type: string;
  name: string;
}

export interface Signature {
  returnType: string;
  name: string;
  params: ParamDef[];
}

export interface Problem {
  id: string;
  title: string;
  stage: number;
  level: number;
  topic: string;
  concept: string;
  mode: ProblemMode;
  description: string;
  constraints?: string[];
  ioDescription?: IoDescription;
  signature?: Signature;
  boilerplate: string;
  examples: (StdioExample | FunctionExample)[];
  hiddenTests: (StdioExample | FunctionExample)[];
  hints?: string[];
  solution?: string;
  timeLimit?: number;       // 실행 시간 제한(ms). 없으면 기본값(러너에서 적용)
  difficulty?: Difficulty;  // 명시 안 하면 stage로부터 유추
}

export type Difficulty = '기초' | '중간' | '심화';

// 회사/계열사별 모의고사
export interface Exam {
  id: string;
  group: string;          // 그룹사 (예: 'LG', '현대', '한화', 'SK', 'NC', 'LIG넥스원')
  affiliate?: string;     // 계열사 (예: 'LG CNS', '현대오토에버')
  round?: number;         // 회차 (1~5)
  title: string;
  timeLimitMinutes: number;
  description?: string;
  problemIds: string[];   // 기존 문제 id 참조
}

export interface ExamResult {
  examId: string;
  solvedIds: string[];
  total: number;
  durationSec: number;
  finishedAt: number;
}

export interface Concept {
  id: string; // 파일명 (확장자 제외) — problem.concept 와 매칭
  title: string;
  body: string; // 마크다운 원문
}

// ---- 실행/채점 결과 ----

export interface CaseResult {
  index: number;
  pass: boolean;
  input: string; // 보여줄 입력(또는 인자 표현)
  expected: string;
  actual: string;
  error?: string | null;
}

export interface RunOutcome {
  ok: boolean; // 컴파일 성공 여부
  compileError?: string;
  cases: CaseResult[];
  passedCount: number;
  totalCount: number;
}

// ---- 워커 프로토콜 ----

export interface WorkerRunRequest {
  type: 'run';
  id: number;
  source: string;
  // 각 실행에 주입할 stdin 목록. function 모드는 보통 단일 항목(인자를 소스에 박음).
  stdins: string[];
}

export interface WorkerRunResult {
  type: 'result';
  id: number;
  compileError?: string;
  // stdins 와 1:1 대응하는 실행 결과
  runs?: { stdout: string; error: string | null }[];
}
