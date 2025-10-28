// Centralized HTTP helper with 401 redirect logic
// Ensures any API call that gets a 401 navigates user to login preserving lang.

import { tokenStorage } from '@/lib/token-storage';

interface HttpOptions extends RequestInit {
  raw?: boolean; // if true, skip json parsing and return Response
  redirectOn401?: boolean; // allow disabling redirect for certain calls
}

export async function http<T = unknown>(path: string, opts: HttpOptions = {}): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE || '';
  if (!base) throw new Error('Missing NEXT_PUBLIC_API_BASE');
  
  const headers = new Headers(opts.headers);
  headers.set('Content-Type', 'application/json');
  
  // Add JWT token to Authorization header if available
  const token = tokenStorage.get();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const res = await fetch(base + path, {
    credentials: 'include',
    headers,
    ...opts,
  });
  if (res.status === 401 && opts.redirectOn401 !== false && typeof window !== 'undefined') {
    // Clear invalid token
    tokenStorage.remove();
    // Derive language from current path (/en/... or /ar/...) fallback en
    const match = window.location.pathname.match(/^\/(en|ar)\b/);
    const lang = match ? match[1] : 'en';
    const loginUrl = `/${lang}/login`;
    if (window.location.pathname !== loginUrl) {
      window.location.replace(loginUrl);
    }
    throw new Error('UNAUTHORIZED');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (opts.raw) return res as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any = {};
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok) {
    const msg = json?.message || `Request failed ${res.status}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
