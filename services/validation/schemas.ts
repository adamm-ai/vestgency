/**
 * Zod Validation Schemas
 * =======================
 * Schemas de validation pour toutes les entites du CRM immobilier
 *
 * NOTE: Zod doit etre installe: npm install zod
 */

import { z } from 'zod';

// ============================================================================
// REGEX PATTERNS
// ============================================================================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_INTL_REGEX = /^\+?[1-9]\d{6,14}$/; // Format international
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const emailSchema = z
  .string({ required_error: 'L\'email est requis' })
  .min(1, 'L\'email est requis')
  .email('Format d\'email invalide')
  .regex(EMAIL_REGEX, 'Format d\'email invalide')
  .max(255, 'L\'email ne peut pas depasser 255 caracteres')
  .transform((email) => email.toLowerCase().trim());

export const phoneSchema = z
  .string({ required_error: 'Le telephone est requis' })
  .min(1, 'Le telephone est requis')
  .regex(PHONE_INTL_REGEX, 'Format de telephone invalide (ex: +212600000000)')
  .max(20, 'Le telephone ne peut pas depasser 20 caracteres');

export const phoneSchemaOptional = z
  .string()
  .regex(PHONE_INTL_REGEX, 'Format de telephone invalide')
  .max(20, 'Le telephone ne peut pas depasser 20 caracteres')
  .optional()
  .or(z.literal(''));

export const urlSchema = z
  .string()
  .regex(URL_REGEX, 'Format d\'URL invalide')
  .max(2048, 'L\'URL ne peut pas depasser 2048 caracteres')
  .optional();

export const uuidSchema = z
  .string()
  .regex(UUID_REGEX, 'Format d\'identifiant invalide');

export const dateStringSchema = z
  .string()
  .refine(
    (val) => !isNaN(Date.parse(val)),
    'Format de date invalide (ISO 8601 requis)'
  );

export const priceSchema = z
  .number({ required_error: 'Le prix est requis' })
  .min(0, 'Le prix ne peut pas etre negatif')
  .max(1_000_000_000, 'Le prix est trop eleve');

export const surfaceSchema = z
  .number()
  .min(0, 'La surface ne peut pas etre negative')
  .max(100_000, 'La surface est trop elevee');

// ============================================================================
// ENUMS
// ============================================================================

export const leadStatusEnum = z.enum([
  'new',
  'contacted',
  'qualified',
  'visit_scheduled',
  'visit_completed',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
  'nurturing'
], {
  errorMap: () => ({ message: 'Statut de lead invalide' })
});

export const leadUrgencyEnum = z.enum(['low', 'medium', 'high', 'critical'], {
  errorMap: () => ({ message: 'Niveau d\'urgence invalide' })
});

export const leadSourceEnum = z.enum([
  'chatbot',
  'website_form',
  'phone',
  'email',
  'walk_in',
  'referral',
  'social_media',
  'other'
], {
  errorMap: () => ({ message: 'Source de lead invalide' })
});

export const propertyCategoryEnum = z.enum(['RENT', 'SALE'], {
  errorMap: () => ({ message: 'Categorie de bien invalide (RENT ou SALE)' })
});

export const propertyTypeEnum = z.enum([
  'villa',
  'apartment',
  'riad',
  'land',
  'commercial',
  'penthouse',
  'duplex',
  'studio',
  'other'
], {
  errorMap: () => ({ message: 'Type de bien invalide' })
});

export const demandTypeEnum = z.enum([
  'property_search',
  'property_sale',
  'property_rental_management'
], {
  errorMap: () => ({ message: 'Type de demande invalide' })
});

export const demandStatusEnum = z.enum([
  'new',
  'processing',
  'matched',
  'contacted',
  'completed',
  'cancelled'
], {
  errorMap: () => ({ message: 'Statut de demande invalide' })
});

export const demandUrgencyEnum = z.enum(['low', 'medium', 'high', 'urgent'], {
  errorMap: () => ({ message: 'Niveau d\'urgence invalide' })
});

export const demandSourceEnum = z.enum([
  'chatbot',
  'website_form',
  'phone',
  'email',
  'walk_in',
  'referral',
  'manual'
], {
  errorMap: () => ({ message: 'Source de demande invalide' })
});

export const userRoleEnum = z.enum(['admin', 'agent'], {
  errorMap: () => ({ message: 'Role utilisateur invalide' })
});

export const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'], {
  errorMap: () => ({ message: 'Priorite de tache invalide' })
});

// ============================================================================
// LEAD SCHEMAS
// ============================================================================

