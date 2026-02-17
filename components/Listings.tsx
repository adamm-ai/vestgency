import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionId, Property, ListingCategory, PropertyFilters, SearchResult } from '../types';
import { getProperties, getFilterOptions, preloadData } from '../services/propertyService';
import { ragSearch, RAGSearchResponse, preloadRAGService } from '../services/ragSearchService';
import {
  Bed, Bath, Maximize, Heart, MapPin, Sparkles,
  Search, ChevronLeft, ChevronRight, Home,
  Building2, Briefcase, Store, Grid3X3, Loader2, Brain, Zap
} from 'lucide-react';
import PropertyModal from './PropertyModal';
import IntelligentSearch from './IntelligentSearch';
import { useReducedMotion } from '../hooks/useReducedMotion';

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Debounce hook for search input
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Intersection Observer hook for lazy loading
 */
function useInView(ref: React.RefObject<Element>, options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { rootMargin: '100px', ...options });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);

  return isInView;
}

// ============================================================================
// OPTIMIZED IMAGE COMPONENT
// ============================================================================

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

const LazyImage = memo(({ src, alt, className, fallback }: LazyImageProps) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(imgRef);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const fallbackSrc = fallback || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800';
  const imageSrc = error ? fallbackSrc : src;

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
      )}

      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// ============================================================================
// OPTIMIZED PROPERTY CARD
// ============================================================================

interface ListingCardProps {
  property: Property;
  onView: (property: Property) => void;
}

