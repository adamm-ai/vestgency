import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Property } from '../types';
import {
  X, Bed, Bath, Maximize, MapPin, ExternalLink,
  ChevronLeft, ChevronRight, Phone, Share2, Heart,
  Tag, Sparkles, MessageCircle
} from 'lucide-react';

interface PropertyModalProps {
  property: Property;
  onClose: () => void;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200';

// Detect if on mobile
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const PropertyModal: React.FC<PropertyModalProps> = ({ property, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState<Set<number>>(new Set());
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());
  const [isScrolled, setIsScrolled] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Pull-to-dismiss motion values
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0.5]);
  const scale = useTransform(y, [0, 300], [1, 0.95]);

  // Touch swipe for image gallery
  const imageX = useMotionValue(0);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // Filter valid images once
  const images = useMemo(() => {
    if (property.images?.length > 0) {
      return property.images.filter(img =>
        img && !img.includes('logo') && !img.includes('footer')
      );
    }
    return [property.image];
  }, [property.images, property.image]);

  // Handle scroll for glass morphism header
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const handleScroll = () => {
      setIsScrolled(content.scrollTop > 20);
    };

    content.addEventListener('scroll', handleScroll, { passive: true });
    return () => content.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
          break;
        case 'ArrowRight':
          setCurrentImageIndex(prev => (prev + 1) % images.length);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, images.length]);

  // Prevent body scroll
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Preload adjacent images
  useEffect(() => {
    const preloadIndexes = [
      currentImageIndex,
      (currentImageIndex + 1) % images.length,
      (currentImageIndex - 1 + images.length) % images.length
    ];

    preloadIndexes.forEach(index => {
      if (!imagesLoaded.has(index)) {
        const img = new Image();
        img.src = images[index];
        img.onload = () => {
          setImagesLoaded(prev => new Set(prev).add(index));
        };
      }
    });
  }, [currentImageIndex, images, imagesLoaded]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleImageError = useCallback((index: number) => {
    setImageError(prev => new Set(prev).add(index));
  }, []);

  const handleImageLoad = useCallback((index: number) => {
    setImagesLoaded(prev => new Set(prev).add(index));
  }, []);

  // Pull-to-dismiss handler
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  }, [onClose]);

  // Image swipe handler
  const handleImageDragEnd = useCallback((event: any, info: PanInfo) => {
    setIsDraggingImage(false);
    const swipeThreshold = 50;
    const velocityThreshold = 200;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      nextImage();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      prevImage();
    }
  }, [nextImage, prevImage]);

  const currentImage = imageError.has(currentImageIndex) ? FALLBACK_IMAGE : images[currentImageIndex];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/60 md:bg-black/80 ios-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleBackdropClick}
    >
      <motion.div
        ref={modalRef}
        className="relative w-full md:max-w-5xl h-[95vh] md:h-auto md:max-h-[90vh] bg-white dark:bg-[#1c1c1e] md:rounded-2xl rounded-t-[20px] overflow-hidden shadow-2xl"
        style={{ y: isMobile ? y : 0, opacity: isMobile ? opacity : 1, scale: isMobile ? scale : 1 }}
        initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
          mass: 0.8
        }}
        drag={isMobile ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={handleDragEnd}
      >
        {/* iOS Pull-to-dismiss indicator (mobile only) */}
        <div className="md:hidden flex justify-center pt-2 pb-1 bg-white dark:bg-[#1c1c1e] sticky top-0 z-50">
          <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Glass morphism header when scrolled (mobile only) */}
        <div
          className={`md:hidden absolute top-0 left-0 right-0 z-40 transition-all duration-300 ${
            isScrolled
              ? 'ios-navbar border-b border-gray-200/50 dark:border-white/10'
              : 'bg-transparent'
          }`}
          style={{ height: isScrolled ? '56px' : '0px', opacity: isScrolled ? 1 : 0 }}
        >
          <div className="flex items-center justify-between h-full px-4">
            <span className="ios-headline text-brand-charcoal dark:text-white truncate max-w-[200px]">
              {property.name}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Close Button - Desktop only */}
        <button
          onClick={onClose}
          className="hidden md:flex absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white items-center justify-center transition-colors touch-target"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row h-full md:max-h-[90vh]">
          {/* Image Section with swipe gestures */}
          <div className="relative w-full md:w-3/5 h-72 md:h-auto min-h-[280px] md:min-h-[300px] bg-gray-900 flex-shrink-0">
            {/* Main Image with swipe */}
            <motion.div
              className="relative w-full h-full overflow-hidden touch-pan-y"
              drag={images.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsDraggingImage(true)}
              onDragEnd={handleImageDragEnd}
              style={{ x: imageX }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {!imagesLoaded.has(currentImageIndex) && (
                    <div className="absolute inset-0 skeleton" />
                  )}
                  <img
                    src={currentImage}
                    alt={property.name}
                    className={`w-full h-full object-cover transition-opacity duration-200 ${
                      imagesLoaded.has(currentImageIndex) ? 'opacity-100' : 'opacity-0'
                    }`}
                    onError={() => handleImageError(currentImageIndex)}
                    onLoad={() => handleImageLoad(currentImageIndex)}
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Image Navigation - Hidden on mobile, using swipe instead */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white items-center justify-center transition-colors touch-target"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white items-center justify-center transition-colors touch-target"
                >
                  <ChevronRight size={24} />
                </button>

                {/* iOS-style dot indicators (mobile) / Counter (desktop) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex md:hidden items-center gap-1.5">
                  {images.slice(0, 8).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        currentImageIndex === index
                          ? 'bg-white w-6'
                          : 'bg-white/50'
                      }`}
                    />
                  ))}
                  {images.length > 8 && (
                    <span className="text-white/70 text-xs ml-1">+{images.length - 8}</span>
                  )}
                </div>
                <div className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white ios-footnote">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}

            {/* Category Badge */}
            <div className="absolute top-4 left-4 flex gap-2 safe-area-top">
              <span className={`px-3 py-1.5 rounded-ios-md text-white ios-caption font-bold uppercase ${
                property.category === 'RENT' ? 'bg-emerald-500' : 'bg-brand-gold'
              }`}>
                {property.category === 'RENT' ? 'Location' : 'Vente'}
              </span>
              <span className="px-3 py-1.5 rounded-ios-md bg-white/90 dark:bg-black/70 text-black dark:text-white ios-caption font-bold uppercase backdrop-blur-sm">
                {property.type}
              </span>
            </div>

            {/* Thumbnail Strip - Desktop only */}
            {images.length > 1 && (
              <div className="hidden md:flex absolute bottom-14 left-4 right-4 gap-2 overflow-x-auto no-scrollbar">
                {images.slice(0, 6).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-12 rounded-ios-sm overflow-hidden border-2 transition-all touch-target ${
                      currentImageIndex === index
                        ? 'border-brand-gold'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imageError.has(index) ? FALLBACK_IMAGE : img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(index)}
                      loading="lazy"
                    />
                  </button>
                ))}
                {images.length > 6 && (
                  <div className="flex-shrink-0 w-16 h-12 rounded-ios-sm bg-black/50 flex items-center justify-center text-white ios-caption font-bold">
                    +{images.length - 6}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div
            ref={contentRef}
            className="w-full md:w-2/5 flex flex-col overflow-y-auto momentum-scroll flex-1"
          >
            <div className="p-4 md:p-6 flex-1 space-y-4">
              {/* Price & Actions Row */}
              <div className="flex items-center justify-between">
                <span className="text-2xl md:text-3xl font-display font-bold text-brand-gold ios-large-title">
                  {property.price}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all touch-target active:scale-95 ${
                      isLiked
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20'
                    }`}
                  >
                    <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                  <button className="w-11 h-11 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors touch-target active:scale-95">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h2 className="ios-headline text-lg md:text-xl text-brand-charcoal dark:text-white leading-tight">
                {property.name}
              </h2>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 ios-subheadline">
                <MapPin size={16} className="text-brand-gold flex-shrink-0" />
                <span>{property.location}, {property.city}</span>
              </div>

              {/* Reference */}
              <div className="flex items-center gap-2 ios-caption text-gray-400">
                <Tag size={14} />
                <span>Ref: {property.id}</span>
              </div>

              {/* Stats Grid - Mobile optimized with 8pt grid */}
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {property.beds !== null && property.beds > 0 && (
                  <div className="p-3 md:p-4 rounded-ios-lg bg-gray-50 dark:bg-white/5 text-center">
                    <Bed size={20} className="mx-auto mb-1.5 text-brand-gold" />
                    <p className="ios-headline text-brand-charcoal dark:text-white">{property.beds}</p>
                    <p className="ios-caption-2 text-gray-500">Chambres</p>
                  </div>
                )}
                {property.baths !== null && property.baths > 0 && (
                  <div className="p-3 md:p-4 rounded-ios-lg bg-gray-50 dark:bg-white/5 text-center">
                    <Bath size={20} className="mx-auto mb-1.5 text-brand-gold" />
                    <p className="ios-headline text-brand-charcoal dark:text-white">{property.baths}</p>
                    <p className="ios-caption-2 text-gray-500">SDB</p>
                  </div>
                )}
                {property.areaNumeric !== null && property.areaNumeric > 0 && (
                  <div className="p-3 md:p-4 rounded-ios-lg bg-gray-50 dark:bg-white/5 text-center">
                    <Maximize size={20} className="mx-auto mb-1.5 text-brand-gold" />
                    <p className="ios-headline text-brand-charcoal dark:text-white">{property.areaNumeric}</p>
                    <p className="ios-caption-2 text-gray-500">m2</p>
                  </div>
                )}
              </div>

              {/* Features */}
              {property.features.length > 0 && (
                <div>
                  <h3 className="ios-footnote font-semibold text-brand-charcoal dark:text-white mb-2 flex items-center gap-2">
                    <Sparkles size={14} className="text-brand-gold" />
                    Caracteristiques
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-ios-full bg-brand-gold/10 text-brand-gold ios-caption font-semibold">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart Tags */}
              {property.smartTags && property.smartTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {property.smartTags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-ios-full bg-gradient-to-r from-brand-gold to-cyan-400 text-black ios-caption font-bold flex items-center gap-1">
                      <Sparkles size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="ios-footnote font-semibold text-brand-charcoal dark:text-white mb-2">Description</h3>
                <p className="ios-body text-gray-600 dark:text-gray-400 leading-relaxed">
                  {property.description || 'Contactez-nous pour plus d\'informations sur ce bien.'}
                </p>
              </div>
            </div>

            {/* Footer Actions - Touch-friendly with safe area */}
            <div className="p-4 md:p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm safe-area-bottom sticky bottom-0">
              <div className="flex gap-3">
                <a
                  href="tel:+212600000000"
                  className="flex-1 flex items-center justify-center gap-2 py-4 md:py-3 rounded-ios-lg bg-brand-gold text-black ios-headline hover:bg-brand-primary-light transition-colors touch-target active:scale-[0.98]"
                >
                  <Phone size={20} />
                  Appeler
                </a>
                <a
                  href={`https://wa.me/212600000000?text=Bonjour, je suis intéressé par: ${property.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-4 md:py-3 rounded-ios-lg bg-[#25D366] text-white ios-headline hover:bg-[#20BD5A] transition-colors touch-target active:scale-[0.98]"
                >
                  <MessageCircle size={20} />
                  WhatsApp
                </a>
              </div>
              <a
                href={property.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 py-4 md:py-3 rounded-ios-lg border-2 border-brand-gold text-brand-gold ios-headline hover:bg-brand-gold hover:text-black transition-colors touch-target active:scale-[0.98] w-full"
              >
                <ExternalLink size={20} />
                Voir l'annonce complete
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default memo(PropertyModal);
