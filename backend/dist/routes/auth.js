"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Validation schemas
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(1, 'Mot de passe requis'),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(6, 'Mot de passe doit avoir au moins 6 caractères'),
    fullName: zod_1.z.string().min(2, 'Nom complet requis'),
    role: zod_1.z.enum(['ADMIN', 'AGENT']).optional(),
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await index_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        if (!user.isActive) {
            return res.status(401).json({ error: 'Compte désactivé. Contactez l\'administrateur.' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        // Update last login
        await index_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const token = (0, auth_1.generateToken)(user.id);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                lastLogin: user.lastLogin,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('[Auth] Login error:', error);
        res.status(500).json({ error: 'Erreur de connexion' });
    }
});
// POST /api/auth/register (Admin only - create new agent)
router.post('/register', auth_1.authenticate, async (req, res) => {
    try {
        // Only admins can create new users
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Seul un administrateur peut créer des comptes' });
        }
        const { email, password, fullName, role } = registerSchema.parse(req.body);
        // Check if user exists
        const existingUser = await index_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Un compte avec cet email existe déjà' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const user = await index_1.prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                fullName,
                role: role || 'AGENT',
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
        res.status(201).json({ user });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        console.error('[Auth] Register error:', error);
        res.status(500).json({ error: 'Erreur lors de la création du compte' });
    }
});
// GET /api/auth/me - Get current user
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.user.id },
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
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('[Auth] Get me error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// PUT /api/auth/password - Change password
router.put('/password', auth_1.authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mot de passe actuel et nouveau requis' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Le nouveau mot de passe doit avoir au moins 6 caractères' });
        }
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await index_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        res.json({ message: 'Mot de passe modifié avec succès' });
    }
    catch (error) {
        console.error('[Auth] Password change error:', error);
        res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
    }
});
// POST /api/auth/refresh - Refresh token
router.post('/refresh', auth_1.authenticate, async (req, res) => {
    try {
        const token = (0, auth_1.generateToken)(req.user.id);
        res.json({ token });
    }
    catch (error) {
        console.error('[Auth] Refresh error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map