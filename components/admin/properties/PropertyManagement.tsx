/**
 * PropertyManagement Component
 * ============================
 * Complete property management interface for the admin portal
 *
 * Features:
 * - List/Grid view toggle
 * - Search, filter, and sort
 * - Pagination
 * - Add/Edit/Delete properties
 * - Bulk actions (select, delete, status change, export)
 * - Property detail view
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Download, RefreshCw, Filter, X, Check,
  ChevronLeft, ChevronRight, ChevronDown, Building2, Home,
  Edit3, Trash2, Eye, Grid3X3, List, ToggleLeft, ToggleRight,
  MapPin, DollarSign, SlidersHorizontal, AlertCircle
} from 'lucide-react';
import { Property, PropertyFilters, ListingCategory, PropertyType } from '../../../types';
import { propertiesAPI } from '../../../services/api';
import { getProperties, getFilterOptions } from '../../../services/propertyService';
import { exportToCSV, formatPrice } from '../shared/utils';
import { PropertyCard } from './PropertyCard';
import { PropertyModal, PropertyFormData, ModalMode } from './PropertyModal';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'price' | 'date' | 'location' | 'type';
type SortDirection = 'asc' | 'desc';

interface PropertyWithActive extends Property {
  isActive?: boolean;
}

interface FilterState {
  category: 'ALL' | ListingCategory;
  type: string;
  city: string;
  minPrice: number | '';
  maxPrice: number | '';
  minArea: number | '';
  maxArea: number | '';
  beds: number | '';
  status: 'all' | 'active' | 'inactive';
}

const defaultFilters: FilterState = {
  category: 'ALL',
  type: '',
  city: '',
  minPrice: '',
  maxPrice: '',
  minArea: '',
  maxArea: '',
  beds: '',
  status: 'all'
};

// ============================================================================
// CONSTANTS
// ============================================================================

const ITEMS_PER_PAGE = 20;

const propertyTypes: PropertyType[] = [
  'Appartement', 'Villa', 'Bureau', 'Magasin', 'Entrepôt',
  'Terrain', 'Immeuble', 'Studio', 'Duplex', 'Riad', 'Ferme', 'Autre'
];

// ============================================================================
// COMPONENT
// ============================================================================

export interface PropertyManagementProps {
  onPropertySelect?: (property: Property) => void;
}

export const PropertyManagement: React.FC<PropertyManagementProps> = memo(({ onPropertySelect }) => {
  // State
  const [properties, setProperties] = useState<PropertyWithActive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selection state (for bulk actions)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<{
    types: string[];
    cities: string[];
  }>({ types: [], cities: [] });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build API filters
      const apiFilters: PropertyFilters = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined,
        category: filters.category !== 'ALL' ? filters.category : undefined,
        type: filters.type || undefined,
        location: filters.city || undefined,
        minPrice: filters.minPrice !== '' ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice !== '' ? filters.maxPrice : undefined,
        minArea: filters.minArea !== '' ? filters.minArea : undefined,
        maxArea: filters.maxArea !== '' ? filters.maxArea : undefined,
        beds: filters.beds !== '' ? filters.beds : undefined,
        sort: sortField === 'price'
          ? (sortDirection === 'asc' ? 'price_asc' : 'price_desc')
          : sortField === 'date'
            ? 'date_desc'
            : sortField === 'area'
              ? 'area_desc'
              : undefined
      };

      const response = await getProperties(apiFilters);

      if (response.success) {
        setProperties(response.data.map(p => ({ ...p, isActive: true })));
        setTotalItems(response.pagination.total);
      }
    } catch (err: any) {
      console.error('Failed to load properties:', err);
      setError(err.message || 'Erreur lors du chargement des proprietes');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, filters, sortField, sortDirection]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const response = await getFilterOptions();
      if (response.success) {
        setFilterOptions({
          types: response.data.types,
          cities: response.data.locations
        });
      }
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // ============================================================================
  // FILTERING & SORTING (client-side backup)
  // ============================================================================

  const filteredAndSortedProperties = useMemo(() => {
    let result = [...properties];

    // Filter by status (client-side only)
    if (filters.status !== 'all') {
      result = result.filter(p =>
        filters.status === 'active' ? p.isActive !== false : p.isActive === false
      );
    }

    // Sort (if not handled by API)
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = (a.priceNumeric || 0) - (b.priceNumeric || 0);
          break;
        case 'location':
          comparison = (a.location || '').localeCompare(b.location || '');
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
        case 'date':
        default:
          comparison = new Date(b.dateScraped || 0).getTime() - new Date(a.dateScraped || 0).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [properties, filters.status, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedProperties = filteredAndSortedProperties;

  // ============================================================================
  // SELECTION HANDLERS
  // ============================================================================

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (isSelectAll) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProperties.map(p => p.id)));
    }
    setIsSelectAll(!isSelectAll);
  }, [isSelectAll, paginatedProperties]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectAll(false);
  }, []);

  // ============================================================================
  // CRUD HANDLERS
  // ============================================================================

  const handleView = useCallback((property: Property) => {
    setSelectedProperty(property);
    setModalMode('view');
    setShowModal(true);
    onPropertySelect?.(property);
  }, [onPropertySelect]);

  const handleEdit = useCallback((property: Property) => {
    setSelectedProperty(property);
    setModalMode('edit');
    setShowModal(true);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedProperty(null);
    setModalMode('add');
    setShowModal(true);
  }, []);

  const handleSave = useCallback(async (data: PropertyFormData, id?: string) => {
    try {
      if (id) {
        // Update existing
        await propertiesAPI.update(id, {
          name: data.name,
          type: data.type,
          category: data.category,
          price: data.price,
          priceNumeric: data.priceNumeric,
          location: data.location,
          city: data.city,
          beds: data.beds ?? undefined,
          areaNumeric: data.areaNumeric ?? undefined,
          image: data.image,
          isActive: data.isActive
        });
      } else {
        // Create new
        await propertiesAPI.create({
          name: data.name,
          type: data.type,
          category: data.category,
          price: data.price,
          priceNumeric: data.priceNumeric,
          location: data.location,
          city: data.city,
          beds: data.beds ?? undefined,
          areaNumeric: data.areaNumeric ?? undefined,
          image: data.image,
          isActive: data.isActive
        });
      }
      await loadProperties();
    } catch (err: any) {
      throw new Error(err.message || 'Erreur lors de la sauvegarde');
    }
  }, [loadProperties]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await propertiesAPI.delete(id);
      await loadProperties();
      setDeleteConfirmId(null);
      setShowModal(false);
    } catch (err: any) {
      console.error('Failed to delete property:', err);
      setError(err.message || 'Erreur lors de la suppression');
    }
  }, [loadProperties]);

  const handleBulkDelete = useCallback(async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => propertiesAPI.delete(id)));
      await loadProperties();
      clearSelection();
      setShowBulkDeleteConfirm(false);
    } catch (err: any) {
      console.error('Failed to bulk delete:', err);
      setError(err.message || 'Erreur lors de la suppression');
    }
  }, [selectedIds, loadProperties, clearSelection]);

  const handleToggleActive = useCallback(async (property: PropertyWithActive) => {
    try {
      await propertiesAPI.update(property.id, {
        isActive: !property.isActive
      });
      setProperties(prev => prev.map(p =>
        p.id === property.id ? { ...p, isActive: !p.isActive } : p
      ));
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
    }
  }, []);

  const handleBulkStatusChange = useCallback(async (active: boolean) => {
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          propertiesAPI.update(id, { isActive: active })
        )
      );
      setProperties(prev => prev.map(p =>
        selectedIds.has(p.id) ? { ...p, isActive: active } : p
      ));
      clearSelection();
    } catch (err: any) {
      console.error('Failed to bulk update status:', err);
    }
  }, [selectedIds, clearSelection]);

  // ============================================================================
  // EXPORT
  // ============================================================================

  const handleExport = useCallback(() => {
    const dataToExport = selectedIds.size > 0
      ? paginatedProperties.filter(p => selectedIds.has(p.id))
      : paginatedProperties;

    exportToCSV(dataToExport.map(p => ({
      ID: p.id,
      Nom: p.name,
      Type: p.type,
      Categorie: p.category,
      Prix: p.price,
      'Prix Numerique': p.priceNumeric,
      Localisation: p.location,
      Ville: p.city,
      Chambres: p.beds || '',
      Surface: p.areaNumeric || '',
      Statut: p.isActive !== false ? 'Actif' : 'Inactif'
    })), 'athome_properties');
  }, [selectedIds, paginatedProperties]);

  // ============================================================================
  // SORT HANDLER
  // ============================================================================

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Proprietes</h2>
          <p className="text-white/50 text-sm">
            {totalItems} proprietes au total
            {selectedIds.size > 0 && ` - ${selectedIds.size} selectionne(s)`}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-brand-gold/25 transition-all"
        >
          <Plus size={18} />
          Ajouter une propriete
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[300px] relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une propriete..."
            className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          {(['ALL', 'SALE', 'RENT'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filters.category === cat
                  ? 'bg-brand-gold text-black'
                  : 'bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {cat === 'ALL' ? 'Tous' : cat === 'SALE' ? 'Vente' : 'Location'}
            </button>
          ))}
        </div>

        {/* More Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            showFilters
              ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
              : 'bg-white/[0.03] text-white/60 hover:text-white border border-white/[0.08]'
          }`}
        >
          <SlidersHorizontal size={16} />
          Filtres
          {Object.values(filters).some(v => v !== 'ALL' && v !== '' && v !== 'all') && (
            <span className="w-2 h-2 rounded-full bg-brand-gold" />
          )}
        </button>

        {/* View Mode Toggle */}
        <div className="flex bg-white/[0.03] rounded-lg p-1 border border-white/[0.08]">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'list' ? 'bg-brand-gold text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'grid' ? 'bg-brand-gold text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <Grid3X3 size={18} />
          </button>
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
        >
          <Download size={16} />
          Export
        </button>

        {/* Refresh */}
        <button
          onClick={loadProperties}
          disabled={isLoading}
          className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Extended Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:border-brand-gold/50 outline-none"
                  >
                    <option value="">Tous</option>
                    {(filterOptions.types.length > 0 ? filterOptions.types : propertyTypes).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Ville</label>
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:border-brand-gold/50 outline-none"
                  >
                    <option value="">Toutes</option>
                    {filterOptions.cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Prix min (DH)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value ? parseInt(e.target.value) : '' }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Prix max (DH)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value ? parseInt(e.target.value) : '' }))}
                    placeholder="Illimite"
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  />
                </div>

                {/* Beds */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Chambres min</label>
                  <input
                    type="number"
                    value={filters.beds}
                    onChange={(e) => setFilters(prev => ({ ...prev, beds: e.target.value ? parseInt(e.target.value) : '' }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Statut</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:border-brand-gold/50 outline-none"
                  >
                    <option value="all">Tous</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                  </select>
                </div>
              </div>

              {/* Reset Filters */}
              <div className="flex justify-end">
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  Reinitialiser les filtres
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-xl"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm text-brand-gold font-medium">
                {selectedIds.size} element(s) selectionne(s)
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-white/50 hover:text-white"
              >
                Deselectioner tout
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all text-sm"
              >
                <ToggleRight size={14} />
                Activer
              </button>
              <button
                onClick={() => handleBulkStatusChange(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all text-sm"
              >
                <ToggleLeft size={14} />
                Desactiver
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={32} className="animate-spin text-brand-gold" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && paginatedProperties.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 size={48} className="text-white/20 mb-4" />
          <h3 className="text-lg font-medium text-white/70 mb-2">Aucune propriete trouvee</h3>
          <p className="text-sm text-white/40 mb-6">
            {searchQuery || Object.values(filters).some(v => v !== 'ALL' && v !== '' && v !== 'all')
              ? 'Modifiez vos criteres de recherche'
              : 'Commencez par ajouter une propriete'}
          </p>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-lg"
          >
            <Plus size={18} />
            Ajouter une propriete
          </button>
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && paginatedProperties.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={isSelectAll}
                      onChange={selectAll}
                      className="w-4 h-4 rounded border-white/30 bg-white/5 checked:bg-brand-gold"
                    />
                  </th>
                  <th
                    className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Propriete
                      {sortField === 'name' && (
                        <ChevronDown size={14} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      {sortField === 'type' && (
                        <ChevronDown size={14} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-1">
                      Localisation
                      {sortField === 'location' && (
                        <ChevronDown size={14} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-1">
                      Prix
                      {sortField === 'price' && (
                        <ChevronDown size={14} className={sortDirection === 'desc' ? 'rotate-180' : ''} />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-right p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paginatedProperties.map((property) => (
                  <tr
                    key={property.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      selectedIds.has(property.id) ? 'bg-brand-gold/5' : ''
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(property.id)}
                        onChange={() => toggleSelect(property.id)}
                        className="w-4 h-4 rounded border-white/30 bg-white/5 checked:bg-brand-gold"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={property.image || '/placeholder-property.jpg'}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-white/5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100';
                          }}
                        />
                        <div className="max-w-[200px]">
                          <p className="text-sm font-medium text-white truncate">{property.name}</p>
                          <p className="text-xs text-white/40 truncate">{property.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-white/70">{property.type}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-white/70">
                        <MapPin size={12} />
                        <span className="text-sm">{property.location || property.city}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-brand-gold">{property.price}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                        property.category === 'RENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {property.category === 'RENT' ? 'Location' : 'Vente'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                        property.isActive !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {property.isActive !== false ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(property)}
                          className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                          title="Voir"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(property)}
                          className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                          title="Modifier"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(property)}
                          className={`p-2 rounded-lg transition-colors ${
                            property.isActive !== false
                              ? 'hover:bg-orange-500/10 text-white/40 hover:text-orange-400'
                              : 'hover:bg-green-500/10 text-white/40 hover:text-green-400'
                          }`}
                          title={property.isActive !== false ? 'Desactiver' : 'Activer'}
                        >
                          {property.isActive !== false ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(property.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-sm text-white/40">
              Affichage de {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} sur {totalItems} proprietes
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-brand-gold/20 text-brand-gold'
                        : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'grid' && paginatedProperties.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isSelected={selectedIds.has(property.id)}
                onSelect={toggleSelect}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteConfirmId(id)}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>

          {/* Grid Pagination */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-white/60 px-4">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}

      {/* Property Modal */}
      <PropertyModal
        isOpen={showModal}
        mode={modalMode}
        property={selectedProperty}
        onClose={() => {
          setShowModal(false);
          setSelectedProperty(null);
        }}
        onSave={handleSave}
        onDelete={(id) => setDeleteConfirmId(id)}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0f0f15] border border-white/[0.08] rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Confirmer la suppression</h3>
              </div>
              <p className="text-white/60">
                Etes-vous sur de vouloir supprimer cette propriete ? Cette action est irreversible.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-lg bg-white/[0.05] text-white/70 hover:text-white transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBulkDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0f0f15] border border-white/[0.08] rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Confirmer la suppression</h3>
              </div>
              <p className="text-white/60">
                Etes-vous sur de vouloir supprimer <span className="text-white font-medium">{selectedIds.size} propriete(s)</span> ? Cette action est irreversible.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-white/[0.05] text-white/70 hover:text-white transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
                >
                  Supprimer {selectedIds.size} element(s)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

PropertyManagement.displayName = 'PropertyManagement';

export default PropertyManagement;
