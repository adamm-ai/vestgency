/**
 * Analytics Service - Simple event tracking
 * ==========================================
 * Tracks user events, page views, and performance metrics
 */

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

interface AnalyticsConfig {
  /** Whether analytics is enabled (default: true in production) */
  enabled: boolean;
  /** Whether to log events to console (default: true in development) */
  debug: boolean;
  /** API endpoint for sending analytics */
  endpoint: string;
  /** Batch size before flushing (default: 10) */
  batchSize: number;
  /** Flush interval in ms (default: 10000) */
  flushInterval: number;
}

interface AnalyticsEvent {
  type: 'event' | 'page_view' | 'timing';
  name: string;
  properties: EventProperties;
  timestamp: number;
  sessionId: string;
  userId?: string;
  url: string;
  referrer: string;
}

// Default configuration
const defaultConfig: AnalyticsConfig = {
  enabled: import.meta.env.PROD,
  debug: import.meta.env.DEV,
  endpoint: `${import.meta.env.VITE_API_URL || 'https://vestate-api-fisw.onrender.com'}/api/analytics`,
  batchSize: 10,
  flushInterval: 10000,
};

// State
let config: AnalyticsConfig = { ...defaultConfig };
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let sessionId: string = '';
let userId: string | undefined;

// Generate session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Get or create session ID
function getSessionId(): string {
  if (sessionId) return sessionId;

  // Try to get from sessionStorage
  try {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
  } catch {
    // Ignore storage errors
  }

  // Generate new session
  sessionId = generateSessionId();

  try {
    sessionStorage.setItem('analytics_session_id', sessionId);
  } catch {
    // Ignore storage errors
  }

  return sessionId;
}

/**
 * Configure analytics
 */
export function configureAnalytics(newConfig: Partial<AnalyticsConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Set user ID for analytics
 */
export function setAnalyticsUser(id: string): void {
  userId = id;
}

/**
 * Clear user ID
 */
export function clearAnalyticsUser(): void {
  userId = undefined;
}

/**
 * Track a custom event
 * @param event - Event name
 * @param properties - Optional event properties
 */
export function trackEvent(event: string, properties?: EventProperties): void {
  if (!config.enabled) return;

  const analyticsEvent: AnalyticsEvent = {
    type: 'event',
    name: event,
    properties: properties || {},
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId,
    url: typeof window !== 'undefined' ? window.location.href : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  };

  queueEvent(analyticsEvent);

  if (config.debug) {
    console.log('[Analytics] Event:', event, properties);
  }
}

/**
 * Track a page view
 * @param path - Page path (defaults to current path)
 * @param properties - Optional additional properties
 */
export function trackPageView(path?: string, properties?: EventProperties): void {
  if (!config.enabled) return;

  const pagePath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');

  const analyticsEvent: AnalyticsEvent = {
    type: 'page_view',
    name: 'page_view',
    properties: {
      path: pagePath,
      title: typeof document !== 'undefined' ? document.title : '',
      ...properties,
    },
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId,
    url: typeof window !== 'undefined' ? window.location.href : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  };

  queueEvent(analyticsEvent);

  if (config.debug) {
    console.log('[Analytics] Page view:', pagePath);
  }
}

/**
 * Track a timing metric
 * @param category - Timing category (e.g., 'API', 'Render')
 * @param variable - What is being timed (e.g., 'fetchLeads', 'initialRender')
 * @param time - Time in milliseconds
 * @param label - Optional label for additional context
 */
export function trackTiming(
  category: string,
  variable: string,
  time: number,
  label?: string
): void {
  if (!config.enabled) return;

  const analyticsEvent: AnalyticsEvent = {
    type: 'timing',
    name: `timing:${category}:${variable}`,
    properties: {
      category,
      variable,
      time,
      label,
    },
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId,
    url: typeof window !== 'undefined' ? window.location.href : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  };

  queueEvent(analyticsEvent);

  if (config.debug) {
    console.log('[Analytics] Timing:', category, variable, `${time}ms`);
  }
}

/**
 * Track user identification
 */
export function trackIdentify(id: string, traits?: EventProperties): void {
  setAnalyticsUser(id);

  trackEvent('identify', {
    ...traits,
    user_id: id,
  });
}

/**
 * Track button clicks
 */
export function trackClick(buttonName: string, properties?: EventProperties): void {
  trackEvent('click', {
    button_name: buttonName,
    ...properties,
  });
}

/**
 * Track form submissions
 */
export function trackFormSubmit(formName: string, properties?: EventProperties): void {
  trackEvent('form_submit', {
    form_name: formName,
    ...properties,
  });
}

/**
 * Track search queries
 */
export function trackSearch(query: string, results: number, properties?: EventProperties): void {
  trackEvent('search', {
    query,
    results_count: results,
    ...properties,
  });
}

/**
 * Add event to queue and schedule flush
 */
function queueEvent(event: AnalyticsEvent): void {
  eventQueue.push(event);

  // Flush immediately if queue is full
  if (eventQueue.length >= config.batchSize) {
    flushEvents();
    return;
  }

  // Schedule flush
  if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, config.flushInterval);
  }
}

