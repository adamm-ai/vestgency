/**
 * Demands Service
 * ===============
 * Complete service for managing property demands (search requests, sale submissions, rental management)
 * with an intelligent matching engine that scores properties based on demand criteria.
 *
 * This service provides:
 * - Full CRUD operations for Demands
 * - Intelligent matching engine with weighted scoring
 * - Integration with RAG service for semantic search
 * - Real-time property matching
 *
 * @module services/demandsService
 */

import { Property } from '../types';
import { ragSearchClient, RAGSearchResult } from './ragSearchService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Type of demand: property search, sale, or rental management
 */
export type DemandType = 'property_search' | 'property_sale' | 'property_rental_management';

/**
 * Current status of the demand
 */
export type DemandStatus = 'new' | 'processing' | 'matched' | 'contacted' | 'completed' | 'cancelled';

/**
 * Urgency level of the demand
 */
export type DemandUrgency = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Source channel of the demand
 */
export type DemandSource = 'chatbot' | 'website_form' | 'phone' | 'email' | 'walk_in' | 'referral' | 'manual';

/**
 * Property types available
 */
export type PropertyTypeOption = 'villa' | 'apartment' | 'riad' | 'land' | 'commercial' | 'penthouse' | 'duplex' | 'studio' | 'other';

/**
 * Search criteria for property demands
 */
export interface DemandCriteria {
  /** Types of properties to search for */
  propertyType?: PropertyTypeOption[];
  /** Transaction type: RENT or SALE */
  transactionType?: 'RENT' | 'SALE';
  /** Target cities/locations */
  location?: string[];
  /** Neighborhoods within cities */
  neighborhoods?: string[];
  /** Minimum budget in MAD */
  budgetMin?: number;
  /** Maximum budget in MAD */
  budgetMax?: number;
  /** Minimum number of bedrooms */
  bedsMin?: number;
  /** Maximum number of bedrooms */
  bedsMax?: number;
  /** Minimum number of bathrooms */
  bathsMin?: number;
  /** Minimum surface area in m2 */
  areaMin?: number;
  /** Maximum surface area in m2 */
  areaMax?: number;
  /** Required features/amenities */
  features?: string[];
  /** Additional notes/requirements */
  additionalNotes?: string;
}

/**
 * Property details for sale/rental management demands
 */
export interface PropertyDetails {
  /** Type of property */
  propertyType: PropertyTypeOption;
  /** Transaction type */
  transactionType: 'RENT' | 'SALE' | 'MANAGEMENT';
  /** Property title */
  title?: string;
  /** Description */
  description?: string;
  /** Full address */
  address?: string;
  /** City */
  city: string;
  /** Neighborhood */
  neighborhood?: string;
  /** Asking price */
  price?: number;
  /** Surface area in m2 */
  surface?: number;
  /** Number of bedrooms */
  bedrooms?: number;
  /** Number of bathrooms */
  bathrooms?: number;
  /** Year built */
  yearBuilt?: number;
  /** Features/amenities */
  amenities?: string[];
  /** Image URLs */
  images?: string[];
  /** Document URLs */
  documents?: string[];
}

/**
 * A property match result with scoring details
 */
export interface PropertyMatch {
  /** Unique match ID */
  id: string;
  /** ID of the matched property */
  propertyId: string;
  /** Match score (0-100) */
  score: number;
  /** Criteria that matched */
  matchedCriteria: string[];
  /** Detailed match breakdown */
  matchDetails: MatchScoreBreakdown;
  /** Match status */
  status: 'pending' | 'notified' | 'contacted' | 'successful' | 'rejected';
  /** When the match was created */
  createdAt: Date;
  /** When notification was sent */
  notifiedAt?: Date;
  /** When contact was made */
  contactedAt?: Date;
}

/**
 * Detailed breakdown of match scoring
 */
export interface MatchScoreBreakdown {
  /** Location score (max 30) */
  locationScore: number;
  /** Budget score (max 25) */
  budgetScore: number;
  /** Property type score (max 20) */
  typeScore: number;
  /** Size/area score (max 15) */
  sizeScore: number;
  /** Features/amenities score (max 10) */
  featuresScore: number;
  /** Individual criterion matches */
  criterionMatches: Record<string, boolean | 'partial'>;
}

/**
 * Activity/history entry for a demand
 */
export interface DemandActivity {
  /** Activity ID */
  id: string;
  /** Type of activity */
  type: 'status_change' | 'note_added' | 'match_found' | 'contacted' | 'updated';
  /** Activity title */
  title: string;
  /** Detailed description */
  description: string;
  /** Timestamp */
  timestamp: Date;
  /** User who performed the action */
  userId?: string;
}

/**
 * Note attached to a demand
 */
export interface DemandNote {
  /** Note ID */
  id: string;
  /** Note content */
  content: string;
  /** Author */
  author: string;
  /** Timestamp */
  createdAt: Date;
}

/**
 * Complete Demand interface
 */
export interface Demand {
  /** Unique demand ID */
  id: string;
  /** Reference to lead if exists */
  leadId?: string;
  /** Type of demand */
  type: DemandType;
  /** Current status */
  status: DemandStatus;
  /** Urgency level */
  urgency: DemandUrgency;

