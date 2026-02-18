/**
 * PropertyModal Component
 * =======================
 * Modal for viewing, adding, and editing properties
 */

import React, { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Building2, Plus, Save, Eye, Edit3, Trash2,
  MapPin, Bed, Bath, Square, DollarSign, Calendar,
  Image as ImageIcon, AlertCircle, Check, ChevronLeft, ChevronRight,
  ExternalLink, Upload
} from 'lucide-react';
import { Property, PropertyType, ListingCategory } from '../../../types';

// Property form data interface
export interface PropertyFormData {
  name: string;
  type: string;
  category: ListingCategory;
  price: string;
  priceNumeric: number;
  location: string;
  city: string;
  beds: number | null;
  baths: number | null;
  area: string | null;
  areaNumeric: number | null;
  description: string;
  image: string;
  images: string[];
  features: string[];
  url: string;
  isActive: boolean;
}

// Default form data
const defaultFormData: PropertyFormData = {
  name: '',
  type: 'Appartement',
  category: 'SALE',
  price: '',
  priceNumeric: 0,
  location: '',
  city: '',
  beds: null,
  baths: null,
  area: null,
  areaNumeric: null,
  description: '',
  image: '',
  images: [],
  features: [],
  url: '',
  isActive: true
};

// Available property types
const propertyTypes: PropertyType[] = [
  'Appartement', 'Villa', 'Bureau', 'Magasin', 'Entrepôt',
  'Terrain', 'Immeuble', 'Studio', 'Duplex', 'Riad', 'Ferme', 'Autre'
];

// Common features
const commonFeatures = [
  'Piscine', 'Jardin', 'Garage', 'Parking', 'Terrasse', 'Balcon',
  'Ascenseur', 'Climatisation', 'Chauffage', 'Securite 24/7',
  'Concierge', 'Cave', 'Meuble', 'Vue mer', 'Vue montagne',
  'Cuisine equipee', 'Salle de sport', 'Spa', 'Hammam'
];

export type ModalMode = 'view' | 'add' | 'edit';

