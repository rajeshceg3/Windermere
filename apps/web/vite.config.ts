import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@windermere/engine': path.resolve(__dirname, '../../packages/engine/src'),
      '@windermere/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@windermere/audio': path.resolve(__dirname, '../../packages/audio/src'),
      '@windermere/shaders': path.resolve(__dirname, '../../packages/shaders/src'),
    },
  },
});