/**
 * Send queued events to server
 */
async function flushEvents(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  try {
    await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
      // Use keepalive for beforeunload
      keepalive: true,
    }).catch(() => {
      // Silently fail
    });
  } catch {
    // Store locally for retry
    if (config.debug) {
      console.warn('[Analytics] Failed to send events');
    }

    try {
      const stored = localStorage.getItem('analytics_pending') || '[]';
      const pending = JSON.parse(stored);
      pending.push(...events);
      // Keep only last 100 events
      const trimmed = pending.slice(-100);
      localStorage.setItem('analytics_pending', JSON.stringify(trimmed));
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Performance tracking utilities
 */
export const performance = {
  /**
   * Start a performance measurement
   */
  start(name: string): () => void {
    const startTime = globalThis.performance?.now() || Date.now();

    return () => {
      const endTime = globalThis.performance?.now() || Date.now();
      const duration = Math.round(endTime - startTime);
      trackTiming('performance', name, duration);
    };
  },

  /**
   * Measure an async operation
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const stop = this.start(name);
    try {
      return await fn();
    } finally {
      stop();
    }
  },

  /**
   * Track Web Vitals (if available)
   */
  trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Use Performance Observer API if available
    if ('PerformanceObserver' in window) {
      try {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              trackTiming('web_vitals', 'FCP', Math.round(entry.startTime));
            }
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            trackTiming('web_vitals', 'LCP', Math.round(lastEntry.startTime));
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (approximation via event timing)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceEventTiming[]) {
            if (entry.processingStart) {
              const fid = entry.processingStart - entry.startTime;
              trackTiming('web_vitals', 'FID', Math.round(fid));
              fidObserver.disconnect();
              break;
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput?: boolean; value?: number })[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value || 0;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Report CLS on page hide
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            trackTiming('web_vitals', 'CLS', Math.round(clsValue * 1000));
          }
        });
      } catch {
        // Performance Observer not fully supported
      }
    }
  },
};

// Initialize on module load
if (typeof window !== 'undefined') {
  // Flush before page unload
  window.addEventListener('beforeunload', flushEvents);

  // Retry pending events
  try {
    const stored = localStorage.getItem('analytics_pending');
    if (stored) {
      const pending = JSON.parse(stored);
      if (Array.isArray(pending) && pending.length > 0) {
        eventQueue.push(...pending);
        localStorage.removeItem('analytics_pending');
        // Delay flush to not block page load
        setTimeout(flushEvents, 2000);
      }
    }
  } catch {
    // Ignore storage errors
  }

  // Track initial page view
  if (config.enabled) {
    // Delay to ensure page is fully loaded
    setTimeout(() => {
      trackPageView();
      performance.trackWebVitals();
    }, 100);
  }
}

export default {
  trackEvent,
  trackPageView,
  trackTiming,
  trackIdentify,
  trackClick,
  trackFormSubmit,
  trackSearch,
  setAnalyticsUser,
  clearAnalyticsUser,
  configureAnalytics,
  performance,
};