const ListingCard = memo(({ property, onView }: ListingCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRAFRef = useRef<number | null>(null);
  const currentImageIndexRef = useRef(currentImageIndex);

  // Keep ref in sync
  useEffect(() => {
    currentImageIndexRef.current = currentImageIndex;
  }, [currentImageIndex]);

  // Get all images (use images array if available, fallback to single image)
  const allImages = useMemo(() => {
    if (property.images && property.images.length > 0) {
      return property.images;
    }
    return [property.image];
  }, [property.images, property.image]);

  const handleClick = useCallback(() => {
    onView(property);
  }, [onView, property]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(prev => !prev);
  }, []);

  const handlePrevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const handleNextImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  const handleDotClick = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  }, []);

  // Handle horizontal scroll/swipe - RAF throttled for 60fps
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || scrollRAFRef.current) return;

    scrollRAFRef.current = requestAnimationFrame(() => {
      scrollRAFRef.current = null;
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollLeft = container.scrollLeft;
      const imageWidth = container.offsetWidth;
      const newIndex = Math.round(scrollLeft / imageWidth);

      if (newIndex !== currentImageIndexRef.current && newIndex >= 0 && newIndex < allImages.length) {
        setCurrentImageIndex(newIndex);
      }
    });
  }, [allImages.length]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (scrollRAFRef.current) {
        cancelAnimationFrame(scrollRAFRef.current);
      }
    };
  }, []);

  // Preload adjacent images for smooth carousel
  useEffect(() => {
    const preloadIndices = [
      currentImageIndex - 1,
      currentImageIndex + 1
    ].filter(i => i >= 0 && i < allImages.length);

    preloadIndices.forEach(i => {
      const img = new Image();
      img.src = allImages[i];
    });
  }, [currentImageIndex, allImages]);

  // Scroll to current image when index changes (for arrow navigation)
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const imageWidth = container.offsetWidth;
      container.scrollTo({ left: currentImageIndex * imageWidth, behavior: 'smooth' });
    }
  }, [currentImageIndex]);

  // Format price for display
  const displayPrice = property.price || (property.priceNumeric ? `${property.priceNumeric.toLocaleString('fr-FR')} DH` : 'Prix sur demande');
  const isRent = property.category === 'RENT';

  return (
    <div
      className="card-2026 relative overflow-hidden h-full flex flex-col group hover-lift cursor-pointer touch-manipulation"
      onClick={handleClick}
    >
      {/* Image Area - Taller on mobile for better visual impact */}
      <div className="relative h-56 sm:h-48 md:h-52 overflow-hidden rounded-t-[20px] sm:rounded-t-[24px]">
        {/* Scrollable Image Container - Optimized for touch swipe on mobile */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {allImages.map((img, index) => (
            <div key={index} className="flex-shrink-0 w-full h-full snap-center">
              <LazyImage
                src={img}
                alt={`${property.name} - Photo ${index + 1}`}
                className="w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>

        {/* Category Badge - Top Left - Larger on mobile for visibility */}
        <div className="absolute top-3 left-3 sm:top-3 sm:left-3 z-20">
          <span className={`px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-full text-white text-xs sm:text-[11px] font-bold uppercase tracking-wide shadow-lg ${
            isRent
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              : 'bg-gradient-to-r from-brand-primary to-cyan-400'
          }`}>
            {isRent ? 'Location' : 'Vente'}
          </span>
        </div>

        {/* Like Button - Top Right - Touch-friendly size on mobile (min 44x44) */}
        <button
          onClick={handleLike}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-11 h-11 sm:w-9 sm:h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90 ${
            isLiked ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
          }`}
          aria-label={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={18} className="sm:w-4 sm:h-4" fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        {/* Navigation Arrows (only show if multiple images) - Touch-friendly on mobile */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
              aria-label="Image précédente"
            >
              <ChevronLeft size={20} className="sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
              aria-label="Image suivante"
            >
              <ChevronRight size={20} className="sm:w-4 sm:h-4" />
            </button>
          </>
        )}

        {/* Dot Indicators - Larger touch targets on mobile */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-1.5 items-center px-2 py-1.5 sm:p-0 rounded-full bg-black/20 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none">
            {allImages.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={(e) => handleDotClick(e, index)}
                className={`rounded-full transition-all duration-200 touch-manipulation ${
                  index === currentImageIndex
                    ? 'bg-white w-5 h-2 sm:w-4 sm:h-1.5'
                    : 'bg-white/50 hover:bg-white/70 w-2 h-2 sm:w-1.5 sm:h-1.5'
                }`}
                style={{ minWidth: '8px', minHeight: '8px' }}
              />
            ))}
            {allImages.length > 5 && (
              <span className="text-white/80 text-xs sm:text-[10px] ml-1 font-medium">+{allImages.length - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* Content Area - Enhanced padding and spacing for mobile */}
      <div className="p-4 sm:p-4 flex-1 flex flex-col">
        {/* Price - Prominent and larger on mobile */}
        <div className="flex items-baseline justify-between mb-2 sm:mb-2">
          <span className="text-2xl sm:text-xl font-display font-bold text-brand-gold">
            {displayPrice}
          </span>
          {isRent && (
            <span className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 font-medium">/mois</span>
          )}
        </div>

        {/* Property Type Badge - More prominent on mobile */}
        <div className="mb-2 sm:mb-2">
          <span className="inline-block px-2.5 py-1 sm:px-0 sm:py-0 rounded-md sm:rounded-none bg-brand-primary/10 sm:bg-transparent text-xs sm:text-[10px] font-semibold uppercase tracking-wider text-brand-primary dark:text-brand-primary">
            {property.type}
          </span>
          <h3 className="text-base sm:text-sm font-semibold text-brand-charcoal dark:text-white leading-snug sm:leading-tight line-clamp-2 group-hover:text-brand-gold transition-colors mt-1.5 sm:mt-0.5">
            {property.name}
          </h3>
        </div>

        {/* Location - Better readability on mobile */}
        <div className="flex items-center gap-2 sm:gap-1.5 text-gray-600 dark:text-gray-400 mb-3 sm:mb-3">
          <MapPin size={14} className="sm:w-3 sm:h-3 text-brand-gold shrink-0" />
          <span className="text-sm sm:text-xs truncate">
            {property.location}{property.city ? `, ${property.city}` : ''}
          </span>
        </div>

        {/* Stats - Beds, Baths, Area - Larger and clearer on mobile */}
        <div className="flex items-center gap-5 sm:gap-4 pt-3 sm:pt-3 border-t border-black/[0.06] dark:border-white/[0.08] mt-auto">
          {property.beds !== undefined && property.beds > 0 && (
            <div className="flex items-center gap-2 sm:gap-1.5">
              <Bed size={16} className="sm:w-3.5 sm:h-3.5 text-brand-gold" />
              <span className="text-sm sm:text-xs font-semibold sm:font-medium text-brand-charcoal dark:text-white">
                {property.beds} <span className="text-gray-500 dark:text-gray-400 font-normal">ch.</span>
              </span>
            </div>
          )}
          {property.baths !== undefined && property.baths > 0 && (
            <div className="flex items-center gap-2 sm:gap-1.5">
              <Bath size={16} className="sm:w-3.5 sm:h-3.5 text-brand-gold" />
              <span className="text-sm sm:text-xs font-semibold sm:font-medium text-brand-charcoal dark:text-white">
                {property.baths} <span className="text-gray-500 dark:text-gray-400 font-normal">sdb.</span>
              </span>
            </div>
          )}
          {(property.area || property.areaNumeric) && (
            <div className="flex items-center gap-2 sm:gap-1.5">
              <Maximize size={16} className="sm:w-3.5 sm:h-3.5 text-brand-gold" />
              <span className="text-sm sm:text-xs font-semibold sm:font-medium text-brand-charcoal dark:text-white">
                {property.area || `${property.areaNumeric} m²`}
              </span>
            </div>
          )}
        </div>

        {/* Features Tags - Better touch targets on mobile */}
        {property.features && property.features.length > 0 && (
          <div className="flex flex-wrap gap-2 sm:gap-1.5 mt-3 sm:mt-3">
            {property.features.slice(0, 3).map((feature, i) => (
              <span key={i} className="px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-lg sm:rounded-md bg-brand-gold/10 text-brand-gold text-[10px] sm:text-[9px] font-semibold uppercase">
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ListingCard.displayName = 'ListingCard';

// ============================================================================
// TYPE FILTER BUTTONS
// ============================================================================

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'Tous': <Grid3X3 size={14} />,
  'Appartement': <Building2 size={14} />,
  'Villa': <Home size={14} />,
  'Bureau': <Briefcase size={14} />,
  'Magasin': <Store size={14} />
};

const PROPERTY_TYPES = ['Tous', 'Appartement', 'Villa', 'Bureau', 'Magasin', 'Terrain'];

interface TypeFilterProps {
  activeType: string;
  onTypeChange: (type: string) => void;
}

const TypeFilter = memo(({ activeType, onTypeChange }: TypeFilterProps) => (
  <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-6 sm:pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
    {PROPERTY_TYPES.map((type) => (
      <button
        key={type}
        onClick={() => onTypeChange(type)}
        className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-300 active:scale-95 ${
          activeType === type
            ? 'btn-primary-2026 font-bold shadow-lg'
            : 'liquid-glass text-brand-charcoal/70 dark:text-white/70 hover:border-brand-primary/40 active:border-brand-primary/40 hover:text-brand-charcoal dark:hover:text-white'
        }`}
      >
        {TYPE_ICONS[type] || <Home size={14} />}
        {type}
      </button>
    ))}
  </div>
));

