import type { Concept } from '../types';

// src/concepts/*.md 를 원문(raw)으로 수집한다. 파일 추가만으로 개념 페이지가 늘어난다.
const modules = import.meta.glob<string>('../concepts/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function fileId(path: string): string {
  const m = path.match(/\/([^/]+)\.md$/);
  return m ? m[1] : path;
}

function firstHeading(body: string, fallback: string): string {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

export const concepts: Concept[] = Object.entries(modules)
  .map(([path, body]) => {
    const id = fileId(path);
    return { id, title: firstHeading(body, id), body };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export const conceptsById: Record<string, Concept> = Object.fromEntries(
  concepts.map(c => [c.id, c]),
);
