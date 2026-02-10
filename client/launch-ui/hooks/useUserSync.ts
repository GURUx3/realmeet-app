import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { syncUser } from '@/lib/api';

/**
 * User Sync Hook
 * 
 * Automatically synchronizes authenticated Clerk users with the database.
 * This hook should be called once after successful authentication.
 * 
 * The sync operation is idempotent - calling it multiple times is safe.
 * 
 * @returns Sync status and error information
 */
export function useUserSync() {
    const { userId, getToken, isLoaded, isSignedIn } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        // Only sync if:
        // 1. Auth is loaded
        // 2. User is signed in
        // 3. We have a userId
        // 4. Haven't synced yet
        // 5. Not currently syncing
        if (!isLoaded || !isSignedIn || !userId || isSynced || isSyncing) {
            return;
        }

        async function performSync() {
            setIsSyncing(true);
            setSyncError(null);

            try {
                console.log('[useUserSync] Starting user sync for userId:', userId);

                // Get the session token from Clerk
                const token = await getToken();

                if (!token) {
                    throw new Error('No session token available');
                }

                console.log('[useUserSync] Got session token, calling API...');

                // Call the backend sync endpoint
                const response = await syncUser(token);

                if (response.success) {
                    console.log('[useUserSync] ✅ User synced successfully:', response.data);
                    setIsSynced(true);
                } else {
                    console.error('[useUserSync] ❌ Sync failed:', response.error, response.message);
                    setSyncError(response.message || 'Failed to sync user');
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error('[useUserSync] ❌ Exception during sync:', errorMessage);
                setSyncError(errorMessage);
            } finally {
                setIsSyncing(false);
            }
        }

        performSync();
    }, [isLoaded, isSignedIn, userId, isSynced, isSyncing, getToken]);

    return {
        isSyncing,
        syncError,
        isSynced,
    };
}
