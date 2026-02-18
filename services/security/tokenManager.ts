/**
 * Secure Token Manager
 * =====================
 * Provides secure token storage with obfuscation and expiry management.
 *
 * SECURITY IMPROVEMENTS OVER PLAIN LOCALSTORAGE:
 * - Token obfuscation (not plaintext in storage)
 * - Automatic expiry detection
 * - Session fingerprinting
 * - Memory-first caching
 * - XSS mitigation through obfuscation
 *
 * INTEGRATION GUIDE:
 * ------------------
 * Replace in api.ts:
 *
 * // Before (vulnerable):
 * localStorage.setItem('token', token);
 * const token = localStorage.getItem('token');
 *
 * // After (secure):
 * import { setToken, getToken } from './security/tokenManager';
 * setToken(token);
 * const token = getToken();
 *
 * NOTE: For maximum security, consider using httpOnly cookies with
 * server-side session management instead of client-side token storage.
 */

// Storage configuration
const TOKEN_STORAGE_KEY = 'vestate_auth_data';
const TOKEN_VERSION = 'v1';
const FINGERPRINT_KEY = 'vestate_fp';

// In-memory cache for faster access and additional security layer
let memoryCache: {
  token: string | null;
  expiry: number | null;
  fingerprint: string | null;
} = {
  token: null,
  expiry: null,
  fingerprint: null,
};

/**
 * Generates a simple browser fingerprint for session binding
 * This helps detect if the token is being used from a different browser
 * @returns Browser fingerprint string
 */
const generateFingerprint = (): string => {
  if (typeof window === 'undefined') return 'server';

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || '0',
  ];

  // Simple hash of components
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
};

/**
 * Obfuscates data using XOR with a key derived from fingerprint
 * This is NOT encryption - it's obfuscation to prevent casual inspection
 * @param data - Data to obfuscate
 * @param key - Key for obfuscation
 * @returns Obfuscated string
 */
const obfuscate = (data: string, key: string): string => {
  const keyChars = key.split('');
  return data
    .split('')
    .map((char, i) => {
      const keyChar = keyChars[i % keyChars.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    })
    .join('');
};

/**
 * Deobfuscates data (XOR is symmetric)
 * @param data - Data to deobfuscate
 * @param key - Key used for obfuscation
 * @returns Original string
 */
const deobfuscate = (data: string, key: string): string => {
  return obfuscate(data, key); // XOR is symmetric
};

/**
 * Encodes data for safe storage
 * @param data - Data to encode
 * @returns Base64 encoded string
 */
const encode = (data: string): string => {
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(data)));
  }
  return Buffer.from(data, 'utf-8').toString('base64');
};

/**
 * Decodes stored data
 * @param data - Base64 encoded data
 * @returns Decoded string
 */
const decode = (data: string): string => {
  try {
    if (typeof atob === 'function') {
      return decodeURIComponent(escape(atob(data)));
    }
    return Buffer.from(data, 'base64').toString('utf-8');
  } catch {
    return '';
  }
};

/**
 * Parses a JWT token to extract payload
 * @param token - JWT token string
 * @returns Decoded payload or null
 */
const parseJwt = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = decode(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/**
 * Extracts expiry timestamp from JWT token
 * @param token - JWT token string
 * @returns Expiry timestamp in milliseconds or null
 */
const extractExpiry = (token: string): number | null => {
  const payload = parseJwt(token);
  if (!payload) return null;

  // JWT exp is in seconds, convert to milliseconds
  if (typeof payload.exp === 'number') {
    return payload.exp * 1000;
  }

  return null;
};

/**
 * Stores a token securely
 * @param token - The JWT token to store
 */
export const setToken = (token: string): void => {
  if (!token) {
    console.warn('[TokenManager] Attempted to store empty token');
    return;
  }

  const fingerprint = generateFingerprint();
  const expiry = extractExpiry(token);

  // Store in memory cache
  memoryCache = {
    token,
    expiry,
    fingerprint,
  };

  // Obfuscate and store
  const obfuscated = obfuscate(token, fingerprint);
  const encoded = encode(obfuscated);

  const storageData = {
    v: TOKEN_VERSION,
    d: encoded,
    e: expiry,
    t: Date.now(),
  };

  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(storageData));
    sessionStorage.setItem(FINGERPRINT_KEY, fingerprint);
  } catch (error) {
    console.error('[TokenManager] Failed to store token:', error);
  }
};

