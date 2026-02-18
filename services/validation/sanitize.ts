/**
 * Input Sanitization Utilities
 * ============================
 * Fonctions de nettoyage et validation des entrees utilisateur
 * Protection contre XSS, injections et donnees malformees
 */

import { z, ZodSchema, ZodError } from 'zod';
import * as DOMPurify from 'dompurify';

// ============================================================================
// TYPES
// ============================================================================

export interface SanitizeResult<T> {
  success: true;
  data: T;
}

export interface SanitizeError {
  success: false;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export type SanitizeResponse<T> = SanitizeResult<T> | SanitizeError;

// ============================================================================
// HTML SANITIZATION
// ============================================================================

/**
 * Configure DOMPurify pour une securite maximale
 */
const DOMPURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [], // Aucune balise HTML autorisee par defaut
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

const DOMPURIFY_CONFIG_RICH_TEXT: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'], // Ajouter target="_blank" aux liens
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Nettoie une chaine de tout contenu HTML/JavaScript potentiellement dangereux
 * @param input - Chaine a nettoyer
 * @returns Chaine nettoyee sans HTML
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Supprimer les caracteres de controle sauf newline et tab
  const withoutControlChars = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Utiliser DOMPurify pour supprimer tout HTML
  const sanitized = DOMPurify.sanitize(withoutControlChars, DOMPURIFY_CONFIG);

  // Decoder les entites HTML pour avoir du texte brut
  const decoded = decodeHtmlEntities(sanitized);

  // Trim et normaliser les espaces
  return decoded.replace(/\s+/g, ' ').trim();
}

/**
 * Nettoie une chaine en autorisant un sous-ensemble de HTML securise
 * Utile pour les descriptions et contenus riches
 * @param input - Chaine a nettoyer
 * @returns Chaine avec HTML limite et securise
 */
export function sanitizeRichText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Supprimer les caracteres de controle
  const withoutControlChars = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Utiliser DOMPurify avec configuration rich text
  return DOMPurify.sanitize(withoutControlChars, DOMPURIFY_CONFIG_RICH_TEXT);
}

/**
 * Decode les entites HTML
 */
function decodeHtmlEntities(input: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  return input.replace(
    /&(?:amp|lt|gt|quot|#39|apos|nbsp);/gi,
    (match) => entities[match.toLowerCase()] || match
  );
}

// ============================================================================
// EMAIL SANITIZATION
// ============================================================================

/**
 * Valide et normalise une adresse email
 * @param email - Email a valider
 * @returns Email normalise en minuscules ou null si invalide
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  // Trim et lowercase
  const normalized = email.trim().toLowerCase();

  // Regex de validation email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(normalized)) {
    return null;
  }

  // Verifier la longueur
  if (normalized.length > 255) {
    return null;
  }

  // Verifier les caracteres dangereux
  if (/[<>()[\]\\,;:\s"]/.test(normalized.split('@')[0])) {
    return null;
  }

  return normalized;
}

/**
 * Valide un email et retourne un resultat detaille
 */
export function validateEmail(email: string): {
  valid: boolean;
  normalized: string | null;
  error?: string;
} {
  const normalized = sanitizeEmail(email);

  if (normalized === null) {
    if (!email || typeof email !== 'string') {
      return { valid: false, normalized: null, error: 'L\'email est requis' };
    }
    if (email.length > 255) {
      return { valid: false, normalized: null, error: 'L\'email est trop long' };
    }
    return { valid: false, normalized: null, error: 'Format d\'email invalide' };
  }

  return { valid: true, normalized };
}

// ============================================================================
// PHONE SANITIZATION
// ============================================================================

/**
 * Normalise un numero de telephone
 * Supporte les formats marocains et internationaux
 * @param phone - Numero a normaliser
 * @returns Numero normalise ou null si invalide
 */
export function sanitizePhone(phone: string): string | null {
  if (typeof phone !== 'string') {
    return null;
  }

  // Supprimer tous les caracteres non numeriques sauf le +
  let normalized = phone.replace(/[^0-9+]/g, '');

  // Si le numero commence par 00, remplacer par +
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2);
  }

  // Format marocain: convertir 06/07 en +212 6/7
  if (/^0[5-7]\d{8}$/.test(normalized)) {
    normalized = '+212' + normalized.slice(1);
  }

  // Verifier le format final
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;

  if (!phoneRegex.test(normalized)) {
    return null;
  }

  // S'assurer que le + est present pour les numeros internationaux
  if (!normalized.startsWith('+') && normalized.length > 10) {
    normalized = '+' + normalized;
  }

  return normalized;
}

/**
 * Formate un numero de telephone pour l'affichage
 * @param phone - Numero normalise
 * @returns Numero formate pour l'affichage
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';

  // Format marocain: +212 6 XX XX XX XX
  const moroccanMatch = phone.match(/^\+212(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (moroccanMatch) {
    return `+212 ${moroccanMatch[1]} ${moroccanMatch[2]} ${moroccanMatch[3]} ${moroccanMatch[4]} ${moroccanMatch[5]}`;
  }

  // Format international generique
  if (phone.startsWith('+')) {
    return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4');
  }

  return phone;
}

/**
 * Valide un numero de telephone et retourne un resultat detaille
 */
export function validatePhone(phone: string): {
  valid: boolean;
  normalized: string | null;
  formatted: string | null;
  error?: string;
} {
  const normalized = sanitizePhone(phone);

  if (normalized === null) {
    if (!phone || typeof phone !== 'string') {
      return { valid: false, normalized: null, formatted: null, error: 'Le telephone est requis' };
    }
    return { valid: false, normalized: null, formatted: null, error: 'Format de telephone invalide' };
  }

  return {
    valid: true,
    normalized,
    formatted: formatPhoneDisplay(normalized)
  };
}

