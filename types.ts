import React from 'react';

// ============================================================================
// PROPERTY TYPES
// ============================================================================

export type ListingCategory = 'SALE' | 'RENT';

export type PropertyType =
  | 'Appartement'
  | 'Villa'
  | 'Bureau'
  | 'Magasin'
  | 'Entrepôt'
  | 'Terrain'
  | 'Immeuble'
  | 'Studio'
  | 'Duplex'
  | 'Riad'
  | 'Ferme'
  | 'Autre';

export interface Property {
  id: string;
  category: ListingCategory;
  type: PropertyType | string;
  location: string;
  city: string;
  name: string;
  description: string;
  price: string;
  priceNumeric: number;
  beds: number | null;
  baths: number | null;
  area: string | null;
  areaNumeric: number | null;
  image: string;
  images: string[];
  features: string[];
  smartTags: string[];
  url: string;
  datePublished: string | null;
  dateScraped: string;
}

// Alias for backward compatibility
export type Villa = Property;

// ============================================================================
// API TYPES
// ============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PropertyFilters {
  category?: ListingCategory;
  type?: string;
  location?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  beds?: number;
  search?: string;
  features?: string[];
  sort?: 'price_asc' | 'price_desc' | 'date_desc' | 'area_desc';
  page?: number;
  limit?: number;
}

export interface PropertiesResponse {
  success: boolean;
  data: Property[];
  pagination: PaginationInfo;
  filters: {
    category: ListingCategory | null;
    type: string | null;
    location: string | null;
  };
}

export interface PropertyDetailResponse {
  success: boolean;
  data: Property;
  similar: Property[];
}

export interface StatsResponse {
  success: boolean;
  data: {
    total: number;
    byCategory: {
      SALE: number;
      RENT: number;
    };
    byType: [string, number][];
    byLocation: [string, number][];
    priceRange: {
      sale: { min: number; max: number; avg: number };
      rent: { min: number; max: number; avg: number };
    };
  };
}

export interface FiltersResponse {
  success: boolean;
  data: {
    categories: ListingCategory[];
    types: string[];
    locations: string[];
    features: string[];
    beds: number[];
    priceRanges: {
      sale: { label: string; min: number; max: number | null }[];
      rent: { label: string; min: number; max: number | null }[];
    };
  };
}

export interface SearchResult {
  id: string;
  name: string;
  type: string;
  location: string;
  price: string;
  category: ListingCategory;
  image: string;
  // Additional fields returned by RAG API
  city?: string;
  priceNumeric?: number;
  beds?: number;
  baths?: number;
  area?: string;
  areaNumeric?: number;
  images?: string[];
  features?: string[];
  smartTags?: string[];
  description?: string;
  url?: string;
  _score?: number;
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface Amenity {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  category: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export enum SectionId {
  HOME = 'home',
  LISTINGS = 'listings',
  VENTE = 'vente',
  LOCATION = 'location',
  SERVICES = 'services',
  BLOG = 'blog',
  AGENCY = 'agency',
  CONTACT = 'contact'
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = T | ApiError;
