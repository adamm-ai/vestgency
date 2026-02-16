"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// GET /api/users - Get all users (Admin only)
router.get('/', auth_1.requireAdmin, async (req, res) => {
    try {
        const users = await index_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                _count: {
                    select: {
                        assignedLeads: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Transform to include lead count
        const transformedUsers = users.map(user => ({
            ...user,
            leadsCount: user._count.assignedLeads,
            _count: undefined,
        }));
        res.json({ users: transformedUsers });
    }
    catch (error) {
        console.error('[Users] Get all error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET /api/users/agents - Get only agents (for assignment dropdown)
router.get('/agents', async (req, res) => {
    try {
        const agents = await index_1.prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                avatarUrl: true,
            },
            orderBy: { fullName: 'asc' },
        });
        res.json({ agents });
    }
    catch (error) {
        console.error('[Users] Get agents error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Agents can only view themselves, admins can view anyone
        if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                _count: {
                    select: {
                        assignedLeads: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json({
            user: {
                ...user,
                leadsCount: user._count.assignedLeads,
                _count: undefined,
            },
        });
    }
    catch (error) {
        console.error('[Users] Get by ID error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, phone, avatarUrl, role, isActive, password } = req.body;
        // Agents can only update themselves (limited fields), admins can update anyone
        const isAdmin = req.user?.role === 'ADMIN';
        const isSelf = req.user?.id === id;
        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        // Build update data
        const updateData = {};
        // Fields anyone can update on themselves
        if (fullName)
            updateData.fullName = fullName;
        if (phone !== undefined)
            updateData.phone = phone;
        if (avatarUrl !== undefined)
            updateData.avatarUrl = avatarUrl;
        // Admin-only fields
        if (isAdmin) {
            if (role)
                updateData.role = role;
            if (isActive !== undefined)
                updateData.isActive = isActive;
        }
        // Password change
        if (password && password.length >= 6) {
            updateData.password = await bcryptjs_1.default.hash(password, 12);
        }
        const user = await index_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                phone: true,
                avatarUrl: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
            },
        });
        res.json({ user });
    }
    catch (error) {
        console.error('[Users] Update error:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});
// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Can't delete yourself
        if (req.user?.id === id) {
            return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
        }
        // Check if user exists
        const user = await index_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        // Unassign all leads from this user
        await index_1.prisma.lead.updateMany({
            where: { assignedToId: id },
            data: { assignedToId: null },
        });
        // Delete user
        await index_1.prisma.user.delete({ where: { id } });
        res.json({ message: 'Utilisateur supprimé' });
    }
    catch (error) {
        console.error('[Users] Delete error:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map