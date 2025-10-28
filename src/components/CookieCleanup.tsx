"use client";
import { useEffect } from 'react';

/**
 * Component that cleans up old cookies from the previous authentication system.
 * This runs once on mount to clear any lingering cookies.
 */
export function CookieCleanup() {
  useEffect(() => {
    // Clear old cookies from previous cookie-based authentication
    const cookiesToClear = ['access_token', 'authp'];
    
    cookiesToClear.forEach(cookieName => {
      // Clear from various path and domain combinations
      const domains = [window.location.hostname, `.${window.location.hostname}`];
      const paths = ['/', '/api', '/en', '/ar'];
      
      domains.forEach(domain => {
        paths.forEach(path => {
          // Expire the cookie by setting expiry to past date
          document.cookie = `${cookieName}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
          document.cookie = `${cookieName}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
          // Try with secure and sameSite attributes
          document.cookie = `${cookieName}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure;`;
          document.cookie = `${cookieName}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure;`;
        });
      });
    });
  }, []);

  return null;
}

