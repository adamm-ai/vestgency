/**
 * Validation Service
 * ==================
 * Point d'entree pour tous les utilitaires de validation et sanitization
 *
 * IMPORTANT: Zod doit etre installe dans le projet
 * npm install zod
 *
 * Usage:
 * ```typescript
 * import {
 *   leadCreateSchema,
 *   sanitizeInput,
 *   sanitizeEmail,
 *   sanitizePhone
 * } from '@/services/validation';
 *
 * // Valider un formulaire de lead
 * const result = sanitizeInput(formData, leadCreateSchema);
 * if (result.success) {
 *   await createLead(result.data);
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */

// ============================================================================
// SCHEMAS - Validation Zod
// ============================================================================

export {
  // Common schemas
  emailSchema,
  phoneSchema,
  phoneSchemaOptional,
  urlSchema,
  uuidSchema,
  dateStringSchema,
  priceSchema,
  surfaceSchema,

  // Enums
  leadStatusEnum,
  leadUrgencyEnum,
  leadSourceEnum,
  propertyCategoryEnum,
  propertyTypeEnum,
  demandTypeEnum,
  demandStatusEnum,
  demandUrgencyEnum,
  demandSourceEnum,
  userRoleEnum,
  taskPriorityEnum,

  // Lead schemas
  leadCreateSchema,
  leadUpdateSchema,

  // User schemas
  userCreateSchema,
  userUpdateSchema,
  userLoginSchema,
  passwordChangeSchema,

  // Property schemas
  propertySchema,
  propertyCreateSchema,
  propertyUpdateSchema,

  // Demand schemas
  searchCriteriaSchema,
  propertyDetailsSchema,
  demandCreateSchema,
  demandUpdateSchema,

  // Task & Note schemas
  taskCreateSchema,
  taskUpdateSchema,
  noteCreateSchema,

  // Form schemas
  contactFormSchema,

  // Settings schemas
  profileSettingsSchema,
  notificationSettingsSchema,
  crmSettingsSchema,
} from './schemas';

// Type exports
export type {
  LeadCreateInput,
  LeadUpdateInput,
  UserCreateInput,
  UserUpdateInput,
  UserLoginInput,
  PasswordChangeInput,
  PropertyInput,
  PropertyCreateInput,
  PropertyUpdateInput,
  DemandCreateInput,
  DemandUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
  NoteCreateInput,
  ContactFormInput,
  ProfileSettingsInput,
  NotificationSettingsInput,
  CRMSettingsInput,
} from './schemas';

// ============================================================================
// SANITIZATION - Nettoyage des entrees
// ============================================================================

export {
  // HTML sanitization
  sanitizeHtml,
  sanitizeRichText,

  // Email sanitization
  sanitizeEmail,
  validateEmail,

  // Phone sanitization
  sanitizePhone,
  formatPhoneDisplay,
  validatePhone,

  // Generic sanitization
  sanitizeText,
  sanitizeObject,

  // Zod integration
  sanitizeInput,
  sanitizeInputAsync,
  validateOrThrow,

  // URL sanitization
  sanitizeUrl,

  // Numeric sanitization
  sanitizeNumber,
  sanitizePrice,

  // Date sanitization
  sanitizeDate,

  // Array sanitization
  sanitizeStringArray,
} from './sanitize';

// Type exports
export type {
  SanitizeResult,
  SanitizeError,
  SanitizeResponse,
  ValidationError,
} from './sanitize';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

import { ZodSchema } from 'zod';
import { sanitizeInput, type SanitizeResponse } from './sanitize';

/**
 * Cree un validateur reutilisable pour un schema specifique
 * @param schema - Schema Zod a utiliser
 * @returns Fonction de validation typee
 *
 * @example
 * const validateLead = createValidator(leadCreateSchema);
 * const result = validateLead(formData);
 */
export function createValidator<T>(schema: ZodSchema<T>) {
  return (input: unknown): SanitizeResponse<T> => {
    return sanitizeInput(input, schema);
  };
}

/**
 * Valide plusieurs champs individuellement et retourne les erreurs
 * Utile pour la validation en temps reel des formulaires
 */
export function validateFields<T extends Record<string, unknown>>(
  data: T,
  schema: ZodSchema<T>
): Record<keyof T, string | null> {
  const result = sanitizeInput(data, schema);
  const errors: Record<string, string | null> = {};

  // Initialiser tous les champs a null (pas d'erreur)
  for (const key of Object.keys(data)) {
    errors[key] = null;
  }

  // Remplir les erreurs si la validation a echoue
  if (result.success === false) {
    for (const error of result.errors) {
      if (error.field && error.field !== '_root') {
        errors[error.field] = error.message;
      }
    }
  }

  return errors as Record<keyof T, string | null>;
}

/**
 * Extrait le premier message d'erreur d'un resultat de validation
 */
export function getFirstError(result: SanitizeResponse<unknown>): string | null {
  if (result.success === true) {
    return null;
  }
  return result.errors[0]?.message || 'Erreur de validation';
}

/**
 * Convertit les erreurs de validation en objet pour les formulaires React
 */
export function errorsToFormState(
  result: SanitizeResponse<unknown>
): Record<string, string> {
  if (result.success === true) {
    return {};
  }

  const formErrors: Record<string, string> = {};

  for (const error of result.errors) {
    const field = error.field || '_form';
    if (!formErrors[field]) {
      formErrors[field] = error.message;
    }
  }

  return formErrors;
}
