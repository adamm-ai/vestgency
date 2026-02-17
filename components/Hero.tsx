import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SectionId } from '../types';
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
      className="relative min-h-[100dvh] w-full flex flex-col"
    >
      {/* Background - 4K Villa with Pool */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=100&w=3840&auto=format&fit=crop"
          alt="Villa de luxe avec piscine au Maroc"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-16 sm:py-0">
        <div className="w-full max-w-4xl mx-auto text-center">

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-brand-gold text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-4 sm:mb-6"
          >
            Immobilier de Prestige
          </motion.p>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[1.75rem] min-[400px]:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-white leading-[1.15] mb-4 sm:mb-6"
          >
            Votre Bien Idéal{' '}
            <span className="text-brand-gold block sm:inline">Vous Attend</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-white/70 max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10 px-2 sm:px-0 leading-relaxed"
          >
            Vente, location et gestion de biens d'exception au Maroc
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-sm sm:max-w-none mx-auto"
          >
            <button
              onClick={scrollToListings}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-black font-semibold text-sm rounded-full hover:bg-white/90 active:scale-[0.98] transition-all"
            >
              Voir nos biens
            </button>
            <button
              onClick={scrollToContact}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-transparent text-white font-semibold text-sm rounded-full border border-white/30 hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              Nous contacter
            </button>
          </motion.div>

        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            <div>
              <div className="text-lg min-[400px]:text-xl sm:text-3xl font-bold text-white">500+</div>
              <div className="text-[10px] min-[400px]:text-xs text-white/60 uppercase tracking-wider mt-0.5 sm:mt-1">Biens</div>
            </div>
            <div>
              <div className="text-lg min-[400px]:text-xl sm:text-3xl font-bold text-white">15+</div>
              <div className="text-[10px] min-[400px]:text-xs text-white/60 uppercase tracking-wider mt-0.5 sm:mt-1">Années</div>
            </div>
            <div>
              <div className="text-lg min-[400px]:text-xl sm:text-3xl font-bold text-white">98%</div>
              <div className="text-[10px] min-[400px]:text-xs text-white/60 uppercase tracking-wider mt-0.5 sm:mt-1">Satisfaits</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default memo(Hero);
