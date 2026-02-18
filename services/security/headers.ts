/**
 * Security Headers Configuration
 * ================================
 * Provides security headers for HTTP requests and CSP configuration.
 *
 * INTEGRATION GUIDE:
 * ------------------
 * 1. For fetch requests:
 *    const init = withSecurityHeaders({ method: 'POST', body: JSON.stringify(data) });
 *    fetch('/api/endpoint', init);
 *
 * 2. For server-side (Express/Node):
 *    app.use((req, res, next) => {
 *      Object.entries(serverSecurityHeaders).forEach(([key, value]) => {
 *        res.setHeader(key, value);
 *      });
 *      next();
 *    });
 */

/**
 * Client-side security headers for outgoing requests
 * These headers help protect against various attacks
 */
export const securityHeaders: Record<string, string> = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking - page cannot be embedded in iframes
  'X-Frame-Options': 'DENY',

  // Enable XSS filter in browsers (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information sent with requests
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Indicate this is an XMLHttpRequest (helps servers identify AJAX calls)
  'X-Requested-With': 'XMLHttpRequest',
};

/**
 * Server-side security headers (for reference/documentation)
 * These should be set by the server, not the client
 */
export const serverSecurityHeaders: Record<string, string> = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Enable XSS filter (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Force HTTPS for 1 year, include subdomains
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Prevent Adobe Flash and PDFs from reading data
  'X-Permitted-Cross-Domain-Policies': 'none',

  // Disable DNS prefetching to prevent info leakage
  'X-DNS-Prefetch-Control': 'off',

  // Prevent page from being loaded in Adobe products
  'X-Download-Options': 'noopen',

  // Control browser features
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',

  // Cross-Origin policies
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/**
 * Content Security Policy directives
 * Customize based on your application's needs
 */
export const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production if possible
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': ["'self'", 'https://vestate-api-fisw.onrender.com', 'wss:'],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Generates CSP header string from directives
 * @param directives - CSP directive configuration
 * @returns Formatted CSP header string
 */
export const generateCspHeader = (
  directives: Record<string, string[]> = cspDirectives
): string => {
  return Object.entries(directives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
};

/**
 * Applies security headers to a fetch RequestInit object
 * @param init - The original RequestInit object
 * @returns Modified RequestInit with security headers
 */
export const withSecurityHeaders = (init: RequestInit = {}): RequestInit => {
  const existingHeaders = init.headers || {};

  // Convert existing headers to a plain object if needed
  let headersObject: Record<string, string> = {};

  if (existingHeaders instanceof Headers) {
    existingHeaders.forEach((value, key) => {
      headersObject[key] = value;
    });
  } else if (Array.isArray(existingHeaders)) {
    existingHeaders.forEach(([key, value]) => {
      headersObject[key] = value;
    });
  } else {
    headersObject = { ...existingHeaders } as Record<string, string>;
  }

  // Merge with security headers (existing headers take precedence)
  const mergedHeaders = {
    ...securityHeaders,
    ...headersObject,
  };

  return {
    ...init,
    headers: mergedHeaders,
    // Ensure credentials are handled securely
    credentials: init.credentials || 'same-origin',
  };
};

/**
 * Creates a Headers object with security headers included
 * @param additionalHeaders - Optional additional headers
 * @returns Headers object with security headers
 */
export const createSecureHeaders = (
  additionalHeaders?: Record<string, string>
): Headers => {
  const headers = new Headers({
    ...securityHeaders,
    ...additionalHeaders,
  });

  return headers;
};

/**
 * Validates that response has expected security headers
 * Useful for testing and security audits
 * @param response - The fetch Response object to validate
 * @returns Object with validation results
 */
export const validateResponseHeaders = (
  response: Response
): { isSecure: boolean; missing: string[]; present: string[] } => {
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Strict-Transport-Security',
  ];

  const missing: string[] = [];
  const present: string[] = [];

  requiredHeaders.forEach((header) => {
    if (response.headers.has(header)) {
      present.push(header);
    } else {
      missing.push(header);
    }
  });

  return {
    isSecure: missing.length === 0,
    missing,
    present,
  };
};

/**
 * Security headers preset for different environments
 */
export const headerPresets = {
  /**
   * Strict security headers for production
   */
  production: {
    ...securityHeaders,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },

  /**
   * Relaxed headers for development
   */
  development: {
    'X-Content-Type-Options': 'nosniff',
    'X-Requested-With': 'XMLHttpRequest',
  },

  /**
   * Headers for API requests
   */
  api: {
    ...securityHeaders,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },

  /**
   * Headers for file uploads
   */
  upload: {
    ...securityHeaders,
    'Accept': 'application/json',
    // Content-Type should be set by browser for FormData
  },
} as const;

/**
 * Gets appropriate headers preset based on environment
 * @param type - The type of request
 * @returns Headers preset object
 */
export const getHeaderPreset = (
  type: keyof typeof headerPresets = 'api'
): Record<string, string> => {
  return { ...headerPresets[type] };
};

/**
 * Sanitizes headers by removing potentially dangerous ones
 * @param headers - Headers object to sanitize
 * @returns Sanitized headers
 */
export const sanitizeHeaders = (
  headers: Record<string, string>
): Record<string, string> => {
  const dangerousHeaders = [
    'Cookie',
    'Set-Cookie',
    'Authorization', // Should only be set intentionally
    'Proxy-Authorization',
    'X-Forwarded-For',
    'X-Real-IP',
  ];

  const sanitized = { ...headers };

  dangerousHeaders.forEach((header) => {
    if (header in sanitized && !isHeaderAllowed(header)) {
      delete sanitized[header];
    }
  });

  return sanitized;
};

/**
 * Checks if a header is allowed to be set
 * @param header - Header name to check
 * @returns True if header is allowed
 */
const isHeaderAllowed = (header: string): boolean => {
  // Authorization header is allowed but should be set intentionally
  const allowedSensitiveHeaders = ['Authorization'];
  return allowedSensitiveHeaders.includes(header);
};

// Export types for external use
export type SecurityHeadersConfig = typeof securityHeaders;
export type CspDirectives = typeof cspDirectives;
export type HeaderPresetType = keyof typeof headerPresets;
