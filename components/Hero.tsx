import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SectionId } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ArrowRight, Play } from 'lucide-react';

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
      {/* Background - Premium Modern Villa */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=100&w=3840&auto=format&fit=crop"
          alt="Villa de luxe moderne avec piscine"
          className="w-full h-full object-cover scale-105"
          loading="eager"
          fetchPriority="high"
        />
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
      </div>

      {/* Floating accent elements - Desktop only */}
      <div className="hidden lg:block absolute top-1/4 right-[10%] w-72 h-72 bg-brand-gold/10 rounded-full blur-[120px] animate-pulse" />
      <div className="hidden lg:block absolute bottom-1/4 left-[5%] w-96 h-96 bg-blue-500/5 rounded-full blur-[150px]" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center px-5 sm:px-6 md:px-12 lg:px-20 xl:px-32 py-20 sm:py-0">
        <div className="w-full max-w-6xl mx-auto">

          {/* Desktop: Left-aligned layout */}
          <div className="lg:max-w-3xl">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="inline-flex items-center gap-2 mb-6 lg:mb-8"
            >
              <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/90 text-xs sm:text-sm font-medium tracking-wide">
                <span className="inline-block w-2 h-2 bg-brand-gold rounded-full mr-2 animate-pulse" />
                Immobilier de Prestige au Maroc
              </span>
            </motion.div>

            {/* Title - Poppins Bold matching logo */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
              className="hero-title-bold text-[36px] min-[400px]:text-[42px] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] text-white leading-[1.05] mb-5 lg:mb-7"
            >
              Trouvez Votre
              <br />
              <span className="text-brand-gold">Bien Idéal</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              className="text-[15px] sm:text-lg md:text-xl lg:text-[22px] text-white/70 max-w-xl mb-8 lg:mb-10 leading-relaxed font-light"
            >
              Vente, location et gestion de biens d'exception.
              <span className="hidden sm:inline"> Découvrez notre sélection exclusive de propriétés haut de gamme.</span>
            </motion.p>

            {/* CTA Buttons - Desktop refined */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4"
            >
              <button
                onClick={scrollToListings}
                className="
                  group
                  w-full sm:w-auto
                  inline-flex items-center justify-center gap-2
                  px-7 py-4 lg:px-8 lg:py-[18px]
                  bg-brand-gold text-white
                  font-semibold text-[15px] lg:text-base
                  rounded-full
                  shadow-lg shadow-brand-gold/30
                  transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  hover:shadow-xl hover:shadow-brand-gold/40 hover:-translate-y-0.5 hover:bg-brand-primary-light
                  active:scale-[0.97]
                "
              >
                Découvrir nos biens
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={scrollToContact}
                className="
                  group
                  w-full sm:w-auto
                  inline-flex items-center justify-center gap-2
                  px-7 py-4 lg:px-8 lg:py-[18px]
                  bg-white/10 backdrop-blur-xl text-white
                  font-semibold text-[15px] lg:text-base
                  rounded-full
                  border border-white/20
                  transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  hover:bg-white/20 hover:border-white/30
                  active:scale-[0.97]
                "
              >
                <Play className="w-4 h-4" />
                Estimer mon bien
              </button>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Stats Bar - Desktop: Bottom right, Mobile: Bottom center */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 mx-4 mb-6 sm:mb-8 lg:absolute lg:bottom-10 lg:right-10 xl:right-20 lg:mx-0"
      >
        <div className="
          bg-black/40 backdrop-blur-2xl
          border border-white/10
          rounded-2xl lg:rounded-3xl
          px-6 py-5 lg:px-8 lg:py-6
          shadow-2xl shadow-black/30
        ">
          <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-8 lg:gap-10">
            <div className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight tabular-nums">500+</div>
              <div className="text-[10px] sm:text-[11px] lg:text-xs text-white/50 uppercase tracking-wider mt-1 font-medium">Biens</div>
            </div>
            <div className="w-px h-10 lg:h-12 bg-white/10" />
            <div className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight tabular-nums">15+</div>
              <div className="text-[10px] sm:text-[11px] lg:text-xs text-white/50 uppercase tracking-wider mt-1 font-medium">Années</div>
            </div>
            <div className="w-px h-10 lg:h-12 bg-white/10" />
            <div className="text-center lg:text-left">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight tabular-nums">98%</div>
              <div className="text-[10px] sm:text-[11px] lg:text-xs text-white/50 uppercase tracking-wider mt-1 font-medium">Satisfaits</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator - Desktop only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="hidden lg:flex absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" />
      </motion.div>
    </section>
  );
};

export default memo(Hero);
