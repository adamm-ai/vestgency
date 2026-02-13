/**
 * Smart Description Generator for Nourreska Properties
 * Generates adapted descriptions based on property attributes
 */

const fs = require('fs');
const path = require('path');

// Load properties
const propertiesPath = path.join(__dirname, 'properties.json');
const data = JSON.parse(fs.readFileSync(propertiesPath, 'utf-8'));

// French description templates
const templates = {
  // Property type descriptions
  types: {
    'Appartement': 'appartement',
    'Villa': 'villa',
    'Maison': 'maison',
    'Bureau': 'espace bureau',
    'Magasin': 'local commercial',
    'Terrain': 'terrain',
    'Riad': 'riad authentique',
    'Duplex': 'duplex',
    'Studio': 'studio',
    'Penthouse': 'penthouse',
    'Loft': 'loft',
  },

  // Location adjectives
  locationAdjectives: {
    'Anfa': 'prestigieux quartier d\'Anfa',
    'Californie': 'quartier résidentiel de Californie',
    'Gauthier': 'quartier central de Gauthier',
    'Racine': 'quartier prisé de Racine',
    'Maarif': 'quartier dynamique du Maarif',
    'Bourgogne': 'quartier familial de Bourgogne',
    'CIL': 'quartier moderne du CIL',
    'Bouskoura': 'ville verte de Bouskoura',
    'Dar Bouazza': 'station balnéaire de Dar Bouazza',
    'Ain Diab': 'corniche d\'Ain Diab',
    'Tamaris': 'quartier balnéaire de Tamaris',
    'Sidi Maarouf': 'quartier d\'affaires de Sidi Maarouf',
    'Palmier': 'quartier du Palmier',
    'Val Fleuri': 'résidence Val Fleuri',
    'Oulfa': 'quartier d\'Oulfa',
    'Hay Hassani': 'quartier de Hay Hassani',
    'Gueliz': 'quartier moderne de Guéliz',
    'Hivernage': 'quartier luxueux de l\'Hivernage',
    'Palmeraie': 'palmeraie',
    'Agdal': 'quartier d\'Agdal',
    'Souissi': 'quartier résidentiel de Souissi',
    'Hay Riad': 'quartier de Hay Riad',
  },

  // City descriptions
  cities: {
    'Casablanca': 'Casablanca, capitale économique du Maroc',
    'Marrakech': 'Marrakech, ville ocre',
    'Rabat': 'Rabat, capitale administrative',
    'Tanger': 'Tanger, perle du détroit',
    'Agadir': 'Agadir, station balnéaire',
    'Fès': 'Fès, ville impériale',
    'Mohammedia': 'Mohammedia, ville des fleurs',
    'El Jadida': 'El Jadida, cité portugaise',
    'Kenitra': 'Kenitra',
    'Tétouan': 'Tétouan, la colombe blanche',
  },

  // Feature descriptions
  featureDescriptions: {
    'Piscine': 'piscine',
    'Jardin': 'jardin privatif',
    'Terrasse': 'terrasse',
    'Garage': 'garage',
    'Parking': 'place de parking',
    'Ascenseur': 'ascenseur',
    'Climatisation': 'climatisation',
    'Chauffage': 'chauffage central',
    'Meublé': 'entièrement meublé',
    'Neuf': 'construction neuve',
    'Rénové': 'récemment rénové',
    'Vue Mer': 'vue imprenable sur la mer',
    'Vue Piscine': 'vue sur piscine',
    'Sécurisé': 'résidence sécurisée 24h/24',
    'Concierge': 'service de conciergerie',
    'Cuisine équipée': 'cuisine équipée',
    'Balcon': 'balcon',
    'Cave': 'cave',
    'Buanderie': 'buanderie',
  },
};

// Price range descriptions
function getPriceDescription(price, category) {
  if (category === 'RENT') {
    if (price < 5000) return 'à prix accessible';
    if (price < 10000) return 'au rapport qualité-prix excellent';
    if (price < 20000) return 'de standing';
    if (price < 50000) return 'haut de gamme';
    return 'de grand luxe';
  } else {
    if (price < 1000000) return 'à prix attractif';
    if (price < 2000000) return 'au juste prix';
    if (price < 5000000) return 'de standing';
    if (price < 10000000) return 'prestigieux';
    return 'd\'exception';
  }
}

// Area description
function getAreaDescription(area) {
  if (!area) return '';
  if (area < 50) return 'compact et fonctionnel';
  if (area < 80) return 'confortable';
  if (area < 120) return 'spacieux';
  if (area < 200) return 'très spacieux';
  if (area < 500) return 'aux volumes généreux';
  return 'aux dimensions exceptionnelles';
}

