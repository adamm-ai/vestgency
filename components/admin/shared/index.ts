/**
 * Admin Shared Module Exports
 * ===========================
 * Re-exports all shared types, constants, utilities, and components
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils';

// Shared Components
export { AdminCard } from './AdminCard';
export type { AdminCardProps, AdminCardVariant } from './AdminCard';

export { AdminModal, AdminConfirmModal } from './AdminModal';
export type { AdminModalProps, AdminModalSize, AdminConfirmModalProps } from './AdminModal';

export { AdminTable } from './AdminTable';
export type { AdminTableProps, AdminTableColumn, AdminTablePagination } from './AdminTable';
