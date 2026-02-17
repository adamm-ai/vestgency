import React, { memo, useCallback, useState, useEffect } from 'react';
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
  const [activeId, setActiveId] = useState('home');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on admin route
  if (location.pathname === '/admin') return null;

  // Track scroll direction to hide/show nav
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Show when at top or scrolling up, hide when scrolling down significantly
          if (currentScrollY < 100) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY + 10) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY - 5) {
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Track active section based on scroll
  useEffect(() => {
    const sections = NAV_ITEMS.map(item => item.target);
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollPosition = window.scrollY + window.innerHeight / 3;

          for (let i = sections.length - 1; i >= 0; i--) {
            const element = document.getElementById(sections[i]);
            if (element && element.offsetTop <= scrollPosition) {
              const navItem = NAV_ITEMS.find(item => item.target === sections[i]);
              if (navItem) setActiveId(navItem.id);
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = useCallback((item: NavItem) => {
    setActiveId(item.id);

    // Haptic feedback simulation via visual response
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
  }, [navigate]);

  return (
    <nav
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-50
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Navigation mobile"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-t border-black/[0.04] dark:border-white/[0.08]" />

      {/* Subtle top glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />

      {/* Navigation items */}
      <div className="relative flex items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`
                relative flex flex-col items-center justify-center
                py-2 px-3 min-w-[64px] min-h-[50px]
                transition-all duration-200 ease-out
                active:scale-90
                group
              `}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator pill */}
              <div
                className={`
                  absolute top-1 left-1/2 -translate-x-1/2
                  h-[3px] rounded-full
                  transition-all duration-300 ease-out
                  ${isActive
                    ? 'w-5 bg-brand-gold'
                    : 'w-0 bg-transparent'
                  }
                `}
              />

              {/* Icon container with spring animation */}
              <div
                className={`
                  relative flex items-center justify-center
                  w-10 h-8 rounded-2xl mb-0.5
                  transition-all duration-300
                  ${isActive
                    ? 'bg-brand-gold/15 text-brand-gold scale-110'
                    : 'text-gray-400 dark:text-gray-500 group-active:bg-gray-100 dark:group-active:bg-white/10'
                  }
                `}
              >
                {item.icon}

                {/* Subtle glow on active */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-brand-gold/20 blur-md -z-10" />
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  text-[10px] font-semibold tracking-wide
                  transition-colors duration-200
                  ${isActive
                    ? 'text-brand-gold'
                    : 'text-gray-400 dark:text-gray-500'
                  }
                `}
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
