/**
 * RAG Search Service
 * ==================
 * Client for the intelligent RAG search API.
 * Provides semantic search with FAISS + Sentence Transformers.
 */

import { Property, SearchResult } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Build RAG URL - handle both full URLs and hostport format from Render
const rawUrl = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8001';
const RAG_API_URL = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

// ============================================================================
// TYPES
// ============================================================================

export interface RAGSearchResult extends Property {
  _score?: number;
  _relevance?: number;
  _match_type?: string;
  _filters_matched?: Record<string, unknown>;
}

export interface RAGSearchResponse {
  success: boolean;
  query: string;
  intent?: string;
  confidence?: number;
  filters_detected?: Record<string, unknown>;
  explanation?: string;
  total_results: number;
  results: RAGSearchResult[];
  suggestions?: string[];
  processing_time_ms: number;
}

export interface QuickSearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  processing_time_ms: number;
}

export interface SimilarPropertiesResponse {
  success: boolean;
  base_property: Property;
  similar_properties: Property[];
  processing_time_ms: number;
}

export interface RAGHealthStatus {
  status: string;
  version: string;
  index_loaded: boolean;
  total_properties: number;
  embedding_model: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

class RAGSearchClient {
  private baseUrl: string;
  private isAvailable: boolean = false;
  private checkPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string = RAG_API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if RAG service is available
   */
  async checkHealth(): Promise<RAGHealthStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        this.isAvailable = data.status === 'healthy';
        return data;
      }
      this.isAvailable = false;
      return null;
    } catch {
      this.isAvailable = false;
      return null;
    }
  }

  /**
   * Check availability (cached)
   */
  async isServiceAvailable(): Promise<boolean> {
    if (this.checkPromise) return this.checkPromise;

    this.checkPromise = (async () => {
      const health = await this.checkHealth();
      return health?.status === 'healthy';
    })();

    // Clear cache after 30 seconds
    setTimeout(() => {
      this.checkPromise = null;
    }, 30000);

    return this.checkPromise;
  }

  /**
   * Intelligent search using RAG agent
   */
  async search(
    query: string,
    options: {
      topK?: number;
      mode?: 'agent' | 'hybrid' | 'semantic';
      filters?: Record<string, unknown>;
    } = {}
  ): Promise<RAGSearchResponse> {
    const { topK = 12, mode = 'agent', filters } = options;

    const response = await fetch(`${this.baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        top_k: topK,
        mode,
        filters,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG search failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Quick search for autocomplete
   */
  async quickSearch(query: string, limit: number = 8): Promise<QuickSearchResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/api/quick-search?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Quick search failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get similar properties
   */
  async getSimilar(propertyId: string, topK: number = 5): Promise<SimilarPropertiesResponse> {
    const response = await fetch(`${this.baseUrl}/api/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property_id: propertyId,
        top_k: topK,
      }),
    });

    if (!response.ok) {
      throw new Error(`Similar search failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a specific property
   */
  async getProperty(propertyId: string): Promise<Property | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/property/${propertyId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.data;
    } catch {
      return null;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const ragSearchClient = new RAGSearchClient();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Perform intelligent RAG search
 */
export async function ragSearch(
  query: string,
  topK: number = 12
): Promise<RAGSearchResponse | null> {
  try {
    const available = await ragSearchClient.isServiceAvailable();
    if (!available) {
      console.warn('RAG service not available, falling back to local search');
      return null;
    }

    return await ragSearchClient.search(query, { topK, mode: 'agent' });
  } catch (error) {
    console.error('RAG search error:', error);
    return null;
  }
}

/**
 * Quick autocomplete search
 */
export async function ragQuickSearch(
  query: string,
  limit: number = 8
): Promise<SearchResult[]> {
  try {
    const available = await ragSearchClient.isServiceAvailable();
    if (!available) return [];

    const response = await ragSearchClient.quickSearch(query, limit);
    return response.results;
  } catch (error) {
    console.error('Quick search error:', error);
    return [];
  }
}

/**
 * Get similar properties using vector similarity
 */
export async function getSimilarProperties(
  propertyId: string,
  topK: number = 5
): Promise<Property[]> {
  try {
    const available = await ragSearchClient.isServiceAvailable();
    if (!available) return [];

    const response = await ragSearchClient.getSimilar(propertyId, topK);
    return response.similar_properties;
  } catch (error) {
    console.error('Similar properties error:', error);
    return [];
  }
}

/**
 * Preload RAG service (call on app init)
 */
export function preloadRAGService(): void {
  ragSearchClient.checkHealth().catch(() => {
    console.log('RAG service not available at startup');
  });
}
