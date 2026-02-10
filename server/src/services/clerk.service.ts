import { clerkClient } from '@clerk/clerk-sdk-node';
import { ClerkUserData } from '../types';

/**
 * Clerk Service
 * 
 * Handles communication with Clerk API to fetch user profile data.
 */
export class ClerkService {
    /**
     * Fetch user profile data from Clerk by userId
     * 
     * @param userId - Clerk user ID
     * @returns User profile data from Clerk
     * @throws Error if user not found or API call fails
     */
    async getUserById(userId: string): Promise<ClerkUserData> {
        try {
            const user = await clerkClient.users.getUser(userId);

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
        } catch (error) {
            console.error(`Failed to fetch user from Clerk: ${userId}`, error);
            throw new Error('Failed to fetch user profile from Clerk');
        }
    }

    /**
     * Extract primary email from Clerk user data
     */
    getPrimaryEmail(clerkUser: ClerkUserData): string {
        const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;

        if (!primaryEmail) {
            throw new Error('User has no email address');
        }

        return primaryEmail;
    }

    /**
     * Construct full name from Clerk user data
     */
    getFullName(clerkUser: ClerkUserData): string | null {
        const { firstName, lastName } = clerkUser;

        if (!firstName && !lastName) {
            return null;
        }

        return [firstName, lastName].filter(Boolean).join(' ');
    }
}

export const clerkService = new ClerkService();
