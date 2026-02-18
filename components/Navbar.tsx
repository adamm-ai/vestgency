import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { SectionId } from '../types';
import { useReducedMotion } from '../hooks/useReducedMotion';

const NAV_LINKS = [
  { label: 'Biens', id: SectionId.LISTINGS },
  { label: 'Services', id: SectionId.SERVICES },
  { label: 'Blog', id: SectionId.BLOG },
  { label: 'Contact', id: SectionId.CONTACT },
] as const;

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuAnimating, setIsMenuAnimating] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const navRef = useRef<HTMLElement>(null);
  const ticking = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  // Handle menu open/close with animation states
  const openMenu = useCallback(() => {
    setIsMenuAnimating(true);
    setIsMobileMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuAnimating(false);
    setTimeout(() => setIsMobileMenuOpen(false), 300);
  }, []);

  const toggleMenu = useCallback(() => {
    if (isMobileMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [isMobileMenuOpen, openMenu, closeMenu]);

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

  // Optimized scroll handler - direct DOM manipulation, no state
  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;
      requestAnimationFrame(() => {
        const nav = navRef.current;
        if (nav && !isMobileMenuOpen) {
          const isScrolled = window.scrollY > 20;
          if (isScrolled) {
            nav.classList.add('nav-scrolled');
            nav.classList.remove('nav-transparent');
          } else {
            nav.classList.remove('nav-scrolled');
            nav.classList.add('nav-transparent');
          }
        }
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const scrollTo = useCallback((id: SectionId) => {
    if (isMobileMenuOpen) {
      closeMenu();
    }

    if (location.pathname === '/admin') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
      if (isMobileMenuOpen) {
        setTimeout(() => element.scrollIntoView({ behavior: scrollBehavior }), 350);
      } else {
        element.scrollIntoView({ behavior: scrollBehavior });
      }
    }
  }, [isMobileMenuOpen, closeMenu, location.pathname, navigate, prefersReducedMotion]);

  return (
    <>
      <style>{`
        .nav-transparent {
          background-color: transparent;
          border-bottom-color: transparent;
        }
        .nav-scrolled {
          background-color: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .nav-menu-open {
          background-color: black;
        }
      `}</style>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ease-out will-change-[background-color,backdrop-filter] ${
          isMobileMenuOpen ? 'nav-menu-open' : 'nav-transparent'
        }`}
        aria-label="Navigation principale"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">

            {/* Logo */}
            <a
              href="#home"
              onClick={(e) => { e.preventDefault(); scrollTo(SectionId.HOME); }}
              className="flex items-center shrink-0 min-h-[44px] min-w-[44px] -ml-2 pl-2"
              aria-label="At Home - Accueil"
            >
              <img
                src="/logo-athome.png"
                alt="At Home"
                className="h-7 sm:h-8 md:h-10 w-auto object-contain"
              />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors duration-150 min-h-[44px]"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center text-white/60 hover:text-white active:text-white transition-colors duration-150 rounded-full active:bg-white/10"
                aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <Moon size={20} className="sm:w-[18px] sm:h-[18px]" /> : <Sun size={20} className="sm:w-[18px] sm:h-[18px]" />}
              </button>

              {/* CTA Button - Desktop */}
              <button
                onClick={() => scrollTo(SectionId.CONTACT)}
                className="hidden md:block px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors duration-150 min-h-[44px]"
              >
                Estimer mon bien
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMenu}
                className="md:hidden w-11 h-11 flex items-center justify-center text-white/80 hover:text-white active:text-white transition-all duration-150 rounded-full active:bg-white/10"
                aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={isMobileMenuOpen}
              >
                <span className={`transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                  {isMobileMenuOpen ? <X size={26} strokeWidth={2} /> : <Menu size={26} strokeWidth={2} />}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - iOS-style full screen overlay */}
      {isMobileMenuOpen && (
        <div
          className={`
            fixed inset-0 z-40 md:hidden
            transition-opacity duration-300 ease-out
            ${isMenuAnimating ? 'opacity-100' : 'opacity-0'}
          `}
          aria-modal="true"
          role="dialog"
          aria-label="Menu de navigation mobile"
        >
          {/* Background - reduced blur for performance */}
          <div className={`
            absolute inset-0
            bg-black/95 dark:bg-black/98
            backdrop-blur-xl
            transition-opacity duration-300
            ${isMenuAnimating ? 'opacity-100' : 'opacity-0'}
          `} />

          {/* Full screen container */}
          <div className="relative flex flex-col h-full h-[100dvh] pt-20 pb-safe px-6 sm:px-8">

            {/* Pull indicator */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2">
              <div className="w-9 h-1 rounded-full bg-white/20" />
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 flex flex-col justify-center gap-2 -mt-4">
              {NAV_LINKS.map((link, index) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`
                    relative py-4 px-4
                    text-[34px] font-bold tracking-tight
                    text-white
                    text-left
                    min-h-[60px]
                    rounded-2xl
                    transition-all duration-200 ease-out
                    active:bg-white/10 active:scale-[0.98]
                    group
                    transform ${isMenuAnimating ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}
                  `}
                  style={{
                    transitionDelay: isMenuAnimating ? `${index * 50 + 80}ms` : '0ms'
                  }}
                >
                  <span className="relative z-10 group-hover:text-brand-gold transition-colors duration-150">
                    {link.label}
                  </span>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                </button>
              ))}
            </nav>

            {/* Bottom CTA */}
            <div
              className={`
                pb-6
                transform transition-all duration-300 ease-out
                ${isMenuAnimating ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
              `}
              style={{
                transitionDelay: isMenuAnimating ? `${NAV_LINKS.length * 50 + 150}ms` : '0ms'
              }}
            >
              <button
                onClick={() => scrollTo(SectionId.CONTACT)}
                className="
                  w-full py-[18px]
                  bg-brand-gold text-black
                  text-[17px] font-semibold tracking-[-0.2px]
                  rounded-2xl
                  min-h-[56px]
                  shadow-xl shadow-brand-gold/30
                  transition-transform duration-150
                  active:scale-[0.97]
                "
              >
                Estimer mon bien
              </button>
              <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(Navbar);
