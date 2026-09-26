const LEGACY_KEY = 'customerSession';
const CUSTOMER_KEY = 'customer';
const REFRESH_KEY = 'customerRefreshToken';
const ACCESS_KEY = 'customerAccessToken';

sessionStorage.removeItem(LEGACY_KEY);

const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeCustomerSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCustomer() {
  if (!localStorage.getItem(REFRESH_KEY)) {
    return null;
  }
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY));
  } catch {
    return null;
  }
}

export function setCustomerSession({ access_token, refresh_token, customer }) {
  localStorage.setItem(REFRESH_KEY, refresh_token);
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  sessionStorage.setItem(ACCESS_KEY, access_token);
  notify();
}

export function clearCustomerSession() {
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  notify();
}

export function getCustomerToken() {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function setCustomerToken(accessToken) {
  sessionStorage.setItem(ACCESS_KEY, accessToken);
}

export function getCustomerRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
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
