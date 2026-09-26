export class ServiceError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

export async function request(path, { method = 'GET', token, body, headers } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ServiceError('Unable to reach the server. Check your connection and try again.');
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ServiceError('The server returned an unexpected response.', response.status);
    }
  }

  if (!response.ok) {
    const fallback =
      response.status === 429
        ? 'Too many attempts. Please wait a few minutes.'
        : response.status === 401
          ? 'Please sign in to continue.'
          : response.status === 403
            ? 'You do not have access to this record.'
            : response.status === 404
              ? 'We could not find that item.'
              : 'Something went wrong. Please try again.';
    throw new ServiceError(
      response.status === 429 ? fallback : data?.error || fallback,
      response.status,
    );
  }

  return data;
}
