"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clerkService = exports.ClerkService = void 0;
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
/**
 * Clerk Service
 *
 * Handles communication with Clerk API to fetch user profile data.
 */
class ClerkService {
    /**
     * Fetch user profile data from Clerk by userId
     *
     * @param userId - Clerk user ID
     * @returns User profile data from Clerk
     * @throws Error if user not found or API call fails
     */
    async getUserById(userId) {
        try {
            const user = await clerk_sdk_node_1.clerkClient.users.getUser(userId);
            return {
                id: user.id,
                emailAddresses: user.emailAddresses.map((email) => ({
                    emailAddress: email.emailAddress,
                    id: email.id,
                })),
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
            };
        }
        catch (error) {
            console.error(`Failed to fetch user from Clerk: ${userId}`, error);
            throw new Error('Failed to fetch user profile from Clerk');
        }
    }
    /**
     * Extract primary email from Clerk user data
     */
    getPrimaryEmail(clerkUser) {
        const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
        if (!primaryEmail) {
            throw new Error('User has no email address');
        }
        return primaryEmail;
    }
    /**
     * Construct full name from Clerk user data
     */
    getFullName(clerkUser) {
        const { firstName, lastName } = clerkUser;
        if (!firstName && !lastName) {
            return null;
        }
        return [firstName, lastName].filter(Boolean).join(' ');
    }
}
exports.ClerkService = ClerkService;
exports.clerkService = new ClerkService();
//# sourceMappingURL=clerk.service.js.map