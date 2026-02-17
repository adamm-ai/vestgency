/**
 * Admin Portal Shared Types
 * =========================
 * Common types used across admin components
 */

export interface AdminUser {
  email: string;
  name: string;
  role: 'admin' | 'agent';
  avatar?: string;
  lastLogin?: number;
}

export interface Session {
  user: AdminUser;
  expiresAt: number;
  token: string;
  rememberMe: boolean;
}

export interface LoginAttempts {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

export interface AdminProperty {
  id: string;
  name: string;
  type: string;
  category: 'RENT' | 'SALE';
  price: string;
  priceNumeric: number;
  location: string;
  city: string;
  beds: number | null;
  areaNumeric: number | null;
  image: string;
  url: string;
  datePublished: string;
}

export type AdminView = 'dashboard' | 'crm' | 'demands' | 'matches' | 'properties' | 'users' | 'analytics' | 'settings';

// Settings types
export interface ProfileSettings {
  displayName: string;
  email: string;
  phone: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newLeadAlerts: boolean;
  statusChangeAlerts: boolean;
}

export interface CRMSettings {
  autoAssignLeads: boolean;
  leadScoringEnabled: boolean;
  defaultLeadStatus: string;
}

export interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// New lead form
export interface NewLeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  source: string;
  transactionType: 'SALE' | 'RENT';
  budgetMin: string;
  budgetMax: string;
  urgency: string;
}
