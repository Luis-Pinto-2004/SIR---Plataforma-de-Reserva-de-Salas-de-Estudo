const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function getFallbackToken() {
  try {
    return localStorage.getItem('studyspace_token');
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Token apenas como fallback. Se existir, envia como Bearer (o backend continua a privilegiar o cookie HTTP-only).
  const token = getFallbackToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers
  });

  if (!res.ok) {
    let error = 'Request failed';
    try {
      const data = await res.json();
      error = data?.error || error;
    } catch {
      // ignore
    }
    throw new Error(error);
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json();
}
