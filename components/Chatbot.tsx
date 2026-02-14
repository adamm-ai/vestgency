/**
 * NOUR - Elite AI Real Estate Assistant
 * =====================================
 * Premium glassmorphic chatbot with exceptional minimalism.
 * OpenAI GPT-4 + RAG powered.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

  // Extract contact info from user message
  const extractInfoFromMessage = useCallback((text: string) => {
    const contactInfo = CRM.extractContactFromMessage(text);
    const budget = CRM.detectBudget(text);

    // Detect transaction type
    let transactionType: 'RENT' | 'SALE' | undefined;
    const textLower = text.toLowerCase();
    if (textLower.includes('louer') || textLower.includes('location') || textLower.includes('bail')) {
      transactionType = 'RENT';
    } else if (textLower.includes('acheter') || textLower.includes('achat') || textLower.includes('vendre')) {
      transactionType = 'SALE';
    }

    // Detect city
    let city: string | undefined;
    const cities = ['casablanca', 'rabat', 'marrakech', 'tanger', 'fes', 'agadir', 'anfa', 'bouskoura', 'californie'];
    for (const c of cities) {
      if (textLower.includes(c)) {
        city = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }

    return {
      ...contactInfo,
      ...budget,
      transactionType,
      city,
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

    CRM.convertChatToLead(state.conversationId, crmMessages, {
      firstName: extractedData.firstName,
      lastName: extractedData.lastName,
      email: extractedData.email,
      phone: extractedData.phone,
      city: extractedData.city,
      transactionType: extractedData.transactionType,
      budgetMin: extractedData.budgetMin,
      budgetMax: extractedData.budgetMax,
    });

    setLeadCreated(true);
    console.log('[CRM] Lead created from chatbot conversation');
  }, [extractedData, leadCreated, state.messages, state.conversationId]);

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
      const response = await fetch(`${RAG_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: state.conversationId,
          stream: true
        })
      });

      if (!response.ok) throw new Error('Failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content') {
                  fullResponse += data.content;
                  setState(prev => ({
                    ...prev,
                    messages: prev.messages.map(msg =>
                      msg.id === modelMsgId ? { ...msg, text: fullResponse } : msg
                    )
                  }));
                }
              } catch { /* ignore */ }
            }
          }
        }
      }

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
        ),
        isLoading: false
      }));

    } catch {
      try {
        const response = await fetch(`${RAG_API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            conversation_id: state.conversationId,
            stream: false
          })
        });

        const data = await response.json();

        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === modelMsgId
              ? { ...msg, text: data.response || "Erreur de traitement.", isStreaming: false }
              : msg
          ),
          isLoading: false
        }));
      } catch {
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
    }
  }, [state.isLoading, state.conversationId]);

  const handleSend = () => sendMessage(input);

  const handleClear = async () => {
    // Create lead before clearing if we have contact info
    if ((extractedData.email || extractedData.phone) && !leadCreated) {
      convertToCRMLead();
    }

    try {
      await fetch(`${RAG_API_URL}/api/chat/clear?conversation_id=${state.conversationId}`, {
        method: 'POST'
      });
    } catch { /* ignore */ }

    // Reset CRM tracking
    setExtractedData({});
    setLeadCreated(false);

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

export default Chatbot;
