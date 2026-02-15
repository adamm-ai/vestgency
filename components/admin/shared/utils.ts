/**
 * Admin Portal Utilities
 * ======================
 * Shared utility functions for admin components
 */

import { LoginAttempts } from './types';
import { ATTEMPTS_STORAGE_KEY } from './constants';

/**
 * Simple hash function for password comparison
 */
export const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

/**
 * Generate a simple session token
 */
export const generateToken = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Get login attempts from localStorage
 */
export const getLoginAttempts = (): LoginAttempts => {
  try {
    const stored = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { count: 0, lastAttempt: 0, lockedUntil: null };
};

/**
 * Save login attempts to localStorage
 */
export const saveLoginAttempts = (attempts: LoginAttempts): void => {
  localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
};

/**
 * Clear login attempts
 */
export const clearLoginAttempts = (): void => {
  localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
};

/**
 * Export data to CSV file
 */
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) {
    console.warn('[Export] No data to export');
    return;
  }
  const headers = Object.keys(data[0] || {}).join(',');
  const rows = data.map(item => Object.values(item).map(v => `"${v}"`).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M DH`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K DH`;
  }
  return `${price} DH`;
};

/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Get initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Calculate time ago
 */
export const timeAgo = (date: string | Date | number): string => {
  const now = Date.now();
  const then = typeof date === 'number' ? date : new Date(date).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;

  return formatDate(new Date(then));
};
