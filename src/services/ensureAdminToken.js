import { request, ServiceError } from './http.js';
import { refreshAdminToken } from './refreshAdminToken.js';
import {
  clearAdminSession,
  getAdminRefreshToken,
  getAdminToken,
  setAdminSession,
} from './session.js';
import { emitSessionExpired } from './sessionExpired.js';

/** Test/dev helper: mints a staff session via the mock. Do not call from SPA request paths. */
export async function ensureAdminToken() {
  const existing = getAdminToken();
  if (existing) {
    return existing;
  }
  const data = await request('/api/dev/session/admin', { method: 'POST', body: {} });
  setAdminSession(data);
  return data.access_token;
}

function signInRequired() {
  return new ServiceError('Please sign in to continue.', 401);
}

function sessionExpired() {
  emitSessionExpired('admin');
  return signInRequired();
}

let pendingRefresh = null;

async function refreshAccessToken() {
  if (!getAdminRefreshToken()) {
    clearAdminSession();
    throw signInRequired();
  }
  pendingRefresh ??= refreshAdminToken().finally(() => {
    pendingRefresh = null;
  });
  try {
    return await pendingRefresh;
  } catch (err) {
    throw err.status === 401 ? sessionExpired() : err;
  }
}

export async function withAdminAuth(run) {
  const token = getAdminToken() ?? (await refreshAccessToken());
  try {
    return await run(token);
  } catch (err) {
    if (err.status !== 401) {
      throw err;
    }
  }
  const freshToken = await refreshAccessToken();
  try {
    return await run(freshToken);
  } catch (err) {
    throw err.status === 401 ? sessionExpired() : err;
  }
}

export async function adminRequest(path, options = {}) {
  return withAdminAuth((token) => request(path, { ...options, token }));
}
