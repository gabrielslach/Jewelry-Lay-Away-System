import { describe, expect, it, vi } from 'vitest';
import { request, requestBlob, ServiceError } from '../../src/services/http.js';

describe('http request', () => {
  it('maps a failed response to ServiceError', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: 'boom' }),
    }));
    await expect(request('/api/x')).rejects.toMatchObject({
      name: 'ServiceError',
      message: 'boom',
      status: 500,
    });
    expect(new ServiceError('x', 400)).toBeInstanceOf(Error);
  });
});

describe('http requestBlob', () => {
  it('returns blob and content type without JSON-parsing the body', async () => {
    const bytes = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      headers: {
        get(name) {
          return name.toLowerCase() === 'content-type' ? 'image/svg+xml' : null;
        },
      },
      blob: async () => new Blob([bytes], { type: 'image/svg+xml' }),
      text: async () => bytes,
    }));
    const result = await requestBlob('/api/admin/payments/1/proof', { token: 't' });
    expect(result.contentType).toBe('image/svg+xml');
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob.size).toBe(bytes.length);
    expect(result.blob.type).toBe('image/svg+xml');
  });

  it('maps JSON error bodies to ServiceError', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: 'Not found' }),
    }));
    await expect(requestBlob('/api/admin/payments/99/proof')).rejects.toMatchObject({
      name: 'ServiceError',
      message: 'Not found',
      status: 404,
    });
  });
});
