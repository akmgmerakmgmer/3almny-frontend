"use client";
// Deprecated: The application now manages auth state at the page/component level.
// This stub is left temporarily to avoid breaking any lingering imports while refactor stabilizes.
// Remove this file once all references are gone.
export function useAuth() {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('useAuth() is deprecated. Use local component state + services/auth instead.');
  }
  return { user: null, loading: false, error: 'deprecated', login: async () => { throw new Error('useAuth deprecated'); }, signup: async () => { throw new Error('useAuth deprecated'); } };
}
