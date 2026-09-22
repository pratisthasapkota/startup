const TOKEN_KEY = 'vm_access_token';

const BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export const setToken = (token) => {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

let refreshPromise = null;

async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok || !json.data?.accessToken) throw new ApiError('Session expired', r.status);
        setToken(json.data.accessToken);
        return json.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export const api = async (path, { method = 'GET', body, auth = true, retry = true } = {}) => {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Is the API running?', 0);
  }

  if (res.status === 401 && auth && retry) {
    try {
      await tryRefresh();
      return api(path, { method, body, auth, retry: false });
    } catch {
      setToken(null);
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(json.message || `Request failed (${res.status})`, res.status, json.details);
  }
  return json;
};

export const uploadImages = async (files) => {
  const form = new FormData();
  files.forEach((f) => form.append('images', f));
  const token = getToken();
  const res = await fetch(`${BASE}/uploads/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.message || 'Upload failed', res.status, json.details);
  return json.data.urls;
};

export const fmtError = (err) => {
  if (err instanceof ApiError) return err.message;
  if (err?.message) return err.message;
  return 'Something went wrong';
};