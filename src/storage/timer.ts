// 전역 타이머 스토어. 카운트다운(타이머) 용도.
// 문제를 이동해도 유지되도록 App 최상위에서 한 번만 렌더링되는 위젯이 구독한다.

export interface TimerState {
  running: boolean;
  remainingSec: number;
  totalSec: number;
  finished: boolean;
  label: string; // 예: '모의고사: LG' 또는 ''
}

let state: TimerState = { running: false, remainingSec: 0, totalSec: 0, finished: false, label: '' };
const listeners = new Set<(s: TimerState) => void>();
let interval: ReturnType<typeof setInterval> | null = null;

function emit() {
  const snap = { ...state };
  listeners.forEach(l => l(snap));
}

function tick() {
  if (!state.running) return;
  state.remainingSec = Math.max(0, state.remainingSec - 1);
  if (state.remainingSec === 0) {
    state.running = false;
    state.finished = true;
    if (interval) { clearInterval(interval); interval = null; }
  }
  emit();
}

function ensureInterval() {
  if (!interval) interval = setInterval(tick, 1000);
}

export const timer = {
  get(): TimerState { return { ...state }; },
  subscribe(cb: (s: TimerState) => void) {
    listeners.add(cb);
    cb({ ...state });
    return () => { listeners.delete(cb); };
  },
  setMinutes(min: number, label = '') {
    const sec = Math.max(0, Math.round(min * 60));
    state = { running: false, remainingSec: sec, totalSec: sec, finished: false, label };
    emit();
  },
  startMinutes(min: number, label = '') {
    this.setMinutes(min, label);
    this.start();
  },
  start() {
    if (state.remainingSec <= 0) return;
    state.running = true;
    state.finished = false;
    ensureInterval();
    emit();
  },
  pause() {
    state.running = false;
    emit();
  },
  reset() {
    state.running = false;
    state.finished = false;
    state.remainingSec = state.totalSec;
    emit();
  },
  clear() {
    state = { running: false, remainingSec: 0, totalSec: 0, finished: false, label: '' };
    if (interval) { clearInterval(interval); interval = null; }
    emit();
  },
};

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