export interface PropertyModalProps {
  isOpen: boolean;
  mode: ModalMode;
  property?: Property | null;
  onClose: () => void;
  onSave: (data: PropertyFormData, id?: string) => Promise<void>;
  onDelete?: (id: string) => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = memo(({
  isOpen,
  mode,
  property,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<PropertyFormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [currentMode, setCurrentMode] = useState<ModalMode>(mode);

  // Initialize form data when property changes
  useEffect(() => {
    if (property && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: property.name || '',
        type: property.type || 'Appartement',
        category: property.category || 'SALE',
        price: property.price || '',
        priceNumeric: property.priceNumeric || 0,
        location: property.location || '',
        city: property.city || '',
        beds: property.beds,
        baths: property.baths,
        area: property.area,
        areaNumeric: property.areaNumeric,
        description: property.description || '',
        image: property.image || '',
        images: property.images || [],
        features: property.features || [],
        url: property.url || '',
        isActive: (property as any).isActive !== false
      });
    } else if (mode === 'add') {
      setFormData(defaultFormData);
    }
    setCurrentMode(mode);
    setErrors({});
    setSubmitError(null);
    setCurrentImageIndex(0);
    setShowPreview(false);
  }, [property, mode, isOpen]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof PropertyFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.category) {
      newErrors.category = 'La categorie est requise';
    }
    if (formData.priceNumeric <= 0 && !formData.price.trim()) {
      newErrors.price = 'Le prix est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSave(formData, property?.id);
      onClose();
    } catch (error: any) {
      setSubmitError(error.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle feature toggle
  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  // Handle image URL addition
  const addImageUrl = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Get all images for gallery
  const allImages = formData.image
    ? [formData.image, ...formData.images.filter(img => img !== formData.image)]
    : formData.images;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl bg-[#0f0f15] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/[0.06] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center">
                {currentMode === 'add' ? (
                  <Plus size={20} className="text-black" />
                ) : (
                  <Building2 size={20} className="text-black" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {currentMode === 'add' ? 'Nouvelle Propriete' :
                   currentMode === 'edit' ? 'Modifier la Propriete' :
                   'Details de la Propriete'}
                </h3>
                {property && (
                  <p className="text-xs text-white/50">ID: {property.id}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentMode === 'view' && (
                <button
                  onClick={() => setCurrentMode('edit')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <Edit3 size={16} />
                  Modifier
                </button>
              )}
              {(currentMode === 'add' || currentMode === 'edit') && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    showPreview
                      ? 'bg-brand-gold/20 text-brand-gold'
                      : 'bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Eye size={16} />
                  Apercu
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* View Mode */}
            {currentMode === 'view' && property ? (
              <div className="space-y-6">
                {/* Image Gallery */}
                {allImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="aspect-video rounded-xl overflow-hidden bg-white/5 relative">
                      <img
                        src={allImages[currentImageIndex] || '/placeholder-property.jpg'}
                        alt={property.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
                        }}
                      />
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
                          >
                            <ChevronRight size={20} />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {allImages.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentImageIndex(i)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  i === currentImageIndex ? 'bg-white' : 'bg-white/40'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Thumbnails */}
                    {allImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {allImages.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImageIndex(i)}
                            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              i === currentImageIndex ? 'border-brand-gold' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-1">Nom</p>
                    <p className="text-sm text-white font-medium">{property.name}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-1">Type</p>
                    <p className="text-sm text-white">{property.type}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-1">Prix</p>
                    <p className="text-sm text-brand-gold font-semibold">{property.price}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-1">Categorie</p>
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                      property.category === 'RENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {property.category === 'RENT' ? 'Location' : 'Vente'}
                    </span>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-1">Localisation</p>
                    <p className="text-sm text-white">{property.location}</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-1">Ville</p>
                    <p className="text-sm text-white">{property.city}</p>
                  </div>
                  {property.beds && (
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <p className="text-xs text-white/40 mb-1">Chambres</p>
                      <p className="text-sm text-white">{property.beds}</p>
                    </div>
                  )}
                  {property.baths && (
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <p className="text-xs text-white/40 mb-1">Salles de bain</p>
                      <p className="text-sm text-white">{property.baths}</p>
                    </div>
                  )}
                  {property.areaNumeric && (
                    <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                      <p className="text-xs text-white/40 mb-1">Surface</p>
                      <p className="text-sm text-white">{property.areaNumeric} m²</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {property.description && (
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-2">Description</p>
                    <p className="text-sm text-white/80 whitespace-pre-wrap">{property.description}</p>
                  </div>
                )}

                {/* Features */}
                {property.features && property.features.length > 0 && (
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-white/40 mb-3">Caracteristiques</p>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 text-xs bg-white/[0.05] text-white/70 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Link */}
                {property.url && (
                  <a
                    href={property.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/70 hover:text-white hover:border-white/20 transition-all"
                  >
                    <ExternalLink size={16} />
                    Voir l'annonce originale
                  </a>
                )}
              </div>
            ) : (
              /* Edit/Add Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error message */}
                {submitError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {submitError}
                  </div>
                )}

                {/* Preview Mode */}
                {showPreview ? (
                  <div className="space-y-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Apercu</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {formData.image && (
                        <div className="col-span-2 aspect-video rounded-lg overflow-hidden bg-white/5">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-white/40">Nom</p>
                        <p className="text-white font-medium">{formData.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Type</p>
                        <p className="text-white">{formData.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Prix</p>
                        <p className="text-brand-gold font-semibold">{formData.price || `${formData.priceNumeric.toLocaleString()} DH`}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40">Categorie</p>
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                          formData.category === 'RENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {formData.category === 'RENT' ? 'Location' : 'Vente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Informations de base</h4>

                      {/* Name */}
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">Nom de la propriete *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Villa moderne avec piscine"
                          className={`w-full px-4 py-2.5 bg-white/[0.03] border rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all ${
                            errors.name ? 'border-red-500/50' : 'border-white/[0.08]'
                          }`}
                        />
                        {errors.name && (
                          <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                        )}
                      </div>

                      {/* Type & Category */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Type de bien</label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-brand-gold/50 outline-none transition-all"
                          >
                            {propertyTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Categorie *</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ListingCategory }))}
                            className={`w-full px-4 py-2.5 bg-white/[0.03] border rounded-lg text-white focus:border-brand-gold/50 outline-none transition-all ${
                              errors.category ? 'border-red-500/50' : 'border-white/[0.08]'
                            }`}
                          >
                            <option value="SALE">Vente</option>
                            <option value="RENT">Location</option>
                          </select>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Prix affiche</label>
                          <input
                            type="text"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="Ex: 2 500 000 DH"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Prix numerique (DH) *</label>
                          <input
                            type="number"
                            value={formData.priceNumeric || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, priceNumeric: parseInt(e.target.value) || 0 }))}
                            placeholder="2500000"
                            className={`w-full px-4 py-2.5 bg-white/[0.03] border rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all ${
                              errors.price ? 'border-red-500/50' : 'border-white/[0.08]'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Status Toggle */}
                      <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                        <div>
                          <p className="text-sm text-white font-medium">Statut de la propriete</p>
                          <p className="text-xs text-white/50">Active = visible sur le site</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            formData.isActive ? 'bg-green-500' : 'bg-white/20'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                              formData.isActive ? 'left-8' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Localisation</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Quartier/Zone</label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Ex: Anfa, Racine"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Ville</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Casablanca"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Characteristics */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Caracteristiques</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Chambres</label>
                          <input
                            type="number"
                            value={formData.beds ?? ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, beds: e.target.value ? parseInt(e.target.value) : null }))}
                            placeholder="0"
                            min="0"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Salles de bain</label>
                          <input
                            type="number"
                            value={formData.baths ?? ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, baths: e.target.value ? parseInt(e.target.value) : null }))}
                            placeholder="0"
                            min="0"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Surface (m²)</label>
                          <input
                            type="number"
                            value={formData.areaNumeric ?? ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              areaNumeric: e.target.value ? parseInt(e.target.value) : null,
                              area: e.target.value ? `${e.target.value} m²` : null
                            }))}
                            placeholder="120"
                            min="0"
                            className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Images</h4>
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">Image principale (URL)</label>
                        <input
                          type="url"
                          value={formData.image}
                          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                        />
                      </div>

                      {/* Additional Images */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-white/50">Images supplementaires</label>
                          <button
                            type="button"
                            onClick={addImageUrl}
                            className="flex items-center gap-1 text-xs text-brand-gold hover:text-brand-gold/80 transition-colors"
                          >
                            <Plus size={14} />
                            Ajouter
                          </button>
                        </div>
                        {formData.images.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.images.map((img, i) => (
                              <div
                                key={i}
                                className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 group"
                              >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(i)}
                                  className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={16} className="text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Description</h4>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Decrivez le bien en detail..."
                        rows={4}
                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all resize-none"
                      />
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Equipements & Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {commonFeatures.map(feature => (
                          <button
                            key={feature}
                            type="button"
                            onClick={() => toggleFeature(feature)}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                              formData.features.includes(feature)
                                ? 'bg-brand-gold/20 border-brand-gold/50 text-brand-gold'
                                : 'bg-white/[0.02] border-white/[0.08] text-white/60 hover:text-white hover:border-white/20'
                            }`}
                          >
                            {formData.features.includes(feature) && <Check size={12} className="inline mr-1" />}
                            {feature}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* External URL */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Lien externe</h4>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://example.com/annonce"
                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <div>
                    {currentMode === 'edit' && property && onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(property.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-lg bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-brand-gold/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={16} />
                          {currentMode === 'add' ? 'Creer' : 'Enregistrer'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

PropertyModal.displayName = 'PropertyModal';

export default PropertyModal;
