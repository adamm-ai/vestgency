/**
 * Admin Portal - Vestate AI Backoffice
 * =====================================
 * Complete admin dashboard with authentication and CRM
 *
 * Components have been modularized into:
 * - admin/auth/AdminLogin.tsx
 * - admin/users/UsersManagement.tsx
 * - admin/analytics/AnalyticsDashboard.tsx
 * - admin/shared/{types,constants,utils}.ts
 */

import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, LogOut, Home, Building2, Users, BarChart3,
  Settings, Plus, Search, Edit3, Trash2, X, Check,
  TrendingUp, DollarSign, MapPin, Calendar, Download,
  ChevronLeft, ChevronRight, ChevronDown, RefreshCw, Bell, Moon, Sun, Menu,
  Save, Target, Mail, AlertCircle, Filter,
  Clock, Star, UserPlus, Activity, Archive,
  ExternalLink, MoreVertical, Award, Zap, Eye, EyeOff,
  FileText, ClipboardList, Sparkles, Link2, MessageSquare, Phone
} from 'lucide-react';
import * as CRM from '../services/crmService';
import api, { authAPI, leadsAPI, usersAPI, statsAPI, notificationsAPI, getStoredToken, getStoredUser, clearAuthData, User as APIUser, Lead as APILead, CRMStats } from '../services/api';

// Import extracted components
// Note: AdminLogin, UsersManagement, AnalyticsDashboard are available as separate modules
// but are still defined inline here during the transition period
import { AdminLogin as ExtractedAdminLogin } from './admin/auth';
import { UsersManagement as ExtractedUsersManagement } from './admin/users';
import { AnalyticsDashboard as ExtractedAnalyticsDashboard } from './admin/analytics';
import {
  AdminUser,
  Session,
  LoginAttempts,
  AdminView,
  SESSION_EXPIRY_MS,
  SESSION_STORAGE_KEY,
  MAX_LOGIN_ATTEMPTS,
  RATE_LIMIT_COOLDOWN_MS,
  ATTEMPTS_STORAGE_KEY,
  generateToken,
  clearLoginAttempts,
  getLoginAttempts,
  saveLoginAttempts,
  exportToCSV
} from './admin/shared';

// ============================================================================
// TYPES (Additional local types)
// ============================================================================

interface Property {
  id: string;
  name: string;
  type: string;
  category: 'RENT' | 'SALE';
  price: string;
  priceNumeric: number;
  location: string;
  city: string;
  beds: number | null;
  areaNumeric: number | null;
  image: string;
  url: string;
  datePublished: string;
}

interface AdminPortalProps {
  onClose: () => void;
}

// ============================================================================
// CONSTANTS
// Note: Constants are also available as separate module at ./admin/shared
// ============================================================================

// ============================================================================
// LOGIN COMPONENT
// Note: Also available as separate module at ./admin/auth/AdminLogin.tsx
// ============================================================================

