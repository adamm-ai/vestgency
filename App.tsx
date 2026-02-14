import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { preloadData } from './services/propertyService';
import ErrorBoundary from './components/ErrorBoundary';

// Critical components loaded immediately
import Navbar from './components/Navbar';
import Hero from './components/Hero';

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

// Loading fallback for sections
const SectionLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

// Full page loader for admin
const PageLoader = () => (
  <div className="fixed inset-0 bg-brand-void flex items-center justify-center z-50">
    <div className="w-12 h-12 border-3 border-brand-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

// Home Page Component
const HomePage: React.FC<{ onAdminClick: () => void }> = ({ onAdminClick }) => (
  <>
    <main>
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

  // Preload property data when app mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      preloadData();
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
