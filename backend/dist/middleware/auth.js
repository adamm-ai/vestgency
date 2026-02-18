"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSecurityConfig = exports.generateToken = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
/**
 * Récupère le secret JWT de manière sécurisée.
 * Lance une erreur si JWT_SECRET n'est pas configuré.
 */
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('ERREUR CRITIQUE: JWT_SECRET non configuré. ' +
            'Définissez la variable d\'environnement JWT_SECRET avant de démarrer le serveur.');
    }
    return secret;
};
/**
 * Récupère la durée d'expiration du token JWT.
 */
const getJwtExpiresIn = () => {
    return process.env.JWT_EXPIRES_IN || '7d';
};
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token manquant' });
        }
        const token = authHeader.split(' ')[1];
        let secret;
        try {
            secret = getJwtSecret();
        }
        catch (error) {
            console.error('[AUTH] Configuration error:', error);
            return res.status(500).json({ error: 'Erreur de configuration serveur' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await index_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true, fullName: true, isActive: true },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Utilisateur non trouvé ou désactivé' });
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ error: 'Token expiré' });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ error: 'Token invalide' });
        }
        return res.status(500).json({ error: 'Erreur d\'authentification' });
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const generateToken = (userId) => {
    const secret = getJwtSecret();
    const expiresIn = getJwtExpiresIn();
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn });
};
exports.generateToken = generateToken;
/**
 * Vérifie que la configuration de sécurité est correcte au démarrage.
 * À appeler dans index.ts avant de démarrer le serveur.
 */
const validateSecurityConfig = () => {
    try {
        getJwtSecret();
        console.log('[AUTH] ✓ Configuration JWT validée');
    }
    catch (error) {
        console.error('[AUTH] ✗ Configuration JWT invalide');
        throw error;
    }
};
exports.validateSecurityConfig = validateSecurityConfig;
//# sourceMappingURL=auth.js.map