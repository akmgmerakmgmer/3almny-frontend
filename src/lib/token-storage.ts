// Token storage utility for JWT authentication
const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  has: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(TOKEN_KEY) !== null;
  },
};

