import React, { memo } from 'react';
import { SectionId } from '../types';

const About: React.FC = () => {
  return (
    <section id={SectionId.AGENCY} className="py-16 sm:py-24 md:py-32 bg-brand-cream relative overflow-hidden">
      {/* Top transition for smooth dark-to-light */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-brand-void to-transparent opacity-10" />

      <div className="container mx-auto px-5 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 lg:gap-24 items-center">

        {/* Image Composition - iOS style with spring animations */}
        <div className="relative order-2 md:order-1">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-3 sm:space-y-4 mt-8 sm:mt-12">
              <img
                src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop"
                alt="Moroccan Mosaic Detail"
                className="w-full h-48 sm:h-64 object-cover rounded-2xl shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] hover:shadow-xl"
                loading="lazy"
              />
              <img
                src="https://images.unsplash.com/photo-1558661091-5cc1b64d0dc5?q=80&w=800&auto=format&fit=crop"
                alt="Marrakech Garden"
                className="w-full h-36 sm:h-48 object-cover rounded-2xl shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] hover:shadow-xl"
                loading="lazy"
              />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <img
                src="https://images.unsplash.com/photo-1560130958-f46328bc6d88?q=80&w=800&auto=format&fit=crop"
                alt="Luxury Interior"
                className="w-full h-36 sm:h-48 object-cover rounded-2xl shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] hover:shadow-xl"
                loading="lazy"
              />
              <img
                src="https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=800&auto=format&fit=crop"
                alt="Atlas Mountains"
                className="w-full h-48 sm:h-64 object-cover rounded-2xl shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.02] hover:shadow-xl"
                loading="lazy"
              />
            </div>
          </div>

          {/* Subtle Back Glow */}
          <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#E6DCC3] rounded-full blur-3xl opacity-50" />
        </div>

        {/* Text Content - iOS Typography */}
        <div className="order-1 md:order-2">
          <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div className="h-[2px] w-10 sm:w-12 bg-brand-terracotta" />
            <span className="text-brand-terracotta font-sans text-[13px] font-bold tracking-[0.2em] uppercase">
              The Agency
            </span>
          </div>

          <h2 className="text-[34px] sm:text-5xl lg:text-6xl font-display text-brand-charcoal mb-6 sm:mb-8 leading-[1.1] tracking-tight">
            Intelligence meets <br className="hidden sm:block" /> <span className="italic font-serif text-brand-olive">Heritage</span>
          </h2>

          <div className="prose prose-lg text-gray-600 font-sans font-light leading-relaxed mb-8 sm:mb-10">
            <p className="mb-5 sm:mb-6 text-[15px] sm:text-lg">
              <strong className="text-brand-gold font-medium">At Home</strong> n'est pas une simple agence immobilière; nous sommes une firme d'investissement intelligent au coeur de Casablanca.
            </p>
            <p className="text-[15px] sm:text-lg">
              Located just steps from the Menara Mall, we bridge the gap between traditional Moroccan hospitality and cutting-edge asset management. Whether you are acquiring a historic Riad or developing land in Ourika, our AI-driven insights ensure your investment is secure.
            </p>
          </div>

          {/* Stats - iOS style with 8pt grid */}
          <div className="flex gap-10 sm:gap-16 border-t border-brand-charcoal/10 pt-6 sm:pt-8">
            <div className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105">
              <h4 className="text-[34px] sm:text-4xl font-display text-brand-gold mb-1 tracking-tight">250+</h4>
              <p className="text-[11px] sm:text-[12px] uppercase tracking-widest text-brand-charcoal/70 font-bold">Properties Sold</p>
            </div>
            <div className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105">
              <h4 className="text-[34px] sm:text-4xl font-display text-brand-gold mb-1 tracking-tight">12y</h4>
              <p className="text-[11px] sm:text-[12px] uppercase tracking-widest text-brand-charcoal/70 font-bold">Market Expertise</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default memo(About);
