import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../types';

/**
 * Clerk Authentication Middleware
 * 
 * Verifies the Bearer token from the Authorization header
 * and attaches the authenticated userId to the request object.
 * 
 * Usage:
 *   router.post('/protected-route', requireAuth, controller);
 */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Extract Bearer token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header',
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify the session token with Clerk
        const sessionClaims = await clerkClient.verifyToken(token, {
            secretKey: env.clerk.secretKey,
        });

        if (!sessionClaims || !sessionClaims.sub) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token',
            });
            return;
        }

        // Attach userId to request for downstream handlers
        (req as AuthenticatedRequest).auth = {
            userId: sessionClaims.sub,
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Token verification failed',
        });
    }
}
