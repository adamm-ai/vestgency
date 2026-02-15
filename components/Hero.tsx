import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SectionId } from '../types';
import { Search, ArrowRight, ChevronDown } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const fadeInUpReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 }
};

const Hero: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const animationVariants = prefersReducedMotion ? fadeInUpReduced : fadeInUp;

  const scrollToListings = useCallback(() => {
    document.getElementById(SectionId.LISTINGS)?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }, [prefersReducedMotion]);

  return (
    <section
      id={SectionId.HOME}
      className="relative min-h-[100dvh] w-full flex flex-col overflow-hidden bg-black"
    >
      {/* ========================================
          BACKGROUND LAYERS
          ======================================== */}

      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2400&auto=format&fit=crop"
          alt="Luxury Real Estate Morocco"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-brand-tiffany/20 rounded-full blur-[180px]" />
        <div className="absolute bottom-[20%] right-[5%] w-[350px] h-[350px] bg-blue-500/15 rounded-full blur-[150px]" />
      </div>

      {/* ========================================
          MAIN CONTENT - Centered & Clean
          ======================================== */}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-32">
        <div className="w-full max-w-4xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.1]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <span className="text-xs text-white/90 font-medium tracking-wide">
                Agence N°1 à Casablanca
              </span>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display text-white tracking-tight leading-[1.1]">
              Trouvez le bien
            </span>
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display tracking-tight leading-[1.1] bg-gradient-to-r from-brand-tiffany via-cyan-300 to-brand-tiffany bg-clip-text text-transparent">
              de vos rêves
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-white/60 max-w-xl mx-auto mb-10 font-light leading-relaxed"
          >
            Vente, location et gestion de biens d'exception à Casablanca et dans tout le Maroc
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-2xl mx-auto mb-8"
          >
            <div className="relative group">
              {/* Glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-tiffany/40 via-cyan-400/30 to-brand-tiffany/40 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />

              {/* Search Container */}
              <div className="relative flex items-center bg-white/[0.06] backdrop-blur-2xl rounded-2xl border border-white/[0.1] p-1.5">
                <div className="flex-1 flex items-center gap-3 px-4 py-3">
                  <Search size={20} className="text-white/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="Quartier, type de bien, budget..."
                    className="w-full bg-transparent border-none outline-none text-white placeholder-white/40 text-base"
                    onFocus={scrollToListings}
                  />
                </div>
                <button
                  onClick={scrollToListings}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-tiffany to-cyan-400 text-black font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-brand-tiffany/30 transition-all duration-300"
                >
                  <span className="hidden sm:inline">Rechercher</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Filters */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2 sm:gap-3"
          >
            {['Vente', 'Location', 'Neuf', 'Luxe'].map((tag) => (
              <button
                key={tag}
                onClick={scrollToListings}
                className="px-4 sm:px-5 py-2 rounded-full bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] text-white/70 text-sm font-medium hover:bg-white/[0.1] hover:text-white hover:border-brand-tiffany/30 transition-all duration-300"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ========================================
          STATS BAR - Bottom Fixed
          ======================================== */}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative z-10 w-full border-t border-white/[0.06]"
      >
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-8 sm:gap-12 md:gap-20">
            {[
              { value: '822+', label: 'Biens disponibles' },
              { value: '15+', label: 'Années d\'expertise' },
              { value: '98%', label: 'Clients satisfaits' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-white/50 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ========================================
          SCROLL INDICATOR
          ======================================== */}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={scrollToListings}
          className="flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          aria-label="Voir les biens"
        >
          <span className="text-xs font-medium tracking-wider uppercase">Découvrir</span>
          <ChevronDown size={20} className={prefersReducedMotion ? '' : 'animate-bounce'} />
        </button>
      </div>
    </section>
  );
};

export default memo(Hero);
