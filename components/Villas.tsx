import React, { memo } from 'react';
import { SectionId, Villa } from '../types';
import { PROPERTIES } from '../constants';
import { Bed, Bath, Maximize, ArrowRight, Zap } from 'lucide-react';

interface ListingCardProps {
  villa: Villa;
}

const ListingCard = memo<ListingCardProps>(({ villa }) => {
  return (
    <div className="group relative h-full">
      <div className="relative liquid-glass rounded-2xl overflow-hidden hover:shadow-[0_0_40px_rgba(10,186,181,0.1)] transition-all duration-500 h-full flex flex-col border border-white/5 hover:border-brand-gold/30">

        {/* Image Area */}
        <div className="relative h-72 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-transparent opacity-80 z-10" />
          <img
            src={villa.image}
            alt={villa.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
            decoding="async"
          />

          {/* AI Smart Tag */}
          {villa.smartTags && villa.smartTags.length > 0 && (
            <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
              {villa.smartTags.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded bg-brand-void/80 backdrop-blur-md border border-white/10 text-brand-gold text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                  <Zap size={10} className="fill-brand-gold" /> {tag}
                </span>
              ))}
            </div>
          )}

          <div className="absolute bottom-4 right-4 z-20">
            <span className="text-2xl font-display text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">{villa.price}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-[#0A0A0C] to-brand-void">
          <h3 className="text-xl font-display font-medium text-white mb-2 group-hover:text-brand-gold transition-colors duration-300">{villa.name}</h3>
          <p className="text-gray-400 text-sm line-clamp-2 mb-6 font-light leading-relaxed">{villa.description}</p>

          <div className="grid grid-cols-3 gap-2 py-4 border-t border-white/5 text-gray-300 mb-6">
            <div className="flex flex-col items-center gap-1.5">
              <Bed size={16} className="text-brand-gold/80" />
              <span className="text-[11px] uppercase tracking-wider font-medium">{villa.beds} Beds</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 border-l border-white/5">
              <Bath size={16} className="text-brand-gold/80" />
              <span className="text-[11px] uppercase tracking-wider font-medium">{villa.baths} Baths</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 border-l border-white/5">
              <Maximize size={16} className="text-brand-gold/80" />
              <span className="text-[11px] uppercase tracking-wider font-medium">{villa.area}</span>
            </div>
          </div>

          <button className="mt-auto w-full py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white hover:text-black text-white text-xs uppercase font-bold tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 group-hover:gap-4 shadow-lg">
            View Details <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});

ListingCard.displayName = 'ListingCard';

const Villas: React.FC = () => {
  return (
    <section id={SectionId.LISTINGS} className="py-32 relative bg-brand-void">
      {/* Subtle Separation Gradient */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0F1115] to-brand-void z-0" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-[1px] bg-brand-gold" />
              <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em]">Exclusive Portfolio</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-white">
              Curated <span className="text-white/30 italic font-serif">Listings</span>
            </h2>
          </div>

          <button className="hidden md:flex px-8 py-3 rounded-full border border-white/20 text-white hover:bg-brand-gold hover:border-brand-gold hover:text-black transition-all duration-300 uppercase text-xs font-bold tracking-widest items-center gap-2">
            Full Catalog <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PROPERTIES.map((villa) => (
            <ListingCard key={villa.id} villa={villa} />
          ))}
        </div>

        <div className="mt-12 md:hidden flex justify-center">
          <button className="px-8 py-3 rounded-full border border-white/20 text-white uppercase text-xs font-bold tracking-widest">
            View All Listings
          </button>
        </div>
      </div>
    </section>
  );
};

export default memo(Villas);
