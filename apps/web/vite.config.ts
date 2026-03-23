import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import sri from 'rollup-plugin-sri';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    {
      enforce: 'post',
      ...sri({ publicPath: '/' }),
    },
  ],
  build: {
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
      },
    },
  },
  resolve: {
    alias: {
      '@windermere/engine': path.resolve(__dirname, '../../packages/engine/src'),
      '@windermere/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@windermere/audio': path.resolve(__dirname, '../../packages/audio/src'),
      '@windermere/shaders': path.resolve(__dirname, '../../packages/shaders/src'),
    },
  },
});
