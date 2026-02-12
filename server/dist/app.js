"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
/**
 * Create and configure Express application
 */
function createApp() {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)({
        origin: env_1.env.cors.clientUrl,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Request logging in development
    if (env_1.env.server.nodeEnv === 'development') {
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.path}`);
            next();
        });
    }
    // API routes
    app.use('/api', routes_1.default);
    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            message: 'Real-Meet API Server',
            version: '1.0.0',
            status: 'running',
        });
    });
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.method} ${req.path} not found`,
        });
    });
    // Global error handler
    app.use((err, req, res, next) => {
        console.error('Unhandled error:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: env_1.env.server.nodeEnv === 'development' ? err.message : 'Something went wrong',
        });
    });
    return app;
}
//# sourceMappingURL=app.js.map