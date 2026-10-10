import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { createStore, handleRequest } from '../mock-server/handleRequest.js';

let store;

beforeEach(() => {
  store = createStore();
  sessionStorage.clear();
  localStorage.clear();
  vi.stubGlobal('scrollTo', vi.fn(() => Promise.resolve()));
  vi.stubGlobal('fetch', async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const headers = init.headers || {};
    let body;
    if (init.body instanceof FormData) {
      body = {};
      init.body.forEach((value, key) => {
        body[key] = value;
      });
    } else if (init.body) {
      body = JSON.parse(init.body);
    }
    const result = handleRequest(store, {
      method: init.method || 'GET',
      url,
      headers,
      body,
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
