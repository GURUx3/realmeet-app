import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
/**
 * User Controller
 *
 * Handles HTTP requests for user-related operations.
 */
export declare class UserController {
    /**
     * POST /api/user/sync
     *
     * Synchronize authenticated Clerk user with database.
     * This endpoint should be called by the client after successful login.
     *
     * Authentication: Required (Clerk Bearer token)
     *
     * Response:
     * - 200: User synced successfully
     * - 401: Unauthorized (handled by middleware)
     * - 500: Internal server error
     */
    syncUser(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const userController: UserController;
//# sourceMappingURL=user.controller.d.ts.map