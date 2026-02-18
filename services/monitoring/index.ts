/**
 * Monitoring Services - Barrel Export
 * =====================================
 * Error tracking and analytics services
 */

// Error Tracking
export {
  captureError,
  captureMessage,
  captureReactError,
  setUserContext,
  clearUserContext,
  initErrorTracking,
  ErrorBoundary,
  ErrorBoundaryFallback,
} from './errorTracker';

export type { ErrorReport } from './errorTracker';

// Analytics
export {
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
} from './analytics';

// Default exports combined
import errorTracker from './errorTracker';
import analytics from './analytics';

export default {
  ...errorTracker,
  ...analytics,
};
