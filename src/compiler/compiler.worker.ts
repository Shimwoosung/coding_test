// @ts-nocheck
// C++ 컴파일/실행 전용 Web Worker.
// 메인 스레드를 막지 않도록 무거운 clang/lld 작업을 여기서 수행한다.

import { API } from './wasmClang';

let api: any = null;
let initPromise: Promise<void> | null = null;

// hostWrite: 프로그램 stdout/stderr + 컴파일러 진단 → 현재 캡처 버퍼에 누적
let captureBuf = '';
const hostWrite = (s: string) => { captureBuf += s; };
// hostLog: 상태 메시지 → 진행상황만 메인 스레드에 통지(채점에는 미사용)
const hostLog = (s: string) => { (self as any).postMessage({ type: 'log', text: s }); };

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

// compileStreaming 이 거부되는 환경(일부 프로토콜/MIME)을 대비해 arrayBuffer 컴파일로 폴백.
async function compileWasm(url: string): Promise<WebAssembly.Module> {
  try {
    return await WebAssembly.compileStreaming(fetch(url));
  } catch {
    const buf = await (await fetch(url)).arrayBuffer();
    return await WebAssembly.compile(buf);
  }
}

function initApi(base: string): Promise<void> {
  if (initPromise) return initPromise;
  api = new API({
    readBuffer: (f: string) => fetch(base + f).then(r => r.arrayBuffer()),
    compileStreaming: (f: string) => compileWasm(base + f),
    hostWrite,
    hostLog,
    clang: 'clang.wasm',
    lld: 'lld.wasm',
    memfs: 'memfs.wasm',
    sysroot: 'sysroot.tar',
  });
  initPromise = api.ready;
  return initPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === 'init') {
    try {
      await initApi(msg.base);
      (self as any).postMessage({ type: 'ready' });
    } catch (err: any) {
      (self as any).postMessage({ type: 'initError', error: String(err?.message || err) });
    }
    return;
  }

  if (msg.type === 'run') {
    const { id, source, stdins } = msg;
    try {
      await initApi(msg.base);
    } catch (err: any) {
      (self as any).postMessage({ type: 'result', id, compileError: '툴체인 초기화 실패: ' + String(err?.message || err) });
      return;
    }

    // 1) 컴파일 + 링크 (1회)
    captureBuf = '';
    let mod: WebAssembly.Module;
    try {
      await api.compile({ input: 'prog.cc', contents: source, obj: 'prog.o' });
      await api.link('prog.o', 'prog.wasm');
      const u8 = api.memfs.getFileContents('prog.wasm');
      const copy = u8.slice(); // memfs 메모리 detach 방지용 복사
      mod = await WebAssembly.compile(copy);
    } catch (err: any) {
      const diag = stripAnsi(captureBuf).trim();
      (self as any).postMessage({
        type: 'result',
        id,
        compileError: diag || ('컴파일 실패: ' + String(err?.message || err)),
      });
      return;
    }

    // 컴파일 성공 알림 → 메인 스레드가 여기서부터 시간초과 워치독을 시작
    (self as any).postMessage({ type: 'compiled', id });

    // 2) 각 stdin 으로 실행 (케이스별로 즉시 전송 → 메인이 진행상황 추적/TLE 판정)
    for (let i = 0; i < stdins.length; i++) {
      captureBuf = '';
      api.memfs.setStdinStr(stdins[i] || '');
      let error: string | null = null;
      try {
        await api.run(mod, 'prog.wasm');
      } catch (ex: any) {
        if (!(ex && typeof ex.code === 'number' && ex.code === 0)) {
          error = stripAnsi(String(ex?.message || ex));
        }
      }
      (self as any).postMessage({ type: 'case', id, index: i, stdout: captureBuf, error });
    }

    (self as any).postMessage({ type: 'done', id });
    return;
  }
};
