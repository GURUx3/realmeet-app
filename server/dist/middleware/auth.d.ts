import { Request, Response, NextFunction } from 'express';
/**
 * Clerk Authentication Middleware
 *
 * Verifies the Bearer token from the Authorization header
 * and attaches the authenticated userId to the request object.
 *
 * Usage:
 *   router.post('/protected-route', requireAuth, controller);
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map