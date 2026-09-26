import { request, ServiceError } from './http.js';
import { refreshCustomerToken } from './refreshCustomerToken.js';
import { getCustomerRefreshToken, getCustomerToken } from './session.js';

let pendingRefresh = null;

function signInRequired() {
  return new ServiceError('Please sign in to continue.', 401);
}

async function refreshAccessToken() {
  if (!getCustomerRefreshToken()) {
    throw signInRequired();
  }
  pendingRefresh ??= refreshCustomerToken().finally(() => {
    pendingRefresh = null;
  });
  try {
    return await pendingRefresh;
  } catch (err) {
    throw err.status === 401 ? signInRequired() : err;
  }
}

export async function customerRequest(path, options = {}) {
  const token = getCustomerToken() ?? (await refreshAccessToken());
  try {
    return await request(path, { ...options, token });
  } catch (err) {
    if (err.status !== 401) {
      throw err;
    }
  }
  const freshToken = await refreshAccessToken();
  try {
    return await request(path, { ...options, token: freshToken });
  } catch (err) {
    throw err.status === 401 ? signInRequired() : err;
  }
}
