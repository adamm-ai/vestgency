/**
 * NOUR - Elite AI Real Estate Assistant
 * =====================================
 * Premium glassmorphic chatbot with exceptional minimalism.
 * OpenAI GPT-4 + RAG powered.
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  X, Send, Sparkles, Loader2, Brain,
  Home, MapPin, TrendingUp, RotateCcw,
  Maximize2, Minimize2, MessageCircle
} from 'lucide-react';
import { ChatMessage } from '../types';
import * as CRM from '../services/crmService';

// ============================================================================
// CONFIGURATION
// ============================================================================

const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8001';

// ============================================================================
// TYPES
// ============================================================================

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  conversationId: string;
}

interface ExtractedData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  transactionType?: 'RENT' | 'SALE';
  budgetMin?: number;
  budgetMax?: number;
  // Enhanced demand data
  demandType?: CRM.DemandType;
  propertyTypes?: CRM.PropertyType[];
  neighborhoods?: string[];
  bedroomsMin?: number;
  surfaceMin?: number;
  amenities?: string[];
  // For sellers
  sellerPropertyType?: CRM.PropertyType;
  sellerPrice?: number;
  sellerSurface?: number;
  sellerBedrooms?: number;
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

const QUICK_ACTIONS = [
  { icon: Home, text: "Villas", query: "Je cherche une villa à vendre à Casablanca" },
  { icon: MapPin, text: "Anfa", query: "Appartements disponibles à Anfa" },
  { icon: TrendingUp, text: "Prix", query: "Prix moyens à Californie?" },
];

// ============================================================================
// CHATBOT COMPONENT
// ============================================================================

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [state, setState] = useState<ChatState>({
    messages: [
      {
        id: 'welcome',
        role: 'model',
        text: "Bonjour, je suis **NOUR**.\n\nVotre assistant immobilier intelligent. Comment puis-je vous aider?",
        timestamp: new Date()
      }
    ],
    isLoading: false,
    isConnected: false,
    conversationId: `conv-${Date.now()}`
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [leadCreated, setLeadCreated] = useState(false);
  const [demandCreated, setDemandCreated] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [propertiesViewed, setPropertiesViewed] = useState<string[]>([]);
  const [aiDetectedUrgency, setAiDetectedUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Extract contact info and demand data from user message
  const extractInfoFromMessage = useCallback((text: string) => {
    const contactInfo = CRM.extractContactFromMessage(text);
    const budget = CRM.detectBudget(text);
    const textLower = text.toLowerCase();

    // Detect demand type
    const demandType = CRM.detectDemandIntent(text);

    // Detect transaction type
    let transactionType: 'RENT' | 'SALE' | undefined;
    if (textLower.includes('louer') || textLower.includes('location') || textLower.includes('bail') || textLower.includes('rent')) {
      transactionType = 'RENT';
    } else if (textLower.includes('acheter') || textLower.includes('achat') || textLower.includes('buy') || textLower.includes('vendre')) {
      transactionType = 'SALE';
    }

    // Detect city
    let city: string | undefined;
    const cities: string[] = [];
    const cityList = ['casablanca', 'rabat', 'marrakech', 'tanger', 'fes', 'agadir', 'anfa', 'bouskoura', 'californie', 'dar bouazza', 'ain diab', 'maarif'];
    for (const c of cityList) {
      if (textLower.includes(c)) {
        cities.push(c.charAt(0).toUpperCase() + c.slice(1));
        if (!city) city = c.charAt(0).toUpperCase() + c.slice(1);
      }
    }

    // Detect property types
    const propertyTypes: CRM.PropertyType[] = [];
    const typePatterns: Record<string, CRM.PropertyType> = {
      'villa': 'villa', 'appartement': 'apartment', 'apartment': 'apartment',
      'riad': 'riad', 'terrain': 'land', 'commercial': 'commercial',
      'penthouse': 'penthouse', 'duplex': 'duplex', 'studio': 'studio',
    };
    for (const [pattern, type] of Object.entries(typePatterns)) {
      if (textLower.includes(pattern)) {
        propertyTypes.push(type);
      }
    }

    // Detect bedrooms
    let bedroomsMin: number | undefined;
    const bedroomMatch = text.match(/(\d+)\s*(?:chambres?|ch|bedrooms?|beds?)/i);
    if (bedroomMatch) bedroomsMin = parseInt(bedroomMatch[1]);

    // Detect surface
    let surfaceMin: number | undefined;
    const surfaceMatch = text.match(/(\d+)\s*(?:m²|m2|mètres?|sqm)/i);
    if (surfaceMatch) surfaceMin = parseInt(surfaceMatch[1]);

    // Detect amenities
    const amenities: string[] = [];
    const amenityList = ['piscine', 'pool', 'jardin', 'garden', 'parking', 'garage', 'terrasse', 'terrace', 'vue mer', 'sea view', 'meublé', 'furnished'];
    for (const a of amenityList) {
      if (textLower.includes(a)) amenities.push(a);
    }

    // For sellers - detect property details
    let sellerPropertyType: CRM.PropertyType | undefined;
    let sellerPrice: number | undefined;
    let sellerSurface: number | undefined;
    let sellerBedrooms: number | undefined;

    if (demandType === 'property_sale' || demandType === 'property_rental_management') {
      sellerPropertyType = propertyTypes[0];
      sellerPrice = budget.min || budget.max;
      sellerSurface = surfaceMin;
      sellerBedrooms = bedroomsMin;
    }

    return {
      ...contactInfo,
      ...budget,
      transactionType,
      city,
      demandType,
      propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
      neighborhoods: cities.length > 0 ? cities : undefined,
      bedroomsMin,
      surfaceMin,
      amenities: amenities.length > 0 ? amenities : undefined,
      sellerPropertyType,
      sellerPrice,
      sellerSurface,
      sellerBedrooms,
    };
  }, []);

  // Convert conversation to CRM lead
  const convertToCRMLead = useCallback(() => {
    if (leadCreated) return;
    if (!extractedData.email && !extractedData.phone) return; // Need at least email or phone

    const crmMessages: CRM.ChatMessage[] = state.messages.map(m => ({
      id: m.id,
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
      timestamp: m.timestamp.toISOString(),
    }));

    try {
      const lead = CRM.convertChatToLead(state.conversationId, crmMessages, {
        firstName: extractedData.firstName,
        lastName: extractedData.lastName,
        email: extractedData.email,
        phone: extractedData.phone,
        city: extractedData.city,
        transactionType: extractedData.transactionType,
        budgetMin: extractedData.budgetMin,
        budgetMax: extractedData.budgetMax,
        urgency: aiDetectedUrgency, // AI-detected urgency from conversation
      });

      if (lead && lead.id) {
        setLeadId(lead.id);
        setLeadCreated(true);
        console.log('[CRM] Lead created from chatbot conversation');
      }
    } catch (error) {
      console.error('[CRM] Error creating lead from chatbot:', error);
    }
  }, [extractedData, leadCreated, state.messages, state.conversationId]);

  // Add activity to existing lead
  const addLeadActivity = useCallback((type: CRM.ActivityType, title: string, description?: string) => {
    if (!leadId) return;
    try {
      CRM.addActivity(leadId, type, title, description);
    } catch (error) {
      console.error('[CRM] Error adding activity to lead:', error);
    }
  }, [leadId]);

  // Detect and log property interest from bot response
  const detectPropertyInterest = useCallback((botResponse: string) => {
    try {
      // Detect if bot mentioned specific properties
      const propertyMentions = botResponse.match(/(?:référence|réf|id|code)[\s:]+([A-Z0-9-]+)/gi);
      if (propertyMentions && propertyMentions.length > 0) {
        const propertyIds = propertyMentions.map(m => m.replace(/.*[\s:]+/, '').trim());
        setPropertiesViewed(prev => [...new Set([...prev, ...propertyIds])]);

        // Log activity if lead exists
        if (leadId) {
          addLeadActivity('note_added', 'Propriétés consultées via chatbot', `Réfs: ${propertyIds.join(', ')}`);
        }
      }

      // Detect if bot suggested scheduling a visit
      if (botResponse.toLowerCase().includes('visite') || botResponse.toLowerCase().includes('rendez-vous')) {
        if (leadId) {
          // Update lead status to visit_scheduled interest
          const leads = CRM.getLeads();
          const lead = leads.find(l => l.id === leadId);
          if (lead && lead.status === 'new') {
            CRM.updateLead(leadId, { status: 'contacted' });
            addLeadActivity('status_changed', 'Statut mis à jour', 'Intérêt pour une visite détecté');
          }
        }
      }
    } catch (error) {
      console.error('[CRM] Error detecting property interest:', error);
    }
  }, [leadId, addLeadActivity]);

  // Update lead engagement score based on conversation depth
  const updateLeadEngagement = useCallback(() => {
    if (!leadId) return;

    try {
      const leads = CRM.getLeads();
      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      // Calculate engagement score based on conversation
      let engagementBonus = 0;
      const messageCount = state.messages.filter(m => m.role === 'user').length;

      // More messages = more engagement
      if (messageCount >= 5) engagementBonus += 10;
      if (messageCount >= 10) engagementBonus += 10;

      // Budget info = higher intent
      if (extractedData.budgetMin || extractedData.budgetMax) engagementBonus += 15;

      // Property type specified = clearer intent
      if (extractedData.propertyTypes && extractedData.propertyTypes.length > 0) engagementBonus += 10;

      // City specified = location intent
      if (extractedData.city) engagementBonus += 5;

      // Properties viewed = active interest
      if (propertiesViewed.length > 0) engagementBonus += propertiesViewed.length * 5;

      // Update lead score if bonus is significant
      if (engagementBonus > 0) {
        const newScore = Math.min(100, lead.score + engagementBonus);
        if (newScore !== lead.score) {
          CRM.updateLead(leadId, { score: newScore });
          console.log(`[CRM] Lead score updated: ${lead.score} -> ${newScore}`);
        }
      }
    } catch (error) {
      console.error('[CRM] Error updating lead engagement:', error);
    }
  }, [leadId, state.messages, extractedData, propertiesViewed]);

  // Convert conversation to CRM demand
  const convertToCRMDemand = useCallback(() => {
    if (demandCreated) return;
    if (!extractedData.demandType) return;
    if (!extractedData.email && !extractedData.phone) return; // Need contact info

    let demandData: Parameters<typeof CRM.createDemand>[0] = {
      type: extractedData.demandType,
      firstName: extractedData.firstName || 'Visiteur',
      lastName: extractedData.lastName || '',
      email: extractedData.email || '',
      phone: extractedData.phone || '',
      source: 'chatbot',
      chatSessionId: state.conversationId,
      urgency: aiDetectedUrgency, // AI-detected urgency from conversation analysis
    };

    // Build search criteria for property seekers
    if (extractedData.demandType === 'property_search') {
      demandData.searchCriteria = {
        transactionType: extractedData.transactionType || 'SALE',
        propertyType: extractedData.propertyTypes,
        cities: extractedData.neighborhoods || (extractedData.city ? [extractedData.city] : undefined),
        budgetMin: extractedData.budgetMin,
        budgetMax: extractedData.budgetMax,
        bedroomsMin: extractedData.bedroomsMin,
        surfaceMin: extractedData.surfaceMin,
        amenities: extractedData.amenities,
      };
    }

    // Build property details for sellers
    if (extractedData.demandType === 'property_sale' || extractedData.demandType === 'property_rental_management') {
      demandData.propertyDetails = {
        propertyType: extractedData.sellerPropertyType || 'other',
        transactionType: extractedData.demandType === 'property_sale' ? 'SALE' : 'MANAGEMENT',
        city: extractedData.city || 'Non spécifié',
        price: extractedData.sellerPrice,
        surface: extractedData.sellerSurface,
        bedrooms: extractedData.sellerBedrooms,
        amenities: extractedData.amenities,
      };
    }

    try {
      const demand = CRM.createDemand(demandData);
      if (demand && demand.id) {
        setDemandCreated(true);
        console.log('[CRM] Demand created from chatbot:', extractedData.demandType);
      }
    } catch (error) {
      console.error('[CRM] Error creating demand from chatbot:', error);
    }
  }, [extractedData, demandCreated, state.conversationId]);

  // Check connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${RAG_API_URL}/health`);
        const data = await response.json();
        setState(prev => ({
          ...prev,
          isConnected: data.status === 'healthy' && data.chatbot_ready
        }));
      } catch {
        setState(prev => ({ ...prev, isConnected: false }));
      }
    };
    checkConnection();
  }, []);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (window.innerWidth < 768 && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  // Focus input
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 400);
  }, [isOpen]);

  // Auto-create lead when contact info detected
  useEffect(() => {
    if ((extractedData.email || extractedData.phone) && state.messages.length >= 3 && !leadCreated) {
      // Wait a bit to capture more info before creating lead
      const timer = setTimeout(() => {
        convertToCRMLead();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [extractedData, state.messages.length, leadCreated, convertToCRMLead]);

  // Create lead when chat closes with contact info
  useEffect(() => {
    if (!isOpen && (extractedData.email || extractedData.phone) && state.messages.length > 2 && !leadCreated) {
      convertToCRMLead();
    }
  }, [isOpen, extractedData, state.messages.length, leadCreated, convertToCRMLead]);

  // Auto-create demand when demand type and contact info detected
  useEffect(() => {
    if (extractedData.demandType && (extractedData.email || extractedData.phone) && state.messages.length >= 4 && !demandCreated) {
      // Wait to capture more details before creating demand
      const timer = setTimeout(() => {
        convertToCRMDemand();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [extractedData, state.messages.length, demandCreated, convertToCRMDemand]);

  // Create demand when chat closes with demand intent
  useEffect(() => {
    if (!isOpen && extractedData.demandType && (extractedData.email || extractedData.phone) && state.messages.length > 3 && !demandCreated) {
      convertToCRMDemand();
    }
  }, [isOpen, extractedData, state.messages.length, demandCreated, convertToCRMDemand]);

  // Send message
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || state.isLoading) return;

    // Extract info from user message for CRM
    const newInfo = extractInfoFromMessage(messageText);
    if (Object.keys(newInfo).some(k => newInfo[k as keyof typeof newInfo])) {
      setExtractedData(prev => ({ ...prev, ...newInfo }));
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true
    }));
    setInput('');

    const modelMsgId = (Date.now() + 1).toString();

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: modelMsgId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        isStreaming: true
      }]
    }));

    try {
      // Use non-streaming request for reliability
      const response = await fetch(`${RAG_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversation_id: state.conversationId,
          stream: false
        })
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      const responseText = data.response || "Erreur de traitement.";

      // Extract AI-detected urgency from response
      if (data.analysis?.urgency) {
        setAiDetectedUrgency(data.analysis.urgency);
        console.log(`[CRM] AI detected urgency: ${data.analysis.urgency} - ${data.analysis.reason || ''}`);
      }

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === modelMsgId
            ? { ...msg, text: responseText, isStreaming: false }
            : msg
        ),
        isLoading: false
      }));

      // CRM: Detect property interest and update engagement
      if (responseText && responseText !== "Erreur de traitement.") {
        detectPropertyInterest(responseText);
        updateLeadEngagement();
      }

    } catch (error) {
      console.error('[Chatbot] Error:', error);
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === modelMsgId
            ? { ...msg, text: "Connexion perdue. Réessayez.", isStreaming: false }
            : msg
        ),
        isLoading: false
      }));
    }
  }, [state.isLoading, state.conversationId, detectPropertyInterest, updateLeadEngagement, extractInfoFromMessage]);

  const handleSend = () => sendMessage(input);

  const handleClear = async () => {
    // Get final urgency analysis before clearing
    try {
      const clearResponse = await fetch(`${RAG_API_URL}/api/chat/clear?conversation_id=${state.conversationId}`, {
        method: 'POST'
      });
      const clearData = await clearResponse.json();

      // Use final urgency for lead/demand creation
      if (clearData.final_analysis?.urgency) {
        setAiDetectedUrgency(clearData.final_analysis.urgency);
      }
    } catch { /* ignore */ }

    // Create lead before clearing if we have contact info
    if ((extractedData.email || extractedData.phone) && !leadCreated) {
      convertToCRMLead();
    }

    // Create demand if we have demand type
    if (extractedData.demandType && (extractedData.email || extractedData.phone) && !demandCreated) {
      convertToCRMDemand();
    }

    // Log final engagement before clearing
    if (leadId) {
      updateLeadEngagement();
    }

    // Reset CRM tracking
    setExtractedData({});
    setLeadCreated(false);
    setDemandCreated(false);
    setLeadId(null);
    setPropertiesViewed([]);
    setAiDetectedUrgency('medium'); // Reset to default

    setState(prev => ({
      ...prev,
      messages: [{
        id: 'welcome-new',
        role: 'model',
        text: "Conversation réinitialisée. Comment puis-je vous aider?",
        timestamp: new Date()
      }],
      conversationId: `conv-${Date.now()}`
    }));
  };

  const formatMessage = (text: string) => {
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(formatted, { ALLOWED_TAGS: ['strong', 'em', 'br'], ALLOWED_ATTR: ['class'] });
  };

  // Chat window dimensions
  const windowSize = isExpanded
    ? 'md:w-[700px] md:h-[85vh] md:max-h-[900px]'
    : 'md:w-[400px] md:h-[600px]';

  return (
    <>
      {/* ================================================================== */}
      {/* FLOATING TRIGGER - Minimal Glass Frame */}
      {/* ================================================================== */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[100]"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="group relative"
            >
              {/* Glass Frame Container */}
              <div className="relative flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:bg-white/[0.06] hover:border-brand-gold/20 transition-all duration-500">

                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-gold/0 via-brand-gold/5 to-brand-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon */}
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center border border-brand-gold/20">
                  <Brain size={20} className="text-brand-gold" />
                  {/* Status dot */}
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0c] ${
                    state.isConnected ? 'bg-emerald-400' : 'bg-white/30'
                  }`} />
                </div>

                {/* Text */}
                <div className="relative">
                  <p className="text-sm font-medium text-white/90">NOUR</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Assistant IA</p>
                </div>

                {/* Arrow indicator */}
                <div className="relative ml-2">
                  <MessageCircle size={16} className="text-white/30 group-hover:text-brand-gold transition-colors duration-300" />
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* CHAT WINDOW - Premium Glassmorphism */}
      {/* ================================================================== */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Container */}
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed z-[101] flex flex-col
                w-full h-[100dvh] inset-0
                md:inset-auto md:bottom-6 md:right-6 md:rounded-3xl
                ${windowSize}
                transition-all duration-500 ease-out
              `}
              style={{
                background: 'linear-gradient(165deg, rgba(15, 15, 18, 0.95) 0%, rgba(8, 8, 10, 0.98) 100%)',
              }}
            >
              {/* Glass overlay */}
              <div className="absolute inset-0 md:rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
                <div className="absolute inset-0 backdrop-blur-3xl" />
                <div className="absolute inset-[1px] md:rounded-[23px] border border-white/[0.08]" />
              </div>

              {/* Ambient glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-gold/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

              {/* ============================================ */}
              {/* HEADER */}
              {/* ============================================ */}
              <div className="relative z-10 flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center border border-brand-gold/20 shadow-lg shadow-brand-gold/10">
                      <Brain size={24} className="text-brand-gold" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f0f12] ${
                      state.isConnected ? 'bg-emerald-400' : 'bg-white/40'
                    }`} />
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white tracking-tight">NOUR</h3>
                      <span className="px-2 py-0.5 rounded-md bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[9px] font-semibold uppercase tracking-wider">
                        GPT-4
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {state.isConnected ? 'En ligne • Prêt à vous aider' : 'Connexion en cours...'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClear}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                    title="Réinitialiser"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                    title={isExpanded ? "Réduire" : "Agrandir"}
                  >
                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* ============================================ */}
              {/* QUICK ACTIONS */}
              {/* ============================================ */}
              {state.messages.length <= 1 && (
                <div className="relative z-10 px-5 py-4 border-b border-white/[0.04]">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Suggestions</p>
                  <div className="flex gap-2 flex-wrap">
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(action.query)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-brand-gold/10 hover:border-brand-gold/20 transition-all duration-300 group"
                      >
                        <action.icon size={14} className="text-white/40 group-hover:text-brand-gold transition-colors" />
                        <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors">{action.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================ */}
              {/* MESSAGES */}
              {/* ============================================ */}
              <div className="relative z-10 flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {state.messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot indicator */}
                    {msg.role === 'model' && (
                      <div className="w-6 h-6 rounded-lg bg-brand-gold/10 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                        <Sparkles size={12} className="text-brand-gold" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand-gold text-black font-medium rounded-2xl rounded-br-md'
                          : 'bg-white/[0.04] text-white/80 border border-white/[0.06] rounded-2xl rounded-bl-md'
                      }`}
                    >
                      <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                      {msg.isStreaming && (
                        <span className="inline-flex items-center gap-1 ml-2">
                          <span className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-pulse" />
                          <span className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-brand-gold rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* ============================================ */}
              {/* INPUT */}
              {/* ============================================ */}
              <div className="relative z-10 p-5 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center bg-white/[0.04] rounded-2xl border border-white/[0.06] focus-within:border-brand-gold/30 focus-within:bg-white/[0.06] transition-all duration-300">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Votre message..."
                      className="flex-1 bg-transparent px-5 py-4 text-sm text-white placeholder-white/30 outline-none"
                      disabled={state.isLoading}
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={state.isLoading || !input.trim()}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      input.trim() && !state.isLoading
                        ? 'bg-brand-gold text-black hover:scale-105 shadow-lg shadow-brand-gold/20'
                        : 'bg-white/[0.04] text-white/20 cursor-not-allowed'
                    }`}
                  >
                    {state.isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>

                {/* Footer badge */}
                <p className="text-center text-[9px] text-white/20 mt-4 uppercase tracking-widest">
                  Propulsé par OpenAI GPT-4 + FAISS RAG
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(Chatbot);
