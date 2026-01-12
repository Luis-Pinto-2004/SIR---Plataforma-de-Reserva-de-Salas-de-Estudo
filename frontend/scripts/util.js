// Utility functions for StudySpace frontend

// Perform a fetch with JSON parsing and credentials enabled
export async function apiFetch(path, options = {}) {
  const opts = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  if (opts.body && typeof opts.body !== 'string') {
    opts.body = JSON.stringify(opts.body);
  }
  const resp = await fetch(path, opts);
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(json.error || json.message || 'Error');
  }
  return json;
}

// Get current authenticated user
export async function getCurrentUser() {
  try {
    const data = await apiFetch('/api/auth/me', { method: 'GET' });
    return data.user;
  } catch (err) {
    return null;
  }
}

// Subscribe to server‑sent events
export function subscribeToEvents(onEvent) {
  const ev = new EventSource('/socket.io');
  ev.addEventListener('booking:created', e => {
    const data = JSON.parse(e.data);
    onEvent('booking:created', data);
  });
  ev.addEventListener('booking:updated', e => {
    const data = JSON.parse(e.data);
    onEvent('booking:updated', data);
  });
  ev.addEventListener('booking:cancelled', e => {
    const data = JSON.parse(e.data);
    onEvent('booking:cancelled', data);
  });
  ev.onerror = () => {
    console.error('EventSource error');
  };
  return ev;
}

// Simple UI helpers
export function showError(message) {
  alert(message);
}

export function redirect(url) {
  window.location.href = url;
}