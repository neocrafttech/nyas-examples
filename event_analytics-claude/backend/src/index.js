import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import eventsRoutes from './routes/events.js';
import analyticsRoutes from './routes/analytics.js';
import { startFlushTimer, stopFlushTimer } from './batchWriter.js';

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL || 'info' },
  trustProxy: true,
});

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
});

// Rate limit ingestion endpoints: 2000 req/min per IP (high-traffic safe)
await app.register(rateLimit, {
  max: 2000,
  timeWindow: '1 minute',
  keyGenerator: (req) =>
    req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
  errorResponseBuilder: () => ({ ok: false, error: 'rate_limited' }),
});

await app.register(eventsRoutes);
await app.register(analyticsRoutes);

app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

const shutdown = async () => {
  app.log.info('Shutting down, flushing buffer...');
  await stopFlushTimer();
  await app.close();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startFlushTimer();

const port = parseInt(process.env.PORT || '3001');
await app.listen({ port, host: '0.0.0.0' });
console.log(`Event analytics backend listening on :${port}`);
