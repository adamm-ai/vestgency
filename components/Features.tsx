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

      <div className="container mx-auto px-4 sm:px-6 relative z-10">

        {/* Header - 2026 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-10">
          <div className="max-w-2xl">
            <span className="text-gradient-2026 text-xs font-bold uppercase tracking-[0.35em] mb-5 block">Nos Services</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-brand-charcoal dark:text-white mb-6 leading-tight">
              Un accompagnement <br />
              <span className="text-gradient-2026 italic font-serif">sur mesure</span>
            </h2>
            <p className="text-brand-charcoal/70 dark:text-white/60 font-light leading-relaxed text-lg max-w-xl">
              De la recherche du bien idéal à la signature chez le notaire, nous vous accompagnons à chaque étape de votre projet immobilier avec expertise et bienveillance.
            </p>
          </div>

          {/* Highlights - 2026 Glass Cards */}
          <div className="grid grid-cols-2 gap-3">
            {highlights.map((item, i) => (
              <div key={i} className="liquid-glass dark:liquid-glass-2 flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-brand-charcoal/80 dark:text-white/80 hover:border-brand-primary/30 transition-all duration-300">
                <CheckCircle2 size={18} className="text-brand-primary shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider - 2026 */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent mb-16 rounded-full" />

        {/* Services Grid - 2026 Glass Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {SERVICES.map((item, idx) => (
            <div
              key={idx}
              className="card-2026 group relative p-5 sm:p-8 hover-lift cursor-default"
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl" />

              {/* Arrow Icon */}
              <div className="absolute top-7 right-7 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-3 group-hover:translate-x-0">
                <ArrowUpRight size={22} className="text-brand-primary" />
              </div>

              {/* Icon - 2026 */}
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-transparent flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-brand-primary/20 transition-all duration-300">
                {item.icon}
                {/* Shine */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50" />
              </div>

              {/* Content */}
              <h4 className="relative text-xl font-display font-semibold text-brand-charcoal dark:text-white mb-3 group-hover:text-gradient-2026 transition-colors duration-300">
                {item.title}
              </h4>
              <p className="relative text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                {item.description}
              </p>

              {/* Bottom Line - 2026 */}
              <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-gradient-to-r from-brand-primary via-cyan-400 to-brand-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full" />
            </div>
          ))}
        </div>

        {/* CTA Banner - 2026 Premium Glass */}
        <div className="mt-24 relative rounded-[32px] overflow-hidden">
          {/* Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0f1012] to-[#0a0a0c]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600')] bg-cover bg-center opacity-[0.08]" />
          {/* Glass Overlay */}
          <div className="absolute inset-0 backdrop-blur-sm" />

          {/* Content */}
          <div className="relative px-5 py-12 sm:px-8 sm:py-16 md:px-20 md:py-24 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10">
            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-display text-white mb-5 leading-tight">
                Estimation <span className="text-gradient-2026">gratuite</span> de votre bien
              </h3>
              <p className="text-white/60 font-light max-w-lg text-lg">
                Obtenez une estimation précise basée sur les données du marché et notre expertise terrain.
              </p>
            </div>
            <button className="btn-primary-2026 px-8 sm:px-10 py-4 sm:py-5 min-h-[52px] text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl whitespace-nowrap animate-pulse-glow active:scale-[0.98] transition-transform">
              Estimer mon bien
            </button>
          </div>

          {/* Decorative Elements - 2026 */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-radial from-brand-primary/15 to-transparent rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-gradient-radial from-blue-500/10 to-transparent rounded-full blur-[80px] pointer-events-none" />
          {/* Border glow */}
          <div className="absolute inset-0 rounded-[32px] border border-brand-primary/20 pointer-events-none" />
        </div>

      </div>
    </section>
  );
};

export default memo(Features);
