import React, { memo } from 'react';

const images = [
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558661091-5cc1b64d0dc5?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1535025984711-2eb2d4803975?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590073242678-cfe2f792eb29?q=80&w=800&auto=format&fit=crop",
];

const GalleryImage = memo(({ src, index }: { src: string; index: number }) => (
  <div className="relative w-[350px] h-[450px] flex-shrink-0 rounded-lg overflow-hidden group shadow-lg">
    <img
      src={src}
      alt={`Gallery ${index}`}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
      loading="lazy"
      decoding="async"
    />
    <div className="absolute inset-0 bg-brand-charcoal/10 group-hover:bg-transparent transition-colors duration-500" />
    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <p className="text-white text-xs uppercase tracking-widest font-bold">Explore</p>
    </div>
  </div>
));

GalleryImage.displayName = 'GalleryImage';

const Gallery: React.FC = () => {
  // Double the images for seamless loop
  const allImages = [...images, ...images, ...images, ...images];

  return (
    <div className="py-24 bg-brand-cream border-t border-brand-charcoal/5 overflow-hidden">
      <div className="container mx-auto px-6 mb-12 flex justify-between items-end">
        <div>
          <span className="text-brand-terracotta text-xs font-bold uppercase tracking-[0.3em] mb-2 block">Lifestyle</span>
          <h3 className="text-3xl font-display text-brand-charcoal">Visual Journey</h3>
        </div>
        <p className="hidden md:block text-xs uppercase tracking-widest text-gray-500">@OurikaValley</p>
      </div>

      {/* CSS-only Infinite Scroll Strip - much better performance than JS animation */}
      <div className="relative w-full overflow-hidden py-4">
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
      `}</style>
    </div>
  );
};

export default memo(Gallery);
