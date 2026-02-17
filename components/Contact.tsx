import React, { useState, useCallback, memo, useMemo } from 'react';
import { SectionId } from '../types';
import { MapPin, Phone, Mail, Send, Clock, CheckCircle2, MessageSquare, Home, Building2, ChevronDown } from 'lucide-react';
import * as CRM from '../services/crmService';

// ============================================================================
// TYPE DEFINITIONS & MAPPINGS
// ============================================================================

type ProjectType = 'achat' | 'vente' | 'location' | 'estimation' | 'gestion_locative';

interface ProjectTypeConfig {
  label: string;
  demandType: CRM.DemandType;
  transactionType: 'RENT' | 'SALE' | undefined;
  urgency: CRM.LeadUrgency;
  requiresPropertyDetails: boolean;
  description: string;
}

/**
 * Mapping des types de projet vers les configurations CRM
 *
 * LOGIQUE MÉTIER:
 * - achat/location → Client cherchant dans le portefeuille → Lead + Demand (property_search)
 * - vente/estimation → Propriétaire voulant vendre → Lead + Demand (property_sale)
 * - gestion_locative → Propriétaire voulant déléguer la gestion → Lead + Demand (property_rental_management)
 */
const PROJECT_TYPE_CONFIG: Record<ProjectType, ProjectTypeConfig> = {
  achat: {
    label: 'Achat',
    demandType: 'property_search',
    transactionType: 'SALE',
    urgency: 'high',
    requiresPropertyDetails: false,
    description: 'Je cherche un bien à acheter',
  },
  location: {
    label: 'Location',
    demandType: 'property_search',
    transactionType: 'RENT',
    urgency: 'high',
    requiresPropertyDetails: false,
    description: 'Je cherche un bien à louer',
  },
  vente: {
    label: 'Vente',
    demandType: 'property_sale',
    transactionType: 'SALE',
    urgency: 'medium',
    requiresPropertyDetails: true,
    description: 'Je souhaite vendre mon bien',
  },
  estimation: {
    label: 'Estimation',
    demandType: 'property_sale',
    transactionType: 'SALE',
    urgency: 'medium',
    requiresPropertyDetails: true,
    description: 'Je souhaite estimer mon bien',
  },
  gestion_locative: {
    label: 'Gestion Locative',
    demandType: 'property_rental_management',
    transactionType: undefined,
    urgency: 'medium',
    requiresPropertyDetails: true,
    description: 'Je souhaite confier la gestion de mon bien',
  },
};

const PROPERTY_TYPES: { value: CRM.PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'riad', label: 'Riad' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'studio', label: 'Studio' },
  { value: 'land', label: 'Terrain' },
  { value: 'commercial', label: 'Local Commercial' },
  { value: 'other', label: 'Autre' },
];

const ContactCard = memo(({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] group hover:border-brand-gold/20 active:border-brand-gold/20 transition-all duration-300">
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0 group-hover:bg-brand-gold group-hover:text-black transition-all duration-300">
        <Icon size={20} className="sm:w-[22px] sm:h-[22px]" />
      </div>
      <div>
        <h4 className="text-brand-charcoal dark:text-white font-semibold mb-1 text-sm sm:text-base">{title}</h4>
        {children}
      </div>
    </div>
  </div>
));

ContactCard.displayName = 'ContactCard';

// ============================================================================
// FORM STATE INTERFACE
// ============================================================================

interface FormState {
  // Contact Info
  name: string;
  email: string;
  phone: string;
  message: string;
  type: ProjectType;

  // Property Details (for sellers/owners)
  propertyType: CRM.PropertyType;
  propertyCity: string;
  propertyPrice: string;
  propertySurface: string;

  // Search Criteria (for buyers/renters)
  searchCity: string;
  budgetMax: string;
}

const INITIAL_FORM_STATE: FormState = {
  name: '',
  email: '',
  phone: '',
  message: '',
  type: 'achat',
  propertyType: 'apartment',
  propertyCity: '',
  propertyPrice: '',
  propertySurface: '',
  searchCity: '',
  budgetMax: '',
};

