/**
 * PropertyCard Component
 * ======================
 * Grid view card for property display in admin portal
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Bed, Square, Edit3, Trash2, Eye, ToggleLeft, ToggleRight,
  ExternalLink, DollarSign, Home
} from 'lucide-react';
import { Property } from '../../../types';

export interface PropertyCardProps {
  property: Property & { isActive?: boolean };
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onView: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = memo(({
  property,
  isSelected = false,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onToggleActive
}) => {
  const isActive = property.isActive !== false; // Default to active

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className={`relative group rounded-2xl overflow-hidden bg-white/[0.02] border transition-all duration-300 ${
        isSelected
          ? 'border-brand-gold ring-2 ring-brand-gold/20'
          : 'border-white/[0.06] hover:border-white/[0.12]'
      } ${!isActive ? 'opacity-60' : ''}`}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(property.id);
            }}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-brand-gold border-brand-gold'
                : 'bg-black/50 border-white/30 hover:border-white/50'
            }`}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Category Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full backdrop-blur-sm ${
          property.category === 'RENT'
            ? 'bg-emerald-500/80 text-white'
            : 'bg-blue-500/80 text-white'
        }`}>
          {property.category === 'RENT' ? 'Location' : 'Vente'}
        </span>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
        <img
          src={property.image || '/placeholder-property.jpg'}
          alt={property.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';
          }}
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(property);
              }}
              className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all"
              title="Voir details"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(property);
              }}
              className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all"
              title="Modifier"
            >
              <Edit3 size={18} />
            </button>
            {onToggleActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(property);
                }}
                className={`p-2.5 rounded-full backdrop-blur-sm transition-all ${
                  isActive
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
                title={isActive ? 'Desactiver' : 'Activer'}
              >
                {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(property.id);
              }}
              className="p-2.5 rounded-full bg-red-500/20 backdrop-blur-sm text-red-400 hover:bg-red-500/30 transition-all"
              title="Supprimer"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Inactive overlay */}
        {!isActive && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-red-500/80 text-white text-xs font-bold rounded-full">
              Inactif
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Type Badge */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-white/[0.05] text-white/60">
            {property.type}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight min-h-[2.5rem]">
          {property.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-white/50">
          <MapPin size={12} />
          <span className="text-xs truncate">{property.location || property.city}</span>
        </div>

        {/* Features */}
        <div className="flex items-center gap-3 text-white/40">
          {property.beds !== null && property.beds > 0 && (
            <div className="flex items-center gap-1">
              <Bed size={12} />
              <span className="text-xs">{property.beds}</span>
            </div>
          )}
          {property.areaNumeric !== null && property.areaNumeric > 0 && (
            <div className="flex items-center gap-1">
              <Square size={12} />
              <span className="text-xs">{property.areaNumeric} m²</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="pt-2 border-t border-white/[0.06]">
          <p className="text-lg font-bold text-brand-gold">
            {property.price}
          </p>
        </div>
      </div>

      {/* Quick Link */}
      {property.url && (
        <a
          href={property.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-16 z-10 p-1.5 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
          title="Voir l'annonce"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </motion.div>
  );
});

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;