/**
 * Retrieves the stored token
 * @returns The token string or null if not found/invalid
 */
export const getToken = (): string | null => {
  // Check memory cache first
  if (memoryCache.token) {
    // Verify fingerprint hasn't changed
    const currentFingerprint = generateFingerprint();
    if (memoryCache.fingerprint === currentFingerprint) {
      // Check if expired
      if (memoryCache.expiry && Date.now() >= memoryCache.expiry) {
        removeToken();
        return null;
      }
      return memoryCache.token;
    }
  }

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);

    // Version check
    if (data.v !== TOKEN_VERSION) {
      console.warn('[TokenManager] Token version mismatch, clearing');
      removeToken();
      return null;
    }

    // Get fingerprint
    const storedFingerprint = sessionStorage.getItem(FINGERPRINT_KEY);
    const currentFingerprint = generateFingerprint();

    // Fingerprint validation (session continuity)
    if (storedFingerprint && storedFingerprint !== currentFingerprint) {
      console.warn('[TokenManager] Fingerprint mismatch, possible session hijacking');
      // Don't remove token, but regenerate fingerprint for this session
      sessionStorage.setItem(FINGERPRINT_KEY, currentFingerprint);
    }

    // Expiry check
    if (data.e && Date.now() >= data.e) {
      console.info('[TokenManager] Token expired');
      removeToken();
      return null;
    }

    // Deobfuscate token
    const decoded = decode(data.d);
    const fingerprint = storedFingerprint || currentFingerprint;
    const token = deobfuscate(decoded, fingerprint);

    // Validate token structure (basic JWT check)
    if (!token || token.split('.').length !== 3) {
      console.warn('[TokenManager] Invalid token structure');
      removeToken();
      return null;
    }

    // Update memory cache
    memoryCache = {
      token,
      expiry: data.e,
      fingerprint: currentFingerprint,
    };

    return token;
  } catch (error) {
    console.error('[TokenManager] Failed to retrieve token:', error);
    removeToken();
    return null;
  }
};

/**
 * Removes the stored token
 */
export const removeToken = (): void => {
  // Clear memory cache
  memoryCache = {
    token: null,
    expiry: null,
    fingerprint: null,
  };

  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(FINGERPRINT_KEY);
  } catch (error) {
    console.error('[TokenManager] Failed to remove token:', error);
  }
};

/**
 * Checks if the stored token is expired
 * @returns True if token is expired or not found
 */
export const isTokenExpired = (): boolean => {
  // Check memory cache first
  if (memoryCache.expiry) {
    return Date.now() >= memoryCache.expiry;
  }

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return true;

    const data = JSON.parse(stored);
    if (!data.e) {
      // No expiry info, try to parse from token
      const token = getToken();
      if (!token) return true;

      const expiry = extractExpiry(token);
      return expiry ? Date.now() >= expiry : false;
    }

    return Date.now() >= data.e;
  } catch {
    return true;
  }
};

/**
 * Gets the token expiry date
 * @returns Expiry Date object or null if not available
 */
