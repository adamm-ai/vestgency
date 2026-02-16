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
    className="liquid-glass w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white/60 hover:text-brand-tiffany hover:bg-brand-tiffany/10 hover:border-brand-tiffany/30 hover:scale-110 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-tiffany/20 active:scale-95 active:text-brand-tiffany transition-all duration-300"
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-radial from-brand-tiffany/8 to-transparent rounded-full blur-[200px] pointer-events-none" />
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
                    className="flex-1 lg:w-80 px-4 sm:px-6 py-3.5 sm:py-4 min-h-[48px] rounded-xl liquid-glass text-white placeholder-white/50 text-sm sm:text-base focus:border-brand-tiffany/50 focus:ring-2 focus:ring-brand-tiffany/20 outline-none transition-all duration-300"
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand - 2026 */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-tiffany via-cyan-400 to-brand-tiffany flex items-center justify-center shadow-xl shadow-brand-tiffany/30">
                <span className="text-black font-display font-bold text-xl">N</span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-60" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gradient-2026">Nourreska</h2>
                <span className="text-white/50 text-[10px] tracking-[0.15em] uppercase">Immobilier de prestige</span>
              </div>
            </div>
            <p className="text-white/60 text-sm font-light leading-relaxed mb-8">
              Votre partenaire de confiance pour tous vos projets immobiliers à Casablanca et dans tout le Maroc.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social, i) => (
                <SocialLink key={i} {...social} />
              ))}
            </div>
          </div>

          {/* Navigation - 2026 */}
          <div>
            <h4 className="text-gradient-2026 text-xs font-bold uppercase tracking-[0.25em] mb-5 sm:mb-7">Navigation</h4>
            <ul className="space-y-1 sm:space-y-2">
              {FOOTER_NAVIGATION.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className="text-sm text-white/60 hover:text-white active:text-brand-tiffany hover:translate-x-2 transition-all duration-300 flex items-center gap-3 group py-2 min-h-[44px]"
                  >
                    <span className="w-2 h-2 bg-brand-tiffany/50 rounded-full scale-0 group-hover:scale-100 group-active:scale-100 transition-transform duration-300" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services - 2026 */}
          <div>
            <h4 className="text-gradient-2026 text-xs font-bold uppercase tracking-[0.25em] mb-5 sm:mb-7">Nos Services</h4>
            <ul className="space-y-1 sm:space-y-2">
              {FOOTER_SERVICES.map((service, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-sm text-white/60 hover:text-white active:text-brand-tiffany hover:translate-x-2 transition-all duration-300 flex items-center gap-3 group py-2 min-h-[44px]"
                  >
                    <span className="w-2 h-2 bg-brand-tiffany/50 rounded-full scale-0 group-hover:scale-100 group-active:scale-100 transition-transform duration-300" />
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - 2026 */}
          <div>
            <h4 className="text-gradient-2026 text-xs font-bold uppercase tracking-[0.25em] mb-7">Contact</h4>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center shrink-0 group-hover:border-brand-tiffany/30 transition-all duration-300">
                  <MapPin size={16} className="text-brand-tiffany" />
                </div>
                <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  Boulevard Anfa, Quartier Racine<br />
                  Casablanca, Maroc
                </p>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center shrink-0 group-hover:border-brand-tiffany/30 transition-all duration-300">
                  <Phone size={16} className="text-brand-tiffany" />
                </div>
                <a href="tel:+212522000000" className="text-sm text-white/60 hover:text-white transition-colors duration-300">
                  +212 5 22 00 00 00
                </a>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center shrink-0 group-hover:border-brand-tiffany/30 transition-all duration-300">
                  <Mail size={16} className="text-brand-tiffany" />
                </div>
                <a href="mailto:contact@nourreska.com" className="text-sm text-white/60 hover:text-white transition-colors duration-300">
                  contact@nourreska.com
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar - 2026 */}
      <div className="border-t border-white/[0.06]">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-white/50 font-medium">
              &copy; {new Date().getFullYear()} Nourreska. Tous droits réservés.
            </p>

            <div className="flex items-center gap-4 sm:gap-8 flex-wrap justify-center">
              <a href="#" className="text-xs text-white/50 hover:text-white active:text-brand-tiffany py-2 min-h-[44px] flex items-center transition-colors duration-300">
                Mentions légales
              </a>
              <a href="#" className="text-xs text-white/50 hover:text-white active:text-brand-tiffany py-2 min-h-[44px] flex items-center transition-colors duration-300">
                Confidentialité
              </a>
              <a href="#" className="text-xs text-white/50 hover:text-white active:text-brand-tiffany py-2 min-h-[44px] flex items-center transition-colors duration-300">
                CGV
              </a>
            </div>

            <div className="flex items-center gap-5">
              <button
                onClick={onAdminClick}
                className="liquid-glass flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-white/60 hover:text-brand-tiffany hover:border-brand-tiffany/30 active:scale-95 active:text-brand-tiffany transition-all duration-300 group"
              >
                <Shield size={16} className="group-hover:text-brand-tiffany transition-colors" />
                <span className="text-xs sm:text-sm font-semibold">Admin</span>
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
