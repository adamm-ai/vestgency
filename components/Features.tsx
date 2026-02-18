import React, { memo } from 'react';
import { SectionId } from '../types';
import { SERVICES } from '../constants';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';

const Features: React.FC = () => {
  const highlights = [
    "Plus de 500 transactions réussies",
    "Accompagnement personnalisé 7j/7",
    "Réseau d'experts qualifiés",
    "Garantie satisfaction client"
  ];

  return (
    <section id={SectionId.SERVICES} className="py-16 sm:py-24 md:py-32 relative overflow-hidden bg-[#F5F5F0] dark:bg-[#050608] transition-colors duration-300">

      {/* Background Elements - 2026 Mesh */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-brand-primary/10 via-brand-primary/5 to-transparent rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-blue-500/8 via-blue-600/3 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/[0.02] to-transparent rounded-full blur-[100px] pointer-events-none dark:block hidden" />

      <div className="container mx-auto px-5 sm:px-6 relative z-10">

        {/* Header - iOS Style */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 sm:mb-20 gap-8 sm:gap-10">
          <div className="max-w-2xl">
            <span className="text-gradient-2026 text-[13px] font-bold uppercase tracking-[0.35em] mb-4 sm:mb-5 block">Nos Services</span>
            <h2 className="text-[34px] sm:text-5xl lg:text-6xl font-display text-brand-charcoal dark:text-white mb-4 sm:mb-6 leading-[1.1] tracking-tight">
              Un accompagnement <br className="hidden sm:block" />
              <span className="text-gradient-2026 italic font-serif">sur mesure</span>
            </h2>
            <p className="text-brand-charcoal/70 dark:text-white/60 font-light leading-relaxed text-[15px] sm:text-lg max-w-xl">
              De la recherche du bien idéal à la signature chez le notaire, nous vous accompagnons à chaque étape de votre projet immobilier avec expertise et bienveillance.
            </p>
          </div>

          {/* Highlights - iOS Glass Cards with 8pt grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
            {highlights.map((item, i) => (
              <div
                key={i}
                className="liquid-glass dark:liquid-glass-2 flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-2xl text-[13px] sm:text-sm text-brand-charcoal/80 dark:text-white/80 hover:border-brand-primary/30 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.98]"
              >
                <CheckCircle2 size={18} className="text-brand-primary shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider - iOS Style */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent mb-12 sm:mb-16 rounded-full" />

        {/* Services Grid - iOS Glass Cards with spring animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {SERVICES.map((item, idx) => (
            <div
              key={idx}
              className="card-2026 group relative p-5 sm:p-8 rounded-2xl hover-lift cursor-default transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.98]"
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

              {/* Arrow Icon - with touch target */}
              <div className="absolute top-5 right-5 sm:top-7 sm:right-7 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] translate-x-2 group-hover:translate-x-0 w-11 h-11 flex items-center justify-center">
                <ArrowUpRight size={20} className="text-brand-primary" />
              </div>

              {/* Icon - iOS style with spring animation */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-transparent flex items-center justify-center text-brand-primary mb-5 sm:mb-6 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-brand-primary/20 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                {item.icon}
                {/* Shine */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50" />
              </div>

              {/* Content - iOS Typography */}
              <h4 className="relative text-[17px] sm:text-xl font-display font-semibold text-brand-charcoal dark:text-white mb-2 sm:mb-3 tracking-tight group-hover:text-gradient-2026 transition-colors duration-300">
                {item.title}
              </h4>
              <p className="relative text-[13px] sm:text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed font-light group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                {item.description}
              </p>

              {/* Bottom Line - iOS accent */}
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-brand-primary via-cyan-400 to-brand-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-left rounded-full" />
            </div>
          ))}
        </div>

        {/* CTA Banner - iOS Premium Glass */}
        <div className="mt-16 sm:mt-24 relative rounded-2xl sm:rounded-[32px] overflow-hidden">
          {/* Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0f1012] to-[#0a0a0c]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600')] bg-cover bg-center opacity-[0.08]" />
          {/* Glass Overlay */}
          <div className="absolute inset-0 backdrop-blur-sm" />

          {/* Content - iOS spacing */}
          <div className="relative px-5 py-10 sm:px-8 sm:py-16 md:px-20 md:py-24 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10">
            <div className="text-center md:text-left">
              <h3 className="text-[28px] sm:text-4xl lg:text-5xl font-display text-white mb-4 sm:mb-5 leading-[1.15] tracking-tight">
                Estimation <span className="text-gradient-2026">gratuite</span> de votre bien
              </h3>
              <p className="text-white/60 font-light max-w-lg text-[15px] sm:text-lg">
                Obtenez une estimation précise basée sur les données du marché et notre expertise terrain.
              </p>
            </div>
            <button className="btn-primary-2026 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 min-h-[50px] text-[15px] sm:text-base font-bold rounded-2xl whitespace-nowrap animate-pulse-glow active:scale-[0.96] transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] touch-target">
              Estimer mon bien
            </button>
          </div>

          {/* Decorative Elements - iOS style */}
          <div className="absolute top-0 right-0 w-60 sm:w-80 h-60 sm:h-80 bg-gradient-radial from-brand-primary/15 to-transparent rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 sm:w-60 h-48 sm:h-60 bg-gradient-radial from-blue-500/10 to-transparent rounded-full blur-[60px] sm:blur-[80px] pointer-events-none" />
          {/* Border glow */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-[32px] border border-brand-primary/20 pointer-events-none" />
        </div>

      </div>
    </section>
  );
};

export default memo(Features);
