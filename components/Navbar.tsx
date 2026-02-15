import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShieldCheck, Moon, Sun, ArrowRight, Sparkles } from 'lucide-react';
import { SectionId } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const ticking = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

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

  // Optimized scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 80);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const scrollTo = useCallback((id: SectionId) => {
    setIsMobileMenuOpen(false);

    if (location.pathname === '/admin') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
      if (isMobileMenuOpen) {
        setTimeout(() => element.scrollIntoView({ behavior: scrollBehavior }), 200);
      } else {
        element.scrollIntoView({ behavior: scrollBehavior });
      }
    }
  }, [isMobileMenuOpen, location.pathname, navigate, prefersReducedMotion]);

  const navLinks = [
    { label: 'Biens', id: SectionId.LISTINGS },
    { label: 'Services', id: SectionId.SERVICES },
    { label: 'Blog', id: SectionId.BLOG },
    { label: 'Contact', id: SectionId.CONTACT },
  ];

  return (
    <>
      {/* Dynamic Island Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 md:pt-5 pointer-events-none"
        aria-label="Navigation principale"
      >
        <div
          className={`
            pointer-events-auto
            dynamic-island
            ${isScrolled ? 'dynamic-island-compact dynamic-island-breathing' : 'dynamic-island-expanded'}
            flex items-center justify-between
            transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isScrolled
              ? 'px-4 md:px-5 py-2.5 md:py-3 min-w-[280px] md:min-w-[420px] max-w-[95%] md:max-w-[460px]'
              : 'px-5 md:px-8 py-3.5 md:py-4 w-[95%] md:w-auto md:min-w-[680px] lg:min-w-[800px]'}
          `}
        >
          {/* Left Side - Logo */}
          <a
            href="#home"
            onClick={(e) => { e.preventDefault(); scrollTo(SectionId.HOME); }}
            className="cursor-pointer flex items-center gap-2 sm:gap-2.5 group shrink-0 min-h-[44px] py-1 active:opacity-80 transition-opacity"
            aria-label="Nourreska - Retour à l'accueil"
          >
            {/* Logo Icon */}
            <div className={`
              relative flex items-center justify-center
              bg-gradient-to-br from-brand-tiffany via-cyan-400 to-brand-tiffany
              transition-all duration-500 ease-out
              ${isScrolled
                ? 'w-8 h-8 rounded-xl'
                : 'w-10 h-10 md:w-11 md:h-11 rounded-2xl'}
              group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-brand-tiffany/40
            `}>
              <span className={`font-display font-bold text-black transition-all duration-300 ${isScrolled ? 'text-sm' : 'text-base md:text-lg'}`}>
                N
              </span>
              {/* Shine overlay */}
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-tr from-white/40 via-white/10 to-transparent" />
            </div>

            {/* Logo Text - Hidden when compact */}
            <div className={`
              flex flex-col overflow-hidden transition-all duration-500 ease-out
              ${isScrolled ? 'w-0 opacity-0' : 'w-auto opacity-100'}
            `}>
              <span className="text-white font-display font-bold tracking-wide text-base md:text-lg whitespace-nowrap">
                Nourreska
              </span>
              <span className="text-white/40 text-[8px] md:text-[9px] tracking-[0.12em] uppercase whitespace-nowrap">
                Immobilier
              </span>
            </div>
          </a>

          {/* Center - Navigation Links (Desktop) */}
          <div className={`
            hidden lg:flex items-center justify-center gap-0.5 transition-all duration-500
            ${isScrolled ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 flex-1 mx-4'}
          `}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="px-4 py-2 text-[13px] font-medium text-white/70 hover:text-white rounded-full hover:bg-white/[0.08] transition-all duration-200"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Indicator - Shows in compact mode */}
            <div className={`
              flex items-center gap-2 transition-all duration-500 overflow-hidden
              ${isScrolled ? 'w-auto opacity-100' : 'w-0 opacity-0'}
            `}>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span className="text-[11px] text-white/80 font-medium hidden md:inline">En ligne</span>
              </div>
            </div>

            {/* CTA Button - Desktop */}
            <button
              onClick={() => scrollTo(SectionId.CONTACT)}
              className={`
                hidden md:flex items-center justify-center gap-2
                bg-gradient-to-r from-brand-tiffany to-cyan-400 text-black font-bold
                transition-all duration-500 ease-out min-h-[44px]
                hover:shadow-lg hover:shadow-brand-tiffany/30 hover:scale-[1.02]
                active:scale-[0.98]
                ${isScrolled
                  ? 'px-4 py-2.5 text-xs rounded-full min-w-[44px]'
                  : 'px-5 py-3 text-sm rounded-xl'}
              `}
            >
              <Sparkles size={isScrolled ? 14 : 16} />
              <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Estimer</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`
                flex items-center justify-center
                bg-white/[0.06] hover:bg-white/[0.12]
                text-white/80 hover:text-brand-tiffany
                border border-white/[0.08] hover:border-brand-tiffany/30
                transition-all duration-300 active:scale-95
                ${isScrolled ? 'w-10 h-10 min-w-[44px] min-h-[44px] rounded-full' : 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl'}
              `}
              aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`
                lg:hidden flex items-center justify-center
                bg-white/[0.06] hover:bg-white/[0.12]
                text-white/80 hover:text-white
                border border-white/[0.08]
                transition-all duration-300 active:scale-95
                ${isScrolled ? 'w-10 h-10 min-w-[44px] min-h-[44px] rounded-full' : 'w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl'}
              `}
              aria-label={isMobileMenuOpen ? 'Fermer' : 'Menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Full Screen Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/98 backdrop-blur-2xl flex flex-col pt-24 pb-8 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          {/* Ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-brand-tiffany/10 rounded-full blur-[150px] pointer-events-none" />

          {/* Navigation Links */}
          <nav className="flex-1 flex flex-col items-center justify-center gap-2 px-6 sm:px-8">
            {navLinks.map((link, i) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="group w-full max-w-sm py-4 sm:py-5 text-center min-h-[56px] active:bg-white/[0.05] rounded-2xl transition-colors"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-2xl sm:text-3xl font-display text-white/90 group-hover:text-brand-tiffany group-active:text-brand-tiffany transition-colors duration-300">
                  {link.label}
                </span>
              </button>
            ))}
          </nav>

          {/* Bottom CTA */}
          <div className="px-6 sm:px-8 mt-auto safe-area-bottom">
            <button
              onClick={() => scrollTo(SectionId.CONTACT)}
              className="w-full py-4 min-h-[56px] bg-gradient-to-r from-brand-tiffany to-cyan-400 text-black font-bold text-base sm:text-lg rounded-2xl shadow-lg shadow-brand-tiffany/25 active:scale-[0.98] transition-transform"
            >
              Estimer mon bien
            </button>

            {/* Info */}
            <div className="flex items-center justify-center gap-3 mt-5 sm:mt-6 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                <span className="text-xs text-white/50">Agence N°1 Casablanca</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(Navbar);
