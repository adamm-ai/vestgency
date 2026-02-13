/**
 * Property Service - OPTIMIZED
 * Lazy loading, caching, and efficient data handling
 */

import {
  Property,
  PropertyFilters,
  PropertiesResponse,
  PropertyDetailResponse,
  StatsResponse,
  FiltersResponse,
  SearchResult,
  ListingCategory
} from '../types';

// ============================================================================
// LAZY DATA LOADING WITH CACHING
// ============================================================================

interface PropertiesData {
  metadata: {
    totalProperties: number;
    saleCount: number;
    rentCount: number;
  };
  properties: Property[];
}

// Cache for loaded data
let cachedData: PropertiesData | null = null;
let loadingPromise: Promise<PropertiesData> | null = null;

// Pre-computed indexes for fast filtering
let categoryIndex: { SALE: Property[]; RENT: Property[] } | null = null;
let typeIndex: Map<string, Property[]> | null = null;
let filterOptionsCache: FiltersResponse['data'] | null = null;

/**
 * Lazy load properties data with singleton pattern
 */
async function loadData(): Promise<PropertiesData> {
  if (cachedData) return cachedData;

  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const module = await import('../data/properties.json');
    cachedData = module.default as PropertiesData;

    // Build indexes for O(1) category/type lookups
    buildIndexes(cachedData.properties);

    return cachedData;
  })();

  return loadingPromise;
}

/**
 * Build search indexes for fast filtering
 */
function buildIndexes(properties: Property[]) {
  // Category index
  categoryIndex = { SALE: [], RENT: [] };
  typeIndex = new Map();

  for (const p of properties) {
    // Category
    if (p.category === 'SALE') {
      categoryIndex.SALE.push(p);
    } else {
      categoryIndex.RENT.push(p);
    }

    // Type
    if (!typeIndex.has(p.type)) {
      typeIndex.set(p.type, []);
    }
    typeIndex.get(p.type)!.push(p);
  }
}

/**
 * Optimized filter function using indexes
 */
function filterProperties(properties: Property[], filters: PropertyFilters): Property[] {
  // Start with category-filtered array if available (much faster)
  let results: Property[];

  if (filters.category && categoryIndex) {
    results = [...categoryIndex[filters.category]];
  } else {
    results = [...properties];
  }

  // Filter by type
  if (filters.type) {
    const typeFilter = filters.type;
    results = results.filter(p => p.type === typeFilter);
  }

  // Filter by location (optimized with early exit)
  if (filters.location) {
    const locationLower = filters.location.toLowerCase();
    results = results.filter(p => p.location.toLowerCase().includes(locationLower));
  }

  // Filter by price range
  if (filters.minPrice !== undefined) {
    const min = filters.minPrice;
    results = results.filter(p => p.priceNumeric >= min);
  }
  if (filters.maxPrice !== undefined) {
    const max = filters.maxPrice;
    results = results.filter(p => p.priceNumeric <= max);
  }

  // Filter by area range
  if (filters.minArea !== undefined) {
    const min = filters.minArea;
    results = results.filter(p => (p.areaNumeric || 0) >= min);
  }
  if (filters.maxArea !== undefined) {
    const max = filters.maxArea;
    results = results.filter(p => (p.areaNumeric || 0) <= max);
  }

  // Filter by bedrooms
  if (filters.beds !== undefined) {
    const beds = filters.beds;
    results = results.filter(p => (p.beds || 0) >= beds);
  }

  // Filter by features
  if (filters.features && filters.features.length > 0) {
    const featureSet = new Set(filters.features);
    results = results.filter(p => p.features.some(f => featureSet.has(f)));
  }

  // Search (optimized: only run if query exists and is long enough)
  if (filters.search && filters.search.length >= 2) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.location.toLowerCase().includes(searchLower) ||
      p.type.toLowerCase().includes(searchLower)
    );
  }

  // Sort results
  if (filters.sort) {
    switch (filters.sort) {
      case 'price_asc':
        results.sort((a, b) => (a.priceNumeric || 0) - (b.priceNumeric || 0));
        break;
      case 'price_desc':
        results.sort((a, b) => (b.priceNumeric || 0) - (a.priceNumeric || 0));
        break;
      case 'area_desc':
        results.sort((a, b) => (b.areaNumeric || 0) - (a.areaNumeric || 0));
        break;
    }
  }

  return results;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get properties with optional filtering and pagination
 */
export async function getProperties(filters: PropertyFilters = {}): Promise<PropertiesResponse> {
  const data = await loadData();
  const results = filterProperties(data.properties, filters);

  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + limit);

  return {
    success: true,
    data: paginatedResults,
    pagination: {
      page,
      limit,
      total: results.length,
      totalPages: Math.ceil(results.length / limit),
      hasNext: startIndex + limit < results.length,
      hasPrev: page > 1
    },
    filters: {
      category: filters.category || null,
      type: filters.type || null,
      location: filters.location || null
    }
  };
}

/**
 * Get single property by ID
 */
