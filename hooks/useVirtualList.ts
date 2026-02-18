/**
 * Virtual List Hook
 * Implements virtual scrolling for efficient rendering of large lists
 * Only renders visible items plus overscan buffer
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface VirtualItem<T> {
  index: number;
  item: T;
  start: number;
  size: number;
  end: number;
}

export interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number | ((index: number, item: T) => number);
  containerHeight: number;
  overscan?: number;
  estimatedItemHeight?: number;
  getItemKey?: (index: number, item: T) => string | number;
}

export interface UseVirtualListReturn<T> {
  virtualItems: VirtualItem<T>[];
  totalHeight: number;
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
  scrollToOffset: (offset: number, options?: ScrollToOptions) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollOffset: number;
  isScrolling: boolean;
  visibleRange: { start: number; end: number };
}

export interface ScrollToOptions {
  align?: 'start' | 'center' | 'end' | 'auto';
  behavior?: 'auto' | 'smooth';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OVERSCAN = 3;
const SCROLL_DEBOUNCE_MS = 150;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Binary search to find the start index for a given scroll offset
 */
function findStartIndex(
  itemOffsets: number[],
  scrollOffset: number
): number {
  let low = 0;
  let high = itemOffsets.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const offset = itemOffsets[mid];

    if (offset === scrollOffset) {
      return mid;
    } else if (offset < scrollOffset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.max(0, low - 1);
}

/**
 * Find the end index that fills the container
 */
function findEndIndex(
  itemOffsets: number[],
  itemSizes: number[],
  startIndex: number,
  containerHeight: number,
  scrollOffset: number
): number {
  const endOffset = scrollOffset + containerHeight;
  let index = startIndex;

  while (index < itemOffsets.length) {
    const itemEnd = itemOffsets[index] + itemSizes[index];
    if (itemEnd >= endOffset) {
      return index;
    }
    index++;
  }

  return itemOffsets.length - 1;
}

// ============================================================================
// HOOK
// ============================================================================

export function useVirtualList<T>(
  options: UseVirtualListOptions<T>
): UseVirtualListReturn<T> {
  const {
    items,
    itemHeight,
    containerHeight,
    overscan = DEFAULT_OVERSCAN,
    estimatedItemHeight,
    getItemKey,
  } = options;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollingTimeoutRef = useRef<number | null>(null);
  const measurementCacheRef = useRef<Map<string | number, number>>(new Map());

  // State
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Calculate item sizes and offsets
  const { itemSizes, itemOffsets, totalHeight } = useMemo(() => {
    const sizes: number[] = [];
    const offsets: number[] = [];
    let currentOffset = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const key = getItemKey ? getItemKey(i, item) : i;

      // Check measurement cache for variable height items
      let size: number;
      if (typeof itemHeight === 'function') {
        const cachedSize = measurementCacheRef.current.get(key);
        size = cachedSize ?? itemHeight(i, item);
      } else {
        size = itemHeight;
      }

      sizes.push(size);
      offsets.push(currentOffset);
      currentOffset += size;
    }

    return {
      itemSizes: sizes,
      itemOffsets: offsets,
      totalHeight: currentOffset,
    };
  }, [items, itemHeight, getItemKey]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: 0 };
    }

    const startIndex = findStartIndex(itemOffsets, scrollOffset);
    const endIndex = findEndIndex(
      itemOffsets,
      itemSizes,
      startIndex,
      containerHeight,
      scrollOffset
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [items.length, itemOffsets, itemSizes, scrollOffset, containerHeight, overscan]);

  // Generate virtual items
  const virtualItems = useMemo((): VirtualItem<T>[] => {
    if (items.length === 0) {
      return [];
    }

    const result: VirtualItem<T>[] = [];

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const item = items[i];
      const size = itemSizes[i];
      const start = itemOffsets[i];

      result.push({
        index: i,
        item,
        start,
        size,
        end: start + size,
      });
    }

    return result;
  }, [items, visibleRange, itemSizes, itemOffsets]);

  // Scroll handling
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const newOffset = container.scrollTop;
    setScrollOffset(newOffset);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollingTimeoutRef.current !== null) {
      window.clearTimeout(scrollingTimeoutRef.current);
    }

    // Set new timeout to mark scrolling as complete
    scrollingTimeoutRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, SCROLL_DEBOUNCE_MS);
  }, []);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollingTimeoutRef.current !== null) {
        window.clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, options: ScrollToOptions = {}) => {
      const { align = 'auto', behavior = 'auto' } = options;
      const container = containerRef.current;

      if (!container || index < 0 || index >= items.length) return;

      const itemStart = itemOffsets[index];
      const itemSize = itemSizes[index];
      const itemEnd = itemStart + itemSize;

      let targetOffset: number;

      switch (align) {
        case 'start':
          targetOffset = itemStart;
          break;
        case 'end':
          targetOffset = itemEnd - containerHeight;
          break;
        case 'center':
          targetOffset = itemStart - (containerHeight - itemSize) / 2;
          break;
        case 'auto':
        default:
          // Scroll minimum amount to make item visible
          if (itemStart < scrollOffset) {
            targetOffset = itemStart;
          } else if (itemEnd > scrollOffset + containerHeight) {
            targetOffset = itemEnd - containerHeight;
          } else {
            return; // Already visible
          }
          break;
      }

      targetOffset = Math.max(0, Math.min(targetOffset, totalHeight - containerHeight));

      container.scrollTo({
        top: targetOffset,
        behavior,
      });
    },
    [items.length, itemOffsets, itemSizes, containerHeight, scrollOffset, totalHeight]
  );

  // Scroll to offset
  const scrollToOffset = useCallback(
    (offset: number, options: ScrollToOptions = {}) => {
      const { behavior = 'auto' } = options;
      const container = containerRef.current;

      if (!container) return;

      const clampedOffset = Math.max(0, Math.min(offset, totalHeight - containerHeight));

      container.scrollTo({
        top: clampedOffset,
        behavior,
      });
    },
    [totalHeight, containerHeight]
  );

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    scrollToOffset,
    containerRef,
    scrollOffset,
    isScrolling,
    visibleRange,
  };
}

