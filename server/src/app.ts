import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
    const app = express();

    // Middleware
    app.use(
        cors({
            origin: [env.cors.clientUrl, "http://localhost:3000", "https://realmeet-app.vercel.app"],
            credentials: true,
        })
    );

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging in development
    if (env.server.nodeEnv === 'development') {
        app.use((req: Request, res: Response, next: NextFunction) => {
            console.log(`${req.method} ${req.path}`);
            next();
        });
    }

    // API routes
    app.use('/api', routes);

    // Serve Transcripts (Static) - Security warning: In production, add auth middleware here!
    app.use('/transcripts', express.static(path.join(process.cwd(), 'transcripts')));

    // Root endpoint
    app.get('/', (req: Request, res: Response) => {
        res.json({
            message: 'Real-Meet API Server',
            version: '1.0.0',
            status: 'running',
        });
    });

    // 404 handler
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            error: 'Not Found',
            message: `Route ${req.method} ${req.path} not found`,
        });
    });

    // Global error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error('Unhandled error:', err);

        res.status(500).json({
            error: 'Internal Server Error',
            message: env.server.nodeEnv === 'development' ? err.message : 'Something went wrong',
        });
    });

    return app;
}
