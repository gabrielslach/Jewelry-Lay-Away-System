export function returnPath(from) {
  if (!from?.startsWith('/')) {
    return '/account';
  }
  try {
    const url = new URL(from, window.location.origin);
    const path = url.pathname + url.search + url.hash;
    return url.origin === window.location.origin && !path.startsWith('//')
      ? path
      : '/account';
  } catch {
    return '/account';
  }
}
