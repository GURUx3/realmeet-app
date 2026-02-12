"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = require("./app");
const socket_service_1 = require("./services/socket.service");
const env_1 = require("./config/env");
const client_1 = require("./database/client");
/**
 * Start the server
 */
async function start() {
    try {
        // Test database connection
        await client_1.prisma.$connect();
        console.log('✅ Database connected successfully');
        // Create Express app
        const app = (0, app_1.createApp)();
        // Create HTTP server
        const httpServer = (0, http_1.createServer)(app);
        // Initialize Socket.io Service
        new socket_service_1.SocketService(httpServer);
        // Start listening
        httpServer.listen(env_1.env.server.port, () => {
            console.log(`🚀 Server running on port ${env_1.env.server.port}`);
            console.log(`📍 Environment: ${env_1.env.server.nodeEnv}`);
            console.log(`🔗 API endpoint: http://localhost:${env_1.env.server.port}/api`);
            console.log(`🔌 Socket.io enabled`);
        });
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully...');
            httpServer.close(async () => {
                await client_1.prisma.$disconnect();
                console.log('Server closed');
                process.exit(0);
            });
        });
        process.on('SIGINT', async () => {
            console.log('SIGINT received, shutting down gracefully...');
            httpServer.close(async () => {
                await client_1.prisma.$disconnect();
                console.log('Server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=index.js.map