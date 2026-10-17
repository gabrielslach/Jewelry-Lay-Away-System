export class ServiceError extends Error {
  constructor(message, status = null, fields = null, expectedAmount = null) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.fields = fields;
    this.expectedAmount = expectedAmount;
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');

function apiUrl(path) {
  if (!API_BASE || !path.startsWith('/')) {
    return path;
  }
  return `${API_BASE}${path}`;
}

const STATUS_MESSAGES = {
  401: 'Please sign in to continue.',
  403: 'You do not have access to this record.',
  404: 'We could not find that item.',
};

function failure(status, data) {
  if (status === 429) {
    return new ServiceError('Too many attempts. Please wait a few minutes.', status);
  }
  const fallback = STATUS_MESSAGES[status] ?? 'Something went wrong. Please try again.';
  return new ServiceError(data?.error || fallback, status, data?.fields ?? null, data?.expected_amount ?? null);
}

export async function request(path, { method = 'GET', token, body, headers } = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
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
    throw failure(response.status, data);
  }

  return data;
}

export async function requestForm(path, { method = 'POST', token, formData } = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
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
    throw failure(response.status, data);
  }

  return data;
}

export async function requestBlob(path, { method = 'GET', token, headers } = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ServiceError('Unable to reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // Non-JSON error bodies still map to status fallbacks.
      }
    }
    throw failure(response.status, data);
  }

  const headerType =
    response.headers?.get?.('Content-Type') ?? response.headers?.get?.('content-type') ?? '';
  const contentType = headerType.split(';')[0].trim();
  const blob = await response.blob();
  return { blob, contentType: contentType || blob.type || null };
}
