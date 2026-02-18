/**
 * Pagination Component
 * Reusable pagination UI with glassmorphism styling
 * Supports page navigation, page size selection, and accessibility
 */

import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
  showPageSizeSelector?: boolean;
  showItemCount?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'rounded';
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CLASSES = {
  sm: {
    button: 'w-8 h-8 text-sm',
    select: 'h-8 text-sm px-2',
    text: 'text-sm',
  },
  md: {
    button: 'w-10 h-10 text-base',
    select: 'h-10 text-base px-3',
    text: 'text-base',
  },
  lg: {
    button: 'w-12 h-12 text-lg',
    select: 'h-12 text-lg px-4',
    text: 'text-lg',
  },
};

const MAX_VISIBLE_PAGES = 7;

// ============================================================================
// UTILITIES
// ============================================================================

function generatePageRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number
): (number | 'ellipsis-start' | 'ellipsis-end')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const sidePages = Math.floor((maxVisible - 3) / 2);
  const leftStart = currentPage - sidePages;
  const leftEnd = currentPage + sidePages;

  const showLeftEllipsis = leftStart > 2;
  const showRightEllipsis = leftEnd < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftPages = Array.from({ length: maxVisible - 2 }, (_, i) => i + 1);
    return [...leftPages, 'ellipsis-end', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightPages = Array.from(
      { length: maxVisible - 2 },
      (_, i) => totalPages - (maxVisible - 3) + i
    );
    return [1, 'ellipsis-start', ...rightPages];
  }

  if (showLeftEllipsis && showRightEllipsis) {
    const middlePages = Array.from(
      { length: maxVisible - 4 },
      (_, i) => currentPage - Math.floor((maxVisible - 4) / 2) + i
    );
    return [1, 'ellipsis-start', ...middlePages, 'ellipsis-end', totalPages];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface PageButtonProps {
  page: number | 'ellipsis-start' | 'ellipsis-end';
  isActive: boolean;
  onClick: (page: number) => void;
  disabled: boolean;
  sizeClass: string;
  reducedMotion: boolean;
}

const PageButton = memo(({
  page,
  isActive,
  onClick,
  disabled,
  sizeClass,
  reducedMotion,
}: PageButtonProps) => {
  if (page === 'ellipsis-start' || page === 'ellipsis-end') {
    return (
      <span
        className={`${sizeClass} flex items-center justify-center text-gray-400 dark:text-gray-500`}
        aria-hidden="true"
      >
        <MoreHorizontal className="w-4 h-4" />
      </span>
    );
  }

  const handleClick = useCallback(() => {
    if (!disabled && !isActive) {
      onClick(page);
    }
  }, [onClick, page, disabled, isActive]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || isActive}
      whileHover={reducedMotion ? {} : { scale: 1.05 }}
      whileTap={reducedMotion ? {} : { scale: 0.95 }}
      className={`
        ${sizeClass}
        flex items-center justify-center rounded-xl font-medium
        transition-all duration-200
        ${
          isActive
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
            : 'glass-morphism text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-white/10'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
      `}
      aria-label={`Page ${page}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {page}
    </motion.button>
  );
});

PageButton.displayName = 'PageButton';

interface NavigationButtonProps {
  direction: 'first' | 'prev' | 'next' | 'last';
  onClick: () => void;
  disabled: boolean;
  sizeClass: string;
  reducedMotion: boolean;
}

const NavigationButton = memo(({
  direction,
  onClick,
  disabled,
  sizeClass,
  reducedMotion,
}: NavigationButtonProps) => {
  const icons = {
    first: ChevronsLeft,
    prev: ChevronLeft,
    next: ChevronRight,
    last: ChevronsRight,
  };

  const labels = {
    first: 'First page',
    prev: 'Previous page',
    next: 'Next page',
    last: 'Last page',
  };

  const Icon = icons[direction];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={reducedMotion || disabled ? {} : { scale: 1.05 }}
      whileTap={reducedMotion || disabled ? {} : { scale: 0.95 }}
      className={`
        ${sizeClass}
        flex items-center justify-center rounded-xl
        glass-morphism text-gray-700 dark:text-gray-200
        transition-all duration-200
        ${
          disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer'
        }
        focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
      `}
      aria-label={labels[direction]}
    >
      <Icon className="w-5 h-5" />
    </motion.button>
  );
});

NavigationButton.displayName = 'NavigationButton';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Pagination = memo(({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  totalItems,
  showPageSizeSelector = false,
  showItemCount = false,
  showFirstLast = true,
  maxVisiblePages = MAX_VISIBLE_PAGES,
  size = 'md',
  variant = 'default',
  disabled = false,
  className = '',
}: PaginationProps) => {
  const prefersReducedMotion = useReducedMotion();
  const sizeClasses = SIZE_CLASSES[size];

  // Generate page range
  const pageRange = generatePageRange(currentPage, totalPages, maxVisiblePages);

  // Calculate item range for display
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  // Handlers
  const handlePageChange = useCallback(
    (page: number) => {
      if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page);
      }
    },
    [disabled, totalPages, currentPage, onPageChange]
  );

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onPageSizeChange) {
        onPageSizeChange(Number(e.target.value));
      }
    },
    [onPageSizeChange]
  );

  const goToFirst = useCallback(() => handlePageChange(1), [handlePageChange]);
  const goToPrev = useCallback(
    () => handlePageChange(currentPage - 1),
    [handlePageChange, currentPage]
  );
  const goToNext = useCallback(
    () => handlePageChange(currentPage + 1),
    [handlePageChange, currentPage]
  );
  const goToLast = useCallback(
    () => handlePageChange(totalPages),
    [handlePageChange, totalPages]
  );

  if (totalPages <= 1 && !showPageSizeSelector && !showItemCount) {
    return null;
  }

  return (
    <motion.nav
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      className={`
        flex flex-wrap items-center justify-center gap-3 sm:gap-4
        ${className}
      `}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Item count */}
      {showItemCount && totalItems !== undefined && (
        <span className={`${sizeClasses.text} text-gray-600 dark:text-gray-400`}>
          {startItem}-{endItem} sur {totalItems.toLocaleString()}
        </span>
      )}

      {/* Page size selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label
            htmlFor="page-size"
            className={`${sizeClasses.text} text-gray-600 dark:text-gray-400 whitespace-nowrap`}
          >
            Par page:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={disabled}
            className={`
              ${sizeClasses.select}
              glass-morphism rounded-xl
              text-gray-700 dark:text-gray-200
              border-0 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-amber-500
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-2">
          {/* First page button */}
          {showFirstLast && (
            <NavigationButton
              direction="first"
              onClick={goToFirst}
              disabled={disabled || currentPage === 1}
              sizeClass={sizeClasses.button}
              reducedMotion={prefersReducedMotion}
            />
          )}

          {/* Previous page button */}
          <NavigationButton
            direction="prev"
            onClick={goToPrev}
            disabled={disabled || currentPage === 1}
            sizeClass={sizeClasses.button}
            reducedMotion={prefersReducedMotion}
          />

          {/* Page numbers */}
          <AnimatePresence mode="wait">
            <div className="flex items-center gap-1">
              {pageRange.map((page, index) => (
                <PageButton
                  key={typeof page === 'number' ? page : `${page}-${index}`}
                  page={page}
                  isActive={page === currentPage}
                  onClick={handlePageChange}
                  disabled={disabled}
                  sizeClass={sizeClasses.button}
                  reducedMotion={prefersReducedMotion}
                />
              ))}
            </div>
          </AnimatePresence>

          {/* Next page button */}
          <NavigationButton
            direction="next"
            onClick={goToNext}
            disabled={disabled || currentPage === totalPages}
            sizeClass={sizeClasses.button}
            reducedMotion={prefersReducedMotion}
          />

          {/* Last page button */}
          {showFirstLast && (
            <NavigationButton
              direction="last"
              onClick={goToLast}
              disabled={disabled || currentPage === totalPages}
              sizeClass={sizeClasses.button}
              reducedMotion={prefersReducedMotion}
            />
          )}
        </div>
      )}
    </motion.nav>
  );
});

Pagination.displayName = 'Pagination';

// ============================================================================
// COMPACT PAGINATION VARIANT
// ============================================================================

export interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

export const CompactPagination = memo(({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className = '',
}: CompactPaginationProps) => {
  const prefersReducedMotion = useReducedMotion();

  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      <motion.button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        className={`
          w-9 h-9 flex items-center justify-center rounded-full
          glass-morphism text-gray-700 dark:text-gray-200
          ${
            disabled || currentPage === 1
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer'
          }
          transition-all duration-200
        `}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
        {currentPage} / {totalPages}
      </span>

      <motion.button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        className={`
          w-9 h-9 flex items-center justify-center rounded-full
          glass-morphism text-gray-700 dark:text-gray-200
          ${
            disabled || currentPage === totalPages
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer'
          }
          transition-all duration-200
        `}
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
});

CompactPagination.displayName = 'CompactPagination';

export default Pagination;
