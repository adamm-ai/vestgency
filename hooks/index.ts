/**
 * Hooks Index
 * Central export for all custom React hooks
 */

// Motion & Accessibility
export { useReducedMotion, useAccessibleAnimation } from './useReducedMotion';

// Pagination
export {
  usePagination,
  useServerPagination,
  type PaginationState,
  type UsePaginationOptions,
  type UsePaginationReturn,
  type UseServerPaginationOptions,
  type UseServerPaginationReturn,
} from './usePagination';

// Virtual Scrolling
export {
  useVirtualList,
  useDynamicVirtualList,
  type VirtualItem,
  type UseVirtualListOptions,
  type UseVirtualListReturn,
  type ScrollToOptions,
  type UseDynamicVirtualListOptions,
} from './useVirtualList';

// Infinite Scrolling
export {
  useInfiniteScroll,
  useScrollInfinite,
  useBidirectionalInfinite,
  type UseInfiniteScrollOptions,
  type UseInfiniteScrollReturn,
  type UseScrollInfiniteOptions,
  type UseBidirectionalInfiniteOptions,
} from './useInfiniteScroll';

// WebSocket & Real-time
export {
  useWebSocket,
  useWebSocketEvent,
} from './useWebSocket';

// Notifications
export {
  useNotifications,
} from './useNotifications';
