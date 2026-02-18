/**
 * Pagination Hook
 * Manages pagination state and provides utilities for paginated data
 * Optimized for large datasets (10K+ items)
 */

import { useState, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  totalItems: number;
  pageSizeOptions?: number[];
}

export interface UsePaginationReturn<T = unknown> {
  // State
  state: PaginationState;

  // Navigation
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;

  // Page size
  setPageSize: (size: number) => void;
  pageSizeOptions: number[];

  // Computed values
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  pageRange: number[];

  // Data slicing utility
  pageItems: <T>(items: T[]) => T[];

  // Reset
  reset: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const MAX_VISIBLE_PAGES = 7;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculate the range of page numbers to display
 * Uses ellipsis strategy for large page counts
 */
function calculatePageRange(currentPage: number, totalPages: number): number[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const range: number[] = [];
  const leftSiblingIndex = Math.max(currentPage - 1, 1);
  const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    // Show more pages at the start
    const leftRange = Array.from({ length: 5 }, (_, i) => i + 1);
    return [...leftRange, -1, totalPages]; // -1 represents ellipsis
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    // Show more pages at the end
    const rightRange = Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
    return [1, -1, ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    // Show pages around current
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, -1, ...middleRange, -2, totalPages]; // -1 and -2 represent different ellipsis keys
  }

  return range;
}

// ============================================================================
// HOOK
// ============================================================================

export function usePagination<T = unknown>(
  options: UsePaginationOptions
): UsePaginationReturn<T> {
  const {
    initialPage = 1,
    initialPageSize = DEFAULT_PAGE_SIZE,
    totalItems,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  } = options;

  // State
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Computed values
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrevPage = useMemo(() => page > 1, [page]);

  const startIndex = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize, totalItems),
    [startIndex, pageSize, totalItems]
  );

  const pageRange = useMemo(
    () => calculatePageRange(page, totalPages),
    [page, totalPages]
  );

  // State object
  const state: PaginationState = useMemo(
    () => ({
      page,
      pageSize,
      totalItems,
      totalPages,
    }),
    [page, pageSize, totalItems, totalPages]
  );

  // Navigation functions
  const goToPage = useCallback(
    (newPage: number) => {
      const clampedPage = Math.max(1, Math.min(newPage, totalPages));
      setPage(clampedPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  const goToFirst = useCallback(() => {
    setPage(1);
  }, []);

  const goToLast = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  // Page size management
  const setPageSize = useCallback(
    (newSize: number) => {
      // Calculate which item should still be visible after resize
      const firstVisibleItem = (page - 1) * pageSize;
      const newPage = Math.floor(firstVisibleItem / newSize) + 1;

      setPageSizeState(newSize);
      setPage(Math.max(1, Math.min(newPage, Math.ceil(totalItems / newSize))));
    },
    [page, pageSize, totalItems]
  );

  // Data slicing utility
  const pageItems = useCallback(
    <T>(items: T[]): T[] => {
      return items.slice(startIndex, endIndex);
    },
    [startIndex, endIndex]
  );

  // Reset function
  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    state,
    goToPage,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    setPageSize,
    pageSizeOptions,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    pageRange,
    pageItems,
    reset,
  };
}

// ============================================================================
// SERVER-SIDE PAGINATION HOOK
// ============================================================================

export interface UseServerPaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export interface UseServerPaginationReturn {
  page: number;
  pageSize: number;
  offset: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  pageSizeOptions: number[];
  reset: () => void;

  // Utility for building query params
  getQueryParams: () => { page: number; limit: number; offset: number };
}

/**
 * Simplified pagination hook for server-side pagination
 * Use when the server handles the actual data slicing
 */
export function useServerPagination(
  options: UseServerPaginationOptions = {}
): UseServerPaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = DEFAULT_PAGE_SIZE,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, newPage));
  }, []);

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPageState(1); // Reset to first page when changing page size
  }, []);

  const reset = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  const getQueryParams = useCallback(
    () => ({
      page,
      limit: pageSize,
      offset,
    }),
    [page, pageSize, offset]
  );

  return {
    page,
    pageSize,
    offset,
    setPage,
    setPageSize,
    pageSizeOptions,
    reset,
    getQueryParams,
  };
}

export default usePagination;
