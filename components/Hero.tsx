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
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-12">
        <div className="w-full max-w-4xl mx-auto text-center">

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-brand-gold text-sm font-semibold tracking-[0.25em] uppercase mb-6"
          >
            Immobilier de Prestige
          </motion.p>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black text-white leading-tight mb-6"
          >
            Votre Bien Idéal <span className="text-brand-gold font-black">Vous Attend</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10"
          >
            Vente, location et gestion de biens d'exception au Maroc
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={scrollToListings}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold text-sm rounded-full hover:bg-white/90 transition-colors"
            >
              Voir nos biens
            </button>
            <button
              onClick={scrollToContact}
              className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold text-sm rounded-full border border-white/30 hover:bg-white/10 transition-colors"
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
        className="relative z-10 border-t border-white/10"
      >
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">500+</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Biens</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">15+</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Années</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">98%</div>
              <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Satisfaits</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default memo(Hero);
