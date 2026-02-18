import React, { memo, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, Building2, User } from 'lucide-react';
import { SectionId } from '../types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: 'scroll' | 'route';
  target: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Accueil', icon: <Home size={22} strokeWidth={1.8} />, action: 'scroll', target: SectionId.HOME },
  { id: 'search', label: 'Biens', icon: <Search size={22} strokeWidth={1.8} />, action: 'scroll', target: SectionId.LISTINGS },
  { id: 'favorites', label: 'Favoris', icon: <Heart size={22} strokeWidth={1.8} />, action: 'scroll', target: SectionId.LISTINGS },
  { id: 'services', label: 'Services', icon: <Building2 size={22} strokeWidth={1.8} />, action: 'scroll', target: SectionId.SERVICES },
  { id: 'contact', label: 'Contact', icon: <User size={22} strokeWidth={1.8} />, action: 'scroll', target: SectionId.CONTACT },
];

const MobileBottomNav: React.FC = () => {
  const navRef = useRef<HTMLElement>(null);
  const activeIndicatorRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const currentActiveId = useRef('home');
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on admin route
  if (location.pathname === '/admin') return null;

  // Single optimized scroll handler using refs (no re-renders)
  useEffect(() => {
    const sections = NAV_ITEMS.map(item => item.target);

    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const nav = navRef.current;

        if (nav) {
          // Show/hide nav based on scroll direction (CSS transform, no state)
          if (currentScrollY < 100) {
            nav.style.transform = 'translateY(0)';
          } else if (currentScrollY > lastScrollY.current + 10) {
            nav.style.transform = 'translateY(100%)';
          } else if (currentScrollY < lastScrollY.current - 5) {
            nav.style.transform = 'translateY(0)';
          }
        }

        // Update active section (DOM manipulation, no state)
        const scrollPosition = currentScrollY + window.innerHeight / 3;
        for (let i = sections.length - 1; i >= 0; i--) {
          const element = document.getElementById(sections[i]);
          if (element && element.offsetTop <= scrollPosition) {
            const navItem = NAV_ITEMS.find(item => item.target === sections[i]);
            if (navItem && navItem.id !== currentActiveId.current) {
              currentActiveId.current = navItem.id;
              updateActiveStyles(navItem.id);
            }
            break;
          }
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update active styles via DOM (no re-render)
  const updateActiveStyles = useCallback((activeId: string) => {
    const buttons = navRef.current?.querySelectorAll('[data-nav-id]');
    buttons?.forEach(btn => {
      const id = btn.getAttribute('data-nav-id');
      const isActive = id === activeId;
      const indicator = btn.querySelector('[data-indicator]') as HTMLElement;
      const iconContainer = btn.querySelector('[data-icon]') as HTMLElement;
      const label = btn.querySelector('[data-label]') as HTMLElement;

      if (indicator) {
        indicator.style.width = isActive ? '20px' : '0';
        indicator.style.backgroundColor = isActive ? 'var(--brand-gold, #D4AF37)' : 'transparent';
      }
      if (iconContainer) {
        iconContainer.style.backgroundColor = isActive ? 'rgba(212, 175, 55, 0.15)' : '';
        iconContainer.style.color = isActive ? 'var(--brand-gold, #D4AF37)' : '';
        iconContainer.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
      }
      if (label) {
        label.style.color = isActive ? 'var(--brand-gold, #D4AF37)' : '';
      }
    });
  }, []);

  const handleNavClick = useCallback((item: NavItem) => {
    currentActiveId.current = item.id;
    updateActiveStyles(item.id);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    if (item.action === 'route') {
      navigate(item.target);
    } else {
      const element = document.getElementById(item.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [navigate, updateActiveStyles]);

  return (
    <nav
      ref={navRef}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 will-change-transform"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      aria-label="Navigation mobile"
    >
      {/* Optimized background - reduced blur for performance */}
      <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-t border-black/[0.04] dark:border-white/[0.08]" />

      {/* Navigation items */}
      <div className="relative flex items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === 'home'; // Initial state

          return (
            <button
              key={item.id}
              data-nav-id={item.id}
              onClick={() => handleNavClick(item)}
              className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[50px] active:scale-90 transition-transform duration-150"
              aria-label={item.label}
            >
              {/* Active indicator pill */}
              <div
                data-indicator
                className="absolute top-1 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-200"
                style={{
                  width: isActive ? '20px' : '0',
                  backgroundColor: isActive ? 'var(--brand-gold, #D4AF37)' : 'transparent'
                }}
              />

              {/* Icon container */}
              <div
                data-icon
                className="relative flex items-center justify-center w-10 h-8 rounded-2xl mb-0.5 transition-all duration-200 text-gray-400 dark:text-gray-500"
                style={{
                  backgroundColor: isActive ? 'rgba(212, 175, 55, 0.15)' : '',
                  color: isActive ? 'var(--brand-gold, #D4AF37)' : '',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {item.icon}
              </div>

              {/* Label */}
              <span
                data-label
                className="text-[10px] font-semibold tracking-wide transition-colors duration-200 text-gray-400 dark:text-gray-500"
                style={{ color: isActive ? 'var(--brand-gold, #D4AF37)' : '' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default memo(MobileBottomNav);
