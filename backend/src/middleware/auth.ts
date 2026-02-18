import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'AGENT';
    fullName: string;
  };
}

/**
 * Récupère le secret JWT de manière sécurisée.
 * Lance une erreur si JWT_SECRET n'est pas configuré.
 */
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'ERREUR CRITIQUE: JWT_SECRET non configuré. ' +
      'Définissez la variable d\'environnement JWT_SECRET avant de démarrer le serveur.'
    );
  }
  return secret;
};

/**
 * Récupère la durée d'expiration du token JWT.
 */
const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1];

    let secret: string;
    try {
      secret = getJwtSecret();
    } catch (error) {
      console.error('[AUTH] Configuration error:', error);
      return res.status(500).json({ error: 'Erreur de configuration serveur' });
    }

    const decoded = jwt.verify(token, secret) as { userId: string };

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expiré' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

export const generateToken = (userId: string): string => {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn();
  return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
};

/**
 * Vérifie que la configuration de sécurité est correcte au démarrage.
 * À appeler dans index.ts avant de démarrer le serveur.
 */
export const validateSecurityConfig = (): void => {
  try {
    getJwtSecret();
    console.log('[AUTH] ✓ Configuration JWT validée');
  } catch (error) {
    console.error('[AUTH] ✗ Configuration JWT invalide');
    throw error;
  }
};
