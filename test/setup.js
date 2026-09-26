import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { createStore, handleRequest } from '../mock-server/handleRequest.js';

let store;

beforeEach(() => {
  store = createStore();
  sessionStorage.clear();
  vi.stubGlobal('fetch', async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const headers = init.headers || {};
    const result = handleRequest(store, {
      method: init.method || 'GET',
      url,
      headers,
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    if (!result) {
      return {
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: 'Not found' }),
      };
    }
    return {
      ok: result.status >= 200 && result.status < 300,
      status: result.status,
      text: async () => JSON.stringify(result.body),
    };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});
