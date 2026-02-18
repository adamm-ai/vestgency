/**
 * CRM API Service - Backend-First Architecture
 * ==============================================
 *
 * This service eliminates dual data persistence by using the backend API
 * as the SINGLE SOURCE OF TRUTH. localStorage is used ONLY as a temporary
 * offline cache with smart synchronization.
 *
 * MIGRATION PATH:
 * ---------------
 * 1. Replace imports from 'crmService' with 'crmApiService' in components
 * 2. The API signatures remain compatible with crmService.ts
 * 3. All existing functionality (scoring, filtering, etc.) is preserved
 * 4. Backend operations take priority; localStorage is cache-only
 *
 * ARCHITECTURE:
 * -------------
 * - Backend API = Source of Truth
 * - localStorage = Offline Cache (read-only fallback)
 * - All writes go to backend first, then update cache
 * - Retry logic with exponential backoff (3 attempts)
 * - Graceful degradation when offline
 *
 * @author Agent 1 - Data Persistence Architect
 */

import {
  Lead as APILead,
  LeadStatus as APILeadStatus,
  LeadSource as APILeadSource,
  LeadUrgency as APILeadUrgency,
  LeadActivity,
  CRMStats as APICRMStats,
  User,
  leadsAPI,
  statsAPI,
  usersAPI,
  notificationsAPI,
  isAPIAvailable,
  getStoredUser,
} from './api';

// Re-export types for compatibility
export type {
  APILead as Lead,
  APILeadStatus as LeadStatus,
  APILeadSource as LeadSource,
  APILeadUrgency as LeadUrgency,
  LeadActivity,
  APICRMStats as CRMStats,
  User,
};

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 1000, // 1s, 2s, 4s exponential backoff
  CACHE_PREFIX: 'crmapi_cache_',
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes cache validity
  SYNC_QUEUE_KEY: 'crmapi_sync_queue',
  LAST_SYNC_KEY: 'crmapi_last_sync',
  DEBUG: import.meta.env.DEV || false,
};

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, data?: any): void {
  if (!CONFIG.DEBUG && level === 'debug') return;

  const timestamp = new Date().toISOString();
  const prefix = `[CRM-API ${timestamp}]`;

  switch (level) {
    case 'info':
      console.log(`${prefix} INFO:`, message, data ?? '');
      break;
    case 'warn':
      console.warn(`${prefix} WARN:`, message, data ?? '');
      break;
    case 'error':
      console.error(`${prefix} ERROR:`, message, data ?? '');
      break;
    case 'debug':
      console.debug(`${prefix} DEBUG:`, message, data ?? '');
      break;
  }
}

// ============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================================================

interface RetryOptions {
  attempts?: number;
  baseDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts = CONFIG.RETRY_ATTEMPTS,
    baseDelay = CONFIG.RETRY_BASE_DELAY_MS,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < attempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        log('warn', `Attempt ${attempt}/${attempts} failed, retrying in ${delay}ms`, {
          error: lastError.message,
        });

        onRetry?.(attempt, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  log('error', `All ${attempts} attempts failed`, { error: lastError?.message });
  throw lastError;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

function getCacheKey(key: string): string {
  return `${CONFIG.CACHE_PREFIX}${key}`;
}

function setCache<T>(key: string, data: T, ttl: number = CONFIG.CACHE_TTL_MS): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
    log('debug', `Cache set: ${key}`);
  } catch (error) {
    log('warn', `Failed to set cache: ${key}`, error);
  }
}

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(getCacheKey(key));
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(getCacheKey(key));
      log('debug', `Cache expired: ${key}`);
      return null;
    }

    log('debug', `Cache hit: ${key}`);
    return entry.data;
  } catch (error) {
    log('warn', `Failed to read cache: ${key}`, error);
    return null;
  }
}

function invalidateCache(pattern?: string): void {
  const keys = Object.keys(localStorage).filter(k =>
    k.startsWith(CONFIG.CACHE_PREFIX) &&
    (!pattern || k.includes(pattern))
  );

  keys.forEach(k => localStorage.removeItem(k));
  log('debug', `Cache invalidated: ${keys.length} entries`);
}

// ============================================================================
// SYNC QUEUE (FOR OFFLINE OPERATIONS)
// ============================================================================

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'lead' | 'activity';
  payload: any;
  timestamp: number;
  retries: number;
}

