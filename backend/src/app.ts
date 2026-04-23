import 'express-async-errors';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';
import { AppError } from './errors';
import { healthRouter } from './routes/health';
import { boardsRouter } from './routes/boards';
import { listsRouter } from './routes/lists';
import { tasksRouter } from './routes/tasks';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

  app.use('/api', healthRouter);
  app.use('/api', boardsRouter);
  app.use('/api', listsRouter);
  app.use('/api', tasksRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: err.flatten() },
      });
    }
    if (err instanceof AppError) {
      return res
        .status(err.status)
        .json({ error: { code: err.code, message: err.message, details: err.details } });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
      }
      if (err.code === 'P2002') {
        return res
          .status(409)
          .json({ error: { code: 'CONFLICT', message: 'Unique constraint violation' } });
      }
    }
    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  });

  return app;
}
