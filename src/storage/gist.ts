// GitHub Gist 를 이용한 진행상황 동기화 (백엔드 없이 클라우드 저장).
// 토큰은 'gist' 스코프만 있으면 된다. 비공개 Gist 1개를 만들어 progress.json 을 저장한다.

import type { Progress } from './progress';

const GIST_DESC = 'cpp-trainer-progress (do not delete)';
const GIST_FILENAME = 'cpp-trainer-progress.json';
const API = 'https://api.github.com';

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
}

export async function verifyToken(token: string): Promise<{ ok: boolean; login?: string; error?: string }> {
  try {
    const r = await fetch(`${API}/user`, { headers: headers(token) });
    if (!r.ok) return { ok: false, error: `토큰 검증 실패 (HTTP ${r.status})` };
    const j = await r.json();
    return { ok: true, login: j.login };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export async function findGistId(token: string): Promise<string | null> {
  const r = await fetch(`${API}/gists?per_page=100`, { headers: headers(token) });
  if (!r.ok) throw new Error(`Gist 목록 조회 실패 (HTTP ${r.status})`);
  const list = await r.json();
  for (const g of list) {
    if (g.description === GIST_DESC && g.files && g.files[GIST_FILENAME]) return g.id;
  }
  return null;
}

export async function createGist(token: string, progress: Progress): Promise<string> {
  const r = await fetch(`${API}/gists`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      description: GIST_DESC,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(progress, null, 2) } },
    }),
  });
  if (!r.ok) throw new Error(`Gist 생성 실패 (HTTP ${r.status})`);
  const j = await r.json();
  return j.id;
}

export async function pullGist(token: string, gistId: string): Promise<Progress | null> {
  const r = await fetch(`${API}/gists/${gistId}`, { headers: headers(token) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Gist 불러오기 실패 (HTTP ${r.status})`);
  const j = await r.json();
  const file = j.files?.[GIST_FILENAME];
  if (!file) return null;
  let content = file.content as string;
  // 큰 파일은 truncated 될 수 있어 raw_url 로 다시 받는다.
  if (file.truncated && file.raw_url) {
    const rr = await fetch(file.raw_url);
    content = await rr.text();
  }
  try {
    return JSON.parse(content) as Progress;
  } catch {
    return null;
  }
}

export async function pushGist(token: string, gistId: string, progress: Progress): Promise<void> {
  const r = await fetch(`${API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(progress, null, 2) } },
    }),
  });
  if (!r.ok) throw new Error(`Gist 저장 실패 (HTTP ${r.status})`);
}
