import { useEffect, useState } from 'react';
import Sidebar, { type View } from './components/Sidebar';
import Home from './components/Home';
import ConceptPage from './components/ConceptPage';
import ProblemPage from './components/ProblemPage';
import SettingsModal from './components/SettingsModal';
import { problems } from './data/problems';
import {
  subscribe, getProgress, initSync, onSyncStatus, type SyncState,
} from './storage/progress';
import { warmupCompiler } from './compiler/runner';

export default function App() {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [solvedIds, setSolvedIds] = useState<Set<string>>(() => collectSolved());
  const [sync, setSync] = useState<{ state: SyncState; msg: string }>({ state: 'off', msg: '' });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => subscribe(() => setSolvedIds(collectSolved())), []);
  useEffect(() => onSyncStatus((state, msg) => setSync({ state, msg })), []);
  useEffect(() => { initSync(); }, []);
  // 앱 로드 후 백그라운드로 컴파일러 미리 받기(최초 실행 대기 단축)
  useEffect(() => { const t = setTimeout(() => warmupCompiler(), 1200); return () => clearTimeout(t); }, []);

  return (
    <div className="app">
      <Sidebar
        view={view}
        onNavigate={setView}
        solvedIds={solvedIds}
        syncState={sync.state}
        syncMessage={sync.msg}
        onOpenSettings={() => setShowSettings(true)}
      />
      <main className="content">
        {view.kind === 'home' && <Home onNavigate={setView} solvedIds={solvedIds} />}
        {view.kind === 'concept' && <ConceptPage id={view.id} onNavigate={setView} />}
        {view.kind === 'problem' && <ProblemPage key={view.id} id={view.id} onNavigate={setView} />}
      </main>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function collectSolved(): Set<string> {
  const p = getProgress();
  const s = new Set<string>();
  for (const prob of problems) if (p.problems[prob.id]?.solved) s.add(prob.id);
  return s;
}