export async function getPropertyById(id: string): Promise<PropertyDetailResponse> {
  const data = await loadData();
  const property = data.properties.find(p => p.id === id);

  if (!property) {
    throw new Error('Property not found');
  }

  // Get similar properties (limited and optimized)
  const similar = (categoryIndex?.[property.category] || data.properties)
    .filter(p => p.id !== property.id && p.type === property.type)
    .slice(0, 4);

  return {
    success: true,
    data: property,
    similar
  };
}

/**
 * Get statistics (cached)
 */
export async function getStats(): Promise<StatsResponse> {
  const data = await loadData();
  const properties = data.properties;

  const byType: Record<string, number> = {};
  const byLocation: Record<string, number> = {};

  for (const p of properties) {
    byType[p.type] = (byType[p.type] || 0) + 1;
    byLocation[p.location] = (byLocation[p.location] || 0) + 1;
  }

  const salePrices = categoryIndex?.SALE
    .filter(p => p.priceNumeric > 0)
    .map(p => p.priceNumeric) || [];
  const rentPrices = categoryIndex?.RENT
    .filter(p => p.priceNumeric > 0)
    .map(p => p.priceNumeric) || [];

  return {
    success: true,
    data: {
      total: properties.length,
      byCategory: {
        SALE: categoryIndex?.SALE.length || 0,
        RENT: categoryIndex?.RENT.length || 0
      },
      byType: Object.entries(byType).sort((a, b) => b[1] - a[1]),
      byLocation: Object.entries(byLocation).sort((a, b) => b[1] - a[1]).slice(0, 20),
      priceRange: {
        sale: salePrices.length > 0 ? {
          min: Math.min(...salePrices),
          max: Math.max(...salePrices),
          avg: Math.round(salePrices.reduce((a, b) => a + b, 0) / salePrices.length)
        } : { min: 0, max: 0, avg: 0 },
        rent: rentPrices.length > 0 ? {
          min: Math.min(...rentPrices),
          max: Math.max(...rentPrices),
          avg: Math.round(rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length)
        } : { min: 0, max: 0, avg: 0 }
      }
    }
  };
}

/**
 * Get available filter options (cached)
 */
export async function getFilterOptions(): Promise<FiltersResponse> {
  if (filterOptionsCache) {
    return { success: true, data: filterOptionsCache };
  }

  const data = await loadData();
  const properties = data.properties;

  const typesSet = new Set<string>();
  const locationsSet = new Set<string>();
  const featuresSet = new Set<string>();
  const bedsSet = new Set<number>();

  for (const p of properties) {
    typesSet.add(p.type);
    if (p.location && p.location !== 'VENTE' && p.location !== 'LOCATION') {
      locationsSet.add(p.location);
    }
    for (const f of p.features) {
      featuresSet.add(f);
    }
    if (p.beds && p.beds > 0) {
      bedsSet.add(p.beds);
    }
  }

  filterOptionsCache = {
    categories: ['SALE', 'RENT'],
    types: Array.from(typesSet).sort(),
    locations: Array.from(locationsSet).sort(),
    features: Array.from(featuresSet).sort(),
    beds: Array.from(bedsSet).sort((a, b) => a - b),
    priceRanges: {
      sale: [
        { label: '< 1M MAD', min: 0, max: 1000000 },
        { label: '1M - 2M MAD', min: 1000000, max: 2000000 },
        { label: '2M - 5M MAD', min: 2000000, max: 5000000 },
        { label: '5M - 10M MAD', min: 5000000, max: 10000000 },
        { label: '> 10M MAD', min: 10000000, max: null }
      ],
      rent: [
        { label: '< 5K MAD', min: 0, max: 5000 },
        { label: '5K - 10K MAD', min: 5000, max: 10000 },
        { label: '10K - 20K MAD', min: 10000, max: 20000 },
        { label: '20K - 50K MAD', min: 20000, max: 50000 },
        { label: '> 50K MAD', min: 50000, max: null }
      ]
    }
  };

  return { success: true, data: filterOptionsCache };
}

/**
 * Quick search (debounced on frontend)
 */
export async function searchProperties(query: string, limit: number = 10): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const data = await loadData();
  const searchLower = query.toLowerCase();

  const results: SearchResult[] = [];
  for (const p of data.properties) {
    if (results.length >= limit) break;

    if (
      p.name.toLowerCase().includes(searchLower) ||
      p.location.toLowerCase().includes(searchLower) ||
      p.type.toLowerCase().includes(searchLower)
    ) {
      results.push({
        id: p.id,
        name: p.name,
        type: p.type,
        location: p.location,
        price: p.price,
        category: p.category,
        image: p.image
      });
    }
  }

  return results;
}

/**
 * Get featured properties
 */
export async function getFeaturedProperties(category?: ListingCategory, limit: number = 8): Promise<Property[]> {
  const response = await getProperties({ category, limit });
  return response.data;
}

/**
 * Preload data (call on app init for faster subsequent loads)
 */
export function preloadData(): void {
  loadData().catch(console.error);
}
