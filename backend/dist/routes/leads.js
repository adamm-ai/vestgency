"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Validation schema
const createLeadSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'Prénom requis'),
    lastName: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    source: zod_1.z.enum(['CHATBOT', 'WEBSITE_FORM', 'PHONE', 'EMAIL', 'WALK_IN', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER']).optional(),
    urgency: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    transactionType: zod_1.z.enum(['RENT', 'SALE']).optional(),
    budgetMin: zod_1.z.number().optional(),
    budgetMax: zod_1.z.number().optional(),
    assignedToId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.array(zod_1.z.any()).optional(),
    chatMessages: zod_1.z.array(zod_1.z.any()).optional(),
});
// Calculate lead score based on data completeness and urgency
const calculateScore = (lead) => {
    let score = 50; // Base score
    // Contact info
    if (lead.email)
        score += 10;
    if (lead.phone)
        score += 10;
    if (lead.city)
        score += 5;
    // Budget info
    if (lead.budgetMin || lead.budgetMax)
        score += 10;
    if (lead.transactionType)
        score += 5;
    // Urgency
    if (lead.urgency === 'CRITICAL')
        score += 15;
    else if (lead.urgency === 'HIGH')
        score += 10;
    else if (lead.urgency === 'MEDIUM')
        score += 5;
    // Source quality
    if (lead.source === 'REFERRAL')
        score += 10;
    else if (lead.source === 'WEBSITE_FORM' || lead.source === 'CHATBOT')
        score += 5;
    return Math.min(100, score);
};
// GET /api/leads - Get all leads
router.get('/', async (req, res) => {
    try {
        const { status, source, assignedTo } = req.query;
        // Build where clause
        const where = {};
        // Agents only see their assigned leads, admins see all
        if (req.user?.role !== 'ADMIN') {
            where.assignedToId = req.user?.id;
        }
        if (status)
            where.status = status;
        if (source)
            where.source = source;
        if (assignedTo)
            where.assignedToId = assignedTo;
        const leads = await index_1.prisma.lead.findMany({
            where,
            include: {
                assignedTo: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
                createdBy: {
                    select: { id: true, fullName: true },
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ leads });
    }
    catch (error) {
        console.error('[Leads] Get all error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET /api/leads/:id - Get lead by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await index_1.prisma.lead.findUnique({
            where: { id },
            include: {
                assignedTo: {
                    select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
                createdBy: {
                    select: { id: true, fullName: true },
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        createdBy: {
                            select: { id: true, fullName: true },
                        },
                    },
                },
            },
        });
        if (!lead) {
            return res.status(404).json({ error: 'Lead non trouvé' });
        }
        // Check access
        if (req.user?.role !== 'ADMIN' && lead.assignedToId !== req.user?.id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        res.json({ lead });
    }
    catch (error) {
        console.error('[Leads] Get by ID error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// POST /api/leads - Create lead
router.post('/', async (req, res) => {
    try {
        const data = createLeadSchema.parse(req.body);
        // Calculate score
        const score = calculateScore(data);
        // Auto-assign to creator if no assignment specified (for agents)
        let assignedToId = data.assignedToId;
        if (!assignedToId && req.user?.role === 'AGENT') {
            assignedToId = req.user.id;
        }
        const lead = await index_1.prisma.lead.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName || null,
                email: data.email || null,
                phone: data.phone || null,
                city: data.city || null,
                source: data.source || 'OTHER',
                urgency: data.urgency || 'MEDIUM',
                transactionType: data.transactionType || null,
                budgetMin: data.budgetMin ? BigInt(data.budgetMin) : null,
                budgetMax: data.budgetMax ? BigInt(data.budgetMax) : null,
                assignedToId,
                notes: data.notes || [],
                chatMessages: data.chatMessages || [],
                score,
                createdById: req.user?.id,
            },
            include: {
                assignedTo: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });
        // Create activity
        await index_1.prisma.leadActivity.create({
            data: {
                leadId: lead.id,
                type: 'lead_created',
                title: 'Lead créé',
                description: `Lead créé par ${req.user?.fullName}`,
                createdById: req.user?.id,
            },
        });
        // Create notification for assigned agent
        if (lead.assignedToId && lead.assignedToId !== req.user?.id) {
            await index_1.prisma.notification.create({
                data: {
                    userId: lead.assignedToId,
                    type: 'new_lead',
                    title: 'Nouveau lead assigné',
                    message: `${lead.firstName} ${lead.lastName || ''} vous a été assigné`,
                    leadId: lead.id,
                },
            });
        }
        res.status(201).json({ lead });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('[Leads] Create error:', error);
        res.status(500).json({ error: 'Erreur lors de la création' });
    }
});
// PUT /api/leads/:id - Update lead
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Get current lead
        const currentLead = await index_1.prisma.lead.findUnique({ where: { id } });
        if (!currentLead) {
            return res.status(404).json({ error: 'Lead non trouvé' });
        }
        // Check access
        if (req.user?.role !== 'ADMIN' && currentLead.assignedToId !== req.user?.id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        // Build update data
        const updateData = {};
        if (updates.firstName !== undefined)
            updateData.firstName = updates.firstName;
        if (updates.lastName !== undefined)
            updateData.lastName = updates.lastName;
        if (updates.email !== undefined)
            updateData.email = updates.email;
        if (updates.phone !== undefined)
            updateData.phone = updates.phone;
        if (updates.city !== undefined)
            updateData.city = updates.city;
        if (updates.status !== undefined)
            updateData.status = updates.status;
        if (updates.source !== undefined)
            updateData.source = updates.source;
        if (updates.urgency !== undefined)
            updateData.urgency = updates.urgency;
        if (updates.transactionType !== undefined)
            updateData.transactionType = updates.transactionType;
        if (updates.budgetMin !== undefined)
            updateData.budgetMin = updates.budgetMin ? BigInt(updates.budgetMin) : null;
        if (updates.budgetMax !== undefined)
            updateData.budgetMax = updates.budgetMax ? BigInt(updates.budgetMax) : null;
        if (updates.notes !== undefined)
            updateData.notes = updates.notes;
        if (updates.chatMessages !== undefined)
            updateData.chatMessages = updates.chatMessages;
        // Admin can reassign
        if (req.user?.role === 'ADMIN' && updates.assignedToId !== undefined) {
            updateData.assignedToId = updates.assignedToId;
        }
        // Recalculate score
        const mergedLead = { ...currentLead, ...updateData };
        updateData.score = calculateScore(mergedLead);
        const lead = await index_1.prisma.lead.update({
            where: { id },
            data: updateData,
            include: {
                assignedTo: {
                    select: { id: true, fullName: true, email: true },
                },
            },
        });
        // Track status change
        if (updates.status && updates.status !== currentLead.status) {
            await index_1.prisma.leadActivity.create({
                data: {
                    leadId: lead.id,
                    type: 'status_changed',
                    title: 'Statut modifié',
                    description: `${currentLead.status} → ${updates.status}`,
                    createdById: req.user?.id,
                },
            });
        }
        res.json({ lead });
    }
    catch (error) {
        console.error('[Leads] Update error:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});
// DELETE /api/leads/:id - Delete lead
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Only admins can delete
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Seuls les administrateurs peuvent supprimer des leads' });
        }
        await index_1.prisma.lead.delete({ where: { id } });
        res.json({ message: 'Lead supprimé' });
    }
    catch (error) {
        console.error('[Leads] Delete error:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});
// POST /api/leads/:id/activity - Add activity to lead
router.post('/:id/activity', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, title, description } = req.body;
        if (!type || !title) {
            return res.status(400).json({ error: 'Type et titre requis' });
        }
        const lead = await index_1.prisma.lead.findUnique({ where: { id } });
        if (!lead) {
            return res.status(404).json({ error: 'Lead non trouvé' });
        }
        const activity = await index_1.prisma.leadActivity.create({
            data: {
                leadId: id,
                type,
                title,
                description,
                createdById: req.user?.id,
            },
            include: {
                createdBy: {
                    select: { id: true, fullName: true },
                },
            },
        });
        res.status(201).json({ activity });
    }
    catch (error) {
        console.error('[Leads] Add activity error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=leads.js.map