"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
/**
 * User Controller
 *
 * Handles HTTP requests for user-related operations.
 */
class UserController {
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
    async syncUser(req, res) {
        try {
            const userId = req.auth.userId;
            // TEMPORARY LOGGING - Will be removed after verification
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔄 [USER SYNC] Endpoint hit');
            console.log('📋 [USER SYNC] Authenticated userId:', userId);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            // Sync user with database (idempotent operation)
            const user = await user_service_1.userService.syncUser(userId);
            console.log('✅ [USER SYNC] Success - User record:', {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            });
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            console.error('❌ [USER SYNC] Error:', error);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'Failed to sync user',
            });
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=user.controller.js.map