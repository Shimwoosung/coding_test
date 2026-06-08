# C++ 코딩테스트 연습 (cpp-coding-trainer)

브라우저에서 **바로 C++를 컴파일·실행**하며 코딩테스트(프로그래머스 2~3레벨 느낌)를 단계별로 푸는 학습 도구입니다.

- **백엔드 서버 없음 · g++ 설치 없음.** 브라우저만 있으면 회사·집 어디서든 동작.
- C++ 실행은 **브라우저 내 WASM clang + libc++** ([binji/wasm-clang](https://github.com/binji/wasm-clang) 기반)로 처리 — `vector / stack / queue / map / set / algorithm(sort, lower_bound)` 등 **full STL** 지원, `#include <bits/stdc++.h>` 도 사용 가능.
- 진행상황은 **GitHub Gist 자동 동기화**(토큰 한 번 입력) 또는 JSON 내보내기/가져오기로 어디서든 공유.
- 코드 에디터는 **Monaco**(VSCode 엔진), 문제/개념은 폴더에 파일만 추가하면 자동 수집.

> 최초 1회 문제를 실행할 때 컴파일러(clang/libc++, 약 60MB)를 내려받고, 이후에는 브라우저 캐시로 빠르게 동작합니다.

---

## 빌드 / 실행

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # 정적 빌드 → dist/
npm run preview    # 빌드 결과 미리보기 (정적 서버)
```

> `dist/index.html` 을 `file://` 로 직접 여는 방식은 브라우저 보안정책(WASM/worker 로드 제한) 때문에 권장하지 않습니다.
> **로컬에서 열려면** `npm run preview` 같은 정적 서버를 쓰거나, 아래 GitHub Pages 배포를 사용하세요.

---

## 어디서든 쓰기 (GitHub Pages 배포 + 진행상황 동기화)

### 1) GitHub Pages 자동 배포
1. 이 폴더를 GitHub 저장소에 푸시합니다(아래 “최초 업로드” 참고).
2. 저장소 **Settings → Pages → Build and deployment → Source 를 “GitHub Actions”** 로 설정.
3. `main`(또는 `master`)에 푸시하면 `.github/workflows/deploy.yml` 이 자동으로 빌드/배포합니다.
4. 배포 후 `https://<유저명>.github.io/<저장소명>/` 으로 접속 — 회사·집 브라우저 어디서든 사용.

> `vite.config.ts` 의 `base: './'` (상대경로)라 저장소 하위경로에서도 그대로 동작합니다.

### 2) 진행상황 동기화 (GitHub Gist)
앱 좌측 하단 **“동기화 설정”** → GitHub 토큰(`gist` 권한만) 입력 → “연결”.
- 진행상황(푼 문제·작성 코드)이 **비공개 Gist** 에 자동 저장/복원됩니다.
- 회사·집 양쪽에서 같은 토큰을 넣으면 자동으로 동기화됩니다.
- 토큰 없이 쓰려면 같은 화면의 **내보내기/가져오기(.json)** 를 사용하세요.
- ⚠️ 토큰은 해당 브라우저(localStorage)에만 저장됩니다. 공용 PC라면 사용 후 “연결 해제”.

### 최초 업로드 (예시)
```bash
git init
git add .
git commit -m "init: C++ coding trainer"
git branch -M main
git remote add origin https://github.com/<유저명>/<저장소명>.git
git push -u origin main
```

---

## 문제 추가하기

`src/problems/` 에 JSON 파일을 추가하면 빌드 시 자동 수집됩니다(`import.meta.glob`). 파일명은 자유.

### 공통 필드
| 필드 | 설명 |
|---|---|
| `id` | 고유 ID (저장 키) |
| `title` | 문제 제목 |
| `stage` | 단계 0~5 (사이드바 그룹) |
| `level` | 난이도(1~5, 표시용) |
| `topic` / `concept` | 개념 파일명(확장자 제외)과 매칭 → 문제↔개념 링크 |
| `mode` | `"stdio"` 또는 `"function"` |
| `description` | 문제 본문 (마크다운) |
| `constraints` | 제한사항 문자열 배열(선택) |
| `boilerplate` | 에디터 초기 코드 |
| `examples` | 화면에 보이는 예제 |
| `hiddenTests` | 제출 시에만 채점하는 숨김 테스트 |
| `hints` | 힌트 배열(선택) |
| `solution` | 모범답안(선택, 클리어 후 공개 권장) |

### `mode: "stdio"` — cin/cout 방식 (백준/기출 스타일)
`examples`/`hiddenTests` 항목은 `{ "input": "...", "output": "...", "explanation"? }`.
출력은 **트레일링 공백/개행을 정규화**해서 비교합니다.

```json
{
  "id": "binary_search_01", "mode": "stdio",
  "ioDescription": { "input": "첫 줄에 N", "output": "정수 제곱근" },
  "examples": [{ "input": "16\n", "output": "4\n" }],
  "hiddenTests": [{ "input": "1000000000\n", "output": "31622\n" }]
}
```

### `mode: "function"` — 함수 구현 (프로그래머스 스타일)
`signature` 로 함수 시그니처를 정의하고, 항목은 `{ "args": [...], "output": "기대 반환값", "explanation"? }`.
앱이 숨겨진 `main` 을 붙여 각 케이스를 호출하고 반환값을 비교합니다.

```json
{
  "id": "stack_01", "mode": "function",
  "signature": { "returnType": "bool", "name": "solution",
                 "params": [{ "type": "string", "name": "s" }] },
  "examples": [{ "args": ["()()"], "output": "true" }],
  "hiddenTests": [{ "args": ["((("], "output": "false" }]
}
```

**지원 타입**: `int`, `long long`, `double`, `float`, `bool`, `char`, `string`,
그리고 이들의 중첩 `vector<...>` (예: `vector<int>`, `vector<vector<int>>`, `vector<string>`).
반환값 출력 포맷 — `bool`→`true`/`false`, 숫자→10진수, 문자열→원문,
`vector`→`[a,b,c]` (비교 시 공백은 무시됩니다).

---

## 개념 페이지 추가하기
`src/concepts/` 에 `.md` 파일을 추가하면 자동 수집됩니다. 파일명(확장자 제외)이 개념 ID이며,
문제의 `concept` 값과 같으면 문제↔개념이 서로 링크됩니다. 첫 번째 `# 제목` 이 메뉴 제목이 됩니다.

---

## 기술 스택 / 구조
- **Vite + React + TypeScript** (정적 빌드 `dist/` 단독 동작)
- **Monaco Editor** (C++ 하이라이팅, 워커 번들 포함 → 오프라인)
- **WASM 컴파일러**: `public/clang/` 의 `clang.wasm · lld.wasm · memfs.wasm · sysroot.tar`
  - `src/compiler/wasmClang.ts` — binji/wasm-clang 의 `shared.js` 를 ES 모듈로 적응(로그/출력 분리, `-std=gnu++17`, builtins 링크 추가)
  - `src/compiler/compiler.worker.ts` — 컴파일/실행 전용 Web Worker
  - `src/compiler/runner.ts` — 소스 전처리(`bits/stdc++.h`), function 모드 하니스 생성, 출력 정규화/채점
- 진행상황: `src/storage/progress.ts`(localStorage) + `src/storage/gist.ts`(GitHub Gist)

라이선스: 컴파일러 에셋은 Apache-2.0 / LLVM (binji/wasm-clang).
