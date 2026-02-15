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
      {/* Background Image - High Quality with Premium Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#050608] z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 z-10" />
        {/* Tiffany tint overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-tiffany/5 via-transparent to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2400&auto=format&fit=crop"
          alt="Luxury Real Estate Morocco"
          className="w-full h-full object-cover scale-105"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Premium Ambient Elements - 2026 Mesh Style */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {/* Primary Tiffany Glow */}
        <div className="absolute top-[15%] left-[5%] w-[500px] h-[500px] bg-gradient-radial from-brand-tiffany/25 via-brand-tiffany/10 to-transparent rounded-full blur-[150px] animate-float" />
        {/* Secondary Blue Accent */}
        <div className="absolute bottom-[20%] right-[0%] w-[600px] h-[600px] bg-gradient-radial from-blue-500/15 via-blue-600/5 to-transparent rounded-full blur-[180px]" />
        {/* Subtle Center Highlight */}
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[100px]" />
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-6xl px-6 flex flex-col items-center pt-24 md:pt-0">
        {/* Badge - 2026 Liquid Glass */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="liquid-glass-3 inline-flex items-center gap-3 px-6 py-3 rounded-full hover-glow cursor-default">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
            </span>
            <span className="text-xs md:text-sm text-white/95 font-semibold tracking-wide">
              Agence N°1 à Casablanca
            </span>
            <span className="hidden sm:inline-block w-1 h-1 bg-white/30 rounded-full" />
            <span className="hidden sm:inline text-xs text-brand-tiffany font-medium">
              2026
            </span>
          </div>
        </motion.div>

        {/* Title - Premium Typography 2026 */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <span className="block text-5xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-display text-white tracking-tight leading-[1.05] drop-shadow-2xl">
            Trouvez le bien
          </span>
          <span className="block text-5xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-display tracking-tight leading-[1.05] text-gradient-2026">
            de vos rêves
          </span>
        </motion.h1>

        {/* Subtitle - Refined */}
        <motion.p
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl lg:text-2xl text-white/75 text-center max-w-2xl mb-12 font-light leading-relaxed"
        >
          Vente, location et gestion de biens d'exception
          <span className="hidden md:inline"> à Casablanca et dans tout le Maroc</span>
          <span className="md:hidden"> au Maroc</span>
        </motion.p>

        {/* Search Bar - 2026 Liquid Glass */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-3xl"
        >
          <div className="relative group">
            {/* Animated Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-tiffany/50 via-cyan-400/30 to-brand-tiffany/50 rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition-all duration-500 animate-pulse-glow" />

            {/* Outer Glow Ring */}
            <div className="absolute -inset-[2px] bg-gradient-to-r from-brand-tiffany/20 via-transparent to-brand-tiffany/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Search Container - Premium Glass */}
            <div className="liquid-glass-hero relative rounded-3xl p-2.5 md:p-3" role="search">
              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="flex-1 flex items-center gap-4 px-5">
                  <div className="relative">
                    <Search size={24} className="text-white/50 group-hover:text-brand-tiffany transition-colors duration-300" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    placeholder="Quartier, type de bien, budget..."
                    className="w-full bg-transparent border-none outline-none text-white placeholder-white/50 text-base md:text-lg py-4 focus:placeholder-white/70 transition-all"
                    onFocus={scrollToListings}
                    aria-label="Rechercher un bien immobilier"
                  />
                </div>

                {/* Search Button - Premium 2026 */}
                <button
                  onClick={scrollToListings}
                  className="btn-primary-2026 flex items-center gap-2.5 px-7 md:px-10 py-4 md:py-5 rounded-2xl text-base font-bold"
                  aria-label="Lancer la recherche"
                >
                  <span className="hidden md:inline">Rechercher</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filters - 2026 Pills */}
          <nav className="flex flex-wrap justify-center gap-3 mt-8" aria-label="Filtres rapides">
            {QUICK_FILTERS.map((tag, i) => (
              <motion.button
                key={tag}
                initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.5 + (i * 0.05) }}
                onClick={scrollToListings}
                className="liquid-glass px-6 py-2.5 rounded-full text-white/80 text-sm font-medium hover:bg-white/[0.1] hover:border-brand-tiffany/40 hover:text-white hover:shadow-lg hover:shadow-brand-tiffany/10 transition-all duration-300"
                aria-label={`Voir les biens en ${tag.toLowerCase()}`}
              >
                {tag}
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {/* Stats - 2026 Glass Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-6 md:gap-8 mt-16 md:mt-24"
          role="region"
          aria-label="Statistiques de l'agence"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="liquid-glass-2 hover-lift group px-8 py-6 rounded-2xl text-center min-w-[140px] cursor-default"
                role="group"
                aria-label={stat.label}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon size={20} className="text-brand-tiffany opacity-70 group-hover:opacity-100 transition-opacity" />
                  <div className="text-3xl md:text-4xl font-display font-bold text-white group-hover:text-gradient-2026" aria-label={`${stat.value} ${stat.label}`}>
                    {stat.value}
                  </div>
                </div>
                <div className="text-sm text-white/60 font-medium group-hover:text-white/80 transition-colors">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Scroll Indicator - 2026 Premium */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20" aria-hidden="true">
        <div className={`liquid-glass w-8 h-14 rounded-full flex justify-center pt-3 ${prefersReducedMotion ? '' : 'motion-safe:animate-bounce'}`}>
          <div className="w-1.5 h-4 bg-gradient-to-b from-brand-tiffany to-white/20 rounded-full" />
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#050608] to-transparent z-10 pointer-events-none" />
    </section>
  );
};

export default memo(Hero);
