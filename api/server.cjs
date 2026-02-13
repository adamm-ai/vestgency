#!/usr/bin/env node
/**
 * Nourreska API Server
 * Express REST API for property listings
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load properties data
const dataPath = path.join(__dirname, '../data/properties.json');
let propertiesData = { properties: [], metadata: {} };

try {
  propertiesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`✓ Loaded ${propertiesData.properties.length} properties`);
} catch (err) {
  console.error('Error loading properties:', err.message);
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * GET /api/properties
 * Get all properties with optional filtering
 *
 * Query params:
 * - category: SALE | RENT
 * - type: Appartement | Villa | Bureau | etc.
 * - location: neighborhood name
 * - minPrice: minimum price
 * - maxPrice: maximum price
 * - minArea: minimum area
 * - maxArea: maximum area
 * - beds: number of bedrooms
 * - search: text search in title/description
 * - page: page number (default 1)
 * - limit: items per page (default 12)
 * - sort: price_asc | price_desc | date_desc | area_desc
 */
app.get('/api/properties', (req, res) => {
  try {
    let results = [...propertiesData.properties];

    const {
      category, type, location, city,
      minPrice, maxPrice, minArea, maxArea,
      beds, search, features,
      page = 1, limit = 12, sort = 'date_desc'
    } = req.query;

    // Filter by category
    if (category) {
      results = results.filter(p => p.category === category);
    }

    // Filter by type
    if (type) {
      results = results.filter(p => p.type === type);
    }

    // Filter by location
    if (location) {
      results = results.filter(p =>
        p.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Filter by city
    if (city) {
      results = results.filter(p =>
        p.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Filter by price range
    if (minPrice) {
      results = results.filter(p => p.priceNumeric >= parseFloat(minPrice));
    }
    if (maxPrice) {
      results = results.filter(p => p.priceNumeric <= parseFloat(maxPrice));
    }

    // Filter by area range
    if (minArea) {
      results = results.filter(p => p.areaNumeric >= parseFloat(minArea));
    }
    if (maxArea) {
      results = results.filter(p => p.areaNumeric <= parseFloat(maxArea));
    }

    // Filter by bedrooms
    if (beds) {
      results = results.filter(p => p.beds >= parseInt(beds));
    }

    // Filter by features
    if (features) {
      const featureList = features.split(',');
      results = results.filter(p =>
        featureList.some(f => p.features.includes(f))
      );
    }

    // Search in title and description
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.location.toLowerCase().includes(searchLower)
      );
    }

    // Sort results
    switch (sort) {
      case 'price_asc':
        results.sort((a, b) => (a.priceNumeric || 0) - (b.priceNumeric || 0));
        break;
      case 'price_desc':
        results.sort((a, b) => (b.priceNumeric || 0) - (a.priceNumeric || 0));
        break;
      case 'area_desc':
        results.sort((a, b) => (b.areaNumeric || 0) - (a.areaNumeric || 0));
        break;
      case 'date_desc':
      default:
        // Keep original order (most recent first from scrape)
        break;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedResults = results.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: results.length,
        totalPages: Math.ceil(results.length / limitNum),
        hasNext: endIndex < results.length,
        hasPrev: pageNum > 1
      },
      filters: {
        category: category || null,
        type: type || null,
        location: location || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/properties/:id
 * Get single property by ID
 */
app.get('/api/properties/:id', (req, res) => {
  try {
    const property = propertiesData.properties.find(p => p.id === req.params.id);

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Get similar properties
    const similar = propertiesData.properties
      .filter(p =>
        p.id !== property.id &&
        p.category === property.category &&
        p.type === property.type
      )
      .slice(0, 4);

    res.json({
      success: true,
      data: property,
      similar
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stats
 * Get statistics about properties
 */
app.get('/api/stats', (req, res) => {
  try {
    const properties = propertiesData.properties;

    // Count by category
    const byCategory = {
      SALE: properties.filter(p => p.category === 'SALE').length,
      RENT: properties.filter(p => p.category === 'RENT').length
    };

    // Count by type
    const byType = {};
    properties.forEach(p => {
      byType[p.type] = (byType[p.type] || 0) + 1;
    });

    // Count by location
    const byLocation = {};
    properties.forEach(p => {
      byLocation[p.location] = (byLocation[p.location] || 0) + 1;
    });

    // Price ranges
    const salePrices = properties.filter(p => p.category === 'SALE' && p.priceNumeric > 0).map(p => p.priceNumeric);
    const rentPrices = properties.filter(p => p.category === 'RENT' && p.priceNumeric > 0).map(p => p.priceNumeric);

    res.json({
      success: true,
      data: {
        total: properties.length,
        byCategory,
        byType: Object.entries(byType).sort((a, b) => b[1] - a[1]),
        byLocation: Object.entries(byLocation).sort((a, b) => b[1] - a[1]).slice(0, 20),
        priceRange: {
          sale: {
            min: Math.min(...salePrices),
            max: Math.max(...salePrices),
            avg: Math.round(salePrices.reduce((a, b) => a + b, 0) / salePrices.length)
          },
          rent: {
            min: Math.min(...rentPrices),
            max: Math.max(...rentPrices),
            avg: Math.round(rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length)
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/filters
 * Get available filter options
 */
app.get('/api/filters', (req, res) => {
  try {
    const properties = propertiesData.properties;

    // Get unique types
    const types = [...new Set(properties.map(p => p.type))].sort();

    // Get unique locations
    const locations = [...new Set(properties.map(p => p.location))]
      .filter(l => l && l !== 'VENTE' && l !== 'LOCATION')
      .sort();

    // Get unique features
    const features = [...new Set(properties.flatMap(p => p.features))].sort();

    // Get bedroom options
    const beds = [...new Set(properties.map(p => p.beds).filter(b => b > 0))].sort((a, b) => a - b);

    res.json({
      success: true,
      data: {
        categories: ['SALE', 'RENT'],
        types,
        locations,
        features,
        beds,
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
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/search
 * Quick search endpoint
 */
app.get('/api/search', (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchLower = q.toLowerCase();
    const results = propertiesData.properties
      .filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.location.toLowerCase().includes(searchLower) ||
        p.type.toLowerCase().includes(searchLower)
      )
      .slice(0, parseInt(limit))
      .map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        location: p.location,
        price: p.price,
        category: p.category,
        image: p.image
      }));

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    properties: propertiesData.properties.length,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              NOURRESKA API SERVER                            ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                    ║
║  Properties loaded: ${propertiesData.properties.length}                              ║
║                                                              ║
║  Endpoints:                                                  ║
║  GET /api/properties     - List with filters & pagination    ║
║  GET /api/properties/:id - Single property                   ║
║  GET /api/stats          - Statistics                        ║
║  GET /api/filters        - Available filter options          ║
║  GET /api/search         - Quick search                      ║
║  GET /api/health         - Health check                      ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
