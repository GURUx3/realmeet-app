"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const env_1 = require("../config/env");
/**
 * Clerk Authentication Middleware
 *
 * Verifies the Bearer token from the Authorization header
 * and attaches the authenticated userId to the request object.
 *
 * Usage:
 *   router.post('/protected-route', requireAuth, controller);
 */
async function requireAuth(req, res, next) {
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
        const sessionClaims = await clerk_sdk_node_1.clerkClient.verifyToken(token, {
            secretKey: env_1.env.clerk.secretKey,
        });
        if (!sessionClaims || !sessionClaims.sub) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token',
            });
            return;
        }
        // Attach userId to request for downstream handlers
        req.auth = {
            userId: sessionClaims.sub,
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Token verification failed',
        });
    }
}
//# sourceMappingURL=auth.js.map