/**
 * AdminTable Component
 * ====================
 * Reusable table component for the admin portal.
 * Supports sorting, pagination, selection, and custom rendering.
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Minus,
} from 'lucide-react';

export interface AdminTableColumn<T> {
  /** Unique key for the column */
  key: keyof T | string;
  /** Column header text */
  header: string;
  /** Column width (CSS value) */
  width?: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom render function for cells */
  render?: (item: T, index: number) => React.ReactNode;
  /** Hide column on mobile */
  hideOnMobile?: boolean;
}

export interface AdminTablePagination {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
}

export interface AdminTableProps<T> {
  /** Array of data to display */
  data: T[];
  /** Column definitions */
  columns: AdminTableColumn<T>[];
  /** Function to extract unique key from each item */
  keyExtractor: (item: T) => string;
  /** Callback when a row is clicked */
  onRowClick?: (item: T) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Message to display when data is empty */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: React.ReactNode;
  /** Pagination configuration */
  pagination?: AdminTablePagination;
  /** Enable row selection */
  selectable?: boolean;
  /** Array of selected item IDs */
  selectedIds?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (ids: string[]) => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode (smaller padding) */
  compact?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Hover effect on rows */
  hoverable?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

/**
 * AdminTable - A flexible table component for admin interfaces
 *
 * @example Basic usage
 * ```tsx
 * <AdminTable
 *   data={users}
 *   columns={[
 *     { key: 'name', header: 'Name' },
 *     { key: 'email', header: 'Email' },
 *     { key: 'role', header: 'Role' },
 *   ]}
 *   keyExtractor={(user) => user.id}
 * />
 * ```
 *
 * @example With custom rendering and pagination
 * ```tsx
 * <AdminTable
 *   data={properties}
 *   columns={[
 *     { key: 'name', header: 'Property', sortable: true },
 *     {
 *       key: 'price',
 *       header: 'Price',
 *       align: 'right',
 *       render: (p) => formatPrice(p.price),
 *     },
 *     {
 *       key: 'actions',
 *       header: '',
 *       render: (p) => <ActionButtons property={p} />,
 *     },
 *   ]}
 *   keyExtractor={(p) => p.id}
 *   pagination={{
 *     page: currentPage,
 *     pageSize: 10,
 *     total: totalItems,
 *     onPageChange: setCurrentPage,
 *   }}
 *   onRowClick={(p) => openPropertyModal(p)}
 * />
 * ```
 *
 * @example With selection
 * ```tsx
 * <AdminTable
 *   data={leads}
 *   columns={columns}
 *   keyExtractor={(l) => l.id}
 *   selectable
 *   selectedIds={selectedLeadIds}
 *   onSelectionChange={setSelectedLeadIds}
 * />
 * ```
 */
function AdminTableInner<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  pagination,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  className = '',
  compact = false,
  striped = false,
  hoverable = true,
}: AdminTableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });

  // Handle column sort
  const handleSort = useCallback((columnKey: string) => {
    setSortState((prev) => {
      if (prev.column !== columnKey) {
        return { column: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: columnKey, direction: 'desc' };
      }
      return { column: null, direction: null };
    });
  }, []);

  // Sort data if needed
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return data;
    }

    const column = columns.find((c) => c.key === sortState.column);
    if (!column?.sortable) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortState.column as string];
      const bValue = (b as Record<string, unknown>)[sortState.column as string];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, columns, sortState]);

  // Selection handlers
  const allSelected = useMemo(
    () => data.length > 0 && selectedIds.length === data.length,
    [data.length, selectedIds.length]
  );

  const someSelected = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < data.length,
    [data.length, selectedIds.length]
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map(keyExtractor));
    }
  }, [allSelected, data, keyExtractor, onSelectionChange]);

  const handleSelectRow = useCallback(
    (id: string) => {
      if (!onSelectionChange) return;
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((i) => i !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    },
    [selectedIds, onSelectionChange]
  );

  // Cell padding classes
  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';
  const headerPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  // Alignment classes
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // Calculate pagination info
  const paginationInfo = pagination
    ? {
        startItem: (pagination.page - 1) * pagination.pageSize + 1,
        endItem: Math.min(pagination.page * pagination.pageSize, pagination.total),
        totalPages: Math.ceil(pagination.total / pagination.pageSize),
      }
    : null;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Selection checkbox column */}
              {selectable && (
                <th className={`${headerPadding} w-12`}>
                  <button
                    onClick={handleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      allSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : someSelected
                        ? 'bg-blue-100 border-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {allSelected && <Check className="w-3 h-3" />}
                    {someSelected && <Minus className="w-3 h-3 text-blue-600" />}
                  </button>
                </th>
              )}

              {/* Data columns */}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`${headerPadding} ${alignClasses[column.align || 'left']} text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.hideOnMobile ? 'hidden md:table-cell' : ''
                  }`}
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(String(column.key))}
                      className="flex items-center gap-1 hover:text-gray-700 transition-colors group"
                    >
                      {column.header}
                      <span className="flex flex-col">
                        <ChevronUp
                          className={`w-3 h-3 -mb-1 ${
                            sortState.column === column.key &&
                            sortState.direction === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-300 group-hover:text-gray-400'
                          }`}
                        />
                        <ChevronDown
                          className={`w-3 h-3 ${
                            sortState.column === column.key &&
                            sortState.direction === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-300 group-hover:text-gray-400'
                          }`}
                        />
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            <AnimatePresence mode="wait">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {selectable && (
                      <td className={cellPadding}>
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`${cellPadding} ${
                          column.hideOnMobile ? 'hidden md:table-cell' : ''
                        }`}
                      >
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                // Empty state
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      {emptyIcon && (
                        <div className="p-3 bg-gray-100 rounded-full text-gray-400">
                          {emptyIcon}
                        </div>
                      )}
                      <p className="text-gray-500">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                sortedData.map((item, index) => {
                  const itemId = keyExtractor(item);
                  const isSelected = selectedIds.includes(itemId);

                  return (
                    <motion.tr
                      key={itemId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => onRowClick?.(item)}
                      className={`
                        ${onRowClick ? 'cursor-pointer' : ''}
                        ${hoverable ? 'hover:bg-gray-50' : ''}
                        ${striped && index % 2 === 1 ? 'bg-gray-50/50' : ''}
                        ${isSelected ? 'bg-blue-50' : ''}
                        transition-colors
                      `}
                    >
                      {/* Selection checkbox */}
                      {selectable && (
                        <td
                          className={cellPadding}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleSelectRow(itemId)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        </td>
                      )}

                      {/* Data cells */}
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={`${cellPadding} ${alignClasses[column.align || 'left']} text-sm text-gray-900 ${
                            column.hideOnMobile ? 'hidden md:table-cell' : ''
                          }`}
                        >
                          {column.render
                            ? column.render(item, index)
                            : String(
                                (item as Record<string, unknown>)[
                                  column.key as string
                                ] ?? ''
                              )}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && paginationInfo && paginationInfo.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">
            Showing {paginationInfo.startItem} to {paginationInfo.endItem} of{' '}
            {pagination.total} results
          </div>

          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: paginationInfo.totalPages })
                .map((_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current, and adjacent pages
                  return (
                    page === 1 ||
                    page === paginationInfo.totalPages ||
                    Math.abs(page - pagination.page) <= 1
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const showEllipsisBefore =
                    index > 0 && page - array[index - 1] > 1;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => pagination.onPageChange(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-white border border-transparent hover:border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            {/* Next button */}
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === paginationInfo.totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize the component
export const AdminTable = memo(AdminTableInner) as typeof AdminTableInner;

export default AdminTable;
