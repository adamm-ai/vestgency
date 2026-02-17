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
      return property.images; // All images from database
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

  return (
    <div
      className="card-2026 relative overflow-hidden h-full flex flex-col group hover-lift cursor-pointer"
      onClick={handleClick}
    >
      {/* Image Carousel Area */}
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />

        {/* Scrollable Image Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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

        {/* Navigation Arrows (only show if multiple images) */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 opacity-70 transition-opacity duration-200"
              aria-label="Image précédente"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-black/50 hover:bg-black/70 active:bg-black/80 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 opacity-70 transition-opacity duration-200"
              aria-label="Image suivante"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot Indicators (only show if multiple images, max 7 visible) */}
        {allImages.length > 1 && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex gap-1 items-center">
            {allImages.length <= 7 ? (
              // Show all dots if 7 or fewer images
              allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => handleDotClick(e, index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentImageIndex
                      ? 'bg-white w-3'
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))
            ) : (
              // Show sliding window of dots for many images
              <>
                {currentImageIndex > 0 && (
                  <span className="text-white/70 text-[8px]">‹</span>
                )}
                {Array.from({ length: Math.min(5, allImages.length) }, (_, i) => {
                  // Calculate which indices to show (sliding window)
                  let startIdx = Math.max(0, Math.min(currentImageIndex - 2, allImages.length - 5));
                  let idx = startIdx + i;
                  return (
                    <button
                      key={idx}
                      onClick={(e) => handleDotClick(e, idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        idx === currentImageIndex
                          ? 'bg-white w-3'
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                    />
                  );
                })}
                {currentImageIndex < allImages.length - 1 && (
                  <span className="text-white/70 text-[8px]">›</span>
                )}
              </>
            )}
          </div>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute top-12 right-3 z-20 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium">
            {currentImageIndex + 1}/{allImages.length}
          </div>
        )}

        {/* Tags - 2026 Glass */}
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          <span className="liquid-glass px-3 py-1.5 rounded-full text-brand-charcoal dark:text-white text-[10px] font-bold uppercase tracking-wider">
            {property.type}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-lg ${
            property.category === 'RENT' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-brand-primary to-cyan-400'
          }`}>
            {property.category === 'RENT' ? 'Location' : 'Vente'}
          </span>
        </div>

        {/* Smart Tags */}
        {property.smartTags && property.smartTags.length > 0 && (
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
            {property.smartTags.slice(0, 2).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-brand-gold/90 text-black text-[9px] font-bold uppercase flex items-center gap-1">
                <Sparkles size={8} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Like Button */}
        {!property.smartTags?.length && (
          <button
            onClick={handleLike}
            className={`absolute top-3 right-3 z-20 w-10 h-10 min-w-[44px] min-h-[44px] rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-200 active:scale-90 ${
              isLiked ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'
            }`}
            aria-label={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Price & Location */}
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-1 text-white/80 text-[11px] font-medium">
              <MapPin size={10} className="text-brand-gold" />
              <span className="truncate max-w-[120px]">{property.location}</span>
            </div>
            <span className="text-lg font-display font-bold text-white drop-shadow-lg">
              {property.price}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-brand-charcoal dark:text-white mb-1.5 leading-tight line-clamp-2 group-hover:text-brand-gold transition-colors">
          {property.name}
        </h3>

        {/* Features */}
        {property.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {property.features.slice(0, 3).map((feature, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-brand-gold/10 text-brand-gold text-[9px] font-semibold uppercase">
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] mt-auto text-gray-500 dark:text-gray-400">
          {property.beds && property.beds > 0 && (
            <div className="flex items-center gap-1">
              <Bed size={12} className="text-brand-gold/70" />
              <span className="text-[10px] font-semibold">{property.beds}</span>
            </div>
          )}
          {property.baths && property.baths > 0 && (
            <div className="flex items-center gap-1">
              <Bath size={12} className="text-brand-gold/70" />
              <span className="text-[10px] font-semibold">{property.baths}</span>
            </div>
          )}
          {property.area && (
            <div className="flex items-center gap-1">
              <Maximize size={12} className="text-brand-gold/70" />
              <span className="text-[10px] font-semibold">{property.area}</span>
            </div>
          )}
          <span className="ml-auto text-[9px] text-gray-400">{property.id}</span>
        </div>
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
        {/* Header - 2026 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
          <div>
            <span className="text-gradient-2026 text-xs font-bold uppercase tracking-[0.35em] mb-4 block">
              {total} Annonces
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display text-brand-charcoal dark:text-white mb-3">
              Nos <span className="text-gradient-2026 italic font-serif">Biens</span>
            </h2>
            <p className="text-brand-charcoal/60 dark:text-white/60 text-sm md:text-base font-light max-w-lg">
              Découvrez notre sélection de {activeTab === 'SALE' ? 'biens à vendre' : 'locations'} à Casablanca
            </p>
          </div>

          {/* Category Tabs - 2026 Glass */}
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="liquid-glass-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex relative">
              <div
                className={`absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 bg-gradient-to-r from-brand-primary to-cyan-400 rounded-lg sm:rounded-xl shadow-lg shadow-brand-primary/30 transition-all duration-400 ease-out ${
                  activeTab === 'SALE' ? 'left-1 sm:left-1.5 w-[calc(50%-4px)] sm:w-[calc(50%-6px)]' : 'left-[50%] w-[calc(50%-4px)] sm:w-[calc(50%-6px)]'
                }`}
              />
              <button
                onClick={() => handleTabChange('SALE')}
                className={`relative z-10 px-6 sm:px-8 py-3.5 sm:py-3 min-h-[44px] text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg sm:rounded-xl active:scale-95 ${
                  activeTab === 'SALE' ? 'text-black' : 'text-gray-500 dark:text-white/60 hover:text-brand-charcoal dark:hover:text-white'
                }`}
              >
                Vente
              </button>
              <button
                onClick={() => handleTabChange('RENT')}
                className={`relative z-10 px-6 sm:px-8 py-3.5 sm:py-3 min-h-[44px] text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg sm:rounded-xl active:scale-95 ${
                  activeTab === 'RENT' ? 'text-black' : 'text-gray-500 dark:text-white/60 hover:text-brand-charcoal dark:hover:text-white'
                }`}
              >
                Location
              </button>
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
            {/* Cards Grid - Staggered Entrance Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`grid-${activeTab}-${activeType}-${page}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
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
