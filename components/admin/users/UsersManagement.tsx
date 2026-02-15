/**
 * Users Management Component
 * ==========================
 * CRM agents management for admin portal
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, UserPlus, Edit3, Trash2, X, Save, Check, Target } from 'lucide-react';
import * as CRM from '../../../services/crmService';

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
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un agent..."
          className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none transition-all"
          aria-label="Rechercher un agent"
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
                        aria-label={agent.isActive ? 'Désactiver l\'agent' : 'Activer l\'agent'}
                      >
                        {agent.isActive ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(agent)}
                          className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                          aria-label="Modifier l'agent"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                          aria-label="Supprimer l'agent"
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="agent-modal-title"
            >
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <h3 id="agent-modal-title" className="text-lg font-bold text-white">
                  {editingAgent ? 'Modifier Agent' : 'Nouvel Agent'}
                </h3>
                <button
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white transition-colors"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Prenom</label>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Nom</label>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Telephone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:border-brand-gold/50 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="role" className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Role</label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'agent' })}
                      className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white focus:border-brand-gold/50 outline-none"
                    >
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="maxLeads" className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Max Leads</label>
                    <input
                      id="maxLeads"
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

export default UsersManagement;
