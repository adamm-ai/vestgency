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
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  LEADS: 'nourreska_crm_leads',
  AGENTS: 'nourreska_crm_agents',
  NOTIFICATIONS: 'nourreska_crm_notifications',
  SETTINGS: 'nourreska_crm_settings',
  CHAT_SESSIONS: 'nourreska_crm_chat_sessions',
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
  }
): Lead {
  return createLead({
    ...extractedData,
    source: 'chatbot',
    chatSessionId: sessionId,
    chatMessages: messages,
    status: 'new',
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
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `nourreska_leads_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export function initializeCRM(): void {
  // Ensure default agent exists
  getAgentsFromStorage();

  console.log('[CRM] Nourreska CRM initialized');
}

// Auto-initialize
if (typeof window !== 'undefined') {
  initializeCRM();
}
