"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
/**
 * POST /api/user/sync
 *
 * Synchronize authenticated user with database
 *
 * @auth Required - Clerk Bearer token in Authorization header
 * @returns User record from database
 */
router.post('/sync', auth_1.requireAuth, (req, res) => {
    return user_controller_1.userController.syncUser(req, res);
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map