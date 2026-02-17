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
      <div className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-6 md:px-8 lg:px-12 py-20 sm:py-0">
        <div className="w-full max-w-4xl mx-auto text-center">

          {/* Tagline - iOS caption style */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-brand-gold text-[11px] sm:text-xs font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4 sm:mb-5"
          >
            Immobilier de Prestige
          </motion.p>

          {/* Title - iOS large title with refined mobile sizing */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-[32px] min-[400px]:text-[38px] sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-[1.1] tracking-[-0.02em] mb-4 sm:mb-5"
          >
            Votre Bien Idéal{' '}
            <span className="text-brand-gold block sm:inline mt-1 sm:mt-0">Vous Attend</span>
          </motion.h1>

          {/* Subtitle - iOS body style */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-[15px] sm:text-lg md:text-xl text-white/70 max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed tracking-[-0.01em]"
          >
            Vente, location et gestion de biens d'exception au Maroc
          </motion.p>

          {/* CTA Buttons - iOS-style with spring animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm sm:max-w-none mx-auto"
          >
            <button
              onClick={scrollToListings}
              className="
                w-full sm:w-auto
                px-7 py-[14px] sm:py-4
                bg-white text-black
                font-semibold text-[15px] sm:text-base
                rounded-full
                shadow-lg shadow-white/20
                transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                hover:shadow-xl hover:shadow-white/30 hover:-translate-y-0.5
                active:scale-[0.96] active:shadow-md
              "
            >
              Voir nos biens
            </button>
            <button
              onClick={scrollToContact}
              className="
                w-full sm:w-auto
                px-7 py-[14px] sm:py-4
                bg-white/10 backdrop-blur-xl text-white
                font-semibold text-[15px] sm:text-base
                rounded-full
                border border-white/20
                transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                hover:bg-white/20 hover:border-white/30
                active:scale-[0.96]
              "
            >
              Nous contacter
            </button>
          </motion.div>

        </div>
      </div>

      {/* Stats - iOS-style glass card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 mx-4 sm:mx-auto mb-8 sm:mb-0 sm:absolute sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2"
      >
        <div className="
          bg-black/30 backdrop-blur-2xl
          border border-white/10
          rounded-2xl sm:rounded-[20px]
          px-6 py-5 sm:px-10 sm:py-6
          shadow-2xl shadow-black/20
        ">
          <div className="flex items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">500+</div>
              <div className="text-[10px] sm:text-[11px] text-white/50 uppercase tracking-wider mt-1 font-medium">Biens</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">15+</div>
              <div className="text-[10px] sm:text-[11px] text-white/50 uppercase tracking-wider mt-1 font-medium">Années</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight tabular-nums">98%</div>
              <div className="text-[10px] sm:text-[11px] text-white/50 uppercase tracking-wider mt-1 font-medium">Satisfaits</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default memo(Hero);
