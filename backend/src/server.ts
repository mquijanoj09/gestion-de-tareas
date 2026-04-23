import { createApp } from './app';
import { env } from './env';
import { logger } from './logger';
import { prisma } from './db';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Backend listening on :${env.PORT}`);
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Shutting down');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
