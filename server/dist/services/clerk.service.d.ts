import { ClerkUserData } from '../types';
/**
 * Clerk Service
 *
 * Handles communication with Clerk API to fetch user profile data.
 */
export declare class ClerkService {
    /**
     * Fetch user profile data from Clerk by userId
     *
     * @param userId - Clerk user ID
     * @returns User profile data from Clerk
     * @throws Error if user not found or API call fails
     */
    getUserById(userId: string): Promise<ClerkUserData>;
    /**
     * Extract primary email from Clerk user data
     */
    getPrimaryEmail(clerkUser: ClerkUserData): string;
    /**
     * Construct full name from Clerk user data
     */
    getFullName(clerkUser: ClerkUserData): string | null;
}
export declare const clerkService: ClerkService;
//# sourceMappingURL=clerk.service.d.ts.map