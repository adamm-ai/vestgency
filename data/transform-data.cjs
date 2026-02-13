#!/usr/bin/env node
/**
 * Transform scraped Nourreska data into website-ready format
 */

const fs = require('fs');
const path = require('path');

// Read the scraped data
const scrapedDataPath = path.join(__dirname, '../../scraper/output/nourreska_all_properties.json');
const scrapedData = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf8'));

// Transform properties
const properties = scrapedData.properties.map((p, index) => {
  // Get first valid image
  const validImages = (p.images || []).filter(img =>
    img && img.startsWith('http') && !img.includes('svg') && !img.includes('logo') && !img.includes('footer')
  );

  // Filter property-specific images (exclude theme images)
  const propertyImages = validImages.filter(img =>
    img.includes('/uploads/20') &&
    !img.includes('theme') &&
    !img.includes('copy-right') &&
    !img.includes('slide.jpg')
  );

  // Determine category from property_type
  const category = p.property_type === 'vente' ? 'SALE' :
                   p.property_type === 'location' ? 'RENT' : 'SALE';

  // Map property_category to type
  const typeMap = {
    'appartement': 'Appartement',
    'villa': 'Villa',
    'bureau': 'Bureau',
    'magasin': 'Magasin',
    'entrepot': 'Entrepôt',
    'terrain': 'Terrain',
    'immeuble': 'Immeuble',
    'studio': 'Studio',
    'duplex': 'Duplex',
    'riad': 'Riad',
    'ferme': 'Ferme',
    'autre': 'Autre'
  };

  // Extract neighborhood from title or URL
  const neighborhoods = [
    'Anfa', 'Racine', 'Gauthier', 'Bourgogne', 'Maarif', 'Californie',
    'Palmier', 'Oasis', 'CFC', 'Marina', 'Ain Diab', 'Dar Bouazza',
    'Bouskoura', 'Triangle d\'Or', 'Princesse', 'Polo', 'CIL', 'Longchamp',
    'Val Fleuri', 'Riviera', 'Ghandi', '2 Mars', 'Hermitage'
  ];

  let location = p.neighborhood || '';
  if (!location || location === 'VENTE' || location === 'LOCATION') {
    for (const n of neighborhoods) {
      if (p.title && p.title.toLowerCase().includes(n.toLowerCase())) {
        location = n;
        break;
      }
    }
  }
  if (!location) location = p.city || 'Casablanca';

  // Format price
  let priceDisplay = p.price || 'Prix sur demande';
  if (category === 'RENT' && !priceDisplay.includes('/mois') && !priceDisplay.includes('mois')) {
    priceDisplay = priceDisplay + '/mois';
  }

  // Extract features
  const features = p.features || [];

  // Generate smart tags
  const smartTags = [];
  if (p.surface_numeric > 300) smartTags.push('Spacieux');
  if (p.price_numeric && p.price_numeric > 5000000 && category === 'SALE') smartTags.push('Premium');
  if (p.price_numeric && p.price_numeric < 1000000 && category === 'SALE') smartTags.push('Bon Prix');
  if (features.includes('Piscine')) smartTags.push('Piscine');
  if (features.includes('Vue Mer')) smartTags.push('Vue Mer');
  if (features.includes('Meublé') || features.includes('Meuble')) smartTags.push('Meublé');
  if (features.includes('Neuf')) smartTags.push('Neuf');

  return {
    id: p.reference_id || `NO-${10000 + index}`,
    category,
    type: typeMap[p.property_category] || 'Autre',
    location,
    city: p.city || 'Casablanca',
    name: p.title ? p.title.substring(0, 80) : 'Propriété',
    description: p.description || p.title || '',
    price: priceDisplay,
    priceNumeric: p.price_numeric || 0,
    beds: p.bedrooms || null,
    baths: p.bathrooms || null,
    area: p.surface || (p.surface_numeric ? `${p.surface_numeric} m²` : null),
    areaNumeric: p.surface_numeric || null,
    image: propertyImages[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800',
    images: propertyImages.slice(0, 20), // Limit to 20 images
    features,
    smartTags: smartTags.slice(0, 3),
    url: p.url,
    datePublished: p.date_published,
    dateScraped: p.date_scraped
  };
});

// Create output
const output = {
  metadata: {
    totalProperties: properties.length,
    saleCount: properties.filter(p => p.category === 'SALE').length,
    rentCount: properties.filter(p => p.category === 'RENT').length,
    generatedAt: new Date().toISOString(),
    source: 'nourreska.com'
  },
  properties
};

// Write output
const outputPath = path.join(__dirname, 'properties.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('✓ Data transformed successfully!');
console.log(`  Total: ${output.metadata.totalProperties}`);
console.log(`  Vente: ${output.metadata.saleCount}`);
console.log(`  Location: ${output.metadata.rentCount}`);
console.log(`  Output: ${outputPath}`);