const AdminLogin: React.FC<{ onLogin: (user: AdminUser, rememberMe: boolean) => void; onClose: () => void }> = memo(({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Check rate limiting on mount
  useEffect(() => {
    const attempts = getLoginAttempts();
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      setCooldownSeconds(remaining);
    }
  }, []);

  // Countdown timer for cooldown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if currently rate limited
    const attempts = getLoginAttempts();
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      setCooldownSeconds(remaining);
      setError(`Trop de tentatives. Reessayez dans ${remaining}s`);
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate via backend API
      const { user } = await authAPI.login(email, password);
      clearLoginAttempts();
      onLogin({
        email: user.email,
        name: user.fullName,
        role: user.role.toLowerCase() as 'admin' | 'agent',
        lastLogin: Date.now()
      }, rememberMe);
    } catch (error: any) {
      // Increment failed attempts
      const newAttempts: LoginAttempts = {
        count: attempts.count + 1,
        lastAttempt: Date.now(),
        lockedUntil: null
      };

      if (newAttempts.count >= MAX_LOGIN_ATTEMPTS) {
        newAttempts.lockedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        setCooldownSeconds(Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000));
        setError(`Trop de tentatives. Reessayez dans ${Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000)}s`);
      } else {
        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts.count;
        setError(error.message || `Email ou mot de passe incorrect (${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`);
      }

      saveLoginAttempts(newAttempts);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md"
      >
        {/* Glassmorphism card */}
        <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-black/50">
          {/* Gradient glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-brand-gold/20 to-cyan-500/20 rounded-3xl blur-xl opacity-50" />

          <div className="relative">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
            >
              <X size={20} />
            </button>

            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-gold/30 mb-4">
                <Lock size={28} className="text-black" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white">Admin Portal</h2>
              <p className="text-white/50 text-sm mt-1">Connectez-vous pour accéder au backoffice</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@vestate.ai"
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 border border-white/20 rounded-md bg-white/[0.03] peer-checked:bg-brand-gold peer-checked:border-brand-gold transition-all flex items-center justify-center">
                    {rememberMe && <Check size={14} className="text-black" />}
                  </div>
                </div>
                <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  Se souvenir de moi
                </span>
              </label>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || cooldownSeconds > 0}
                className="w-full py-4 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl shadow-lg shadow-brand-gold/25 hover:shadow-brand-gold/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {cooldownSeconds > 0 ? (
                  <>
                    <Clock size={18} />
                    Patientez {cooldownSeconds}s
                  </>
                ) : isLoading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <>
                    <Lock size={18} />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            {/* Hint */}
            <div className="mt-6 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
              <p className="text-[11px] text-white/40 text-center">
                Credentials: admin@vestate.ai / vestate2024
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

AdminLogin.displayName = 'AdminLogin';

// ============================================================================
// USERS MANAGEMENT COMPONENT
// ============================================================================

interface UsersManagementProps {
  leads: CRM.Lead[];
  refreshCRM: () => void;
}

const UsersManagement: React.FC<UsersManagementProps> = memo(({ leads, refreshCRM }) => {
  const [agents, setAgents] = useState<CRM.Agent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CRM.Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'agent' as 'admin' | 'agent',
    maxLeads: 50,
  });

  const loadAgents = useCallback(() => {
    setAgents(CRM.getAgents());
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'agent',
      maxLeads: 50,
    });
    setEditingAgent(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgent) {
      CRM.updateAgent(editingAgent.id, formData);
    } else {
      CRM.createAgent(formData);
    }
    loadAgents();
    setShowAddModal(false);
    resetForm();
  };

  const handleEdit = (agent: CRM.Agent) => {
    setFormData({
      firstName: agent.firstName,
      lastName: agent.lastName,
      email: agent.email,
      phone: agent.phone || '',
      role: agent.role,
      maxLeads: agent.maxLeads,
    });
    setEditingAgent(agent);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet agent ?')) {
      CRM.deleteAgent(id);
      loadAgents();
    }
  };

  const toggleActive = (agent: CRM.Agent) => {
    CRM.updateAgent(agent.id, { isActive: !agent.isActive });
    loadAgents();
  };

  // Calculate agent stats
  const getAgentStats = (agentId: string) => {
    const assignedLeads = leads.filter(l => l.assignedTo === agentId);
    const wonLeads = assignedLeads.filter(l => l.status === 'won');
    const conversionRate = assignedLeads.length > 0
      ? Math.round((wonLeads.length / assignedLeads.length) * 100)
      : 0;
    return {
      assigned: assignedLeads.length,
      won: wonLeads.length,
      conversionRate,
    };
  };

  const filteredAgents = agents.filter(a =>
    a.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Agents CRM</h2>
          <p className="text-white/50 text-sm">Gerez votre equipe commerciale</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-brand-gold/25 transition-all"
        >
          <UserPlus size={18} />
          Ajouter un agent
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un agent..."
          className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-gold to-amber-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{agents.length}</p>
              <p className="text-xs text-white/50">Total Agents</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
              <Check size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{agents.filter(a => a.isActive).length}</p>
              <p className="text-xs text-white/50">Agents Actifs</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{agents.reduce((sum, a) => sum + a.currentLeads, 0)}</p>
              <p className="text-xs text-white/50">Leads Assignes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Agent</th>
                <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Contact</th>
                <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Role</th>
                <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Leads Assignes</th>
                <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Taux Conversion</th>
                <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Statut</th>
                <th className="text-right p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Users size={48} className="text-white/10 mx-auto mb-4" />
                    <p className="text-white/40">Aucun agent trouve</p>
                  </td>
                </tr>
              ) : filteredAgents.map(agent => {
                const stats = getAgentStats(agent.id);
                return (
                  <tr key={agent.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center text-black font-bold text-sm">
                          {agent.firstName.charAt(0)}{agent.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{agent.firstName} {agent.lastName}</p>
                          <p className="text-xs text-white/40">Depuis {new Date(agent.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs text-white/60">{agent.email}</p>
                        {agent.phone && <p className="text-xs text-white/60">{agent.phone}</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                        agent.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {agent.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{stats.assigned}</span>
                        <span className="text-xs text-white/40">/ {agent.maxLeads} max</span>
                      </div>
                      <div className="w-20 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-brand-gold rounded-full"
                          style={{ width: `${Math.min(100, (stats.assigned / agent.maxLeads) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          stats.conversionRate >= 30 ? 'text-green-400' :
                          stats.conversionRate >= 15 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {stats.conversionRate}%
                        </span>
                        <span className="text-xs text-white/40">({stats.won} gagnes)</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(agent)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          agent.isActive
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {agent.isActive ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(agent)}
                          className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowAddModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0f0f15] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingAgent ? 'Modifier Agent' : 'Nouvel Agent'}
                </h3>
                <button
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Prenom</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Nom</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Telephone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'agent' })}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none"
                    >
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Max Leads</label>
                    <input
                      type="number"
                      value={formData.maxLeads}
                      onChange={(e) => setFormData({ ...formData, maxLeads: parseInt(e.target.value) || 50 })}
                      min={1}
                      max={500}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="flex-1 py-3 bg-white/[0.05] text-white rounded-xl hover:bg-white/[0.08] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-brand-gold/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {editingAgent ? 'Modifier' : 'Creer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

UsersManagement.displayName = 'UsersManagement';

// ============================================================================
// ANALYTICS DASHBOARD COMPONENT
// ============================================================================

interface AnalyticsDashboardProps {
  leads: CRM.Lead[];
  crmStats: CRM.CRMStats | null;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = memo(({ leads, crmStats }) => {
  // Calculate monthly trends
  const monthlyData = useMemo(() => {
    const months: Record<string, { total: number; won: number; lost: number }> = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months[key] = { total: 0, won: 0, lost: 0 };
    }

    leads.forEach(lead => {
      const date = new Date(lead.createdAt);
      const key = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      if (months[key]) {
        months[key].total++;
        if (lead.status === 'won') months[key].won++;
        if (lead.status === 'lost') months[key].lost++;
      }
    });

    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  }, [leads]);

  const maxMonthlyLeads = Math.max(...monthlyData.map(d => d.total), 1);

  // Source distribution
  const sourceData = useMemo(() => {
    if (!crmStats) return [];
    const sources: { name: string; count: number; color: string }[] = [
      { name: 'Chatbot', count: crmStats.leadsBySource.chatbot, color: 'bg-cyan-500' },
      { name: 'Formulaire', count: crmStats.leadsBySource.website_form, color: 'bg-blue-500' },
      { name: 'Telephone', count: crmStats.leadsBySource.phone, color: 'bg-green-500' },
      { name: 'Email', count: crmStats.leadsBySource.email, color: 'bg-yellow-500' },
      { name: 'Parrainage', count: crmStats.leadsBySource.referral, color: 'bg-purple-500' },
      { name: 'Reseaux sociaux', count: crmStats.leadsBySource.social_media, color: 'bg-pink-500' },
      { name: 'Walk-in', count: crmStats.leadsBySource.walk_in, color: 'bg-orange-500' },
      { name: 'Autre', count: crmStats.leadsBySource.other, color: 'bg-gray-500' },
    ].filter(s => s.count > 0);
    return sources;
  }, [crmStats]);

  const maxSourceCount = Math.max(...sourceData.map(s => s.count), 1);

  // Status distribution
  const statusData = useMemo(() => {
    if (!crmStats) return [];
    const statuses: { name: string; count: number; color: string }[] = [
      { name: 'Nouveaux', count: crmStats.leadsByStatus.new, color: 'bg-blue-500' },
      { name: 'Contactes', count: crmStats.leadsByStatus.contacted, color: 'bg-cyan-500' },
      { name: 'Qualifies', count: crmStats.leadsByStatus.qualified, color: 'bg-emerald-500' },
      { name: 'Visite planifiee', count: crmStats.leadsByStatus.visit_scheduled, color: 'bg-yellow-500' },
      { name: 'Visite effectuee', count: crmStats.leadsByStatus.visit_completed, color: 'bg-orange-500' },
      { name: 'Proposition', count: crmStats.leadsByStatus.proposal_sent, color: 'bg-purple-500' },
      { name: 'Negociation', count: crmStats.leadsByStatus.negotiation, color: 'bg-pink-500' },
      { name: 'Gagnes', count: crmStats.leadsByStatus.won, color: 'bg-green-500' },
      { name: 'Perdus', count: crmStats.leadsByStatus.lost, color: 'bg-red-500' },
    ];
    return statuses;
  }, [crmStats]);

  const totalStatusCount = statusData.reduce((sum, s) => sum + s.count, 0) || 1;

  // Conversion funnel
  const funnelData = useMemo(() => {
    if (!crmStats) return [];
    const total = crmStats.totalLeads || 1;
    return [
      { stage: 'Tous les leads', count: crmStats.totalLeads, percentage: 100 },
      { stage: 'Contactes', count: crmStats.leadsByStatus.contacted + crmStats.leadsByStatus.qualified + crmStats.leadsByStatus.visit_scheduled + crmStats.leadsByStatus.visit_completed + crmStats.leadsByStatus.proposal_sent + crmStats.leadsByStatus.negotiation + crmStats.leadsByStatus.won, percentage: 0 },
      { stage: 'Qualifies', count: crmStats.leadsByStatus.qualified + crmStats.leadsByStatus.visit_scheduled + crmStats.leadsByStatus.visit_completed + crmStats.leadsByStatus.proposal_sent + crmStats.leadsByStatus.negotiation + crmStats.leadsByStatus.won, percentage: 0 },
      { stage: 'Visite', count: crmStats.leadsByStatus.visit_completed + crmStats.leadsByStatus.proposal_sent + crmStats.leadsByStatus.negotiation + crmStats.leadsByStatus.won, percentage: 0 },
      { stage: 'Proposition', count: crmStats.leadsByStatus.proposal_sent + crmStats.leadsByStatus.negotiation + crmStats.leadsByStatus.won, percentage: 0 },
      { stage: 'Convertis', count: crmStats.leadsByStatus.won, percentage: 0 },
    ].map(item => ({ ...item, percentage: Math.round((item.count / total) * 100) }));
  }, [crmStats]);

  if (!crmStats) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw size={32} className="animate-spin text-brand-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics CRM</h2>
          <p className="text-white/50 text-sm">Vue d'ensemble des performances commerciales</p>
        </div>
        <button
          onClick={() => {
            const reportData = [
              { metric: 'Total Leads', value: crmStats.totalLeads },
              { metric: 'Taux de Conversion', value: `${crmStats.conversionRate}%` },
              { metric: 'Score Moyen', value: crmStats.avgScore },
              { metric: 'Leads ce mois', value: crmStats.newLeadsMonth },
              { metric: 'Leads cette semaine', value: crmStats.newLeadsWeek },
              { metric: 'Leads aujourd\'hui', value: crmStats.newLeadsToday },
              { metric: 'Leads Gagnes', value: crmStats.leadsWon },
              { metric: 'Leads Perdus', value: crmStats.leadsLost },
              { metric: '---', value: '---' },
              { metric: 'Source: Chatbot', value: crmStats.leadsBySource.chatbot },
              { metric: 'Source: Formulaire', value: crmStats.leadsBySource.website_form },
              { metric: 'Source: Telephone', value: crmStats.leadsBySource.phone },
              { metric: 'Source: Email', value: crmStats.leadsBySource.email },
              { metric: 'Source: Parrainage', value: crmStats.leadsBySource.referral },
              { metric: 'Source: Reseaux sociaux', value: crmStats.leadsBySource.social_media },
              { metric: 'Source: Walk-in', value: crmStats.leadsBySource.walk_in },
              { metric: 'Source: Autre', value: crmStats.leadsBySource.other },
              { metric: '---', value: '---' },
              { metric: 'Statut: Nouveaux', value: crmStats.leadsByStatus.new },
              { metric: 'Statut: Contactes', value: crmStats.leadsByStatus.contacted },
              { metric: 'Statut: Qualifies', value: crmStats.leadsByStatus.qualified },
              { metric: 'Statut: Visite planifiee', value: crmStats.leadsByStatus.visit_scheduled },
              { metric: 'Statut: Visite effectuee', value: crmStats.leadsByStatus.visit_completed },
              { metric: 'Statut: Proposition envoyee', value: crmStats.leadsByStatus.proposal_sent },
              { metric: 'Statut: Negociation', value: crmStats.leadsByStatus.negotiation },
              { metric: 'Statut: Gagnes', value: crmStats.leadsByStatus.won },
              { metric: 'Statut: Perdus', value: crmStats.leadsByStatus.lost },
            ];
            exportToCSV(reportData, 'nourreska_analytics_report');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
        >
          <Download size={16} />
          Export Rapport
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: crmStats.totalLeads, icon: Users, color: 'from-brand-gold to-amber-500' },
          { label: 'Taux Conversion', value: `${crmStats.conversionRate}%`, icon: TrendingUp, color: 'from-green-500 to-emerald-400' },
          { label: 'Score Moyen', value: crmStats.avgScore, icon: Star, color: 'from-purple-500 to-pink-400' },
          { label: 'Leads ce mois', value: crmStats.newLeadsMonth, icon: Calendar, color: 'from-blue-500 to-cyan-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
          >
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2`} />
            <div className="relative">
              <stat.icon size={18} className="text-white/40 mb-2" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source - Bar Chart */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-gold" />
            Leads par Source
          </h3>
          <div className="space-y-3">
            {sourceData.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">Aucune donnee disponible</p>
            ) : (
              sourceData.map((source, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">{source.name}</span>
                    <span className="text-white font-medium">{source.count}</span>
                  </div>
                  <div className="h-6 bg-white/[0.05] rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(source.count / maxSourceCount) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className={`h-full ${source.color} rounded-lg`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leads by Status - Distribution */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-cyan-400" />
            Distribution par Statut
          </h3>
          <div className="space-y-2">
            {statusData.map((status, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${status.color}`} />
                <span className="text-sm text-white/70 flex-1">{status.name}</span>
                <span className="text-sm text-white font-medium">{status.count}</span>
                <span className="text-xs text-white/40 w-12 text-right">
                  {Math.round((status.count / totalStatusCount) * 100)}%
                </span>
              </div>
            ))}
          </div>
          {/* Visual bar */}
          <div className="mt-4 h-4 rounded-full overflow-hidden flex">
            {statusData.map((status, i) => (
              <motion.div
                key={i}
                initial={{ width: 0 }}
                animate={{ width: `${(status.count / totalStatusCount) * 100}%` }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                className={`h-full ${status.color}`}
              />
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Filter size={20} className="text-purple-400" />
            Entonnoir de Conversion
          </h3>
          <div className="space-y-2">
            {funnelData.map((stage, i) => (
              <div key={i} className="relative">
                <div
                  className="h-10 bg-gradient-to-r from-brand-gold/20 to-cyan-400/10 rounded-lg flex items-center px-4 justify-between transition-all"
                  style={{ width: `${Math.max(30, stage.percentage)}%` }}
                >
                  <span className="text-sm text-white font-medium truncate">{stage.stage}</span>
                  <span className="text-sm text-brand-gold font-bold ml-2">{stage.count}</span>
                </div>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-white/40">
                  {stage.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-400" />
            Tendances Mensuelles
          </h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {monthlyData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-28 gap-1">
                  {/* Won bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.won / maxMonthlyLeads) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="w-full bg-green-500 rounded-t-sm min-h-[2px]"
                    title={`Gagnes: ${data.won}`}
                  />
                  {/* Total bar (remaining) */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${((data.total - data.won - data.lost) / maxMonthlyLeads) * 100}%` }}
                    transition={{ delay: i * 0.1 + 0.1, duration: 0.5 }}
                    className="w-full bg-brand-gold/60 min-h-[2px]"
                    title={`En cours: ${data.total - data.won - data.lost}`}
                  />
                  {/* Lost bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(data.lost / maxMonthlyLeads) * 100}%` }}
                    transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                    className="w-full bg-red-500/60 rounded-b-sm min-h-[2px]"
                    title={`Perdus: ${data.lost}`}
                  />
                </div>
                <span className="text-[10px] text-white/50">{data.month}</span>
                <span className="text-xs text-white font-medium">{data.total}</span>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-xs text-white/50">Gagnes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-brand-gold/60" />
              <span className="text-xs text-white/50">En cours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500/60" />
              <span className="text-xs text-white/50">Perdus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

// ============================================================================
// DASHBOARD COMPONENT
// ============================================================================

const AdminDashboard: React.FC<{ user: AdminUser; onLogout: () => void; onClose: () => void }> = memo(({ user, onLogout, onClose }) => {
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'RENT' | 'SALE'>('ALL');
  const [propertyPage, setPropertyPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyModalMode, setPropertyModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset scroll position and clean up modals on view change
  useEffect(() => {
    // Reset scroll position
    const contentArea = document.querySelector('[data-scroll-area]');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
    // Also reset window scroll
    window.scrollTo(0, 0);

    // Clean up modal states
    setShowPropertyModal(false);
    setSelectedProperty(null);
    setShowAddLeadModal(false);
    setShowAddDemandModal(false);
    setSelectedLead(null);
    setSelectedDemand(null);
    setShowNotifications(false);
    setShowDataMenu(false);

    // Clean up selections
    setSelectedLeadIds(new Set());
    setSelectedDemandIds(new Set());
    setSelectedMatchIds(new Set());

    // Close mobile menu
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [currentView, isMobile]);

  // CRM State
  const [leads, setLeads] = useState<CRM.Lead[]>([]);
  const [crmStats, setCrmStats] = useState<CRM.CRMStats | null>(null);
  const [notifications, setNotifications] = useState<CRM.Notification[]>([]);
  const [selectedLead, setSelectedLead] = useState<CRM.Lead | null>(null);
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmStatusFilter, setCrmStatusFilter] = useState<CRM.LeadStatus | 'all'>('all');
  const [crmTimeFilter, setCrmTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [crmView, setCrmView] = useState<'pipeline' | 'list'>('pipeline');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<CRM.LeadStatus | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', city: '',
    source: 'website_form' as CRM.LeadSource,
    transactionType: 'SALE' as CRM.PropertyCategory,
    budgetMin: '', budgetMax: '', urgency: 'medium' as CRM.LeadUrgency,
  });
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [leadCreationError, setLeadCreationError] = useState('');

  // Demands State
  const [demands, setDemands] = useState<CRM.Demand[]>([]);
  const [demandStats, setDemandStats] = useState<CRM.DemandStats | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<CRM.Demand | null>(null);
  const [demandTypeFilter, setDemandTypeFilter] = useState<CRM.DemandType | 'all'>('all');
  const [demandStatusFilter, setDemandStatusFilter] = useState<CRM.DemandStatus | 'all'>('all');
  const [showAddDemandModal, setShowAddDemandModal] = useState(false);
  const [demandMatches, setDemandMatches] = useState<CRM.DemandMatch[]>([]);
  const [isRunningMatching, setIsRunningMatching] = useState(false);

  // Bulk Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [selectedDemandIds, setSelectedDemandIds] = useState<Set<string>>(new Set());
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState<'leads' | 'demands' | null>(null);
  const [showDataMenu, setShowDataMenu] = useState(false);

  // Matches State
  const [allMatches, setAllMatches] = useState<CRM.EnrichedMatch[]>([]);
  const [matchStats, setMatchStats] = useState<CRM.MatchStats | null>(null);
  const [matchStatusFilter, setMatchStatusFilter] = useState<CRM.DemandMatch['status'] | 'all'>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<CRM.DemandMatch['matchType'] | 'all'>('all');
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
  const [isAutoMatchEnabled, setIsAutoMatchEnabled] = useState(true);
  const [autoMatchInterval, setAutoMatchIntervalState] = useState(15);
  const [lastMatchRun, setLastMatchRun] = useState<string | null>(null);
  const [matchSearchQuery, setMatchSearchQuery] = useState('');

  // Settings State
  const [settingsTab, setSettingsTab] = useState<'profile' | 'notifications' | 'crm' | 'theme' | 'about'>('profile');
  const [profileSettings, setProfileSettings] = useState({
    displayName: user.name,
    displayEmail: user.email,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewLead: true,
    emailLeadStatusChange: true,
    pushNewLead: true,
    pushReminders: true,
    weeklyDigest: false,
  });
  const [crmSettings, setCrmSettings] = useState({
    defaultAssignment: 'auto',
    autoScoring: true,
    autoFollowUp: true,
    followUpDays: 3,
  });

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Password change state (UI only)
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await fetch('/data/properties.json');
        const data = await response.json();
        setProperties(data.properties || []);
      } catch (error) {
        console.error('Failed to load properties:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProperties();
  }, []);

  // Load CRM data
  const refreshCRM = useCallback(async () => {
    try {
      // Try real API first
      const [leadsRes, statsRes, notifRes] = await Promise.all([
        leadsAPI.getAll(),
        statsAPI.getCRM(),
        notificationsAPI.getAll(),
      ]);
      // Map API leads to CRM.Lead format
      const mappedLeads: CRM.Lead[] = leadsRes.leads.map((l: APILead) => ({
        id: l.id,
        firstName: l.firstName,
        lastName: l.lastName || '',
        email: l.email || '',
        phone: l.phone || '',
        city: l.city || '',
        status: l.status.toLowerCase() as CRM.LeadStatus,
        source: l.source.toLowerCase() as CRM.LeadSource,
        urgency: l.urgency.toLowerCase() as CRM.LeadUrgency,
        score: l.score,
        transactionType: l.transactionType as CRM.PropertyCategory,
        budgetMin: l.budgetMin,
        budgetMax: l.budgetMax,
        assignedTo: l.assignedToId,
        activities: (l.activities || []).map(a => ({
          id: a.id,
          type: a.type as CRM.ActivityType,
          title: a.title,
          description: a.description,
          timestamp: new Date(a.createdAt).getTime(),
          agent: a.createdBy?.fullName || 'System',
        })),
        notes: l.notes || [],
        lastContact: l.updatedAt ? new Date(l.updatedAt).getTime() : undefined,
        createdAt: new Date(l.createdAt).getTime(),
        updatedAt: new Date(l.updatedAt).getTime(),
      }));
      setLeads(mappedLeads);
      // Map API stats to CRM.CRMStats format
      const mappedStats: CRM.CRMStats = {
        totalLeads: statsRes.totalLeads,
        newLeadsToday: statsRes.newLeadsToday,
        newLeadsWeek: statsRes.newLeadsWeek,
        newLeadsMonth: statsRes.newLeadsMonth,
        leadsWon: statsRes.leadsWon,
        leadsLost: statsRes.leadsLost,
        conversionRate: statsRes.conversionRate,
        avgScore: statsRes.avgScore,
        leadsByStatus: Object.fromEntries(
          Object.entries(statsRes.leadsByStatus || {}).map(([k, v]) => [k.toLowerCase(), v])
        ) as Record<CRM.LeadStatus, number>,
        leadsBySource: Object.fromEntries(
          Object.entries(statsRes.leadsBySource || {}).map(([k, v]) => [k.toLowerCase(), v])
        ) as Record<CRM.LeadSource, number>,
        leadsByUrgency: Object.fromEntries(
          Object.entries(statsRes.leadsByUrgency || {}).map(([k, v]) => [k.toLowerCase(), v])
        ) as Record<CRM.LeadUrgency, number>,
      };
      setCrmStats(mappedStats);
      // Map API notifications to CRM.Notification format
      const mappedNotifications: CRM.Notification[] = notifRes.notifications.map((n: any) => ({
        id: n.id,
        type: n.type as CRM.NotificationType,
        title: n.title,
        message: n.message || '',
        leadId: n.leadId,
        timestamp: new Date(n.createdAt).getTime(),
        read: n.isRead,
      }));
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('[CRM] API unavailable, falling back to localStorage:', error);
      // Fallback to localStorage
      setLeads(CRM.getLeads());
      setCrmStats(CRM.getCRMStats());
      setNotifications(CRM.getNotifications());
    }
  }, []);

  useEffect(() => {
    refreshCRM();
    // Refresh every 30 seconds
    const interval = setInterval(refreshCRM, 30000);
    return () => clearInterval(interval);
  }, [refreshCRM]);

  // Load demands
  const refreshDemands = useCallback(() => {
    const allDemands = CRM.getDemands();
    setDemands(allDemands);
    setDemandStats(CRM.getDemandStats());
  }, []);

  useEffect(() => {
    refreshDemands();
  }, [refreshDemands]);

  // Load matches
  const refreshMatches = useCallback(() => {
    const filters: { status?: CRM.DemandMatch['status']; matchType?: CRM.DemandMatch['matchType'] } = {};
    if (matchStatusFilter !== 'all') filters.status = matchStatusFilter;
    if (matchTypeFilter !== 'all') filters.matchType = matchTypeFilter;

    const enrichedMatches = CRM.getEnrichedMatches(filters);
    setAllMatches(enrichedMatches);
    setMatchStats(CRM.getMatchStats());
    setLastMatchRun(CRM.getLastMatchRun());
  }, [matchStatusFilter, matchTypeFilter]);

  useEffect(() => {
    refreshMatches();
  }, [refreshMatches]);

  // Auto-matching setup
  useEffect(() => {
    if (!isAutoMatchEnabled) {
      CRM.stopAutoMatching();
      return;
    }

    // Store properties for matching
    localStorage.setItem('nourreska_properties', JSON.stringify(properties));

    // Set interval and start
    CRM.setAutoMatchInterval(autoMatchInterval);
    CRM.startAutoMatching();

    // Subscribe to auto-match results
    const unsubscribe = CRM.onAutoMatchComplete((result) => {
      console.log(`[Auto-Match] Completed: ${result.newMatches} new matches`);
      refreshMatches();
      refreshDemands();
      if (result.newMatches > 0) {
        // Could trigger a toast notification here
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAutoMatchEnabled, autoMatchInterval, properties, refreshMatches, refreshDemands]);

  // Run AI matching
  const runAIMatching = useCallback(async (demandId?: string) => {
    setIsRunningMatching(true);
    try {
      // Store properties for matching
      localStorage.setItem('nourreska_properties', JSON.stringify(properties));
      const result = CRM.runMatchingEngine(demandId);
      console.log('[Matching]', result);
      refreshDemands();
      if (demandId) {
        setDemandMatches(CRM.getMatchesForDemand(demandId));
      }
    } finally {
      setIsRunningMatching(false);
    }
  }, [properties, refreshDemands]);

  // Bulk selection handlers for leads
  const toggleLeadSelection = useCallback((leadId: string) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  }, []);

  const selectAllLeads = useCallback(() => {
    const allIds = leads.map(l => l.id);
    setSelectedLeadIds(new Set(allIds));
  }, [leads]);

  const deselectAllLeads = useCallback(() => {
    setSelectedLeadIds(new Set());
  }, []);

  const bulkDeleteSelectedLeads = useCallback(() => {
    const count = CRM.bulkDeleteLeads(Array.from(selectedLeadIds), true);
    console.log(`[CRM] Bulk deleted ${count} leads`);
    setSelectedLeadIds(new Set());
    setShowBulkDeleteConfirm(null);
    refreshCRM();
  }, [selectedLeadIds, refreshCRM]);

  // Bulk selection handlers for demands
  const toggleDemandSelection = useCallback((demandId: string) => {
    setSelectedDemandIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(demandId)) {
        newSet.delete(demandId);
      } else {
        newSet.add(demandId);
      }
      return newSet;
    });
  }, []);

  const selectAllDemands = useCallback(() => {
    const allIds = demands.map(d => d.id);
    setSelectedDemandIds(new Set(allIds));
  }, [demands]);

  const deselectAllDemands = useCallback(() => {
    setSelectedDemandIds(new Set());
  }, []);

  const bulkDeleteSelectedDemands = useCallback(() => {
    const count = CRM.bulkDeleteDemands(Array.from(selectedDemandIds));
    console.log(`[CRM] Bulk deleted ${count} demands`);
    setSelectedDemandIds(new Set());
    setShowBulkDeleteConfirm(null);
    refreshDemands();
  }, [selectedDemandIds, refreshDemands]);

  // Match selection handlers
  const toggleMatchSelection = useCallback((matchId: string) => {
    setSelectedMatchIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  }, []);

  const selectAllMatches = useCallback(() => {
    const allIds = allMatches.map(m => m.id);
    setSelectedMatchIds(new Set(allIds));
  }, [allMatches]);

  const deselectAllMatches = useCallback(() => {
    setSelectedMatchIds(new Set());
  }, []);

  const bulkDeleteSelectedMatches = useCallback(() => {
    const count = CRM.bulkDeleteMatches(Array.from(selectedMatchIds));
    console.log(`[CRM] Bulk deleted ${count} matches`);
    setSelectedMatchIds(new Set());
    refreshMatches();
  }, [selectedMatchIds, refreshMatches]);

  const updateMatchStatusHandler = useCallback((matchId: string, status: CRM.DemandMatch['status']) => {
    CRM.updateMatchStatus(matchId, status);
    refreshMatches();
  }, [refreshMatches]);

  // Filtered matches with search
  const filteredMatches = useMemo(() => {
    if (!matchSearchQuery.trim()) return allMatches;
    const query = matchSearchQuery.toLowerCase();
    return allMatches.filter(m => {
      const demandName = `${m.demand?.firstName || ''} ${m.demand?.lastName || ''}`.toLowerCase();
      const matchReasons = m.matchReasons.join(' ').toLowerCase();
      return demandName.includes(query) || matchReasons.includes(query);
    });
  }, [allMatches, matchSearchQuery]);

  // Manual match run
  const handleManualMatchRun = useCallback(() => {
    localStorage.setItem('nourreska_properties', JSON.stringify(properties));
    const result = CRM.runAutoMatch();
    console.log(`[Manual Match] ${result.newMatches} new matches`);
    refreshMatches();
    refreshDemands();
  }, [properties, refreshMatches, refreshDemands]);

  // Generate synthetic data
  const handleGenerateSyntheticData = useCallback(() => {
    setIsGeneratingData(true);
    try {
      const result = CRM.populateSyntheticData(60, 50); // 60 leads, 50 demands
      console.log(`[CRM] Generated ${result.leads.length} leads and ${result.demands.length} demands`);
      refreshCRM();
      refreshDemands();
    } finally {
      setIsGeneratingData(false);
    }
  }, [refreshCRM, refreshDemands]);

  // Clear all data
  const handleClearAllData = useCallback(() => {
    const result = CRM.clearAllSyntheticData();
    console.log(`[CRM] Cleared ${result.leadsDeleted} leads and ${result.demandsDeleted} demands`);
    setSelectedLeadIds(new Set());
    setSelectedDemandIds(new Set());
    refreshCRM();
    refreshDemands();
  }, [refreshCRM, refreshDemands]);

  // Get filtered demands
  const filteredDemands = useMemo(() => {
    let result = demands;
    if (demandTypeFilter !== 'all') {
      result = result.filter(d => d.type === demandTypeFilter);
    }
    if (demandStatusFilter !== 'all') {
      result = result.filter(d => d.status === demandStatusFilter);
    }
    return result;
  }, [demands, demandTypeFilter, demandStatusFilter]);

  // Helper function for time filtering
  const getTimeFilteredLeads = useCallback((leadsToFilter: CRM.Lead[]) => {
    if (crmTimeFilter === 'all') return leadsToFilter;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return leadsToFilter.filter(lead => {
      const leadDate = typeof lead.createdAt === 'number' ? lead.createdAt : new Date(lead.createdAt).getTime();
      switch (crmTimeFilter) {
        case 'today': return leadDate >= startOfToday;
        case 'week': return leadDate >= startOfWeek;
        case 'month': return leadDate >= startOfMonth;
        default: return true;
      }
    });
  }, [crmTimeFilter]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    let result = getTimeFilteredLeads(leads);
    if (crmStatusFilter !== 'all') {
      result = result.filter(l => l.status === crmStatusFilter);
    }
    if (crmSearchQuery) {
      const query = crmSearchQuery.toLowerCase();
      result = result.filter(l =>
        l.firstName.toLowerCase().includes(query) ||
        l.lastName.toLowerCase().includes(query) ||
        l.email.toLowerCase().includes(query) ||
        l.phone.includes(query)
      );
    }
    // Sort by most recent first
    return result.sort((a, b) => {
      const dateA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
      const dateB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [leads, crmStatusFilter, crmSearchQuery, getTimeFilteredLeads]);

  // Leads by status for pipeline (also time filtered)
  const leadsByStatus = useMemo(() => {
    const grouped: Record<CRM.LeadStatus, CRM.Lead[]> = {
      new: [], contacted: [], qualified: [], visit_scheduled: [],
      visit_completed: [], proposal_sent: [], negotiation: [],
      won: [], lost: [], nurturing: []
    };
    const timeFiltered = getTimeFilteredLeads(leads);
    timeFiltered.forEach(lead => {
      grouped[lead.status].push(lead);
    });
    // Sort each group by most recent first
    Object.keys(grouped).forEach(status => {
      grouped[status as CRM.LeadStatus].sort((a, b) => {
        const dateA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
        const dateB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    });
    return grouped;
  }, [leads, getTimeFilteredLeads]);

  // Format lead timestamp with relative time
  const formatLeadTimestamp = useCallback((createdAt: string | number) => {
    const date = typeof createdAt === 'number' ? new Date(createdAt) : new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Relative time for recent leads
    let relative = '';
    if (diffMins < 1) relative = "À l'instant";
    else if (diffMins < 60) relative = `Il y a ${diffMins} min`;
    else if (diffHours < 24) relative = `Il y a ${diffHours}h`;
    else if (diffDays < 7) relative = `Il y a ${diffDays}j`;
    else relative = '';

    // Full date with time
    const fullDate = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: diffDays > 365 ? '2-digit' : undefined
    });
    const fullTime = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return { relative, fullDate, fullTime, date };
  }, []);

  // Unread notifications count
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Filter properties - memoized for performance
  const filteredProperties = useMemo(() => properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  }), [properties, searchQuery, filterCategory]);

  // Stats - memoized for performance
  const stats = useMemo(() => ({
    totalProperties: properties.length,
    forSale: properties.filter(p => p.category === 'SALE').length,
    forRent: properties.filter(p => p.category === 'RENT').length,
    avgPrice: properties.length > 0
      ? Math.round(properties.reduce((sum, p) => sum + (p.priceNumeric || 0), 0) / properties.length)
      : 0
  }), [properties]);

  // Menu items - memoized for performance
  const menuItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'crm', label: 'CRM', icon: Target, badge: true },
    { id: 'demands', label: 'Demandes', icon: ClipboardList },
    { id: 'matches', label: 'Matches', icon: Link2, badge: matchStats?.pendingMatches > 0 },
    { id: 'properties', label: 'Propriétés', icon: Building2 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ], [matchStats?.pendingMatches]);

  // Bottom navigation items for mobile (subset of menu items)
  const bottomNavItems = useMemo(() => menuItems.slice(0, 5), [menuItems]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[#0a0a0f]"
    >
      <div className="flex h-full">
        {/* Mobile Slide-out Drawer Overlay */}
        <AnimatePresence>
          {isMobile && mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Desktop Sidebar / Mobile Slide-out Drawer */}
        <motion.aside
          initial={{ x: -280 }}
          animate={{
            x: isMobile
              ? (mobileMenuOpen ? 0 : -280)
              : (sidebarOpen ? 0 : -220)
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`${isMobile ? 'fixed z-50' : 'relative'} w-[280px] h-full bg-[#0a0a0f]/95 md:bg-white/[0.02] border-r border-white/[0.06] flex flex-col backdrop-blur-xl`}
        >
          {/* Logo */}
          <div className="p-6 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-xl font-tt-commons font-bold tracking-tight">
                    <span className="text-white">Vestate</span>
                    <span className="text-white/60 ml-1">AI</span>
                  </h1>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider">Admin Portal</span>
                </div>
              </div>
              {/* Close button for mobile drawer */}
              {isMobile && (
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as AdminView);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-brand-gold/20 to-cyan-400/10 text-brand-gold border border-brand-gold/20'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
                {item.badge && crmStats && crmStats.newLeadsToday > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-brand-gold text-black rounded-full">
                    {crmStats.newLeadsToday}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center text-black font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
            </div>
            {/* Mobile logout button in sidebar */}
            {isMobile && (
              <button
                onClick={onLogout}
                className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Deconnexion</span>
              </button>
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'pb-16' : ''}`}>
          {/* Header */}
          <header className="h-14 md:h-16 border-b border-white/[0.06] flex items-center justify-between px-4 md:px-6 bg-white/[0.01]">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => isMobile ? setMobileMenuOpen(!mobileMenuOpen) : setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-base md:text-lg font-semibold text-white capitalize">{currentView}</h2>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] md:w-80 max-w-80 bg-[#0f0f15] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                        <h4 className="font-semibold text-white">Notifications</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => { CRM.markAllNotificationsAsRead(); refreshCRM(); }}
                            className="text-xs text-brand-gold hover:text-brand-gold/80"
                          >
                            Tout marquer lu
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-white/40">
                            <Bell size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Aucune notification</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map(notif => (
                            <button
                              key={notif.id}
                              onClick={async () => {
                                CRM.markNotificationAsRead(notif.id);
                                if (notif.leadId) {
                                  const lead = CRM.getLeadById(notif.leadId);
                                  if (lead) {
                                    setSelectedLead(lead);
                                    setCurrentView('crm');
                                  }
                                }
                                await refreshCRM();
                                setShowNotifications(false);
                              }}
                              className={`w-full p-4 text-left hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] ${
                                !notif.read ? 'bg-brand-gold/5' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 mt-2 rounded-full ${!notif.read ? 'bg-brand-gold' : 'bg-white/20'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{notif.title}</p>
                                  <p className="text-xs text-white/50 truncate">{notif.message}</p>
                                  <p className="text-[10px] text-white/30 mt-1">
                                    {new Date(notif.timestamp).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Deconnexion</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          {/* Content */}
          <div data-scroll-area className="flex-1 overflow-auto p-4 md:p-6">
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Cards - Clickable */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Proprietes', value: stats.totalProperties, icon: Building2, color: 'from-brand-gold to-amber-500', target: 'properties' as AdminView },
                    { label: 'En Vente', value: stats.forSale, icon: DollarSign, color: 'from-blue-500 to-cyan-400', target: 'properties' as AdminView },
                    { label: 'En Location', value: stats.forRent, icon: Home, color: 'from-emerald-500 to-teal-400', target: 'properties' as AdminView },
                    { label: 'Total Leads', value: crmStats?.totalLeads || 0, icon: Users, color: 'from-purple-500 to-pink-400', target: 'crm' as AdminView },
                  ].map((stat, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setCurrentView(stat.target)}
                      className="relative overflow-hidden rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 text-left hover:border-brand-gold/30 hover:bg-white/[0.04] transition-all cursor-pointer group"
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity`} />
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                          <stat.icon size={24} className="text-white" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                        <p className="text-sm text-white/50">{stat.label}</p>
                      </div>
                      <ExternalLink size={14} className="absolute top-4 right-4 text-white/20 group-hover:text-white/50 transition-colors" />
                    </motion.button>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await leadsAPI.create({
                          firstName: 'Nouveau',
                          lastName: 'Lead',
                          source: 'OTHER',
                          transactionType: 'SALE',
                          urgency: 'MEDIUM',
                        });
                      } catch (error) {
                        // Fallback to localStorage
                        CRM.createLead({
                          firstName: 'Nouveau',
                          lastName: 'Lead',
                          email: '',
                          phone: '',
                          source: 'other',
                          transactionType: 'SALE',
                          urgency: 'medium',
                        });
                      }
                      await refreshCRM();
                      setCurrentView('crm');
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-gold to-amber-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-brand-gold/25 transition-all"
                  >
                    <UserPlus size={18} />
                    Ajouter Lead
                  </button>
                  <button
                    onClick={() => setCurrentView('properties')}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                  >
                    <Building2 size={18} />
                    Ajouter Propriete
                  </button>
                  <button
                    onClick={() => setCurrentView('analytics')}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                  >
                    <BarChart3 size={18} />
                    Voir Rapports
                  </button>
                </div>

                {/* Leads Trend Sparkline */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Tendance des Leads (7 jours)</h3>
                    <span className="text-sm text-brand-gold">{crmStats?.newLeadsWeek || 0} cette semaine</span>
                  </div>
                  <div className="flex items-end gap-1 h-16">
                    {(() => {
                      const days = 7;
                      const data = Array.from({ length: days }, (_, i) => {
                        const dayLeads = leads.filter(l => {
                          const leadDate = new Date(l.createdAt);
                          const targetDate = new Date();
                          targetDate.setDate(targetDate.getDate() - (days - 1 - i));
                          return leadDate.toDateString() === targetDate.toDateString();
                        }).length;
                        return dayLeads;
                      });
                      const max = Math.max(...data, 1);
                      return data.map((value, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-brand-gold to-cyan-400 rounded-t-sm transition-all hover:opacity-80"
                          style={{ height: `${(value / max) * 100}%`, minHeight: '4px' }}
                          title={`${value} leads`}
                        />
                      ));
                    })()}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-white/40">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date();
                      d.setDate(d.getDate() - (6 - i));
                      return <span key={i}>{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>;
                    })}
                  </div>
                </div>

                {/* Activity Feed + Recent Properties Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Activity Feed - Recent Leads */}
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Activity size={16} className="text-brand-gold" />
                        Activite Recente
                      </h3>
                      <button
                        onClick={() => setCurrentView('crm')}
                        className="text-xs text-brand-gold hover:text-brand-gold/80 transition-colors"
                      >
                        Voir CRM
                      </button>
                    </div>
                    <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                      {leads.slice(0, 5).map((lead, i) => (
                        <motion.button
                          key={lead.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => {
                            setSelectedLead(lead);
                            setCurrentView('crm');
                          }}
                          className="w-full p-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center text-black font-bold text-xs">
                            {lead.firstName.charAt(0)}{lead.lastName?.charAt(0) || ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{lead.firstName} {lead.lastName}</p>
                            <p className="text-[10px] text-white/40">{lead.source} - {new Date(lead.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                            lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                            lead.status === 'won' ? 'bg-green-500/20 text-green-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {lead.status}
                          </span>
                        </motion.button>
                      ))}
                      {leads.length === 0 && (
                        <div className="p-6 text-center text-white/30">
                          <Users size={24} className="mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Aucun lead recent</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Properties */}
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <Building2 size={16} className="text-cyan-400" />
                        Proprietes Recentes
                      </h3>
                      <button
                        onClick={() => setCurrentView('properties')}
                        className="text-xs text-brand-gold hover:text-brand-gold/80 transition-colors"
                      >
                        Voir tout
                      </button>
                    </div>
                    <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                      {properties.slice(0, 4).map((property, i) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                        >
                          <img
                            src={property.image}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-white/5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{property.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <MapPin size={10} className="text-white/40" />
                              <span className="text-[10px] text-white/40">{property.location}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-brand-gold">{property.price}</p>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              property.category === 'RENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {property.category === 'RENT' ? 'Loc' : 'Vente'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CRM View */}
            {currentView === 'crm' && (
              <div className="space-y-6">
                {/* CRM Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">CRM - Gestion des Leads</h2>
                    <p className="text-white/50 text-sm">Pipeline commercial et suivi prospects</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Bulk Actions */}
                    {selectedLeadIds.size > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <span className="text-sm text-red-400 font-medium">{selectedLeadIds.size} sélectionné(s)</span>
                        <button
                          onClick={deselectAllLeads}
                          className="text-white/50 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => setShowBulkDeleteConfirm('leads')}
                          className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium hover:bg-red-500/30"
                        >
                          <Trash2 size={12} />
                          Supprimer
                        </button>
                      </div>
                    )}

                    {/* View Toggle */}
                    <div className="flex bg-white/[0.03] rounded-lg p-1 border border-white/[0.08]">
                      <button
                        onClick={() => setCrmView('pipeline')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          crmView === 'pipeline' ? 'bg-brand-gold text-black' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Pipeline
                      </button>
                      <button
                        onClick={() => setCrmView('list')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          crmView === 'list' ? 'bg-brand-gold text-black' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        Liste
                      </button>
                    </div>

                    <button
                      onClick={() => CRM.downloadLeadsCSV()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
                    >
                      <Download size={16} />
                      Export
                    </button>

                    {/* Synthetic Data Controls */}
                    <div className="relative">
                      <button
                        onClick={() => setShowDataMenu(!showDataMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all"
                      >
                        <Sparkles size={16} />
                        Data
                        <ChevronDown size={14} className={`transition-transform ${showDataMenu ? 'rotate-180' : ''}`} />
                      </button>
                      {showDataMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowDataMenu(false)} />
                          <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                            <button
                              onClick={() => {
                                handleGenerateSyntheticData();
                                setShowDataMenu(false);
                              }}
                              disabled={isGeneratingData}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-all rounded-t-lg"
                            >
                              <Plus size={16} className="text-emerald-400" />
                              {isGeneratingData ? 'Génération...' : 'Générer 60 leads + 50 demandes'}
                            </button>
                            <button
                              onClick={() => {
                                selectAllLeads();
                                setShowDataMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-all"
                            >
                              <Check size={16} className="text-blue-400" />
                              Tout sélectionner
                            </button>
                            <button
                              onClick={() => {
                                handleClearAllData();
                                setShowDataMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-all border-t border-white/5 rounded-b-lg"
                            >
                              <Trash2 size={16} />
                              Supprimer toutes les données
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setShowAddLeadModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-brand-gold/25 transition-all"
                    >
                      <Plus size={18} />
                      Nouveau Lead
                    </button>
                  </div>
                </div>

                {/* CRM Stats */}
                {crmStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                      { label: 'Total Leads', value: crmStats.totalLeads, icon: Users, color: 'from-brand-gold to-amber-500' },
                      { label: "Aujourd'hui", value: crmStats.newLeadsToday, icon: Zap, color: 'from-cyan-500 to-blue-400' },
                      { label: 'Cette semaine', value: crmStats.newLeadsWeek, icon: Calendar, color: 'from-emerald-500 to-teal-400' },
                      { label: 'Gagnés', value: crmStats.leadsWon, icon: Award, color: 'from-green-500 to-emerald-400' },
                      { label: 'Perdus', value: crmStats.leadsLost, icon: Archive, color: 'from-red-500 to-rose-400' },
                      { label: 'Conversion', value: `${crmStats.conversionRate}%`, icon: TrendingUp, color: 'from-purple-500 to-pink-400' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
                      >
                        <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2`} />
                        <div className="relative">
                          <stat.icon size={18} className="text-white/40 mb-2" />
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                          <p className="text-xs text-white/50">{stat.label}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Search & Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[300px] relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={crmSearchQuery}
                      onChange={(e) => setCrmSearchQuery(e.target.value)}
                      placeholder="Rechercher un lead..."
                      className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                    />
                  </div>

                  <select
                    value={crmStatusFilter}
                    onChange={(e) => setCrmStatusFilter(e.target.value as any)}
                    className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none transition-all"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="new">Nouveaux</option>
                    <option value="contacted">Contactés</option>
                    <option value="qualified">Qualifiés</option>
                    <option value="visit_scheduled">Visite planifiée</option>
                    <option value="visit_completed">Visite effectuée</option>
                    <option value="proposal_sent">Proposition envoyée</option>
                    <option value="negotiation">Négociation</option>
                    <option value="won">Gagnés</option>
                    <option value="lost">Perdus</option>
                  </select>

                  {/* Time Period Filter */}
                  <select
                    value={crmTimeFilter}
                    onChange={(e) => setCrmTimeFilter(e.target.value as 'today' | 'week' | 'month' | 'all')}
                    className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none transition-all"
                  >
                    <option value="all">Toutes périodes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>

                  <button
                    onClick={refreshCRM}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                {/* Pipeline View */}
                {crmView === 'pipeline' && (
                  <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max">
                      {(['new', 'contacted', 'qualified', 'visit_scheduled', 'proposal_sent', 'negotiation', 'won'] as CRM.LeadStatus[]).map(status => {
                        const statusConfig: Record<string, { label: string; color: string }> = {
                          new: { label: 'Nouveaux', color: 'bg-blue-500' },
                          contacted: { label: 'Contactés', color: 'bg-cyan-500' },
                          qualified: { label: 'Qualifiés', color: 'bg-emerald-500' },
                          visit_scheduled: { label: 'Visite planifiée', color: 'bg-yellow-500' },
                          proposal_sent: { label: 'Proposition', color: 'bg-orange-500' },
                          negotiation: { label: 'Négociation', color: 'bg-purple-500' },
                          won: { label: 'Gagnés', color: 'bg-green-500' },
                        };
                        const config = statusConfig[status];
                        const statusLeads = leadsByStatus[status] || [];

                        return (
                          <div
                            key={status}
                            className={`w-72 flex-shrink-0 p-2 rounded-xl transition-all ${
                              dropTargetStatus === status
                                ? 'bg-brand-gold/10 border-2 border-brand-gold/50 border-dashed'
                                : 'border-2 border-transparent'
                            }`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (draggedLeadId) {
                                setDropTargetStatus(status);
                              }
                            }}
                            onDragLeave={(e) => {
                              // Only clear if leaving the column entirely
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setDropTargetStatus(null);
                              }
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              const leadId = e.dataTransfer.getData('text/plain');
                              if (leadId) {
                                const lead = leads.find(l => l.id === leadId);
                                if (lead && lead.status !== status) {
                                  // Map CRM status (lowercase) to API status (uppercase)
                                  const statusMap: Record<string, string> = {
                                    'new': 'NEW', 'contacted': 'CONTACTED', 'qualified': 'QUALIFIED',
                                    'visit_scheduled': 'VISIT_SCHEDULED', 'visit_completed': 'VISIT_COMPLETED',
                                    'proposal_sent': 'PROPOSAL_SENT', 'negotiation': 'NEGOTIATION',
                                    'won': 'WON', 'lost': 'LOST', 'nurturing': 'QUALIFIED'
                                  };
                                  try {
                                    await leadsAPI.update(leadId, { status: statusMap[status] || status.toUpperCase() });
                                  } catch (error) {
                                    CRM.updateLead(leadId, { status });
                                  }
                                  refreshCRM();
                                }
                              }
                              setDraggedLeadId(null);
                              setDropTargetStatus(null);
                            }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`w-3 h-3 rounded-full ${config.color}`} />
                              <span className="text-sm font-medium text-white">{config.label}</span>
                              <span className="ml-auto px-2 py-0.5 text-xs bg-white/10 rounded-full text-white/60">
                                {statusLeads.length}
                              </span>
                            </div>

                            <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
                              {statusLeads.map(lead => (
                                <motion.div
                                  key={lead.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`relative w-full p-4 bg-white/[0.02] border rounded-xl text-left hover:border-brand-gold/30 hover:bg-white/[0.04] transition-all group ${
                                    draggedLeadId === lead.id ? 'opacity-50 border-brand-gold/50' :
                                    selectedLeadIds.has(lead.id) ? 'border-brand-gold/50 bg-brand-gold/5' : 'border-white/[0.06]'
                                  }`}
                                >
                                  {/* Selection checkbox */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLeadSelection(lead.id);
                                    }}
                                    className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                      selectedLeadIds.has(lead.id)
                                        ? 'bg-brand-gold border-brand-gold text-black'
                                        : 'border-white/20 hover:border-white/40 opacity-0 group-hover:opacity-100'
                                    }`}
                                  >
                                    {selectedLeadIds.has(lead.id) && <Check size={12} />}
                                  </button>

                                  <div
                                    draggable
                                    onDragStart={(e) => {
                                      setDraggedLeadId(lead.id);
                                      e.dataTransfer.setData('text/plain', lead.id);
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragEnd={() => {
                                      setDraggedLeadId(null);
                                      setDropTargetStatus(null);
                                    }}
                                    onClick={() => setSelectedLead(lead)}
                                    className="cursor-grab active:cursor-grabbing"
                                  >
                                  <div className="flex items-start justify-between mb-2">
                                    <p className="font-medium text-white text-sm pl-5">
                                      {lead.firstName} {lead.lastName}
                                    </p>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                                      lead.urgency === 'critical' ? 'bg-red-500/20 text-red-400' :
                                      lead.urgency === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                      lead.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {lead.urgency}
                                    </span>
                                  </div>

                                  {lead.email && (
                                    <p className="text-xs text-white/50 truncate mb-1">{lead.email}</p>
                                  )}
                                  {lead.phone && (
                                    <div className="flex items-center gap-1 text-xs text-white/50 mb-2">
                                      <Phone size={10} />
                                      {lead.phone}
                                    </div>
                                  )}

                                  {/* Quick Actions */}
                                  <div className="flex items-center gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {lead.phone && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`tel:${lead.phone}`, '_blank');
                                          }}
                                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                          title="Appeler"
                                        >
                                          <Phone size={12} />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(`https://wa.me/${lead.phone.replace(/\s/g, '').replace('+', '')}`, '_blank');
                                          }}
                                          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                                          title="WhatsApp"
                                        >
                                          <MessageSquare size={12} />
                                        </button>
                                      </>
                                    )}
                                    {lead.email && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(`mailto:${lead.email}`, '_blank');
                                        }}
                                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                        title="Email"
                                      >
                                        <Mail size={12} />
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                                    <div className="flex items-center gap-2">
                                      <Star size={12} className="text-brand-gold" />
                                      <span className="text-xs font-medium text-brand-gold">{lead.score}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px]" title={`Capturé le ${formatLeadTimestamp(lead.createdAt).fullDate} à ${formatLeadTimestamp(lead.createdAt).fullTime}`}>
                                      <Clock size={10} className="text-white/30" />
                                      <span className="text-white/40">
                                        {formatLeadTimestamp(lead.createdAt).relative || formatLeadTimestamp(lead.createdAt).fullDate}
                                      </span>
                                    </div>
                                  </div>
                                  </div>
                                </motion.div>
                              ))}

                              {statusLeads.length === 0 && (
                                <div className="p-8 text-center text-white/30">
                                  <p className="text-sm">Aucun lead</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* List View */}
                {crmView === 'list' && (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Lead</th>
                            <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Contact</th>
                            <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Source</th>
                            <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Statut</th>
                            <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Score</th>
                            <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Date</th>
                            <th className="text-right p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {filteredLeads.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center">
                                <Users size={48} className="text-white/10 mx-auto mb-4" />
                                <p className="text-white/40">Aucun lead trouvé</p>
                                <p className="text-xs text-white/30 mt-1">Les leads du chatbot et formulaire apparaîtront ici</p>
                              </td>
                            </tr>
                          ) : filteredLeads.slice(0, 50).map(lead => (
                            <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center text-black font-bold text-sm">
                                    {lead.firstName.charAt(0)}{lead.lastName.charAt(0) || ''}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">{lead.firstName} {lead.lastName}</p>
                                    <p className="text-xs text-white/40">{lead.city || 'Non spécifié'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="space-y-1">
                                  {lead.email && <p className="text-xs text-white/60">{lead.email}</p>}
                                  {lead.phone && <p className="text-xs text-white/60">{lead.phone}</p>}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                                  lead.source === 'chatbot' ? 'bg-cyan-500/20 text-cyan-400' :
                                  lead.source === 'website_form' ? 'bg-blue-500/20 text-blue-400' :
                                  lead.source === 'referral' ? 'bg-green-500/20 text-green-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {lead.source === 'chatbot' && <MessageSquare size={10} />}
                                  {lead.source === 'website_form' && <FileText size={10} />}
                                  {lead.source === 'referral' && <UserPlus size={10} />}
                                  {lead.source}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                                  lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                                  lead.status === 'contacted' ? 'bg-cyan-500/20 text-cyan-400' :
                                  lead.status === 'qualified' ? 'bg-emerald-500/20 text-emerald-400' :
                                  lead.status === 'won' ? 'bg-green-500/20 text-green-400' :
                                  lead.status === 'lost' ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {lead.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        lead.score >= 80 ? 'bg-green-500' :
                                        lead.score >= 60 ? 'bg-yellow-500' :
                                        lead.score >= 40 ? 'bg-orange-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${lead.score}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-white">{lead.score}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col" title={`Capturé le ${formatLeadTimestamp(lead.createdAt).fullDate} à ${formatLeadTimestamp(lead.createdAt).fullTime}`}>
                                  <span className="text-xs text-white/60">{formatLeadTimestamp(lead.createdAt).fullDate}</span>
                                  <span className="text-[10px] text-white/40">{formatLeadTimestamp(lead.createdAt).fullTime} {formatLeadTimestamp(lead.createdAt).relative ? `• ${formatLeadTimestamp(lead.createdAt).relative}` : ''}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Quick Actions */}
                                  {lead.phone && (
                                    <>
                                      <button
                                        onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                                        title="Appeler"
                                      >
                                        <Phone size={14} />
                                      </button>
                                      <button
                                        onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\s/g, '').replace('+', '')}`, '_blank')}
                                        className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                                        title="WhatsApp"
                                      >
                                        <MessageSquare size={14} />
                                      </button>
                                    </>
                                  )}
                                  {lead.email && (
                                    <button
                                      onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                                      className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                                      title="Email"
                                    >
                                      <Mail size={14} />
                                    </button>
                                  )}
                                  <div className="w-px h-4 bg-white/10 mx-1" />
                                  <button
                                    onClick={() => setSelectedLead(lead)}
                                    className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                                    title="Voir détails"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await leadsAPI.delete(lead.id);
                                      } catch (error) {
                                        CRM.deleteLead(lead.id);
                                      }
                                      refreshCRM();
                                    }}
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
                  </div>
                )}

                {/* Lead Detail Modal */}
                <AnimatePresence>
                  {selectedLead && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                      onClick={() => setSelectedLead(null)}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl bg-[#0f0f15] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
                      >
                        {/* Header */}
                        <div className="p-6 border-b border-white/[0.06] flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center text-black font-bold text-xl">
                              {selectedLead.firstName.charAt(0)}{selectedLead.lastName.charAt(0) || ''}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {selectedLead.firstName} {selectedLead.lastName}
                              </h3>
                              <p className="text-sm text-white/50">Lead #{selectedLead.id.split('-')[0]}</p>
                              {/* Quick Contact Actions */}
                              <div className="flex items-center gap-2 mt-2">
                                {selectedLead.phone && (
                                  <>
                                    <button
                                      onClick={() => window.open(`tel:${selectedLead.phone}`, '_blank')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all"
                                    >
                                      <Phone size={12} />
                                      Appeler
                                    </button>
                                    <button
                                      onClick={() => window.open(`https://wa.me/${selectedLead.phone?.replace(/\s/g, '').replace('+', '')}`, '_blank')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-all"
                                    >
                                      <MessageSquare size={12} />
                                      WhatsApp
                                    </button>
                                  </>
                                )}
                                {selectedLead.email && (
                                  <button
                                    onClick={() => window.open(`mailto:${selectedLead.email}`, '_blank')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium transition-all"
                                  >
                                    <Mail size={12} />
                                    Email
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedLead(null)}
                            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                          {/* Contact Info */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                              <p className="text-xs text-white/40 mb-1">Email</p>
                              <p className="text-sm text-white">{selectedLead.email || '-'}</p>
                            </div>
                            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                              <p className="text-xs text-white/40 mb-1">Téléphone</p>
                              <p className="text-sm text-white">{selectedLead.phone || '-'}</p>
                            </div>
                            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                              <p className="text-xs text-white/40 mb-1">Source</p>
                              <p className="text-sm text-white capitalize">{selectedLead.source}</p>
                            </div>
                            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                              <p className="text-xs text-white/40 mb-1">Score</p>
                              <div className="flex items-center gap-2">
                                <Star size={14} className="text-brand-gold" />
                                <span className="text-sm font-bold text-brand-gold">{selectedLead.score}/100</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Update */}
                          <div className="mb-6">
                            <p className="text-xs text-white/40 mb-2">Modifier le statut</p>
                            <select
                              value={selectedLead.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value as CRM.LeadStatus;
                                // Map CRM status (lowercase) to API status (uppercase)
                                const statusMap: Record<string, string> = {
                                  'new': 'NEW', 'contacted': 'CONTACTED', 'qualified': 'QUALIFIED',
                                  'visit_scheduled': 'VISIT_SCHEDULED', 'visit_completed': 'VISIT_COMPLETED',
                                  'proposal_sent': 'PROPOSAL_SENT', 'negotiation': 'NEGOTIATION',
                                  'won': 'WON', 'lost': 'LOST', 'nurturing': 'QUALIFIED'
                                };
                                try {
                                  await leadsAPI.update(selectedLead.id, { status: statusMap[newStatus] || newStatus.toUpperCase() });
                                } catch (error) {
                                  CRM.updateLead(selectedLead.id, { status: newStatus });
                                }
                                const updated = CRM.getLeadById(selectedLead.id);
                                if (updated) setSelectedLead(updated);
                                refreshCRM();
                              }}
                              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none"
                            >
                              <option value="new">Nouveau</option>
                              <option value="contacted">Contacté</option>
                              <option value="qualified">Qualifié</option>
                              <option value="visit_scheduled">Visite planifiée</option>
                              <option value="visit_completed">Visite effectuée</option>
                              <option value="proposal_sent">Proposition envoyée</option>
                              <option value="negotiation">Négociation</option>
                              <option value="won">Gagné</option>
                              <option value="lost">Perdu</option>
                            </select>
                          </div>

                          {/* Budget & Interest */}
                          {(selectedLead.budgetMin || selectedLead.budgetMax || selectedLead.transactionType) && (
                            <div className="mb-6 p-4 bg-brand-gold/5 rounded-xl border border-brand-gold/20">
                              <h4 className="text-sm font-semibold text-brand-gold mb-3">Critères de recherche</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {selectedLead.transactionType && (
                                  <div>
                                    <span className="text-white/40">Type: </span>
                                    <span className="text-white">{selectedLead.transactionType === 'SALE' ? 'Achat' : 'Location'}</span>
                                  </div>
                                )}
                                {(selectedLead.budgetMin || selectedLead.budgetMax) && (
                                  <div>
                                    <span className="text-white/40">Budget: </span>
                                    <span className="text-white">
                                      {selectedLead.budgetMin && `${(selectedLead.budgetMin / 1000000).toFixed(1)}M`}
                                      {selectedLead.budgetMin && selectedLead.budgetMax && ' - '}
                                      {selectedLead.budgetMax && `${(selectedLead.budgetMax / 1000000).toFixed(1)}M DH`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Chat Messages */}
                          {selectedLead.chatMessages && selectedLead.chatMessages.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <MessageSquare size={14} />
                                Historique de conversation
                              </h4>
                              <div className="max-h-60 overflow-y-auto space-y-2 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                {selectedLead.chatMessages.slice(-10).map((msg, i) => (
                                  <div
                                    key={i}
                                    className={`p-3 rounded-lg text-sm ${
                                      msg.role === 'user'
                                        ? 'bg-brand-gold/10 text-white ml-8'
                                        : 'bg-white/[0.03] text-white/70 mr-8'
                                    }`}
                                  >
                                    {msg.content}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Activities */}
                          {selectedLead.activities && selectedLead.activities.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <Activity size={14} />
                                Activités récentes
                              </h4>
                              <div className="space-y-2">
                                {selectedLead.activities.slice(-5).reverse().map(activity => (
                                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg">
                                    <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center">
                                      <Clock size={14} className="text-white/40" />
                                    </div>
                                    <div>
                                      <p className="text-sm text-white">{activity.title}</p>
                                      {activity.description && (
                                        <p className="text-xs text-white/50">{activity.description}</p>
                                      )}
                                      <p className="text-[10px] text-white/30 mt-1">
                                        {new Date(activity.createdAt).toLocaleString('fr-FR')}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add Lead Modal */}
                <AnimatePresence>
                  {showAddLeadModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                      onClick={() => setShowAddLeadModal(false)}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-[#0f0f15] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
                      >
                        {/* Header */}
                        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center">
                              <UserPlus size={20} className="text-black" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">Nouveau Lead</h3>
                              <p className="text-xs text-white/50">Ajouter un nouveau prospect</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAddLeadModal(false)}
                            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        {/* Form */}
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setLeadCreationError('');
                            setIsCreatingLead(true);

                            // Map source values: frontend uses underscores, API expects uppercase
                            const sourceMap: Record<string, string> = {
                              'website_form': 'WEBSITE_FORM',
                              'chatbot': 'CHATBOT',
                              'phone': 'PHONE',
                              'email': 'EMAIL',
                              'walk_in': 'WALK_IN',
                              'referral': 'REFERRAL',
                              'social_media': 'SOCIAL_MEDIA',
                              'other': 'OTHER'
                            };

                            const urgencyMap: Record<string, string> = {
                              'low': 'LOW',
                              'medium': 'MEDIUM',
                              'high': 'HIGH',
                              'critical': 'CRITICAL'
                            };

                            const leadData = {
                              firstName: newLeadForm.firstName || 'Nouveau',
                              lastName: newLeadForm.lastName || 'Lead',
                              email: newLeadForm.email || undefined,
                              phone: newLeadForm.phone || undefined,
                              city: newLeadForm.city || undefined,
                              status: 'NEW' as const,
                              source: sourceMap[newLeadForm.source] || 'OTHER',
                              transactionType: newLeadForm.transactionType,
                              budgetMin: newLeadForm.budgetMin ? parseInt(newLeadForm.budgetMin) * 1000000 : undefined,
                              budgetMax: newLeadForm.budgetMax ? parseInt(newLeadForm.budgetMax) * 1000000 : undefined,
                              urgency: urgencyMap[newLeadForm.urgency] || 'MEDIUM',
                            };

                            try {
                              const result = await leadsAPI.create(leadData);
                              console.log('[CRM] Lead created via API:', result.lead.id);
                              refreshCRM();
                              setShowAddLeadModal(false);
                              setNewLeadForm({
                                firstName: '', lastName: '', email: '', phone: '', city: '',
                                source: 'website_form', transactionType: 'SALE',
                                budgetMin: '', budgetMax: '', urgency: 'medium',
                              });
                            } catch (error: any) {
                              console.error('[CRM] API lead creation failed:', error);
                              const errorMessage = error?.message || 'Erreur lors de la création du lead';
                              setLeadCreationError(errorMessage);

                              // Fallback to localStorage only if API is unavailable
                              if (error?.status === 0 || error?.message?.includes('fetch')) {
                                try {
                                  const newLead = CRM.createLead({
                                    firstName: newLeadForm.firstName || 'Nouveau',
                                    lastName: newLeadForm.lastName || 'Lead',
                                    email: newLeadForm.email || undefined,
                                    phone: newLeadForm.phone || undefined,
                                    city: newLeadForm.city || undefined,
                                    source: newLeadForm.source as CRM.LeadSource,
                                    transactionType: newLeadForm.transactionType,
                                    budgetMin: newLeadForm.budgetMin ? parseInt(newLeadForm.budgetMin) * 1000000 : undefined,
                                    budgetMax: newLeadForm.budgetMax ? parseInt(newLeadForm.budgetMax) * 1000000 : undefined,
                                    urgency: newLeadForm.urgency as CRM.LeadUrgency,
                                  });
                                  console.log('[CRM] Lead created via localStorage (offline mode):', newLead.id);
                                  setLeadCreationError('');
                                  refreshCRM();
                                  setShowAddLeadModal(false);
                                  setNewLeadForm({
                                    firstName: '', lastName: '', email: '', phone: '', city: '',
                                    source: 'website_form', transactionType: 'SALE',
                                    budgetMin: '', budgetMax: '', urgency: 'medium',
                                  });
                                } catch (localError) {
                                  console.error('[CRM] localStorage fallback failed:', localError);
                                  setLeadCreationError('Impossible de créer le lead. Veuillez réessayer.');
                                }
                              }
                            } finally {
                              setIsCreatingLead(false);
                            }
                          }}
                          className="p-6 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto"
                        >
                          {/* Name Row */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-white/50 mb-1.5">Prénom *</label>
                              <input
                                type="text"
                                value={newLeadForm.firstName}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, firstName: e.target.value }))}
                                placeholder="Prénom"
                                required
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-white/50 mb-1.5">Nom *</label>
                              <input
                                type="text"
                                value={newLeadForm.lastName}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, lastName: e.target.value }))}
                                placeholder="Nom"
                                required
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* Contact Row */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-white/50 mb-1.5">Email</label>
                              <input
                                type="email"
                                value={newLeadForm.email}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="email@example.com"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-white/50 mb-1.5">Téléphone</label>
                              <input
                                type="tel"
                                value={newLeadForm.phone}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="+212 6 00 00 00 00"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* City */}
                          <div>
                            <label className="block text-xs text-white/50 mb-1.5">Ville</label>
                            <input
                              type="text"
                              value={newLeadForm.city}
                              onChange={(e) => setNewLeadForm(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="Casablanca"
                              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                            />
                          </div>

                          {/* Source & Type */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-white/50 mb-1.5">Source</label>
                              <select
                                value={newLeadForm.source}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, source: e.target.value as CRM.LeadSource }))}
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-brand-gold/50 outline-none transition-all"
                              >
                                <option value="website_form">Formulaire Web</option>
                                <option value="chatbot">Chatbot</option>
                                <option value="phone">Téléphone</option>
                                <option value="email">Email</option>
                                <option value="referral">Recommandation</option>
                                <option value="social_media">Réseaux sociaux</option>
                                <option value="other">Autre</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-white/50 mb-1.5">Type de transaction</label>
                              <select
                                value={newLeadForm.transactionType}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, transactionType: e.target.value as CRM.PropertyCategory }))}
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-brand-gold/50 outline-none transition-all"
                              >
                                <option value="SALE">Achat</option>
                                <option value="RENT">Location</option>
                              </select>
                            </div>
                          </div>

                          {/* Budget */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-white/50 mb-1.5">Budget min (M DH)</label>
                              <input
                                type="number"
                                value={newLeadForm.budgetMin}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, budgetMin: e.target.value }))}
                                placeholder="1"
                                min="0"
                                step="0.1"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-white/50 mb-1.5">Budget max (M DH)</label>
                              <input
                                type="number"
                                value={newLeadForm.budgetMax}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, budgetMax: e.target.value }))}
                                placeholder="5"
                                min="0"
                                step="0.1"
                                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                              />
                            </div>
                          </div>

                          {/* Urgency */}
                          <div>
                            <label className="block text-xs text-white/50 mb-1.5">Priorité</label>
                            <div className="flex gap-2">
                              {[
                                { value: 'low', label: 'Basse', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
                                { value: 'medium', label: 'Moyenne', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
                                { value: 'high', label: 'Haute', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setNewLeadForm(prev => ({ ...prev, urgency: opt.value as CRM.LeadUrgency }))}
                                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                                    newLeadForm.urgency === opt.value
                                      ? opt.color
                                      : 'text-white/50 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Error Message */}
                          {leadCreationError && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                              <AlertCircle size={16} />
                              {leadCreationError}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddLeadModal(false);
                                setLeadCreationError('');
                              }}
                              disabled={isCreatingLead}
                              className="flex-1 py-3 rounded-lg text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all disabled:opacity-50"
                            >
                              Annuler
                            </button>
                            <button
                              type="submit"
                              disabled={isCreatingLead}
                              className="flex-1 py-3 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-brand-gold/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCreatingLead ? (
                                <>
                                  <RefreshCw size={18} className="animate-spin" />
                                  Création...
                                </>
                              ) : (
                                <>
                                  <Check size={18} />
                                  Créer le Lead
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ========== DEMANDS VIEW ========== */}
            {currentView === 'demands' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <ClipboardList className="text-brand-gold" />
                      Gestion des Demandes
                    </h2>
                    <p className="text-sm text-white/50 mt-1">
                      Demandes de recherche, vente et gestion locative
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Bulk Actions for Demands */}
                    {selectedDemandIds.size > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <span className="text-sm text-red-400 font-medium">{selectedDemandIds.size} sélectionné(s)</span>
                        <button
                          onClick={deselectAllDemands}
                          className="text-white/50 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                        <button
                          onClick={() => setShowBulkDeleteConfirm('demands')}
                          className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium hover:bg-red-500/30"
                        >
                          <Trash2 size={12} />
                          Supprimer
                        </button>
                      </div>
                    )}

                    <button
                      onClick={selectAllDemands}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
                      title="Tout sélectionner"
                    >
                      <Check size={14} />
                    </button>

                    <button
                      onClick={() => runAIMatching()}
                      disabled={isRunningMatching}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
                    >
                      <Sparkles size={18} className={isRunningMatching ? 'animate-spin' : ''} />
                      {isRunningMatching ? 'Matching...' : 'Lancer le Matching IA'}
                    </button>
                    <button
                      onClick={() => setShowAddDemandModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-brand-gold/25 transition-all"
                    >
                      <Plus size={18} />
                      Nouvelle Demande
                    </button>
                  </div>
                </div>

                {/* Demands Stats */}
                {demandStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                      { label: 'Total', value: demandStats.totalDemands, icon: ClipboardList, color: 'from-brand-gold to-amber-500' },
                      { label: 'Recherches', value: demandStats.demandsByType.property_search, icon: Search, color: 'from-blue-500 to-cyan-400' },
                      { label: 'Ventes', value: demandStats.demandsByType.property_sale, icon: DollarSign, color: 'from-emerald-500 to-teal-400' },
                      { label: 'Gestion Loc.', value: demandStats.demandsByType.property_rental_management, icon: Building2, color: 'from-purple-500 to-pink-400' },
                      { label: 'Matchs', value: demandStats.totalMatches, icon: Link2, color: 'from-orange-500 to-red-400' },
                      { label: 'Score Moy.', value: `${demandStats.avgMatchScore}%`, icon: Sparkles, color: 'from-cyan-500 to-blue-400' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
                      >
                        <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2`} />
                        <div className="relative">
                          <stat.icon size={18} className="text-white/40 mb-2" />
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                          <p className="text-xs text-white/50">{stat.label}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <select
                    value={demandTypeFilter}
                    onChange={(e) => setDemandTypeFilter(e.target.value as CRM.DemandType | 'all')}
                    className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none transition-all"
                  >
                    <option value="all">Tous les types</option>
                    <option value="property_search">Recherche de bien</option>
                    <option value="property_sale">Vente de bien</option>
                    <option value="property_rental_management">Gestion locative</option>
                  </select>
                  <select
                    value={demandStatusFilter}
                    onChange={(e) => setDemandStatusFilter(e.target.value as CRM.DemandStatus | 'all')}
                    className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none transition-all"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="new">Nouvelle</option>
                    <option value="processing">En traitement</option>
                    <option value="matched">Matchée</option>
                    <option value="contacted">Contactée</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                  <button
                    onClick={refreshDemands}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                {/* Demands List */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDemands.map(demand => {
                    const typeConfig: Record<CRM.DemandType, { label: string; color: string; icon: any }> = {
                      property_search: { label: 'Recherche', color: 'bg-blue-500', icon: Search },
                      property_sale: { label: 'Vente', color: 'bg-emerald-500', icon: DollarSign },
                      property_rental_management: { label: 'Gestion', color: 'bg-purple-500', icon: Building2 },
                    };
                    const config = typeConfig[demand.type];
                    const TypeIcon = config.icon;

                    return (
                      <motion.div
                        key={demand.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative p-4 bg-white/[0.02] border rounded-xl hover:border-brand-gold/30 hover:bg-white/[0.04] transition-all cursor-pointer group ${
                          selectedDemandIds.has(demand.id) ? 'border-brand-gold/50 bg-brand-gold/5' : 'border-white/[0.06]'
                        }`}
                      >
                        {/* Selection checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDemandSelection(demand.id);
                          }}
                          className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center transition-all z-10 ${
                            selectedDemandIds.has(demand.id)
                              ? 'bg-brand-gold border-brand-gold text-black'
                              : 'border-white/20 hover:border-white/40 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {selectedDemandIds.has(demand.id) && <Check size={12} />}
                        </button>

                        <div
                          onClick={() => {
                            setSelectedDemand(demand);
                            setDemandMatches(CRM.getMatchesForDemand(demand.id));
                          }}
                        >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 pl-5">
                            <div className={`w-8 h-8 rounded-lg ${config.color}/20 flex items-center justify-center`}>
                              <TypeIcon size={16} className={`${config.color.replace('bg-', 'text-')}`} />
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">
                                {demand.firstName} {demand.lastName}
                              </p>
                              <p className="text-xs text-white/50">{config.label}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                            demand.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                            demand.status === 'matched' ? 'bg-emerald-500/20 text-emerald-400' :
                            demand.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                            demand.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {demand.status}
                          </span>
                        </div>

                        {demand.email && (
                          <p className="text-xs text-white/50 truncate mb-1">{demand.email}</p>
                        )}
                        {demand.phone && (
                          <div className="flex items-center gap-1 text-xs text-white/50 mb-2">
                            <Phone size={10} />
                            {demand.phone}
                          </div>
                        )}

                        {/* Search criteria summary */}
                        {demand.type === 'property_search' && demand.searchCriteria && (
                          <div className="text-xs text-white/40 mb-2">
                            {demand.searchCriteria.transactionType === 'RENT' ? 'Location' : 'Achat'} •
                            {demand.searchCriteria.cities?.join(', ') || 'Toutes villes'} •
                            {demand.searchCriteria.budgetMax ? `${(demand.searchCriteria.budgetMax / 1000000).toFixed(1)}M MAD` : 'Budget libre'}
                          </div>
                        )}

                        {/* Property details summary */}
                        {(demand.type === 'property_sale' || demand.type === 'property_rental_management') && demand.propertyDetails && (
                          <div className="text-xs text-white/40 mb-2">
                            {demand.propertyDetails.propertyType} • {demand.propertyDetails.city} •
                            {demand.propertyDetails.price ? `${(demand.propertyDetails.price / 1000000).toFixed(1)}M MAD` : 'Prix à définir'}
                          </div>
                        )}

                        {/* Match score */}
                        {demand.matchScore && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.04]">
                            <Sparkles size={12} className="text-purple-400" />
                            <span className="text-xs text-purple-400 font-medium">Match: {demand.matchScore}%</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-2">
                          <span className="text-[10px] text-white/30">
                            {formatLeadTimestamp(demand.createdAt).relative || formatLeadTimestamp(demand.createdAt).fullDate}
                          </span>
                          <span className="text-[10px] text-white/30">{demand.source}</span>
                        </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {filteredDemands.length === 0 && (
                    <div className="col-span-full p-12 text-center">
                      <ClipboardList size={48} className="text-white/10 mx-auto mb-4" />
                      <p className="text-white/40">Aucune demande trouvée</p>
                      <p className="text-xs text-white/30 mt-1">Les demandes du chatbot et formulaires apparaîtront ici</p>
                    </div>
                  )}
                </div>

                {/* Selected Demand Detail Modal */}
                <AnimatePresence>
                  {selectedDemand && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                      onClick={() => setSelectedDemand(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#12121a] border border-white/[0.08] rounded-2xl"
                      >
                        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#12121a]">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText size={20} className="text-brand-gold" />
                            Détails de la demande
                          </h3>
                          <button
                            onClick={() => setSelectedDemand(null)}
                            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="p-6 space-y-6">
                          {/* Contact Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-white/40 mb-1">Nom complet</p>
                              <p className="text-white font-medium">{selectedDemand.firstName} {selectedDemand.lastName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40 mb-1">Email</p>
                              <p className="text-white">{selectedDemand.email || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40 mb-1">Téléphone</p>
                              <p className="text-white">{selectedDemand.phone || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-white/40 mb-1">Source</p>
                              <p className="text-white capitalize">{selectedDemand.source}</p>
                            </div>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex items-center gap-4">
                            <select
                              value={selectedDemand.status}
                              onChange={(e) => {
                                const updated = CRM.updateDemand(selectedDemand.id, { status: e.target.value as CRM.DemandStatus });
                                if (updated) {
                                  setSelectedDemand(updated);
                                  refreshDemands();
                                }
                              }}
                              className="flex-1 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-brand-gold/50 outline-none"
                            >
                              <option value="new">Nouvelle</option>
                              <option value="processing">En traitement</option>
                              <option value="matched">Matchée</option>
                              <option value="contacted">Contactée</option>
                              <option value="completed">Terminée</option>
                              <option value="cancelled">Annulée</option>
                            </select>
                            <button
                              onClick={() => runAIMatching(selectedDemand.id)}
                              disabled={isRunningMatching}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
                            >
                              <Sparkles size={16} className={isRunningMatching ? 'animate-spin' : ''} />
                              Trouver Matchs
                            </button>
                          </div>

                          {/* Search Criteria */}
                          {selectedDemand.type === 'property_search' && selectedDemand.searchCriteria && (
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                              <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                <Search size={16} />
                                Critères de recherche
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-white/50">Type:</span>
                                  <span className="text-white ml-2">{selectedDemand.searchCriteria.transactionType === 'RENT' ? 'Location' : 'Achat'}</span>
                                </div>
                                {selectedDemand.searchCriteria.propertyType && (
                                  <div>
                                    <span className="text-white/50">Bien:</span>
                                    <span className="text-white ml-2">{selectedDemand.searchCriteria.propertyType.join(', ')}</span>
                                  </div>
                                )}
                                {selectedDemand.searchCriteria.cities && (
                                  <div>
                                    <span className="text-white/50">Villes:</span>
                                    <span className="text-white ml-2">{selectedDemand.searchCriteria.cities.join(', ')}</span>
                                  </div>
                                )}
                                {selectedDemand.searchCriteria.budgetMin || selectedDemand.searchCriteria.budgetMax ? (
                                  <div>
                                    <span className="text-white/50">Budget:</span>
                                    <span className="text-white ml-2">
                                      {selectedDemand.searchCriteria.budgetMin?.toLocaleString()} - {selectedDemand.searchCriteria.budgetMax?.toLocaleString()} MAD
                                    </span>
                                  </div>
                                ) : null}
                                {selectedDemand.searchCriteria.bedroomsMin && (
                                  <div>
                                    <span className="text-white/50">Chambres:</span>
                                    <span className="text-white ml-2">{selectedDemand.searchCriteria.bedroomsMin}+</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Property Details */}
                          {(selectedDemand.type === 'property_sale' || selectedDemand.type === 'property_rental_management') && selectedDemand.propertyDetails && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                              <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                                <Building2 size={16} />
                                Détails du bien
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-white/50">Type:</span>
                                  <span className="text-white ml-2 capitalize">{selectedDemand.propertyDetails.propertyType}</span>
                                </div>
                                <div>
                                  <span className="text-white/50">Ville:</span>
                                  <span className="text-white ml-2">{selectedDemand.propertyDetails.city}</span>
                                </div>
                                {selectedDemand.propertyDetails.price && (
                                  <div>
                                    <span className="text-white/50">Prix:</span>
                                    <span className="text-white ml-2">{selectedDemand.propertyDetails.price.toLocaleString()} MAD</span>
                                  </div>
                                )}
                                {selectedDemand.propertyDetails.surface && (
                                  <div>
                                    <span className="text-white/50">Surface:</span>
                                    <span className="text-white ml-2">{selectedDemand.propertyDetails.surface} m²</span>
                                  </div>
                                )}
                                {selectedDemand.propertyDetails.bedrooms && (
                                  <div>
                                    <span className="text-white/50">Chambres:</span>
                                    <span className="text-white ml-2">{selectedDemand.propertyDetails.bedrooms}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* AI Matches */}
                          {demandMatches.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                                <Sparkles size={16} />
                                Matchs IA ({demandMatches.length})
                              </h4>
                              <div className="space-y-2">
                                {demandMatches.slice(0, 5).map(match => (
                                  <div
                                    key={match.id}
                                    className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`text-lg font-bold ${
                                        match.matchScore >= 80 ? 'text-green-400' :
                                        match.matchScore >= 60 ? 'text-yellow-400' :
                                        'text-orange-400'
                                      }`}>
                                        {match.matchScore}%
                                      </span>
                                      <span className="text-xs text-white/50">
                                        {match.matchType === 'demand_to_property' ? 'Bien' : 'Demande'} #{match.matchedEntityId.slice(-6)}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {match.matchReasons.slice(0, 4).map((reason, i) => (
                                        <span key={i} className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 rounded">
                                          {reason}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add Demand Modal */}
                <AnimatePresence>
                  {showAddDemandModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                      onClick={() => setShowAddDemandModal(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#12121a] border border-white/[0.08] rounded-2xl"
                      >
                        <AddDemandForm
                          onClose={() => setShowAddDemandModal(false)}
                          onSuccess={() => {
                            setShowAddDemandModal(false);
                            refreshDemands();
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ============ MATCHES VIEW ============ */}
            {currentView === 'matches' && (
              <div className="space-y-6">
                {/* Header with Auto-Match Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Link2 className="text-brand-gold" size={28} />
                      Centre de Matchs IA
                    </h2>
                    <p className="text-white/50 mt-1">
                      Matchs automatiques entre demandes et propriétés
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Auto-match toggle */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                      <span className="text-sm text-white/60">Auto-match</span>
                      <button
                        onClick={() => setIsAutoMatchEnabled(!isAutoMatchEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          isAutoMatchEnabled ? 'bg-emerald-500' : 'bg-white/20'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          isAutoMatchEnabled ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                      <span className={`text-sm font-medium ${isAutoMatchEnabled ? 'text-emerald-400' : 'text-white/40'}`}>
                        {isAutoMatchEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    {/* Interval selector */}
                    {isAutoMatchEnabled && (
                      <select
                        value={autoMatchInterval}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setAutoMatchIntervalState(val);
                          CRM.setAutoMatchInterval(val);
                        }}
                        className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm focus:border-brand-gold/50 outline-none"
                      >
                        <option value={5}>Toutes les 5 min</option>
                        <option value={10}>Toutes les 10 min</option>
                        <option value={15}>Toutes les 15 min</option>
                        <option value={30}>Toutes les 30 min</option>
                        <option value={60}>Toutes les heures</option>
                      </select>
                    )}

                    {/* Manual run button */}
                    <button
                      onClick={handleManualMatchRun}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                    >
                      <RefreshCw size={16} className={isRunningMatching ? 'animate-spin' : ''} />
                      Lancer maintenant
                    </button>
                  </div>
                </div>

                {/* Last run info */}
                {lastMatchRun && (
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <Clock size={14} />
                    Dernière vérification: {new Date(lastMatchRun).toLocaleString('fr-FR')}
                    {isAutoMatchEnabled && (
                      <span className="ml-2 text-emerald-400">
                        • Prochaine dans {autoMatchInterval} min
                      </span>
                    )}
                  </div>
                )}

                {/* Stats Cards */}
                {matchStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                      { label: 'Total Matchs', value: matchStats.totalMatches, icon: Link2, color: 'from-brand-gold to-amber-500' },
                      { label: 'En attente', value: matchStats.pendingMatches, icon: Clock, color: 'from-blue-500 to-cyan-400' },
                      { label: 'Notifiés', value: matchStats.notifiedMatches, icon: Bell, color: 'from-purple-500 to-pink-400' },
                      { label: 'Contactés', value: matchStats.contactedMatches, icon: MessageSquare, color: 'from-emerald-500 to-teal-400' },
                      { label: 'Réussis', value: matchStats.successfulMatches, icon: Check, color: 'from-green-500 to-emerald-400' },
                      { label: 'Score moyen', value: `${matchStats.avgMatchScore}%`, icon: Star, color: 'from-yellow-500 to-orange-400' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.06] p-4"
                      >
                        <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2`} />
                        <div className="relative">
                          <stat.icon size={18} className="text-white/40 mb-2" />
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                          <p className="text-xs text-white/50">{stat.label}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Filters & Search */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[250px] relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={matchSearchQuery}
                      onChange={(e) => setMatchSearchQuery(e.target.value)}
                      placeholder="Rechercher un match..."
                      className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                    />
                  </div>

                  <select
                    value={matchStatusFilter}
                    onChange={(e) => setMatchStatusFilter(e.target.value as any)}
                    className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="notified">Notifiés</option>
                    <option value="contacted">Contactés</option>
                    <option value="successful">Réussis</option>
                    <option value="rejected">Rejetés</option>
                  </select>

                  <select
                    value={matchTypeFilter}
                    onChange={(e) => setMatchTypeFilter(e.target.value as any)}
                    className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none"
                  >
                    <option value="all">Tous les types</option>
                    <option value="demand_to_property">Demande → Propriété</option>
                    <option value="demand_to_demand">Demande → Demande</option>
                  </select>

                  {/* Bulk actions */}
                  {selectedMatchIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/60">{selectedMatchIds.size} sélectionné(s)</span>
                      <button
                        onClick={deselectAllMatches}
                        className="px-3 py-2 text-sm text-white/60 hover:text-white transition-all"
                      >
                        Désélectionner
                      </button>
                      <button
                        onClick={bulkDeleteSelectedMatches}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
                  )}

                  <button
                    onClick={selectAllMatches}
                    className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-all"
                  >
                    Tout sélectionner
                  </button>

                  <button
                    onClick={refreshMatches}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                {/* Matches List - Comprehensive View */}
                <div className="space-y-6">
                  {filteredMatches.length === 0 ? (
                    <div className="p-12 text-center bg-white/[0.02] border border-white/[0.06] rounded-2xl">
                      <Link2 size={48} className="text-white/10 mx-auto mb-4" />
                      <p className="text-white/40">Aucun match trouvé</p>
                      <p className="text-xs text-white/30 mt-1">
                        Les matchs apparaîtront automatiquement quand des demandes correspondent à des propriétés
                      </p>
                      <button
                        onClick={handleManualMatchRun}
                        className="mt-4 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                      >
                        Lancer une recherche de matchs
                      </button>
                    </div>
                  ) : (
                    filteredMatches.map((match) => {
                      const statusConfig = {
                        pending: { label: 'En attente', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
                        notified: { label: 'Notifié', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Bell },
                        contacted: { label: 'Contacté', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: MessageSquare },
                        successful: { label: 'Réussi', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Check },
                        rejected: { label: 'Rejeté', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: X },
                      };
                      const config = statusConfig[match.status];
                      const StatusIcon = config.icon;

                      // Helper to format budget
                      const formatBudget = (min?: number, max?: number) => {
                        if (!min && !max) return 'Non défini';
                        if (min && max) return `${(min/1000000).toFixed(1)}M - ${(max/1000000).toFixed(1)}M MAD`;
                        if (max) return `Jusqu'à ${(max/1000000).toFixed(1)}M MAD`;
                        return `À partir de ${(min!/1000000).toFixed(1)}M MAD`;
                      };

                      // Helper to format price
                      const formatPrice = (price?: number | string) => {
                        if (!price) return 'Prix non défini';
                        if (typeof price === 'string') return price;
                        return `${(price/1000000).toFixed(2)}M MAD`;
                      };

                      return (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`relative bg-gradient-to-br from-white/[0.03] to-white/[0.01] border rounded-2xl overflow-hidden transition-all group ${
                            selectedMatchIds.has(match.id) ? 'border-brand-gold/50 ring-2 ring-brand-gold/20' : 'border-white/[0.08] hover:border-brand-gold/30'
                          }`}
                        >
                          {/* Top Bar - Status & Score */}
                          <div className="flex items-center justify-between px-6 py-3 bg-white/[0.02] border-b border-white/[0.06]">
                            <div className="flex items-center gap-4">
                              {/* Selection checkbox */}
                              <button
                                onClick={() => toggleMatchSelection(match.id)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                  selectedMatchIds.has(match.id)
                                    ? 'bg-brand-gold border-brand-gold text-black'
                                    : 'border-white/30 hover:border-white/50'
                                }`}
                              >
                                {selectedMatchIds.has(match.id) && <Check size={12} />}
                              </button>

                              {/* Match Score */}
                              <div className="flex items-center gap-3">
                                <div className={`px-4 py-2 rounded-xl font-bold text-lg ${
                                  match.matchScore >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                  match.matchScore >= 60 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                  'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                }`}>
                                  {match.matchScore}% Match
                                </div>
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${config.color} flex items-center gap-1.5`}>
                                  <StatusIcon size={12} />
                                  {config.label}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-white/40">
                              <span>{new Date(match.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="px-2 py-1 bg-white/[0.05] rounded text-white/50">
                                {match.matchType === 'demand_to_property' ? 'Demande → Propriété' : 'Acheteur ↔ Vendeur'}
                              </span>
                            </div>
                          </div>

                          {/* Main Content - Two Panels */}
                          <div className="grid lg:grid-cols-2 gap-0 lg:divide-x divide-white/[0.06]">

                            {/* LEFT PANEL - DEMANDEUR */}
                            <div className="p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                  <Users size={16} className="text-blue-400" />
                                </div>
                                <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Demandeur</h4>
                              </div>

                              {match.demand && (
                                <div className="space-y-4">
                                  {/* Contact Info */}
                                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                                    <h5 className="text-lg font-bold text-white mb-3">
                                      {match.demand.firstName} {match.demand.lastName}
                                    </h5>
                                    <div className="grid grid-cols-1 gap-2">
                                      {match.demand.phone && (
                                        <a href={`tel:${match.demand.phone}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                                          <Phone size={14} className="text-blue-400" />
                                          <span className="font-medium">{match.demand.phone}</span>
                                        </a>
                                      )}
                                      {match.demand.email && (
                                        <a href={`mailto:${match.demand.email}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                                          <Mail size={14} className="text-blue-400" />
                                          <span>{match.demand.email}</span>
                                        </a>
                                      )}
                                      {match.demand.whatsapp && (
                                        <a href={`https://wa.me/${match.demand.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/70 hover:text-green-400 transition-colors">
                                          <MessageSquare size={14} className="text-green-400" />
                                          <span>WhatsApp: {match.demand.whatsapp}</span>
                                        </a>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                                        match.demand.urgency === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                        match.demand.urgency === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                        match.demand.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-gray-500/20 text-gray-400'
                                      }`}>
                                        {match.demand.urgency?.toUpperCase() || 'NORMAL'}
                                      </span>
                                      <span className="text-[10px] text-white/40">Source: {match.demand.source}</span>
                                    </div>
                                  </div>

                                  {/* Search Criteria (for property_search) */}
                                  {match.demand.type === 'property_search' && match.demand.searchCriteria && (
                                    <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                      <h6 className="text-xs font-semibold text-white/50 uppercase mb-3 flex items-center gap-2">
                                        <Search size={12} />
                                        Critères de Recherche
                                      </h6>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-white/40 text-xs">Type</span>
                                          <p className="text-white font-medium">
                                            {match.demand.searchCriteria.transactionType === 'RENT' ? '🏠 Location' : '💰 Achat'}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-white/40 text-xs">Budget</span>
                                          <p className="text-white font-medium">
                                            {formatBudget(match.demand.searchCriteria.budgetMin, match.demand.searchCriteria.budgetMax)}
                                          </p>
                                        </div>
                                        {match.demand.searchCriteria.cities && match.demand.searchCriteria.cities.length > 0 && (
                                          <div>
                                            <span className="text-white/40 text-xs">Villes</span>
                                            <p className="text-white font-medium">{match.demand.searchCriteria.cities.join(', ')}</p>
                                          </div>
                                        )}
                                        {match.demand.searchCriteria.neighborhoods && match.demand.searchCriteria.neighborhoods.length > 0 && (
                                          <div>
                                            <span className="text-white/40 text-xs">Quartiers</span>
                                            <p className="text-white font-medium">{match.demand.searchCriteria.neighborhoods.join(', ')}</p>
                                          </div>
                                        )}
                                        {match.demand.searchCriteria.propertyType && match.demand.searchCriteria.propertyType.length > 0 && (
                                          <div>
                                            <span className="text-white/40 text-xs">Type de bien</span>
                                            <p className="text-white font-medium capitalize">{match.demand.searchCriteria.propertyType.join(', ')}</p>
                                          </div>
                                        )}
                                        {(match.demand.searchCriteria.bedroomsMin || match.demand.searchCriteria.bedroomsMax) && (
                                          <div>
                                            <span className="text-white/40 text-xs">Chambres</span>
                                            <p className="text-white font-medium">
                                              {match.demand.searchCriteria.bedroomsMin && match.demand.searchCriteria.bedroomsMax
                                                ? `${match.demand.searchCriteria.bedroomsMin} - ${match.demand.searchCriteria.bedroomsMax}`
                                                : match.demand.searchCriteria.bedroomsMin
                                                ? `${match.demand.searchCriteria.bedroomsMin}+`
                                                : `≤ ${match.demand.searchCriteria.bedroomsMax}`
                                              }
                                            </p>
                                          </div>
                                        )}
                                        {(match.demand.searchCriteria.surfaceMin || match.demand.searchCriteria.surfaceMax) && (
                                          <div>
                                            <span className="text-white/40 text-xs">Surface</span>
                                            <p className="text-white font-medium">
                                              {match.demand.searchCriteria.surfaceMin && match.demand.searchCriteria.surfaceMax
                                                ? `${match.demand.searchCriteria.surfaceMin} - ${match.demand.searchCriteria.surfaceMax} m²`
                                                : match.demand.searchCriteria.surfaceMin
                                                ? `${match.demand.searchCriteria.surfaceMin}+ m²`
                                                : `≤ ${match.demand.searchCriteria.surfaceMax} m²`
                                              }
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      {match.demand.searchCriteria.amenities && match.demand.searchCriteria.amenities.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                          <span className="text-white/40 text-xs">Équipements souhaités</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {match.demand.searchCriteria.amenities.map((a, i) => (
                                              <span key={i} className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-300 rounded">{a}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {match.demand.searchCriteria.additionalNotes && (
                                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                          <span className="text-white/40 text-xs">Notes</span>
                                          <p className="text-white/70 text-sm mt-1">{match.demand.searchCriteria.additionalNotes}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Property Details (for sellers) */}
                                  {(match.demand.type === 'property_sale' || match.demand.type === 'property_rental_management') && match.demand.propertyDetails && (
                                    <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                      <h6 className="text-xs font-semibold text-white/50 uppercase mb-3 flex items-center gap-2">
                                        <Building2 size={12} />
                                        Bien à {match.demand.type === 'property_sale' ? 'Vendre' : 'Gérer'}
                                      </h6>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-white/40 text-xs">Type</span>
                                          <p className="text-white font-medium capitalize">{match.demand.propertyDetails.propertyType}</p>
                                        </div>
                                        <div>
                                          <span className="text-white/40 text-xs">Prix</span>
                                          <p className="text-white font-medium">{formatPrice(match.demand.propertyDetails.price)}</p>
                                        </div>
                                        <div>
                                          <span className="text-white/40 text-xs">Ville</span>
                                          <p className="text-white font-medium">{match.demand.propertyDetails.city}</p>
                                        </div>
                                        {match.demand.propertyDetails.neighborhood && (
                                          <div>
                                            <span className="text-white/40 text-xs">Quartier</span>
                                            <p className="text-white font-medium">{match.demand.propertyDetails.neighborhood}</p>
                                          </div>
                                        )}
                                        {match.demand.propertyDetails.surface && (
                                          <div>
                                            <span className="text-white/40 text-xs">Surface</span>
                                            <p className="text-white font-medium">{match.demand.propertyDetails.surface} m²</p>
                                          </div>
                                        )}
                                        {match.demand.propertyDetails.bedrooms && (
                                          <div>
                                            <span className="text-white/40 text-xs">Chambres</span>
                                            <p className="text-white font-medium">{match.demand.propertyDetails.bedrooms}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* RIGHT PANEL - MATCHED ENTITY */}
                            <div className="p-6 bg-white/[0.01]">
                              <div className="flex items-center gap-2 mb-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  match.matchedProperty ? 'bg-brand-gold/20' : 'bg-emerald-500/20'
                                }`}>
                                  {match.matchedProperty ? (
                                    <Building2 size={16} className="text-brand-gold" />
                                  ) : (
                                    <Users size={16} className="text-emerald-400" />
                                  )}
                                </div>
                                <h4 className={`text-sm font-semibold uppercase tracking-wide ${
                                  match.matchedProperty ? 'text-brand-gold' : 'text-emerald-400'
                                }`}>
                                  {match.matchedProperty ? 'Propriété Correspondante' : 'Vendeur / Propriétaire'}
                                </h4>
                              </div>

                              {/* Matched Property */}
                              {match.matchedProperty && (
                                <div className="space-y-4">
                                  <div className={`p-4 rounded-xl border ${
                                    match.matchedProperty.category === 'RENT'
                                      ? 'bg-emerald-500/5 border-emerald-500/20'
                                      : 'bg-brand-gold/5 border-brand-gold/20'
                                  }`}>
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <h5 className="text-lg font-bold text-white">{match.matchedProperty.name || 'Propriété'}</h5>
                                        <p className="text-sm text-white/50">{match.matchedProperty.location || match.matchedProperty.city}</p>
                                      </div>
                                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                                        match.matchedProperty.category === 'RENT'
                                          ? 'bg-emerald-500/20 text-emerald-400'
                                          : 'bg-brand-gold/20 text-brand-gold'
                                      }`}>
                                        {match.matchedProperty.category === 'RENT' ? 'LOCATION' : 'VENTE'}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <span className="text-white/40 text-xs">Prix</span>
                                        <p className="text-xl font-bold text-white">
                                          {match.matchedProperty.price || formatPrice(match.matchedProperty.priceNumeric)}
                                        </p>
                                      </div>
                                      {match.matchedProperty.city && (
                                        <div>
                                          <span className="text-white/40 text-xs">Ville</span>
                                          <p className="text-white font-medium">{match.matchedProperty.city}</p>
                                        </div>
                                      )}
                                      {match.matchedProperty.type && (
                                        <div>
                                          <span className="text-white/40 text-xs">Type</span>
                                          <p className="text-white font-medium capitalize">{match.matchedProperty.type}</p>
                                        </div>
                                      )}
                                      {match.matchedProperty.beds && (
                                        <div>
                                          <span className="text-white/40 text-xs">Chambres</span>
                                          <p className="text-white font-medium">{match.matchedProperty.beds} chambres</p>
                                        </div>
                                      )}
                                      {match.matchedProperty.baths && (
                                        <div>
                                          <span className="text-white/40 text-xs">Salles de bain</span>
                                          <p className="text-white font-medium">{match.matchedProperty.baths} SdB</p>
                                        </div>
                                      )}
                                      {match.matchedProperty.surface && (
                                        <div>
                                          <span className="text-white/40 text-xs">Surface</span>
                                          <p className="text-white font-medium">{match.matchedProperty.surface} m²</p>
                                        </div>
                                      )}
                                    </div>

                                    {match.matchedProperty.amenities && match.matchedProperty.amenities.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                        <span className="text-white/40 text-xs">Équipements</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {match.matchedProperty.amenities.slice(0, 6).map((a, i) => (
                                            <span key={i} className="px-2 py-0.5 text-[10px] bg-brand-gold/10 text-brand-gold rounded">{a}</span>
                                          ))}
                                          {match.matchedProperty.amenities.length > 6 && (
                                            <span className="px-2 py-0.5 text-[10px] bg-white/10 text-white/50 rounded">
                                              +{match.matchedProperty.amenities.length - 6}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Matched Demand (Seller) */}
                              {match.matchedDemand && (
                                <div className="space-y-4">
                                  {/* Seller Contact */}
                                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                    <h5 className="text-lg font-bold text-white mb-3">
                                      {match.matchedDemand.firstName} {match.matchedDemand.lastName}
                                    </h5>
                                    <div className="grid grid-cols-1 gap-2">
                                      {match.matchedDemand.phone && (
                                        <a href={`tel:${match.matchedDemand.phone}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                                          <Phone size={14} className="text-emerald-400" />
                                          <span className="font-medium">{match.matchedDemand.phone}</span>
                                        </a>
                                      )}
                                      {match.matchedDemand.email && (
                                        <a href={`mailto:${match.matchedDemand.email}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                                          <Mail size={14} className="text-emerald-400" />
                                          <span>{match.matchedDemand.email}</span>
                                        </a>
                                      )}
                                      {match.matchedDemand.whatsapp && (
                                        <a href={`https://wa.me/${match.matchedDemand.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/70 hover:text-green-400 transition-colors">
                                          <MessageSquare size={14} className="text-green-400" />
                                          <span>WhatsApp: {match.matchedDemand.whatsapp}</span>
                                        </a>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 rounded">
                                        {match.matchedDemand.type === 'property_sale' ? 'VENDEUR' : 'PROPRIÉTAIRE'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Seller's Property */}
                                  {match.matchedDemand.propertyDetails && (
                                    <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                                      <h6 className="text-xs font-semibold text-white/50 uppercase mb-3">Bien Proposé</h6>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-white/40 text-xs">Type</span>
                                          <p className="text-white font-medium capitalize">{match.matchedDemand.propertyDetails.propertyType}</p>
                                        </div>
                                        <div>
                                          <span className="text-white/40 text-xs">Prix</span>
                                          <p className="text-xl font-bold text-white">{formatPrice(match.matchedDemand.propertyDetails.price)}</p>
                                        </div>
                                        <div>
                                          <span className="text-white/40 text-xs">Ville</span>
                                          <p className="text-white font-medium">{match.matchedDemand.propertyDetails.city}</p>
                                        </div>
                                        {match.matchedDemand.propertyDetails.neighborhood && (
                                          <div>
                                            <span className="text-white/40 text-xs">Quartier</span>
                                            <p className="text-white font-medium">{match.matchedDemand.propertyDetails.neighborhood}</p>
                                          </div>
                                        )}
                                        {match.matchedDemand.propertyDetails.surface && (
                                          <div>
                                            <span className="text-white/40 text-xs">Surface</span>
                                            <p className="text-white font-medium">{match.matchedDemand.propertyDetails.surface} m²</p>
                                          </div>
                                        )}
                                        {match.matchedDemand.propertyDetails.bedrooms && (
                                          <div>
                                            <span className="text-white/40 text-xs">Chambres</span>
                                            <p className="text-white font-medium">{match.matchedDemand.propertyDetails.bedrooms}</p>
                                          </div>
                                        )}
                                        {match.matchedDemand.propertyDetails.bathrooms && (
                                          <div>
                                            <span className="text-white/40 text-xs">SdB</span>
                                            <p className="text-white font-medium">{match.matchedDemand.propertyDetails.bathrooms}</p>
                                          </div>
                                        )}
                                      </div>
                                      {match.matchedDemand.propertyDetails.description && (
                                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                          <span className="text-white/40 text-xs">Description</span>
                                          <p className="text-white/70 text-sm mt-1 line-clamp-2">{match.matchedDemand.propertyDetails.description}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Match Reasons */}
                          <div className="px-6 py-3 bg-purple-500/5 border-t border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={14} className="text-purple-400" />
                              <span className="text-xs font-semibold text-purple-400 uppercase">Raisons du Match</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {match.matchReasons.map((reason, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 text-xs bg-purple-500/10 text-purple-300 rounded-lg border border-purple-500/20"
                                >
                                  ✓ {reason}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
                            <div className="flex items-center gap-3">
                              {/* Quick Contact Actions */}
                              {match.demand?.phone && (
                                <a
                                  href={`tel:${match.demand.phone}`}
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all text-sm"
                                >
                                  <Phone size={14} />
                                  Appeler
                                </a>
                              )}
                              {match.demand?.whatsapp && (
                                <a
                                  href={`https://wa.me/${match.demand.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all text-sm"
                                >
                                  <MessageSquare size={14} />
                                  WhatsApp
                                </a>
                              )}
                              {match.demand?.email && (
                                <a
                                  href={`mailto:${match.demand.email}`}
                                  className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all text-sm"
                                >
                                  <Mail size={14} />
                                  Email
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status Actions */}
                              {match.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateMatchStatusHandler(match.id, 'notified')}
                                    className="px-4 py-2 text-sm bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all font-medium"
                                  >
                                    ✉ Notifier
                                  </button>
                                  <button
                                    onClick={() => updateMatchStatusHandler(match.id, 'contacted')}
                                    className="px-4 py-2 text-sm bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all font-medium"
                                  >
                                    📞 Contacté
                                  </button>
                                </>
                              )}
                              {(match.status === 'notified' || match.status === 'contacted') && (
                                <>
                                  <button
                                    onClick={() => updateMatchStatusHandler(match.id, 'successful')}
                                    className="px-4 py-2 text-sm bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all font-medium"
                                  >
                                    ✓ Réussi
                                  </button>
                                  <button
                                    onClick={() => updateMatchStatusHandler(match.id, 'rejected')}
                                    className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all font-medium"
                                  >
                                    ✗ Rejeté
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  CRM.deleteMatch(match.id);
                                  refreshMatches();
                                }}
                                className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Supprimer ce match"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {currentView === 'properties' && (
              <div className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[300px] relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher une propriété..."
                      className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {['ALL', 'SALE', 'RENT'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filterCategory === cat
                            ? 'bg-brand-gold text-black'
                            : 'bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {cat === 'ALL' ? 'Tous' : cat === 'SALE' ? 'Vente' : 'Location'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => exportToCSV(filteredProperties, 'nourreska_properties')}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
                  >
                    <Download size={18} />
                    Export
                  </button>

                  <button
                    onClick={() => {
                      setSelectedProperty(null);
                      setPropertyModalMode('add');
                      setShowPropertyModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-brand-gold/25 transition-all"
                  >
                    <Plus size={18} />
                    Ajouter
                  </button>
                </div>

                {/* Properties Table */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Propriété</th>
                          <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Type</th>
                          <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Localisation</th>
                          <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Prix</th>
                          <th className="text-left p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Catégorie</th>
                          <th className="text-right p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {isLoading ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center">
                              <RefreshCw size={24} className="animate-spin text-brand-gold mx-auto" />
                            </td>
                          </tr>
                        ) : filteredProperties.slice((propertyPage - 1) * 20, propertyPage * 20).map((property) => (
                          <tr key={property.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={property.image}
                                  alt=""
                                  className="w-12 h-12 rounded-lg object-cover bg-white/5"
                                />
                                <div className="max-w-[200px]">
                                  <p className="text-sm font-medium text-white truncate">{property.name}</p>
                                  <p className="text-xs text-white/40">{property.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-white/70">{property.type}</td>
                            <td className="p-4 text-sm text-white/70">{property.location}</td>
                            <td className="p-4 text-sm font-semibold text-brand-gold">{property.price}</td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                                property.category === 'RENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {property.category === 'RENT' ? 'Location' : 'Vente'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setPropertyModalMode('view');
                                    setShowPropertyModal(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                                  title="Voir"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setPropertyModalMode('edit');
                                    setShowPropertyModal(true);
                                  }}
                                  className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                                  title="Modifier"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  onClick={() => setDeletePropertyId(property.id)}
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
                  {(() => {
                    const ITEMS_PER_PAGE = 20;
                    const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
                    const startIndex = (propertyPage - 1) * ITEMS_PER_PAGE;
                    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredProperties.length);

                    return (
                      <div className="p-4 border-t border-white/[0.06] flex items-center justify-between">
                        <p className="text-sm text-white/40">
                          Affichage de {startIndex + 1}-{endIndex} sur {filteredProperties.length} propriétés
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPropertyPage(p => Math.max(1, p - 1))}
                            disabled={propertyPage === 1}
                            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (propertyPage <= 3) {
                              pageNum = i + 1;
                            } else if (propertyPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = propertyPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setPropertyPage(pageNum)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                  propertyPage === pageNum
                                    ? 'bg-brand-gold/20 text-brand-gold'
                                    : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setPropertyPage(p => Math.min(totalPages, p + 1))}
                            disabled={propertyPage === totalPages}
                            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Property View/Edit Modal */}
                <AnimatePresence>
                  {showPropertyModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                      onClick={() => setShowPropertyModal(false)}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl bg-[#0f0f15] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                      >
                        {/* Header */}
                        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center">
                              {propertyModalMode === 'add' ? <Plus size={20} className="text-black" /> : <Building2 size={20} className="text-black" />}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {propertyModalMode === 'add' ? 'Nouvelle Propriété' : propertyModalMode === 'edit' ? 'Modifier la Propriété' : 'Détails de la Propriété'}
                              </h3>
                              {selectedProperty && (
                                <p className="text-xs text-white/50">ID: {selectedProperty.id}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {propertyModalMode === 'view' && (
                              <button
                                onClick={() => setPropertyModalMode('edit')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                              >
                                <Edit3 size={16} />
                                Modifier
                              </button>
                            )}
                            <button
                              onClick={() => setShowPropertyModal(false)}
                              className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto">
                          {propertyModalMode === 'view' && selectedProperty ? (
                            <div className="space-y-6">
                              {/* Image */}
                              <div className="aspect-video rounded-xl overflow-hidden bg-white/5">
                                <img
                                  src={selectedProperty.image}
                                  alt={selectedProperty.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                  <p className="text-xs text-white/40 mb-1">Nom</p>
                                  <p className="text-sm text-white font-medium">{selectedProperty.name}</p>
                                </div>
                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                  <p className="text-xs text-white/40 mb-1">Type</p>
                                  <p className="text-sm text-white">{selectedProperty.type}</p>
                                </div>
                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                  <p className="text-xs text-white/40 mb-1">Prix</p>
                                  <p className="text-sm text-brand-gold font-semibold">{selectedProperty.price}</p>
                                </div>
                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                  <p className="text-xs text-white/40 mb-1">Catégorie</p>
                                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                    selectedProperty.category === 'RENT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                                  }`}>
                                    {selectedProperty.category === 'RENT' ? 'Location' : 'Vente'}
                                  </span>
                                </div>
                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                  <p className="text-xs text-white/40 mb-1">Localisation</p>
                                  <p className="text-sm text-white">{selectedProperty.location}</p>
                                </div>
                                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                  <p className="text-xs text-white/40 mb-1">Ville</p>
                                  <p className="text-sm text-white">{selectedProperty.city}</p>
                                </div>
                                {selectedProperty.beds && (
                                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                    <p className="text-xs text-white/40 mb-1">Chambres</p>
                                    <p className="text-sm text-white">{selectedProperty.beds}</p>
                                  </div>
                                )}
                                {selectedProperty.areaNumeric && (
                                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                    <p className="text-xs text-white/40 mb-1">Surface</p>
                                    <p className="text-sm text-white">{selectedProperty.areaNumeric} m²</p>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              {selectedProperty.url && (
                                <a
                                  href={selectedProperty.url}
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
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                // For now, just close the modal (API would handle actual save)
                                console.log('[Properties] Save property:', selectedProperty || 'new property');
                                setShowPropertyModal(false);
                              }}
                              className="space-y-4"
                            >
                              <p className="text-sm text-white/50 mb-4">
                                {propertyModalMode === 'add'
                                  ? 'Cette fonctionnalité sera connectée à l\'API pour créer de nouvelles propriétés.'
                                  : 'Cette fonctionnalité sera connectée à l\'API pour modifier les propriétés existantes.'
                                }
                              </p>

                              {selectedProperty && (
                                <>
                                  <div>
                                    <label className="block text-xs text-white/50 mb-1.5">Nom de la propriété</label>
                                    <input
                                      type="text"
                                      defaultValue={selectedProperty.name}
                                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs text-white/50 mb-1.5">Type</label>
                                      <input
                                        type="text"
                                        defaultValue={selectedProperty.type}
                                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-white/50 mb-1.5">Catégorie</label>
                                      <select
                                        defaultValue={selectedProperty.category}
                                        className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-brand-gold/50 outline-none transition-all"
                                      >
                                        <option value="SALE">Vente</option>
                                        <option value="RENT">Location</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/50 mb-1.5">Prix</label>
                                    <input
                                      type="text"
                                      defaultValue={selectedProperty.price}
                                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-white/50 mb-1.5">Localisation</label>
                                    <input
                                      type="text"
                                      defaultValue={selectedProperty.location}
                                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                                    />
                                  </div>
                                </>
                              )}

                              {propertyModalMode === 'add' && (
                                <div className="text-center py-8 text-white/40">
                                  <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                                  <p>Formulaire d'ajout de propriété</p>
                                  <p className="text-xs mt-2">Sera connecté à l'API de gestion des biens</p>
                                </div>
                              )}

                              <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                                <button
                                  type="button"
                                  onClick={() => setShowPropertyModal(false)}
                                  className="flex-1 py-3 rounded-lg text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all"
                                >
                                  Annuler
                                </button>
                                <button
                                  type="submit"
                                  className="flex-1 py-3 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-brand-gold/25 transition-all flex items-center justify-center gap-2"
                                >
                                  <Save size={18} />
                                  Enregistrer
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                  {deletePropertyId && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                      onClick={() => setDeletePropertyId(null)}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-[#0f0f15] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <Trash2 size={32} className="text-red-400" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">Supprimer la propriété ?</h3>
                          <p className="text-sm text-white/50 mb-6">
                            Cette action est irréversible. La propriété sera définitivement supprimée de la base de données.
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setDeletePropertyId(null)}
                              className="flex-1 py-3 rounded-lg text-white/60 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={() => {
                                console.log('[Properties] Delete property:', deletePropertyId);
                                // Would call API to delete
                                setDeletePropertyId(null);
                              }}
                              className="flex-1 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                            >
                              <Trash2 size={18} />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {currentView === 'analytics' && (
              <AnalyticsDashboard leads={leads} crmStats={crmStats} />
            )}

            {currentView === 'users' && (
              <UsersManagement leads={leads} refreshCRM={refreshCRM} />
            )}

            {currentView === 'settings' && (
              <div className="space-y-6">
                {/* Settings Header */}
                <div>
                  <h2 className="text-2xl font-bold text-white">Parametres</h2>
                  <p className="text-white/50 text-sm">Configurez votre espace admin Vestate AI</p>
                </div>

                <div className="flex gap-6">
                  {/* Settings Sidebar */}
                  <div className="w-64 flex-shrink-0">
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2 space-y-1">
                      {[
                        { id: 'profile', label: 'Profil', icon: Users },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                        { id: 'crm', label: 'CRM', icon: Target },
                        { id: 'theme', label: 'Apparence', icon: darkMode ? Moon : Sun },
                        { id: 'about', label: 'A propos', icon: AlertCircle },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setSettingsTab(tab.id as any)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                            settingsTab === tab.id
                              ? 'bg-brand-gold/20 text-brand-gold'
                              : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                          }`}
                        >
                          <tab.icon size={18} />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settings Content */}
                  <div className="flex-1">
                    {/* Profile Settings */}
                    {settingsTab === 'profile' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Profil Utilisateur</h3>
                          <p className="text-sm text-white/50">Gerez vos informations personnelles</p>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-gold to-cyan-400 flex items-center justify-center text-black font-bold text-xl">
                            {profileSettings.displayName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{profileSettings.displayName}</p>
                            <p className="text-sm text-white/50">{user.role === 'admin' ? 'Administrateur' : 'Agent'}</p>
                            {user.lastLogin && (
                              <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                                <Clock size={12} />
                                Derniere connexion: {new Date(user.lastLogin).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                              Nom affiche
                            </label>
                            <input
                              type="text"
                              value={profileSettings.displayName}
                              onChange={(e) => setProfileSettings({ ...profileSettings, displayName: e.target.value })}
                              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                              Email affiche
                            </label>
                            <input
                              type="email"
                              value={profileSettings.displayEmail}
                              onChange={(e) => setProfileSettings({ ...profileSettings, displayEmail: e.target.value })}
                              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-brand-gold/25 transition-all">
                            <Save size={18} />
                            Enregistrer
                          </button>
                          <button
                            onClick={() => setShowPasswordChange(!showPasswordChange)}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all"
                          >
                            <Lock size={18} />
                            Changer le mot de passe
                          </button>
                        </div>

                        {/* Password Change Form */}
                        <AnimatePresence>
                          {showPasswordChange && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06] space-y-4">
                                <h4 className="text-sm font-semibold text-white">Modifier votre mot de passe</h4>
                                <div>
                                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                    Mot de passe actuel
                                  </label>
                                  <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    placeholder="Entrez votre mot de passe actuel"
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                    Nouveau mot de passe
                                  </label>
                                  <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    placeholder="Entrez votre nouveau mot de passe"
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                    Confirmer le nouveau mot de passe
                                  </label>
                                  <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    placeholder="Confirmez votre nouveau mot de passe"
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
                                  />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                  <button
                                    onClick={() => {
                                      // UI only - would connect to API in production
                                      alert('Fonctionnalite bientot disponible');
                                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                      setShowPasswordChange(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-black font-medium rounded-lg hover:bg-brand-gold/90 transition-all"
                                  >
                                    <Check size={16} />
                                    Confirmer
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                      setShowPasswordChange(false);
                                    }}
                                    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {/* Notification Settings */}
                    {settingsTab === 'notifications' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Preferences de Notification</h3>
                          <p className="text-sm text-white/50">Configurez comment vous recevez les alertes</p>
                        </div>

                        <div className="space-y-4">
                          {[
                            { key: 'emailNewLead', label: 'Email - Nouveau lead', desc: 'Recevoir un email pour chaque nouveau lead' },
                            { key: 'emailLeadStatusChange', label: 'Email - Changement de statut', desc: 'Recevoir un email quand un lead change de statut' },
                            { key: 'pushNewLead', label: 'Push - Nouveau lead', desc: 'Notification push pour les nouveaux leads' },
                            { key: 'pushReminders', label: 'Push - Rappels', desc: 'Rappels de suivi des leads' },
                            { key: 'weeklyDigest', label: 'Digest hebdomadaire', desc: 'Resume de la semaine par email' },
                          ].map((setting) => (
                            <div
                              key={setting.key}
                              className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]"
                            >
                              <div>
                                <p className="font-medium text-white">{setting.label}</p>
                                <p className="text-xs text-white/50">{setting.desc}</p>
                              </div>
                              <button
                                onClick={() => setNotificationSettings({
                                  ...notificationSettings,
                                  [setting.key]: !notificationSettings[setting.key as keyof typeof notificationSettings]
                                })}
                                className={`relative w-12 h-6 rounded-full transition-all ${
                                  notificationSettings[setting.key as keyof typeof notificationSettings]
                                    ? 'bg-brand-gold'
                                    : 'bg-white/20'
                                }`}
                              >
                                <div
                                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                                    notificationSettings[setting.key as keyof typeof notificationSettings]
                                      ? 'left-7'
                                      : 'left-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* CRM Settings */}
                    {settingsTab === 'crm' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Parametres CRM</h3>
                          <p className="text-sm text-white/50">Configurez le comportement du CRM</p>
                        </div>

                        <div className="space-y-4">
                          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                            <label className="block text-sm font-medium text-white mb-2">
                              Attribution des leads par defaut
                            </label>
                            <select
                              value={crmSettings.defaultAssignment}
                              onChange={(e) => setCrmSettings({ ...crmSettings, defaultAssignment: e.target.value })}
                              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none"
                            >
                              <option value="auto">Automatique (round-robin)</option>
                              <option value="manual">Manuel</option>
                              <option value="admin">Toujours a l'admin</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                            <div>
                              <p className="font-medium text-white">Scoring automatique</p>
                              <p className="text-xs text-white/50">Calculer automatiquement le score des leads</p>
                            </div>
                            <button
                              onClick={() => setCrmSettings({ ...crmSettings, autoScoring: !crmSettings.autoScoring })}
                              className={`relative w-12 h-6 rounded-full transition-all ${
                                crmSettings.autoScoring ? 'bg-brand-gold' : 'bg-white/20'
                              }`}
                            >
                              <div
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                                  crmSettings.autoScoring ? 'left-7' : 'left-1'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                            <div>
                              <p className="font-medium text-white">Relance automatique</p>
                              <p className="text-xs text-white/50">Creer des rappels de relance automatiquement</p>
                            </div>
                            <button
                              onClick={() => setCrmSettings({ ...crmSettings, autoFollowUp: !crmSettings.autoFollowUp })}
                              className={`relative w-12 h-6 rounded-full transition-all ${
                                crmSettings.autoFollowUp ? 'bg-brand-gold' : 'bg-white/20'
                              }`}
                            >
                              <div
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                                  crmSettings.autoFollowUp ? 'left-7' : 'left-1'
                                }`}
                              />
                            </button>
                          </div>

                          {crmSettings.autoFollowUp && (
                            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                              <label className="block text-sm font-medium text-white mb-2">
                                Delai de relance (jours)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={crmSettings.followUpDays}
                                onChange={(e) => setCrmSettings({ ...crmSettings, followUpDays: parseInt(e.target.value) || 3 })}
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Theme Settings */}
                    {settingsTab === 'theme' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Apparence</h3>
                          <p className="text-sm text-white/50">Personnalisez l'interface</p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                            <div className="flex items-center gap-4">
                              {darkMode ? (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center">
                                  <Moon size={24} className="text-white" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                  <Sun size={24} className="text-white" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-white">Mode sombre</p>
                                <p className="text-xs text-white/50">{darkMode ? 'Active' : 'Desactive'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setDarkMode(!darkMode);
                                document.documentElement.classList.toggle('light-mode', darkMode);
                              }}
                              className={`relative w-12 h-6 rounded-full transition-all ${
                                darkMode ? 'bg-brand-gold' : 'bg-white/20'
                              }`}
                            >
                              <div
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                                  darkMode ? 'left-7' : 'left-1'
                                }`}
                              />
                            </button>
                          </div>

                          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                            <p className="text-sm text-white/60">
                              Le mode sombre est recommande pour reduire la fatigue oculaire lors d'une utilisation prolongee.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* About Section */}
                    {settingsTab === 'about' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">A propos</h3>
                          <p className="text-sm text-white/50">Informations sur l'application</p>
                        </div>

                        <div className="flex items-center gap-4 p-6 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                          <div>
                            <h4 className="text-2xl font-tt-commons font-bold tracking-tight">
                              <span className="text-white">Vestate</span>
                              <span className="text-white/60 ml-1">AI</span>
                            </h4>
                            <p className="text-sm text-white/50 mt-1">Admin Portal</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {[
                            { label: 'Version', value: '2.0.0' },
                            { label: 'Build', value: '2024.02.13' },
                            { label: 'Environment', value: 'Production' },
                            { label: 'API Status', value: 'Online' },
                          ].map((info) => (
                            <div
                              key={info.label}
                              className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]"
                            >
                              <span className="text-sm text-white/60">{info.label}</span>
                              <span className="text-sm font-medium text-white">{info.value}</span>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                          <p className="text-sm text-white/50 text-center font-tt-commons">
                            Powered by <span className="font-bold text-white">Vestate</span> <span className="text-white/40">AI</span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.06] z-40 flex items-center justify-around px-2 safe-area-inset-bottom">
            {bottomNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as AdminView);
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all ${
                  currentView === item.id
                    ? 'text-brand-gold'
                    : 'text-white/50'
                }`}
              >
                <div className="relative">
                  <item.icon size={22} />
                  {item.badge && crmStats && crmStats.newLeadsToday > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-gold text-black text-[8px] font-bold rounded-full flex items-center justify-center">
                      {crmStats.newLeadsToday > 9 ? '9+' : crmStats.newLeadsToday}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
            {/* More button for settings */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all ${
                currentView === 'settings'
                  ? 'text-brand-gold'
                  : 'text-white/50'
              }`}
            >
              <MoreVertical size={22} />
              <span className="text-[10px] font-medium">Plus</span>
            </button>
          </nav>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#1a1a24] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                  <LogOut size={24} className="text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Confirmer la deconnexion</h3>
                <p className="text-sm text-white/50">
                  Etes-vous sur de vouloir vous deconnecter ? Votre session sera terminee.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogout();
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Se deconnecter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

AdminDashboard.displayName = 'AdminDashboard';

// ============================================================================
// ADD DEMAND FORM COMPONENT
// ============================================================================

interface AddDemandFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddDemandForm: React.FC<AddDemandFormProps> = memo(({ onClose, onSuccess }) => {
  const [demandType, setDemandType] = useState<CRM.DemandType>('property_search');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    urgency: 'medium' as CRM.DemandUrgency,
    source: 'manual' as CRM.DemandSource,
    notes: '',
    // Search criteria
    transactionType: 'SALE' as 'RENT' | 'SALE',
    propertyTypes: [] as CRM.PropertyType[],
    cities: '',
    budgetMin: '',
    budgetMax: '',
    bedroomsMin: '',
    surfaceMin: '',
    amenities: '',
    // Property details for sellers
    sellerPropertyType: 'apartment' as CRM.PropertyType,
    sellerCity: '',
    sellerPrice: '',
    sellerSurface: '',
    sellerBedrooms: '',
    sellerAmenities: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePropertyTypeToggle = (type: CRM.PropertyType) => {
    setFormData(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim()) {
      setError('Le prénom est requis');
      return;
    }

    if (!formData.email && !formData.phone) {
      setError('Email ou téléphone requis');
      return;
    }

    setIsSubmitting(true);

    try {
      const demandData: Parameters<typeof CRM.createDemand>[0] = {
        type: demandType,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        urgency: formData.urgency,
        source: formData.source,
        notes: formData.notes.trim() || undefined,
      };

      // Build search criteria for property seekers
      if (demandType === 'property_search') {
        demandData.searchCriteria = {
          transactionType: formData.transactionType,
          propertyType: formData.propertyTypes.length > 0 ? formData.propertyTypes : undefined,
          cities: formData.cities ? formData.cities.split(',').map(c => c.trim()) : undefined,
          budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : undefined,
          budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : undefined,
          bedroomsMin: formData.bedroomsMin ? parseInt(formData.bedroomsMin) : undefined,
          surfaceMin: formData.surfaceMin ? parseInt(formData.surfaceMin) : undefined,
          amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : undefined,
        };
      }

      // Build property details for sellers
      if (demandType === 'property_sale' || demandType === 'property_rental_management') {
        demandData.propertyDetails = {
          propertyType: formData.sellerPropertyType,
          transactionType: demandType === 'property_sale' ? 'SALE' : 'MANAGEMENT',
          city: formData.sellerCity.trim() || 'Non spécifié',
          price: formData.sellerPrice ? parseInt(formData.sellerPrice) : undefined,
          surface: formData.sellerSurface ? parseInt(formData.sellerSurface) : undefined,
          bedrooms: formData.sellerBedrooms ? parseInt(formData.sellerBedrooms) : undefined,
          amenities: formData.sellerAmenities ? formData.sellerAmenities.split(',').map(a => a.trim()) : undefined,
        };
      }

      CRM.createDemand(demandData);
      onSuccess();
    } catch (err) {
      setError('Erreur lors de la création de la demande');
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyTypeOptions: { value: CRM.PropertyType; label: string }[] = [
    { value: 'villa', label: 'Villa' },
    { value: 'apartment', label: 'Appartement' },
    { value: 'riad', label: 'Riad' },
    { value: 'land', label: 'Terrain' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'studio', label: 'Studio' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#12121a]">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus size={20} className="text-brand-gold" />
          Nouvelle Demande
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Demand Type */}
        <div>
          <label className="block text-xs text-white/50 mb-2">Type de demande</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'property_search', label: 'Recherche', icon: Search },
              { value: 'property_sale', label: 'Vente', icon: DollarSign },
              { value: 'property_rental_management', label: 'Gestion Locative', icon: Building2 },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDemandType(value as CRM.DemandType)}
                className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  demandType === value
                    ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-2">Prénom *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
              placeholder="Prénom"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2">Nom</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
              placeholder="Nom"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2">Téléphone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
              placeholder="+212 6XX XXX XXX"
            />
          </div>
        </div>

        {/* Urgency & Source */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-2">Urgence</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as CRM.DemandUrgency }))}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-brand-gold/50 outline-none"
            >
              <option value="low">Faible</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2">Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value as CRM.DemandSource }))}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-brand-gold/50 outline-none"
            >
              <option value="manual">Saisie manuelle</option>
              <option value="phone">Téléphone</option>
              <option value="email">Email</option>
              <option value="walk_in">Visite agence</option>
              <option value="referral">Référence</option>
            </select>
          </div>
        </div>

        {/* Search Criteria (for property_search) */}
        {demandType === 'property_search' && (
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-4">
            <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
              <Search size={16} />
              Critères de recherche
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-2">Transaction</label>
                <select
                  value={formData.transactionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionType: e.target.value as 'RENT' | 'SALE' }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-brand-gold/50 outline-none"
                >
                  <option value="SALE">Achat</option>
                  <option value="RENT">Location</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">Villes (séparées par virgule)</label>
                <input
                  type="text"
                  value={formData.cities}
                  onChange={(e) => setFormData(prev => ({ ...prev, cities: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  placeholder="Casablanca, Rabat"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-2">Types de bien</label>
              <div className="flex flex-wrap gap-2">
                {propertyTypeOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handlePropertyTypeToggle(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formData.propertyTypes.includes(option.value)
                        ? 'bg-brand-gold text-black'
                        : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-2">Budget Min (MAD)</label>
                <input
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">Budget Max (MAD)</label>
                <input
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  placeholder="5000000"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">Chambres min.</label>
                <input
                  type="number"
                  value={formData.bedroomsMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedroomsMin: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">Surface min. (m²)</label>
                <input
                  type="number"
                  value={formData.surfaceMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, surfaceMin: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-2">Équipements (séparés par virgule)</label>
              <input
                type="text"
                value={formData.amenities}
                onChange={(e) => setFormData(prev => ({ ...prev, amenities: e.target.value }))}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                placeholder="piscine, jardin, parking"
              />
            </div>
          </div>
        )}

        {/* Property Details (for sellers) */}
        {(demandType === 'property_sale' || demandType === 'property_rental_management') && (
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-4">
            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Building2 size={16} />
              Détails du bien à {demandType === 'property_sale' ? 'vendre' : 'gérer'}
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/50 mb-2">Type de bien</label>
                <select
                  value={formData.sellerPropertyType}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerPropertyType: e.target.value as CRM.PropertyType }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:border-brand-gold/50 outline-none"
                >
                  {propertyTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">Ville</label>
                <input
                  type="text"
                  value={formData.sellerCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerCity: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  placeholder="Casablanca"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">Prix souhaité (MAD)</label>
                <input
                  type="number"
                  value={formData.sellerPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerPrice: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  placeholder="3500000"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">Surface (m²)</label>
                <input
                  type="number"
                  value={formData.sellerSurface}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerSurface: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  placeholder="150"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">Nombre de chambres</label>
                <input
                  type="number"
                  value={formData.sellerBedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellerBedrooms: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/50 mb-2">Équipements (séparés par virgule)</label>
              <input
                type="text"
                value={formData.sellerAmenities}
                onChange={(e) => setFormData(prev => ({ ...prev, sellerAmenities: e.target.value }))}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                placeholder="piscine, jardin, parking"
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs text-white/50 mb-2">Notes additionnelles</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:border-brand-gold/50 outline-none resize-none"
            placeholder="Informations supplémentaires..."
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-brand-gold/25 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Création...
              </span>
            ) : (
              'Créer la demande'
            )}
          </button>
        </div>
      </form>
    </div>
  );
});

AddDemandForm.displayName = 'AddDemandForm';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminPortal: React.FC<AdminPortalProps> = ({ onClose }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleLogin = useCallback((loggedInUser: AdminUser, rememberMe: boolean) => {
    setUser(loggedInUser);
    setSessionExpired(false);

    // Create session with expiry
    const session: Session = {
      user: loggedInUser,
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
      token: generateToken(),
      rememberMe
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    clearAuthData(); // Clear API auth data
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      // First, check for API token
      const apiToken = getStoredToken();
      const apiUser = getStoredUser();
      if (apiToken && apiUser) {
        // Valid API session exists
        setUser({
          email: apiUser.email,
          name: apiUser.fullName,
          role: apiUser.role.toLowerCase() as 'admin' | 'agent',
          lastLogin: apiUser.lastLogin ? new Date(apiUser.lastLogin).getTime() : Date.now(),
        });
        return;
      }

      // Fallback to local session
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSession) {
        try {
          const session: Session = JSON.parse(storedSession);
          if (session.expiresAt > Date.now()) {
            setUser(session.user);
          } else {
            // Session expired
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setSessionExpired(true);
          }
        } catch {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    };
    checkSession();
  }, []);

  // Check session expiry periodically
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (storedSession) {
        try {
          const session: Session = JSON.parse(storedSession);
          if (session.expiresAt <= Date.now()) {
            setUser(null);
            setSessionExpired(true);
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        } catch {
          // Invalid session
          setUser(null);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Listen for auth:expired event from API layer (401 responses)
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setSessionExpired(true);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <AdminDashboard key="dashboard" user={user} onLogout={handleLogout} onClose={onClose} />
      ) : (
        <>
          {sessionExpired && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-6 py-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 text-sm flex items-center gap-2"
            >
              <Clock size={16} />
              Session expiree. Veuillez vous reconnecter.
            </motion.div>
          )}
          <AdminLogin key="login" onLogin={handleLogin} onClose={onClose} />
        </>
      )}
    </AnimatePresence>
  );
};

export default memo(AdminPortal);
