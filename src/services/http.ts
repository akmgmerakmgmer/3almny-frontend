// Centralized HTTP helper with 401 redirect logic
// Ensures any API call that gets a 401 navigates user to login preserving lang.

interface HttpOptions extends RequestInit {
  raw?: boolean; // if true, skip json parsing and return Response
  redirectOn401?: boolean; // allow disabling redirect for certain calls
}

export async function http<T=any>(path: string, opts: HttpOptions = {}): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE || '';
  if (!base) throw new Error('Missing NEXT_PUBLIC_API_BASE');
  const res = await fetch(base + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (res.status === 401 && opts.redirectOn401 !== false && typeof window !== 'undefined') {
    // Derive language from current path (/en/... or /ar/...) fallback en
    const match = window.location.pathname.match(/^\/(en|ar)\b/);
    const lang = match ? match[1] : 'en';
    const loginUrl = `/${lang}/login`;
    if (window.location.pathname !== loginUrl) {
      window.location.replace(loginUrl);
    }
    throw new Error('UNAUTHORIZED');
  }
  if (opts.raw) return res as any;
  let json: any = {};
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok) {
    const msg = json?.message || `Request failed ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  // Backward compatible response handling:
  // - Standard pattern: { success, data }
  // - Pagination pattern: { success, data: [...], total, limit, offset, nextOffset }
  // If pagination metadata is present, return the full envelope so callers can access it.
  if (json && typeof json === 'object' && 'data' in json && Array.isArray(json.data) && ('total' in json || 'limit' in json)) {
    return json as T; // pagination envelope
  }
  return (json?.data ?? json) as T;
}
// Generic fetch wrapper with credentials to backend.
// Expects NEXT_PUBLIC_API_BASE env var.

export interface ApiSuccess<T> { success?: boolean; data?: T; [k: string]: unknown }
export interface ApiErrorShape { success?: false; error?: { message?: string; [k: string]: unknown } }

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}) : Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  const res = await fetch(base + path, {
    ...init,
    headers,
    credentials: 'include',
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    const maybeErr = json as ApiErrorShape;
    const message = maybeErr?.error?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}
