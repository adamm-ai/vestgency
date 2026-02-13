import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Property } from '../types';
import {
  X, Bed, Bath, Maximize, MapPin, ExternalLink,
  ChevronLeft, ChevronRight, Phone, Share2, Heart,
  Tag, Sparkles
} from 'lucide-react';

interface PropertyModalProps {
  property: Property;
  onClose: () => void;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200';

const PropertyModal: React.FC<PropertyModalProps> = ({ property, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState<Set<number>>(new Set());
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter valid images once
  const images = useMemo(() => {
    if (property.images?.length > 0) {
      return property.images.filter(img =>
        img && !img.includes('logo') && !img.includes('footer')
      );
    }
    return [property.image];
  }, [property.images, property.image]);

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

  const currentImage = imageError.has(currentImageIndex) ? FALLBACK_IMAGE : images[currentImageIndex];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleBackdropClick}
    >
      <motion.div
        ref={modalRef}
        className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-[#0a0a0c] rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* Image Section */}
          <div className="relative w-full lg:w-3/5 h-64 lg:h-auto min-h-[300px] bg-gray-900">
            {/* Main Image */}
            <div className="relative w-full h-full">
              {!imagesLoaded.has(currentImageIndex) && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse" />
              )}
              <img
                src={currentImage}
                alt={property.name}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imagesLoaded.has(currentImageIndex) ? 'opacity-100' : 'opacity-0'
                }`}
                onError={() => handleImageError(currentImageIndex)}
                onLoad={() => handleImageLoad(currentImageIndex)}
              />
            </div>

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}

            {/* Category Badge */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase ${
                property.category === 'RENT' ? 'bg-emerald-500' : 'bg-blue-500'
              }`}>
                {property.category === 'RENT' ? 'Location' : 'Vente'}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/90 text-black text-xs font-bold uppercase">
                {property.type}
              </span>
            </div>

            {/* Thumbnail Strip - Only show first 6 */}
            {images.length > 1 && (
              <div className="absolute bottom-14 left-4 right-4 flex gap-2 overflow-x-auto no-scrollbar">
                {images.slice(0, 6).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
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
                  <div className="flex-shrink-0 w-16 h-12 rounded-lg bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                    +{images.length - 6}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="w-full lg:w-2/5 flex flex-col overflow-y-auto">
            <div className="p-6 flex-1">
              {/* Price */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-display font-bold text-brand-gold">
                  {property.price}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isLiked
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20'
                    }`}
                  >
                    <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-brand-charcoal dark:text-white mb-3 leading-tight">
                {property.name}
              </h2>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                <MapPin size={16} className="text-brand-gold" />
                <span>{property.location}, {property.city}</span>
              </div>

              {/* Reference */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Tag size={14} />
                <span>Réf: {property.id}</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {property.beds !== null && property.beds > 0 && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                    <Bed size={20} className="mx-auto mb-2 text-brand-gold" />
                    <p className="text-lg font-bold text-brand-charcoal dark:text-white">{property.beds}</p>
                    <p className="text-xs text-gray-500">Chambres</p>
                  </div>
                )}
                {property.baths !== null && property.baths > 0 && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                    <Bath size={20} className="mx-auto mb-2 text-brand-gold" />
                    <p className="text-lg font-bold text-brand-charcoal dark:text-white">{property.baths}</p>
                    <p className="text-xs text-gray-500">SDB</p>
                  </div>
                )}
                {property.areaNumeric !== null && property.areaNumeric > 0 && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                    <Maximize size={20} className="mx-auto mb-2 text-brand-gold" />
                    <p className="text-lg font-bold text-brand-charcoal dark:text-white">{property.areaNumeric}</p>
                    <p className="text-xs text-gray-500">m²</p>
                  </div>
                )}
              </div>

              {/* Features */}
              {property.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-brand-charcoal dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-brand-gold" />
                    Caractéristiques
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-brand-gold/10 text-brand-gold text-xs font-semibold">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Smart Tags */}
              {property.smartTags && property.smartTags.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {property.smartTags.map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-gold to-cyan-400 text-black text-xs font-bold flex items-center gap-1">
                        <Sparkles size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-brand-charcoal dark:text-white mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {property.description || 'Contactez-nous pour plus d\'informations sur ce bien.'}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <div className="flex gap-3">
                <a
                  href="tel:+212600000000"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-gold text-black font-semibold hover:bg-cyan-400 transition-colors"
                >
                  <Phone size={18} />
                  Appeler
                </a>
                <a
                  href={property.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-brand-gold text-brand-gold font-semibold hover:bg-brand-gold hover:text-black transition-colors"
                >
                  <ExternalLink size={18} />
                  Voir l'annonce
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default memo(PropertyModal);
