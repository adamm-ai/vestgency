/**
 * CSRF Protection Utilities
 * ==========================
 * Provides CSRF token generation, validation, and request header management.
 *
 * INTEGRATION GUIDE:
 * ------------------
 * 1. Add CSRF meta tag in your HTML head:
 *    <meta name="csrf-token" content="<generated-token>">
 *
 * 2. For API requests, use withCsrfHeader():
 *    const headers = withCsrfHeader(new Headers({ 'Content-Type': 'application/json' }));
 *    fetch('/api/endpoint', { headers });
 *
 * 3. Server-side: Validate token on all state-changing requests (POST, PUT, DELETE)
 */

// CSRF Token Configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_META_NAME = 'csrf-token';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_STORAGE_KEY = 'vestate_csrf_token';

/**
 * Generates a cryptographically secure random CSRF token
 * Uses Web Crypto API for secure random generation
 * @returns A secure random token string
 */
export const generateCsrfToken = (): string => {
  // Use Web Crypto API for secure random generation
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(CSRF_TOKEN_LENGTH);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for environments without Web Crypto (less secure)
  console.warn('[CSRF] Web Crypto API not available, using fallback random generation');
  let token = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < CSRF_TOKEN_LENGTH * 2; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

/**
 * Retrieves the current CSRF token from available sources
 * Priority: Meta tag > Cookie > SessionStorage
 * @returns The CSRF token or null if not found
 */
export const getCsrfToken = (): string | null => {
  // 1. Try to get from meta tag (recommended approach)
  if (typeof document !== 'undefined') {
    const metaTag = document.querySelector(`meta[name="${CSRF_META_NAME}"]`);
    if (metaTag) {
      const token = metaTag.getAttribute('content');
      if (token) return token;
    }
  }

  // 2. Try to get from cookie
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_COOKIE_NAME && value) {
        return decodeURIComponent(value);
      }
    }
  }

  // 3. Try to get from sessionStorage (last resort)
  if (typeof sessionStorage !== 'undefined') {
    const storedToken = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (storedToken) return storedToken;
  }

  return null;
};

/**
 * Stores CSRF token in sessionStorage
 * Used when token is generated client-side
 * @param token - The CSRF token to store
 */
export const storeCsrfToken = (token: string): void => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  }
};

/**
 * Sets CSRF token in a meta tag (for SPA applications)
 * Creates the meta tag if it doesn't exist
 * @param token - The CSRF token to set
 */
export const setCsrfMetaTag = (token: string): void => {
  if (typeof document === 'undefined') return;

  let metaTag = document.querySelector(`meta[name="${CSRF_META_NAME}"]`);

  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', CSRF_META_NAME);
    document.head.appendChild(metaTag);
  }

  metaTag.setAttribute('content', token);
};

/**
 * Adds CSRF token header to an existing Headers object
 * @param headers - The Headers object to modify
 * @returns The modified Headers object with CSRF token
 */
export const withCsrfHeader = (headers: Headers): Headers => {
  const token = getCsrfToken();

  if (token) {
    headers.set(CSRF_HEADER_NAME, token);
  } else {
    console.warn('[CSRF] No CSRF token available. Request may be rejected by server.');
  }

  return headers;
};

/**
 * Creates headers object with CSRF token included
 * Convenience function for creating new headers with CSRF protection
 * @param additionalHeaders - Optional additional headers to include
 * @returns Headers object with CSRF token
 */
export const createCsrfHeaders = (additionalHeaders?: Record<string, string>): Headers => {
  const headers = new Headers(additionalHeaders);
  return withCsrfHeader(headers);
};

/**
 * Validates a CSRF token against the stored/expected token
 * Performs constant-time comparison to prevent timing attacks
 * @param token - The token to validate
 * @returns True if token is valid, false otherwise
 */
export const validateCsrfToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const expectedToken = getCsrfToken();

  if (!expectedToken) {
    console.warn('[CSRF] No expected token found for validation');
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(token, expectedToken);
};

/**
 * Performs constant-time string comparison
 * Prevents timing attacks by always comparing all characters
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Initializes CSRF protection for the application
 * Should be called once during app initialization
 * @returns The generated or existing CSRF token
 */
export const initializeCsrfProtection = (): string => {
  let token = getCsrfToken();

  if (!token) {
    token = generateCsrfToken();
    storeCsrfToken(token);
    setCsrfMetaTag(token);
    console.info('[CSRF] Generated new CSRF token');
  }

  return token;
};

/**
 * Clears CSRF token from all storage locations
 * Should be called on logout
 */
export const clearCsrfToken = (): void => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  }

  if (typeof document !== 'undefined') {
    const metaTag = document.querySelector(`meta[name="${CSRF_META_NAME}"]`);
    if (metaTag) {
      metaTag.setAttribute('content', '');
    }
  }
};

// Export configuration constants for external use
export const CSRF_CONFIG = {
  TOKEN_LENGTH: CSRF_TOKEN_LENGTH,
  META_NAME: CSRF_META_NAME,
  COOKIE_NAME: CSRF_COOKIE_NAME,
  HEADER_NAME: CSRF_HEADER_NAME,
  STORAGE_KEY: CSRF_STORAGE_KEY,
} as const;
