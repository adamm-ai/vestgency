import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: 'ADMIN' | 'AGENT';
        fullName: string;
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const generateToken: (userId: string) => string;
/**
 * Vérifie que la configuration de sécurité est correcte au démarrage.
 * À appeler dans index.ts avant de démarrer le serveur.
 */
export declare const validateSecurityConfig: () => void;
//# sourceMappingURL=auth.d.ts.map