// Local lightweight apiFetch wrapper (removed external './http' import).
// We'll create a tiny wrapper around fetch for auth operations.
// Assumes NEXT_PUBLIC_API_BASE points to backend origin.
import { tokenStorage } from '@/lib/token-storage';

interface ApiFetchResult<T> { data: T }
interface ErrorAugmented extends Error { status?: number; data?: unknown }

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiFetchResult<T>> {
  const base = process.env.NEXT_PUBLIC_API_BASE || '';
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_BASE is not set. Create .env.local with NEXT_PUBLIC_API_BASE=http://localhost:4000');
  }
  
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  
  // Add JWT token to Authorization header if available
  const token = tokenStorage.get();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  let res: Response;
  try {
    res = await fetch(base + path, {
      credentials: 'include',
      headers,
      ...init
    });
  } catch (networkErr) {
    const err: ErrorAugmented = new Error('NETWORK_ERROR');
    err.status = 0;
    err.data = { cause: networkErr };
    throw err;
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  if (!res.ok) {
    // Clear token on 401
    if (res.status === 401) {
      tokenStorage.remove();
    }
    const record = (json as Record<string, unknown>) || {};
    // Nest can return { message: string | string[] }
    let message: string = 'UNKNOWN_ERROR';
    const rawMsg = record.message;
    if (typeof rawMsg === 'string') message = rawMsg;
    else if (Array.isArray(rawMsg) && rawMsg.length) message = rawMsg[0];
    else if (res.status === 404) message = 'Not found';
    const err: ErrorAugmented = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return { data: json as T };
}

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  provider: 'local' | 'google';
}

type UserEnvelope = { data: { user: AuthUser; accessToken?: string } }

export async function signupLocal(data: { username: string; email: string; password: string }): Promise<AuthUser> {
  const res = await apiFetch<UserEnvelope>('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
  // Save the JWT token
  if (res.data.data.accessToken) {
    tokenStorage.set(res.data.data.accessToken);
  }
  return res.data.data.user;
}

export async function loginLocal(data: { email: string; password: string }): Promise<AuthUser> {
  const res = await apiFetch<UserEnvelope>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  // Save the JWT token
  if (res.data.data.accessToken) {
    tokenStorage.set(res.data.data.accessToken);
  }
  return res.data.data.user;
}

export async function me(): Promise<AuthUser | null> {
  try {
    const res = await apiFetch<UserEnvelope>('/auth/me');
    console.log(res, 'me response')
    return res.data.data.user;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  tokenStorage.remove();
  await apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' });
  // Clear old cookies that might still be present from previous auth system
  if (typeof document !== 'undefined') {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'authp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  }
}