// ============================================================================
// GENERIC SANITIZATION
// ============================================================================

/**
 * Nettoie une chaine de texte generique
 * @param input - Texte a nettoyer
 * @param maxLength - Longueur maximale (defaut: 1000)
 * @returns Texte nettoye
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Nettoyer HTML et trim
  let sanitized = sanitizeHtml(input);

  // Limiter la longueur
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Nettoie un objet en appliquant sanitizeHtml a toutes les chaines
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeHtml(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeHtml(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

// ============================================================================
// ZOD INTEGRATION
// ============================================================================

/**
 * Transforme les erreurs Zod en format utilisable
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Valide et nettoie une entree avec un schema Zod
 * @param input - Donnees a valider
 * @param schema - Schema Zod a appliquer
 * @param sanitize - Appliquer la sanitization HTML (defaut: true)
 * @returns Resultat de validation avec donnees nettoyees ou erreurs
 */
export function sanitizeInput<T>(
  input: unknown,
  schema: ZodSchema<T>,
  sanitize: boolean = true
): SanitizeResponse<T> {
  try {
    // Pre-sanitize les chaines si demande
    let dataToValidate = input;

    if (sanitize && typeof input === 'object' && input !== null) {
      dataToValidate = sanitizeObject(input as Record<string, unknown>);
    } else if (sanitize && typeof input === 'string') {
      dataToValidate = sanitizeHtml(input);
    }

    // Valider avec Zod
    const result = schema.safeParse(dataToValidate);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: '_root',
          message: 'Erreur de validation inattendue',
          code: 'custom',
        },
      ],
    };
  }
}

/**
 * Version async de sanitizeInput pour les schemas avec refinements async
 */
export async function sanitizeInputAsync<T>(
  input: unknown,
  schema: ZodSchema<T>,
  sanitize: boolean = true
): Promise<SanitizeResponse<T>> {
  try {
    let dataToValidate = input;

    if (sanitize && typeof input === 'object' && input !== null) {
      dataToValidate = sanitizeObject(input as Record<string, unknown>);
    } else if (sanitize && typeof input === 'string') {
      dataToValidate = sanitizeHtml(input);
    }

    const result = await schema.safeParseAsync(dataToValidate);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field: '_root',
          message: 'Erreur de validation inattendue',
          code: 'custom',
        },
      ],
    };
  }
}

/**
 * Valide et leve une exception si invalide (pour usage dans try/catch)
 */
export function validateOrThrow<T>(input: unknown, schema: ZodSchema<T>): T {
  const result = sanitizeInput(input, schema);

  if (result.success === false) {
    const errorMessages = result.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
    throw new Error(`Validation echouee: ${errorMessages}`);
  }

  return result.data;
}

// ============================================================================
// URL SANITIZATION
// ============================================================================

/**
 * Valide et nettoie une URL
 * @param url - URL a valider
 * @returns URL nettoyee ou null si invalide
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Verifier la longueur
  if (trimmed.length > 2048) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    // N'accepter que http et https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Bloquer les schemes dangereux dans les parametres
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        return null;
      }
    }

    return parsed.href;
  } catch {
    return null;
  }
}

// ============================================================================
// NUMERIC SANITIZATION
// ============================================================================

/**
 * Convertit et valide un nombre
 */
export function sanitizeNumber(
  input: unknown,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    defaultValue?: number;
  } = {}
): number | null {
  const { min, max, integer = false, defaultValue } = options;

  if (input === null || input === undefined || input === '') {
    return defaultValue ?? null;
  }

  let num: number;

  if (typeof input === 'number') {
    num = input;
  } else if (typeof input === 'string') {
    // Nettoyer la chaine (espaces, separateurs de milliers)
    const cleaned = input.replace(/[\s,]/g, '').replace(',', '.');
    num = parseFloat(cleaned);
  } else {
    return defaultValue ?? null;
  }

  if (isNaN(num) || !isFinite(num)) {
    return defaultValue ?? null;
  }

  if (integer) {
    num = Math.round(num);
  }

  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * Convertit et valide un prix
 */
export function sanitizePrice(input: unknown): number | null {
  return sanitizeNumber(input, {
    min: 0,
    max: 1_000_000_000,
    integer: false,
  });
}

// ============================================================================
// DATE SANITIZATION
// ============================================================================

/**
 * Valide et normalise une date
 * @param input - Date a valider (string ISO, timestamp, ou Date)
 * @returns Date ISO string ou null si invalide
 */
export function sanitizeDate(input: unknown): string | null {
  if (!input) {
    return null;
  }

  let date: Date;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    date = new Date(input);
  } else if (typeof input === 'number') {
    date = new Date(input);
  } else {
    return null;
  }

  if (isNaN(date.getTime())) {
    return null;
  }

  // Verifier que la date est raisonnable (entre 1900 et 2100)
  const year = date.getFullYear();
  if (year < 1900 || year > 2100) {
    return null;
  }

  return date.toISOString();
}

// ============================================================================
// ARRAY SANITIZATION
// ============================================================================

/**
 * Nettoie un tableau de chaines
 */
export function sanitizeStringArray(
  input: unknown,
  options: {
    maxLength?: number;
    maxItems?: number;
    unique?: boolean;
  } = {}
): string[] {
  const { maxLength = 100, maxItems = 100, unique = true } = options;

  if (!Array.isArray(input)) {
    return [];
  }

  let result = input
    .filter((item): item is string => typeof item === 'string')
    .map((item) => sanitizeText(item, maxLength))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);

  if (unique) {
    result = Array.from(new Set(result));
  }

  return result;
}
