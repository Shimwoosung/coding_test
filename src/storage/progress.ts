// 진행상황 저장소: localStorage + (선택) GitHub Gist 자동 동기화.

import * as gist from './gist';

export interface ProblemProgress {
  solved: boolean;
  clearedAt?: number;
  code?: string;
  updatedAt: number;
}

export interface Progress {
  version: number;
  problems: Record<string, ProblemProgress>;
}

const LS_PROGRESS = 'cpp-trainer-progress-v1';
const LS_TOKEN = 'cpp-trainer-gh-token';
const LS_GISTID = 'cpp-trainer-gist-id';

export type SyncState = 'off' | 'syncing' | 'synced' | 'error';

function now() { return Date.now(); }

function emptyProgress(): Progress {
  return { version: 1, problems: {} };
}

function loadLocal(): Progress {
  try {
    const raw = localStorage.getItem(LS_PROGRESS);
    if (!raw) return emptyProgress();
    const p = JSON.parse(raw) as Progress;
    if (!p.problems) return emptyProgress();
    return p;
  } catch {
    return emptyProgress();
  }
}

function saveLocal(p: Progress) {
  localStorage.setItem(LS_PROGRESS, JSON.stringify(p));
}

let current: Progress = loadLocal();

// ---- 구독 ----
const listeners = new Set<() => void>();
export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function notify() { listeners.forEach(cb => cb()); }

// ---- 동기화 상태 ----
let syncState: SyncState = 'off';
let syncMessage = '';
const syncListeners = new Set<(s: SyncState, m: string) => void>();
export function onSyncStatus(cb: (s: SyncState, m: string) => void) {
  syncListeners.add(cb);
  cb(syncState, syncMessage);
  return () => { syncListeners.delete(cb); };
}
function setSync(s: SyncState, m = '') {
  syncState = s; syncMessage = m;
  syncListeners.forEach(cb => cb(s, m));
}

// ---- 조회/수정 ----
export function getProgress(): Progress { return current; }

export function getProblem(id: string): ProblemProgress | undefined {
  return current.problems[id];
}

export function isSolved(id: string): boolean {
  return !!current.problems[id]?.solved;
}

function setLocalAndPush(p: Progress) {
  current = p;
  saveLocal(current);
  notify();
  schedulePush();
}

export function saveCode(id: string, code: string) {
  const prev = current.problems[id];
  // 코드만 바뀐 경우는 localStorage 만 갱신하고 푸시는 디바운스.
  const next: ProblemProgress = {
    solved: prev?.solved ?? false,
    clearedAt: prev?.clearedAt,
    code,
    updatedAt: now(),
  };
  current = { ...current, problems: { ...current.problems, [id]: next } };
  saveLocal(current);
  notify();
  schedulePush();
}

export function markSolved(id: string, code: string) {
  const prev = current.problems[id];
  const next: ProblemProgress = {
    solved: true,
    clearedAt: prev?.clearedAt ?? now(),
    code,
    updatedAt: now(),
  };
  setLocalAndPush({ ...current, problems: { ...current.problems, [id]: next } });
}

// ---- 병합 ----
export function mergeProgress(a: Progress, b: Progress): Progress {
  const out: Progress = { version: 1, problems: {} };
  const ids = new Set([...Object.keys(a.problems), ...Object.keys(b.problems)]);
  for (const id of ids) {
    const pa = a.problems[id];
    const pb = b.problems[id];
    if (!pa) { out.problems[id] = pb; continue; }
    if (!pb) { out.problems[id] = pa; continue; }
    const newer = (pa.updatedAt || 0) >= (pb.updatedAt || 0) ? pa : pb;
    const older = newer === pa ? pb : pa;
    out.problems[id] = {
      solved: pa.solved || pb.solved, // 한 번 풀면 유지
      clearedAt: pa.clearedAt || pb.clearedAt,
      code: newer.code ?? older.code,
      updatedAt: Math.max(pa.updatedAt || 0, pb.updatedAt || 0),
    };
  }
  return out;
}

// ---- 수동 내보내기/가져오기 (백업용) ----
export function exportJson(): string {
  return JSON.stringify(current, null, 2);
}
export function importJson(json: string) {
  const incoming = JSON.parse(json) as Progress;
  if (!incoming.problems) throw new Error('형식이 올바르지 않습니다.');
  setLocalAndPush(mergeProgress(current, incoming));
}

// ---- Gist 토큰 ----
export function getToken(): string { return localStorage.getItem(LS_TOKEN) || ''; }
export function hasToken(): boolean { return !!getToken(); }
function getGistId(): string { return localStorage.getItem(LS_GISTID) || ''; }
function setGistId(id: string) { localStorage.setItem(LS_GISTID, id); }

export async function connectToken(token: string): Promise<void> {
  setSync('syncing', '토큰 확인 중…');
  const v = await gist.verifyToken(token);
  if (!v.ok) { setSync('error', v.error || '토큰이 유효하지 않습니다.'); throw new Error(v.error); }
  localStorage.setItem(LS_TOKEN, token);
  await fullSync();
}

export function disconnectToken() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_GISTID);
  setSync('off', '');
}

// 시작 시 / 토큰 연결 시 전체 동기화 (pull → merge → push)
export async function fullSync(): Promise<void> {
  const token = getToken();
  if (!token) { setSync('off', ''); return; }
  try {
    setSync('syncing', '동기화 중…');
    let gistId = getGistId();
    if (!gistId) {
      gistId = (await gist.findGistId(token)) || '';
      if (!gistId) gistId = await gist.createGist(token, current);
      setGistId(gistId);
    }
    const remote = await gist.pullGist(token, gistId);
    if (remote) {
      const merged = mergeProgress(current, remote);
      current = merged;
      saveLocal(current);
      notify();
    }
    await gist.pushGist(token, gistId, current);
    setSync('synced', '동기화됨 · ' + new Date().toLocaleTimeString());
  } catch (e: any) {
    setSync('error', String(e?.message || e));
  }
}

// 변경 시 디바운스 푸시
let pushTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePush() {
  if (!hasToken()) return;
  if (pushTimer) clearTimeout(pushTimer);
  setSync('syncing', '저장 중…');
  pushTimer = setTimeout(async () => {
    const token = getToken();
    let gistId = getGistId();
    try {
      if (!gistId) { await fullSync(); return; }
      await gist.pushGist(token, gistId, current);
      setSync('synced', '동기화됨 · ' + new Date().toLocaleTimeString());
    } catch (e: any) {
      setSync('error', String(e?.message || e));
    }
  }, 1500);
}

// 앱 시작 시 자동 동기화
export function initSync() {
  if (hasToken()) void fullSync();
}
