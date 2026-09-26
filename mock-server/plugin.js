import { Buffer } from 'node:buffer';
import { createStore, handleRequest } from './handleRequest.js';

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve(undefined);
        return;
      }
      const type = req.headers['content-type'] || '';
      if (type.includes('application/json')) {
        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(error);
        }
        return;
      }
      if (type.includes('multipart/form-data')) {
        const fields = {};
        for (const [key, value] of new URLSearchParams(raw.replace(/\r\n/g, '&'))) {
          fields[key] = value;
        }
        const named = [...raw.matchAll(/name="([^"]+)"\r\n\r\n([^\r]*)/g)];
        named.forEach((hit) => {
          fields[hit[1]] = hit[2];
        });
        resolve(fields);
        return;
      }
      resolve({ raw });
    });
    req.on('error', reject);
  });
}

export function mockApiPlugin() {
  const store = createStore();
  async function middleware(req, res, next) {
    const url = req.url || '';
    if (!url.startsWith('/api')) {
      next();
      return;
    }
    let body;
    try {
      body = await readBody(req);
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    const result = handleRequest(store, {
      method: req.method,
      url,
      headers: req.headers,
      body,
      ip: req.socket?.remoteAddress || '127.0.0.1',
    });
    if (!result) {
      next();
      return;
    }
    res.statusCode = result.status;
    Object.entries(result.headers).forEach(([key, value]) => res.setHeader(key, value));
    res.end(JSON.stringify(result.body));
  }
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
