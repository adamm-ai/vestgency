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
  Maximize2, Minimize2, MessageCircle,
  Bed, Bath, Ruler, ExternalLink, ChevronRight
} from 'lucide-react';
import { ChatMessage, ChatProperty } from '../types';
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
// PROPERTY CARD COMPONENT - Horizontal Premium Design
// ============================================================================

interface PropertyCardProps {
  property: ChatProperty;
  index: number;
  onSelect: (id: string) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = memo(({ property, index, onSelect }) => {
  const formatPrice = (price: string, category: string) => {
    if (price === 'Prix sur demande') return price;
    return price;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(property.id)}
      className="group cursor-pointer flex bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.08] border border-white/[0.08] hover:border-brand-gold/30 rounded-2xl overflow-hidden transition-all duration-200 shadow-lg shadow-black/25 touch-manipulation"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Image - Left Side */}
      <div className="relative w-[88px] md:w-24 h-[72px] md:h-20 flex-shrink-0 overflow-hidden">
        {property.image ? (
          <img
            src={property.image}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
            <Home size={20} className="text-brand-gold/40" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
      </div>

      {/* Content - Right Side */}
      <div className="flex-1 p-2.5 md:p-2.5 flex flex-col justify-between min-w-0">
        {/* Top Row: Type Badge + Price */}
        <div className="flex items-center justify-between gap-2">
          <span className={`px-1.5 py-0.5 rounded-md ios-caption-2 font-bold uppercase tracking-wide flex-shrink-0 ${
            property.category === 'RENT'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
          }`}>
            {property.type || (property.category === 'RENT' ? 'Location' : 'Vente')}
          </span>
          <span className="text-brand-gold font-bold ios-footnote truncate">
            {formatPrice(property.price, property.category)}
          </span>
        </div>

        {/* Middle: Location */}
        <div className="flex items-center gap-1 text-white/50 ios-caption my-1">
          <MapPin size={10} className="flex-shrink-0" />
          <span className="truncate">{property.location || property.city || 'Casablanca'}</span>
        </div>

        {/* Bottom Row: Specs + Arrow */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white/45 ios-caption-2">
            {property.beds && (
              <div className="flex items-center gap-1">
                <Bed size={11} />
                <span>{property.beds}</span>
              </div>
            )}
            {property.baths && (
              <div className="flex items-center gap-1">
                <Bath size={11} />
                <span>{property.baths}</span>
              </div>
            )}
            {property.area && (
              <div className="flex items-center gap-1">
                <Ruler size={11} />
                <span className="truncate max-w-[50px]">{property.area}</span>
              </div>
            )}
          </div>
          <div className="w-6 h-6 rounded-full bg-brand-gold/10 flex items-center justify-center group-hover:bg-brand-gold/20 group-active:bg-brand-gold/25 transition-colors">
            <ChevronRight size={14} className="text-brand-gold group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PropertyCard.displayName = 'PropertyCard';

// ============================================================================
// PROPERTY CARDS LIST - Vertical Stack by Relevance
// ============================================================================

interface PropertyCardsProps {
  properties: ChatProperty[];
  onSelectProperty: (id: string) => void;
}

const PropertyCards: React.FC<PropertyCardsProps> = memo(({ properties, onSelectProperty }) => {
  if (!properties || properties.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 }}
      className="mt-3 space-y-2"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-3 bg-brand-gold rounded-full" />
        <p className="text-[9px] text-white/40 uppercase tracking-widest font-medium">
          {properties.length} bien{properties.length > 1 ? 's' : ''} trouvé{properties.length > 1 ? 's' : ''}
        </p>
      </div>
      {properties.map((property, index) => (
        <PropertyCard
          key={property.id}
          property={property}
          index={index}
          onSelect={onSelectProperty}
        />
      ))}
    </motion.div>
  );
});

PropertyCards.displayName = 'PropertyCards';

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

  // Navigate to property page
  const handlePropertySelect = useCallback((propertyId: string) => {
    // Close chatbot and navigate to property
    setIsOpen(false);
    window.location.href = `/property/${propertyId}`;
  }, []);

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
      // Use query parameters (server expects query params, not JSON body)
      const params = new URLSearchParams({
        message: messageText,
        conversation_id: state.conversationId,
        stream: 'false'
      });
      const response = await fetch(`${RAG_API_URL}/api/chat?${params.toString()}`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      const responseText = data.response || "Erreur de traitement.";
      const suggestedProperties: ChatProperty[] = data.properties || [];

      // Extract AI-detected urgency from response
      if (data.analysis?.urgency) {
        setAiDetectedUrgency(data.analysis.urgency);
        console.log(`[CRM] AI detected urgency: ${data.analysis.urgency} - ${data.analysis.reason || ''}`);
      }

      // Log property suggestions for CRM tracking
      if (suggestedProperties.length > 0) {
        console.log(`[Chatbot] Suggested ${suggestedProperties.length} properties`);
        const propertyIds = suggestedProperties.map(p => p.id);
        setPropertiesViewed(prev => [...new Set([...prev, ...propertyIds])]);
      }

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === modelMsgId
            ? { ...msg, text: responseText, isStreaming: false, properties: suggestedProperties }
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
      {/* FLOATING TRIGGER - iOS-style Glass Pill */}
      {/* ================================================================== */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 md:right-6 z-[100]"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="group relative active:scale-95 transition-transform duration-150 touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Glass Frame Container - iOS-style */}
              <div className="relative flex items-center gap-3 px-4 md:px-5 py-3 rounded-2xl bg-black/80 md:bg-white/[0.03] backdrop-blur-2xl border border-white/[0.1] md:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/[0.06] hover:border-brand-gold/20 transition-all duration-500">

                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-gold/0 via-brand-gold/5 to-brand-gold/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Icon */}
                <div className="relative w-11 h-11 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center border border-brand-gold/20">
                  <Brain size={22} className="md:w-5 md:h-5 text-brand-gold" />
                  {/* Status dot */}
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black md:border-[#0a0a0c] ${
                    state.isConnected ? 'bg-emerald-400' : 'bg-white/30'
                  }`} />
                </div>

                {/* Text */}
                <div className="relative">
                  <p className="ios-subheadline font-semibold text-white/90">NOUR</p>
                  <p className="ios-caption-2 text-white/40 uppercase tracking-wider">Assistant IA</p>
                </div>

                {/* Arrow indicator */}
                <div className="relative ml-1 md:ml-2">
                  <MessageCircle size={18} className="md:w-4 md:h-4 text-white/30 group-hover:text-brand-gold transition-colors duration-300" />
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================== */}
      {/* CHAT WINDOW - iOS Messages-style Glassmorphism */}
      {/* ================================================================== */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile - iOS-style blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xl z-[100] md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Container - iOS Sheet-style on mobile */}
            <motion.div
              initial={{ opacity: 0, y: '100%', scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: '100%', scale: 1 }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className={`fixed z-[101] flex flex-col
                w-full h-[calc(100dvh-env(safe-area-inset-top,0px)-44px)] bottom-0 left-0 right-0
                rounded-t-[28px]
                md:inset-auto md:bottom-6 md:right-6 md:rounded-3xl md:h-auto
                ${windowSize}
                transition-all duration-500 ease-out
              `}
              style={{
                background: 'linear-gradient(165deg, rgba(18, 18, 22, 0.98) 0%, rgba(10, 10, 12, 0.99) 100%)',
              }}
            >
              {/* iOS-style pull indicator for mobile */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-[5px] rounded-full bg-white/20 md:hidden z-20" />

              {/* Glass overlay - enhanced for iOS feel */}
              <div className="absolute inset-0 rounded-t-[28px] md:rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
                <div className="absolute inset-0 backdrop-blur-3xl" />
                <div className="absolute inset-[1px] rounded-t-[27px] md:rounded-[23px] border border-white/[0.08]" />
              </div>

              {/* Ambient glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-gold/15 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/8 rounded-full blur-[80px] pointer-events-none" />

              {/* ============================================ */}
              {/* HEADER - iOS-style navigation bar */}
              {/* ============================================ */}
              <div className="relative z-10 flex items-center justify-between px-4 md:px-5 pt-6 md:pt-5 pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 flex items-center justify-center border border-brand-gold/20 shadow-lg shadow-brand-gold/10">
                      <Brain size={22} className="md:w-6 md:h-6 text-brand-gold" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 border-[#121216] ${
                      state.isConnected ? 'bg-emerald-400' : 'bg-white/40'
                    }`} />
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="ios-headline text-white tracking-tight">NOUR</h3>
                      <span className="px-1.5 py-0.5 rounded-md bg-brand-gold/10 border border-brand-gold/20 text-brand-gold ios-caption-2 font-semibold uppercase tracking-wider">
                        GPT-4
                      </span>
                    </div>
                    <p className="ios-caption-2 text-white/40 mt-0.5">
                      {state.isConnected ? 'En ligne' : 'Connexion...'}
                    </p>
                  </div>
                </div>

                {/* Actions - iOS-style touch targets */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handleClear}
                    className="w-10 h-10 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white active:bg-white/[0.08] hover:bg-white/[0.06] transition-all duration-200 touch-manipulation"
                    title="Réinitialiser"
                  >
                    <RotateCcw size={18} className="md:w-4 md:h-4" />
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
                    className="w-10 h-10 md:w-9 md:h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-red-400 active:bg-red-500/15 hover:bg-red-500/10 transition-all duration-200 touch-manipulation"
                  >
                    <X size={20} className="md:w-[18px] md:h-[18px]" />
                  </button>
                </div>
              </div>

              {/* ============================================ */}
              {/* QUICK ACTIONS - iOS-style pill buttons */}
              {/* ============================================ */}
              {state.messages.length <= 1 && (
                <div className="relative z-10 px-4 md:px-5 py-4 border-b border-white/[0.04]">
                  <p className="ios-caption-2 text-white/30 uppercase tracking-widest mb-3">Suggestions</p>
                  <div className="flex gap-2 flex-wrap">
                    {QUICK_ACTIONS.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(action.query)}
                        className="flex items-center gap-2 px-4 py-3 md:py-2.5 min-h-[44px] rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-brand-gold/10 hover:border-brand-gold/20 active:scale-[0.97] transition-all duration-200 group touch-manipulation"
                      >
                        <action.icon size={16} className="md:w-3.5 md:h-3.5 text-white/40 group-hover:text-brand-gold transition-colors" />
                        <span className="ios-subheadline md:text-xs text-white/60 group-hover:text-white/90 transition-colors">{action.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================ */}
              {/* MESSAGES - iOS iMessage-style bubbles */}
              {/* ============================================ */}
              <div className="relative z-10 flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent momentum-scroll">
                {state.messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  const isFirstInGroup = index === 0 || state.messages[index - 1].role !== msg.role;
                  const isLastInGroup = index === state.messages.length - 1 || state.messages[index + 1]?.role !== msg.role;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", damping: 25, stiffness: 400 }}
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                        {/* Bot avatar - only show for first message in group */}
                        {!isUser && isFirstInGroup && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/10 flex items-center justify-center mr-2 flex-shrink-0 mt-auto mb-0.5 border border-brand-gold/20">
                            <Sparkles size={13} className="text-brand-gold" />
                          </div>
                        )}
                        {/* Spacer for non-first messages */}
                        {!isUser && !isFirstInGroup && (
                          <div className="w-7 mr-2 flex-shrink-0" />
                        )}

                        {/* Message bubble - iOS Messages style */}
                        <div
                          className={`max-w-[80%] md:max-w-[85%] px-4 py-2.5 ios-body leading-relaxed ${
                            isUser
                              ? `bg-brand-gold text-black font-medium shadow-lg shadow-brand-gold/20
                                 ${isFirstInGroup && isLastInGroup ? 'rounded-[20px]' : ''}
                                 ${isFirstInGroup && !isLastInGroup ? 'rounded-[20px] rounded-br-lg' : ''}
                                 ${!isFirstInGroup && isLastInGroup ? 'rounded-[20px] rounded-tr-lg' : ''}
                                 ${!isFirstInGroup && !isLastInGroup ? 'rounded-[20px] rounded-r-lg' : ''}`
                              : `bg-white/[0.06] text-white/90 border border-white/[0.08]
                                 ${isFirstInGroup && isLastInGroup ? 'rounded-[20px]' : ''}
                                 ${isFirstInGroup && !isLastInGroup ? 'rounded-[20px] rounded-bl-lg' : ''}
                                 ${!isFirstInGroup && isLastInGroup ? 'rounded-[20px] rounded-tl-lg' : ''}
                                 ${!isFirstInGroup && !isLastInGroup ? 'rounded-[20px] rounded-l-lg' : ''}`
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
                      </div>

                      {/* Property Cards for bot messages */}
                      {!isUser && msg.properties && msg.properties.length > 0 && (
                        <div className="w-full pl-9 mt-2">
                          <PropertyCards
                            properties={msg.properties}
                            onSelectProperty={handlePropertySelect}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} className="h-1" />
              </div>

              {/* ============================================ */}
              {/* INPUT - iOS Messages-style input bar */}
              {/* ============================================ */}
              <div className="relative z-10 px-4 md:px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,8px)+8px)] md:pb-5 border-t border-white/[0.06] bg-black/20 backdrop-blur-xl">
                <div className="flex items-end gap-2 md:gap-3">
                  <div className="flex-1 flex items-center bg-white/[0.06] rounded-[22px] border border-white/[0.08] focus-within:border-brand-gold/30 focus-within:bg-white/[0.08] transition-all duration-300">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Message..."
                      autoCapitalize="sentences"
                      autoCorrect="on"
                      className="flex-1 bg-transparent px-4 md:px-5 py-3.5 md:py-4 ios-body text-white placeholder-white/35 outline-none touch-manipulation"
                      disabled={state.isLoading}
                      enterKeyHint="send"
                    />
                  </div>

                  {/* Send button - iOS-style circular */}
                  <button
                    onClick={handleSend}
                    disabled={state.isLoading || !input.trim()}
                    className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 touch-manipulation ${
                      input.trim() && !state.isLoading
                        ? 'bg-brand-gold text-black active:scale-90 shadow-lg shadow-brand-gold/25'
                        : 'bg-white/[0.06] text-white/25 cursor-not-allowed'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {state.isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={18} className="translate-x-[1px]" />
                    )}
                  </button>
                </div>

                {/* Footer badge - hidden on mobile for cleaner look */}
                <p className="hidden md:block text-center ios-caption-2 text-white/15 mt-4 uppercase tracking-widest">
                  OpenAI GPT-4 + FAISS RAG
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