// Schema de base sans refinements (pour permettre .partial())
const leadBaseSchema = z.object({
  firstName: z
    .string({ required_error: 'Le prenom est requis' })
    .min(1, 'Le prenom est requis')
    .max(100, 'Le prenom ne peut pas depasser 100 caracteres')
    .transform((val) => val.trim()),

  lastName: z
    .string({ required_error: 'Le nom est requis' })
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas depasser 100 caracteres')
    .transform((val) => val.trim()),

  email: emailSchema,
  phone: phoneSchema,
  whatsapp: phoneSchemaOptional,
  city: z
    .string()
    .max(100, 'La ville ne peut pas depasser 100 caracteres')
    .optional()
    .transform((val) => val?.trim()),

  // Lead qualification
  status: leadStatusEnum.default('new'),
  urgency: leadUrgencyEnum.default('medium'),
  score: z
    .number()
    .min(0, 'Le score doit etre entre 0 et 100')
    .max(100, 'Le score doit etre entre 0 et 100')
    .default(50),
  source: leadSourceEnum.default('website_form'),

  // Interest
  propertyInterest: z.array(z.string()).optional(),
  transactionType: propertyCategoryEnum.optional(),
  budgetMin: priceSchema.optional(),
  budgetMax: priceSchema.optional(),
  preferredLocations: z.array(z.string().max(100)).optional(),
  bedroomsMin: z.number().int().min(0).max(20).optional(),
  surfaceMin: surfaceSchema.optional(),

  // Assignment
  assignedTo: z.string().optional(),

  // Chat data
  chatSessionId: z.string().optional(),
  totalTimeOnChat: z.number().min(0).optional(),

  // UTM tracking
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  landingPage: urlSchema,
  referrer: z.string().max(500).optional(),

  // Deal tracking
  estimatedValue: priceSchema.optional(),
});

// Schema de creation avec validation du budget
export const leadCreateSchema = leadBaseSchema.superRefine((data, ctx) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    if (data.budgetMin > data.budgetMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le budget minimum ne peut pas etre superieur au budget maximum',
        path: ['budgetMin']
      });
    }
  }
});

// Schema de mise a jour (tous les champs optionnels sauf id)
export const leadUpdateSchema = leadBaseSchema.partial().extend({
  id: z.string({ required_error: 'L\'identifiant du lead est requis' }),
  lostReason: z
    .string()
    .max(500, 'La raison ne peut pas depasser 500 caracteres')
    .optional(),
  actualValue: priceSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    if (data.budgetMin > data.budgetMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le budget minimum ne peut pas etre superieur au budget maximum',
        path: ['budgetMin']
      });
    }
  }
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

const userBaseSchema = z.object({
  email: emailSchema,
  firstName: z
    .string({ required_error: 'Le prenom est requis' })
    .min(1, 'Le prenom est requis')
    .max(100, 'Le prenom ne peut pas depasser 100 caracteres')
    .transform((val) => val.trim()),

  lastName: z
    .string({ required_error: 'Le nom est requis' })
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas depasser 100 caracteres')
    .transform((val) => val.trim()),

  phone: phoneSchemaOptional,
  role: userRoleEnum.default('agent'),
  avatar: urlSchema,
  maxLeads: z
    .number()
    .int('Le nombre de leads doit etre un entier')
    .min(0, 'Le nombre de leads ne peut pas etre negatif')
    .max(1000, 'Le nombre de leads ne peut pas depasser 1000')
    .default(50),
  specializations: z.array(leadSourceEnum).optional(),
  isActive: z.boolean().default(true),
});

export const userCreateSchema = userBaseSchema;

export const userUpdateSchema = userBaseSchema.partial().extend({
  id: z.string({ required_error: 'L\'identifiant de l\'utilisateur est requis' }),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'Le mot de passe est requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caracteres')
    .max(128, 'Le mot de passe ne peut pas depasser 128 caracteres'),
  rememberMe: z.boolean().default(false),
});

export const passwordChangeSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Le mot de passe actuel est requis' })
    .min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string({ required_error: 'Le nouveau mot de passe est requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caracteres')
    .max(128, 'Le mot de passe ne peut pas depasser 128 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    ),
  confirmPassword: z.string({ required_error: 'La confirmation est requise' }),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Les mots de passe ne correspondent pas',
      path: ['confirmPassword']
    });
  }
  if (data.currentPassword === data.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Le nouveau mot de passe doit etre different de l\'ancien',
      path: ['newPassword']
    });
  }
});