  // Contact Information
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone: string;
  /** WhatsApp number */
  whatsapp?: string;
  /** Preferred contact method */
  preferredContact?: 'phone' | 'email' | 'whatsapp';

  // Criteria & Details
  /** Search criteria (for property_search) */
  criteria?: DemandCriteria;
  /** Property details (for property_sale, property_rental_management) */
  propertyDetails?: PropertyDetails;

  // Matching
  /** List of property matches */
  matches: PropertyMatch[];
  /** IDs of matched properties */
  matchedPropertyIds?: string[];
  /** IDs of matched demands (seller-buyer matching) */
  matchedDemandIds?: string[];
  /** Best match score */
  bestMatchScore?: number;
  /** Last time matching was run */
  lastMatchCheck?: Date;

  // Source & Attribution
  /** Source channel */
  source: DemandSource;
  /** Chat session ID if from chatbot */
  chatSessionId?: string;
  /** Assigned agent ID */
  assignedTo?: string;

  // Notes & History
  /** Notes attached to demand */
  notes?: DemandNote[];
  /** Activity history */
  activities?: DemandActivity[];

  // Timestamps
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Completion timestamp */
  completedAt?: Date;
  /** Cancellation timestamp */
  cancelledAt?: Date;
  /** Reason for cancellation */
  cancelReason?: string;
}

/**
 * Input for creating a new demand
 */
export interface CreateDemandInput {
  type: DemandType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  preferredContact?: 'phone' | 'email' | 'whatsapp';
  urgency?: DemandUrgency;
  criteria?: DemandCriteria;
  propertyDetails?: PropertyDetails;
  source: DemandSource;
  chatSessionId?: string;
  leadId?: string;
  assignedTo?: string;
  notes?: string;
}

/**
 * Filters for querying demands
 */
export interface DemandFilters {
  /** Filter by type */
  type?: DemandType;
  /** Filter by status */
  status?: DemandStatus;
  /** Filter by urgency */
  urgency?: DemandUrgency;
  /** Filter by source */
  source?: DemandSource;
  /** Search in name/email/phone */
  search?: string;
  /** Filter by assigned agent */
  assignedTo?: string;
  /** Filter by creation date (from) */
  createdFrom?: Date;
  /** Filter by creation date (to) */
  createdTo?: Date;
  /** Has matches */
  hasMatches?: boolean;
  /** Minimum match score */
  minMatchScore?: number;
}

/**
 * Statistics about demands
 */
export interface DemandStats {
  /** Total number of demands */
  totalDemands: number;
  /** New demands today */
  newDemandsToday: number;
  /** New demands this week */
  newDemandsWeek: number;
  /** Demands by type */
  demandsByType: Record<DemandType, number>;
  /** Demands by status */
  demandsByStatus: Record<DemandStatus, number>;
  /** Total matches found */
  totalMatches: number;
  /** Successful matches */
  successfulMatches: number;
  /** Average match score */
  avgMatchScore: number;
}

// ============================================================================
// STORAGE KEYS & CONFIGURATION
// ============================================================================

const STORAGE_KEYS = {
  DEMANDS: 'athome_demands',
  MATCHES: 'athome_demand_matches',
  PROPERTIES_CACHE: 'athome_properties',
};

/**
 * Match scoring weights (total = 100)
 */
const MATCH_WEIGHTS = {
  /** Location/city match - highest weight */
  location: 30,
  /** Budget range match */
  budget: 25,
  /** Property type match */
  type: 20,
  /** Size/area match */
  size: 15,
  /** Features/amenities match */
  features: 10,
};

/**
 * Minimum score threshold for a valid match
 */
const MATCH_THRESHOLD = 50;

/**
 * Maximum number of matches to return
 */
