import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/preview/visualization',
  build: {
    outDir: '../../dist/preview',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {},
  },
});