const Contact: React.FC = () => {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Derived state - check if current project type requires property details
  const currentConfig = useMemo(() => PROJECT_TYPE_CONFIG[formState.type], [formState.type]);
  const showPropertyFields = currentConfig.requiresPropertyDetails;
  const showSearchFields = !currentConfig.requiresPropertyDetails;

  /**
   * SUBMISSION HANDLER
   *
   * Creates both LEAD and DEMAND for complete CRM integration:
   * 1. Lead → Contact tracking and follow-up
   * 2. Demand → Service request with matching engine integration
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const config = PROJECT_TYPE_CONFIG[formState.type];

    // Parse name into first/last
    const nameParts = formState.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Visiteur';
    const lastName = nameParts.slice(1).join(' ') || '';

    // =========================================================================
    // STEP 1: CREATE LEAD (Contact tracking)
    // =========================================================================
    const lead = CRM.createLead({
      firstName,
      lastName,
      email: formState.email,
      phone: formState.phone,
      source: 'website_form',
      transactionType: config.transactionType,
      urgency: config.urgency,
      notes: [{
        id: CRM.generateId(),
        content: `[Formulaire Contact]\n\nType de projet: ${config.label}\nDescription: ${config.description}\n\n${formState.message ? `Message:\n${formState.message}` : '(Pas de message)'}`,
        createdBy: 'Formulaire Contact',
        createdAt: new Date().toISOString(),
      }],
    });

    console.log('[CRM] Lead created from contact form:', lead.id);

    // =========================================================================
    // STEP 2: CREATE DEMAND (Service request with matching)
    // =========================================================================
    const demandData: Parameters<typeof CRM.createDemand>[0] = {
      type: config.demandType,
      firstName,
      lastName,
      email: formState.email,
      phone: formState.phone,
      source: 'website_form',
      urgency: config.urgency,
      leadId: lead.id, // Link to the lead for bidirectional tracking
    };

    // Build search criteria for buyers/renters (property_search)
    if (config.demandType === 'property_search') {
      demandData.searchCriteria = {
        transactionType: config.transactionType!,
        cities: formState.searchCity ? [formState.searchCity.trim()] : undefined,
        budgetMax: formState.budgetMax ? parseInt(formState.budgetMax) : undefined,
        additionalNotes: formState.message || undefined,
      };
    }

    // Build property details for sellers/owners (property_sale, property_rental_management)
    if (config.demandType === 'property_sale' || config.demandType === 'property_rental_management') {
      demandData.propertyDetails = {
        propertyType: formState.propertyType,
        transactionType: config.demandType === 'property_sale' ? 'SALE' : 'MANAGEMENT',
        city: formState.propertyCity.trim() || 'Non spécifié',
        price: formState.propertyPrice ? parseInt(formState.propertyPrice) : undefined,
        surface: formState.propertySurface ? parseInt(formState.propertySurface) : undefined,
        description: formState.message || undefined,
      };
    }

    // Add note with full context
    demandData.notes = [{
      id: CRM.generateId(),
      content: `Demande soumise via formulaire de contact.\n\nType: ${config.label}\n${formState.message ? `\nMessage du client:\n${formState.message}` : ''}`,
      createdBy: 'Formulaire Contact',
      createdAt: new Date().toISOString(),
    }];

    const demand = CRM.createDemand(demandData);
    console.log('[CRM] Demand created from contact form:', demand.id, '| Type:', config.demandType);

    // =========================================================================
    // STEP 3: SUCCESS FEEDBACK
    // =========================================================================
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setFormState(INITIAL_FORM_STATE);
      }, 4000);
    }, 1500);
  }, [formState]);

  const handleInputChange = useCallback((field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormState(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleTypeChange = useCallback((type: ProjectType) => {
    setFormState(prev => ({ ...prev, type }));
  }, []);

  // All available project types
  const projectTypes: { value: ProjectType; label: string }[] = [
    { value: 'achat', label: 'Achat' },
    { value: 'location', label: 'Location' },
    { value: 'vente', label: 'Vente' },
    { value: 'estimation', label: 'Estimation' },
    { value: 'gestion_locative', label: 'Gestion Locative' },
  ];

  return (
    <section id={SectionId.CONTACT} className="py-16 sm:py-20 md:py-28 relative bg-white dark:bg-[#0a0a0c] overflow-hidden transition-colors duration-500">

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-gold/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 px-2">
          <span className="text-brand-gold text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-3 sm:mb-4 block">Contact</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display text-brand-charcoal dark:text-white mb-4 sm:mb-6 leading-tight">
            Parlons de votre <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-cyan-400 italic font-serif">projet</span>
          </h2>
          <p className="text-brand-charcoal/60 dark:text-white/60 font-light max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Notre équipe d'experts est à votre disposition pour vous accompagner dans tous vos projets immobiliers à Casablanca et dans tout le Maroc.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 sm:gap-8 items-start">

          {/* Left: Contact Info - Stacks on mobile, 2-column on tablet */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            <ContactCard icon={MapPin} title="Adresse">
              <p className="text-brand-charcoal/60 dark:text-white/50 text-sm leading-relaxed">
                Boulevard Anfa, Quartier Racine<br />
                Casablanca, Maroc
              </p>
            </ContactCard>

            <ContactCard icon={Phone} title="Téléphone">
              <a href="tel:+212522000000" className="text-brand-charcoal/60 dark:text-white/50 text-sm hover:text-brand-gold transition-colors duration-200 block">
                +212 5 22 00 00 00
              </a>
              <a href="tel:+212661000000" className="text-brand-charcoal/60 dark:text-white/50 text-sm hover:text-brand-gold transition-colors duration-200 block">
                +212 6 61 00 00 00
              </a>
            </ContactCard>

            <ContactCard icon={Mail} title="Email">
              <a href="mailto:contact@athome.com" className="text-brand-charcoal/60 dark:text-white/50 text-sm hover:text-brand-gold transition-colors duration-200">
                contact@athome.com
              </a>
            </ContactCard>

            <ContactCard icon={Clock} title="Horaires">
              <p className="text-brand-charcoal/60 dark:text-white/50 text-sm">
                Lun - Ven: 09:00 - 19:00<br />
                Sam: 10:00 - 14:00
              </p>
            </ContactCard>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-[#0c0c0f] p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-black/[0.04] dark:border-white/[0.06] relative overflow-hidden shadow-2xl dark:shadow-black/40">

              {/* Decorative */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-gold/10 blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              {/* Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold text-brand-charcoal dark:text-white">Formulaire de contact</h3>
                  <p className="text-brand-charcoal/50 dark:text-white/50 text-xs">Réponse sous 24h garantie</p>
                </div>
              </div>

              {isSent ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-brand-charcoal dark:text-white text-2xl font-display font-bold mb-3">Message envoyé !</h4>
                  <p className="text-brand-charcoal/60 dark:text-white/60 text-sm max-w-sm">
                    Merci pour votre message. Un conseiller vous contactera dans les plus brefs délais.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Type */}
                  <div>
                    <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-3 block font-semibold">
                      Type de projet
                    </label>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-2.5">
                      {projectTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleTypeChange(type.value)}
                          className={`px-3 sm:px-5 py-3 sm:py-2.5 min-h-[48px] sm:min-h-[44px] rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 touch-manipulation ${
                            formState.type === type.value
                              ? 'bg-brand-gold text-black'
                              : 'bg-black/[0.03] dark:bg-white/[0.05] text-brand-charcoal/70 dark:text-white/60 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        placeholder="Votre nom"
                        className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 sm:py-3.5 min-h-[48px] text-base sm:text-sm text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                        value={formState.name}
                        onChange={handleInputChange('name')}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="votre@email.com"
                        className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 sm:py-3.5 min-h-[48px] text-base sm:text-sm text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                        value={formState.email}
                        onChange={handleInputChange('email')}
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="+212 6 00 00 00 00"
                      className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 sm:py-3.5 min-h-[48px] text-base sm:text-sm text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                      value={formState.phone}
                      onChange={handleInputChange('phone')}
                    />
                  </div>

                  {/* ================================================================= */}
                  {/* CONDITIONAL FIELDS - Property Details (Sellers/Owners)           */}
                  {/* ================================================================= */}
                  {showPropertyFields && (
                    <div className="p-3 sm:p-4 rounded-xl bg-brand-gold/5 dark:bg-brand-gold/10 border border-brand-gold/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Home size={16} className="text-brand-gold" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-brand-gold">
                          Détails de votre bien
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Property Type */}
                        <div>
                          <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                            Type de bien
                          </label>
                          <div className="relative">
                            <select
                              value={formState.propertyType}
                              onChange={handleInputChange('propertyType')}
                              className="w-full bg-white dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 min-h-[48px] text-base sm:text-sm text-brand-charcoal dark:text-white focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200 appearance-none cursor-pointer"
                            >
                              {PROPERTY_TYPES.map(pt => (
                                <option key={pt.value} value={pt.value}>{pt.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-charcoal/40 dark:text-white/40 pointer-events-none" />
                          </div>
                        </div>

                        {/* City */}
                        <div>
                          <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                            Ville
                          </label>
                          <input
                            type="text"
                            placeholder="Casablanca, Marrakech..."
                            className="w-full bg-white dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 min-h-[48px] text-base sm:text-sm text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                            value={formState.propertyCity}
                            onChange={handleInputChange('propertyCity')}
                          />
                        </div>

                        {/* Price (only for vente/estimation) */}
                        {(formState.type === 'vente' || formState.type === 'estimation') && (
                          <div>
                            <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                              Prix estimé (DH)
                            </label>
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder="2 500 000"
                              className="w-full bg-white dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 min-h-[48px] text-base sm:text-sm text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                              value={formState.propertyPrice}
                              onChange={handleInputChange('propertyPrice')}
                            />
                          </div>
                        )}

                        {/* Surface */}
                        <div>
                          <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                            Surface (m²)
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="120"
                            className="w-full bg-white dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 min-h-[48px] text-base sm:text-sm text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                            value={formState.propertySurface}
                            onChange={handleInputChange('propertySurface')}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================================================================= */}
                  {/* CONDITIONAL FIELDS - Search Criteria (Buyers/Renters)            */}
                  {/* ================================================================= */}
                  {showSearchFields && (
                    <div className="p-3 sm:p-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={16} className="text-blue-500" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-500">
                          Critères de recherche (optionnel)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search City */}
                        <div>
                          <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                            Ville souhaitée
                          </label>
                          <input
                            type="text"
                            placeholder="Casablanca, Rabat..."
                            className="w-full bg-white dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 min-h-[48px] text-base sm:text-sm text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                            value={formState.searchCity}
                            onChange={handleInputChange('searchCity')}
                          />
                        </div>

                        {/* Budget Max */}
                        <div>
                          <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                            Budget max (DH)
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="3 000 000"
                            className="w-full bg-white dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 min-h-[48px] text-base sm:text-sm text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                            value={formState.budgetMax}
                            onChange={handleInputChange('budgetMax')}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                      Votre message
                    </label>
                    <textarea
                      placeholder="Décrivez votre projet immobilier..."
                      rows={4}
                      className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 text-base sm:text-sm text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200 resize-none"
                      value={formState.message}
                      onChange={handleInputChange('message')}
                      required
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 min-h-[56px] sm:min-h-[52px] bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold uppercase tracking-wider text-sm sm:text-base rounded-xl shadow-lg shadow-brand-gold/25 hover:shadow-brand-gold/40 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 touch-manipulation"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        Envoyer ma demande
                        <Send size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default memo(Contact);
