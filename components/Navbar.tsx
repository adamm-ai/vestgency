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

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          isScrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/[0.08]'
            : 'bg-transparent'
        }`}
        aria-label="Navigation principale"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* Logo */}
            <a
              href="#home"
              onClick={(e) => { e.preventDefault(); scrollTo(SectionId.HOME); }}
              className="flex items-center shrink-0"
              aria-label="At Home - Accueil"
            >
              <img
                src="/logo-athome.png"
                alt="At Home"
                className="h-8 sm:h-10 object-contain"
              />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {/* CTA Button - Desktop */}
              <button
                onClick={() => scrollTo(SectionId.CONTACT)}
                className="hidden md:block px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
              >
                Estimer mon bien
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                aria-label={isMobileMenuOpen ? 'Fermer' : 'Menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full pt-24 pb-8 px-6">
          {/* Navigation Links */}
          <nav className="flex-1 flex flex-col justify-center gap-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="py-4 text-3xl font-display text-white/90 hover:text-brand-gold transition-colors text-left"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Bottom CTA */}
          <button
            onClick={() => scrollTo(SectionId.CONTACT)}
            className="w-full py-4 bg-white text-black text-lg font-semibold rounded-full"
          >
            Estimer mon bien
          </button>
        </div>
      </div>
    </>
  );
};

export default memo(Navbar);
