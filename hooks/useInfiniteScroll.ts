/**
 * Infinite Scroll Hook
 * Implements infinite scrolling with intersection observer
 * Efficient for loading large datasets incrementally
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface UseInfiniteScrollOptions {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  initialLoad?: boolean;
}

export interface UseInfiniteScrollReturn {
  sentinelRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
  retry: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_THRESHOLD = 0.1;
const DEFAULT_ROOT_MARGIN = '100px';

// ============================================================================
// HOOK
// ============================================================================

export function useInfiniteScroll(
  options: UseInfiniteScrollOptions
): UseInfiniteScrollReturn {
  const {
    loadMore,
    hasMore,
    threshold = DEFAULT_THRESHOLD,
    rootMargin = DEFAULT_ROOT_MARGIN,
    enabled = true,
    initialLoad = false,
  } = options;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const hasLoadedInitialRef = useRef(false);

  // Load more function with error handling
  const handleLoadMore = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current || !hasMore || !enabled) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      await loadMore();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more items'));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [loadMore, hasMore, enabled]);

  // Retry function
  const retry = useCallback(() => {
    setError(null);
    handleLoadMore();
  }, [handleLoadMore]);

  // Reset function
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    loadingRef.current = false;
    hasLoadedInitialRef.current = false;
  }, []);

  // Initial load
  useEffect(() => {
    if (initialLoad && !hasLoadedInitialRef.current && hasMore && enabled) {
      hasLoadedInitialRef.current = true;
      handleLoadMore();
    }
  }, [initialLoad, hasMore, enabled, handleLoadMore]);

  // Set up intersection observer
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Don't observe if disabled or no more items
    if (!enabled || !hasMore) {
      return;
    }

    const handleIntersection: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;

      if (entry.isIntersecting && !loadingRef.current) {
        handleLoadMore();
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin,
      threshold,
    });

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observerRef.current.observe(sentinel);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, rootMargin, threshold, handleLoadMore]);

  return {
    sentinelRef,
    isLoading,
    error,
    reset,
    retry,
  };
}

// ============================================================================
// SCROLL-BASED INFINITE SCROLL HOOK
// ============================================================================

export interface UseScrollInfiniteOptions {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  scrollThreshold?: number;
  containerRef?: React.RefObject<HTMLElement>;
  enabled?: boolean;
  direction?: 'down' | 'up';
}

/**
 * Alternative infinite scroll using scroll position
 * Useful when intersection observer doesn't fit the use case
 */
export function useScrollInfinite(
  options: UseScrollInfiniteOptions
): {
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
} {
  const {
    loadMore,
    hasMore,
    scrollThreshold = 200,
    containerRef,
    enabled = true,
    direction = 'down',
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  const handleLoadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || !enabled) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      await loadMore();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more items'));
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [loadMore, hasMore, enabled]);

  useEffect(() => {
    if (!enabled || !hasMore) return;

    const handleScroll = () => {
      const container = containerRef?.current || document.documentElement;

      let shouldLoad = false;

      if (direction === 'down') {
        const scrollBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        shouldLoad = scrollBottom <= scrollThreshold;
      } else {
        shouldLoad = container.scrollTop <= scrollThreshold;
      }

      if (shouldLoad && !loadingRef.current) {
        handleLoadMore();
      }
    };

    const target = containerRef?.current || window;
    target.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      target.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, enabled, hasMore, scrollThreshold, direction, handleLoadMore]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    loadingRef.current = false;
  }, []);

  return {
    isLoading,
    error,
    reset,
  };
}

// ============================================================================
// BIDIRECTIONAL INFINITE SCROLL HOOK
// ============================================================================

export interface UseBidirectionalInfiniteOptions {
  loadMore: () => Promise<void>;
  loadPrevious: () => Promise<void>;
  hasMore: boolean;
  hasPrevious: boolean;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Bidirectional infinite scroll for chat-like interfaces
 * Loads content when scrolling in either direction
 */
export function useBidirectionalInfinite(
  options: UseBidirectionalInfiniteOptions
): {
  topSentinelRef: React.RefObject<HTMLDivElement>;
  bottomSentinelRef: React.RefObject<HTMLDivElement>;
  isLoadingTop: boolean;
  isLoadingBottom: boolean;
  error: Error | null;
} {
  const {
    loadMore,
    loadPrevious,
    hasMore,
    hasPrevious,
    threshold = 0.1,
    enabled = true,
  } = options;

  const [isLoadingTop, setIsLoadingTop] = useState(false);
  const [isLoadingBottom, setIsLoadingBottom] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef({ top: false, bottom: false });

  // Load previous (top)
  useEffect(() => {
    if (!enabled || !hasPrevious) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingRef.current.top) {
          loadingRef.current.top = true;
          setIsLoadingTop(true);
          setError(null);

          try {
            await loadPrevious();
          } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load'));
          } finally {
            loadingRef.current.top = false;
            setIsLoadingTop(false);
          }
        }
      },
      { threshold }
    );

    const sentinel = topSentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled, hasPrevious, loadPrevious, threshold]);

  // Load more (bottom)
  useEffect(() => {
    if (!enabled || !hasMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingRef.current.bottom) {
          loadingRef.current.bottom = true;
          setIsLoadingBottom(true);
          setError(null);

          try {
            await loadMore();
          } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load'));
          } finally {
            loadingRef.current.bottom = false;
            setIsLoadingBottom(false);
          }
        }
      },
      { threshold }
    );

    const sentinel = bottomSentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled, hasMore, loadMore, threshold]);

  return {
    topSentinelRef,
    bottomSentinelRef,
    isLoadingTop,
    isLoadingBottom,
    error,
  };
}

export default useInfiniteScroll;
