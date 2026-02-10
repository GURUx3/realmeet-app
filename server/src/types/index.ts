import { Request } from 'express';

// Extend Express Request to include authenticated user info
export interface AuthenticatedRequest extends Request {
    auth: {
        userId: string;
    };
}

// User data from Clerk
export interface ClerkUserData {
    id: string;
    emailAddresses: Array<{
        emailAddress: string;
        id: string;
    }>;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
}

// Database user response
export interface UserResponse {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}
