import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SectionId } from '../types';
import { ChevronDown, Play } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const Hero: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  const scrollToListings = useCallback(() => {
    document.getElementById(SectionId.LISTINGS)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }, [prefersReducedMotion]);

  const scrollToContact = useCallback(() => {
    document.getElementById(SectionId.CONTACT)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }, [prefersReducedMotion]);

  return (
    <section
      id={SectionId.HOME}
      className="relative min-h-[100dvh] w-full flex flex-col overflow-hidden"
    >
      {/* Background Image - Luxury Moroccan Property */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2400&auto=format&fit=crop"
          alt="Luxury Property"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-12 pt-24 pb-32">
        <div className="w-full max-w-4xl mx-auto text-center">

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-brand-gold text-sm sm:text-base font-semibold tracking-[0.3em] uppercase mb-6"
          >
            Immobilier de Prestige
          </motion.p>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] mb-6"
          >
            Votre Bien Idéal <span className="text-brand-gold">Vous Attend</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 font-light"
          >
            Vente, location et gestion de biens d'exception
            <br className="hidden sm:block" />
            à Casablanca, Marrakech, Rabat et Tanger
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={scrollToListings}
              className="w-full sm:w-auto px-8 py-4 bg-brand-gold text-black font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-brand-gold/90 active:scale-[0.98] transition-all"
            >
              Voir nos biens
            </button>
            <button
              onClick={scrollToContact}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-sm uppercase tracking-wider rounded-lg border border-white/20 hover:bg-white/20 active:scale-[0.98] transition-all"
            >
              Nous contacter
            </button>
          </motion.div>

        </div>
      </div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative z-10 border-t border-white/10"
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-display font-bold text-white mb-1">500+</div>
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider">Biens</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-display font-bold text-white mb-1">15+</div>
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider">Années</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-display font-bold text-white mb-1">98%</div>
              <div className="text-xs sm:text-sm text-white/50 uppercase tracking-wider">Satisfaits</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={scrollToListings}
          className="flex flex-col items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
          aria-label="Voir les biens"
        >
          <ChevronDown size={24} className={prefersReducedMotion ? '' : 'animate-bounce'} />
        </button>
      </div>
    </section>
  );
};

export default memo(Hero);
