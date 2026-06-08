import { useState } from 'react';

interface Props {
  title: string;
  code: string;
  onClose: () => void;
}

export default function SolutionModal({ title, code, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal solution-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>💡 모범답안 — {title}</h2>
          <div className="modal-head-actions">
            <button onClick={copy}>{copied ? '복사됨 ✓' : '코드 복사'}</button>
            <button className="x" onClick={onClose}>✕</button>
          </div>
        </div>
        <pre className="solution-modal-code">{code}</pre>
        <p className="solution-modal-foot">막혔을 때 참고하고, 직접 다시 짜보며 익히는 걸 추천해요.</p>
      </div>
    </div>
  );
}
