import { UserResponse } from '../types';
/**
 * User Service
 *
 * Handles business logic for user operations.
 * Provides idempotent user synchronization with database.
 */
export declare class UserService {
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
    syncUser(userId: string): Promise<UserResponse>;
    /**
     * Get user by ID from database
     *
     * @param userId - Clerk user ID
     * @returns User record or null if not found
     */
    getUserById(userId: string): Promise<UserResponse | null>;
}
export declare const userService: UserService;
//# sourceMappingURL=user.service.d.ts.map