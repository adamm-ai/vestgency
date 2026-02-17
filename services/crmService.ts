/**
 * Nourreska CRM Service
 * =====================
 * Complete CRM functionality for real estate agency
 * Adapted from Ourika Valley CRM architecture
 */

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'visit_scheduled'
  | 'visit_completed'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'nurturing';

export type LeadUrgency = 'low' | 'medium' | 'high' | 'critical';

export type LeadSource =
  | 'chatbot'
  | 'website_form'
  | 'phone'
  | 'email'
  | 'walk_in'
  | 'referral'
  | 'social_media'
  | 'other';

export type PropertyCategory = 'RENT' | 'SALE';

export type ActivityType =
  | 'lead_created'
  | 'status_changed'
  | 'note_added'
  | 'call_made'
  | 'email_sent'
  | 'visit_scheduled'
  | 'visit_completed'
  | 'property_viewed'
  | 'chat_message';

export type NotificationType =
  | 'new_lead'
  | 'lead_assigned'
  | 'followup_due'
  | 'task_due'
  | 'status_changed'
  | 'chat_message';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  city?: string;

  // Lead qualification
  status: LeadStatus;
  urgency: LeadUrgency;
  score: number; // 0-100
  source: LeadSource;

  // Interest
  propertyInterest?: string[]; // Property IDs
  transactionType?: PropertyCategory;
  budgetMin?: number;
  budgetMax?: number;
  preferredLocations?: string[];
  bedroomsMin?: number;
  surfaceMin?: number;

  // Assignment
  assignedTo?: string;
  assignedAt?: string;

  // Chat data
  chatSessionId?: string;
  chatMessages?: ChatMessage[];
  totalTimeOnChat?: number;

  // UTM tracking
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landingPage?: string;
  referrer?: string;

  // Notes & activities
  notes?: Note[];
  activities?: Activity[];
  tasks?: Task[];

  // Deal tracking
  estimatedValue?: number;
  actualValue?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  lostAt?: string;
  lostReason?: string;

  // Soft delete
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  createdBy?: string;
}

export interface Agent {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'agent';
  avatar?: string;
  isActive: boolean;
  maxLeads: number;
  currentLeads: number;
  specializations?: LeadSource[];
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  leadId?: string;
  read: boolean;
  createdAt: string;
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
  pipelineValue: number;
  totalRevenue: number;
  leadsByStatus: Record<LeadStatus, number>;
  leadsBySource: Record<LeadSource, number>;
  leadsByUrgency: Record<LeadUrgency, number>;
}

export interface LeadFilters {
  status?: LeadStatus[];
  urgency?: LeadUrgency[];
  source?: LeadSource[];
  assignedTo?: string;
  transactionType?: PropertyCategory;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================================
// DEMANDS SYSTEM - Property Requests & Seller Submissions
// ============================================================================

export type DemandType = 'property_search' | 'property_sale' | 'property_rental_management';
export type DemandStatus = 'new' | 'processing' | 'matched' | 'contacted' | 'completed' | 'cancelled';
export type DemandUrgency = 'low' | 'medium' | 'high' | 'urgent';
export type DemandSource = 'chatbot' | 'website_form' | 'phone' | 'email' | 'walk_in' | 'referral' | 'manual';
export type PropertyType = 'villa' | 'apartment' | 'riad' | 'land' | 'commercial' | 'penthouse' | 'duplex' | 'studio' | 'other';

export interface Demand {
  id: string;
  type: DemandType;
  status: DemandStatus;
  urgency: DemandUrgency;

  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  preferredContact?: 'phone' | 'email' | 'whatsapp';

  // For Property Seekers (property_search)
  searchCriteria?: {
    propertyType?: PropertyType[];
    transactionType: 'RENT' | 'SALE';
    budgetMin?: number;
    budgetMax?: number;
    cities?: string[];
    neighborhoods?: string[];
    bedroomsMin?: number;
    bedroomsMax?: number;
    bathroomsMin?: number;
    surfaceMin?: number;
    surfaceMax?: number;
    amenities?: string[];
    additionalNotes?: string;
  };

  // For Property Sellers/Owners (property_sale, property_rental_management)
  propertyDetails?: {
    propertyType: PropertyType;
    transactionType: 'RENT' | 'SALE' | 'MANAGEMENT';
    title?: string;
    description?: string;
    address?: string;
    city: string;
    neighborhood?: string;
    price?: number;
    surface?: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    amenities?: string[];
    images?: string[];
    documents?: string[];
  };

  // Matching & Tracking
  matchedPropertyIds?: string[];
  matchedDemandIds?: string[];
  matchScore?: number;
  lastMatchCheck?: string;

  // Source & Attribution
  source: DemandSource;
  chatSessionId?: string;
  leadId?: string; // Link to existing lead if any
  assignedTo?: string;

