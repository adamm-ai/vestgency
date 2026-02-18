/**
 * Security Services - Barrel Export
 * ===================================
 * Central export point for all security utilities.
 *
 * USAGE:
 * ------
 * import {
 *   // CSRF Protection
 *   generateCsrfToken,
 *   getCsrfToken,
 *   withCsrfHeader,
 *   validateCsrfToken,
 *   initializeCsrfProtection,
 *
 *   // Security Headers
 *   securityHeaders,
 *   withSecurityHeaders,
 *   createSecureHeaders,
 *
 *   // Token Management
 *   setToken,
 *   getToken,
 *   removeToken,
 *   isTokenExpired,
 *   getTokenExpiry,
 * } from './services/security';
 *
 * INTEGRATION WITH API.TS:
 * -------------------------
 * The security utilities are designed to be progressively integrated:
 *
 * 1. Token Management (replace localStorage usage):
 *    ```typescript
 *    // In api.ts, replace:
 *    // localStorage.setItem(TOKEN_KEY, token);
 *    // localStorage.getItem(TOKEN_KEY);
 *
 *    // With:
 *    import { setToken, getToken, removeToken } from './security';
 *    setToken(token);
 *    const token = getToken();
 *    removeToken();
 *    ```
 *
 * 2. Security Headers (enhance fetchAPI):
 *    ```typescript
 *    import { withSecurityHeaders, withCsrfHeader } from './security';
 *
 *    const fetchAPI = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
 *      const secureOptions = withSecurityHeaders(options);
 *      const headers = withCsrfHeader(new Headers(secureOptions.headers));
 *      // ... rest of fetch logic
 *    };
 *    ```
 *
 * 3. CSRF Protection (initialize on app start):
 *    ```typescript
 *    // In App.tsx or main.tsx:
 *    import { initializeCsrfProtection } from './services/security';
 *
 *    // Initialize on app load
 *    initializeCsrfProtection();
 *    ```
 *
 * 4. Token Expiry Monitoring:
 *    ```typescript
 *    import { startExpiryMonitoring, onTokenEvent } from './services/security';
 *
 *    // Start monitoring
 *    startExpiryMonitoring(60000, () => {
 *      // Redirect to login on expiry
 *      window.location.href = '/login';
 *    });
 *
 *    // Or listen to events
 *    onTokenEvent(({ type }) => {
 *      if (type === 'expire') {
 *        // Handle expiry
 *      }
 *    });
 *    ```
 */

// =============================================================================
// CSRF Protection
// =============================================================================
export {
  // Token generation and retrieval
  generateCsrfToken,
  getCsrfToken,
  storeCsrfToken,
  setCsrfMetaTag,

  // Request header helpers
  withCsrfHeader,
  createCsrfHeaders,

  // Validation
  validateCsrfToken,

  // Initialization and cleanup
  initializeCsrfProtection,
  clearCsrfToken,

  // Configuration
  CSRF_CONFIG,
} from './csrf';

// =============================================================================
// Security Headers
// =============================================================================
export {
  // Header configurations
  securityHeaders,
  serverSecurityHeaders,
  cspDirectives,
  headerPresets,

  // CSP generation
  generateCspHeader,

  // Request helpers
  withSecurityHeaders,
  createSecureHeaders,

  // Validation and utilities
  validateResponseHeaders,
  getHeaderPreset,
  sanitizeHeaders,

  // Types
  type SecurityHeadersConfig,
  type CspDirectives,
  type HeaderPresetType,
} from './headers';

// =============================================================================
// Token Management
// =============================================================================
export {
  // Core token operations
  setToken,
  getToken,
  removeToken,

  // Token with events (for reactive updates)
  setTokenWithEvent,
  removeTokenWithEvent,

  // Expiry management
  isTokenExpired,
  getTokenExpiry,
  getTokenTimeRemaining,
  shouldRefreshToken,

  // Token inspection
  getTokenPayload,
  validateTokenStructure,

  // Event system
  onTokenEvent,
  type TokenEventType,
  type TokenEventListener,

  // Monitoring
  startExpiryMonitoring,
  stopExpiryMonitoring,

  // Configuration
  TOKEN_CONFIG,
} from './tokenManager';

// =============================================================================
// Convenience Utilities
// =============================================================================

import { withSecurityHeaders } from './headers';
import { withCsrfHeader } from './csrf';
import { getToken } from './tokenManager';

/**
 * Creates a fully secured RequestInit object with all security features
 * Combines security headers, CSRF token, and authorization
 * @param init - Original RequestInit
 * @returns Secured RequestInit
 */
export const createSecureRequest = (init: RequestInit = {}): RequestInit => {
  // Apply security headers
  const securedInit = withSecurityHeaders(init);

  // Get existing headers or create new ones
  let headers: Headers;
  if (securedInit.headers instanceof Headers) {
    headers = securedInit.headers;
  } else if (typeof securedInit.headers === 'object') {
    headers = new Headers(securedInit.headers as Record<string, string>);
  } else {
    headers = new Headers();
  }

  // Add CSRF token
  withCsrfHeader(headers);

  // Add authorization if token exists
  const token = getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return {
    ...securedInit,
    headers,
  };
};

/**
 * Security initialization function - call once on app start
 * Sets up CSRF protection and token monitoring
 */
export const initializeSecurity = (options?: {
  enableCsrf?: boolean;
  enableExpiryMonitoring?: boolean;
  expiryCheckInterval?: number;
  onTokenExpire?: () => void;
}): void => {
  const {
    enableCsrf = true,
    enableExpiryMonitoring = true,
    expiryCheckInterval = 60000,
    onTokenExpire,
  } = options || {};

  // Initialize CSRF protection
  if (enableCsrf) {
    const { initializeCsrfProtection } = require('./csrf');
    initializeCsrfProtection();
  }

  // Start token expiry monitoring
  if (enableExpiryMonitoring) {
    const { startExpiryMonitoring } = require('./tokenManager');
    startExpiryMonitoring(expiryCheckInterval, onTokenExpire);
  }

  console.info('[Security] Security services initialized');
};

/**
 * Security cleanup function - call on app unmount
 */
export const cleanupSecurity = (): void => {
  const { stopExpiryMonitoring } = require('./tokenManager');
  stopExpiryMonitoring();

  console.info('[Security] Security services cleaned up');
};
