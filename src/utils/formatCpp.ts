// 한 줄로 빽빽하게 저장된 C++ 코드를 줄바꿈/들여쓰기로 보기 좋게 정형화한다(표시용).
// 문자열/문자 리터럴, //·/* */ 주석, for(;;) 의 세미콜론, 전처리기(#)를 보존한다.
export function formatCpp(src: string): string {
  const s = src.replace(/\r\n/g, '\n');
  const n = s.length;
  let out = '';
  let indent = 0;
  let paren = 0;
  let atLineStart = true;

  const pad = () => '    '.repeat(Math.max(0, indent));
  const trimEnd = () => { out = out.replace(/[ \t]+$/, ''); };
  const newline = () => { trimEnd(); out += '\n'; atLineStart = true; };
  const start = () => { if (atLineStart) { out += pad(); atLineStart = false; } };

  let i = 0;
  while (i < n) {
    const c = s[i];

    // 공백/개행: 토큰 사이 한 칸으로 축약
    if (c === '\n' || c === ' ' || c === '\t' || c === '\r') {
      if (!atLineStart && !out.endsWith(' ') && !out.endsWith('\n')) out += ' ';
      i++; continue;
    }

    // 전처리기 지시문(#include 등): 한 줄 통째로
    if (c === '#' && atLineStart) {
      start();
      let j = i; while (j < n && s[j] !== '\n') j++;
      out += s.slice(i, j); newline(); i = j; continue;
    }

    // 한 줄 주석
    if (c === '/' && s[i + 1] === '/') {
      if (!atLineStart) { trimEnd(); out += '  '; } else start();
      let j = i; while (j < n && s[j] !== '\n') j++;
      out += s.slice(i, j); newline(); i = j; continue;
    }
    // 블록 주석
    if (c === '/' && s[i + 1] === '*') {
      start();
      let j = i + 2; while (j < n && !(s[j] === '*' && s[j + 1] === '/')) j++;
      j = Math.min(j + 2, n);
      out += s.slice(i, j); i = j; continue;
    }

    // 문자열/문자 리터럴
    if (c === '"' || c === "'") {
      start();
      const q = c; out += c; let j = i + 1;
      while (j < n) {
        const d = s[j]; out += d;
        if (d === '\\') { out += s[j + 1] ?? ''; j += 2; continue; }
        j++;
        if (d === q) break;
      }
      i = j; continue;
    }

    if (c === '{') {
      trimEnd();
      if (!atLineStart && !out.endsWith('\n')) out += ' ';
      else start();
      out += '{'; indent++; newline(); i++; continue;
    }

    if (c === '}') {
      if (!atLineStart) newline();
      indent = Math.max(0, indent - 1); out += pad() + '}'; atLineStart = false;
      i++;
      // 뒤따르는 ; 또는 , 를 붙임
      let k = i; while (k < n && (s[k] === ' ' || s[k] === '\t' || s[k] === '\n')) k++;
      if (s[k] === ';' || s[k] === ',') { out += s[k]; i = k + 1; }
      newline(); continue;
    }

    if (c === '(') { start(); out += '('; paren++; i++; continue; }
    if (c === ')') { start(); out += ')'; paren = Math.max(0, paren - 1); i++; continue; }

    if (c === ';') {
      start(); out += ';';
      i++;
      if (paren === 0) newline(); // for(;;) 안의 ; 는 줄바꿈 안 함
      continue;
    }

    start();
    out += c;
    i++;
  }

  return out.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim() + '\n';
}
