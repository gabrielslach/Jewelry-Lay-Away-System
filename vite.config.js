import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mockApiPlugin } from './mock-server/plugin.js';

// Live backend from specs/api-definition.md Section 1 (sandbox — will move before go-live).
const LIVE_API_BASE = 'https://honeydew-stork-999262.hostingersite.com';

// `npm run dev:live` sets this to talk to the real backend instead of mock-server.
const useMock = process.env.VITE_MOCK_API !== 'false';

export default defineConfig({
  plugins: [react(), ...(useMock ? [mockApiPlugin()] : [])],
  server: useMock
    ? undefined
    : {
        proxy: {
          '/api': { target: LIVE_API_BASE, changeOrigin: true },
        },
      },
  test: {
    environment: 'jsdom',
    setupFiles: './test/setup.js',
    include: ['test/**/*.test.{js,jsx}'],
  },
});
