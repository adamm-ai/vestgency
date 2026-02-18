import React, { memo, useRef } from 'react';

const images = [
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558661091-5cc1b64d0dc5?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535025984711-2eb2d4803975?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590073242678-cfe2f792eb29?q=80&w=800&auto=format&fit=crop",
];

const GalleryImage = memo(({ src, index }: { src: string; index: number }) => (
  <div
    className="relative w-[280px] h-[360px] md:w-[350px] md:h-[450px] flex-shrink-0 rounded-ios-xl overflow-hidden group cursor-pointer
               transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
               active:scale-[0.98] snap-center
               shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.08)]
               dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.4)]"
  >
    <img
      src={src}
      alt={`Gallery ${index}`}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
      loading="lazy"
      decoding="async"
    />
    <div className="absolute inset-0 bg-brand-charcoal/10 group-hover:bg-transparent transition-colors duration-500" />
    <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 md:transition-opacity md:duration-300">
      <p className="text-white ios-caption uppercase tracking-widest font-bold">Explore</p>
    </div>
    {/* Touch feedback overlay */}
    <div className="absolute inset-0 bg-black/0 active:bg-black/10 transition-colors duration-150 pointer-events-none md:hidden" />
  </div>
));

GalleryImage.displayName = 'GalleryImage';

const Gallery: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Double the images for seamless loop on desktop
  const allImages = [...images, ...images, ...images, ...images];

  return (
    <div className="py-16 md:py-24 bg-brand-cream border-t border-brand-charcoal/5 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 mb-8 md:mb-12 flex justify-between items-end">
        <div>
          <span className="text-brand-terracotta ios-caption font-bold uppercase tracking-[0.3em] mb-2 block">Lifestyle</span>
          <h3 className="ios-large-title md:text-3xl font-display text-brand-charcoal">Visual Journey</h3>
        </div>
        <p className="hidden md:block ios-caption uppercase tracking-widest text-gray-500">@OurikaValley</p>
      </div>

      {/* Mobile: Swipeable horizontal scroll with snap */}
      <div
        ref={scrollRef}
        className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide
                   -webkit-overflow-scrolling-touch scroll-smooth
                   px-4 pb-4"
        style={{
          scrollPaddingLeft: '16px',
          scrollPaddingRight: '16px',
        }}
      >
        {images.map((src, index) => (
          <GalleryImage key={index} src={src} index={index} />
        ))}
      </div>

      {/* Desktop: CSS-only Infinite Scroll Strip */}
      <div className="hidden md:block relative w-full overflow-hidden py-4">
        <div
          className="flex gap-6 animate-scroll-gallery"
          style={{
            width: 'max-content',
          }}
        >
          {allImages.map((src, index) => (
            <GalleryImage key={index} src={src} index={index} />
          ))}
        </div>
      </div>

      {/* Mobile scroll indicator dots */}
      <div className="md:hidden flex justify-center gap-2 mt-4 px-4">
        {images.map((_, index) => (
          <div
            key={index}
            className="w-1.5 h-1.5 rounded-full bg-brand-charcoal/20 transition-colors duration-200"
          />
        ))}
      </div>

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes scroll-gallery {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-gallery {
          animation: scroll-gallery 60s linear infinite;
          will-change: transform;
        }
        .animate-scroll-gallery:hover {
          animation-play-state: paused;
        }

        /* iOS-style momentum scrolling */
        .-webkit-overflow-scrolling-touch {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
};

export default memo(Gallery);
