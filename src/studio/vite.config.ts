import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: path.resolve(__dirname),
  base: './',
  build: {
    outDir: path.resolve(__dirname, '../../dist/studio'),
    emptyOutDir: true
  },
  server: {
    port: 50096,
    proxy: {
      '/api': 'http://localhost:50096'
    }
  }
});
