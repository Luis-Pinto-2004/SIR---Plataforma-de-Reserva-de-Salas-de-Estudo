const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function withBase(path) {
  if (!API_BASE) return path;
  if (path.startsWith('http')) return path;
  return API_BASE + (path.startsWith('/') ? path : `/${path}`);
}


function buildUrl(path) {
  // Se já vier absoluto, não mexe
  if (/^https?:\/\//i.test(path)) return path;

  // path esperado: "/api/..."
  if (!API_BASE) return path;

  return `${API_BASE}${path}`;
}

export async function apiFetch(path, options = {}) {
  const url = buildUrl(path);

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch (_) {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
