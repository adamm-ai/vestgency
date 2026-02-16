/**
 * API Service - Connects frontend to Vestate backend
 * =====================================================
 * Handles all HTTP requests to the backend API
 */

// Types
export type UserRole = 'ADMIN' | 'AGENT';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'VISIT_SCHEDULED' | 'VISIT_COMPLETED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadSource = 'CHATBOT' | 'WEBSITE_FORM' | 'PHONE' | 'EMAIL' | 'WALK_IN' | 'REFERRAL' | 'SOCIAL_MEDIA' | 'OTHER';
export type LeadUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PropertyCategory = 'RENT' | 'SALE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  leadsCount?: number;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  status: LeadStatus;
  source: LeadSource;
  urgency: LeadUrgency;
  score: number;
  transactionType?: PropertyCategory;
  budgetMin?: number;
  budgetMax?: number;
  assignedToId?: string;
  assignedTo?: User;
  notes: any[];
  chatMessages: any[];
  activities?: LeadActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: string;
  title: string;
  description?: string;
  createdById?: string;
  createdBy?: { id: string; fullName: string };
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message?: string;
  leadId?: string;
  lead?: { id: string; firstName: string; lastName?: string };
  isRead: boolean;
  createdAt: string;
}

export interface Property {
  id: string;
  name: string;
  type?: string;
  category: PropertyCategory;
  price?: string;
  priceNumeric?: number;
  location?: string;
  city?: string;
  beds?: number;
  areaNumeric?: number;
  image?: string;
  url?: string;
  datePublished?: string;
  isActive: boolean;
}

export interface CRMStats {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsWeek: number;
  newLeadsMonth: number;
  leadsWon: number;
  leadsLost: number;
  conversionRate: number;
  avgScore: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByUrgency: Record<string, number>;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://vestate-api-fisw.onrender.com';

// Token storage
const TOKEN_KEY = 'vestate_token';
const USER_KEY = 'vestate_user';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setAuthData = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// API Helper
class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

const fetchAPI = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getStoredToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle token expiry
    if (response.status === 401) {
      clearAuthData();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new APIError(data.error || 'Une erreur est survenue', response.status);
  }

  return data;
};

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await fetchAPI<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthData(data.token, data.user);
    return data;
  },

  logout: () => {
    clearAuthData();
  },

  getMe: async (): Promise<{ user: User }> => {
    return fetchAPI('/api/auth/me');
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return fetchAPI('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  register: async (email: string, password: string, fullName: string, role?: UserRole): Promise<{ user: User }> => {
    return fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role }),
    });
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const data = await fetchAPI<{ token: string }>('/api/auth/refresh', {
      method: 'POST',
    });
    const user = getStoredUser();
    if (user) {
      setAuthData(data.token, user);
    }
    return data;
  },
};

// ============================================================================
// USERS API
// ============================================================================

export const usersAPI = {
  getAll: async (): Promise<{ users: User[] }> => {
    return fetchAPI('/api/users');
  },

  getAgents: async (): Promise<{ agents: User[] }> => {
    return fetchAPI('/api/users/agents');
  },

  getById: async (id: string): Promise<{ user: User }> => {
    return fetchAPI(`/api/users/${id}`);
  },

  update: async (id: string, data: Partial<User> & { password?: string }): Promise<{ user: User }> => {
    return fetchAPI(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// LEADS API
// ============================================================================

export const leadsAPI = {
  getAll: async (filters?: { status?: string; source?: string; assignedTo?: string }): Promise<{ leads: Lead[] }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);

    const query = params.toString();
    return fetchAPI(`/api/leads${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<{ lead: Lead }> => {
    return fetchAPI(`/api/leads/${id}`);
  },

  create: async (data: Partial<Lead>): Promise<{ lead: Lead }> => {
    return fetchAPI('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Lead>): Promise<{ lead: Lead }> => {
    return fetchAPI(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/api/leads/${id}`, {
      method: 'DELETE',
    });
  },

  addActivity: async (id: string, activity: { type: string; title: string; description?: string }): Promise<{ activity: LeadActivity }> => {
    return fetchAPI(`/api/leads/${id}/activity`, {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  },
};

// ============================================================================
// PROPERTIES API
// ============================================================================

export const propertiesAPI = {
  getAll: async (filters?: { category?: string; city?: string; limit?: number; offset?: number }): Promise<{ properties: Property[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const query = params.toString();
    return fetchAPI(`/api/properties${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<{ property: Property }> => {
    return fetchAPI(`/api/properties/${id}`);
  },

  create: async (data: Partial<Property>): Promise<{ property: Property }> => {
    return fetchAPI('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Property>): Promise<{ property: Property }> => {
    return fetchAPI(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/api/properties/${id}`, {
      method: 'DELETE',
    });
  },

  import: async (properties: Partial<Property>[]): Promise<{ imported: number }> => {
    return fetchAPI('/api/properties/import', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  },
};

// ============================================================================
// STATS API
// ============================================================================

export const statsAPI = {
  getCRM: async (): Promise<CRMStats> => {
    return fetchAPI('/api/stats/crm');
  },

  getDashboard: async (): Promise<{
    totalLeads: number;
    totalProperties: number;
    totalUsers: number | null;
    recentLeads: any[];
    recentActivities: any[];
  }> => {
    return fetchAPI('/api/stats/dashboard');
  },

  getAgents: async (): Promise<{ agents: any[] }> => {
    return fetchAPI('/api/stats/agents');
  },
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export const notificationsAPI = {
  getAll: async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
    return fetchAPI('/api/notifications');
  },

  markRead: async (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllRead: async (): Promise<{ message: string }> => {
    return fetchAPI('/api/notifications/read-all', {
      method: 'PUT',
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchAPI(`/api/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// OFFLINE FALLBACK
// ============================================================================

export const isAPIAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};

// Export everything
export default {
  auth: authAPI,
  users: usersAPI,
  leads: leadsAPI,
  properties: propertiesAPI,
  stats: statsAPI,
  notifications: notificationsAPI,
  isAPIAvailable,
  getStoredToken,
  getStoredUser,
  clearAuthData,
};
