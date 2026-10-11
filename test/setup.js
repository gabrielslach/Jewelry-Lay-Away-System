import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { createStore, handleRequest } from '../mock-server/handleRequest.js';

let store;
let objectUrlSeq = 0;
const objectUrls = new Set();

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = (blob) => {
    objectUrlSeq += 1;
    const url = `blob:http://localhost/${objectUrlSeq}-${blob?.type || 'bin'}`;
    objectUrls.add(url);
    return url;
  };
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = (url) => {
    objectUrls.delete(url);
  };
}

beforeEach(() => {
  store = createStore();
  sessionStorage.clear();
  localStorage.clear();
  objectUrls.clear();
  objectUrlSeq = 0;
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
        headers: {
          get(name) {
            return name.toLowerCase() === 'content-type'
              ? 'application/json; charset=utf-8'
              : null;
          },
        },
        text: async () => JSON.stringify({ error: 'Not found' }),
        blob: async () =>
          new Blob([JSON.stringify({ error: 'Not found' })], {
            type: 'application/json',
          }),
      };
    }
    const contentType =
      result.headers?.['Content-Type'] || 'application/json; charset=utf-8';
    const payload = result.binary ? result.body : JSON.stringify(result.body);
    return {
      ok: result.status >= 200 && result.status < 300,
      status: result.status,
      headers: {
        get(name) {
          if (name.toLowerCase() === 'content-type') {
            return contentType;
          }
          return result.headers?.[name] ?? null;
        },
      },
      text: async () => (typeof payload === 'string' ? payload : String(payload)),
      blob: async () =>
        new Blob([payload], {
          type: result.binary ? contentType : 'application/json',
        }),
    };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});
