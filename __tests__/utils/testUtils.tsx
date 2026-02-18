/**
 * Test Utilities
 * ===============
 * Custom render functions and test helpers for React Testing Library
 *
 * Usage:
 *   import { render, screen, mockUser, mockLead } from '../utils/testUtils';
 *
 *   test('example', () => {
 *     render(<MyComponent />);
 *     expect(screen.getByText('Hello')).toBeInTheDocument();
 *   });
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent };

// ============================================================================
// PROVIDERS WRAPPER
// ============================================================================

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component that includes all necessary providers for testing
 */
const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// ============================================================================
// CUSTOM RENDER FUNCTION
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

/**
 * Custom render function that wraps components with necessary providers
 *
 * @param ui - React element to render
 * @param options - Render options including optional route
 * @returns Render result with additional utilities
 */
const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const { route = '/', ...renderOptions } = options;

  // Set the route if specified
  window.history.pushState({}, 'Test page', route);

  const user = userEvent.setup();

  const result = render(ui, {
    wrapper: AllProviders,
    ...renderOptions,
  });

  return {
    ...result,
    user,
  };
};

// Override render with custom render
export { customRender as render };

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Generate a mock user
 */
export const mockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  role: 'agent',
  phone: '+212600000000',
  isActive: true,
  maxLeads: 50,
  currentLeads: 10,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'agent';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  maxLeads: number;
  currentLeads: number;
  createdAt: string;
}

/**
 * Generate a mock lead
 */
export const mockLead = (overrides: Partial<MockLead> = {}): MockLead => ({
  id: 'lead-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+212600000001',
  city: 'Marrakech',
  status: 'new',
  urgency: 'medium',
  score: 65,
  source: 'chatbot',
  transactionType: 'SALE',
  budgetMin: 500000,
  budgetMax: 1000000,
  notes: [],
  activities: [],
  chatMessages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export interface MockLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
  status: 'new' | 'contacted' | 'qualified' | 'visit_scheduled' | 'visit_completed' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | 'nurturing';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  source: 'chatbot' | 'website_form' | 'phone' | 'email' | 'walk_in' | 'referral' | 'social_media' | 'other';
  transactionType?: 'RENT' | 'SALE';
  budgetMin?: number;
  budgetMax?: number;
  assignedTo?: string;
  notes: any[];
  activities: any[];
  chatMessages: any[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a mock property
 */
export const mockProperty = (overrides: Partial<MockProperty> = {}): MockProperty => ({
  id: 'prop-123',
  name: 'Villa Luxe Palmeraie',
  type: 'villa',
  category: 'SALE',
  price: '2,500,000 MAD',
  priceNumeric: 2500000,
  location: 'Palmeraie',
  city: 'Marrakech',
  beds: 4,
  areaNumeric: 350,
  image: 'https://example.com/villa.jpg',
  url: 'https://example.com/property/123',
  datePublished: new Date().toISOString(),
  isActive: true,
  ...overrides,
});

export interface MockProperty {
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
  isActive: boolean;
}

/**
 * Generate a mock notification
 */
export const mockNotification = (overrides: Partial<MockNotification> = {}): MockNotification => ({
  id: 'notif-123',
  type: 'new_lead',
  title: 'New Lead',
  message: 'A new lead has been assigned to you',
  leadId: 'lead-123',
  read: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export interface MockNotification {
  id: string;
  type: 'new_lead' | 'lead_assigned' | 'followup_due' | 'task_due' | 'status_changed' | 'chat_message';
  title: string;
  message: string;
  leadId?: string;
  read: boolean;
  createdAt: string;
}

/**
 * Generate mock CRM stats
 */
export const mockCRMStats = (overrides: Partial<MockCRMStats> = {}): MockCRMStats => ({
  totalLeads: 150,
  newLeadsToday: 5,
  newLeadsWeek: 25,
  newLeadsMonth: 80,
  leadsWon: 45,
  leadsLost: 20,
  conversionRate: 30,
  avgScore: 62,
  pipelineValue: 15000000,
  totalRevenue: 8500000,
  leadsByStatus: {
    new: 30,
    contacted: 25,
    qualified: 20,
    visit_scheduled: 15,
    visit_completed: 10,
    proposal_sent: 8,
    negotiation: 5,
    won: 45,
    lost: 20,
    nurturing: 12,
  },
  leadsBySource: {
    chatbot: 50,
    website_form: 35,
    phone: 20,
    email: 15,
    walk_in: 10,
    referral: 12,
    social_media: 8,
    other: 0,
  },
  leadsByUrgency: {
    low: 40,
    medium: 60,
    high: 35,
    critical: 15,
  },
  ...overrides,
});

export interface MockCRMStats {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsWeek: number;
  newLeadsMonth: number;
  leadsWon: number;
  leadsLost: number;
  conversionRate: number;
  avgScore: number;
  pipelineValue: number;
  totalRevenue: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByUrgency: Record<string, number>;
}

// ============================================================================
// FETCH MOCK HELPERS
// ============================================================================

/**
 * Setup fetch mock for successful API response
 */
export const mockFetchSuccess = <T>(data: T, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  });
};

/**
 * Setup fetch mock for API error response
 */
export const mockFetchError = (error: string, status = 400) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
    text: () => Promise.resolve(JSON.stringify({ error })),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  });
};

/**
 * Setup fetch mock for network error
 */
export const mockFetchNetworkError = () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
};

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wait for a specified amount of time
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wait for all pending promises to resolve
 */
export const flushPromises = (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

// ============================================================================
// LOCALSTORAGE MOCK HELPERS
// ============================================================================

/**
 * Setup localStorage with auth data
 */
export const setupAuthStorage = (user: MockUser, token = 'test-token') => {
  localStorage.setItem('vestate_token', token);
  localStorage.setItem('vestate_user', JSON.stringify(user));
};

/**
 * Clear auth data from localStorage
 */
export const clearAuthStorage = () => {
  localStorage.removeItem('vestate_token');
  localStorage.removeItem('vestate_user');
};
