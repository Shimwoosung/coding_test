import { useEffect, useState } from 'react';
import { timer, fmtTime, type TimerState } from '../storage/timer';

// 타이머. inline=true 면 툴바/화면에 박아 넣어 버튼을 가리지 않는다(전역 상태 공유).
export default function TimerWidget({ inline = false }: { inline?: boolean }) {
  const [st, setSt] = useState<TimerState>(timer.get());
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(60);

  useEffect(() => timer.subscribe(setSt), []);

  const low = st.remainingSec > 0 && st.remainingSec <= 60;
  const active = st.totalSec > 0;

  return (
    <div className={`timer-widget ${inline ? 'inline' : ''} ${st.finished ? 'finished' : ''} ${low ? 'low' : ''}`}>
      <button className="timer-face" onClick={() => setOpen(o => !o)} title="타이머">
        <span className="t-ico">⏱</span>
        <span className="t-time">
          {st.finished ? '시간 종료!' : active ? fmtTime(st.remainingSec) : '타이머'}
        </span>
        {st.running && <span className="t-dot" />}
      </button>

      {open && (
        <div className="timer-panel">
          <div className="t-presets">
            {[30, 60, 90, 120].map(m => (
              <button key={m} onClick={() => timer.startMinutes(m, '')}>{m}분</button>
            ))}
          </div>
          <div className="t-custom">
            <input
              type="number" min={1} max={600} value={custom}
              onChange={e => setCustom(Math.max(1, Math.min(600, Number(e.target.value) || 1)))}
            />
            <span>분</span>
            <button className="primary" onClick={() => timer.startMinutes(custom, '')}>설정 후 시작</button>
          </div>
          <div className="t-controls">
            {st.running
              ? <button onClick={() => timer.pause()}>⏸ 일시정지</button>
              : <button onClick={() => timer.start()} disabled={st.remainingSec <= 0}>▶ 시작</button>}
            <button onClick={() => timer.reset()} disabled={!active}>↺ 리셋</button>
            <button onClick={() => timer.clear()}>✕ 끄기</button>
          </div>
          {st.label && <div className="t-label">{st.label}</div>}
        </div>
      )}
    </div>
  );
}
