const listeners = { customer: new Set(), admin: new Set() };

export function emitSessionExpired(scope) {
  listeners[scope].forEach((listener) => listener());
}

export function subscribeSessionExpired(scope, listener) {
  listeners[scope].add(listener);
  return () => listeners[scope].delete(listener);
}
