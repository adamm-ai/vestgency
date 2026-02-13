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
    <section id={SectionId.SERVICES} className="py-28 relative overflow-hidden bg-[#F5F5F0] dark:bg-[#08090C] transition-colors duration-300">

      {/* Background Elements - Static */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[150px] pointer-events-none opacity-60" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Nos Services</span>
            <h2 className="text-4xl md:text-6xl font-display text-brand-charcoal dark:text-white mb-6">
              Un accompagnement <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-cyan-400 italic font-serif">sur mesure</span>
            </h2>
            <p className="text-brand-charcoal/60 dark:text-white/60 font-light leading-relaxed text-lg">
              De la recherche du bien idéal à la signature chez le notaire, nous vous accompagnons à chaque étape de votre projet immobilier avec expertise et bienveillance.
            </p>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-4">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-brand-charcoal/70 dark:text-white/70">
                <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent mb-16" />

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((item, idx) => (
            <div
              key={idx}
              className="group relative p-8 rounded-3xl bg-white dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] hover:border-brand-gold/30 dark:hover:border-brand-gold/30 shadow-lg dark:shadow-none transition-all duration-300 overflow-hidden"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Arrow Icon */}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight size={20} className="text-brand-gold" />
              </div>

              {/* Icon */}
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center text-brand-gold mb-6 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>

              {/* Content */}
              <h4 className="relative text-xl font-display font-semibold text-brand-charcoal dark:text-white mb-3 group-hover:text-brand-gold transition-colors duration-200">
                {item.title}
              </h4>
              <p className="relative text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                {item.description}
              </p>

              {/* Bottom Line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-gold to-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-20 relative rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal via-[#1a1a1f] to-brand-charcoal" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600')] bg-cover bg-center opacity-10" />

          {/* Content */}
          <div className="relative px-8 py-16 md:px-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-3xl md:text-4xl font-display text-white mb-4">
                Estimation <span className="text-brand-gold">gratuite</span> de votre bien
              </h3>
              <p className="text-white/60 font-light max-w-md">
                Obtenez une estimation précise basée sur les données du marché et notre expertise terrain.
              </p>
            </div>
            <button className="px-8 py-4 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl shadow-xl shadow-brand-gold/25 hover:shadow-brand-gold/40 hover:scale-105 active:scale-95 transition-all duration-200 whitespace-nowrap">
              Estimer mon bien
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
        </div>

      </div>
    </section>
  );
};

export default memo(Features);
