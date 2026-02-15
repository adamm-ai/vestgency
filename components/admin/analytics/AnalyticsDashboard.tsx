/**
 * Analytics Dashboard Component
 * =============================
 * CRM analytics visualization for admin portal
 */

import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, Star, Calendar, BarChart3, Activity, Filter,
  Download, RefreshCw
} from 'lucide-react';
import * as CRM from '../../../services/crmService';
import { exportToCSV } from '../shared/utils';

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

  const handleExportReport = () => {
    if (!crmStats) return;
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
  };

  if (!crmStats) {
    return (
      <div className="flex items-center justify-center h-full" role="status" aria-label="Chargement">
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
          onClick={handleExportReport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 transition-all"
          aria-label="Exporter le rapport"
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
              <stat.icon size={18} className="text-white/40 mb-2" aria-hidden="true" />
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
            <BarChart3 size={20} className="text-brand-gold" aria-hidden="true" />
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
            <Activity size={20} className="text-cyan-400" aria-hidden="true" />
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
            <Filter size={20} className="text-purple-400" aria-hidden="true" />
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
            <TrendingUp size={20} className="text-green-400" aria-hidden="true" />
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

export default AnalyticsDashboard;
