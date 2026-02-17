import React from 'react';
import { Property, Amenity, BlogPost } from './types';
import { ShieldCheck, TrendingUp, Truck, HardHat, HeartHandshake, Home, Key, Building2 } from 'lucide-react';

export const APP_NAME = "At Home";

// Exemples de propriétés pour le composant Hero (les vraies données viennent du JSON)
export const FEATURED_PROPERTIES: Property[] = [
  // VENTE (Sales)
  {
    id: 's1',
    category: 'SALE',
    type: 'Villa',
    location: 'Anfa Supérieur',
    city: 'Casablanca',
    name: "Villa Contemporaine Anfa",
    description: "Villa d'architecte avec piscine à débordement, jardin paysager et vue panoramique sur l'océan.",
    price: "12,500,000 MAD",
    priceNumeric: 12500000,
    beds: 5,
    baths: 4,
    area: "650 m²",
    areaNumeric: 650,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop"],
    features: ["Piscine", "Vue Mer"],
    smartTags: ["Exclusif", "Premium"],
    url: "#",
    datePublished: null,
    dateScraped: new Date().toISOString()
  },
  {
    id: 's2',
    category: 'SALE',
    type: 'Appartement',
    location: 'Racine',
    city: 'Casablanca',
    name: "Penthouse Racine Prestige",
    description: "Penthouse exceptionnel de 320m² avec terrasse panoramique et finitions haut de gamme.",
    price: "8,200,000 MAD",
    priceNumeric: 8200000,
    beds: 4,
    baths: 3,
    area: "320 m²",
    areaNumeric: 320,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop"],
    features: ["Terrasse 80m²", "Parking x2"],
    smartTags: ["Dernier étage", "Rare"],
    url: "#",
    datePublished: null,
    dateScraped: new Date().toISOString()
  },
  {
    id: 's3',
    category: 'SALE',
    type: 'Villa',
    location: 'Californie',
    city: 'Casablanca',
    name: "Villa Californie Luxe",
    description: "Magnifique villa rénovée dans le quartier prisé de Californie. Matériaux nobles.",
    price: "9,800,000 MAD",
    priceNumeric: 9800000,
    beds: 6,
    baths: 5,
    area: "520 m²",
    areaNumeric: 520,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop"],
    features: ["Jardin 400m²", "Garage"],
    smartTags: ["Rénové", "Standing"],
    url: "#",
    datePublished: null,
    dateScraped: new Date().toISOString()
  },
  {
    id: 's4',
    category: 'SALE',
    type: 'Bureau',
    location: 'Marina',
    city: 'Casablanca',
    name: "Plateau Bureau Marina",
    description: "Bureau moderne en open space avec vue sur la marina. Idéal pour entreprise.",
    price: "3,200,000 MAD",
    priceNumeric: 3200000,
    beds: 0,
    baths: 2,
    area: "180 m²",
    areaNumeric: 180,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop"],
    features: ["Climatisé", "Fibre optique"],
    smartTags: ["Rentabilité 7%", "Loué"],
    url: "#",
    datePublished: null,
    dateScraped: new Date().toISOString()
  },

  // LOCATION (Rentals)
  {
    id: 'r1',
    category: 'RENT',
    type: 'Appartement',
    location: 'Gauthier',
    city: 'Casablanca',
    name: "Appartement Gauthier Standing",
    description: "Bel appartement lumineux entièrement meublé. Proche tramway et commerces.",
    price: "14,000 MAD/mois",
    priceNumeric: 14000,
    beds: 3,
    baths: 2,
    area: "140 m²",
    areaNumeric: 140,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600&auto=format&fit=crop"],
    features: ["Meublé", "Lumineux"],
    smartTags: ["Central", "Disponible"],
    url: "#",
    datePublished: null,
    dateScraped: new Date().toISOString()
  },
  {
    id: 'r2',
    category: 'RENT',
    type: 'Appartement',
    location: 'Bourgogne',
    city: 'Casablanca',
    name: "Duplex Bourgogne Vue Mer",
    description: "Superbe duplex avec terrasse et vue imprenable. Quartier calme et résidentiel.",
    price: "22,000 MAD/mois",
    priceNumeric: 22000,
    beds: 4,
    baths: 3,
    area: "200 m²",
    areaNumeric: 200,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1600&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1600&auto=format&fit=crop"],
    features: ["Vue mer", "Terrasse"],
    smartTags: ["Luxe", "Calme"],
    url: "#",
    datePublished: null,
    dateScraped: new Date().toISOString()
  },
  {
    id: 'r3',
    category: 'RENT',
    type: 'Villa',
    location: 'Dar Bouazza',
    city: 'Casablanca',
    name: "Villa Balnéaire Dar Bouazza",
    description: "Villa pieds dans l'eau avec accès plage privée. Idéale pour famille.",
    price: "35,000 MAD/mois",
    priceNumeric: 35000,
    beds: 5,
    baths: 4,
    area: "380 m²",
    areaNumeric: 380,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1600&auto=format&fit=crop"],
    features: ["Piscine", "Plage privée"],
    smartTags: ["Bord de mer", "Prestige"],
    url: "#",
    datePublished: null,
    dateScraped: new Date().toISOString()
  },
  {
    id: 'r4',
    category: 'RENT',
    type: 'Studio',
    location: 'CFC',
    city: 'Casablanca',
    name: "Studio CFC Business",
    description: "Studio moderne parfaitement équipé au cœur de Casa Finance City.",
    price: "8,500 MAD/mois",
    priceNumeric: 8500,
    beds: 1,
    baths: 1,
    area: "55 m²",
    areaNumeric: 55,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop"],
    features: ["Équipé", "Sécurisé"],
    smartTags: ["Business", "Neuf"],
    url: "#",
    datePublished: null,
    dateScraped: new Date().toISOString()
  }
];

