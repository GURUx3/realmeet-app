import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { userController } from '../controllers/user.controller';

const router = Router();

/**
 * POST /api/user/sync
 * 
 * Synchronize authenticated user with database
 * 
 * @auth Required - Clerk Bearer token in Authorization header
 * @returns User record from database
 */
router.post('/sync', requireAuth, (req, res) => {
    return userController.syncUser(req as any, res);
});

export default router;
