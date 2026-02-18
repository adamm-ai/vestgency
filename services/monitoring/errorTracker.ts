/**
 * Error Tracker - Client-side error monitoring service
 * =====================================================
 * Captures and reports errors for debugging and monitoring
 */

import React from 'react';

export interface ErrorReport {
  /** Error message */
  message: string;
  /** Stack trace if available */
  stack?: string;
  /** React component stack if available */
  componentStack?: string;
  /** Additional context information */
  context: Record<string, unknown>;
  /** When the error occurred */
  timestamp: Date;
  /** User ID if authenticated */
  userId?: string;
  /** Current page URL */
  url: string;
  /** User agent string */
  userAgent: string;
  /** Error severity level */
  level: 'error' | 'warning' | 'info';
  /** Error fingerprint for grouping */
  fingerprint?: string;
}

interface UserContext {
  userId?: string;
  email?: string;
  fullName?: string;
}

// Store user context for error reports
let userContext: UserContext = {};

// Queue for batching error reports
const errorQueue: ErrorReport[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_QUEUE_SIZE = 10;
const FLUSH_INTERVAL = 5000;

// Track reported errors to avoid duplicates
const reportedErrors = new Set<string>();
const MAX_REPORTED_ERRORS = 100;

/**
 * Set user context for error reports
 */
export function setUserContext(userId: string, email?: string, fullName?: string): void {
  userContext = { userId, email, fullName };
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  userContext = {};
}

/**
 * Generate a fingerprint for error deduplication
 */
function generateFingerprint(error: Error): string {
  const message = error.message || 'Unknown error';
  const stack = error.stack || '';
  const firstStackLine = stack.split('\n')[1] || '';
  return `${message}|${firstStackLine}`.slice(0, 200);
}

/**
 * Capture and report an error
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): void {
  const fingerprint = generateFingerprint(error);

  // Deduplicate errors
  if (reportedErrors.has(fingerprint)) {
    return;
  }

  // Limit stored fingerprints
  if (reportedErrors.size >= MAX_REPORTED_ERRORS) {
    const firstKey = reportedErrors.values().next().value;
    if (firstKey) reportedErrors.delete(firstKey);
  }
  reportedErrors.add(fingerprint);

  const report: ErrorReport = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    context: {
      ...context,
      ...userContext,
    },
    timestamp: new Date(),
    userId: userContext.userId,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    level: 'error',
    fingerprint,
  };

  queueError(report);

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorTracker] Captured error:', error, context);
  }
}

/**
 * Capture a message/log with specified severity level
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  const report: ErrorReport = {
    message,
    context: {
      ...context,
      ...userContext,
    },
    timestamp: new Date(),
    userId: userContext.userId,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    level,
  };

  queueError(report);

  // Log to console in development
  if (import.meta.env.DEV) {
    const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
    logFn(`[ErrorTracker] ${level}:`, message, context);
  }
}

/**
 * Capture an error with React component stack
 */
export function captureReactError(
  error: Error,
  componentStack: string,
  context?: Record<string, unknown>
): void {
  const fingerprint = generateFingerprint(error);

  const report: ErrorReport = {
    message: error.message || 'Unknown React error',
    stack: error.stack,
    componentStack,
    context: {
      ...context,
      ...userContext,
      source: 'react-error-boundary',
    },
    timestamp: new Date(),
    userId: userContext.userId,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    level: 'error',
    fingerprint,
  };

  queueError(report);

  if (import.meta.env.DEV) {
    console.error('[ErrorTracker] React error:', error);
    console.error('Component Stack:', componentStack);
  }
}

/**
 * Queue an error for batched sending
 */
function queueError(report: ErrorReport): void {
  errorQueue.push(report);

  // Flush immediately if queue is full
  if (errorQueue.length >= MAX_QUEUE_SIZE) {
    flushErrors();
    return;
  }

  // Schedule flush
  if (!flushTimer) {
    flushTimer = setTimeout(flushErrors, FLUSH_INTERVAL);
  }
}

/**
 * Flush error queue to the server
 */
async function flushErrors(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (errorQueue.length === 0) {
    return;
  }

  const errors = [...errorQueue];
  errorQueue.length = 0;

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'https://vestate-api-fisw.onrender.com';

    // Send to error tracking endpoint
    // This is a fire-and-forget operation
    await fetch(`${API_URL}/api/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ errors }),
    }).catch(() => {
      // Silently fail - don't create infinite error loops
    });
  } catch {
    // Store locally for later if send fails
    if (import.meta.env.DEV) {
      console.warn('[ErrorTracker] Failed to send errors to server, storing locally');
      console.log('Errors:', errors);
    }

    // Could store in localStorage for retry later
    try {
      const stored = localStorage.getItem('errorTracker_pending') || '[]';
      const pending = JSON.parse(stored);
      pending.push(...errors);
      // Keep only last 50 errors
      const trimmed = pending.slice(-50);
      localStorage.setItem('errorTracker_pending', JSON.stringify(trimmed));
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Set up global error handlers
 */
export function initErrorTracking(): void {
  if (typeof window === 'undefined') return;

  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    captureError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      source: 'window.onerror',
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    captureError(error, {
      source: 'unhandledrejection',
    });
  });

  // Flush errors before page unload
  window.addEventListener('beforeunload', () => {
    flushErrors();
  });

  // Retry sending pending errors from localStorage
  try {
    const stored = localStorage.getItem('errorTracker_pending');
    if (stored) {
      const pending = JSON.parse(stored);
      if (Array.isArray(pending) && pending.length > 0) {
        errorQueue.push(...pending);
        localStorage.removeItem('errorTracker_pending');
        flushErrors();
      }
    }
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// ERROR BOUNDARY COMPONENTS
// ============================================================================

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Default fallback UI for error boundaries
 */
export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return React.createElement(
    'div',
    {
      role: 'alert',
      style: {
        padding: '24px',
        margin: '16px',
        backgroundColor: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: '8px',
        fontFamily: 'system-ui, sans-serif',
      },
    },
    React.createElement(
      'h2',
      {
        style: {
          color: '#DC2626',
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '8px',
        },
      },
      'Une erreur est survenue'
    ),
    React.createElement(
      'p',
      {
        style: {
          color: '#991B1B',
          fontSize: '14px',
          marginBottom: '16px',
        },
      },
      import.meta.env.DEV ? error.message : 'Nous nous excusons pour ce desagrement. Veuillez reessayer.'
    ),
    import.meta.env.DEV &&
      error.stack &&
      React.createElement(
        'pre',
        {
          style: {
            padding: '12px',
            backgroundColor: '#FFF',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px',
            marginBottom: '16px',
          },
        },
        error.stack
      ),
    React.createElement(
      'button',
      {
        onClick: resetErrorBoundary,
        style: {
          padding: '8px 16px',
          backgroundColor: '#DC2626',
          color: '#FFF',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        },
      },
      'Reessayer'
    )
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, componentStack: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for catching React errors
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Report error to tracking service
    captureReactError(error, errorInfo.componentStack || '');

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo.componentStack || '');
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorBoundaryFallback;
      return React.createElement(FallbackComponent, {
        error: this.state.error,
        resetErrorBoundary: this.resetErrorBoundary,
      });
    }

    return this.props.children;
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initErrorTracking();
}

export default {
  captureError,
  captureMessage,
  captureReactError,
  setUserContext,
  clearUserContext,
  initErrorTracking,
  ErrorBoundary,
  ErrorBoundaryFallback,
};
