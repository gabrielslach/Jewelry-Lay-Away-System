import { describe, expect, it, vi } from 'vitest';
import { request, ServiceError } from '../../src/services/http.js';

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
