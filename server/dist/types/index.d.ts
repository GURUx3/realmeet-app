import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    auth: {
        userId: string;
    };
}
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
export interface UserResponse {
    id: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=index.d.ts.map