// ============================================================================
// DYNAMIC HEIGHT VIRTUAL LIST HOOK
// ============================================================================

export interface UseDynamicVirtualListOptions<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemKey?: (index: number, item: T) => string | number;
}

/**
 * Virtual list hook for items with unknown/dynamic heights
 * Measures items as they are rendered and caches the results
 */
export function useDynamicVirtualList<T>(
  options: UseDynamicVirtualListOptions<T>
): UseVirtualListReturn<T> & {
  measureElement: (index: number, element: HTMLElement | null) => void;
} {
  const {
    items,
    estimatedItemHeight,
    containerHeight,
    overscan = DEFAULT_OVERSCAN,
    getItemKey,
  } = options;

  // Measurement cache
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(
    new Map()
  );

  // Create item height function that uses measured values or estimates
  const itemHeight = useCallback(
    (index: number): number => {
      return measuredHeights.get(index) ?? estimatedItemHeight;
    },
    [measuredHeights, estimatedItemHeight]
  );

  // Use base virtual list hook
  const virtualListReturn = useVirtualList({
    items,
    itemHeight,
    containerHeight,
    overscan,
    estimatedItemHeight,
    getItemKey,
  });

  // Measurement function to be called when items are rendered
  const measureElement = useCallback(
    (index: number, element: HTMLElement | null) => {
      if (!element) return;

      const height = element.getBoundingClientRect().height;
      const currentHeight = measuredHeights.get(index);

      // Only update if the height changed
      if (currentHeight !== height) {
        setMeasuredHeights((prev) => {
          const next = new Map(prev);
          next.set(index, height);
          return next;
        });
      }
    },
    [measuredHeights]
  );

  return {
    ...virtualListReturn,
    measureElement,
  };
}

export default useVirtualList;
