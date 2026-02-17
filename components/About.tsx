import React, { memo } from 'react';
import { SectionId } from '../types';

const About: React.FC = () => {
  return (
    <section id={SectionId.AGENCY} className="py-24 md:py-32 bg-brand-cream relative overflow-hidden">
      {/* Top transition for smooth dark-to-light */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-brand-void to-transparent opacity-10" />

      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* Image Composition */}
        <div className="relative order-2 md:order-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4 mt-12">
              <img
                src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop"
                alt="Moroccan Mosaic Detail"
                className="w-full h-64 object-cover rounded shadow-lg"
                loading="lazy"
              />
              <img
                src="https://images.unsplash.com/photo-1558661091-5cc1b64d0dc5?q=80&w=800&auto=format&fit=crop"
                alt="Marrakech Garden"
                className="w-full h-48 object-cover rounded shadow-lg"
                loading="lazy"
              />
            </div>
            <div className="space-y-4">
              <img
                src="https://images.unsplash.com/photo-1560130958-f46328bc6d88?q=80&w=800&auto=format&fit=crop"
                alt="Luxury Interior"
                className="w-full h-48 object-cover rounded shadow-lg"
                loading="lazy"
              />
              <img
                src="https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=800&auto=format&fit=crop"
                alt="Atlas Mountains"
                className="w-full h-64 object-cover rounded shadow-lg"
                loading="lazy"
              />
            </div>
          </div>

          {/* Subtle Back Glow */}
          <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#E6DCC3] rounded-full blur-3xl opacity-50" />
        </div>

        {/* Text Content */}
        <div className="order-1 md:order-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] w-12 bg-brand-terracotta" />
            <span className="text-brand-terracotta font-sans text-xs font-bold tracking-[0.2em] uppercase">
              The Agency
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-brand-charcoal mb-8 leading-[1.1]">
            Intelligence meets <br/> <span className="italic font-serif text-brand-olive">Heritage</span>
          </h2>

          <div className="prose prose-lg text-gray-600 font-sans font-light leading-relaxed mb-10">
            <p className="mb-6">
              <strong className="text-brand-gold font-medium">At Home</strong> n'est pas une simple agence immobilière; nous sommes une firme d'investissement intelligent au cœur de Casablanca.
            </p>
            <p>
              Located just steps from the Menara Mall, we bridge the gap between traditional Moroccan hospitality and cutting-edge asset management. Whether you are acquiring a historic Riad or developing land in Ourika, our AI-driven insights ensure your investment is secure.
            </p>
          </div>

          <div className="flex gap-16 border-t border-brand-charcoal/10 pt-8">
            <div>
              <h4 className="text-4xl font-display text-brand-gold mb-1">250+</h4>
              <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/70 font-bold">Properties Sold</p>
            </div>
            <div>
              <h4 className="text-4xl font-display text-brand-gold mb-1">12y</h4>
              <p className="text-[10px] uppercase tracking-widest text-brand-charcoal/70 font-bold">Market Expertise</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default memo(About);