const MAX_MATCHES = 10;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `dem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique match ID
 */
function generateMatchId(): string {
  return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets demands from localStorage
 */
function getDemandsFromStorage(): Demand[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DEMANDS);
    if (!data) return [];
    const parsed = JSON.parse(data);
    // Convert date strings back to Date objects
    return parsed.map((d: any) => ({
      ...d,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
      completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
      cancelledAt: d.cancelledAt ? new Date(d.cancelledAt) : undefined,
      lastMatchCheck: d.lastMatchCheck ? new Date(d.lastMatchCheck) : undefined,
      matches: (d.matches || []).map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
        notifiedAt: m.notifiedAt ? new Date(m.notifiedAt) : undefined,
        contactedAt: m.contactedAt ? new Date(m.contactedAt) : undefined,
      })),
      activities: (d.activities || []).map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      })),
      notes: (d.notes || []).map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      })),
    }));
  } catch {
    return [];
  }
}

/**
 * Saves demands to localStorage
 */
function saveDemandsToStorage(demands: Demand[]): void {
  localStorage.setItem(STORAGE_KEYS.DEMANDS, JSON.stringify(demands));
}

/**
 * Gets cached properties from localStorage
 */
function getCachedProperties(): Property[] {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.PROPERTIES_CACHE);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

/**
 * Normalizes a string for comparison (lowercase, trim, remove accents)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Checks if two strings match (fuzzy)
 */
function fuzzyMatch(str1: string, str2: string): boolean {
  const n1 = normalizeString(str1);
  const n2 = normalizeString(str2);
  return n1.includes(n2) || n2.includes(n1);
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Creates a new demand
 *
 * @param input - The demand creation input
 * @returns The created demand
 *
 * @example
 * ```typescript
 * const demand = await createDemand({
 *   type: 'property_search',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   phone: '+212600000000',
 *   source: 'website_form',
 *   criteria: {
 *     propertyType: ['apartment'],
 *     location: ['Marrakech'],
 *     budgetMin: 500000,
 *     budgetMax: 1000000,
 *     bedsMin: 2,
 *   },
 * });
 * ```
 */
export async function createDemand(input: CreateDemandInput): Promise<Demand> {
  const demands = getDemandsFromStorage();
  const now = new Date();

  const newDemand: Demand = {
    id: generateId(),
    type: input.type,
    status: 'new',
    urgency: input.urgency || 'medium',

    // Contact
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    preferredContact: input.preferredContact,

    // Criteria & Details
    criteria: input.criteria,
    propertyDetails: input.propertyDetails,

    // Matching
    matches: [],

    // Source
    source: input.source,
    chatSessionId: input.chatSessionId,
    leadId: input.leadId,
    assignedTo: input.assignedTo,

    // Notes & History
    notes: input.notes ? [{
      id: generateId(),
      content: input.notes,
      author: 'System',
      createdAt: now,
    }] : [],
    activities: [{
      id: generateId(),
      type: 'status_change',
      title: 'Demande creee',
      description: `Nouvelle demande de type: ${input.type}`,
      timestamp: now,
    }],

    // Timestamps
    createdAt: now,
    updatedAt: now,
  };

  demands.unshift(newDemand);
  saveDemandsToStorage(demands);

  console.log(`[DemandsService] Created demand: ${newDemand.id}`);

  // Trigger automatic matching for property search demands
  if (input.type === 'property_search' && input.criteria) {
    runMatchingForDemand(newDemand.id).catch(err => {
      console.error(`[DemandsService] Auto-matching failed for ${newDemand.id}:`, err);
    });
  }

  return newDemand;
}

/**
 * Updates an existing demand
 *
 * @param id - The demand ID
 * @param updates - Partial updates to apply
 * @returns The updated demand
 * @throws Error if demand not found
 *
 * @example
 * ```typescript
 * const updated = await updateDemand('dem_123', {
 *   status: 'processing',
 *   assignedTo: 'agent_456',
 * });
 * ```
 */
export async function updateDemand(id: string, updates: Partial<Demand>): Promise<Demand> {
  const demands = getDemandsFromStorage();
  const index = demands.findIndex(d => d.id === id);

  if (index === -1) {
    throw new Error(`Demand not found: ${id}`);
  }

  const oldDemand = demands[index];
  const now = new Date();

  const updatedDemand: Demand = {
    ...oldDemand,
    ...updates,
    id: oldDemand.id, // Preserve ID
    createdAt: oldDemand.createdAt, // Preserve creation date
    updatedAt: now,
  };

  // Track status changes
  if (updates.status && updates.status !== oldDemand.status) {
    updatedDemand.activities = [
      ...(updatedDemand.activities || []),
      {
        id: generateId(),
        type: 'status_change',
        title: 'Statut modifie',
        description: `${oldDemand.status} -> ${updates.status}`,
        timestamp: now,
      },
    ];

    // Set completion/cancellation timestamps
    if (updates.status === 'completed') {
      updatedDemand.completedAt = now;
    } else if (updates.status === 'cancelled') {
      updatedDemand.cancelledAt = now;
    }
  }

  demands[index] = updatedDemand;
  saveDemandsToStorage(demands);

  console.log(`[DemandsService] Updated demand: ${id}`);
  return updatedDemand;
}

/**
 * Deletes a demand
 *
 * @param id - The demand ID to delete
 * @throws Error if demand not found
 *
 * @example
 * ```typescript
 * await deleteDemand('dem_123');
 * ```
 */
export async function deleteDemand(id: string): Promise<void> {
  const demands = getDemandsFromStorage();
  const filtered = demands.filter(d => d.id !== id);

  if (filtered.length === demands.length) {
    throw new Error(`Demand not found: ${id}`);
  }

  saveDemandsToStorage(filtered);
  console.log(`[DemandsService] Deleted demand: ${id}`);
}

/**
 * Gets all demands with optional filtering
 *
 * @param filters - Optional filters to apply
 * @returns Array of matching demands
 *
 * @example
 * ```typescript
 * // Get all new property search demands
 * const demands = await getDemands({
 *   type: 'property_search',
 *   status: 'new',
 * });
 *
 * // Search by name
 * const searchResults = await getDemands({
 *   search: 'John',
 * });
 * ```
 */
export async function getDemands(filters?: DemandFilters): Promise<Demand[]> {
  let demands = getDemandsFromStorage();

  if (!filters) return demands;

  // Apply filters
  if (filters.type) {
    demands = demands.filter(d => d.type === filters.type);
  }

  if (filters.status) {
    demands = demands.filter(d => d.status === filters.status);
  }

  if (filters.urgency) {
    demands = demands.filter(d => d.urgency === filters.urgency);
  }

  if (filters.source) {
    demands = demands.filter(d => d.source === filters.source);
  }

  if (filters.assignedTo) {
    demands = demands.filter(d => d.assignedTo === filters.assignedTo);
  }

  if (filters.search) {
    const search = normalizeString(filters.search);
    demands = demands.filter(d =>
      normalizeString(`${d.firstName} ${d.lastName}`).includes(search) ||
      normalizeString(d.email).includes(search) ||
      d.phone.includes(filters.search!)
    );
  }

  if (filters.createdFrom) {
    demands = demands.filter(d => d.createdAt >= filters.createdFrom!);
  }

  if (filters.createdTo) {
    demands = demands.filter(d => d.createdAt <= filters.createdTo!);
  }

  if (filters.hasMatches !== undefined) {
    demands = demands.filter(d =>
      filters.hasMatches ? d.matches.length > 0 : d.matches.length === 0
    );
  }

  if (filters.minMatchScore !== undefined) {
    demands = demands.filter(d =>
      d.bestMatchScore !== undefined && d.bestMatchScore >= filters.minMatchScore!
    );
  }

  return demands;
}

/**
 * Gets a single demand by ID
 *
 * @param id - The demand ID
 * @returns The demand or null if not found
 *
 * @example
 * ```typescript
 * const demand = await getDemandById('dem_123');
 * if (demand) {
 *   console.log(demand.firstName);
 * }
 * ```
 */
export async function getDemandById(id: string): Promise<Demand | null> {
  const demands = getDemandsFromStorage();
  return demands.find(d => d.id === id) || null;
}

/**
 * Gets demand statistics
 *
 * @returns Statistics about all demands
 */
export async function getDemandStats(): Promise<DemandStats> {
  const demands = getDemandsFromStorage();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - (now.getDay() * 24 * 60 * 60 * 1000);

  const allMatches = demands.flatMap(d => d.matches);

  const stats: DemandStats = {
    totalDemands: demands.length,
    newDemandsToday: demands.filter(d => d.createdAt.getTime() >= startOfToday).length,
    newDemandsWeek: demands.filter(d => d.createdAt.getTime() >= startOfWeek).length,
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
    totalMatches: allMatches.length,
    successfulMatches: allMatches.filter(m => m.status === 'successful').length,
    avgMatchScore: allMatches.length > 0
      ? Math.round(allMatches.reduce((sum, m) => sum + m.score, 0) / allMatches.length)
      : 0,
  };

  demands.forEach(d => {
    stats.demandsByType[d.type]++;
    stats.demandsByStatus[d.status]++;
  });

  return stats;
}

// ============================================================================
// MATCHING ENGINE
// ============================================================================

/**
 * Calculates the match score between a property and demand criteria
 *
 * Scoring breakdown (total 100 points):
 * - Location: 30 points (city + neighborhood)
 * - Budget: 25 points (within range, with tolerance)
 * - Property Type: 20 points (exact or partial match)
 * - Size: 15 points (area + bedrooms)
 * - Features: 10 points (amenities match)
 *
 * @param property - The property to score
 * @param criteria - The demand criteria
 * @returns The match score (0-100) and breakdown
 *
 * @example
 * ```typescript
 * const result = calculateMatchScore(property, {
 *   location: ['Marrakech'],
 *   budgetMin: 500000,
 *   budgetMax: 1000000,
 *   bedsMin: 2,
 * });
 * console.log(`Score: ${result.score}, Reasons: ${result.matchedCriteria}`);
 * ```
 */
export function calculateMatchScore(
  property: Property,
  criteria: DemandCriteria
): { score: number; matchedCriteria: string[]; details: MatchScoreBreakdown } {
  let totalScore = 0;
  const matchedCriteria: string[] = [];
  const criterionMatches: Record<string, boolean | 'partial'> = {};

  const details: MatchScoreBreakdown = {
    locationScore: 0,
    budgetScore: 0,
    typeScore: 0,
    sizeScore: 0,
    featuresScore: 0,
    criterionMatches,
  };

  // -------------------------------------------------------------------------
  // LOCATION SCORING (30 points)
  // -------------------------------------------------------------------------
  if (criteria.location && criteria.location.length > 0) {
    const propertyCity = normalizeString(property.city || '');
    const propertyLocation = normalizeString(property.location || '');

    // Check city match
    const cityMatch = criteria.location.some(loc =>
      fuzzyMatch(propertyCity, loc) || fuzzyMatch(propertyLocation, loc)
    );

    if (cityMatch) {
      details.locationScore = MATCH_WEIGHTS.location;
      matchedCriteria.push(`Ville: ${property.city}`);
      criterionMatches['location'] = true;
    } else if (criteria.neighborhoods && criteria.neighborhoods.length > 0) {
      // Check neighborhood match
      const neighborhoodMatch = criteria.neighborhoods.some(n =>
        fuzzyMatch(propertyLocation, n)
      );

      if (neighborhoodMatch) {
        details.locationScore = MATCH_WEIGHTS.location * 0.7; // 70% for neighborhood only
        matchedCriteria.push(`Quartier: ${property.location}`);
        criterionMatches['location'] = 'partial';
      }
    }
  } else {
    // No location preference - give partial score
    details.locationScore = MATCH_WEIGHTS.location * 0.5;
    criterionMatches['location'] = 'partial';
  }
  totalScore += details.locationScore;

  // -------------------------------------------------------------------------
  // BUDGET SCORING (25 points)
  // -------------------------------------------------------------------------
  const propertyPrice = property.priceNumeric;
  const budgetMin = criteria.budgetMin || 0;
  const budgetMax = criteria.budgetMax || Infinity;

  if (propertyPrice) {
    if (propertyPrice >= budgetMin && propertyPrice <= budgetMax) {
      // Exact match
      details.budgetScore = MATCH_WEIGHTS.budget;
      matchedCriteria.push(`Prix: ${propertyPrice.toLocaleString()} MAD (dans le budget)`);
      criterionMatches['budget'] = true;
    } else if (propertyPrice >= budgetMin * 0.9 && propertyPrice <= budgetMax * 1.1) {
      // Within 10% tolerance
      details.budgetScore = MATCH_WEIGHTS.budget * 0.7;
      matchedCriteria.push(`Prix: ${propertyPrice.toLocaleString()} MAD (proche du budget)`);
      criterionMatches['budget'] = 'partial';
    } else if (propertyPrice >= budgetMin * 0.8 && propertyPrice <= budgetMax * 1.2) {
      // Within 20% tolerance
      details.budgetScore = MATCH_WEIGHTS.budget * 0.4;
      criterionMatches['budget'] = 'partial';
    } else {
      criterionMatches['budget'] = false;
    }
  } else if (!criteria.budgetMin && !criteria.budgetMax) {
    // No budget preference
    details.budgetScore = MATCH_WEIGHTS.budget * 0.5;
    criterionMatches['budget'] = 'partial';
  }
  totalScore += details.budgetScore;

  // -------------------------------------------------------------------------
  // PROPERTY TYPE SCORING (20 points)
  // -------------------------------------------------------------------------
  if (criteria.propertyType && criteria.propertyType.length > 0) {
    const propertyTypeLower = normalizeString(property.type || '');

    const typeMatch = criteria.propertyType.some(t =>
      fuzzyMatch(propertyTypeLower, t)
    );

    if (typeMatch) {
      details.typeScore = MATCH_WEIGHTS.type;
      matchedCriteria.push(`Type: ${property.type}`);
      criterionMatches['type'] = true;
    } else {
      criterionMatches['type'] = false;
    }
  } else {
    // No type preference
    details.typeScore = MATCH_WEIGHTS.type * 0.5;
    criterionMatches['type'] = 'partial';
  }
  totalScore += details.typeScore;

  // -------------------------------------------------------------------------
  // SIZE SCORING (15 points)
  // - Bedrooms: 10 points
  // - Area: 5 points
  // -------------------------------------------------------------------------
  let sizeScore = 0;

  // Bedrooms
  if (criteria.bedsMin !== undefined && property.beds !== null) {
    if (property.beds >= criteria.bedsMin) {
      if (!criteria.bedsMax || property.beds <= criteria.bedsMax) {
        sizeScore += 10;
        matchedCriteria.push(`${property.beds} chambres`);
        criterionMatches['bedrooms'] = true;
      } else {
        sizeScore += 5; // Over max but meets min
        criterionMatches['bedrooms'] = 'partial';
      }
    } else if (property.beds >= criteria.bedsMin - 1) {
      sizeScore += 3; // Close to minimum
      criterionMatches['bedrooms'] = 'partial';
    } else {
      criterionMatches['bedrooms'] = false;
    }
  } else {
    sizeScore += 5; // No preference
    criterionMatches['bedrooms'] = 'partial';
  }

  // Area
  const propertyArea = property.areaNumeric || 0;
  if (criteria.areaMin !== undefined && propertyArea > 0) {
    if (propertyArea >= criteria.areaMin) {
      if (!criteria.areaMax || propertyArea <= criteria.areaMax) {
        sizeScore += 5;
        matchedCriteria.push(`Surface: ${propertyArea}m2`);
        criterionMatches['area'] = true;
      } else {
        sizeScore += 2.5;
        criterionMatches['area'] = 'partial';
      }
    } else if (propertyArea >= criteria.areaMin * 0.9) {
      sizeScore += 2;
      criterionMatches['area'] = 'partial';
    } else {
      criterionMatches['area'] = false;
    }
  } else {
    sizeScore += 2.5;
    criterionMatches['area'] = 'partial';
  }

  details.sizeScore = sizeScore;
  totalScore += sizeScore;

  // -------------------------------------------------------------------------
  // FEATURES SCORING (10 points)
  // -------------------------------------------------------------------------
  if (criteria.features && criteria.features.length > 0 && property.features) {
    const propertyFeatures = property.features.map(f => normalizeString(f));

    const matchedFeatures = criteria.features.filter(f =>
      propertyFeatures.some(pf => fuzzyMatch(pf, f))
    );

    const featureRatio = matchedFeatures.length / criteria.features.length;
    details.featuresScore = MATCH_WEIGHTS.features * featureRatio;

    if (matchedFeatures.length > 0) {
      matchedCriteria.push(`Equipements: ${matchedFeatures.join(', ')}`);
      criterionMatches['features'] = featureRatio >= 0.5 ? true : 'partial';
    } else {
      criterionMatches['features'] = false;
    }
  } else {
    details.featuresScore = MATCH_WEIGHTS.features * 0.5;
    criterionMatches['features'] = 'partial';
  }
  totalScore += details.featuresScore;

  // Normalize to 0-100
  const normalizedScore = Math.min(100, Math.round(totalScore));

  return {
    score: normalizedScore,
    matchedCriteria,
    details,
  };
}

/**
 * Finds matching properties for given criteria
 *
 * Uses both local cached properties and optionally the RAG service
 * for semantic search. Returns top matches sorted by score.
 *
 * @param criteria - The search criteria
 * @param options - Search options
 * @returns Array of property matches
 *
 * @example
 * ```typescript
 * const matches = await findMatchingProperties({
 *   location: ['Casablanca'],
 *   budgetMax: 2000000,
 *   propertyType: ['apartment'],
 * });
 * console.log(`Found ${matches.length} matches`);
 * ```
 */
export async function findMatchingProperties(
  criteria: DemandCriteria,
  options: {
    /** Use RAG semantic search */
    useRAG?: boolean;
    /** Maximum results to return */
    maxResults?: number;
    /** Minimum score threshold */
    minScore?: number;
  } = {}
): Promise<PropertyMatch[]> {
  const { useRAG = true, maxResults = MAX_MATCHES, minScore = MATCH_THRESHOLD } = options;
  const matches: PropertyMatch[] = [];

  // Get cached properties
  let properties = getCachedProperties();

  // Try RAG search for enhanced results
  if (useRAG && criteria.location && criteria.location.length > 0) {
    try {
      const isAvailable = await ragSearchClient.isServiceAvailable();

      if (isAvailable) {
        // Build search query from criteria
        const queryParts: string[] = [];
        if (criteria.propertyType?.length) {
          queryParts.push(criteria.propertyType.join(' ou '));
        }
        if (criteria.location?.length) {
          queryParts.push(`a ${criteria.location.join(' ou ')}`);
        }
        if (criteria.bedsMin) {
          queryParts.push(`${criteria.bedsMin}+ chambres`);
        }
        if (criteria.budgetMax) {
          queryParts.push(`moins de ${criteria.budgetMax.toLocaleString()} MAD`);
        }

        const query = queryParts.join(' ');

        const ragResponse = await ragSearchClient.search(query, {
          topK: 50,
          mode: 'hybrid',
          filters: {
            category: criteria.transactionType,
          },
        });

        if (ragResponse.success && ragResponse.results.length > 0) {
          // Merge RAG results with cached properties
          const ragIds = new Set(ragResponse.results.map(r => r.id));
          const cachedIds = new Set(properties.map(p => p.id));

          // Add RAG results that aren't in cache
          for (const result of ragResponse.results) {
            if (!cachedIds.has(result.id)) {
              properties.push(result as Property);
            }
          }

          console.log(`[DemandsService] RAG search added ${ragResponse.results.length - cachedIds.size} properties`);
        }
      }
    } catch (error) {
      console.warn('[DemandsService] RAG search failed, using cached properties only:', error);
    }
  }

  // Filter by transaction type if specified
  if (criteria.transactionType) {
    properties = properties.filter(p => p.category === criteria.transactionType);
  }

  // Score each property
  for (const property of properties) {
    const { score, matchedCriteria, details } = calculateMatchScore(property, criteria);

    if (score >= minScore) {
      matches.push({
        id: generateMatchId(),
        propertyId: property.id,
        score,
        matchedCriteria,
        matchDetails: details,
        status: 'pending',
        createdAt: new Date(),
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Return top results
  return matches.slice(0, maxResults);
}

/**
 * Runs the matching engine for a specific demand
 *
 * Finds matching properties, updates the demand with matches,
 * and optionally updates the demand status.
 *
 * @param demandId - The demand ID to match
 * @param options - Matching options
 * @returns Array of new matches found
 *
 * @example
 * ```typescript
 * const matches = await runMatchingForDemand('dem_123');
 * console.log(`Found ${matches.length} new matches`);
 * ```
 */
export async function runMatchingForDemand(
  demandId: string,
  options: {
    /** Update demand status to 'matched' if matches found */
    updateStatus?: boolean;
    /** Force re-match even if recently checked */
    force?: boolean;
  } = {}
): Promise<PropertyMatch[]> {
  const { updateStatus = true, force = false } = options;

  const demand = await getDemandById(demandId);
  if (!demand) {
    throw new Error(`Demand not found: ${demandId}`);
  }

  // Only match property search demands
  if (demand.type !== 'property_search') {
    console.log(`[DemandsService] Skipping match for non-search demand: ${demandId}`);
    return [];
  }

  if (!demand.criteria) {
    console.log(`[DemandsService] No criteria for demand: ${demandId}`);
    return [];
  }

  // Check if recently matched (within 5 minutes)
  if (!force && demand.lastMatchCheck) {
    const timeSinceLastCheck = Date.now() - demand.lastMatchCheck.getTime();
    if (timeSinceLastCheck < 5 * 60 * 1000) {
      console.log(`[DemandsService] Demand ${demandId} recently matched, skipping`);
      return demand.matches;
    }
  }

  console.log(`[DemandsService] Running matching for demand: ${demandId}`);

  // Find matches
  const newMatches = await findMatchingProperties(demand.criteria);

  // Filter out existing matches
  const existingPropertyIds = new Set(demand.matches.map(m => m.propertyId));
  const uniqueNewMatches = newMatches.filter(m => !existingPropertyIds.has(m.propertyId));

  // Update demand
  const allMatches = [...demand.matches, ...uniqueNewMatches];
  const bestScore = allMatches.length > 0
    ? Math.max(...allMatches.map(m => m.score))
    : undefined;

  const updates: Partial<Demand> = {
    matches: allMatches,
    matchedPropertyIds: allMatches.map(m => m.propertyId),
    bestMatchScore: bestScore,
    lastMatchCheck: new Date(),
  };

  // Update status if requested and matches found
  if (updateStatus && uniqueNewMatches.length > 0 && demand.status === 'new') {
    updates.status = 'matched';
    updates.activities = [
      ...(demand.activities || []),
      {
        id: generateId(),
        type: 'match_found',
        title: 'Correspondances trouvees',
        description: `${uniqueNewMatches.length} nouvelle(s) correspondance(s) trouvee(s)`,
        timestamp: new Date(),
      },
    ];
  }

  await updateDemand(demandId, updates);

  console.log(`[DemandsService] Found ${uniqueNewMatches.length} new matches for demand: ${demandId}`);
  return uniqueNewMatches;
}

/**
 * Runs matching for all active demands
 *
 * Processes all demands with status 'new' or 'processing'
 *
 * @returns Summary of matching results
 */
export async function runMatchingForAllDemands(): Promise<{
  processed: number;
  totalNewMatches: number;
  errors: number;
}> {
  const activeDemands = await getDemands({
    status: 'new',
  });
  const processingDemands = await getDemands({
    status: 'processing',
  });

  const allDemands = [...activeDemands, ...processingDemands];

  let processed = 0;
  let totalNewMatches = 0;
  let errors = 0;

  for (const demand of allDemands) {
    try {
      const matches = await runMatchingForDemand(demand.id, { force: false });
      totalNewMatches += matches.length;
      processed++;
    } catch (error) {
      console.error(`[DemandsService] Failed to match demand ${demand.id}:`, error);
      errors++;
    }
  }

  console.log(`[DemandsService] Batch matching complete: ${processed} processed, ${totalNewMatches} new matches, ${errors} errors`);

  return { processed, totalNewMatches, errors };
}

// ============================================================================
// MATCH MANAGEMENT
// ============================================================================

/**
 * Updates the status of a match
 *
 * @param demandId - The demand ID
 * @param matchId - The match ID
 * @param status - New status
 * @returns Updated demand
 */
export async function updateMatchStatus(
  demandId: string,
  matchId: string,
  status: PropertyMatch['status']
): Promise<Demand> {
  const demand = await getDemandById(demandId);
  if (!demand) {
    throw new Error(`Demand not found: ${demandId}`);
  }

  const matchIndex = demand.matches.findIndex(m => m.id === matchId);
  if (matchIndex === -1) {
    throw new Error(`Match not found: ${matchId}`);
  }

  const now = new Date();
  const updatedMatch = {
    ...demand.matches[matchIndex],
    status,
    ...(status === 'notified' ? { notifiedAt: now } : {}),
    ...(status === 'contacted' ? { contactedAt: now } : {}),
  };

  const updatedMatches = [...demand.matches];
  updatedMatches[matchIndex] = updatedMatch;

  return updateDemand(demandId, { matches: updatedMatches });
}

/**
 * Gets matches for a specific demand with optional property data
 *
 * @param demandId - The demand ID
 * @param includeProperties - Whether to include full property data
 * @returns Array of matches with optional property data
 */
export async function getMatchesForDemand(
  demandId: string,
  includeProperties: boolean = false
): Promise<Array<PropertyMatch & { property?: Property }>> {
  const demand = await getDemandById(demandId);
  if (!demand) {
    throw new Error(`Demand not found: ${demandId}`);
  }

  if (!includeProperties) {
    return demand.matches;
  }

  // Get properties for matches
  const properties = getCachedProperties();
  const propertyMap = new Map(properties.map(p => [p.id, p]));

  return demand.matches.map(match => ({
    ...match,
    property: propertyMap.get(match.propertyId),
  }));
}

// ============================================================================
// SELLER-BUYER MATCHING
// ============================================================================

/**
 * Matches a seller demand with potential buyer demands
 *
 * For property_sale and property_rental_management demands,
 * finds property_search demands that match the property details.
 *
 * @param demandId - The seller demand ID
 * @returns Array of matching buyer demands
 */
export async function matchSellerWithBuyers(demandId: string): Promise<{
  demandId: string;
  buyerDemandId: string;
  score: number;
  matchedCriteria: string[];
}[]> {
  const sellerDemand = await getDemandById(demandId);
  if (!sellerDemand) {
    throw new Error(`Demand not found: ${demandId}`);
  }

  if (sellerDemand.type === 'property_search') {
    throw new Error('Cannot match buyer demand with buyers');
  }

  const propertyDetails = sellerDemand.propertyDetails;
  if (!propertyDetails) {
    return [];
  }

  // Get all active property search demands
  const searchDemands = await getDemands({ type: 'property_search', status: 'new' });
  const processingDemands = await getDemands({ type: 'property_search', status: 'processing' });
  const allSearchDemands = [...searchDemands, ...processingDemands];

  const matches: {
    demandId: string;
    buyerDemandId: string;
    score: number;
    matchedCriteria: string[];
  }[] = [];

  // Create a pseudo-property from seller's details
  const pseudoProperty: Property = {
    id: sellerDemand.id,
    category: propertyDetails.transactionType === 'MANAGEMENT' ? 'RENT' : propertyDetails.transactionType as 'RENT' | 'SALE',
    type: propertyDetails.propertyType,
    location: propertyDetails.neighborhood || '',
    city: propertyDetails.city,
    name: propertyDetails.title || '',
    description: propertyDetails.description || '',
    price: propertyDetails.price?.toString() || '',
    priceNumeric: propertyDetails.price || 0,
    beds: propertyDetails.bedrooms || null,
    baths: propertyDetails.bathrooms || null,
    area: propertyDetails.surface?.toString() || null,
    areaNumeric: propertyDetails.surface || null,
    image: propertyDetails.images?.[0] || '',
    images: propertyDetails.images || [],
    features: propertyDetails.amenities || [],
    smartTags: [],
    url: '',
    datePublished: null,
    dateScraped: new Date().toISOString(),
  };

  // Score each buyer demand
  for (const buyerDemand of allSearchDemands) {
    if (!buyerDemand.criteria) continue;

    const { score, matchedCriteria } = calculateMatchScore(pseudoProperty, buyerDemand.criteria);

    if (score >= MATCH_THRESHOLD) {
      matches.push({
        demandId: sellerDemand.id,
        buyerDemandId: buyerDemand.id,
        score,
        matchedCriteria,
      });
    }
  }

  // Sort by score
  matches.sort((a, b) => b.score - a.score);

  return matches.slice(0, MAX_MATCHES);
}

// ============================================================================
// NOTE MANAGEMENT
// ============================================================================

/**
 * Adds a note to a demand
 *
 * @param demandId - The demand ID
 * @param content - Note content
 * @param author - Note author
 * @returns Updated demand
 */
export async function addNoteToDemand(
  demandId: string,
  content: string,
  author: string
): Promise<Demand> {
  const demand = await getDemandById(demandId);
  if (!demand) {
    throw new Error(`Demand not found: ${demandId}`);
  }

  const now = new Date();
  const note: DemandNote = {
    id: generateId(),
    content,
    author,
    createdAt: now,
  };

  return updateDemand(demandId, {
    notes: [...(demand.notes || []), note],
    activities: [
      ...(demand.activities || []),
      {
        id: generateId(),
        type: 'note_added',
        title: 'Note ajoutee',
        description: `Par ${author}`,
        timestamp: now,
      },
    ],
  });
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Deletes multiple demands
 *
 * @param ids - Array of demand IDs to delete
 * @returns Number of demands deleted
 */
export async function bulkDeleteDemands(ids: string[]): Promise<number> {
  let deleted = 0;
  for (const id of ids) {
    try {
      await deleteDemand(id);
      deleted++;
    } catch {
      // Continue on error
    }
  }
  return deleted;
}

/**
 * Updates status for multiple demands
 *
 * @param ids - Array of demand IDs
 * @param status - New status
 * @returns Number of demands updated
 */
export async function bulkUpdateStatus(ids: string[], status: DemandStatus): Promise<number> {
  let updated = 0;
  for (const id of ids) {
    try {
      await updateDemand(id, { status });
      updated++;
    } catch {
      // Continue on error
    }
  }
  return updated;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the demands service
 *
 * Sets up storage and runs initial matching
 */
export async function initializeDemandsService(): Promise<void> {
  console.log('[DemandsService] Initializing...');

  // Ensure storage exists
  if (!localStorage.getItem(STORAGE_KEYS.DEMANDS)) {
    localStorage.setItem(STORAGE_KEYS.DEMANDS, '[]');
  }

  // Run matching for all active demands
  try {
    await runMatchingForAllDemands();
  } catch (error) {
    console.error('[DemandsService] Initial matching failed:', error);
  }

  console.log('[DemandsService] Initialized');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // CRUD
  createDemand,
  updateDemand,
  deleteDemand,
  getDemands,
  getDemandById,
  getDemandStats,

  // Matching
  calculateMatchScore,
  findMatchingProperties,
  runMatchingForDemand,
  runMatchingForAllDemands,
  matchSellerWithBuyers,

  // Match Management
  updateMatchStatus,
  getMatchesForDemand,

  // Notes
  addNoteToDemand,

  // Bulk Operations
  bulkDeleteDemands,
  bulkUpdateStatus,

  // Initialization
  initializeDemandsService,
};
