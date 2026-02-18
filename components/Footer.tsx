import React, { useCallback, memo } from 'react';
import { SectionId } from '../types';
import { ArrowRight, Facebook, Instagram, Linkedin, Twitter, MapPin, Phone, Mail, Shield } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Static data - extracted to avoid re-creation on render
const FOOTER_NAVIGATION = [
  { label: 'Accueil', id: SectionId.HOME },
  { label: 'Nos Biens', id: SectionId.LISTINGS },
  { label: 'Services', id: SectionId.SERVICES },
  { label: 'Actualités', id: SectionId.BLOG },
  { label: 'Contact', id: SectionId.CONTACT },
] as const;

const FOOTER_SERVICES = [
  'Vente Immobilière',
  'Location & Gestion',
  'Conseil Investissement',
  'Estimation Gratuite',
  'Accompagnement Juridique',
  'Programmes Neufs',
] as const;

const SOCIAL_LINKS = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Twitter, href: '#', label: 'Twitter' },
] as const;

// iOS spring easing for animations
const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const SocialLink = memo(({ icon: Icon, href, label }: { icon: React.ElementType; href: string; label: string }) => (
  <a
    href={href}
    className="liquid-glass w-11 h-11 min-w-[44px] min-h-[44px] rounded-ios-md flex items-center justify-center text-white/60 hover:text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary/30 hover:scale-110 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95 active:text-brand-primary transition-all duration-300 touch-manipulation"
    aria-label={label}
    style={{ transitionTimingFunction: SPRING_EASING }}
  >
    <Icon size={20} aria-hidden="true" />
  </a>
));

SocialLink.displayName = 'SocialLink';

interface FooterProps {
  onAdminClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {
  const prefersReducedMotion = useReducedMotion();

  const scrollTo = useCallback((id: SectionId) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  }, [prefersReducedMotion]);

