import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SectionId } from '../types';
import { Search, ArrowRight, ChevronDown, MapPin, Home, Building2, Key } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const fadeInUpReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

// Static data
const HERO_STATS = [
  { value: '500+', label: 'Biens Exclusifs', icon: Home },
  { value: '15+', label: 'Ans d\'Expertise', icon: Building2 },
  { value: '98%', label: 'Clients Satisfaits', icon: Key },
] as const;

const Hero: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const animationVariants = prefersReducedMotion ? fadeInUpReduced : fadeInUp;

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
      {/* ========================================
          BACKGROUND - Premium Real Estate Image
          ======================================== */}
      <div className="absolute inset-0">
        {/* High-quality luxury real estate image */}
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2400&auto=format&fit=crop"
          alt="Luxury Villa Morocco"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />

        {/* Premium gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />

        {/* Subtle blue tint overlay for brand consistency */}
        <div className="absolute inset-0 bg-brand-primary/5 mix-blend-overlay" />
      </div>

      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] left-[10%] w-[500px] h-[500px] bg-brand-gold/15 rounded-full blur-[200px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-brand-primary/20 rounded-full blur-[180px]" />
      </div>

      {/* ========================================
          MAIN CONTENT
          ======================================== */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-32">
        <div className="w-full max-w-5xl mx-auto">

          {/* Top Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <span className="text-sm text-white/90 font-medium tracking-wide">
                Agence Immobilière N°1 à Casablanca
              </span>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white tracking-tight leading-[1.1] mb-4">
              Votre Bien Idéal
              <br />
              <span className="bg-gradient-to-r from-brand-gold via-brand-primary-light to-brand-gold bg-clip-text text-transparent">
                Vous Attend
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
              Vente, location et gestion locative de biens d'exception au Maroc.
              <br className="hidden sm:block" />
              Une expertise de confiance depuis plus de 15 ans.
            </p>
          </motion.div>

          {/* Search Section */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={prefersReducedMotion ? fadeInUpReduced : scaleIn}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto mb-10"
          >
            {/* Main Search Bar */}
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-gold/30 via-brand-primary/20 to-brand-gold/30 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Search Container */}
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 bg-white/[0.08] backdrop-blur-2xl rounded-2xl border border-white/[0.15] p-2 sm:p-2">

                {/* Location Input */}
                <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-4">
                  <MapPin size={20} className="text-brand-gold shrink-0" />
                  <input
                    type="text"
                    placeholder="Ville, quartier ou adresse..."
                    className="w-full bg-transparent border-none outline-none text-white placeholder-white/50 text-base font-medium"
                    onFocus={scrollToListings}
                  />
                </div>

                {/* Divider (desktop only) */}
                <div className="hidden sm:block w-px h-10 bg-white/10" />

                {/* Property Type Selector */}
                <div className="flex items-center gap-2 px-4 py-3 sm:py-4">
                  <Home size={18} className="text-white/50" />
                  <select
                    className="bg-transparent text-white/80 text-sm font-medium outline-none cursor-pointer appearance-none pr-6"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpolyline points='6,9 12,15 18,9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center' }}
                  >
                    <option value="" className="bg-gray-900">Tous types</option>
                    <option value="appartement" className="bg-gray-900">Appartement</option>
                    <option value="villa" className="bg-gray-900">Villa</option>
                    <option value="bureau" className="bg-gray-900">Bureau</option>
                    <option value="terrain" className="bg-gray-900">Terrain</option>
                  </select>
                </div>

                {/* Search Button */}
                <button
                  onClick={scrollToListings}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-4 bg-gradient-to-r from-brand-gold to-brand-primary text-black font-bold text-sm rounded-xl hover:shadow-xl hover:shadow-brand-gold/30 active:scale-[0.98] transition-all duration-300"
                >
                  <Search size={18} />
                  <span>Rechercher</span>
                </button>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={scrollToListings}
                className="px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] text-white/80 text-sm font-medium hover:bg-white/[0.12] hover:text-white hover:border-brand-gold/30 active:scale-95 transition-all duration-300"
              >
                🏠 Acheter
              </button>
              <button
                onClick={scrollToListings}
                className="px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] text-white/80 text-sm font-medium hover:bg-white/[0.12] hover:text-white hover:border-brand-gold/30 active:scale-95 transition-all duration-300"
              >
                🔑 Louer
              </button>
              <button
                onClick={scrollToContact}
                className="px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] text-white/80 text-sm font-medium hover:bg-white/[0.12] hover:text-white hover:border-brand-gold/30 active:scale-95 transition-all duration-300"
              >
                📊 Estimer
              </button>
              <button
                onClick={scrollToContact}
                className="px-5 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/[0.1] text-white/80 text-sm font-medium hover:bg-white/[0.12] hover:text-white hover:border-brand-gold/30 active:scale-95 transition-all duration-300"
              >
                🏢 Gestion Locative
              </button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ========================================
          STATS BAR - Bottom
          ======================================== */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="relative z-10 w-full"
      >
        {/* Glass container */}
        <div className="mx-4 sm:mx-6 lg:mx-auto max-w-4xl mb-6 sm:mb-8">
          <div className="liquid-glass-2 rounded-2xl px-6 py-5 sm:px-8 sm:py-6">
            <div className="flex items-center justify-around gap-4 sm:gap-8">
              {HERO_STATS.map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <stat.icon size={20} className="text-brand-gold hidden sm:block" />
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white group-hover:text-brand-gold transition-colors">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-white/60 font-medium uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========================================
          SCROLL INDICATOR
          ======================================== */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={scrollToListings}
          className="flex flex-col items-center justify-center gap-2 p-3 text-white/50 hover:text-white/80 transition-colors group"
          aria-label="Voir les biens"
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">Découvrir</span>
          <ChevronDown size={20} className={`${prefersReducedMotion ? '' : 'animate-bounce'} group-hover:text-brand-gold transition-colors`} />
        </button>
      </div>
    </section>
  );
};

export default memo(Hero);