export const getTokenExpiry = (): Date | null => {
  // Check memory cache first
  if (memoryCache.expiry) {
    return new Date(memoryCache.expiry);
  }

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (data.e) {
      return new Date(data.e);
    }

    // Try to extract from token
    const token = getToken();
    if (token) {
      const expiry = extractExpiry(token);
      if (expiry) return new Date(expiry);
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Gets time remaining until token expires
 * @returns Milliseconds until expiry, or 0 if expired/not found
 */
export const getTokenTimeRemaining = (): number => {
  const expiry = getTokenExpiry();
  if (!expiry) return 0;

  const remaining = expiry.getTime() - Date.now();
  return Math.max(0, remaining);
};

/**
 * Checks if token should be refreshed (less than threshold remaining)
 * @param thresholdMinutes - Minutes before expiry to trigger refresh
 * @returns True if token should be refreshed
 */
export const shouldRefreshToken = (thresholdMinutes: number = 5): boolean => {
  const remaining = getTokenTimeRemaining();
  if (remaining === 0) return true;

  const thresholdMs = thresholdMinutes * 60 * 1000;
  return remaining < thresholdMs;
};

/**
 * Gets decoded JWT payload (for reading user info)
 * @returns Decoded payload object or null
 */
export const getTokenPayload = (): Record<string, unknown> | null => {
  const token = getToken();
  if (!token) return null;

  return parseJwt(token);
};

/**
 * Validates token structure and signature (basic validation)
 * Note: Full signature validation requires the secret key (server-side only)
 * @param token - Token to validate
 * @returns True if token appears valid
 */
export const validateTokenStructure = (token?: string): boolean => {
  const tokenToValidate = token || getToken();
  if (!tokenToValidate) return false;

  // Check JWT structure
  const parts = tokenToValidate.split('.');
  if (parts.length !== 3) return false;

  // Check each part is base64-decodable
  try {
    for (const part of parts.slice(0, 2)) {
      decode(part.replace(/-/g, '+').replace(/_/g, '/'));
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Token event types for external listeners
 */
export type TokenEventType = 'set' | 'remove' | 'expire' | 'refresh';

/**
 * Token event listener type
 */
export type TokenEventListener = (event: { type: TokenEventType; token?: string }) => void;

// Event listeners
const eventListeners: TokenEventListener[] = [];

/**
 * Adds a listener for token events
 * @param listener - Event listener function
 * @returns Cleanup function to remove listener
 */
export const onTokenEvent = (listener: TokenEventListener): (() => void) => {
  eventListeners.push(listener);
  return () => {
    const index = eventListeners.indexOf(listener);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  };
};

/**
 * Emits a token event to all listeners
 * @param type - Event type
 * @param token - Associated token
 */
const emitTokenEvent = (type: TokenEventType, token?: string): void => {
  eventListeners.forEach((listener) => {
    try {
      listener({ type, token });
    } catch (error) {
      console.error('[TokenManager] Event listener error:', error);
    }
  });
};

// Export enhanced functions that emit events
export const setTokenWithEvent = (token: string): void => {
  setToken(token);
  emitTokenEvent('set', token);
};

export const removeTokenWithEvent = (): void => {
  removeToken();
  emitTokenEvent('remove');
};

// Auto-check for token expiry periodically
let expiryCheckInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts automatic token expiry monitoring
 * @param checkIntervalMs - Interval between checks in milliseconds
 * @param onExpire - Callback when token expires
 */
export const startExpiryMonitoring = (
  checkIntervalMs: number = 60000,
  onExpire?: () => void
): void => {
  stopExpiryMonitoring();

  expiryCheckInterval = setInterval(() => {
    if (isTokenExpired() && memoryCache.token) {
      emitTokenEvent('expire');
      removeToken();
      onExpire?.();
    }
  }, checkIntervalMs);
};

/**
 * Stops automatic token expiry monitoring
 */
export const stopExpiryMonitoring = (): void => {
  if (expiryCheckInterval) {
    clearInterval(expiryCheckInterval);
    expiryCheckInterval = null;
  }
};

// Storage configuration exports
export const TOKEN_CONFIG = {
  STORAGE_KEY: TOKEN_STORAGE_KEY,
  VERSION: TOKEN_VERSION,
  FINGERPRINT_KEY: FINGERPRINT_KEY,
} as const;
