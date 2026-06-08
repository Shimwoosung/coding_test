// dist/ 를 gh-pages 브랜치로 직접 푸시한다.
// GitHub Actions 워크플로 파일이 필요 없어 토큰의 workflow 권한 없이도 배포 가능.
// 사용: npm run deploy:pages  (vite build 후 자동 실행)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const REMOTE = 'https://github.com/Shimwoosung/coding_test.git';

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('✗ dist/index.html 이 없습니다. 먼저 `npm run build` 를 실행하세요.');
  process.exit(1);
}

// GitHub Pages 의 Jekyll 처리(_로 시작하는 경로 무시) 방지
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

const run = (cmd) => execSync(cmd, { cwd: DIST, stdio: 'inherit' });
const clean = () => fs.rmSync(path.join(DIST, '.git'), { recursive: true, force: true });

try {
  clean();
  run('git init -q');
  run('git checkout -q -b gh-pages');
  run('git add -A');
  run('git -c user.email=deploy@local -c user.name=deploy commit -q -m "deploy gh-pages"');
  console.log('\n· gh-pages 브랜치 푸시 중… (에셋 60MB, 잠시 걸립니다)');
  run(`git push -f -q ${REMOTE} gh-pages`);
  console.log('\n✅ gh-pages 푸시 완료. (GitHub → Settings → Pages → Deploy from a branch → gh-pages / root)');
} finally {
  clean();
}
