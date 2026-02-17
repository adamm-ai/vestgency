import React, { useState, useCallback, memo } from 'react';
import { SectionId } from '../types';
import { MapPin, Phone, Mail, Send, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import * as CRM from '../services/crmService';

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

const Contact: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', phone: '', message: '', type: 'achat' });
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Parse name into first/last
    const nameParts = formState.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Visiteur';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Map project type to transaction type
    const transactionType: 'RENT' | 'SALE' | undefined =
      formState.type === 'achat' || formState.type === 'vente' ? 'SALE' :
      formState.type === 'location' ? 'RENT' : undefined;

    // Determine urgency based on project type
    const urgency: CRM.LeadUrgency =
      formState.type === 'achat' || formState.type === 'location' ? 'high' : 'medium';

    // Create CRM lead
    CRM.createLead({
      firstName,
      lastName,
      email: formState.email,
      phone: formState.phone,
      source: 'website_form',
      transactionType,
      urgency,
      notes: formState.message ? [{
        id: CRM.generateId(),
        content: `Message du formulaire: ${formState.message}\n\nType de projet: ${formState.type}`,
        createdBy: 'Formulaire Contact',
        createdAt: new Date().toISOString(),
      }] : [],
    });

    console.log('[CRM] Lead created from contact form');

    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setFormState({ name: '', email: '', phone: '', message: '', type: 'achat' });
      }, 4000);
    }, 1500);
  }, [formState]);

  const handleInputChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleTypeChange = useCallback((type: string) => {
    setFormState(prev => ({ ...prev, type }));
  }, []);

  const projectTypes = [
    { value: 'achat', label: 'Achat' },
    { value: 'vente', label: 'Vente' },
    { value: 'location', label: 'Location' },
    { value: 'estimation', label: 'Estimation' },
  ];

  return (
    <section id={SectionId.CONTACT} className="py-16 sm:py-20 md:py-28 relative bg-white dark:bg-[#0a0a0c] overflow-hidden transition-colors duration-500">

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-gold/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Contact</span>
          <h2 className="text-4xl md:text-6xl font-display text-brand-charcoal dark:text-white mb-6">
            Parlons de votre <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-cyan-400 italic font-serif">projet</span>
          </h2>
          <p className="text-brand-charcoal/60 dark:text-white/60 font-light max-w-2xl mx-auto text-lg">
            Notre équipe d'experts est à votre disposition pour vous accompagner dans tous vos projets immobiliers à Casablanca et dans tout le Maroc.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* Left: Contact Info */}
          <div className="lg:col-span-2 space-y-4">
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
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {projectTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleTypeChange(type.value)}
                          className={`px-4 sm:px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        placeholder="Votre nom"
                        className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
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
                        className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
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
                      className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200"
                      value={formState.phone}
                      onChange={handleInputChange('phone')}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs uppercase tracking-widest text-brand-charcoal/50 dark:text-white/40 mb-2 block font-semibold">
                      Votre message
                    </label>
                    <textarea
                      placeholder="Décrivez votre projet immobilier..."
                      rows={4}
                      className="w-full bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-xl px-4 py-3.5 text-brand-charcoal dark:text-white placeholder-brand-charcoal/40 dark:placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/10 outline-none transition-all duration-200 resize-none"
                      value={formState.message}
                      onChange={handleInputChange('message')}
                      required
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 min-h-[52px] bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold uppercase tracking-wider text-sm sm:text-base rounded-xl shadow-lg shadow-brand-gold/25 hover:shadow-brand-gold/40 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
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