TypeFilter.displayName = 'TypeFilter';

// ============================================================================
// PAGINATION
// ============================================================================

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = memo(({ page, totalPages, onPageChange }: PaginationProps) => {
  const pages = useMemo(() => {
    const result = [];
    const maxVisible = 5;

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    return result;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-10 sm:mt-14">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="liquid-glass p-3 min-w-[44px] min-h-[44px] rounded-xl disabled:opacity-30 hover:border-brand-primary/40 active:scale-95 transition-all duration-300"
        aria-label="Page précédente"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {pages.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-10 h-10 sm:w-11 sm:h-11 min-w-[44px] min-h-[44px] rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 ${
              page === pageNum
                ? 'btn-primary-2026'
                : 'liquid-glass hover:border-brand-primary/40 active:border-brand-primary/40'
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="liquid-glass p-3 min-w-[44px] min-h-[44px] rounded-xl disabled:opacity-30 hover:border-brand-primary/40 active:scale-95 transition-all duration-300"
        aria-label="Page suivante"
      >
        <ChevronRight size={20} />
      </button>

      <span className="w-full sm:w-auto text-center sm:ml-5 mt-2 sm:mt-0 text-sm text-gray-500 dark:text-gray-400 font-medium">
        Page {page} sur {totalPages}
      </span>
    </div>
  );
});

Pagination.displayName = 'Pagination';

// ============================================================================
// ANIMATION VARIANTS - GPU Accelerated
// ============================================================================

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05, // 50ms stagger for smooth cascade
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] // ease-out-quad
    }
  }),
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.2 }
  }
};

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