// Generate smart description
function generateDescription(property) {
  const {
    type,
    category,
    location,
    city,
    beds,
    baths,
    areaNumeric,
    priceNumeric,
    features,
    smartTags,
    name,
  } = property;

  // Get type name
  let typeName = templates.types[type] || type?.toLowerCase() || 'bien immobilier';
  if (typeName === 'autre' || !typeName || typeName === 'null') {
    typeName = 'bien immobilier';
  }

  // Get location description (avoid duplication with city)
  let locationDesc = '';
  const locationIsCity = location && city && location.toLowerCase() === city.toLowerCase();

  if (location && !locationIsCity && templates.locationAdjectives[location]) {
    locationDesc = `situé dans le ${templates.locationAdjectives[location]}`;
  } else if (location && !locationIsCity) {
    locationDesc = `situé à ${location}`;
  }

  // Get city description
  const cityDesc = city ? (templates.cities[city] || city) : '';

  // Transaction type
  const transactionType = category === 'RENT' ? 'À louer' : 'À vendre';

  // Build room description
  let roomDesc = '';
  if (beds && beds > 0) {
    roomDesc = beds === 1 ? '1 chambre' : `${beds} chambres`;
    if (baths && baths > 0) {
      roomDesc += baths === 1 ? ', 1 salle de bain' : `, ${baths} salles de bain`;
    }
  }

  // Area description
  const areaDesc = areaNumeric ? `${areaNumeric} m²` : '';
  const areaQuality = getAreaDescription(areaNumeric);

  // Price quality
  const priceQuality = getPriceDescription(priceNumeric, category);

  // Features list (top 4)
  let featuresDesc = '';
  if (features && features.length > 0) {
    const mappedFeatures = features
      .slice(0, 4)
      .map(f => templates.featureDescriptions[f] || f.toLowerCase())
      .filter(f => f);

    if (mappedFeatures.length > 0) {
      if (mappedFeatures.length === 1) {
        featuresDesc = `avec ${mappedFeatures[0]}`;
      } else {
        const last = mappedFeatures.pop();
        featuresDesc = `avec ${mappedFeatures.join(', ')} et ${last}`;
      }
    }
  }

  // Smart tags integration
  let tagsDesc = '';
  if (smartTags && smartTags.length > 0) {
    const relevantTags = smartTags.filter(t =>
      ['Spacieux', 'Lumineux', 'Moderne', 'Calme', 'Investissement', 'Idéal Famille'].includes(t)
    );
    if (relevantTags.length > 0) {
      tagsDesc = relevantTags.slice(0, 2).map(t => t.toLowerCase()).join(' et ');
    }
  }

  // Build the description
  const parts = [];

  // Opening
  parts.push(`${transactionType}: ${tagsDesc ? tagsDesc + ' ' : ''}${typeName} ${priceQuality}`);

  // Location (avoid duplication like "à Casablanca, à Casablanca")
  if (locationDesc && cityDesc && !locationDesc.toLowerCase().includes(city?.toLowerCase())) {
    parts.push(`${locationDesc}, à ${cityDesc}`);
  } else if (locationDesc) {
    parts.push(locationDesc);
  } else if (cityDesc) {
    parts.push(`à ${cityDesc}`);
  }

  // Specs
  const specs = [];
  if (areaDesc) specs.push(`${areaDesc} ${areaQuality ? `(${areaQuality})` : ''}`);
  if (roomDesc) specs.push(roomDesc);

  if (specs.length > 0) {
    parts.push(`Ce bien propose ${specs.join(', ')}`);
  }

  // Features
  if (featuresDesc) {
    parts.push(featuresDesc);
  }

  // Closing
  const closings = [
    'Idéal pour un investissement locatif ou une résidence principale.',
    'À visiter sans tarder.',
    'Contactez-nous pour organiser une visite.',
    'Une opportunité à ne pas manquer.',
    'Disponible immédiatement.',
  ];

  // Select closing based on property ID hash
  const closingIndex = property.id ?
    property.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % closings.length : 0;

  parts.push(closings[closingIndex]);

  return parts.join('. ').replace(/\.\./g, '.').trim();
}

// Process all properties
console.log('[Generate] Starting description generation...');
console.log(`[Generate] Processing ${data.properties.length} properties...`);

let updatedCount = 0;
let skippedCount = 0;

data.properties = data.properties.map(property => {
  const originalDesc = property.description || '';

  // Always regenerate for consistency
  const needsImprovement = true;

  if (needsImprovement) {
    property.description = generateDescription(property);
    updatedCount++;
  } else {
    skippedCount++;
  }

  return property;
});

// Update metadata
data.metadata.generated = new Date().toISOString();
data.metadata.descriptionsGenerated = updatedCount;

// Save updated file
fs.writeFileSync(propertiesPath, JSON.stringify(data, null, 2), 'utf-8');

console.log(`[Generate] ✅ Updated ${updatedCount} descriptions`);
console.log(`[Generate] ⏭️  Skipped ${skippedCount} (already good)`);
console.log(`[Generate] 💾 Saved to ${propertiesPath}`);
