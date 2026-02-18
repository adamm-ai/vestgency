/**
 * Services Index
 * ==============
 *
 * Central export point for all services.
 * Allows gradual migration from localStorage-based crmService
 * to backend-first crmApiService.
 *
 * MIGRATION GUIDE:
 * ----------------
 * Phase 1 (Current): Both services available
 *   - crmService: localStorage-first (legacy)
 *   - crmApiService: Backend-first (new)
 *
 * Phase 2: Gradual migration
 *   - Replace crmService imports with crmApiService
 *   - Test each component individually
 *
 * Phase 3: Complete migration
 *   - Remove crmService
 *   - Use crmApiService exclusively
 */

// Legacy localStorage-first service (will be deprecated)
export * from './crmService';

// New backend-first service
export * as CRMApi from './crmApiService';

// API service (backend communication)
export * from './api';

// Demands service (complete matching engine)
export * from './demandsService';
export { default as demandsService } from './demandsService';

// Default export: new backend-first service
export { default as crmApiService } from './crmApiService';
