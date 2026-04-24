import { Router } from 'express';
import { prisma } from '../db';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok', buildMarker: 'deploy-check-2026-04-23' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'error' });
  }
});
