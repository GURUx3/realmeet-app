import { createServer } from 'http';
import { createApp } from './app';
import { SocketService } from './services/socket.service';
import { env } from './config/env';
import { prisma } from './database/client';

/**
 * Start the server
 */
async function start(): Promise<void> {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Create Express app
        const app = createApp();

        // Create HTTP server
        const httpServer = createServer(app);

        // Initialize Socket.io Service
        new SocketService(httpServer);

        // Start listening
        httpServer.listen(env.server.port, () => {
            console.log(`🚀 Server running on port ${env.server.port}`);
            console.log(`📍 Environment: ${env.server.nodeEnv}`);
            console.log(`🔗 API endpoint: http://localhost:${env.server.port}/api`);
            console.log(`🔌 Socket.io enabled`);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully...');
            httpServer.close(async () => {
                await prisma.$disconnect();
                console.log('Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', async () => {
            console.log('SIGINT received, shutting down gracefully...');
            httpServer.close(async () => {
                await prisma.$disconnect();
                console.log('Server closed');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