// ============================================================================
// MAIN LISTINGS COMPONENT
// ============================================================================

const Listings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ListingCategory>('SALE');
  const [activeType, setActiveType] = useState<string>('Tous');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // RAG Search state
  const [ragResults, setRagResults] = useState<RAGSearchResponse | null>(null);
  const [isRAGSearch, setIsRAGSearch] = useState(false);
  const [searchExplanation, setSearchExplanation] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounced search for performance
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef({ activeTab, activeType, debouncedSearch });

  // Preload data on mount
  useEffect(() => {
    preloadData();
    preloadRAGService();
  }, []);

  // Load properties - single unified effect to prevent double API calls
  useEffect(() => {
    // Skip API loading if RAG search is active (properties set directly from RAG)
    if (isRAGSearch) return;

    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      prevFilters.activeTab !== activeTab ||
      prevFilters.activeType !== activeType ||
      prevFilters.debouncedSearch !== debouncedSearch;

    // Update ref
    prevFiltersRef.current = { activeTab, activeType, debouncedSearch };

    // If filters changed, reset to page 1 and load
    // If only page changed, just load with current page
    const targetPage = filtersChanged ? 1 : page;

    // Update page state if filters changed (but don't trigger another load)
    if (filtersChanged && page !== 1) {
      setPage(1);
      return; // The setPage will trigger this effect again with page=1
    }

    const loadProperties = async () => {
      setLoading(true);
      try {
        const filters: PropertyFilters = {
          category: activeTab,
          page: targetPage,
          limit: 12,
          search: debouncedSearch || undefined
        };

        if (activeType !== 'Tous') {
          filters.type = activeType;
        }

        const response = await getProperties(filters);

        if (response.success) {
          setProperties(response.data);
          setTotalPages(response.pagination.totalPages);
          setTotal(response.pagination.total);
        }
      } catch (error) {
        // Silent fail for production
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [activeTab, activeType, page, debouncedSearch, isRAGSearch]);

  // Handlers
  const handleTabChange = useCallback((tab: ListingCategory) => {
    // Clear RAG search when changing tabs
    setIsRAGSearch(false);
    setRagResults(null);
    setSearchExplanation('');
    setActiveTab(tab);
  }, []);

  const handleTypeChange = useCallback((type: string) => {
    // Clear RAG search when changing type
    setIsRAGSearch(false);
    setRagResults(null);
    setSearchExplanation('');
    setActiveType(type);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    // Scroll to listings section
    document.getElementById(SectionId.LISTINGS)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleViewProperty = useCallback((property: Property) => {
    setSelectedProperty(property);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProperty(null);
  }, []);

  // Handle intelligent RAG search
  const handleIntelligentSearch = useCallback(async (query: string, ragResponse?: RAGSearchResponse) => {
    setSearchQuery(query);
    setPage(1);

    if (ragResponse && ragResponse.results.length > 0) {
      // Use RAG results - set directly, skip useEffect loading
      setIsRAGSearch(true);
      setRagResults(ragResponse);
      setProperties(ragResponse.results as Property[]);
      setTotal(ragResponse.total_results);
      setTotalPages(Math.ceil(ragResponse.total_results / 12));
      setSearchExplanation(ragResponse.explanation || '');
      setLoading(false);
    } else {
      // Fall back to regular search - useEffect will handle loading via searchQuery change
      setIsRAGSearch(false);
      setRagResults(null);
      setSearchExplanation('');
      // No need to call loadProperties - useEffect triggers on searchQuery/debouncedSearch change
    }
  }, []);

  // Handle quick select from suggestions
  const handleQuickSelect = useCallback((result: SearchResult) => {
    // Convert SearchResult to Property and show modal directly
    // The suggestion already contains all the necessary data from the API
    const propertyFromResult: Property = {
      id: result.id,
      name: result.name,
      type: result.type,
      category: result.category as ListingCategory,
      location: result.location,
      city: result.city || '',
      price: result.price,
      priceNumeric: result.priceNumeric || 0,
      beds: result.beds || 0,
      baths: result.baths || 0,
      area: result.area || '',
      areaNumeric: result.areaNumeric || 0,
      image: result.image,
      images: result.images || [result.image],
      features: result.features || [],
      smartTags: result.smartTags || [],
      description: result.description || '',
      url: result.url || '',
      datePublished: null,
      dateScraped: new Date().toISOString(),
    };
    setSelectedProperty(propertyFromResult);
  }, []);

  // Clear RAG search
  const clearRAGSearch = useCallback(() => {
    setIsRAGSearch(false);
    setRagResults(null);
    setSearchExplanation('');
    setSearchQuery('');
    // No need to call loadProperties - useEffect triggers on searchQuery change
  }, []);

  return (
    <section id={SectionId.LISTINGS} className="py-16 sm:py-20 md:py-24 relative bg-[#FAFAF9] dark:bg-[#050608] overflow-hidden transition-colors duration-300">
      {/* Background - 2026 Mesh */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-brand-primary/8 to-transparent rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-blue-500/6 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/[0.01] to-transparent rounded-full blur-[100px] pointer-events-none dark:block hidden" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Primary Category Tabs - VENTE / LOCATION - Prominent Toggle */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0">
            {/* Vente Tab */}
            <button
              onClick={() => handleTabChange('SALE')}
              className={`relative group w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 rounded-2xl sm:rounded-l-2xl sm:rounded-r-none transition-all duration-400 touch-manipulation ${
                activeTab === 'SALE'
                  ? 'bg-gradient-to-br from-brand-primary via-brand-primary to-cyan-500 text-white shadow-2xl shadow-brand-primary/40 scale-[1.02] z-10'
                  : 'bg-white/60 dark:bg-white/5 text-brand-charcoal/60 dark:text-white/50 hover:bg-white dark:hover:bg-white/10 hover:text-brand-charcoal dark:hover:text-white border border-gray-200/50 dark:border-white/10'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <Home size={24} className={`sm:w-7 sm:h-7 ${activeTab === 'SALE' ? 'text-white' : 'text-brand-primary'}`} />
                <span className="text-base sm:text-lg font-display font-bold tracking-wide">Vente</span>
                <span className={`text-[10px] sm:text-xs font-medium ${activeTab === 'SALE' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  Biens a vendre
                </span>
              </div>
              {activeTab === 'SALE' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-primary rotate-45 hidden sm:block" />
              )}
            </button>

            {/* Location Tab */}
            <button
              onClick={() => handleTabChange('RENT')}
              className={`relative group w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 rounded-2xl sm:rounded-r-2xl sm:rounded-l-none transition-all duration-400 touch-manipulation ${
                activeTab === 'RENT'
                  ? 'bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-400 text-white shadow-2xl shadow-emerald-500/40 scale-[1.02] z-10'
                  : 'bg-white/60 dark:bg-white/5 text-brand-charcoal/60 dark:text-white/50 hover:bg-white dark:hover:bg-white/10 hover:text-brand-charcoal dark:hover:text-white border border-gray-200/50 dark:border-white/10'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <Building2 size={24} className={`sm:w-7 sm:h-7 ${activeTab === 'RENT' ? 'text-white' : 'text-emerald-500'}`} />
                <span className="text-base sm:text-lg font-display font-bold tracking-wide">Location</span>
                <span className={`text-[10px] sm:text-xs font-medium ${activeTab === 'RENT' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  Biens a louer
                </span>
              </div>
              {activeTab === 'RENT' && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-500 rotate-45 hidden sm:block" />
              )}
            </button>
          </div>
        </div>

        {/* Header with Category Context */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            {/* Category Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
              activeTab === 'SALE'
                ? 'bg-brand-primary/10 text-brand-primary'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
              {activeTab === 'SALE' ? <Home size={16} /> : <Building2 size={16} />}
              <span className="text-xs font-bold uppercase tracking-wider">
                {activeTab === 'SALE' ? 'Vente' : 'Location'}
              </span>
              <span className="text-xs font-medium opacity-70">
                - {total} annonces
              </span>
            </div>

            <h2 className="text-2xl md:text-4xl lg:text-5xl font-display text-brand-charcoal dark:text-white mb-2">
              {activeTab === 'SALE' ? (
                <>Biens a <span className="text-gradient-2026 italic font-serif">Vendre</span></>
              ) : (
                <>Biens en <span className="text-emerald-500 italic font-serif">Location</span></>
              )}
            </h2>
            <p className="text-brand-charcoal/60 dark:text-white/60 text-sm md:text-base font-light max-w-lg">
              {activeTab === 'SALE'
                ? 'Decouvrez notre selection de proprietes a vendre a Casablanca et ses environs'
                : 'Trouvez votre location ideale parmi nos appartements, villas et locaux commerciaux'
              }
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className={`px-5 py-3 rounded-xl ${
              activeTab === 'SALE'
                ? 'bg-brand-primary/5 border border-brand-primary/20'
                : 'bg-emerald-500/5 border border-emerald-500/20'
            }`}>
              <span className={`text-2xl font-bold ${
                activeTab === 'SALE' ? 'text-brand-primary' : 'text-emerald-500'
              }`}>{total}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                {activeTab === 'SALE' ? 'A vendre' : 'A louer'}
              </span>
            </div>
          </div>
        </div>

        {/* Intelligent Search Bar */}
        <div className="mb-8">
          <IntelligentSearch
            onSearch={handleIntelligentSearch}
            onQuickSelect={handleQuickSelect}
            category={activeTab}
            placeholder="Recherche IA: 'villa 4 chambres anfa avec piscine'..."
            className="max-w-2xl mx-auto lg:mx-0"
          />
        </div>

        {/* RAG Search Status */}
        <AnimatePresence>
          {isRAGSearch && ragResults && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={prefersReducedMotion ? { duration: 0 } : undefined}
              className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-gold/10 via-cyan-400/5 to-transparent border border-brand-gold/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Brain size={20} className="text-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-brand-charcoal dark:text-white">
                        Recherche IA
                      </span>
                      {ragResults.intent && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-bold uppercase">
                          {ragResults.intent}
                        </span>
                      )}
                      {ragResults.confidence && (
                        <span className="text-[10px] text-gray-500">
                          {Math.round(ragResults.confidence * 100)}% confiance
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-charcoal/60 dark:text-white/60">
                      {searchExplanation || `${ragResults.total_results} résultats trouvés pour "${searchQuery}"`}
                    </p>
                    {ragResults.filters_detected && Object.keys(ragResults.filters_detected).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(ragResults.filters_detected).map(([key, value]) => (
                          <span key={key} className="px-2 py-0.5 rounded-full bg-white/50 dark:bg-white/10 text-[10px] text-brand-charcoal dark:text-white">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={clearRAGSearch}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg bg-white/50 dark:bg-white/10 text-xs font-medium text-brand-charcoal dark:text-white hover:bg-white dark:hover:bg-white/20 active:scale-95 transition-all"
                >
                  Effacer
                </button>
              </div>
              {ragResults.suggestions && ragResults.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-brand-gold/10">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Suggestions:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {ragResults.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleIntelligentSearch(suggestion)}
                        className="px-2 py-1 rounded-full bg-white/50 dark:bg-white/10 text-xs text-brand-charcoal dark:text-white hover:bg-brand-gold/20 transition-colors flex items-center gap-1"
                      >
                        <Zap size={10} className="text-brand-gold" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Type Filters */}
        <TypeFilter activeType={activeType} onTypeChange={handleTypeChange} />

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-brand-gold" />
          </div>
        ) : (
          <>
            {/* Cards Grid - Full-width single column on mobile, responsive layout on larger screens */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`grid-${activeTab}-${activeType}-${page}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
                variants={prefersReducedMotion ? undefined : gridVariants}
                initial={prefersReducedMotion ? false : "hidden"}
                animate="visible"
                exit="exit"
              >
                {properties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    custom={index}
                    variants={prefersReducedMotion ? undefined : cardVariants}
                    initial={prefersReducedMotion ? false : "hidden"}
                    animate="visible"
                    exit="exit"
                    layout
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <ListingCard
                      property={property}
                      onView={handleViewProperty}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Empty State */}
            {properties.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 dark:text-gray-400">Aucun bien trouvé</p>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Property Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyModal
            property={selectedProperty}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default memo(Listings);
