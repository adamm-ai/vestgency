import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { preloadData } from './services/propertyService';
import { initializeCRM } from './services/crmService';
import ErrorBoundary from './components/ErrorBoundary';

// Critical components loaded immediately
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MobileBottomNav from './components/MobileBottomNav';

// Lazy load non-critical components for faster initial render
const Listings = lazy(() => import('./components/Listings'));
const Features = lazy(() => import('./components/Features'));
const About = lazy(() => import('./components/About'));
const Gallery = lazy(() => import('./components/Gallery'));
const Blog = lazy(() => import('./components/Blog'));
const Contact = lazy(() => import('./components/Contact'));
const Footer = lazy(() => import('./components/Footer'));
const Chatbot = lazy(() => import('./components/Chatbot'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));

// Loading fallback for sections - iOS style
const SectionLoader = () => (
  <div className="flex items-center justify-center py-24">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 dark:border-gray-700" />
        <div className="absolute inset-0 w-10 h-10 rounded-full border-[3px] border-brand-gold border-t-transparent animate-spin" />
      </div>
      <span className="text-[13px] text-gray-400 dark:text-gray-500 font-medium">Chargement...</span>
    </div>
  </div>
);

// Full page loader for admin - iOS style
const PageLoader = () => (
  <div className="fixed inset-0 bg-white dark:bg-brand-void flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-[3px] border-gray-200 dark:border-gray-700" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-brand-gold border-t-transparent animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[15px] text-gray-800 dark:text-white font-semibold">AtHome</span>
        <span className="text-[13px] text-gray-400 dark:text-gray-500">Chargement de l'admin...</span>
      </div>
    </div>
  </div>
);

// Home Page Component
const HomePage: React.FC<{ onAdminClick: () => void }> = ({ onAdminClick }) => (
  <>
    <main className="pb-mobile-nav">
      <Hero />
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <Listings />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <Features />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <About />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <Gallery />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <Blog />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>
        <Suspense fallback={<SectionLoader />}>
          <Contact />
        </Suspense>
      </ErrorBoundary>
    </main>
    <Suspense fallback={null}>
      <Footer onAdminClick={onAdminClick} />
    </Suspense>
    <Suspense fallback={null}>
      <Chatbot />
    </Suspense>
  </>
);

// Admin Page Component
const AdminPage: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <Suspense fallback={<PageLoader />}>
    <AdminPortal onClose={onClose} />
  </Suspense>
);

function App() {
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Preload property data and initialize CRM when app mounts
  // This ensures the matching engine has access to properties data
  // regardless of entry point (Chatbot, Form, Admin Portal)
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadData();
      initializeCRM(); // Preload properties for CRM matching engine
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle /admin route
  useEffect(() => {
    if (location.pathname === '/admin') {
      setShowAdminPortal(true);
    }
  }, [location.pathname]);

  const handleOpenAdmin = useCallback(() => {
    setShowAdminPortal(true);
    navigate('/admin');
  }, [navigate]);

  const handleCloseAdmin = useCallback(() => {
    setShowAdminPortal(false);
    navigate('/');
  }, [navigate]);

  return (
    <div className="bg-[#FAFAF9] dark:bg-brand-void min-h-screen font-sans selection:bg-brand-gold selection:text-brand-charcoal text-brand-charcoal dark:text-white transition-colors duration-300">
      <Navbar />
      <MobileBottomNav />
      <Routes>
        <Route path="/" element={<HomePage onAdminClick={handleOpenAdmin} />} />
        <Route path="/admin" element={<AdminPage onClose={handleCloseAdmin} />} />
        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<HomePage onAdminClick={handleOpenAdmin} />} />
      </Routes>

      {/* Admin Portal Overlay (for modal behavior from home page) */}
      {showAdminPortal && location.pathname !== '/admin' && (
        <Suspense fallback={null}>
          <AdminPortal onClose={handleCloseAdmin} />
        </Suspense>
      )}
    </div>
  );
}

export default App;