// ============================================================================
// PROPERTY SCHEMAS
// ============================================================================

export const propertySchema = z.object({
  id: z.string().optional(),
  category: propertyCategoryEnum,
  type: z
    .string({ required_error: 'Le type de bien est requis' })
    .min(1, 'Le type de bien est requis')
    .max(50, 'Le type ne peut pas depasser 50 caracteres'),

  name: z
    .string({ required_error: 'Le nom du bien est requis' })
    .min(1, 'Le nom du bien est requis')
    .max(200, 'Le nom ne peut pas depasser 200 caracteres')
    .transform((val) => val.trim()),

  description: z
    .string()
    .max(5000, 'La description ne peut pas depasser 5000 caracteres')
    .optional()
    .transform((val) => val?.trim()),

  location: z
    .string({ required_error: 'L\'emplacement est requis' })
    .min(1, 'L\'emplacement est requis')
    .max(200, 'L\'emplacement ne peut pas depasser 200 caracteres'),

  city: z
    .string({ required_error: 'La ville est requise' })
    .min(1, 'La ville est requise')
    .max(100, 'La ville ne peut pas depasser 100 caracteres'),

  price: z.string().optional(),
  priceNumeric: priceSchema,

  beds: z
    .number()
    .int('Le nombre de chambres doit etre un entier')
    .min(0, 'Le nombre de chambres ne peut pas etre negatif')
    .max(100, 'Le nombre de chambres est trop eleve')
    .nullable()
    .optional(),

  baths: z
    .number()
    .int('Le nombre de salles de bain doit etre un entier')
    .min(0, 'Le nombre de salles de bain ne peut pas etre negatif')
    .max(50, 'Le nombre de salles de bain est trop eleve')
    .nullable()
    .optional(),

  area: z.string().nullable().optional(),
  areaNumeric: surfaceSchema.nullable().optional(),

  image: urlSchema.or(z.string().max(500)),
  images: z.array(z.string().max(500)).optional(),
  features: z.array(z.string().max(100)).optional(),
  smartTags: z.array(z.string().max(50)).optional(),

  url: z.string().max(2048).optional(),
  datePublished: dateStringSchema.nullable().optional(),
});

export const propertyCreateSchema = propertySchema.omit({ id: true });

export const propertyUpdateSchema = propertySchema.partial().extend({
  id: z.string({ required_error: 'L\'identifiant du bien est requis' }),
});

// ============================================================================
// DEMAND SCHEMAS
// ============================================================================

export const searchCriteriaSchema = z.object({
  propertyType: z.array(propertyTypeEnum).optional(),
  transactionType: propertyCategoryEnum,
  budgetMin: priceSchema.optional(),
  budgetMax: priceSchema.optional(),
  cities: z.array(z.string().max(100)).optional(),
  neighborhoods: z.array(z.string().max(100)).optional(),
  bedroomsMin: z.number().int().min(0).max(20).optional(),
  bedroomsMax: z.number().int().min(0).max(20).optional(),
  bathroomsMin: z.number().int().min(0).max(20).optional(),
  surfaceMin: surfaceSchema.optional(),
  surfaceMax: surfaceSchema.optional(),
  amenities: z.array(z.string().max(100)).optional(),
  additionalNotes: z.string().max(2000).optional(),
}).superRefine((data, ctx) => {
  if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
    if (data.budgetMin > data.budgetMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le budget minimum ne peut pas etre superieur au budget maximum',
        path: ['budgetMin']
      });
    }
  }
  if (data.bedroomsMin !== undefined && data.bedroomsMax !== undefined) {
    if (data.bedroomsMin > data.bedroomsMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le nombre de chambres minimum ne peut pas etre superieur au maximum',
        path: ['bedroomsMin']
      });
    }
  }
});

export const propertyDetailsSchema = z.object({
  propertyType: propertyTypeEnum,
  transactionType: z.enum(['RENT', 'SALE', 'MANAGEMENT']),
  title: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  address: z.string().max(300).optional(),
  city: z.string({ required_error: 'La ville est requise' }).min(1).max(100),
  neighborhood: z.string().max(100).optional(),
  price: priceSchema.optional(),
  surface: surfaceSchema.optional(),
  bedrooms: z.number().int().min(0).max(100).optional(),
  bathrooms: z.number().int().min(0).max(50).optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
  amenities: z.array(z.string().max(100)).optional(),
  images: z.array(z.string().max(500)).optional(),
  documents: z.array(z.string().max(500)).optional(),
});

