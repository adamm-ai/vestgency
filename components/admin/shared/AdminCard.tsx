/**
 * AdminCard Component
 * ===================
 * Reusable card component for the admin portal.
 * Provides consistent styling and animation across all admin views.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';

export type AdminCardVariant = 'default' | 'stat' | 'highlight' | 'outlined';

export interface AdminCardProps {
  /** Card title displayed at the top */
  title?: string;
  /** Subtitle displayed below the title */
  subtitle?: string;
  /** Icon displayed next to the title */
  icon?: React.ReactNode;
  /** Icon background color (for stat variant) */
  iconBg?: string;
  /** Icon color (for stat variant) */
  iconColor?: string;
  /** Actions displayed in the card header (right side) */
  actions?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Card variant for different styling */
  variant?: AdminCardVariant;
  /** Click handler for the entire card */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children?: React.ReactNode;
  /** Disable hover animation */
  disableHover?: boolean;
  /** Custom padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Loading state */
  isLoading?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses = {
  default: 'bg-white border border-gray-200 shadow-sm',
  stat: 'bg-white border border-gray-200 shadow-sm',
  highlight: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg',
  outlined: 'bg-white border-2 border-gray-300',
};

/**
 * AdminCard - A flexible card component for admin interfaces
 *
 * @example Basic usage
 * ```tsx
 * <AdminCard title="Statistics">
 *   <p>Card content here</p>
 * </AdminCard>
 * ```
 *
 * @example Stat card with icon
 * ```tsx
 * <AdminCard
 *   variant="stat"
 *   title="Total Users"
 *   icon={<Users className="w-5 h-5" />}
 *   iconBg="bg-blue-100"
 *   iconColor="text-blue-600"
 * >
 *   <span className="text-2xl font-bold">1,234</span>
 * </AdminCard>
 * ```
 *
 * @example Clickable card with actions
 * ```tsx
 * <AdminCard
 *   title="Lead Name"
 *   subtitle="Contact info"
 *   onClick={() => handleClick()}
 *   actions={<Button>Edit</Button>}
 * >
 *   <p>Lead details</p>
 * </AdminCard>
 * ```
 */
export const AdminCard: React.FC<AdminCardProps> = memo(({
  title,
  subtitle,
  icon,
  iconBg = 'bg-gray-100',
  iconColor = 'text-gray-600',
  actions,
  footer,
  variant = 'default',
  onClick,
  className = '',
  children,
  disableHover = false,
  padding = 'md',
  isLoading = false,
}) => {
  const isClickable = !!onClick;
  const baseClasses = `rounded-xl ${variantClasses[variant]} ${paddingClasses[padding]}`;
  const interactiveClasses = isClickable && !disableHover
    ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300'
    : '';

  const cardContent = (
    <>
      {/* Header */}
      {(title || icon || actions) && (
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {icon && variant === 'stat' && (
              <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
                {icon}
              </div>
            )}
            {icon && variant !== 'stat' && (
              <div className={iconColor}>
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className={`font-medium ${
                  variant === 'highlight'
                    ? 'text-white'
                    : variant === 'stat'
                      ? 'text-gray-500 text-sm'
                      : 'text-gray-900'
                }`}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={`text-sm ${
                  variant === 'highlight' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ) : (
        /* Content */
        children && <div>{children}</div>
      )}

      {/* Footer */}
      {footer && !isLoading && (
        <div className={`mt-4 pt-3 border-t ${
          variant === 'highlight' ? 'border-blue-400' : 'border-gray-100'
        }`}>
          {footer}
        </div>
      )}
    </>
  );

  // Use motion.div for animated cards
  if (!disableHover) {
    return (
      <motion.div
        className={`${baseClasses} ${interactiveClasses} ${className}`}
        onClick={onClick}
        whileHover={isClickable ? { scale: 1.01 } : undefined}
        whileTap={isClickable ? { scale: 0.99 } : undefined}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  // Regular div for non-animated cards
  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {cardContent}
    </div>
  );
});

AdminCard.displayName = 'AdminCard';

export default AdminCard;
