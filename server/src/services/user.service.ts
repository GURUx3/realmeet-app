import { prisma } from '../database/client';
import { clerkService } from './clerk.service';
import { UserResponse } from '../types';

/**
 * User Service
 * 
 * Handles business logic for user operations.
 * Provides idempotent user synchronization with database.
 */
export class UserService {
    /**
     * Synchronize Clerk user with database (Idempotent)
     * 
     * Flow:
     * 1. Fetch user profile from Clerk API
     * 2. Extract email, name, and image from Clerk data
     * 3. Upsert user in database (create if not exists, do nothing if exists)
     * 4. Return the database user record
     * 
     * This operation is idempotent - calling it multiple times with the same
     * userId will always return the same result without creating duplicates.
     * 
     * @param userId - Clerk user ID
     * @returns Database user record
     */
    async syncUser(userId: string): Promise<UserResponse> {
        // TEMPORARY LOGGING - Will be removed after verification
        console.log('  🔍 [SERVICE] Fetching user from Clerk API...');

        // Fetch user data from Clerk
        const clerkUser = await clerkService.getUserById(userId);
        console.log('  ✓ [SERVICE] Clerk user fetched');

        // Extract user attributes
        const email = clerkService.getPrimaryEmail(clerkUser);
        const name = clerkService.getFullName(clerkUser);
        const imageUrl = clerkUser.imageUrl;

        console.log('  📝 [SERVICE] User data extracted:', {
            email,
            name: name || '(no name)',
            imageUrl: imageUrl ? '(has image)' : '(no image)',
        });

        console.log('  💾 [SERVICE] Writing to database via Prisma...');

        // Upsert user in database
        // - If user exists: return existing record (no update needed)
        // - If user doesn't exist: create new record
        const user = await prisma.user.upsert({
            where: {
                id: userId,
            },
            update: {
                // We intentionally don't update anything on subsequent logins
                // to preserve database as source of truth for user preferences
                // Add fields here if you want to sync updates from Clerk
            },
            create: {
                id: userId,
                email,
                name,
                imageUrl,
            },
        });

        console.log('  ✓ [SERVICE] Prisma upsert complete');

        return user;
    }

    /**
     * Get user by ID from database
     * 
     * @param userId - Clerk user ID
     * @returns User record or null if not found
     */
    async getUserById(userId: string): Promise<UserResponse | null> {
        return await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
    }
}

export const userService = new UserService();
