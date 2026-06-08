import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' (상대경로)로 두면 GitHub Pages의 하위경로(/repo/)에서도,
// 로컬 정적 서버에서도 동일하게 동작한다.
export default defineConfig({
  base: './',
  plugins: [react()],
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 4000,
  },
});
