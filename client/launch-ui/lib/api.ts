/**
 * API Client Utility
 * 
 * Centralized API client for making authenticated requests to the backend.
 * Automatically attaches Clerk authentication tokens to requests.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Make an authenticated API request
 * 
 * @param endpoint - API endpoint path (e.g., '/user/sync')
 * @param options - Fetch options
 * @param token - Clerk session token
 * @returns API response
 */
export async function apiRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
): Promise<ApiResponse<T>> {
    try {
        const url = `${API_URL}/api${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        // Attach Bearer token if provided
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('[API] Request:', {
            method: options.method || 'GET',
            url,
            hasToken: !!token,
        });

        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // CRITICAL: Include cookies for session
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[API] Error response:', {
                status: response.status,
                data,
            });

            return {
                success: false,
                error: data.error || 'Request failed',
                message: data.message || `HTTP ${response.status}`,
            };
        }

        console.log('[API] Success response:', {
            url,
            success: data.success,
        });

        return data;
    } catch (error) {
        console.error('[API] Network error:', error);

        return {
            success: false,
            error: 'Network error',
            message: error instanceof Error ? error.message : 'Failed to connect to server',
        };
    }
}

/**
 * Sync authenticated user with database
 * 
 * @param token - Clerk session token
 * @returns User record from database
 */
export async function syncUser(token: string): Promise<ApiResponse> {
    return apiRequest('/user/sync', {
        method: 'POST',
    }, token);
}
