export function returnPath(from, fallback = '/account') {
  if (!from?.startsWith('/')) {
    return fallback;
  }
  try {
    const url = new URL(from, window.location.origin);
    const path = url.pathname + url.search + url.hash;
    return url.origin === window.location.origin && !path.startsWith('//')
      ? path
      : fallback;
  } catch {
    return fallback;
  }
}

/** Safe return path for admin login — only /admin* (not the login page itself). */
export function adminReturnPath(from) {
  const path = returnPath(from, '/admin');
  if (!path.startsWith('/admin') || path.startsWith('/admin/login')) {
    return '/admin';
  }
  return path;
}
