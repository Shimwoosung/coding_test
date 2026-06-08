// Electron 메인 프로세스.
// 검증된 'vite preview' 환경을 그대로 재현하기 위해, dist/ 를 고정 포트의 로컬 HTTP 서버로
// 서빙하고 그 URL을 로드한다. (compileStreaming 이 요구하는 application/wasm MIME, 모듈 워커,
// 그리고 고정 origin 덕분에 localStorage(진행상황) 영속까지 모두 보장된다.)

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

const DIST = path.join(__dirname, '..', 'dist');
const HOST = '127.0.0.1';
const PORT = 41730; // 고정 포트 → origin 고정 → localStorage 유지

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.tar': 'application/x-tar',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
      const filePath = path.normalize(path.join(DIST, urlPath));
      if (!filePath.startsWith(DIST)) { res.writeHead(403); res.end('forbidden'); return; }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, {
          'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
          'cache-control': 'no-cache',
        });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(PORT, HOST, () => resolve());
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 900,
    minHeight: 600,
    title: 'C++ 코딩테스트 연습',
    backgroundColor: '#0d1117',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.removeMenu();
  win.loadURL(`http://${HOST}:${PORT}/`);

  // 외부 링크(토큰 발급 페이지 등)는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://' + HOST)) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  try {
    await startServer();
  } catch (e) {
    // 포트가 이미 쓰이는 중이면 그대로 로드 시도(이미 떠 있는 서버 재사용)
    console.error('정적 서버 시작 실패(포트 사용 중일 수 있음):', e);
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
