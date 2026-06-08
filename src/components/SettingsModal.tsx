import { useState } from 'react';
import {
  getToken, connectToken, disconnectToken, fullSync,
  exportJson, importJson, hasToken,
} from '../storage/progress';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const [token, setToken] = useState(getToken());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const connected = hasToken();

  async function connect() {
    setBusy(true); setMsg('');
    try {
      await connectToken(token.trim());
      setMsg('연결 및 동기화 완료 ✓');
    } catch (e: any) {
      setMsg('실패: ' + String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  function disconnect() {
    disconnectToken();
    setToken('');
    setMsg('연결 해제됨');
  }

  async function syncNow() {
    setBusy(true); setMsg('');
    await fullSync();
    setMsg('동기화 완료 ✓');
    setBusy(false);
  }

  function doExport() {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cpp-trainer-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function doImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importJson(String(reader.result));
        setMsg('가져오기 완료 ✓');
      } catch (err: any) {
        setMsg('가져오기 실패: ' + String(err?.message || err));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>진행상황 동기화 설정</h2>
          <button className="x" onClick={onClose}>✕</button>
        </div>

        <section>
          <h3>GitHub Gist 자동 동기화</h3>
          <p className="hint">
            회사·집 어디서든 진행상황을 공유하려면 GitHub 토큰을 한 번 입력하세요.
            진행상황이 <b>비공개 Gist</b>에 자동 저장/복원됩니다.
          </p>
          <ol className="hint small">
            <li>
              <a href="https://github.com/settings/tokens/new?scopes=gist&description=cpp-trainer" target="_blank" rel="noreferrer">
                토큰 발급 페이지 열기 (gist 권한만 체크)
              </a>
            </li>
            <li>생성된 <code>ghp_...</code> 토큰을 아래에 붙여넣고 “연결”</li>
          </ol>
          <div className="row">
            <input
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={e => setToken(e.target.value)}
              className="token-input"
            />
            {connected
              ? <button onClick={disconnect} disabled={busy}>연결 해제</button>
              : <button onClick={connect} disabled={busy || !token.trim()} className="primary">연결</button>}
          </div>
          {connected && (
            <div className="row">
              <button onClick={syncNow} disabled={busy}>지금 동기화</button>
            </div>
          )}
          <p className="hint tiny">
            ※ 토큰은 이 브라우저에만 저장됩니다(localStorage). 공용 PC라면 사용 후 “연결 해제”를 권장합니다.
          </p>
        </section>

        <section>
          <h3>수동 백업 (토큰 없이)</h3>
          <div className="row">
            <button onClick={doExport}>진행상황 내보내기 (.json)</button>
            <label className="file-btn">
              가져오기
              <input type="file" accept="application/json" onChange={doImport} hidden />
            </label>
          </div>
        </section>

        {msg && <div className="modal-msg">{msg}</div>}
      </div>
    </div>
  );
}
