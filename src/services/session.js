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

const LEGACY_ADMIN_KEY = 'adminSession';
const ADMIN_KEY = 'admin';
const ADMIN_REFRESH_KEY = 'adminRefreshToken';
const ADMIN_ACCESS_KEY = 'adminAccessToken';

sessionStorage.removeItem(LEGACY_ADMIN_KEY);

export function getAdmin() {
  if (!localStorage.getItem(ADMIN_REFRESH_KEY)) {
    return null;
  }
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY));
  } catch {
    return null;
  }
}

export function isAdminRole() {
  return (getAdmin()?.role ?? 'admin') === 'admin';
}

export function getAdminSession() {
  const admin = getAdmin();
  return admin ? { admin } : null;
}

export function setAdminSession({ access_token, refresh_token, admin }) {
  localStorage.setItem(ADMIN_REFRESH_KEY, refresh_token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  sessionStorage.setItem(ADMIN_ACCESS_KEY, access_token);
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_REFRESH_KEY);
  localStorage.removeItem(ADMIN_KEY);
  sessionStorage.removeItem(ADMIN_ACCESS_KEY);
  sessionStorage.removeItem(LEGACY_ADMIN_KEY);
}

export function getAdminToken() {
  return sessionStorage.getItem(ADMIN_ACCESS_KEY);
}

export function setAdminToken(accessToken) {
  sessionStorage.setItem(ADMIN_ACCESS_KEY, accessToken);
}

export function getAdminRefreshToken() {
  return localStorage.getItem(ADMIN_REFRESH_KEY);
}
