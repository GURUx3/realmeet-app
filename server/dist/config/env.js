"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function validateEnv() {
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
            url: required.DATABASE_URL,
        },
        clerk: {
            secretKey: required.CLERK_SECRET_KEY,
        },
        server: {
            port: parseInt(process.env.PORT || '3001', 10),
            nodeEnv: process.env.NODE_ENV || 'development',
        },
        cors: {
            clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
        },
    };
}
exports.env = validateEnv();
//# sourceMappingURL=env.js.map