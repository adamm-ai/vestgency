import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SectionId } from '../types';
import { Search, ArrowRight, MapPin, Building2, TrendingUp } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Static stats - no need to recalculate
const STATS = [
  { value: '822+', label: 'Biens disponibles', icon: Building2 },
  { value: '15+', label: 'Années d\'expertise', icon: TrendingUp },
  { value: '98%', label: 'Clients satisfaits', icon: MapPin },
];

const QUICK_FILTERS = ['Vente', 'Location', 'Neuf', 'Luxe'];

// Animation variants - defined once
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

// Reduced motion variants - instant transitions
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
    <section id={SectionId.HOME} className="relative min-h-[100dvh] w-full flex items-center justify-center overflow-hidden">
      {/* Background Image - Static, no parallax for performance */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#050608] z-10" />
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2400&auto=format&fit=crop"
          alt="Luxury Real Estate Morocco"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Static Background Elements - No infinite animations */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-brand-gold/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[30%] right-[5%] w-96 h-96 bg-blue-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-6xl px-6 flex flex-col items-center pt-24 md:pt-0">
        {/* Badge */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.1] shadow-2xl">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs md:text-sm text-white/90 font-medium">
              Agence N°1 à Casablanca
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-6"
        >
          <span className="block text-5xl md:text-7xl lg:text-8xl font-display text-white tracking-tight leading-[1.1]">
            Trouvez le bien
          </span>
          <span className="block text-5xl md:text-7xl lg:text-8xl font-display tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-cyan-400 to-brand-gold">
            de vos rêves
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/70 text-center max-w-2xl mb-10 font-light"
        >
          Vente, location et gestion de biens d'exception à Casablanca et dans tout le Maroc
        </motion.p>

        {/* Search Bar */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-3xl"
        >
          <div className="relative group">
            {/* Glow Effect - Static */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-gold/40 via-cyan-400/40 to-brand-gold/40 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />

            {/* Search Container */}
            <div className="relative bg-white/[0.08] backdrop-blur-2xl rounded-2xl p-2 border border-white/[0.1] shadow-2xl" role="search">
              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search size={22} className="text-white/40" aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Quartier, type de bien, budget..."
                    className="w-full bg-transparent border-none outline-none text-white placeholder-white/60 text-base md:text-lg py-4"
                    onFocus={scrollToListings}
                    aria-label="Rechercher un bien immobilier"
                  />
                </div>

                {/* Search Button */}
                <button
                  onClick={scrollToListings}
                  className="flex items-center gap-2 px-6 md:px-8 py-4 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-semibold rounded-xl shadow-lg shadow-brand-gold/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  aria-label="Lancer la recherche"
                >
                  <span className="hidden md:inline">Rechercher</span>
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <nav className="flex flex-wrap justify-center gap-3 mt-6" aria-label="Filtres rapides">
            {QUICK_FILTERS.map((tag, i) => (
              <motion.button
                key={tag}
                initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.5 + (i * 0.05) }}
                onClick={scrollToListings}
                className="px-5 py-2 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-white/70 text-sm font-medium hover:bg-white/[0.12] hover:border-brand-gold/30 hover:text-white transition-all duration-200"
                aria-label={`Voir les biens en ${tag.toLowerCase()}`}
              >
                {tag}
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 md:mt-20"
          role="region"
          aria-label="Statistiques de l'agence"
        >
          {STATS.map((stat, i) => (
            <div key={i} className="text-center" role="group" aria-label={stat.label}>
              <div className="text-3xl md:text-4xl font-display font-bold text-white mb-1" aria-label={`${stat.value} ${stat.label}`}>
                {stat.value}
              </div>
              <div className="text-sm text-white/70 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator - respects reduced motion preference */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20" aria-hidden="true">
        <div className={`w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2 ${prefersReducedMotion ? '' : 'motion-safe:animate-bounce'}`}>
          <div className="w-1.5 h-3 bg-white/40 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default memo(Hero);
