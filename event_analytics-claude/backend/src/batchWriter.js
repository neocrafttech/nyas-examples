/**
 * In-memory batch writer: accumulates events and flushes to nyas.io PostgreSQL
 * in bulk inserts, reducing per-event DB round trips for high traffic sites.
 */
import { transaction } from './db.js';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '500');
const BATCH_INTERVAL_MS = parseInt(process.env.BATCH_INTERVAL_MS || '2000');

let buffer = [];
let flushTimer = null;
let droppedCount = 0;
const MAX_BUFFER = 50_000; // safety ceiling to prevent OOM

export function enqueue(event) {
  if (buffer.length >= MAX_BUFFER) {
    droppedCount++;
    return false;
  }
  buffer.push(event);
  if (buffer.length >= BATCH_SIZE) flush();
  return true;
}

export function getStats() {
  return { buffered: buffer.length, dropped: droppedCount };
}

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, BATCH_SIZE);

  try {
    await transaction(async (client) => {
      // Build VALUES placeholders for bulk insert
      const cols = [
        'event_type', 'session_id', 'user_id', 'page_url',
        'referrer', 'properties', 'device_type', 'browser',
        'os', 'country', 'ip_hash', 'created_at',
      ];
      const placeholders = batch.map((_, i) => {
        const base = i * cols.length;
        return `(${cols.map((_, j) => `$${base + j + 1}`).join(', ')})`;
      });
      const values = batch.flatMap((e) => [
        e.event_type, e.session_id, e.user_id ?? null,
        e.page_url ?? null, e.referrer ?? null,
        JSON.stringify(e.properties ?? {}),
        e.device_type ?? null, e.browser ?? null,
        e.os ?? null, e.country ?? null, e.ip_hash ?? null,
        e.created_at,
      ]);

      await client.query(
        `INSERT INTO events (${cols.join(', ')}) VALUES ${placeholders.join(', ')}`,
        values,
      );

      // Upsert per-session last_seen + counts
      const sessionUpdates = batch.reduce((acc, e) => {
        if (!acc[e.session_id]) acc[e.session_id] = { count: 0, last: e.created_at, page: e.page_url };
        acc[e.session_id].count++;
        if (e.created_at > acc[e.session_id].last) {
          acc[e.session_id].last = e.created_at;
          acc[e.session_id].page = e.page_url;
        }
        return acc;
      }, {});

      for (const [sid, info] of Object.entries(sessionUpdates)) {
        await client.query(
          `INSERT INTO sessions (session_id, started_at, last_seen_at, entry_page, exit_page, event_count)
           VALUES ($1, $2, $2, $3, $3, $4)
           ON CONFLICT (session_id) DO UPDATE SET
             last_seen_at = GREATEST(sessions.last_seen_at, EXCLUDED.last_seen_at),
             exit_page    = CASE WHEN EXCLUDED.last_seen_at > sessions.last_seen_at
                                 THEN EXCLUDED.exit_page ELSE sessions.exit_page END,
             event_count  = sessions.event_count + EXCLUDED.event_count`,
          [sid, info.last, info.page, info.count],
        );
      }
    });
  } catch (err) {
    console.error(`Batch flush failed (${batch.length} events):`, err.message);
    // Re-enqueue at front to avoid data loss on transient errors
    buffer.unshift(...batch.slice(0, 1000)); // cap re-enqueue to prevent spiral
  }
}

export function startFlushTimer() {
  flushTimer = setInterval(flush, BATCH_INTERVAL_MS);
}

export function stopFlushTimer() {
  clearInterval(flushTimer);
  return flush(); // final flush on shutdown
}
