import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
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

function App() {
  const [showAdminPortal, setShowAdminPortal] = useState(false);

  // Preload property data when app mounts
  useEffect(() => {
    // Preload after a short delay to not block initial render
    const timer = setTimeout(() => {
      preloadData();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenAdmin = useCallback(() => {
    setShowAdminPortal(true);
  }, []);

  const handleCloseAdmin = useCallback(() => {
    setShowAdminPortal(false);
  }, []);

  return (
    <div className="bg-[#FAFAF9] dark:bg-brand-void min-h-screen font-sans selection:bg-brand-gold selection:text-brand-charcoal text-brand-charcoal dark:text-white transition-colors duration-300">
      <Navbar />
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
        <Footer onAdminClick={handleOpenAdmin} />
      </Suspense>
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>

      {/* Admin Portal */}
      {showAdminPortal && (
        <Suspense fallback={null}>
          <AdminPortal onClose={handleCloseAdmin} />
        </Suspense>
      )}
    </div>
  );
}

export default App;
