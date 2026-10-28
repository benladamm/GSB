import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../db';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const dbStatus = await isDatabaseConnected();

  const statusCode = dbStatus.connected ? 200 : 503;
  return res.status(statusCode).json({
    status: dbStatus.connected ? 'ok' : 'degraded',
    app: 'GSB PharmaLink REST API (Express)',
    version: '2.0.0',
    curriculum: 'BTS SIO SLAM 2e année',
    architecture: 'Express REST API + Next.js Frontend + MySQL DimDams Cloud',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;

