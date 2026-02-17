import React, { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone, Mail, MessageSquare } from 'lucide-react';
import { SectionId } from '../types';

interface ActionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  action: () => void;
}

const FloatingActionButton: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show FAB after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight * 0.5;
      setIsVisible(scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  const handleAction = useCallback((action: () => void) => {
    action();
    setIsExpanded(false);
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  }, []);

  const scrollToContact = useCallback(() => {
    document.getElementById(SectionId.CONTACT)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const actions: ActionItem[] = [
    {
      id: 'contact',
      icon: <MessageSquare size={20} />,
      label: 'Formulaire',
      color: 'bg-brand-gold',
      action: scrollToContact,
    },
    {
      id: 'phone',
      icon: <Phone size={20} />,
      label: 'Appeler',
      color: 'bg-emerald-500',
      action: () => window.location.href = 'tel:+212522000000',
    },
    {
      id: 'whatsapp',
      icon: <MessageCircle size={20} />,
      label: 'WhatsApp',
      color: 'bg-[#25D366]',
      action: () => window.open('https://wa.me/212600000000', '_blank'),
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="fixed z-40 md:hidden"
          style={{
            right: '16px',
            bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Backdrop when expanded */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
                onClick={() => setIsExpanded(false)}
              />
            )}
          </AnimatePresence>

          {/* Action items */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-16 right-0 flex flex-col-reverse items-end gap-3 mb-3"
              >
                {actions.map((action, index) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      transition: {
                        delay: index * 0.05,
                        duration: 0.3,
                        ease: [0.34, 1.56, 0.64, 1],
                      },
                    }}
                    exit={{
                      opacity: 0,
                      x: 20,
                      scale: 0.8,
                      transition: { duration: 0.2 },
                    }}
                    onClick={() => handleAction(action.action)}
                    className="
                      flex items-center gap-3
                      pl-4 pr-2 py-2
                      bg-white dark:bg-gray-800
                      rounded-full
                      shadow-lg shadow-black/10 dark:shadow-black/30
                      active:scale-95
                      transition-transform duration-150
                    "
                  >
                    <span className="text-[13px] font-semibold text-gray-800 dark:text-white whitespace-nowrap">
                      {action.label}
                    </span>
                    <div className={`
                      w-10 h-10 rounded-full ${action.color}
                      flex items-center justify-center
                      text-white
                      shadow-md
                    `}>
                      {action.icon}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB button */}
          <motion.button
            onClick={toggleExpanded}
            whileTap={{ scale: 0.9 }}
            className={`
              w-14 h-14
              rounded-2xl
              flex items-center justify-center
              text-white
              shadow-xl
              transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${isExpanded
                ? 'bg-gray-800 dark:bg-gray-700 rotate-0 shadow-gray-800/30'
                : 'bg-brand-gold shadow-brand-gold/40'
              }
            `}
            aria-label={isExpanded ? 'Fermer le menu' : 'Nous contacter'}
            aria-expanded={isExpanded}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {isExpanded ? <X size={24} strokeWidth={2} /> : <MessageCircle size={24} strokeWidth={2} />}
            </motion.div>
          </motion.button>

          {/* Pulse animation when not expanded */}
          {!isExpanded && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-brand-gold -z-10"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(FloatingActionButton);
