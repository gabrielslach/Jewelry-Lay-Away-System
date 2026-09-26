import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mockApiPlugin } from './mock-server/plugin.js';

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.js',
    include: ['test/**/*.test.{js,jsx}'],
  },
});