  return (
    <footer className="relative bg-[#050608] text-white overflow-hidden pb-mobile-nav">

      {/* Background Gradients - 2026 - Optimized for mobile */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[1000px] h-[300px] sm:h-[500px] bg-gradient-radial from-brand-primary/8 to-transparent rounded-full blur-[120px] sm:blur-[200px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full blur-[100px] sm:blur-[150px] pointer-events-none" />

      {/* Newsletter Section - iOS Glass Design */}
      <div className="border-b border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 md:py-20">
          <div className="liquid-glass-3 rounded-ios-xl sm:rounded-ios-2xl p-4 sm:p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-10">
              {/* Newsletter Header */}
              <div className="text-center lg:text-left">
                <h3 className="text-[22px] sm:text-2xl md:text-4xl font-display text-white mb-2 sm:mb-3 leading-tight">
                  Restez informé des <span className="text-gradient-2026">meilleures offres</span>
                </h3>
                <p className="text-white/60 font-light text-[15px] sm:text-lg ios-subheadline sm:ios-body">
                  Inscrivez-vous à notre newsletter pour recevoir nos exclusivités
                </p>
              </div>

              {/* Newsletter Form - iOS-style inputs */}
              <div className="w-full lg:w-auto">
                <div className="flex flex-col gap-3 w-full lg:w-auto">
                  <input
                    type="email"
                    placeholder="Votre adresse email"
                    className="w-full lg:w-80 px-4 py-4 min-h-[50px] rounded-ios-md liquid-glass text-white placeholder-white/40 text-[17px] ios-body focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all duration-300"
                    style={{ transitionTimingFunction: SPRING_EASING }}
                  />
                  <button
                    className="btn-primary-2026 w-full sm:w-auto px-6 py-4 min-h-[50px] rounded-ios-md flex items-center justify-center gap-2 whitespace-nowrap text-[17px] font-semibold active:scale-[0.97] transition-transform touch-manipulation"
                    style={{ transitionTimingFunction: SPRING_EASING }}
                  >
                    S'inscrire
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer - 8pt Grid System */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-8 lg:gap-8">

          {/* Brand - iOS Style */}
          <div className="col-span-2 lg:col-span-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-4 mb-4 sm:mb-8">
              <img
                src="/logo-athome.png"
                alt="At Home Real Estate Agency"
                className="h-[44px] sm:h-[60px] object-contain"
              />
            </div>
            <p className="text-white/60 text-[13px] sm:text-sm font-light leading-relaxed mb-6 sm:mb-8 max-w-[280px] mx-auto sm:mx-0 ios-footnote sm:ios-subheadline">
              Votre partenaire de confiance pour tous vos projets immobiliers à Casablanca et dans tout le Maroc.
            </p>

            {/* Social Links - Touch-optimized grid */}
            <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start">
              {SOCIAL_LINKS.map((social, i) => (
                <SocialLink key={i} {...social} />
              ))}
            </div>
          </div>

          {/* Navigation - iOS Typography */}
          <div className="text-left">
            <h4 className="text-gradient-2026 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-4 sm:mb-7 ios-caption-2">Navigation</h4>
            <ul className="space-y-0">
              {FOOTER_NAVIGATION.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className="text-[13px] sm:text-sm text-white/60 hover:text-white active:text-brand-primary sm:hover:translate-x-2 transition-all duration-300 flex items-center justify-start gap-3 group py-2 sm:py-2 min-h-[44px] w-full touch-manipulation ios-footnote"
                    style={{ transitionTimingFunction: SPRING_EASING }}
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-primary/50 rounded-full scale-0 group-hover:scale-100 group-active:scale-100 transition-transform duration-300 hidden sm:block" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services - iOS Typography */}
          <div className="text-left">
            <h4 className="text-gradient-2026 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-4 sm:mb-7 ios-caption-2">Nos Services</h4>
            <ul className="space-y-0">
              {FOOTER_SERVICES.map((service, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-[13px] sm:text-sm text-white/60 hover:text-white active:text-brand-primary sm:hover:translate-x-2 transition-all duration-300 flex items-center justify-start gap-3 group py-2 sm:py-2 min-h-[44px] touch-manipulation ios-footnote"
                    style={{ transitionTimingFunction: SPRING_EASING }}
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-primary/50 rounded-full scale-0 group-hover:scale-100 group-active:scale-100 transition-transform duration-300 hidden sm:block" />
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - iOS Glass Cards */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-gradient-2026 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] mb-4 sm:mb-7 text-left ios-caption-2">Contact</h4>
            <div className="space-y-3 sm:space-y-4">
              {/* Address - Glass card style on mobile */}
              <div
                className="flex items-start gap-3 sm:gap-4 group justify-start p-3 sm:p-0 rounded-ios-md sm:rounded-none liquid-glass sm:bg-transparent sm:border-0 sm:shadow-none"
                style={{ transitionTimingFunction: SPRING_EASING }}
              >
                <div className="w-10 h-10 sm:w-10 sm:h-10 min-w-[40px] min-h-[40px] rounded-ios-sm liquid-glass flex items-center justify-center shrink-0 group-hover:border-brand-primary/30 transition-all duration-300">
                  <MapPin size={16} className="text-brand-primary" />
                </div>
                <p className="text-[13px] sm:text-sm text-white/60 group-hover:text-white/80 transition-colors text-left leading-relaxed ios-footnote pt-0.5">
                  Boulevard Anfa, Quartier Racine<br />
                  Casablanca, Maroc
                </p>
              </div>
              {/* Phone - Touch-friendly */}
              <a
                href="tel:+212522000000"
                className="flex items-center gap-3 sm:gap-4 group justify-start min-h-[44px] touch-manipulation p-3 sm:p-0 rounded-ios-md sm:rounded-none liquid-glass sm:bg-transparent sm:border-0 sm:shadow-none active:scale-[0.98] transition-all duration-200"
                style={{ transitionTimingFunction: SPRING_EASING }}
              >
                <div className="w-10 h-10 sm:w-10 sm:h-10 min-w-[40px] min-h-[40px] rounded-ios-sm liquid-glass flex items-center justify-center shrink-0 group-hover:border-brand-primary/30 group-active:border-brand-primary/50 group-active:bg-brand-primary/10 transition-all duration-200">
                  <Phone size={16} className="text-brand-primary" />
                </div>
                <span className="text-[13px] sm:text-sm text-white/60 group-hover:text-white group-active:text-brand-primary transition-colors duration-200 ios-footnote">
                  +212 5 22 00 00 00
                </span>
              </a>
              {/* Email - Touch-friendly */}
              <a
                href="mailto:contact@athome.com"
                className="flex items-center gap-3 sm:gap-4 group justify-start min-h-[44px] touch-manipulation p-3 sm:p-0 rounded-ios-md sm:rounded-none liquid-glass sm:bg-transparent sm:border-0 sm:shadow-none active:scale-[0.98] transition-all duration-200"
                style={{ transitionTimingFunction: SPRING_EASING }}
              >
                <div className="w-10 h-10 sm:w-10 sm:h-10 min-w-[40px] min-h-[40px] rounded-ios-sm liquid-glass flex items-center justify-center shrink-0 group-hover:border-brand-primary/30 group-active:border-brand-primary/50 group-active:bg-brand-primary/10 transition-all duration-200">
                  <Mail size={16} className="text-brand-primary" />
                </div>
                <span className="text-[13px] sm:text-sm text-white/60 group-hover:text-white group-active:text-brand-primary transition-colors duration-200 ios-footnote">
                  contact@athome.com
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar - iOS Safe Area */}
      <div className="border-t border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 safe-area-bottom">
          <div className="flex flex-col items-center gap-4 sm:gap-4 md:flex-row md:justify-between">
            {/* Legal links - Horizontal scroll on mobile */}
            <div className="flex flex-row items-center gap-4 sm:gap-6 order-2 md:order-1 overflow-x-auto w-full sm:w-auto justify-center sm:justify-start scrollbar-hide snap-scroll-ios">
              <a
                href="#"
                className="text-[11px] sm:text-xs text-white/50 hover:text-white active:text-brand-primary py-2 min-h-[44px] flex items-center transition-colors duration-200 touch-manipulation whitespace-nowrap ios-caption-2"
                style={{ transitionTimingFunction: SPRING_EASING }}
              >
                Mentions légales
              </a>
              <span className="w-px h-3 bg-white/20 hidden sm:block" />
              <a
                href="#"
                className="text-[11px] sm:text-xs text-white/50 hover:text-white active:text-brand-primary py-2 min-h-[44px] flex items-center transition-colors duration-200 touch-manipulation whitespace-nowrap ios-caption-2"
                style={{ transitionTimingFunction: SPRING_EASING }}
              >
                Confidentialité
              </a>
              <span className="w-px h-3 bg-white/20 hidden sm:block" />
              <a
                href="#"
                className="text-[11px] sm:text-xs text-white/50 hover:text-white active:text-brand-primary py-2 min-h-[44px] flex items-center transition-colors duration-200 touch-manipulation whitespace-nowrap ios-caption-2"
                style={{ transitionTimingFunction: SPRING_EASING }}
              >
                CGV
              </a>
            </div>

            {/* Copyright - iOS Caption style */}
            <p className="text-[11px] sm:text-xs text-white/50 font-medium text-center order-3 md:order-2 ios-caption-2">
              &copy; {new Date().getFullYear()} At Home Real Estate Agency. Tous droits réservés.
            </p>

            {/* Admin and tagline - Touch-optimized */}
            <div className="flex flex-row items-center gap-3 sm:gap-5 order-1 md:order-3">
              <button
                onClick={onAdminClick}
                className="liquid-glass flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-ios-md text-white/60 hover:text-brand-primary hover:border-brand-primary/30 active:scale-[0.97] active:text-brand-primary transition-all duration-200 group touch-manipulation"
                style={{ transitionTimingFunction: SPRING_EASING }}
              >
                <Shield size={16} className="group-hover:text-brand-primary group-active:text-brand-primary transition-colors" />
                <span className="text-[13px] sm:text-sm font-semibold ios-footnote">Admin</span>
              </button>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/50 ios-caption-2">
                <span>Conçu avec</span>
                <span className="text-gradient-2026 font-bold">excellence</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default memo(Footer);
