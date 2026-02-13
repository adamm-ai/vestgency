import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Menu, X, ShieldCheck, Moon, Sun, ArrowRight } from 'lucide-react';
import { SectionId } from '../types';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const ticking = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  }, []);

  // Optimized scroll handler with requestAnimationFrame throttling
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    // Passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const scrollTo = useCallback((id: SectionId) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      // Use setTimeout only for mobile menu close animation
      if (isMobileMenuOpen) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 200);
      } else {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Biens', id: SectionId.LISTINGS },
    { label: 'Services', id: SectionId.SERVICES },
    { label: 'Actualités', id: SectionId.BLOG },
    { label: 'À propos', id: SectionId.AGENCY },
    { label: 'Contact', id: SectionId.CONTACT },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 md:pt-6 pointer-events-none will-change-transform"
        style={{ transform: 'translateZ(0)' }}
      >
        <div
          className={`
            pointer-events-auto
            flex items-center justify-between
            px-6 py-4 md:px-10 md:py-4
            rounded-2xl
            transition-[width,background-color,box-shadow] duration-300 ease-out
            ${isScrolled
                ? 'w-[95%] md:w-[900px] bg-white/95 dark:bg-[#0a0a0a]/95 shadow-lg dark:shadow-black/50 border border-black/5 dark:border-white/10'
                : 'w-[95%] md:w-[1100px] bg-white/10 dark:bg-black/30 border border-white/10'}
          `}
        >
          {/* Brand */}
          <div
            onClick={() => scrollTo(SectionId.HOME)}
            className="cursor-pointer flex items-center gap-3 group"
          >
            <div className="relative w-11 h-11 bg-gradient-to-br from-brand-gold to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-brand-gold/20">
              <span className="font-display font-bold text-black text-xl">N</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-brand-gold font-display font-bold tracking-wide text-lg">Nourreska</span>
              <span className="text-brand-charcoal/60 dark:text-white/50 text-[9px] tracking-[0.15em] uppercase">Immobilier de prestige</span>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="relative px-5 py-2.5 text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:text-brand-charcoal dark:hover:text-white transition-colors duration-200 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* CTA Button - Desktop */}
            <button
              onClick={() => scrollTo(SectionId.CONTACT)}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-gold to-cyan-400 text-black text-sm font-semibold rounded-xl shadow-lg shadow-brand-gold/20 hover:shadow-brand-gold/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Estimer mon bien</span>
              <ArrowRight size={16} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-11 h-11 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 text-brand-charcoal dark:text-white transition-colors duration-200"
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-11 h-11 flex items-center justify-center text-brand-charcoal dark:text-white rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#FAFAF9] dark:bg-[#050608] flex flex-col pt-28 pb-8 overflow-y-auto"
        >
          {/* Gradient Orbs - Static */}
          <div className="absolute top-20 right-0 w-[60%] h-[40%] bg-gradient-to-br from-brand-gold/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-20 left-0 w-[40%] h-[30%] bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-[80px] pointer-events-none" />

          {/* Ethics Banner */}
          <div className="px-6 mb-10">
            <div className="bg-gradient-to-r from-brand-gold/10 to-transparent border border-brand-gold/20 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center">
                <ShieldCheck size={20} className="text-brand-gold" />
              </div>
              <div>
                <h4 className="text-brand-charcoal dark:text-white text-sm font-semibold mb-1">Notre Engagement</h4>
                <p className="text-brand-charcoal/60 dark:text-white/60 text-xs leading-relaxed">
                  Placer l'intérêt du client au cœur de chaque décision.
                </p>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex-1 px-6 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03] active:scale-[0.98] transition-transform"
              >
                <span className="text-xl font-display text-brand-charcoal dark:text-white">
                  {link.label}
                </span>
                <ArrowRight size={20} className="text-brand-charcoal/30 dark:text-white/30" />
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 mt-8">
            <button
              onClick={() => scrollTo(SectionId.CONTACT)}
              className="w-full py-4 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-2xl shadow-lg shadow-brand-gold/25 active:scale-[0.98] transition-transform"
            >
              Estimer mon bien gratuitement
            </button>

            <p className="text-center text-brand-charcoal/30 dark:text-white/30 text-xs mt-6">
              © 2024 Nourreska. Tous droits réservés.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(Navbar);
