"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// GET /api/stats/crm - Get CRM statistics
router.get('/crm', async (req, res) => {
    try {
        const isAdmin = req.user?.role === 'ADMIN';
        const userId = req.user?.id;
        // Build where clause based on role
        const where = isAdmin ? {} : { assignedToId: userId };
        // Get all leads for the user
        const leads = await index_1.prisma.lead.findMany({
            where,
            select: {
                id: true,
                status: true,
                source: true,
                score: true,
                urgency: true,
                createdAt: true,
            },
        });
        // Calculate date ranges
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        // Calculate stats
        const totalLeads = leads.length;
        const newLeadsToday = leads.filter(l => new Date(l.createdAt) >= todayStart).length;
        const newLeadsWeek = leads.filter(l => new Date(l.createdAt) >= weekStart).length;
        const newLeadsMonth = leads.filter(l => new Date(l.createdAt) >= monthStart).length;
        const leadsWon = leads.filter(l => l.status === 'WON').length;
        const leadsLost = leads.filter(l => l.status === 'LOST').length;
        const conversionRate = totalLeads > 0 ? Math.round((leadsWon / totalLeads) * 100) : 0;
        const avgScore = totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / totalLeads) : 0;
        // Leads by status
        const leadsByStatus = {
            new: leads.filter(l => l.status === 'NEW').length,
            contacted: leads.filter(l => l.status === 'CONTACTED').length,
            qualified: leads.filter(l => l.status === 'QUALIFIED').length,
            visit_scheduled: leads.filter(l => l.status === 'VISIT_SCHEDULED').length,
            visit_completed: leads.filter(l => l.status === 'VISIT_COMPLETED').length,
            proposal_sent: leads.filter(l => l.status === 'PROPOSAL_SENT').length,
            negotiation: leads.filter(l => l.status === 'NEGOTIATION').length,
            won: leadsWon,
            lost: leadsLost,
        };
        // Leads by source
        const leadsBySource = {
            chatbot: leads.filter(l => l.source === 'CHATBOT').length,
            website_form: leads.filter(l => l.source === 'WEBSITE_FORM').length,
            phone: leads.filter(l => l.source === 'PHONE').length,
            email: leads.filter(l => l.source === 'EMAIL').length,
            referral: leads.filter(l => l.source === 'REFERRAL').length,
            social_media: leads.filter(l => l.source === 'SOCIAL_MEDIA').length,
            walk_in: leads.filter(l => l.source === 'WALK_IN').length,
            other: leads.filter(l => l.source === 'OTHER').length,
        };
        // Leads by urgency
        const leadsByUrgency = {
            low: leads.filter(l => l.urgency === 'LOW').length,
            medium: leads.filter(l => l.urgency === 'MEDIUM').length,
            high: leads.filter(l => l.urgency === 'HIGH').length,
            critical: leads.filter(l => l.urgency === 'CRITICAL').length,
        };
        res.json({
            totalLeads,
            newLeadsToday,
            newLeadsWeek,
            newLeadsMonth,
            leadsWon,
            leadsLost,
            conversionRate,
            avgScore,
            leadsByStatus,
            leadsBySource,
            leadsByUrgency,
        });
    }
    catch (error) {
        console.error('[Stats] CRM error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET /api/stats/dashboard - Get dashboard statistics (Admin only)
router.get('/dashboard', async (req, res) => {
    try {
        const isAdmin = req.user?.role === 'ADMIN';
        // Get counts
        const [totalLeads, totalProperties, totalUsers] = await Promise.all([
            isAdmin ? index_1.prisma.lead.count() : index_1.prisma.lead.count({ where: { assignedToId: req.user?.id } }),
            index_1.prisma.property.count({ where: { isActive: true } }),
            isAdmin ? index_1.prisma.user.count({ where: { isActive: true } }) : Promise.resolve(null),
        ]);
        // Recent activity
        const recentLeads = await index_1.prisma.lead.findMany({
            where: isAdmin ? undefined : { assignedToId: req.user?.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                status: true,
                createdAt: true,
            },
        });
        const recentActivities = await index_1.prisma.leadActivity.findMany({
            where: isAdmin ? undefined : { lead: { assignedToId: req.user?.id } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                lead: {
                    select: { firstName: true, lastName: true },
                },
                createdBy: {
                    select: { fullName: true },
                },
            },
        });
        res.json({
            totalLeads,
            totalProperties,
            totalUsers,
            recentLeads,
            recentActivities,
        });
    }
    catch (error) {
        console.error('[Stats] Dashboard error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET /api/stats/agents - Get agent performance (Admin only)
router.get('/agents', async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
        }
        const agents = await index_1.prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                _count: {
                    select: {
                        assignedLeads: true,
                    },
                },
                assignedLeads: {
                    select: {
                        status: true,
                        score: true,
                    },
                },
            },
        });
        const agentStats = agents.map(agent => {
            const leads = agent.assignedLeads;
            const totalLeads = leads.length;
            const leadsWon = leads.filter(l => l.status === 'WON').length;
            const leadsLost = leads.filter(l => l.status === 'LOST').length;
            const avgScore = totalLeads > 0
                ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / totalLeads)
                : 0;
            return {
                id: agent.id,
                fullName: agent.fullName,
                email: agent.email,
                avatarUrl: agent.avatarUrl,
                totalLeads,
                leadsWon,
                leadsLost,
                conversionRate: totalLeads > 0 ? Math.round((leadsWon / totalLeads) * 100) : 0,
                avgScore,
            };
        });
        res.json({ agents: agentStats });
    }
    catch (error) {
        console.error('[Stats] Agents error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=stats.js.map