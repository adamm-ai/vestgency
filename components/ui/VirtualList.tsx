/**
 * Virtual List Component
 * Efficiently renders large lists using virtual scrolling
 * Only renders visible items plus overscan buffer for optimal performance
 */

import React, { memo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  useVirtualList,
  useDynamicVirtualList,
  VirtualItem,
} from '../../hooks/useVirtualList';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// ============================================================================
// TYPES
// ============================================================================

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number, item: T) => number);
  height: number | string;
  width?: number | string;
  overscan?: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  getItemKey?: (index: number, item: T) => string | number;
  className?: string;
  containerClassName?: string;
  emptyMessage?: React.ReactNode;
  loadingMessage?: React.ReactNode;
  isLoading?: boolean;
  onScroll?: (scrollOffset: number) => void;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  showScrollIndicator?: boolean;
  initialScrollIndex?: number;
}

export interface InfiniteVirtualListProps<T> extends Omit<VirtualListProps<T>, 'onEndReached'> {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingIndicator?: React.ReactNode;
  errorMessage?: React.ReactNode;
  onError?: (error: Error) => void;
  retryLabel?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OVERSCAN = 5;
const END_REACHED_THRESHOLD = 200;

// ============================================================================
// LOADING INDICATOR
// ============================================================================

const LoadingIndicator = memo(({ message }: { message?: React.ReactNode }) => (
  <div className="flex items-center justify-center gap-3 py-6">
    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
    <span className="text-gray-500 dark:text-gray-400 text-sm">
      {message || 'Chargement...'}
    </span>
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

// ============================================================================
// ERROR INDICATOR
// ============================================================================

interface ErrorIndicatorProps {
  message?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

const ErrorIndicator = memo(({ message, onRetry, retryLabel }: ErrorIndicatorProps) => (
  <div className="flex flex-col items-center justify-center gap-3 py-6">
    <AlertCircle className="w-6 h-6 text-red-500" />
    <span className="text-gray-500 dark:text-gray-400 text-sm">
      {message || 'Erreur lors du chargement'}
    </span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        {retryLabel || 'Reessayer'}
      </button>
    )}
  </div>
));

ErrorIndicator.displayName = 'ErrorIndicator';

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState = memo(({ message }: { message?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center h-full py-12">
    <div className="text-gray-400 dark:text-gray-500 text-center">
      {message || 'Aucun element a afficher'}
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

// ============================================================================
// SCROLL INDICATOR
// ============================================================================

interface ScrollIndicatorProps {
  scrollOffset: number;
  totalHeight: number;
  containerHeight: number;
}

const ScrollIndicator = memo(({
  scrollOffset,
  totalHeight,
  containerHeight,
}: ScrollIndicatorProps) => {
  const progress = totalHeight > containerHeight
    ? (scrollOffset / (totalHeight - containerHeight)) * 100
    : 0;

  return (
    <div className="absolute right-1 top-0 bottom-0 w-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
      <motion.div
        className="w-full bg-amber-500/60 rounded-full"
        style={{ height: `${Math.min(100, (containerHeight / totalHeight) * 100)}%` }}
        animate={{ top: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </div>
  );
});

ScrollIndicator.displayName = 'ScrollIndicator';

// ============================================================================
// VIRTUAL LIST COMPONENT
// ============================================================================

function VirtualListInner<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  overscan = DEFAULT_OVERSCAN,
  renderItem,
  getItemKey,
  className = '',
  containerClassName = '',
  emptyMessage,
  loadingMessage,
  isLoading = false,
  onScroll,
  onEndReached,
  endReachedThreshold = END_REACHED_THRESHOLD,
  showScrollIndicator = false,
  initialScrollIndex,
}: VirtualListProps<T>) {
  const prefersReducedMotion = useReducedMotion();
  const hasCalledEndReached = useRef(false);

  // Calculate container height
  const containerHeightNum = typeof height === 'number' ? height : 400;

  // Use virtual list hook
  const {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerRef,
    scrollOffset,
    isScrolling,
    visibleRange,
  } = useVirtualList({
    items,
    itemHeight: typeof itemHeight === 'function' ? itemHeight : itemHeight,
    containerHeight: containerHeightNum,
    overscan,
    getItemKey,
  });

  // Initial scroll
  useEffect(() => {
    if (initialScrollIndex !== undefined && initialScrollIndex >= 0) {
      scrollToIndex(initialScrollIndex, { align: 'start' });
    }
  }, [initialScrollIndex, scrollToIndex]);

  // End reached detection
  useEffect(() => {
    if (!onEndReached) return;

    const distanceFromEnd = totalHeight - scrollOffset - containerHeightNum;

    if (distanceFromEnd <= endReachedThreshold && !hasCalledEndReached.current) {
      hasCalledEndReached.current = true;
      onEndReached();
    } else if (distanceFromEnd > endReachedThreshold) {
      hasCalledEndReached.current = false;
    }
  }, [scrollOffset, totalHeight, containerHeightNum, endReachedThreshold, onEndReached]);

  // Scroll callback
  useEffect(() => {
    if (onScroll) {
      onScroll(scrollOffset);
    }
  }, [scrollOffset, onScroll]);

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <LoadingIndicator message={loadingMessage} />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ height, width }}
    >
      <div
        ref={containerRef}
        className={`
          overflow-auto h-full
          scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600
          scrollbar-track-transparent
          ${containerClassName}
        `}
        style={{
          willChange: isScrolling ? 'scroll-position' : 'auto',
        }}
      >
        {/* Total height spacer */}
        <div
          style={{
            height: totalHeight,
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Rendered items */}
          <AnimatePresence initial={false}>
            {virtualItems.map((virtualItem) => {
              const key = getItemKey
                ? getItemKey(virtualItem.index, virtualItem.item)
                : virtualItem.index;

              const style: React.CSSProperties = {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`,
              };

              return (
                <motion.div
                  key={key}
                  initial={prefersReducedMotion ? {} : { opacity: 0 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={style}
                >
                  {renderItem(virtualItem.item, virtualItem.index, style)}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && (
        <ScrollIndicator
          scrollOffset={scrollOffset}
          totalHeight={totalHeight}
          containerHeight={containerHeightNum}
        />
      )}
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

// ============================================================================
// INFINITE VIRTUAL LIST COMPONENT
// ============================================================================

function InfiniteVirtualListInner<T>({
  items,
  loadMore,
  hasMore,
  loadingIndicator,
  errorMessage,
  onError,
  retryLabel,
  ...virtualListProps
}: InfiniteVirtualListProps<T>) {
  const {
    sentinelRef,
    isLoading,
    error,
    retry,
  } = useInfiniteScroll({
    loadMore,
    hasMore,
    threshold: 0.1,
    enabled: items.length > 0,
  });

  // Call error callback
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Custom render item to include sentinel
  const renderItemWithSentinel = useCallback(
    (item: T, index: number, style: React.CSSProperties) => {
      const isLastItem = index === items.length - 1;

      return (
        <>
          {virtualListProps.renderItem(item, index, style)}
          {isLastItem && hasMore && (
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          )}
        </>
      );
    },
    [items.length, hasMore, sentinelRef, virtualListProps.renderItem]
  );

  return (
    <div className="relative">
      <VirtualList
        {...virtualListProps}
        items={items}
        renderItem={renderItemWithSentinel}
      />

      {/* Loading indicator at bottom */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 glass-morphism">
          {loadingIndicator || <LoadingIndicator />}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 glass-morphism">
          <ErrorIndicator
            message={errorMessage}
            onRetry={retry}
            retryLabel={retryLabel}
          />
        </div>
      )}
    </div>
  );
}

export const InfiniteVirtualList = memo(InfiniteVirtualListInner) as typeof InfiniteVirtualListInner;

// ============================================================================
// DYNAMIC HEIGHT VIRTUAL LIST
// ============================================================================

export interface DynamicVirtualListProps<T> extends Omit<VirtualListProps<T>, 'itemHeight'> {
  estimatedItemHeight: number;
  measureItem?: boolean;
}

function DynamicVirtualListInner<T>({
  items,
  estimatedItemHeight,
  height,
  width = '100%',
  overscan = DEFAULT_OVERSCAN,
  renderItem,
  getItemKey,
  className = '',
  containerClassName = '',
  emptyMessage,
  loadingMessage,
  isLoading = false,
  measureItem = true,
  showScrollIndicator = false,
}: DynamicVirtualListProps<T>) {
  const prefersReducedMotion = useReducedMotion();

  const containerHeightNum = typeof height === 'number' ? height : 400;

  const {
    virtualItems,
    totalHeight,
    containerRef,
    scrollOffset,
    isScrolling,
    measureElement,
  } = useDynamicVirtualList({
    items,
    estimatedItemHeight,
    containerHeight: containerHeightNum,
    overscan,
    getItemKey,
  });

  if (isLoading && items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <LoadingIndicator message={loadingMessage} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height, width }}
      >
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ height, width }}
    >
      <div
        ref={containerRef}
        className={`
          overflow-auto h-full
          scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600
          scrollbar-track-transparent
          ${containerClassName}
        `}
      >
        <div
          style={{
            height: totalHeight,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const key = getItemKey
              ? getItemKey(virtualItem.index, virtualItem.item)
              : virtualItem.index;

            const style: React.CSSProperties = {
              position: 'absolute',
              top: virtualItem.start,
              left: 0,
              width: '100%',
              minHeight: estimatedItemHeight,
            };

            return (
              <div
                key={key}
                ref={measureItem ? (el) => measureElement(virtualItem.index, el) : undefined}
                style={style}
              >
                {renderItem(virtualItem.item, virtualItem.index, style)}
              </div>
            );
          })}
        </div>
      </div>

      {showScrollIndicator && (
        <ScrollIndicator
          scrollOffset={scrollOffset}
          totalHeight={totalHeight}
          containerHeight={containerHeightNum}
        />
      )}
    </div>
  );
}

export const DynamicVirtualList = memo(DynamicVirtualListInner) as typeof DynamicVirtualListInner;

// ============================================================================
// GRID VIRTUAL LIST
// ============================================================================

export interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  containerWidth: number;
  containerHeight: number;
  gap?: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (index: number, item: T) => string | number;
  className?: string;
  emptyMessage?: React.ReactNode;
  isLoading?: boolean;
}

function VirtualGridInner<T>({
  items,
  itemHeight,
  itemWidth,
  containerWidth,
  containerHeight,
  gap = 16,
  overscan = 2,
  renderItem,
  getItemKey,
  className = '',
  emptyMessage,
  isLoading = false,
}: VirtualGridProps<T>) {
  const prefersReducedMotion = useReducedMotion();

  // Calculate grid dimensions
  const columnsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (itemWidth + gap)));
  const totalRows = Math.ceil(items.length / columnsPerRow);
  const rowHeight = itemHeight + gap;
  const totalHeight = totalRows * rowHeight - gap;

  // Use virtual list for rows
  const {
    virtualItems: virtualRows,
    containerRef,
    scrollOffset,
  } = useVirtualList({
    items: Array.from({ length: totalRows }, (_, i) => i),
    itemHeight: rowHeight,
    containerHeight,
    overscan,
  });

  if (isLoading && items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight, width: containerWidth }}
      >
        <LoadingIndicator />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight, width: containerWidth }}
      >
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight, width: containerWidth }}
    >
      <div
        style={{
          height: totalHeight,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const rowIndex = virtualRow.item;
          const startItemIndex = rowIndex * columnsPerRow;
          const rowItems = items.slice(startItemIndex, startItemIndex + columnsPerRow);

          return (
            <div
              key={rowIndex}
              style={{
                position: 'absolute',
                top: virtualRow.start,
                left: 0,
                width: '100%',
                height: itemHeight,
                display: 'flex',
                gap,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const itemIndex = startItemIndex + colIndex;
                const key = getItemKey ? getItemKey(itemIndex, item) : itemIndex;

                return (
                  <motion.div
                    key={key}
                    initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      width: itemWidth,
                      height: itemHeight,
                      flexShrink: 0,
                    }}
                  >
                    {renderItem(item, itemIndex)}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const VirtualGrid = memo(VirtualGridInner) as typeof VirtualGridInner;

export default VirtualList;