function getSyncQueue(): SyncOperation[] {
  try {
    const raw = localStorage.getItem(CONFIG.SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getSyncQueue();
  queue.push({
    ...operation,
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retries: 0,
  });
  localStorage.setItem(CONFIG.SYNC_QUEUE_KEY, JSON.stringify(queue));
  log('info', 'Operation queued for sync', { type: operation.type, entity: operation.entity });
}

function removeFromSyncQueue(id: string): void {
  const queue = getSyncQueue().filter(op => op.id !== id);
  localStorage.setItem(CONFIG.SYNC_QUEUE_KEY, JSON.stringify(queue));
}

function clearSyncQueue(): void {
  localStorage.removeItem(CONFIG.SYNC_QUEUE_KEY);
}

// ============================================================================
// NETWORK STATUS
// ============================================================================

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let apiAvailable = true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    log('info', 'Network: Online');
    processSyncQueue();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    log('info', 'Network: Offline');
  });
}

async function checkAPIHealth(): Promise<boolean> {
  try {
    apiAvailable = await isAPIAvailable();
    return apiAvailable;
  } catch {
    apiAvailable = false;
    return false;
  }
}

// ============================================================================
// SYNC QUEUE PROCESSOR
// ============================================================================

async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  if (!isOnline) {
    log('debug', 'Skipping sync: offline');
    return { processed: 0, failed: 0 };
  }

  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  log('info', `Processing sync queue: ${queue.length} operations`);

  let processed = 0;
  let failed = 0;

  for (const operation of queue) {
    try {
      switch (operation.entity) {
        case 'lead':
          if (operation.type === 'create') {
            await leadsAPI.create(operation.payload);
          } else if (operation.type === 'update') {
            await leadsAPI.update(operation.payload.id, operation.payload.data);
          } else if (operation.type === 'delete') {
            await leadsAPI.delete(operation.payload.id);
          }
          break;
        case 'activity':
          if (operation.type === 'create') {
            await leadsAPI.addActivity(operation.payload.leadId, operation.payload.activity);
          }
          break;
      }

      removeFromSyncQueue(operation.id);
      processed++;
      log('debug', `Synced operation: ${operation.id}`);
    } catch (error) {
      failed++;
      log('error', `Failed to sync operation: ${operation.id}`, error);

      // Update retry count
      const queue = getSyncQueue();
      const idx = queue.findIndex(op => op.id === operation.id);
      if (idx !== -1) {
        queue[idx].retries++;
        if (queue[idx].retries >= CONFIG.RETRY_ATTEMPTS) {
          queue.splice(idx, 1); // Remove after max retries
          log('warn', `Removed operation after max retries: ${operation.id}`);
        }
        localStorage.setItem(CONFIG.SYNC_QUEUE_KEY, JSON.stringify(queue));
      }
    }
  }

  // Refresh cache after sync
  if (processed > 0) {
    invalidateCache('leads');
  }

  log('info', `Sync complete: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}

// ============================================================================
// TYPE CONVERTERS (API <-> Local format)
// ============================================================================

// Convert API Lead format to local format used by crmService
function normalizeLeadFromAPI(apiLead: APILead): any {
  return {
    id: apiLead.id,
    firstName: apiLead.firstName,
    lastName: apiLead.lastName || '',
    email: apiLead.email || '',
    phone: apiLead.phone || '',
    city: apiLead.city,
    status: apiLead.status.toLowerCase() as any,
    urgency: apiLead.urgency.toLowerCase() as any,
    score: apiLead.score,
    source: apiLead.source.toLowerCase() as any,
    transactionType: apiLead.transactionType,
    budgetMin: apiLead.budgetMin,
    budgetMax: apiLead.budgetMax,
    assignedTo: apiLead.assignedToId,
    notes: apiLead.notes || [],
    activities: (apiLead.activities || []).map(a => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      createdBy: a.createdBy?.fullName,
      createdAt: a.createdAt,
    })),
    chatMessages: apiLead.chatMessages || [],
    createdAt: apiLead.createdAt,
    updatedAt: apiLead.updatedAt,
  };
}

// Convert local Lead format to API format
function normalizeLeadToAPI(localLead: any): Partial<APILead> {
  return {
    firstName: localLead.firstName,
    lastName: localLead.lastName,
    email: localLead.email,
    phone: localLead.phone,
    city: localLead.city,
    status: localLead.status?.toUpperCase() as APILeadStatus,
    urgency: localLead.urgency?.toUpperCase() as APILeadUrgency,
    score: localLead.score,
    source: localLead.source?.toUpperCase() as APILeadSource,
    transactionType: localLead.transactionType,
    budgetMin: localLead.budgetMin,
    budgetMax: localLead.budgetMax,
    assignedToId: localLead.assignedTo,
  };
}

// ============================================================================
// LEAD SCORING (Preserved from crmService.ts)
// ============================================================================

interface ScoreBreakdown {
  total: number;
  sourceScore: number;
  urgencyScore: number;
  engagementScore: number;
  qualificationScore: number;
  contactScore: number;
}

const SOURCE_SCORES: Record<string, number> = {
  referral: 25,
  walk_in: 25,
  chatbot: 20,
  phone: 20,
  website_form: 15,
  email: 15,
  social_media: 10,
  other: 5,
};

const URGENCY_SCORES: Record<string, number> = {
  critical: 30,
  high: 25,
  medium: 15,
  low: 5,
};

export function calculateLeadScore(lead: Partial<any>): ScoreBreakdown {
  const sourceKey = (lead.source || 'other').toLowerCase();
  const urgencyKey = (lead.urgency || 'low').toLowerCase();

  let sourceScore = SOURCE_SCORES[sourceKey] || 5;
  let urgencyScore = URGENCY_SCORES[urgencyKey] || 5;

  // Engagement score (based on chat messages)
  let engagementScore = 5;
  const messageCount = lead.chatMessages?.length || 0;
  if (messageCount >= 10) engagementScore = 20;
  else if (messageCount >= 5) engagementScore = 15;
  else if (messageCount >= 3) engagementScore = 10;

  // Qualification score
  let qualificationScore = 0;
  if (lead.propertyInterest?.length) qualificationScore += 5;
  if (lead.budgetMax || lead.budgetMin) qualificationScore += 5;
  if (lead.transactionType) qualificationScore += 3;
  if (lead.preferredLocations?.length) qualificationScore += 2;

  // Contact score
  let contactScore = 0;
  if (lead.email) contactScore += 5;
  if (lead.phone) contactScore += 5;

  const total = Math.min(100, sourceScore + urgencyScore + engagementScore + qualificationScore + contactScore);

  return {
    total,
    sourceScore,
    urgencyScore,
    engagementScore,
    qualificationScore,
    contactScore,
  };
}

export function getUrgencyFromScore(score: number): string {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ============================================================================
// LEAD MANAGEMENT - BACKEND FIRST
// ============================================================================

export interface LeadFilters {
  status?: string[];
  urgency?: string[];
  source?: string[];
  assignedTo?: string;
  transactionType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Get all leads from backend API.
 * Falls back to cache if offline.
 */
export async function getLeads(filters?: LeadFilters): Promise<any[]> {
  const cacheKey = `leads_${JSON.stringify(filters || {})}`;

  try {
    // Try backend first
    const apiFilters: any = {};
    if (filters?.status?.length === 1) apiFilters.status = filters.status[0].toUpperCase();
    if (filters?.source?.length === 1) apiFilters.source = filters.source[0].toUpperCase();
    if (filters?.assignedTo) apiFilters.assignedTo = filters.assignedTo;

    const response = await withRetry(() => leadsAPI.getAll(apiFilters));
    let leads = response.leads.map(normalizeLeadFromAPI);

    // Apply client-side filters not supported by API
    if (filters) {
      if (filters.status?.length && filters.status.length > 1) {
        leads = leads.filter(l => filters.status!.includes(l.status));
      }
      if (filters.urgency?.length) {
        leads = leads.filter(l => filters.urgency!.includes(l.urgency));
      }
      if (filters.source?.length && filters.source.length > 1) {
        leads = leads.filter(l => filters.source!.includes(l.source));
      }
      if (filters.transactionType) {
        leads = leads.filter(l => l.transactionType === filters.transactionType);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        leads = leads.filter(l =>
          l.firstName.toLowerCase().includes(searchLower) ||
          l.lastName.toLowerCase().includes(searchLower) ||
          l.email?.toLowerCase().includes(searchLower) ||
          l.phone?.includes(searchLower) ||
          l.city?.toLowerCase().includes(searchLower)
        );
      }
      if (filters.dateFrom) {
        leads = leads.filter(l => new Date(l.createdAt) >= new Date(filters.dateFrom!));
      }
      if (filters.dateTo) {
        leads = leads.filter(l => new Date(l.createdAt) <= new Date(filters.dateTo!));
      }
    }

    // Update cache
    setCache(cacheKey, leads);
    log('info', `Fetched ${leads.length} leads from API`);

    return leads;
  } catch (error) {
    log('warn', 'Failed to fetch leads from API, using cache', error);

    // Fallback to cache
    const cached = getCache<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Try broader cache
    const allLeadsCache = getCache<any[]>('leads_{}');
    if (allLeadsCache) {
      log('info', 'Using all-leads cache as fallback');
      return allLeadsCache;
    }

    throw error;
  }
}

/**
 * Get a single lead by ID.
 */
export async function getLeadById(id: string): Promise<any | null> {
  const cacheKey = `lead_${id}`;

  try {
    const response = await withRetry(() => leadsAPI.getById(id));
    const lead = normalizeLeadFromAPI(response.lead);
    setCache(cacheKey, lead);
    return lead;
  } catch (error) {
    log('warn', `Failed to fetch lead ${id} from API`, error);

    const cached = getCache<any>(cacheKey);
    if (cached) return cached;

    return null;
  }
}

/**
 * Create a new lead. Backend-first with offline queue fallback.
 */
export async function createLead(data: Partial<any>): Promise<any> {
  // Calculate score before sending
  const scoreBreakdown = calculateLeadScore(data);
  const enrichedData = {
    ...data,
    score: scoreBreakdown.total,
    urgency: data.urgency || getUrgencyFromScore(scoreBreakdown.total),
  };

  const apiData = normalizeLeadToAPI(enrichedData);

  try {
    const response = await withRetry(() => leadsAPI.create(apiData));
    const lead = normalizeLeadFromAPI(response.lead);

    // Invalidate leads cache
    invalidateCache('leads');

    log('info', `Created lead: ${lead.id}`);
    return lead;
  } catch (error) {
    log('error', 'Failed to create lead via API', error);

    if (!isOnline) {
      // Queue for later sync
      addToSyncQueue({
        type: 'create',
        entity: 'lead',
        payload: apiData,
      });

      // Return optimistic response
      const tempId = `temp_${Date.now()}`;
      return {
        ...enrichedData,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pendingSync: true,
      };
    }

    throw error;
  }
}

/**
 * Update an existing lead.
 */
export async function updateLead(id: string, updates: Partial<any>): Promise<any | null> {
  // Recalculate score if relevant fields changed
  if (updates.source || updates.urgency || updates.chatMessages || updates.propertyInterest || updates.budgetMax) {
    const currentLead = await getLeadById(id);
    if (currentLead) {
      const scoreBreakdown = calculateLeadScore({ ...currentLead, ...updates });
      updates.score = scoreBreakdown.total;
    }
  }

  const apiData = normalizeLeadToAPI(updates);

  try {
    const response = await withRetry(() => leadsAPI.update(id, apiData));
    const lead = normalizeLeadFromAPI(response.lead);

    // Invalidate caches
    invalidateCache('leads');
    invalidateCache(`lead_${id}`);

    log('info', `Updated lead: ${id}`);
    return lead;
  } catch (error) {
    log('error', `Failed to update lead ${id}`, error);

    if (!isOnline) {
      addToSyncQueue({
        type: 'update',
        entity: 'lead',
        payload: { id, data: apiData },
      });

      // Return optimistic update
      const cached = getCache<any>(`lead_${id}`);
      if (cached) {
        return { ...cached, ...updates, _pendingSync: true };
      }
    }

    throw error;
  }
}

/**
 * Delete a lead.
 */
export async function deleteLead(id: string): Promise<boolean> {
  try {
    await withRetry(() => leadsAPI.delete(id));

    // Invalidate caches
    invalidateCache('leads');
    invalidateCache(`lead_${id}`);

    log('info', `Deleted lead: ${id}`);
    return true;
  } catch (error) {
    log('error', `Failed to delete lead ${id}`, error);

    if (!isOnline) {
      addToSyncQueue({
        type: 'delete',
        entity: 'lead',
        payload: { id },
      });
      return true; // Optimistic
    }

    return false;
  }
}

/**
 * Add activity to a lead.
 */
export async function addActivityToLead(
  leadId: string,
  activity: { type: string; title: string; description?: string }
): Promise<any | null> {
  try {
    const response = await withRetry(() => leadsAPI.addActivity(leadId, activity));

    // Invalidate lead cache
    invalidateCache(`lead_${leadId}`);

    log('info', `Added activity to lead: ${leadId}`);
    return response.activity;
  } catch (error) {
    log('error', `Failed to add activity to lead ${leadId}`, error);

    if (!isOnline) {
      addToSyncQueue({
        type: 'create',
        entity: 'activity',
        payload: { leadId, activity },
      });
    }

    return null;
  }
}

/**
 * Add note to a lead (creates a note_added activity).
 */
export async function addNoteToLead(leadId: string, content: string, createdBy = 'Admin'): Promise<any | null> {
  return addActivityToLead(leadId, {
    type: 'note_added',
    title: 'Note ajoutee',
    description: content,
  });
}

/**
 * Get leads filtered by status.
 */
export async function getLeadsByStatus(status: string): Promise<any[]> {
  return getLeads({ status: [status] });
}

// ============================================================================
// STATISTICS - BACKEND FIRST
// ============================================================================

export async function getCRMStats(): Promise<any> {
  const cacheKey = 'crm_stats';

  try {
    const stats = await withRetry(() => statsAPI.getCRM());

    // Normalize to local format
    const normalizedStats = {
      totalLeads: stats.totalLeads,
      newLeadsToday: stats.newLeadsToday,
      newLeadsWeek: stats.newLeadsWeek,
      newLeadsMonth: stats.newLeadsMonth,
      leadsWon: stats.leadsWon,
      leadsLost: stats.leadsLost,
      conversionRate: stats.conversionRate,
      avgScore: stats.avgScore,
      pipelineValue: 0, // Not in API
      totalRevenue: 0, // Not in API
      leadsByStatus: normalizeRecordKeys(stats.leadsByStatus),
      leadsBySource: normalizeRecordKeys(stats.leadsBySource),
      leadsByUrgency: normalizeRecordKeys(stats.leadsByUrgency),
    };

    setCache(cacheKey, normalizedStats);
    log('info', 'Fetched CRM stats from API');

    return normalizedStats;
  } catch (error) {
    log('warn', 'Failed to fetch CRM stats from API', error);

    const cached = getCache<any>(cacheKey);
    if (cached) return cached;

    // Return empty stats
    return {
      totalLeads: 0,
      newLeadsToday: 0,
      newLeadsWeek: 0,
      newLeadsMonth: 0,
      leadsWon: 0,
      leadsLost: 0,
      conversionRate: 0,
      avgScore: 0,
      pipelineValue: 0,
      totalRevenue: 0,
      leadsByStatus: {},
      leadsBySource: {},
      leadsByUrgency: {},
    };
  }
}

function normalizeRecordKeys(record: Record<string, number>): Record<string, number> {
  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

// ============================================================================
// AGENTS / USERS - BACKEND FIRST
// ============================================================================

export async function getAgents(): Promise<any[]> {
  const cacheKey = 'agents';

  try {
    const response = await withRetry(() => usersAPI.getAgents());
    const agents = response.agents.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.fullName.split(' ')[0] || user.fullName,
      lastName: user.fullName.split(' ').slice(1).join(' ') || '',
      phone: user.phone,
      role: user.role.toLowerCase(),
      avatar: user.avatarUrl,
      isActive: user.isActive,
      maxLeads: 100,
      currentLeads: user.leadsCount || 0,
      createdAt: user.createdAt,
    }));

    setCache(cacheKey, agents);
    log('info', `Fetched ${agents.length} agents from API`);

    return agents;
  } catch (error) {
    log('warn', 'Failed to fetch agents from API', error);

    const cached = getCache<any[]>(cacheKey);
    if (cached) return cached;

    return [];
  }
}

export async function getAgentById(id: string): Promise<any | null> {
  const agents = await getAgents();
  return agents.find(a => a.id === id) || null;
}

// ============================================================================
// NOTIFICATIONS - BACKEND FIRST
// ============================================================================

export async function getNotifications(): Promise<any[]> {
  const cacheKey = 'notifications';

  try {
    const response = await withRetry(() => notificationsAPI.getAll());
    const notifications = response.notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message || '',
      leadId: n.leadId,
      read: n.isRead,
      createdAt: n.createdAt,
    }));

    setCache(cacheKey, notifications);
    return notifications;
  } catch (error) {
    log('warn', 'Failed to fetch notifications from API', error);

    const cached = getCache<any[]>(cacheKey);
    return cached || [];
  }
}

export async function getUnreadNotifications(): Promise<any[]> {
  const notifications = await getNotifications();
  return notifications.filter(n => !n.read);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await withRetry(() => notificationsAPI.markRead(id));
    invalidateCache('notifications');
  } catch (error) {
    log('error', `Failed to mark notification ${id} as read`, error);
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    await withRetry(() => notificationsAPI.markAllRead());
    invalidateCache('notifications');
  } catch (error) {
    log('error', 'Failed to mark all notifications as read', error);
  }
}

// ============================================================================
// SYNC STATUS & HEALTH
// ============================================================================

export interface SyncStatus {
  isOnline: boolean;
  apiAvailable: boolean;
  pendingOperations: number;
  lastSync: string | null;
}

export function getSyncStatus(): SyncStatus {
  const queue = getSyncQueue();
  return {
    isOnline,
    apiAvailable,
    pendingOperations: queue.length,
    lastSync: localStorage.getItem(CONFIG.LAST_SYNC_KEY),
  };
}

export async function forceSync(): Promise<{ processed: number; failed: number }> {
  // Check API health first
  await checkAPIHealth();

  if (!apiAvailable) {
    log('warn', 'API not available, cannot sync');
    return { processed: 0, failed: 0 };
  }

  const result = await processSyncQueue();

  // Update last sync time
  localStorage.setItem(CONFIG.LAST_SYNC_KEY, new Date().toISOString());

  // Refresh all caches
  invalidateCache();

  return result;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeCRMApiService(): Promise<void> {
  log('info', 'Initializing CRM API Service...');

  // Check API health
  const healthy = await checkAPIHealth();
  log('info', `API health: ${healthy ? 'OK' : 'UNAVAILABLE'}`);

  // Process any pending sync operations
  if (healthy) {
    await processSyncQueue();
  }

  // Pre-fetch commonly used data
  try {
    await Promise.all([
      getLeads(),
      getCRMStats(),
      getAgents(),
    ]);
    log('info', 'CRM API Service initialized successfully');
  } catch (error) {
    log('warn', 'Partial initialization failure', error);
  }
}

// ============================================================================
// COMPATIBILITY LAYER - For seamless migration from crmService.ts
// ============================================================================

// These functions provide backward compatibility with crmService.ts
// They wrap the async API calls and handle caching appropriately

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

// Synchronous getters that use cached data (for immediate UI needs)
export function getLeadsSync(): any[] {
  const cached = getCache<any[]>('leads_{}');
  return cached || [];
}

export function getAgentsSync(): any[] {
  const cached = getCache<any[]>('agents');
  return cached || [];
}

export function getCRMStatsSync(): any {
  const cached = getCache<any>('crm_stats');
  return cached || {
    totalLeads: 0,
    newLeadsToday: 0,
    newLeadsWeek: 0,
    newLeadsMonth: 0,
    leadsWon: 0,
    leadsLost: 0,
    conversionRate: 0,
    avgScore: 0,
    pipelineValue: 0,
    totalRevenue: 0,
    leadsByStatus: {},
    leadsBySource: {},
    leadsByUrgency: {},
  };
}

// ============================================================================
// EXPORT DEFAULT SERVICE OBJECT
// ============================================================================

export default {
  // Core Lead Operations
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  addActivityToLead,
  addNoteToLead,
  getLeadsByStatus,

  // Stats
  getCRMStats,

  // Agents
  getAgents,
  getAgentById,

  // Notifications
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,

  // Scoring
  calculateLeadScore,
  getUrgencyFromScore,

  // Sync
  getSyncStatus,
  forceSync,
  processSyncQueue,

  // Utils
  generateId,
  formatDate,

  // Sync getters
  getLeadsSync,
  getAgentsSync,
  getCRMStatsSync,

  // Init
  initialize: initializeCRMApiService,
};
