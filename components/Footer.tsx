import React, { useCallback, memo } from 'react';
import { SectionId } from '../types';
import { ArrowRight, Facebook, Instagram, Linkedin, Twitter, MapPin, Phone, Mail, Shield } from 'lucide-react';

const SocialLink = memo(({ icon: Icon, href, label }: { icon: React.ElementType; href: string; label: string }) => (
  <a
    href={href}
    className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-brand-gold hover:bg-brand-gold/10 hover:border-brand-gold/20 hover:scale-110 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
    aria-label={label}
  >
    <Icon size={18} />
  </a>
));

SocialLink.displayName = 'SocialLink';

interface FooterProps {
  onAdminClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onAdminClick }) => {

  const scrollTo = useCallback((id: SectionId) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const navigation = [
    { label: 'Accueil', id: SectionId.HOME },
    { label: 'Nos Biens', id: SectionId.LISTINGS },
    { label: 'Services', id: SectionId.SERVICES },
    { label: 'Actualités', id: SectionId.BLOG },
    { label: 'Contact', id: SectionId.CONTACT },
  ];

  const services = [
    'Vente Immobilière',
    'Location & Gestion',
    'Conseil Investissement',
    'Estimation Gratuite',
    'Accompagnement Juridique',
    'Programmes Neufs',
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
  ];

  return (
    <footer className="relative bg-[#050608] text-white overflow-hidden">

      {/* Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-gold/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Newsletter Section */}
      <div className="border-b border-white/[0.06]">
        <div className="container mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl md:text-3xl font-display text-white mb-2">
                Restez informé des <span className="text-brand-gold">meilleures offres</span>
              </h3>
              <p className="text-white/50 font-light">
                Inscrivez-vous à notre newsletter pour recevoir nos exclusivités
              </p>
            </div>

            <div className="w-full lg:w-auto">
              <div className="flex gap-3 w-full lg:w-auto">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="flex-1 lg:w-80 px-5 py-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/40 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                />
                <button
                  className="px-6 py-4 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl shadow-lg shadow-brand-gold/20 hover:shadow-brand-gold/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  S'inscrire
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-gold/20">
                <span className="text-black font-display font-bold text-lg">N</span>
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-brand-gold">Nourreska</h2>
                <span className="text-white/50 text-[10px] tracking-[0.15em] uppercase">Immobilier de prestige</span>
              </div>
            </div>
            <p className="text-white/50 text-sm font-light leading-relaxed mb-6">
              Votre partenaire de confiance pour tous vos projets immobiliers à Casablanca et dans tout le Maroc.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, i) => (
                <SocialLink key={i} {...social} />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-brand-gold text-xs font-bold uppercase tracking-[0.2em] mb-6">Navigation</h4>
            <ul className="space-y-3">
              {navigation.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-brand-gold/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-brand-gold text-xs font-bold uppercase tracking-[0.2em] mb-6">Nos Services</h4>
            <ul className="space-y-3">
              {services.map((service, i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-brand-gold/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-brand-gold text-xs font-bold uppercase tracking-[0.2em] mb-6">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-gold/70 shrink-0 mt-0.5" />
                <p className="text-sm text-white/60">
                  Boulevard Anfa, Quartier Racine<br />
                  Casablanca, Maroc
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-brand-gold/70 shrink-0" />
                <a href="tel:+212522000000" className="text-sm text-white/60 hover:text-white transition-colors duration-200">
                  +212 5 22 00 00 00
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-brand-gold/70 shrink-0" />
                <a href="mailto:contact@nourreska.com" className="text-sm text-white/60 hover:text-white transition-colors duration-200">
                  contact@nourreska.com
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.06]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} Nourreska. Tous droits réservés.
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200">
                Mentions légales
              </a>
              <a href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200">
                Politique de confidentialité
              </a>
              <a href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200">
                CGV
              </a>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onAdminClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/40 hover:text-brand-gold hover:border-brand-gold/30 hover:bg-brand-gold/5 transition-all duration-200 group"
              >
                <Shield size={14} className="group-hover:text-brand-gold transition-colors" />
                <span className="text-xs font-medium">Admin Portal</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>Conçu avec</span>
                <span className="text-brand-gold font-semibold">excellence</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default memo(Footer);
