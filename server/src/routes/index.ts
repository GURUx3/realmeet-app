import { Router } from 'express';
import userRoutes from './user.routes';

const router = Router();

// Mount user routes
router.use('/user', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'real-meet-server',
    });
});

export default router;