// Alias pour compatibilité avec les anciens composants
export const PROPERTIES = FEATURED_PROPERTIES;

export const SERVICES: Amenity[] = [
  {
    icon: <Home className="w-6 h-6" />,
    title: "Vente Immobilière",
    description: "Accompagnement personnalisé pour vendre votre bien au meilleur prix avec notre expertise du marché local."
  },
  {
    icon: <Key className="w-6 h-6" />,
    title: "Location & Gestion",
    description: "Gestion locative complète : recherche de locataires, états des lieux, encaissement des loyers."
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Conseil Investissement",
    description: "Stratégies d'investissement sur-mesure et optimisation de votre patrimoine immobilier."
  },
  {
    icon: <HardHat className="w-6 h-6" />,
    title: "Estimation Gratuite",
    description: "Évaluation précise de votre bien basée sur les données du marché et notre connaissance terrain."
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Accompagnement Juridique",
    description: "Sécurisation de vos transactions avec nos partenaires notaires et avocats spécialisés."
  },
  {
    icon: <Building2 className="w-6 h-6" />,
    title: "Programmes Neufs",
    description: "Accès privilégié aux meilleures opportunités VEFA avec des promoteurs de confiance."
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'b1',
    title: "Marché Immobilier Casablanca 2024",
    excerpt: "Analyse complète des tendances et évolutions des prix par quartier.",
    date: "15 Nov 2024",
    category: "Marché",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 'b2',
    title: "Guide Fiscal : Investir au Maroc",
    excerpt: "Tout savoir sur les avantages fiscaux pour les investisseurs immobiliers.",
    date: "08 Nov 2024",
    category: "Juridique",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: 'b3',
    title: "Les Quartiers qui Montent",
    excerpt: "Découvrez les zones à fort potentiel de plus-value pour 2025.",
    date: "01 Nov 2024",
    category: "Tendances",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop"
  }
];

export const SYSTEM_INSTRUCTION = `
Tu es l'assistant virtuel d'At Home, agence premium à Casablanca.
Tu aides les clients à trouver le bien idéal avec professionnalisme et bienveillance.

**Ton rôle:**
- Comprendre les besoins du client (achat, vente, location)
- Proposer des biens adaptés à leur budget et critères
- Répondre aux questions sur le marché immobilier marocain

**Style:**
- Réponds en français, de manière concise et chaleureuse
- Sois proactif dans tes suggestions
- Mets en avant les points forts de chaque bien
`;