  // Notes & History
  notes?: Note[];
  activities?: Activity[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface DemandMatch {
  id: string;
  demandId: string;
  matchedEntityId: string; // Property ID or another Demand ID
  matchType: 'demand_to_property' | 'demand_to_demand' | 'property_to_demand';
  matchScore: number; // 0-100
  matchReasons: string[];
  matchDetails: Record<string, any>;
  status: 'pending' | 'notified' | 'contacted' | 'successful' | 'rejected';
  createdAt: string;
  notifiedAt?: string;
  respondedAt?: string;
}

export interface DemandStats {
  totalDemands: number;
  newDemandsToday: number;
  newDemandsWeek: number;
  demandsByType: Record<DemandType, number>;
  demandsByStatus: Record<DemandStatus, number>;
  totalMatches: number;
  successfulMatches: number;
  avgMatchScore: number;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  LEADS: 'nourreska_crm_leads',
  AGENTS: 'nourreska_crm_agents',
  NOTIFICATIONS: 'nourreska_crm_notifications',
  SETTINGS: 'nourreska_crm_settings',
  CHAT_SESSIONS: 'nourreska_crm_chat_sessions',
  DEMANDS: 'nourreska_crm_demands',
  DEMAND_MATCHES: 'nourreska_crm_demand_matches',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return date >= weekAgo && date <= now;
}

export function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

// ============================================================================
// LEAD SCORING
// ============================================================================

interface ScoreBreakdown {
  total: number;
  sourceScore: number;
  urgencyScore: number;
  engagementScore: number;
  qualificationScore: number;
  contactScore: number;
}

const SOURCE_SCORES: Record<LeadSource, number> = {
  referral: 25,
  walk_in: 25,
  chatbot: 20,
  phone: 20,
  website_form: 15,
  email: 15,
  social_media: 10,
  other: 5,
};

const URGENCY_SCORES: Record<LeadUrgency, number> = {
  critical: 30,
  high: 25,
  medium: 15,
  low: 5,
};

export function calculateLeadScore(lead: Partial<Lead>): ScoreBreakdown {
  let sourceScore = SOURCE_SCORES[lead.source || 'other'] || 5;
  let urgencyScore = URGENCY_SCORES[lead.urgency || 'low'] || 5;

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

export function getUrgencyFromScore(score: number): LeadUrgency {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function generateAutoTags(lead: Partial<Lead>): string[] {
  const tags: string[] = [];

  if (lead.source === 'chatbot') tags.push('via-chatbot');
  if (lead.source === 'website_form') tags.push('formulaire');
  if (lead.source === 'referral') tags.push('parrainage');

  if (lead.urgency === 'critical' || lead.urgency === 'high') {
    tags.push('prioritaire');
  }

  if (lead.transactionType === 'RENT') tags.push('location');
  if (lead.transactionType === 'SALE') tags.push('achat');

  if ((lead.budgetMax || 0) > 5000000) tags.push('high-budget');

  return tags;
}

// ============================================================================
// LEAD MANAGEMENT
// ============================================================================

function getLeadsFromStorage(): Lead[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LEADS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLeadsToStorage(leads: Lead[]): void {
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
}

export function createLead(data: Partial<Lead>): Lead {
  const now = formatDate(new Date());
  const scoreBreakdown = calculateLeadScore(data);
  const urgency = data.urgency || getUrgencyFromScore(scoreBreakdown.total);

  const lead: Lead = {
    id: generateId(),
    firstName: data.firstName || 'Visiteur',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    whatsapp: data.whatsapp,
    city: data.city,

    status: data.status || 'new',
    urgency,
    score: scoreBreakdown.total,
    source: data.source || 'website_form',

    propertyInterest: data.propertyInterest,
    transactionType: data.transactionType,
    budgetMin: data.budgetMin,
    budgetMax: data.budgetMax,
    preferredLocations: data.preferredLocations,
    bedroomsMin: data.bedroomsMin,
    surfaceMin: data.surfaceMin,

    assignedTo: data.assignedTo,
    assignedAt: data.assignedTo ? now : undefined,

    chatSessionId: data.chatSessionId,
    chatMessages: data.chatMessages || [],
    totalTimeOnChat: data.totalTimeOnChat,

    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    landingPage: data.landingPage,
    referrer: data.referrer,

    notes: data.notes || [],
    activities: [{
      id: generateId(),
      type: 'lead_created',
      title: 'Lead créé',
      description: `Lead créé depuis ${data.source || 'website_form'}`,
      createdAt: now,
    }],
    tasks: data.tasks || [],

    estimatedValue: data.estimatedValue,

    createdAt: now,
    updatedAt: now,
  };

  const leads = getLeadsFromStorage();
  leads.unshift(lead);
  saveLeadsToStorage(leads);

  // Create notification
  createNotification({
    type: 'new_lead',
    title: 'Nouveau lead',
    message: `${lead.firstName} ${lead.lastName} - ${lead.source}`,
    leadId: lead.id,
  });

  // Auto-assign if no agent specified
  if (!lead.assignedTo) {
    autoAssignLead(lead);
  }

  return lead;
}

export function updateLead(id: string, updates: Partial<Lead>): Lead | null {
  const leads = getLeadsFromStorage();
  const index = leads.findIndex(l => l.id === id);

  if (index === -1) return null;

  const oldLead = leads[index];
  const now = formatDate(new Date());

  // Track status change
  if (updates.status && updates.status !== oldLead.status) {
    const activity: Activity = {
      id: generateId(),
      type: 'status_changed',
      title: 'Statut modifié',
      description: `${oldLead.status} → ${updates.status}`,
      metadata: { oldStatus: oldLead.status, newStatus: updates.status },
      createdAt: now,
    };
    updates.activities = [...(oldLead.activities || []), activity];

    // Track conversion
    if (updates.status === 'won') {
      updates.convertedAt = now;
    } else if (updates.status === 'lost') {
      updates.lostAt = now;
    }
  }

  // Recalculate score if relevant fields changed
  if (updates.source || updates.urgency || updates.chatMessages || updates.propertyInterest || updates.budgetMax) {
    const scoreBreakdown = calculateLeadScore({ ...oldLead, ...updates });
    updates.score = scoreBreakdown.total;
  }

  const updatedLead: Lead = {
    ...oldLead,
    ...updates,
    updatedAt: now,
  };

  leads[index] = updatedLead;
  saveLeadsToStorage(leads);

  return updatedLead;
}

export function deleteLead(id: string, permanent = false): boolean {
  const leads = getLeadsFromStorage();

  if (permanent) {
    const filtered = leads.filter(l => l.id !== id);
    saveLeadsToStorage(filtered);
    return filtered.length !== leads.length;
  }

  // Soft delete
  const index = leads.findIndex(l => l.id === id);
  if (index === -1) return false;

  leads[index] = {
    ...leads[index],
    isDeleted: true,
    deletedAt: formatDate(new Date()),
  };
  saveLeadsToStorage(leads);
  return true;
}

export function restoreLead(id: string): Lead | null {
  const leads = getLeadsFromStorage();
  const index = leads.findIndex(l => l.id === id);

  if (index === -1) return null;

  leads[index] = {
    ...leads[index],
    isDeleted: false,
    deletedAt: undefined,
  };
  saveLeadsToStorage(leads);
  return leads[index];
}

export function getLeadById(id: string): Lead | null {
  const leads = getLeadsFromStorage();
  return leads.find(l => l.id === id && !l.isDeleted) || null;
}

export function getLeads(filters?: LeadFilters): Lead[] {
  let leads = getLeadsFromStorage().filter(l => !l.isDeleted);

  if (!filters) return leads;

  if (filters.status?.length) {
    leads = leads.filter(l => filters.status!.includes(l.status));
  }

  if (filters.urgency?.length) {
    leads = leads.filter(l => filters.urgency!.includes(l.urgency));
  }

  if (filters.source?.length) {
    leads = leads.filter(l => filters.source!.includes(l.source));
  }

  if (filters.assignedTo) {
    leads = leads.filter(l => l.assignedTo === filters.assignedTo);
  }

  if (filters.transactionType) {
    leads = leads.filter(l => l.transactionType === filters.transactionType);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    leads = leads.filter(l =>
      l.firstName.toLowerCase().includes(searchLower) ||
      l.lastName.toLowerCase().includes(searchLower) ||
      l.email.toLowerCase().includes(searchLower) ||
      l.phone.includes(searchLower) ||
      l.city?.toLowerCase().includes(searchLower)
    );
  }

  if (filters.dateFrom) {
    leads = leads.filter(l => new Date(l.createdAt) >= new Date(filters.dateFrom!));
  }

  if (filters.dateTo) {
    leads = leads.filter(l => new Date(l.createdAt) <= new Date(filters.dateTo!));
  }

  return leads;
}

export function getLeadsByStatus(status: LeadStatus): Lead[] {
  return getLeads({ status: [status] });
}

export function getDeletedLeads(): Lead[] {
  return getLeadsFromStorage().filter(l => l.isDeleted);
}

// ============================================================================
// LEAD ACTIVITIES
// ============================================================================

export function addNoteToLead(leadId: string, content: string, createdBy = 'Admin'): Lead | null {
  const lead = getLeadById(leadId);
  if (!lead) return null;

  const now = formatDate(new Date());

  const note: Note = {
    id: generateId(),
    content,
    createdBy,
    createdAt: now,
  };

  const activity: Activity = {
    id: generateId(),
    type: 'note_added',
    title: 'Note ajoutée',
    description: content.substring(0, 100),
    createdAt: now,
    createdBy,
  };

  return updateLead(leadId, {
    notes: [...(lead.notes || []), note],
    activities: [...(lead.activities || []), activity],
  });
}

export function addTaskToLead(leadId: string, task: Omit<Task, 'id' | 'createdAt' | 'completed'>): Lead | null {
  const lead = getLeadById(leadId);
  if (!lead) return null;

  const newTask: Task = {
    ...task,
    id: generateId(),
    completed: false,
    createdAt: formatDate(new Date()),
  };

  return updateLead(leadId, {
    tasks: [...(lead.tasks || []), newTask],
  });
}

export function completeTask(leadId: string, taskId: string): Lead | null {
  const lead = getLeadById(leadId);
  if (!lead) return null;

  const tasks = lead.tasks?.map(t =>
    t.id === taskId
      ? { ...t, completed: true, completedAt: formatDate(new Date()) }
      : t
  );

  return updateLead(leadId, { tasks });
}

export function recordActivity(leadId: string, activity: Omit<Activity, 'id' | 'createdAt'>): Lead | null {
  const lead = getLeadById(leadId);
  if (!lead) return null;

  const newActivity: Activity = {
    ...activity,
    id: generateId(),
    createdAt: formatDate(new Date()),
  };

  return updateLead(leadId, {
    activities: [...(lead.activities || []), newActivity],
  });
}

// Simplified activity logging function for chatbot use
export function addActivity(
  leadId: string,
  type: ActivityType,
  title: string,
  description?: string,
  agent?: string
): Lead | null {
  return recordActivity(leadId, {
    type,
    title,
    description,
    agent: agent || 'NOUR AI',
  });
}

// ============================================================================
// AUTO-ASSIGNMENT
// ============================================================================

export function autoAssignLead(lead: Lead): Lead | null {
  const agents = getAgents().filter(a => a.isActive && a.currentLeads < a.maxLeads);

  if (agents.length === 0) return null;

  // Simple round-robin assignment
  const sortedAgents = agents.sort((a, b) => a.currentLeads - b.currentLeads);
  const assignedAgent = sortedAgents[0];

  // Update agent lead count
  updateAgent(assignedAgent.id, {
    currentLeads: assignedAgent.currentLeads + 1,
  });

  // Update lead
  return updateLead(lead.id, {
    assignedTo: assignedAgent.id,
    assignedAt: formatDate(new Date()),
  });
}

export function reassignLead(leadId: string, newAgentId: string): Lead | null {
  const lead = getLeadById(leadId);
  if (!lead) return null;

  // Decrement old agent count
  if (lead.assignedTo) {
    const oldAgent = getAgentById(lead.assignedTo);
    if (oldAgent) {
      updateAgent(oldAgent.id, {
        currentLeads: Math.max(0, oldAgent.currentLeads - 1),
      });
    }
  }

  // Increment new agent count
  const newAgent = getAgentById(newAgentId);
  if (newAgent) {
    updateAgent(newAgent.id, {
      currentLeads: newAgent.currentLeads + 1,
    });
  }

  return updateLead(leadId, {
    assignedTo: newAgentId,
    assignedAt: formatDate(new Date()),
  });
}

// ============================================================================
// AGENT MANAGEMENT
// ============================================================================

function getAgentsFromStorage(): Agent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AGENTS);
    if (data) return JSON.parse(data);

    // Initialize with default admin
    const defaultAgent: Agent = {
      id: 'admin-default',
      email: 'admin@nourreska.com',
      firstName: 'Admin',
      lastName: 'Nourreska',
      role: 'admin',
      isActive: true,
      maxLeads: 100,
      currentLeads: 0,
      createdAt: formatDate(new Date()),
    };
    saveAgentsToStorage([defaultAgent]);
    return [defaultAgent];
  } catch {
    return [];
  }
}

function saveAgentsToStorage(agents: Agent[]): void {
  localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
}

export function getAgents(): Agent[] {
  return getAgentsFromStorage();
}

export function getAgentById(id: string): Agent | null {
  return getAgentsFromStorage().find(a => a.id === id) || null;
}

export function createAgent(data: Partial<Agent>): Agent {
  const agent: Agent = {
    id: generateId(),
    email: data.email || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    phone: data.phone,
    role: data.role || 'agent',
    avatar: data.avatar,
    isActive: true,
    maxLeads: data.maxLeads || 50,
    currentLeads: 0,
    specializations: data.specializations,
    createdAt: formatDate(new Date()),
  };

  const agents = getAgentsFromStorage();
  agents.push(agent);
  saveAgentsToStorage(agents);

  return agent;
}

export function updateAgent(id: string, updates: Partial<Agent>): Agent | null {
  const agents = getAgentsFromStorage();
  const index = agents.findIndex(a => a.id === id);

  if (index === -1) return null;

  agents[index] = { ...agents[index], ...updates };
  saveAgentsToStorage(agents);

  return agents[index];
}

export function deleteAgent(id: string): boolean {
  const agents = getAgentsFromStorage();
  const filtered = agents.filter(a => a.id !== id);
  saveAgentsToStorage(filtered);
  return filtered.length !== agents.length;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function getNotificationsFromStorage(): Notification[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveNotificationsToStorage(notifications: Notification[]): void {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
}

export function createNotification(data: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
  const notification: Notification = {
    ...data,
    id: generateId(),
    read: false,
    createdAt: formatDate(new Date()),
  };

  const notifications = getNotificationsFromStorage();
  notifications.unshift(notification);

  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications.pop();
  }

  saveNotificationsToStorage(notifications);
  return notification;
}

export function getNotifications(): Notification[] {
  return getNotificationsFromStorage();
}

export function getUnreadNotifications(): Notification[] {
  return getNotificationsFromStorage().filter(n => !n.read);
}

export function markNotificationAsRead(id: string): void {
  const notifications = getNotificationsFromStorage();
  const index = notifications.findIndex(n => n.id === id);

  if (index !== -1) {
    notifications[index].read = true;
    saveNotificationsToStorage(notifications);
  }
}

export function markAllNotificationsAsRead(): void {
  const notifications = getNotificationsFromStorage().map(n => ({ ...n, read: true }));
  saveNotificationsToStorage(notifications);
}

export function clearNotifications(): void {
  saveNotificationsToStorage([]);
}

// ============================================================================
// STATISTICS
// ============================================================================

export function getCRMStats(): CRMStats {
  const leads = getLeads();
  const now = new Date();

  const newLeadsToday = leads.filter(l => isToday(l.createdAt)).length;
  const newLeadsWeek = leads.filter(l => isThisWeek(l.createdAt)).length;
  const newLeadsMonth = leads.filter(l => isThisMonth(l.createdAt)).length;

  const leadsWon = leads.filter(l => l.status === 'won').length;
  const leadsLost = leads.filter(l => l.status === 'lost').length;

  const totalWithDecision = leadsWon + leadsLost;
  const conversionRate = totalWithDecision > 0 ? (leadsWon / totalWithDecision) * 100 : 0;

  const avgScore = leads.length > 0
    ? leads.reduce((sum, l) => sum + l.score, 0) / leads.length
    : 0;

  const pipelineValue = leads
    .filter(l => !['won', 'lost'].includes(l.status))
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  const totalRevenue = leads
    .filter(l => l.status === 'won')
    .reduce((sum, l) => sum + (l.actualValue || l.estimatedValue || 0), 0);

  // By status
  const leadsByStatus: Record<LeadStatus, number> = {
    new: 0, contacted: 0, qualified: 0, visit_scheduled: 0,
    visit_completed: 0, proposal_sent: 0, negotiation: 0,
    won: 0, lost: 0, nurturing: 0,
  };
  leads.forEach(l => { leadsByStatus[l.status]++; });

  // By source
  const leadsBySource: Record<LeadSource, number> = {
    chatbot: 0, website_form: 0, phone: 0, email: 0,
    walk_in: 0, referral: 0, social_media: 0, other: 0,
  };
  leads.forEach(l => { leadsBySource[l.source]++; });

  // By urgency
  const leadsByUrgency: Record<LeadUrgency, number> = {
    low: 0, medium: 0, high: 0, critical: 0,
  };
  leads.forEach(l => { leadsByUrgency[l.urgency]++; });

  return {
    totalLeads: leads.length,
    newLeadsToday,
    newLeadsWeek,
    newLeadsMonth,
    leadsWon,
    leadsLost,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgScore: Math.round(avgScore),
    pipelineValue,
    totalRevenue,
    leadsByStatus,
    leadsBySource,
    leadsByUrgency,
  };
}

// ============================================================================
// CHAT INTEGRATION
// ============================================================================

export function convertChatToLead(
  sessionId: string,
  messages: ChatMessage[],
  extractedData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    city?: string;
    propertyInterest?: string[];
    transactionType?: PropertyCategory;
    budgetMin?: number;
    budgetMax?: number;
    urgency?: LeadUrgency; // AI-detected urgency from conversation
  }
): Lead {
  return createLead({
    ...extractedData,
    source: 'chatbot',
    chatSessionId: sessionId,
    chatMessages: messages,
    status: 'new',
    urgency: extractedData.urgency, // Pass AI-detected urgency
  });
}

// Contact extraction patterns
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
const PHONE_PATTERNS = [
  /(?:\+212|00212|0)[\s.-]?[5-7][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g, // Morocco
  /(?:\+33|0033)[\s.-]?[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g, // France
];
const NAME_PATTERNS = [
  /(?:je m'appelle|moi c'est|je suis|mon nom est)\s+([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)?)/i,
  /(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
];

export function extractContactFromMessage(message: string): {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
} {
  const result: { email?: string; phone?: string; firstName?: string; lastName?: string } = {};

  // Extract email
  const emailMatch = message.match(EMAIL_REGEX);
  if (emailMatch) {
    result.email = emailMatch[0].toLowerCase();
  }

  // Extract phone
  for (const pattern of PHONE_PATTERNS) {
    const phoneMatch = message.match(pattern);
    if (phoneMatch) {
      result.phone = phoneMatch[0].replace(/[\s.-]/g, '');
      break;
    }
  }

  // Extract name
  for (const pattern of NAME_PATTERNS) {
    const nameMatch = message.match(pattern);
    if (nameMatch) {
      const nameParts = nameMatch[1].trim().split(/\s+/);
      result.firstName = nameParts[0];
      if (nameParts.length > 1) {
        result.lastName = nameParts.slice(1).join(' ');
      }
      break;
    }
  }

  return result;
}

export function detectPropertyInterest(message: string, properties: any[]): string[] {
  const messageLower = message.toLowerCase();
  const interests: string[] = [];

  // Check for transaction type keywords
  const rentKeywords = ['louer', 'location', 'rent', 'bail'];
  const saleKeywords = ['acheter', 'achat', 'vendre', 'vente', 'buy', 'purchase'];

  // Check for property type keywords
  const typeKeywords = ['villa', 'appartement', 'maison', 'studio', 'duplex', 'bureau'];

  // Check for location keywords
  const locationKeywords = ['anfa', 'maarif', 'californie', 'bouskoura', 'dar bouazza', 'ain diab'];

  // Match against property names/descriptions
  properties.forEach(prop => {
    const propName = prop.name?.toLowerCase() || '';
    const propLocation = prop.location?.toLowerCase() || '';

    if (messageLower.includes(propName.substring(0, 20)) ||
        locationKeywords.some(loc => messageLower.includes(loc) && propLocation.includes(loc))) {
      interests.push(prop.id);
    }
  });

  return interests.slice(0, 5); // Max 5 interests
}

export function detectBudget(message: string): { min?: number; max?: number } {
  const result: { min?: number; max?: number } = {};

  // Patterns for budget detection
  const budgetPatterns = [
    /budget[:\s]+(\d+[\s,.]?\d*)\s*(?:à|-)?\s*(\d+[\s,.]?\d*)?\s*(?:mad|dh|dirhams?)?/i,
    /(\d+[\s,.]?\d*)\s*(?:à|-)\s*(\d+[\s,.]?\d*)\s*(?:mad|dh|dirhams?)/i,
    /(?:moins de|under|max)\s*(\d+[\s,.]?\d*)\s*(?:mad|dh)?/i,
    /(?:plus de|over|min)\s*(\d+[\s,.]?\d*)\s*(?:mad|dh)?/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = message.match(pattern);
    if (match) {
      const num1 = parseFloat(match[1]?.replace(/[\s,]/g, '') || '0');
      const num2 = match[2] ? parseFloat(match[2].replace(/[\s,]/g, '')) : undefined;

      if (num2) {
        result.min = Math.min(num1, num2);
        result.max = Math.max(num1, num2);
      } else if (message.toLowerCase().includes('moins') || message.toLowerCase().includes('max')) {
        result.max = num1;
      } else if (message.toLowerCase().includes('plus') || message.toLowerCase().includes('min')) {
        result.min = num1;
      } else {
        result.max = num1;
      }
      break;
    }
  }

  return result;
}

// ============================================================================
// EXPORT / IMPORT
// ============================================================================

export function exportLeadsToCSV(): string {
  const leads = getLeads();

  const headers = [
    'ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Ville',
    'Statut', 'Urgence', 'Score', 'Source', 'Type Transaction',
    'Budget Min', 'Budget Max', 'Agent Assigné', 'Créé le',
  ];

  const rows = leads.map(l => [
    l.id,
    l.firstName,
    l.lastName,
    l.email,
    l.phone,
    l.city || '',
    l.status,
    l.urgency,
    l.score.toString(),
    l.source,
    l.transactionType || '',
    l.budgetMin?.toString() || '',
    l.budgetMax?.toString() || '',
    l.assignedTo || '',
    new Date(l.createdAt).toLocaleDateString('fr-FR'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export function downloadLeadsCSV(): void {
  const csv = exportLeadsToCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nourreska_leads_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  // Revoke the blob URL to free memory
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ============================================================================
// DEMANDS MANAGEMENT
// ============================================================================

function getDemandsFromStorage(): Demand[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DEMANDS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[CRM] Error reading demands:', error);
    return [];
  }
}

function saveDemandsToStorage(demands: Demand[]): void {
  localStorage.setItem(STORAGE_KEYS.DEMANDS, JSON.stringify(demands));
}

function getMatchesFromStorage(): DemandMatch[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DEMAND_MATCHES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[CRM] Error reading matches:', error);
    return [];
  }
}

function saveMatchesToStorage(matches: DemandMatch[]): void {
  localStorage.setItem(STORAGE_KEYS.DEMAND_MATCHES, JSON.stringify(matches));
}

export function getDemands(filters?: { type?: DemandType; status?: DemandStatus; search?: string }): Demand[] {
  let demands = getDemandsFromStorage();

  if (filters?.type) {
    demands = demands.filter(d => d.type === filters.type);
  }
  if (filters?.status) {
    demands = demands.filter(d => d.status === filters.status);
  }
  if (filters?.search) {
    const query = filters.search.toLowerCase();
    demands = demands.filter(d =>
      d.firstName.toLowerCase().includes(query) ||
      d.lastName.toLowerCase().includes(query) ||
      d.email.toLowerCase().includes(query) ||
      d.phone.includes(query)
    );
  }

  return demands.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getDemandById(id: string): Demand | undefined {
  return getDemandsFromStorage().find(d => d.id === id);
}

export function createDemand(data: Partial<Demand>): Demand {
  const demands = getDemandsFromStorage();
  const now = formatDate(new Date());

  const newDemand: Demand = {
    id: generateId(),
    type: data.type || 'property_search',
    status: 'new',
    urgency: data.urgency || 'medium',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    whatsapp: data.whatsapp,
    preferredContact: data.preferredContact,
    searchCriteria: data.searchCriteria,
    propertyDetails: data.propertyDetails,
    source: data.source || 'website_form',
    chatSessionId: data.chatSessionId,
    leadId: data.leadId,
    assignedTo: data.assignedTo,
    notes: [],
    activities: [{
      id: generateId(),
      type: 'lead_created',
      title: 'Demande créée',
      description: `Nouvelle demande de type ${data.type === 'property_search' ? 'recherche' : data.type === 'property_sale' ? 'vente' : 'gestion locative'}`,
      createdAt: now,
    }],
    createdAt: now,
    updatedAt: now,
  };

  demands.unshift(newDemand);
  saveDemandsToStorage(demands);

  // Create notification
  createNotification({
    type: 'new_lead',
    title: 'Nouvelle demande',
    message: `${newDemand.firstName} ${newDemand.lastName} - ${newDemand.type === 'property_search' ? 'Recherche de bien' : newDemand.type === 'property_sale' ? 'Vente de bien' : 'Gestion locative'}`,
  });

  // Trigger matching check
  setTimeout(() => runMatchingEngine(newDemand.id), 1000);

  console.log('[CRM] Created demand:', newDemand.id);
  return newDemand;
}

export function updateDemand(id: string, updates: Partial<Demand>): Demand | undefined {
  const demands = getDemandsFromStorage();
  const index = demands.findIndex(d => d.id === id);

  if (index === -1) return undefined;

  const oldDemand = demands[index];
  const updatedDemand: Demand = {
    ...oldDemand,
    ...updates,
    updatedAt: formatDate(new Date()),
  };

  // Track status change
  if (updates.status && updates.status !== oldDemand.status) {
    updatedDemand.activities = [
      ...(updatedDemand.activities || []),
      {
        id: generateId(),
        type: 'status_changed',
        title: 'Statut modifié',
        description: `${oldDemand.status} → ${updates.status}`,
        createdAt: formatDate(new Date()),
      },
    ];
  }

  demands[index] = updatedDemand;
  saveDemandsToStorage(demands);

  return updatedDemand;
}

export function deleteDemand(id: string): boolean {
  const demands = getDemandsFromStorage();
  const filtered = demands.filter(d => d.id !== id);

  if (filtered.length === demands.length) return false;

  saveDemandsToStorage(filtered);
  return true;
}

export function getDemandStats(): DemandStats {
  const demands = getDemandsFromStorage();
  const matches = getMatchesFromStorage();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();

  const stats: DemandStats = {
    totalDemands: demands.length,
    newDemandsToday: demands.filter(d => new Date(d.createdAt).getTime() >= startOfToday).length,
    newDemandsWeek: demands.filter(d => new Date(d.createdAt).getTime() >= startOfWeek).length,
    demandsByType: {
      property_search: 0,
      property_sale: 0,
      property_rental_management: 0,
    },
    demandsByStatus: {
      new: 0,
      processing: 0,
      matched: 0,
      contacted: 0,
      completed: 0,
      cancelled: 0,
    },
    totalMatches: matches.length,
    successfulMatches: matches.filter(m => m.status === 'successful').length,
    avgMatchScore: matches.length > 0
      ? Math.round(matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length)
      : 0,
  };

  demands.forEach(d => {
    stats.demandsByType[d.type]++;
    stats.demandsByStatus[d.status]++;
  });

  return stats;
}

// ============================================================================
// AI MATCHING ENGINE
// ============================================================================

interface PropertyData {
  id: string;
  name?: string;
  type?: string;
  category: 'RENT' | 'SALE';
  price?: string;
  priceNumeric?: number;
  location?: string;
  city?: string;
  beds?: number;
  baths?: number;
  surface?: number;
  amenities?: string[];
}

// Scoring weights for matching
const MATCH_WEIGHTS = {
  transactionType: 30, // Must match
  propertyType: 20,
  location: 20,
  budget: 15,
  bedrooms: 10,
  surface: 5,
  amenities: 5, // Bonus
};

export function calculateMatchScore(demand: Demand, property: PropertyData): { score: number; reasons: string[]; details: Record<string, any> } {
  let score = 0;
  const reasons: string[] = [];
  const details: Record<string, any> = {};

  const criteria = demand.searchCriteria;
  if (!criteria) return { score: 0, reasons: ['Pas de critères de recherche'], details };

  // Transaction Type Match (Critical - 30%)
  const demandTransaction = criteria.transactionType;
  const propertyTransaction = property.category;

  if (demandTransaction === propertyTransaction) {
    score += MATCH_WEIGHTS.transactionType;
    reasons.push(`Type transaction: ${demandTransaction}`);
    details.transactionMatch = true;
  } else {
    // Transaction mismatch = no match
    reasons.push(`Transaction incompatible: ${demandTransaction} vs ${propertyTransaction}`);
    return { score: 0, reasons, details };
  }

  // Property Type Match (20%)
  if (criteria.propertyType && criteria.propertyType.length > 0) {
    const propertyTypeLower = (property.type || '').toLowerCase();
    const typeMatch = criteria.propertyType.some(t =>
      propertyTypeLower.includes(t.toLowerCase()) ||
      t.toLowerCase().includes(propertyTypeLower)
    );
    if (typeMatch) {
      score += MATCH_WEIGHTS.propertyType;
      reasons.push(`Type bien: ${property.type}`);
    }
    details.propertyTypeMatch = typeMatch;
  } else {
    score += MATCH_WEIGHTS.propertyType * 0.5; // Partial score if no preference
  }

  // Location Match (20%)
  if (criteria.cities && criteria.cities.length > 0) {
    const propertyCity = (property.city || property.location || '').toLowerCase();
    const cityMatch = criteria.cities.some(c => propertyCity.includes(c.toLowerCase()));
    if (cityMatch) {
      score += MATCH_WEIGHTS.location;
      reasons.push(`Ville: ${property.city || property.location}`);
    }
    // Check neighborhoods
    if (!cityMatch && criteria.neighborhoods && criteria.neighborhoods.length > 0) {
      const neighborhoodMatch = criteria.neighborhoods.some(n =>
        propertyCity.includes(n.toLowerCase()) ||
        (property.location || '').toLowerCase().includes(n.toLowerCase())
      );
      if (neighborhoodMatch) {
        score += MATCH_WEIGHTS.location * 0.8;
        reasons.push(`Quartier: ${property.location}`);
      }
    }
    details.locationMatch = cityMatch;
  } else {
    score += MATCH_WEIGHTS.location * 0.5;
  }

  // Budget Match (15%)
  const propertyPrice = property.priceNumeric || parseInt(property.price?.replace(/\D/g, '') || '0');
  if (propertyPrice > 0) {
    const budgetMin = criteria.budgetMin || 0;
    const budgetMax = criteria.budgetMax || Infinity;

    if (propertyPrice >= budgetMin && propertyPrice <= budgetMax) {
      score += MATCH_WEIGHTS.budget;
      reasons.push(`Prix dans le budget: ${propertyPrice.toLocaleString()} MAD`);
      details.budgetMatch = 'exact';
    } else if (propertyPrice >= budgetMin * 0.9 && propertyPrice <= budgetMax * 1.1) {
      // 10% tolerance
      score += MATCH_WEIGHTS.budget * 0.7;
      reasons.push(`Prix proche du budget (±10%)`);
      details.budgetMatch = 'close';
    } else if (propertyPrice >= budgetMin * 0.8 && propertyPrice <= budgetMax * 1.2) {
      // 20% tolerance
      score += MATCH_WEIGHTS.budget * 0.4;
      reasons.push(`Prix hors budget (±20%)`);
      details.budgetMatch = 'far';
    }
  }

  // Bedrooms Match (10%)
  if (criteria.bedroomsMin !== undefined && property.beds !== undefined) {
    if (property.beds >= criteria.bedroomsMin) {
      score += MATCH_WEIGHTS.bedrooms;
      reasons.push(`${property.beds} chambres`);
    } else if (property.beds >= criteria.bedroomsMin - 1) {
      score += MATCH_WEIGHTS.bedrooms * 0.5;
    }
    details.bedroomsMatch = property.beds >= (criteria.bedroomsMin || 0);
  } else {
    score += MATCH_WEIGHTS.bedrooms * 0.5;
  }

  // Surface Match (5%)
  const propertySurface = property.surface || 0;
  if (criteria.surfaceMin !== undefined && propertySurface > 0) {
    if (propertySurface >= criteria.surfaceMin) {
      score += MATCH_WEIGHTS.surface;
      reasons.push(`Surface: ${propertySurface}m²`);
    } else if (propertySurface >= criteria.surfaceMin * 0.9) {
      score += MATCH_WEIGHTS.surface * 0.5;
    }
    details.surfaceMatch = propertySurface >= (criteria.surfaceMin || 0);
  } else {
    score += MATCH_WEIGHTS.surface * 0.5;
  }

  // Amenities Bonus (5%)
  if (criteria.amenities && criteria.amenities.length > 0 && property.amenities) {
    const matchedAmenities = criteria.amenities.filter(a =>
      property.amenities?.some(pa => pa.toLowerCase().includes(a.toLowerCase()))
    );
    const amenityScore = (matchedAmenities.length / criteria.amenities.length) * MATCH_WEIGHTS.amenities;
    score += amenityScore;
    if (matchedAmenities.length > 0) {
      reasons.push(`Équipements: ${matchedAmenities.join(', ')}`);
    }
    details.amenitiesMatch = matchedAmenities;
  }

  // Normalize score to 0-100
  const normalizedScore = Math.min(100, Math.round(score));

  return { score: normalizedScore, reasons, details };
}

export function findMatchesForDemand(demandId: string, properties: PropertyData[]): DemandMatch[] {
  const demand = getDemandById(demandId);
  if (!demand || demand.type !== 'property_search') return [];

  const matches: DemandMatch[] = [];
  const now = formatDate(new Date());

  for (const property of properties) {
    const { score, reasons, details } = calculateMatchScore(demand, property);

    // Only include matches with score >= 60
    if (score >= 60) {
      matches.push({
        id: generateId(),
        demandId: demand.id,
        matchedEntityId: property.id,
        matchType: 'demand_to_property',
        matchScore: score,
        matchReasons: reasons,
        matchDetails: details,
        status: 'pending',
        createdAt: now,
      });
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

export function matchSellerWithBuyers(demandId: string): DemandMatch[] {
  const sellerDemand = getDemandById(demandId);
  if (!sellerDemand || sellerDemand.type === 'property_search') return [];

  const propertyDetails = sellerDemand.propertyDetails;
  if (!propertyDetails) return [];

  // Get all property search demands
  const searchDemands = getDemands({ type: 'property_search', status: 'new' })
    .concat(getDemands({ type: 'property_search', status: 'processing' }));

  const matches: DemandMatch[] = [];
  const now = formatDate(new Date());

  // Create a pseudo-property from seller's property details
  const pseudoProperty: PropertyData = {
    id: sellerDemand.id,
    name: propertyDetails.title,
    type: propertyDetails.propertyType,
    category: propertyDetails.transactionType === 'MANAGEMENT' ? 'RENT' : propertyDetails.transactionType as 'RENT' | 'SALE',
    priceNumeric: propertyDetails.price,
    location: propertyDetails.neighborhood,
    city: propertyDetails.city,
    beds: propertyDetails.bedrooms,
    baths: propertyDetails.bathrooms,
    surface: propertyDetails.surface,
    amenities: propertyDetails.amenities,
  };

  for (const buyerDemand of searchDemands) {
    const { score, reasons, details } = calculateMatchScore(buyerDemand, pseudoProperty);

    if (score >= 60) {
      matches.push({
        id: generateId(),
        demandId: sellerDemand.id,
        matchedEntityId: buyerDemand.id,
        matchType: 'demand_to_demand',
        matchScore: score,
        matchReasons: reasons,
        matchDetails: details,
        status: 'pending',
        createdAt: now,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

export function runMatchingEngine(demandId?: string): { newMatches: number; totalChecked: number } {
  const existingMatches = getMatchesFromStorage();
  let newMatches: DemandMatch[] = [];
  let totalChecked = 0;

  // Get properties from localStorage or a global state
  const propertiesData = localStorage.getItem('nourreska_properties');
  let properties: PropertyData[] = [];
  try {
    properties = propertiesData ? JSON.parse(propertiesData) : [];
  } catch (error) {
    console.error('[CRM] Error parsing properties data:', error);
  }

  if (demandId) {
    // Match specific demand
    const demand = getDemandById(demandId);
    if (demand) {
      if (demand.type === 'property_search') {
        const matches = findMatchesForDemand(demandId, properties);
        newMatches = matches.filter(m =>
          !existingMatches.some(e =>
            e.demandId === m.demandId && e.matchedEntityId === m.matchedEntityId
          )
        );
        totalChecked = properties.length;
      } else {
        const matches = matchSellerWithBuyers(demandId);
        newMatches = matches.filter(m =>
          !existingMatches.some(e =>
            e.demandId === m.demandId && e.matchedEntityId === m.matchedEntityId
          )
        );
        totalChecked = getDemands({ type: 'property_search' }).length;
      }

      // Update demand with match info
      if (newMatches.length > 0) {
        updateDemand(demandId, {
          status: 'matched',
          matchedPropertyIds: newMatches.map(m => m.matchedEntityId),
          matchScore: newMatches[0]?.matchScore,
          lastMatchCheck: formatDate(new Date()),
        });
      }
    }
  } else {
    // Run for all active demands
    const activeDemands = getDemands({ status: 'new' }).concat(getDemands({ status: 'processing' }));

    for (const demand of activeDemands) {
      if (demand.type === 'property_search') {
        const matches = findMatchesForDemand(demand.id, properties);
        const uniqueMatches = matches.filter(m =>
          !existingMatches.some(e =>
            e.demandId === m.demandId && e.matchedEntityId === m.matchedEntityId
          )
        );
        newMatches.push(...uniqueMatches);
      } else {
        const matches = matchSellerWithBuyers(demand.id);
        const uniqueMatches = matches.filter(m =>
          !existingMatches.some(e =>
            e.demandId === m.demandId && e.matchedEntityId === m.matchedEntityId
          )
        );
        newMatches.push(...uniqueMatches);
      }
      totalChecked++;
    }
  }

  // Save new matches
  if (newMatches.length > 0) {
    saveMatchesToStorage([...existingMatches, ...newMatches]);

    // Create notifications for high-score matches
    const highScoreMatches = newMatches.filter(m => m.matchScore >= 80);
    highScoreMatches.forEach(match => {
      const demand = getDemandById(match.demandId);
      if (demand) {
        createNotification({
          type: 'new_lead',
          title: 'Nouveau match trouvé!',
          message: `Score ${match.matchScore}% - ${demand.firstName} ${demand.lastName}: ${match.matchReasons.slice(0, 2).join(', ')}`,
        });
      }
    });

    console.log(`[CRM Matching] Found ${newMatches.length} new matches`);
  }

  return { newMatches: newMatches.length, totalChecked };
}

export function getMatchesForDemand(demandId: string): DemandMatch[] {
  return getMatchesFromStorage()
    .filter(m => m.demandId === demandId)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function updateMatchStatus(matchId: string, status: DemandMatch['status']): DemandMatch | undefined {
  const matches = getMatchesFromStorage();
  const index = matches.findIndex(m => m.id === matchId);

  if (index === -1) return undefined;

  const now = formatDate(new Date());
  matches[index] = {
    ...matches[index],
    status,
    ...(status === 'notified' ? { notifiedAt: now } : {}),
    ...(status === 'contacted' || status === 'successful' || status === 'rejected' ? { respondedAt: now } : {}),
  };

  saveMatchesToStorage(matches);
  return matches[index];
}

// Get all matches with optional filters
export function getAllMatches(filters?: {
  status?: DemandMatch['status'];
  matchType?: DemandMatch['matchType'];
  minScore?: number;
}): DemandMatch[] {
  let matches = getMatchesFromStorage();

  if (filters?.status) {
    matches = matches.filter(m => m.status === filters.status);
  }
  if (filters?.matchType) {
    matches = matches.filter(m => m.matchType === filters.matchType);
  }
  if (filters?.minScore) {
    matches = matches.filter(m => m.matchScore >= filters.minScore);
  }

  return matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Get match by ID
export function getMatchById(matchId: string): DemandMatch | undefined {
  return getMatchesFromStorage().find(m => m.id === matchId);
}

// Get enriched match with demand and property details
export interface EnrichedMatch extends DemandMatch {
  demand?: Demand;
  matchedProperty?: PropertyData;
  matchedDemand?: Demand;
}

export function getEnrichedMatches(filters?: {
  status?: DemandMatch['status'];
  matchType?: DemandMatch['matchType'];
  minScore?: number;
}): EnrichedMatch[] {
  const matches = getAllMatches(filters);
  const propertiesData = localStorage.getItem('nourreska_properties');
  let properties: PropertyData[] = [];
  try {
    properties = propertiesData ? JSON.parse(propertiesData) : [];
  } catch (error) {
    console.error('[CRM] Error parsing properties data:', error);
  }

  return matches.map(match => {
    const demand = getDemandById(match.demandId);
    let matchedProperty: PropertyData | undefined;
    let matchedDemand: Demand | undefined;

    if (match.matchType === 'demand_to_property') {
      matchedProperty = properties.find(p => p.id === match.matchedEntityId);
    } else {
      matchedDemand = getDemandById(match.matchedEntityId);
    }

    return {
      ...match,
      demand,
      matchedProperty,
      matchedDemand,
    };
  });
}

// Match statistics
export interface MatchStats {
  totalMatches: number;
  pendingMatches: number;
  notifiedMatches: number;
  contactedMatches: number;
  successfulMatches: number;
  rejectedMatches: number;
  avgMatchScore: number;
  highScoreMatches: number; // Score >= 80
  matchesByType: Record<string, number>;
  recentMatches: number; // Last 24 hours
  lastMatchRun?: string;
}

export function getMatchStats(): MatchStats {
  const matches = getMatchesFromStorage();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const stats: MatchStats = {
    totalMatches: matches.length,
    pendingMatches: matches.filter(m => m.status === 'pending').length,
    notifiedMatches: matches.filter(m => m.status === 'notified').length,
    contactedMatches: matches.filter(m => m.status === 'contacted').length,
    successfulMatches: matches.filter(m => m.status === 'successful').length,
    rejectedMatches: matches.filter(m => m.status === 'rejected').length,
    avgMatchScore: matches.length > 0
      ? Math.round(matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length)
      : 0,
    highScoreMatches: matches.filter(m => m.matchScore >= 80).length,
    matchesByType: {
      demand_to_property: matches.filter(m => m.matchType === 'demand_to_property').length,
      demand_to_demand: matches.filter(m => m.matchType === 'demand_to_demand').length,
      property_to_demand: matches.filter(m => m.matchType === 'property_to_demand').length,
    },
    recentMatches: matches.filter(m => new Date(m.createdAt) >= oneDayAgo).length,
    lastMatchRun: localStorage.getItem('nourreska_last_match_run') || undefined,
  };

  return stats;
}

// Delete a match
export function deleteMatch(matchId: string): boolean {
  const matches = getMatchesFromStorage();
  const filtered = matches.filter(m => m.id !== matchId);

  if (filtered.length === matches.length) return false;

  saveMatchesToStorage(filtered);
  return true;
}

// Bulk delete matches
export function bulkDeleteMatches(matchIds: string[]): number {
  const matches = getMatchesFromStorage();
  const filtered = matches.filter(m => !matchIds.includes(m.id));
  const deletedCount = matches.length - filtered.length;

  saveMatchesToStorage(filtered);
  return deletedCount;
}

// Auto-matching configuration
const AUTO_MATCH_INTERVAL_KEY = 'nourreska_auto_match_interval';
const LAST_MATCH_RUN_KEY = 'nourreska_last_match_run';

let autoMatchTimer: ReturnType<typeof setInterval> | null = null;
let autoMatchCallbacks: ((result: { newMatches: number; totalChecked: number }) => void)[] = [];

export function setAutoMatchInterval(minutes: number): void {
  localStorage.setItem(AUTO_MATCH_INTERVAL_KEY, minutes.toString());
  restartAutoMatching();
}

export function getAutoMatchInterval(): number {
  return parseInt(localStorage.getItem(AUTO_MATCH_INTERVAL_KEY) || '15', 10);
}

export function getLastMatchRun(): string | null {
  return localStorage.getItem(LAST_MATCH_RUN_KEY);
}

export function onAutoMatchComplete(callback: (result: { newMatches: number; totalChecked: number }) => void): () => void {
  autoMatchCallbacks.push(callback);
  return () => {
    autoMatchCallbacks = autoMatchCallbacks.filter(cb => cb !== callback);
  };
}

export function runAutoMatch(): { newMatches: number; totalChecked: number } {
  const result = runMatchingEngine();
  const now = formatDate(new Date());
  localStorage.setItem(LAST_MATCH_RUN_KEY, now);

  // Notify all callbacks
  autoMatchCallbacks.forEach(cb => cb(result));

  console.log(`[CRM Auto-Match] Ran at ${now}: ${result.newMatches} new matches from ${result.totalChecked} demands`);
  return result;
}

export function startAutoMatching(): void {
  if (autoMatchTimer) {
    clearInterval(autoMatchTimer);
  }

  const intervalMinutes = getAutoMatchInterval();
  const intervalMs = intervalMinutes * 60 * 1000;

  // Run immediately on start
  runAutoMatch();

  // Then run at intervals
  autoMatchTimer = setInterval(() => {
    runAutoMatch();
  }, intervalMs);

  console.log(`[CRM Auto-Match] Started with ${intervalMinutes} minute interval`);
}

export function stopAutoMatching(): void {
  if (autoMatchTimer) {
    clearInterval(autoMatchTimer);
    autoMatchTimer = null;
    console.log('[CRM Auto-Match] Stopped');
  }
}

export function restartAutoMatching(): void {
  stopAutoMatching();
  startAutoMatching();
}

export function isAutoMatchingRunning(): boolean {
  return autoMatchTimer !== null;
}

// ============================================================================
// CHATBOT DEMAND CAPTURE
// ============================================================================

export function createDemandFromChat(
  sessionId: string,
  messages: ChatMessage[],
  extractedData: {
    type: DemandType;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    searchCriteria?: Demand['searchCriteria'];
    propertyDetails?: Demand['propertyDetails'];
  }
): Demand {
  return createDemand({
    ...extractedData,
    source: 'chatbot',
    chatSessionId: sessionId,
  });
}

export function detectDemandIntent(message: string): DemandType | null {
  const msgLower = message.toLowerCase();

  // Property search patterns
  const searchPatterns = [
    'je cherche', 'je recherche', 'looking for', 'interested in',
    'vous avez', 'avez-vous', 'besoin d\'un', 'besoin d\'une',
    'je veux louer', 'je veux acheter', 'louer un', 'acheter un',
  ];

  // Property sale patterns
  const salePatterns = [
    'vendre mon', 'vendre ma', 'à vendre', 'je vends',
    'mettre en vente', 'selling my', 'sell my',
    'j\'ai un bien à vendre', 'j\'ai une propriété',
  ];

  // Rental management patterns
  const managementPatterns = [
    'gestion locative', 'gérer mon bien', 'mettre en location',
    'louer mon', 'rental management', 'gérer ma propriété',
    'j\'ai un appartement à louer', 'cherche à louer mon',
  ];

  if (managementPatterns.some(p => msgLower.includes(p))) {
    return 'property_rental_management';
  }
  if (salePatterns.some(p => msgLower.includes(p))) {
    return 'property_sale';
  }
  if (searchPatterns.some(p => msgLower.includes(p))) {
    return 'property_search';
  }

  return null;
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export function bulkDeleteLeads(ids: string[], permanent = false): number {
  let deleted = 0;
  for (const id of ids) {
    if (deleteLead(id, permanent)) {
      deleted++;
    }
  }
  return deleted;
}

export function bulkDeleteDemands(ids: string[]): number {
  let deleted = 0;
  for (const id of ids) {
    if (deleteDemand(id)) {
      deleted++;
    }
  }
  return deleted;
}

export function deleteAllLeads(permanent = false): number {
  const leads = getLeads();
  return bulkDeleteLeads(leads.map(l => l.id), permanent);
}

export function deleteAllDemands(): number {
  const demands = getDemands();
  return bulkDeleteDemands(demands.map(d => d.id));
}

// ============================================================================
// SYNTHETIC DATA GENERATION
// ============================================================================

const SYNTHETIC_FIRST_NAMES = [
  'Mohammed', 'Fatima', 'Ahmed', 'Amina', 'Youssef', 'Khadija', 'Omar', 'Aisha',
  'Hassan', 'Zahra', 'Ibrahim', 'Nadia', 'Ali', 'Sara', 'Khalid', 'Leila',
  'Rachid', 'Samira', 'Mehdi', 'Houda', 'Karim', 'Meryem', 'Samir', 'Hanane',
  'Abdellah', 'Soukaina', 'Amine', 'Imane', 'Hamza', 'Loubna', 'Adil', 'Ghita',
  'Driss', 'Karima', 'Mustapha', 'Hafsa', 'Nabil', 'Zineb', 'Reda', 'Asma',
  'Jean', 'Marie', 'Pierre', 'Sophie', 'Laurent', 'Isabelle', 'Marc', 'Claire',
  'David', 'Emma', 'Thomas', 'Léa', 'Nicolas', 'Julie', 'François', 'Camille'
];

const SYNTHETIC_LAST_NAMES = [
  'Benali', 'El Amrani', 'Tazi', 'Berrada', 'Benjelloun', 'Alaoui', 'Fassi',
  'El Idrissi', 'Lahlou', 'Bennani', 'El Mansouri', 'Chraibi', 'Kettani',
  'El Kabbaj', 'Sebti', 'Belhaj', 'El Filali', 'Zniber', 'Bensaid', 'Tahiri',
  'Hassani', 'El Ouali', 'Cherkaoui', 'Bouazza', 'El Baz', 'Rifai', 'Naciri',
  'Martin', 'Bernard', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel',
  'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier'
];

const SYNTHETIC_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir', 'Meknès',
  'Kénitra', 'Tétouan', 'El Jadida', 'Mohammedia', 'Salé', 'Témara'
];

const SYNTHETIC_NEIGHBORHOODS: Record<string, string[]> = {
  'Casablanca': ['Anfa', 'Californie', 'Maarif', 'Ain Diab', 'Bouskoura', 'Racine', 'Gauthier', 'CIL', 'Bourgogne', 'Palmier', 'Oasis', 'Sidi Maarouf'],
  'Rabat': ['Agdal', 'Hay Riad', 'Souissi', 'Hassan', 'Océan', 'Les Orangers', 'Aviation'],
  'Marrakech': ['Guéliz', 'Hivernage', 'Palmeraie', 'Médina', 'Targa', 'Amelkis'],
  'Tanger': ['Malabata', 'Iberia', 'Marshan', 'Centre Ville', 'Cap Spartel'],
};

const SYNTHETIC_SOURCES: LeadSource[] = ['chatbot', 'website_form', 'phone', 'email', 'walk_in', 'referral', 'social_media'];
const SYNTHETIC_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'visit_scheduled', 'visit_completed', 'proposal_sent', 'negotiation', 'won', 'lost'];
const SYNTHETIC_URGENCIES: LeadUrgency[] = ['low', 'medium', 'high', 'critical'];
const SYNTHETIC_PROPERTY_TYPES: PropertyType[] = ['villa', 'apartment', 'riad', 'land', 'commercial', 'penthouse', 'duplex', 'studio'];
const SYNTHETIC_AMENITIES = ['piscine', 'jardin', 'parking', 'terrasse', 'vue mer', 'meublé', 'climatisation', 'ascenseur', 'gardien', 'concierge'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomPhone(): string {
  const prefixes = ['06', '07'];
  const prefix = randomElement(prefixes);
  const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `+212 ${prefix}${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4, 6)} ${number.slice(6, 8)}`;
}

function randomEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.fr', 'hotmail.com', 'live.fr', 'protonmail.com'];
  const cleanFirst = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
  const cleanLast = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').replace(/'/g, '');
  const random = Math.floor(Math.random() * 100);
  return `${cleanFirst}.${cleanLast}${random}@${randomElement(domains)}`;
}

function randomDate(daysBack: number): number {
  const now = Date.now();
  const randomDays = Math.floor(Math.random() * daysBack);
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  return now - (randomDays * 24 * 60 * 60 * 1000) - (randomHours * 60 * 60 * 1000) - (randomMinutes * 60 * 1000);
}

function randomBudget(category: PropertyCategory): { min: number; max: number } {
  if (category === 'RENT') {
    const ranges = [
      { min: 5000, max: 10000 },
      { min: 8000, max: 15000 },
      { min: 12000, max: 25000 },
      { min: 20000, max: 40000 },
      { min: 30000, max: 60000 },
    ];
    return randomElement(ranges);
  } else {
    const ranges = [
      { min: 500000, max: 1000000 },
      { min: 800000, max: 1500000 },
      { min: 1200000, max: 2500000 },
      { min: 2000000, max: 4000000 },
      { min: 3500000, max: 7000000 },
      { min: 5000000, max: 12000000 },
      { min: 8000000, max: 20000000 },
    ];
    return randomElement(ranges);
  }
}

export function generateSyntheticLeads(count: number): Lead[] {
  const generatedLeads: Lead[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomElement(SYNTHETIC_FIRST_NAMES);
    const lastName = randomElement(SYNTHETIC_LAST_NAMES);
    const city = randomElement(SYNTHETIC_CITIES);
    const transactionType = Math.random() > 0.3 ? 'SALE' : 'RENT';
    const budget = randomBudget(transactionType);
    const createdAt = randomDate(60); // Last 60 days
    const status = randomElement(SYNTHETIC_STATUSES);
    const source = randomElement(SYNTHETIC_SOURCES);

    const lead: Lead = {
      id: generateId(),
      firstName,
      lastName,
      email: randomEmail(firstName, lastName),
      phone: randomPhone(),
      city,
      status,
      source,
      urgency: randomElement(SYNTHETIC_URGENCIES),
      score: Math.floor(Math.random() * 60) + 20, // 20-80
      transactionType,
      budgetMin: budget.min,
      budgetMax: budget.max,
      notes: [],
      activities: [
        {
          id: generateId(),
          type: 'lead_created',
          title: 'Lead créé',
          description: `Lead généré via ${source}`,
          agent: 'System',
          createdAt: new Date(createdAt).toISOString(),
        }
      ],
      createdAt,
      updatedAt: createdAt + Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000), // Updated within 3 days
    };

    // Add some notes for random leads
    if (Math.random() > 0.6) {
      lead.notes = [{
        id: generateId(),
        content: randomElement([
          'Client très intéressé, à recontacter rapidement',
          'Budget flexible, peut monter jusqu\'à 20%',
          'Recherche urgente, déménagement prévu',
          'Investisseur, cherche plusieurs biens',
          'Première acquisition, besoin d\'accompagnement',
          'Connaît bien le quartier, critères précis',
          'Disponible uniquement le weekend',
          'Préfère les contacts par WhatsApp',
        ]),
        createdBy: 'Agent',
        createdAt: new Date(createdAt + 60000).toISOString(),
      }];
    }

    generatedLeads.push(lead);
  }

  // Save to storage
  const existingLeads = getLeads();
  saveLeadsToStorage([...existingLeads, ...generatedLeads]);

  console.log(`[CRM] Generated ${count} synthetic leads`);
  return generatedLeads;
}

export function generateSyntheticDemands(count: number): Demand[] {
  const generatedDemands: Demand[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomElement(SYNTHETIC_FIRST_NAMES);
    const lastName = randomElement(SYNTHETIC_LAST_NAMES);
    const demandType = randomElement<DemandType>(['property_search', 'property_search', 'property_search', 'property_sale', 'property_rental_management']); // More searches
    const createdAt = new Date(randomDate(45)).toISOString(); // Last 45 days
    const city = randomElement(SYNTHETIC_CITIES);
    const neighborhoods = SYNTHETIC_NEIGHBORHOODS[city] || [];

    const demand: Demand = {
      id: generateId(),
      type: demandType,
      status: randomElement<DemandStatus>(['new', 'new', 'processing', 'matched', 'contacted', 'completed']),
      urgency: randomElement<DemandUrgency>(['low', 'medium', 'medium', 'high', 'urgent']),
      firstName,
      lastName,
      email: randomEmail(firstName, lastName),
      phone: randomPhone(),
      source: randomElement<DemandSource>(['chatbot', 'chatbot', 'website_form', 'phone', 'email', 'walk_in', 'manual']),
      createdAt,
      updatedAt: createdAt,
    };

    // Add search criteria for property seekers
    if (demandType === 'property_search') {
      const transactionType = Math.random() > 0.35 ? 'SALE' : 'RENT';
      const budget = randomBudget(transactionType);

      demand.searchCriteria = {
        transactionType,
        propertyType: randomElements(SYNTHETIC_PROPERTY_TYPES, 1, 3),
        cities: [city],
        neighborhoods: neighborhoods.length > 0 ? randomElements(neighborhoods, 1, 3) : undefined,
        budgetMin: budget.min,
        budgetMax: budget.max,
        bedroomsMin: randomElement([1, 2, 2, 3, 3, 4, 5]),
        surfaceMin: randomElement([50, 80, 100, 120, 150, 200, 300]),
        amenities: Math.random() > 0.5 ? randomElements(SYNTHETIC_AMENITIES, 1, 4) : undefined,
      };
    }

    // Add property details for sellers
    if (demandType === 'property_sale' || demandType === 'property_rental_management') {
      const transactionType = demandType === 'property_sale' ? 'SALE' : 'MANAGEMENT';
      const budget = randomBudget(demandType === 'property_sale' ? 'SALE' : 'RENT');

      demand.propertyDetails = {
        propertyType: randomElement(SYNTHETIC_PROPERTY_TYPES),
        transactionType,
        city,
        neighborhood: neighborhoods.length > 0 ? randomElement(neighborhoods) : undefined,
        price: budget.max,
        surface: randomElement([60, 80, 100, 120, 150, 180, 220, 300, 400, 500]),
        bedrooms: randomElement([1, 2, 2, 3, 3, 3, 4, 4, 5, 6]),
        bathrooms: randomElement([1, 1, 2, 2, 2, 3, 3, 4]),
        amenities: randomElements(SYNTHETIC_AMENITIES, 2, 5),
      };
    }

    // Add match score for some matched demands
    if (demand.status === 'matched') {
      demand.matchScore = Math.floor(Math.random() * 40) + 60; // 60-100
      demand.matchedPropertyIds = [generateId(), generateId()];
    }

    generatedDemands.push(demand);
  }

  // Save to storage
  const existingDemands = getDemands();
  saveDemandsToStorage([...existingDemands, ...generatedDemands]);

  console.log(`[CRM] Generated ${count} synthetic demands`);
  return generatedDemands;
}

export function populateSyntheticData(leadCount = 50, demandCount = 40): { leads: Lead[]; demands: Demand[] } {
  const leads = generateSyntheticLeads(leadCount);
  const demands = generateSyntheticDemands(demandCount);

  // Run matching on new demands
  runMatchingEngine();

  return { leads, demands };
}

export function clearAllSyntheticData(): { leadsDeleted: number; demandsDeleted: number } {
  const leadsDeleted = deleteAllLeads(true);
  const demandsDeleted = deleteAllDemands();
  return { leadsDeleted, demandsDeleted };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initializeCRM(): void {
  // Ensure default agent exists
  getAgentsFromStorage();

  // Initialize demands storage if not exists
  if (!localStorage.getItem(STORAGE_KEYS.DEMANDS)) {
    saveDemandsToStorage([]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEMAND_MATCHES)) {
    saveMatchesToStorage([]);
  }

  // Start auto-matching with default 15-minute interval
  startAutoMatching();

  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      stopAutoMatching();
    });
  }

  console.log('[CRM] Nourreska CRM initialized with Demands & Matching Engine');
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initializeCRM();
}
