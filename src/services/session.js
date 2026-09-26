const KEY = 'customerSession';

export function getCustomerSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCustomerSession(session) {
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearCustomerSession() {
  sessionStorage.removeItem(KEY);
}

export function getCustomerToken() {
  return getCustomerSession()?.token ?? null;
}

const ADMIN_KEY = 'adminSession';

export function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(session) {
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify(session));
}

export function getAdminToken() {
  return getAdminSession()?.token ?? null;
}
