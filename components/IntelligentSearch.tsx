/**
 * Intelligent Search Component
 * ============================
 * AI-powered search bar with RAG integration.
 * Features: autocomplete, intent detection, animated suggestions.
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, MapPin, Home, Building2, Loader2, X,
  TrendingUp, Clock, Zap, Brain, CheckCircle2
} from 'lucide-react';
import { ragQuickSearch, ragSearchClient, RAGSearchResponse } from '../services/ragSearchService';
import { searchProperties } from '../services/propertyService';
import { SearchResult, ListingCategory } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface IntelligentSearchProps {
  onSearch: (query: string, ragResponse?: RAGSearchResponse) => void;
  onQuickSelect?: (result: SearchResult) => void;
  category?: ListingCategory;
  placeholder?: string;
  className?: string;
}

interface SearchState {
  query: string;
  isSearching: boolean;
  suggestions: SearchResult[];
  showSuggestions: boolean;
  ragAvailable: boolean;
  intent?: string;
  confidence?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POPULAR_SEARCHES = [
  { text: 'Villa avec piscine', icon: Home },
  { text: 'Appartement meublé', icon: Building2 },
  { text: 'Bureau centre-ville', icon: Building2 },
  { text: 'Location Anfa', icon: MapPin },
];

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  buy: { label: 'Achat', color: 'bg-blue-500' },
  rent: { label: 'Location', color: 'bg-emerald-500' },
  search_type: { label: 'Type', color: 'bg-purple-500' },
  search_location: { label: 'Lieu', color: 'bg-cyan-500' },
  search_features: { label: 'Critères', color: 'bg-pink-500' },
  general: { label: 'Recherche', color: 'bg-gray-500' },
};

// ============================================================================
// COMPONENT
// ============================================================================

const IntelligentSearch: React.FC<IntelligentSearchProps> = memo(({
  onSearch,
  onQuickSelect,
  category,
  placeholder = "Recherche intelligente IA...",
  className = ""
}) => {
  const [state, setState] = useState<SearchState>({
    query: '',
    isSearching: false,
    suggestions: [],
    showSuggestions: false,
    ragAvailable: false,
    intent: undefined,
    confidence: undefined,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Check RAG availability on mount
  useEffect(() => {
    const checkRAG = async () => {
      try {
        // Build RAG URL - handle both full URLs and hostport format from Render
        let ragUrl = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8001';
        if (ragUrl && !ragUrl.startsWith('http')) {
          ragUrl = `https://${ragUrl}`;
        }
        const response = await fetch(`${ragUrl}/health`);
        const data = await response.json();
        setState(prev => ({ ...prev, ragAvailable: data.status === 'healthy' }));
        console.log('RAG service status:', data.status);
      } catch (e) {
        console.log('RAG service not available, using local search');
        setState(prev => ({ ...prev, ragAvailable: false }));
      }
    };
    checkRAG();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setState(prev => ({ ...prev, showSuggestions: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setState(prev => ({
        ...prev,
        suggestions: [],
        isSearching: false,
        intent: undefined,
        confidence: undefined,
      }));
      return;
    }

    setState(prev => ({ ...prev, isSearching: true }));

    try {
      // Quick search for suggestions - direct API call
      let RAG_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8001';
      if (RAG_URL && !RAG_URL.startsWith('http')) {
        RAG_URL = `https://${RAG_URL}`;
      }
      const response = await fetch(`${RAG_URL}/api/quick-search?q=${encodeURIComponent(query)}&limit=6`);
      const data = await response.json();
      const results = data.success ? data.results : [];

      // Also get intent from full search (lightweight call)
      let intent: string | undefined;
      let confidence: number | undefined;

      if (state.ragAvailable && results.length > 0) {
        // Extract intent from first result's metadata if available
        // For now, detect basic intents client-side
        const queryLower = query.toLowerCase();
        if (queryLower.includes('louer') || queryLower.includes('location')) {
          intent = 'rent';
          confidence = 0.9;
        } else if (queryLower.includes('acheter') || queryLower.includes('vente')) {
          intent = 'buy';
          confidence = 0.9;
        } else if (queryLower.includes('villa') || queryLower.includes('appartement')) {
          intent = 'search_type';
          confidence = 0.8;
        } else if (queryLower.match(/anfa|maarif|californie|bouskoura/)) {
          intent = 'search_location';
          confidence = 0.85;
        } else {
          intent = 'general';
          confidence = 0.5;
        }
      }

      setState(prev => ({
        ...prev,
        suggestions: results,
        isSearching: false,
        showSuggestions: true,
        intent,
        confidence,
      }));
    } catch (error) {
      console.error('Search error:', error);
      setState(prev => ({ ...prev, isSearching: false }));
    }
  }, [state.ragAvailable]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setState(prev => ({ ...prev, query, showSuggestions: true }));

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 150); // Fast debounce for autocomplete
  }, [performSearch]);

  // Handle submit
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!state.query.trim()) return;

    setState(prev => ({ ...prev, isSearching: true, showSuggestions: false }));

    try {
      // Perform full RAG search
      if (state.ragAvailable) {
        const response = await ragSearchClient.search(state.query, {
          topK: 20,
          mode: 'agent',
        });
        onSearch(state.query, response);
      } else {
        onSearch(state.query);
      }
    } catch (error) {
      console.error('Search submit error:', error);
      onSearch(state.query);
    } finally {
      setState(prev => ({ ...prev, isSearching: false }));
    }
  }, [state.query, state.ragAvailable, onSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((result: SearchResult) => {
    setState(prev => ({ ...prev, showSuggestions: false, query: result.name }));
    if (onQuickSelect) {
      onQuickSelect(result);
    } else {
      onSearch(result.name);
    }
  }, [onQuickSelect, onSearch]);

  // Handle popular search click
  const handlePopularClick = useCallback((text: string) => {
    setState(prev => ({ ...prev, query: text }));
    performSearch(text);
    inputRef.current?.focus();
  }, [performSearch]);

  // Clear search
  const handleClear = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      suggestions: [],
      showSuggestions: false,
      intent: undefined,
      confidence: undefined,
    }));
    inputRef.current?.focus();
  }, []);

  // Get intent badge
  const intentBadge = state.intent ? INTENT_LABELS[state.intent] || INTENT_LABELS.general : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Container */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          {/* Animated gradient border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-gold via-cyan-400 to-brand-gold rounded-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 blur transition-all duration-500 animate-gradient-x" />

          {/* Input container */}
          <div className="relative flex items-center bg-white dark:bg-[#0c0c0f] rounded-2xl border-2 border-transparent group-hover:border-brand-gold/20 group-focus-within:border-brand-gold/40 transition-all duration-300 shadow-lg shadow-black/5 dark:shadow-black/20">
            {/* AI indicator */}
            <div className="pl-4 flex items-center">
              {state.isSearching ? (
                <Loader2 size={20} className="text-brand-gold animate-spin" />
              ) : state.ragAvailable ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <Brain size={20} className="text-brand-gold" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </motion.div>
              ) : (
                <Search size={20} className="text-gray-400" />
              )}
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={state.query}
              onChange={handleChange}
              onFocus={() => setState(prev => ({ ...prev, showSuggestions: true }))}
              placeholder={placeholder}
              className="flex-1 px-4 py-4 bg-transparent text-brand-charcoal dark:text-white placeholder-gray-400 text-sm focus:outline-none"
            />

            {/* Intent badge */}
            <AnimatePresence>
              {intentBadge && state.query.length > 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  className="mr-2"
                >
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wide ${intentBadge.color}`}>
                    {intentBadge.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clear button */}
            <AnimatePresence>
              {state.query && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="mr-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={16} className="text-gray-400" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Search button */}
            <button
              type="submit"
              disabled={state.isSearching || !state.query.trim()}
              className="mr-2 px-4 py-2 bg-gradient-to-r from-brand-gold to-cyan-400 text-black rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-brand-gold/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
            >
              {state.isSearching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              <span className="hidden sm:inline">Rechercher</span>
            </button>
          </div>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {state.showSuggestions && (state.suggestions.length > 0 || state.query.length < 2) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0c0c0f] rounded-2xl border border-black/5 dark:border-white/10 shadow-2xl shadow-black/20 overflow-hidden z-50"
          >
            {/* RAG Status */}
            {state.ragAvailable && (
              <div className="px-4 py-2 bg-gradient-to-r from-brand-gold/10 to-cyan-400/10 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                <Sparkles size={14} className="text-brand-gold" />
                <span className="text-xs text-brand-charcoal/70 dark:text-white/70">
                  Recherche IA activée • FAISS + Sentence Transformers
                </span>
                <CheckCircle2 size={12} className="text-emerald-500 ml-auto" />
              </div>
            )}

            {/* Suggestions */}
            {state.suggestions.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {state.suggestions.map((result, index) => (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionClick(result)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-brand-gold/5 dark:hover:bg-white/5 transition-colors text-left border-b border-black/[0.03] dark:border-white/[0.03] last:border-0"
                  >
                    {/* Image */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={result.image}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-charcoal dark:text-white truncate">
                        {result.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {result.type}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin size={10} />
                          {result.location}
                        </span>
                      </div>
                    </div>

                    {/* Price & Category */}
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-brand-gold">
                        {result.price}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        result.category === 'RENT'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {result.category === 'RENT' ? 'Location' : 'Vente'}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : state.query.length < 2 ? (
              /* Popular Searches */
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-brand-gold" />
                  <span className="text-xs font-semibold text-brand-charcoal/50 dark:text-white/50 uppercase tracking-wider">
                    Recherches populaires
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((item, index) => (
                    <motion.button
                      key={item.text}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handlePopularClick(item.text)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 dark:bg-white/5 hover:bg-brand-gold/10 dark:hover:bg-brand-gold/10 transition-colors"
                    >
                      <item.icon size={14} className="text-brand-gold" />
                      <span className="text-xs text-brand-charcoal dark:text-white">
                        {item.text}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* Recent searches placeholder */}
                <div className="flex items-center gap-2 mt-4 mb-2">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-brand-charcoal/50 dark:text-white/50 uppercase tracking-wider">
                    Tapez pour rechercher
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Notre IA comprend vos requêtes en langage naturel
                </p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
});

IntelligentSearch.displayName = 'IntelligentSearch';

export default IntelligentSearch;
