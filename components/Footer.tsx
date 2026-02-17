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

const SocialLink = memo(({ icon: Icon, href, label }: { icon: React.ElementType; href: string; label: string }) => (
  <a
    href={href}
    className="liquid-glass w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white/60 hover:text-brand-primary hover:bg-brand-primary/10 hover:border-brand-primary/30 hover:scale-110 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95 active:text-brand-primary transition-all duration-300"
    aria-label={label}
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
    <footer className="relative bg-[#050608] text-white overflow-hidden">

      {/* Background Gradients - 2026 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-brand-primary/8 to-transparent rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full blur-[150px] pointer-events-none" />

      {/* Newsletter Section - 2026 Glass */}
      <div className="border-b border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
          <div className="liquid-glass-3 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl md:text-4xl font-display text-white mb-3">
                  Restez informé des <span className="text-gradient-2026">meilleures offres</span>
                </h3>
                <p className="text-white/60 font-light text-lg">
                  Inscrivez-vous à notre newsletter pour recevoir nos exclusivités
                </p>
              </div>

              <div className="w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <input
                    type="email"
                    placeholder="Votre adresse email"
                    className="flex-1 lg:w-80 px-4 sm:px-6 py-3.5 sm:py-4 min-h-[48px] rounded-xl liquid-glass text-white placeholder-white/50 text-sm sm:text-base focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all duration-300"
                  />
                  <button
                    className="btn-primary-2026 px-6 sm:px-8 py-3.5 sm:py-4 min-h-[48px] rounded-xl flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base active:scale-[0.98] transition-transform"
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

      {/* Main Footer */}
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8 lg:gap-8">

          {/* Brand - 2026 */}
          <div className="sm:col-span-2 lg:col-span-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-4 mb-6 sm:mb-8">
              <img
                src="/logo-athome.png"
                alt="At Home Real Estate Agency"
                className="h-[50px] sm:h-[60px] object-contain"
              />
            </div>
            <p className="text-white/60 text-sm font-light leading-relaxed mb-6 sm:mb-8 max-w-xs mx-auto sm:mx-0">
              Votre partenaire de confiance pour tous vos projets immobiliers à Casablanca et dans tout le Maroc.
            </p>

            {/* Social Links */}
            <div className="flex gap-3 justify-center sm:justify-start">
              {SOCIAL_LINKS.map((social, i) => (
                <SocialLink key={i} {...social} />
              ))}
            </div>
          </div>

          {/* Navigation - 2026 */}
          <div className="text-center sm:text-left">
            <h4 className="text-gradient-2026 text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-7">Navigation</h4>
            <ul className="space-y-1">
              {FOOTER_NAVIGATION.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className="text-sm text-white/60 hover:text-white active:text-brand-primary sm:hover:translate-x-2 transition-all duration-300 flex items-center justify-center sm:justify-start gap-3 group py-2.5 sm:py-2 min-h-[44px] w-full touch-manipulation"
                  >
                    <span className="w-2 h-2 bg-brand-primary/50 rounded-full scale-0 group-hover:scale-100 group-active:scale-100 transition-transform duration-300 hidden sm:block" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services - 2026 */}
          <div className="text-center sm:text-left">
            <h4 className="text-gradient-2026 text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-7">Nos Services</h4>
            <ul className="space-y-1">
              {FOOTER_SERVICES.map((service, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-sm text-white/60 hover:text-white active:text-brand-primary sm:hover:translate-x-2 transition-all duration-300 flex items-center justify-center sm:justify-start gap-3 group py-2.5 sm:py-2 min-h-[44px] touch-manipulation"
                  >
                    <span className="w-2 h-2 bg-brand-primary/50 rounded-full scale-0 group-hover:scale-100 group-active:scale-100 transition-transform duration-300 hidden sm:block" />
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - 2026 */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-gradient-2026 text-xs font-bold uppercase tracking-[0.25em] mb-4 sm:mb-7 text-center sm:text-left">Contact</h4>
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-start gap-4 group justify-center sm:justify-start">
                <div className="w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl liquid-glass flex items-center justify-center shrink-0 group-hover:border-brand-primary/30 transition-all duration-300">
                  <MapPin size={18} className="text-brand-primary sm:w-4 sm:h-4" />
                </div>
                <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors text-left">
                  Boulevard Anfa, Quartier Racine<br />
                  Casablanca, Maroc
                </p>
              </div>
              <a href="tel:+212522000000" className="flex items-center gap-4 group justify-center sm:justify-start min-h-[44px] touch-manipulation">
                <div className="w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl liquid-glass flex items-center justify-center shrink-0 group-hover:border-brand-primary/30 group-active:border-brand-primary/30 transition-all duration-300">
                  <Phone size={18} className="text-brand-primary sm:w-4 sm:h-4" />
                </div>
                <span className="text-sm text-white/60 group-hover:text-white group-active:text-brand-primary transition-colors duration-300">
                  +212 5 22 00 00 00
                </span>
              </a>
              <a href="mailto:contact@athome.com" className="flex items-center gap-4 group justify-center sm:justify-start min-h-[44px] touch-manipulation">
                <div className="w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl liquid-glass flex items-center justify-center shrink-0 group-hover:border-brand-primary/30 group-active:border-brand-primary/30 transition-all duration-300">
                  <Mail size={18} className="text-brand-primary sm:w-4 sm:h-4" />
                </div>
                <span className="text-sm text-white/60 group-hover:text-white group-active:text-brand-primary transition-colors duration-300">
                  contact@athome.com
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar - 2026 */}
      <div className="border-t border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col items-center gap-6 sm:gap-4 md:flex-row md:justify-between">
            {/* Legal links - Stack vertically on mobile */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 order-2 md:order-1">
              <a href="#" className="text-xs text-white/50 hover:text-white active:text-brand-primary py-2 min-h-[44px] flex items-center transition-colors duration-300 touch-manipulation">
                Mentions légales
              </a>
              <a href="#" className="text-xs text-white/50 hover:text-white active:text-brand-primary py-2 min-h-[44px] flex items-center transition-colors duration-300 touch-manipulation">
                Confidentialité
              </a>
              <a href="#" className="text-xs text-white/50 hover:text-white active:text-brand-primary py-2 min-h-[44px] flex items-center transition-colors duration-300 touch-manipulation">
                CGV
              </a>
            </div>

            {/* Copyright */}
            <p className="text-xs text-white/50 font-medium text-center order-3 md:order-2">
              &copy; {new Date().getFullYear()} At Home Real Estate Agency. Tous droits réservés.
            </p>

            {/* Admin and tagline */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 order-1 md:order-3">
              <button
                onClick={onAdminClick}
                className="liquid-glass flex items-center gap-2 px-5 sm:px-4 py-3 sm:py-2.5 min-h-[48px] sm:min-h-[44px] rounded-xl text-white/60 hover:text-brand-primary hover:border-brand-primary/30 active:scale-95 active:text-brand-primary transition-all duration-300 group touch-manipulation"
              >
                <Shield size={18} className="group-hover:text-brand-primary transition-colors sm:w-4 sm:h-4" />
                <span className="text-sm font-semibold">Admin</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-white/50">
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
