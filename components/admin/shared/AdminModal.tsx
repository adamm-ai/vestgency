/**
 * AdminModal Component
 * ====================
 * Reusable modal component for the admin portal.
 * Provides consistent modal styling with animations and accessibility.
 */

import React, { memo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type AdminModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface AdminModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Modal size */
  size?: AdminModalSize;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Close modal when clicking overlay */
  closeOnOverlayClick?: boolean;
  /** Close modal when pressing Escape key */
  closeOnEscape?: boolean;
  /** Footer content (typically action buttons) */
  footer?: React.ReactNode;
  /** Header icon */
  icon?: React.ReactNode;
  /** Additional CSS classes for the modal container */
  className?: string;
  /** Modal content */
  children: React.ReactNode;
}

const sizeClasses: Record<AdminModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * AdminModal - A flexible modal component for admin interfaces
 *
 * @example Basic usage
 * ```tsx
 * <AdminModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Add New Lead"
 * >
 *   <form>...</form>
 * </AdminModal>
 * ```
 *
 * @example With footer actions
 * ```tsx
 * <AdminModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Confirm Delete"
 *   subtitle="This action cannot be undone"
 *   size="sm"
 *   footer={
 *     <div className="flex gap-3">
 *       <button onClick={onClose}>Cancel</button>
 *       <button onClick={onDelete}>Delete</button>
 *     </div>
 *   }
 * >
 *   <p>Are you sure you want to delete this item?</p>
 * </AdminModal>
 * ```
 *
 * @example Full-width modal
 * ```tsx
 * <AdminModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Property Details"
 *   size="full"
 *   icon={<Building2 className="w-5 h-5" />}
 * >
 *   <PropertyForm />
 * </AdminModal>
 * ```
 */
export const AdminModal: React.FC<AdminModalProps> = memo(({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  icon,
  className = '',
  children,
}) => {
  // Handle Escape key press
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [onClose, closeOnEscape]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscapeKey]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={overlayVariants}
            onClick={handleOverlayClick}
          />

          {/* Modal Container */}
          <motion.div
            className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-xl overflow-hidden ${className}`}
            variants={modalVariants}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    {icon}
                  </div>
                )}
                <div>
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

AdminModal.displayName = 'AdminModal';

/**
 * AdminConfirmModal - A specialized confirmation modal
 */
export interface AdminConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = memo(({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const variantStyles = {
    danger: {
      confirmBg: 'bg-red-600 hover:bg-red-700',
      icon: 'text-red-600 bg-red-50',
    },
    warning: {
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
      icon: 'text-yellow-600 bg-yellow-50',
    },
    info: {
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      icon: 'text-blue-600 bg-blue-50',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${styles.confirmBg}`}
          >
            {isLoading ? 'Loading...' : confirmText}
          </button>
        </div>
      }
    >
      <p className="text-gray-600">{message}</p>
    </AdminModal>
  );
});

AdminConfirmModal.displayName = 'AdminConfirmModal';

export default AdminModal;