// Schema de base pour les demandes
const demandBaseSchema = z.object({
  type: demandTypeEnum,
  status: demandStatusEnum.default('new'),
  urgency: demandUrgencyEnum.default('medium'),

  // Contact Information
  firstName: z
    .string({ required_error: 'Le prenom est requis' })
    .min(1, 'Le prenom est requis')
    .max(100, 'Le prenom ne peut pas depasser 100 caracteres')
    .transform((val) => val.trim()),

  lastName: z
    .string({ required_error: 'Le nom est requis' })
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas depasser 100 caracteres')
    .transform((val) => val.trim()),

  email: emailSchema,
  phone: phoneSchema,
  whatsapp: phoneSchemaOptional,
  preferredContact: z.enum(['phone', 'email', 'whatsapp']).optional(),

  // Criteria based on type
  searchCriteria: searchCriteriaSchema.optional(),
  propertyDetails: propertyDetailsSchema.optional(),

  // Source & Attribution
  source: demandSourceEnum.default('website_form'),
  chatSessionId: z.string().optional(),
  leadId: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const demandCreateSchema = demandBaseSchema.superRefine((data, ctx) => {
  // Si type est property_search, searchCriteria est requis
  if (data.type === 'property_search' && !data.searchCriteria) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Les criteres de recherche sont requis pour une recherche de bien',
      path: ['searchCriteria']
    });
  }
  // Si type est property_sale ou property_rental_management, propertyDetails est requis
  if (
    (data.type === 'property_sale' || data.type === 'property_rental_management') &&
    !data.propertyDetails
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Les details du bien sont requis pour une mise en vente ou gestion locative',
      path: ['propertyDetails']
    });
  }
});

export const demandUpdateSchema = demandBaseSchema.partial().extend({
  id: z.string({ required_error: 'L\'identifiant de la demande est requis' }),
  cancelReason: z.string().max(500).optional(),
});

// ============================================================================
// TASK SCHEMAS
// ============================================================================

export const taskCreateSchema = z.object({
  title: z
    .string({ required_error: 'Le titre est requis' })
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas depasser 200 caracteres'),
  description: z.string().max(1000).optional(),
  dueDate: dateStringSchema.optional(),
  priority: taskPriorityEnum.default('medium'),
  completed: z.boolean().default(false),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  id: z.string({ required_error: 'L\'identifiant de la tache est requis' }),
  completedAt: dateStringSchema.optional(),
});

// ============================================================================
// NOTE SCHEMAS
// ============================================================================

export const noteCreateSchema = z.object({
  content: z
    .string({ required_error: 'Le contenu est requis' })
    .min(1, 'Le contenu est requis')
    .max(5000, 'La note ne peut pas depasser 5000 caracteres'),
  createdBy: z.string({ required_error: 'L\'auteur est requis' }),
});

// ============================================================================
// CONTACT FORM SCHEMAS
// ============================================================================

export const contactFormSchema = z.object({
  name: z
    .string({ required_error: 'Le nom est requis' })
    .min(1, 'Le nom est requis')
    .max(200, 'Le nom ne peut pas depasser 200 caracteres')
    .transform((val) => val.trim()),

  email: emailSchema,
  phone: phoneSchemaOptional,

  subject: z
    .string({ required_error: 'Le sujet est requis' })
    .min(1, 'Le sujet est requis')
    .max(200, 'Le sujet ne peut pas depasser 200 caracteres'),

  message: z
    .string({ required_error: 'Le message est requis' })
    .min(10, 'Le message doit contenir au moins 10 caracteres')
    .max(5000, 'Le message ne peut pas depasser 5000 caracteres'),

  propertyId: z.string().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter les conditions' })
  }),
});

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================

export const profileSettingsSchema = z.object({
  displayName: z
    .string({ required_error: 'Le nom d\'affichage est requis' })
    .min(1, 'Le nom d\'affichage est requis')
    .max(100, 'Le nom ne peut pas depasser 100 caracteres'),
  email: emailSchema,
  phone: phoneSchema,
});

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  newLeadAlerts: z.boolean(),
  statusChangeAlerts: z.boolean(),
});

export const crmSettingsSchema = z.object({
  autoAssignLeads: z.boolean(),
  leadScoringEnabled: z.boolean(),
  defaultLeadStatus: leadStatusEnum,
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
export type DemandCreateInput = z.infer<typeof demandCreateSchema>;
export type DemandUpdateInput = z.infer<typeof demandUpdateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export type CRMSettingsInput = z.infer<typeof crmSettingsSchema>;
