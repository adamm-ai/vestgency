/**
 * Admin Portal Constants
 * ======================
 * Shared constants for admin components
 */

// Session configuration
export const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_LOGIN_ATTEMPTS = 5;
export const RATE_LIMIT_COOLDOWN_MS = 30 * 1000; // 30 seconds
export const SESSION_STORAGE_KEY = 'vestate_admin_session';
export const ATTEMPTS_STORAGE_KEY = 'vestate_login_attempts';

// Pagination
export const ITEMS_PER_PAGE = 20;

// Status colors for leads
export const LEAD_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  new: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  contacted: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  qualified: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  negotiation: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  won: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  lost: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

// Urgency colors
export const URGENCY_COLORS: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
};

// Navigation items
export const getNavItems = (user: { role: string } | null) => [
  { id: 'dashboard' as const, icon: 'Home', label: 'Dashboard' },
  { id: 'crm' as const, icon: 'Target', label: 'CRM' },
  { id: 'properties' as const, icon: 'Building2', label: 'Biens' },
  ...(user?.role === 'admin' ? [{ id: 'users' as const, icon: 'Users', label: 'Équipe' }] : []),
  { id: 'analytics' as const, icon: 'BarChart3', label: 'Analytics' },
  { id: 'settings' as const, icon: 'Settings', label: 'Paramètres' },
];
