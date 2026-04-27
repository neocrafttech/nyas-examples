import { enqueue, getStats } from '../batchWriter.js';
import { parseDevice } from '../middleware/parseDevice.js';

const eventSchema = {
  body: {
    type: 'object',
    required: ['event_type', 'session_id'],
    properties: {
      event_type: { type: 'string', minLength: 1, maxLength: 100 },
      session_id: { type: 'string', format: 'uuid' },
      user_id:    { type: 'string', maxLength: 255 },
      page_url:   { type: 'string', maxLength: 2048 },
      referrer:   { type: 'string', maxLength: 2048 },
      properties: { type: 'object' },
    },
  },
};

const batchSchema = {
  body: {
    type: 'object',
    required: ['events'],
    properties: {
      events: {
        type: 'array',
        maxItems: 500,
        items: eventSchema.body,
      },
    },
  },
};

export default async function eventsRoutes(fastify) {
  // Single event
  fastify.post('/event', { schema: eventSchema }, async (request, reply) => {
    const device = parseDevice(request);
    const now = new Date().toISOString();
    const accepted = enqueue({ ...request.body, ...device, created_at: now });
    return reply.code(accepted ? 202 : 429).send({ ok: accepted });
  });

  // Batch ingestion endpoint — clients can send up to 500 events per call
  fastify.post('/events/batch', { schema: batchSchema }, async (request, reply) => {
    const device = parseDevice(request);
    const now = new Date().toISOString();
    let accepted = 0;
    for (const ev of request.body.events) {
      if (enqueue({ ...ev, ...device, created_at: now })) accepted++;
    }
    return reply.code(202).send({ accepted, total: request.body.events.length });
  });

  // Health / buffer status
  fastify.get('/events/status', async () => getStats());

  // 1×1 pixel beacon for pageview tracking (img src approach)
  fastify.get('/beacon', async (request, reply) => {
    const { session_id, page_url, referrer } = request.query;
    if (session_id) {
      const device = parseDevice(request);
      enqueue({
        event_type: 'pageview',
        session_id,
        page_url: page_url || null,
        referrer: referrer || null,
        ...device,
        created_at: new Date().toISOString(),
      });
    }
    reply
      .header('Content-Type', 'image/gif')
      .header('Cache-Control', 'no-store')
      .send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  });
}
