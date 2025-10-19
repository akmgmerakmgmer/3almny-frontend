"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { me, loginLocal, signupLocal, logout as apiLogout, type AuthUser } from '@/services/auth';
import { getCurrentUser, updateUserPreferences, type User, type UpdateUserPreferencesRequest } from '@/services/users';
import { usePathname } from 'next/navigation';

interface AuthContextValue {
  user: AuthUser | null;
  fullUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (username: string, email: string, password: string) => Promise<AuthUser>;
  refresh: () => Promise<void>;
  refreshFullUser: () => Promise<void>;
  updatePreferences: (preferences: UpdateUserPreferencesRequest) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullUser, setFullUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const u = await loginLocal({ email, password });
      setUser(u);
      // Load full user data after login
      try {
        const fullUserResponse = await getCurrentUser();
        setFullUser(fullUserResponse.user);
      } catch (e) {
        console.warn('Failed to load full user data:', e);
      }
      return u;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (username: string, email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      const u = await signupLocal({ username, email, password });
      setUser(u);
      // Load full user data after signup
      try {
        const fullUserResponse = await getCurrentUser();
        setFullUser(fullUserResponse.user);
      } catch (e) {
        console.warn('Failed to load full user data:', e);
      }
      return u;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Signup failed';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setFullUser(null);
  }, []);

  const fetchSession = useCallback(async () => {
    const authUser = await me();
    if (!authUser) {
      return { auth: null as AuthUser | null, profile: null as User | null };
    }
    const fullUserResponse = await getCurrentUser();
    return { auth: authUser, profile: fullUserResponse.user };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { auth, profile } = await fetchSession();
      setUser(auth);
      setFullUser(profile);
      setError(null);
    } catch (e) {
      clearSession();
      setError(e instanceof Error ? e.message : 'Session load failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchSession, clearSession]);

  const refreshFullUser = useCallback(async () => {
    try {
      const fullUserResponse = await getCurrentUser();
      setFullUser(fullUserResponse.user);
    } catch (e) {
      console.warn('Failed to refresh full user data:', e);
    }
  }, []);

  const updatePreferences = useCallback(async (preferences: UpdateUserPreferencesRequest) => {
    try {
      const updatedUserResponse = await updateUserPreferences(preferences);
      setFullUser(updatedUserResponse.user);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update preferences';
      setError(msg);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setFullUser(null);
    }
  }, []);

  useEffect(() => {
    const path = pathname || '/';
    const isAuthRoute = /^\/(en|ar)\/(login|sign-up)(\b|\/)/.test(path);

    let cancelled = false;

    if (isAuthRoute) {
      setLoading(false);
      setError(null);
      clearSession();
      return () => {
        cancelled = true;
      };
    }

    const bootstrap = async () => {
      setLoading(true);
      try {
        const { auth, profile } = await fetchSession();
        if (cancelled) return;
        setUser(auth);
        setFullUser(profile);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        clearSession();
        const message = e instanceof Error ? e.message : 'Session load failed';
        if (message === 'UNAUTHORIZED') {
          setError(null);
        } else {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!user) {
      bootstrap();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [pathname, fetchSession, clearSession, user]);

  const value: AuthContextValue = { 
    user, 
    fullUser,
    loading, 
    error, 
    login, 
    signup, 
    refresh, 
    refreshFullUser,
    updatePreferences,
    setUser,
    logout
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
