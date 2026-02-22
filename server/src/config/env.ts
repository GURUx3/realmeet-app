import dotenv from 'dotenv';

dotenv.config();

interface EnvironmentConfig {
    database: {
        url: string;
    };
    clerk: {
        secretKey: string;
    };
    server: {
        port: number;
        nodeEnv: string;
    };
    cors: {
        clientUrl: string;
    };
    ai: {
        geminiApiKey?: string;
    };
}

function validateEnv(): EnvironmentConfig {
    const required = {
        DATABASE_URL: process.env.DATABASE_URL,
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    };

    for (const [key, value] of Object.entries(required)) {
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
    }

    return {
        database: {
            url: required.DATABASE_URL!,
        },
        clerk: {
            secretKey: required.CLERK_SECRET_KEY!,
        },
        server: {
            port: parseInt(process.env.PORT || '3001', 10),
            nodeEnv: process.env.NODE_ENV || 'development',
        },
        cors: {
            clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
        },
        ai: {
            geminiApiKey: process.env.GEMINI_API_KEY,
        },
    };
}

export const env = validateEnv();
