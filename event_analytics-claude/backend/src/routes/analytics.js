import { query } from '../db.js';

export default async function analyticsRoutes(fastify) {

  // Overview metrics for a time window
  fastify.get('/analytics/overview', async (request) => {
    const { from = '-24h', to = 'now' } = request.query;
    const [fromTs, toTs] = resolveRange(from, to);

    const [eventsRes, sessionsRes, topPagesRes, devicesRes] = await Promise.all([
      query(`
        SELECT
          COUNT(*)                                        AS total_events,
          COUNT(*) FILTER (WHERE event_type = 'pageview') AS pageviews,
          COUNT(DISTINCT session_id)                      AS unique_sessions,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS identified_users
        FROM events
        WHERE created_at BETWEEN $1 AND $2
      `, [fromTs, toTs]),

      query(`
        SELECT
          COUNT(*)                              AS total_sessions,
          ROUND(AVG(duration_sec))::INT         AS avg_duration_sec,
          ROUND(AVG(page_count))::INT           AS avg_pages,
          COUNT(*) FILTER (WHERE page_count = 1)::FLOAT
            / NULLIF(COUNT(*), 0) * 100         AS bounce_rate
        FROM sessions
        WHERE started_at BETWEEN $1 AND $2
      `, [fromTs, toTs]),

      query(`
        SELECT page_url, COUNT(*) AS views
        FROM events
        WHERE event_type = 'pageview'
          AND created_at BETWEEN $1 AND $2
          AND page_url IS NOT NULL
        GROUP BY page_url
        ORDER BY views DESC
        LIMIT 10
      `, [fromTs, toTs]),

      query(`
        SELECT device_type, COUNT(*) AS count
        FROM events
        WHERE created_at BETWEEN $1 AND $2
          AND device_type IS NOT NULL
        GROUP BY device_type
        ORDER BY count DESC
      `, [fromTs, toTs]),
    ]);

    return {
      period: { from: fromTs, to: toTs },
      events: eventsRes.rows[0],
      sessions: sessionsRes.rows[0],
      top_pages: topPagesRes.rows,
      devices: devicesRes.rows,
    };
  });

  // Time-series event counts (bucketed)
  fastify.get('/analytics/timeseries', async (request) => {
    const { from = '-24h', to = 'now', bucket = '1 hour', event_type } = request.query;
    const [fromTs, toTs] = resolveRange(from, to);

    const params = [fromTs, toTs, bucket];
    const typeFilter = event_type ? `AND event_type = $4` : '';
    if (event_type) params.push(event_type);

    const res = await query(`
      SELECT
        date_trunc('hour', created_at) AS bucket,
        COUNT(*)                        AS events,
        COUNT(DISTINCT session_id)      AS sessions
      FROM events
      WHERE created_at BETWEEN $1 AND $2
        ${typeFilter}
      GROUP BY 1
      ORDER BY 1
    `, params);

    return { series: res.rows };
  });

  // Funnel analysis
  fastify.post('/analytics/funnel', async (request) => {
    const { steps, from = '-7d', to = 'now' } = request.body;
    if (!Array.isArray(steps) || steps.length < 2) {
      return { error: 'Provide at least 2 steps' };
    }
    const [fromTs, toTs] = resolveRange(from, to);

    // Count sessions that reached each step in order
    const results = [];
    for (const step of steps) {
      const res = await query(`
        SELECT COUNT(DISTINCT session_id) AS sessions
        FROM events
        WHERE event_type = $1
          AND created_at BETWEEN $2 AND $3
      `, [step, fromTs, toTs]);
      results.push({ step, sessions: parseInt(res.rows[0].sessions) });
    }

    // Conversion rates relative to first step
    const top = results[0].sessions || 1;
    return results.map((r) => ({
      ...r,
      conversion_rate: ((r.sessions / top) * 100).toFixed(1) + '%',
    }));
  });

  // Top referrers
  fastify.get('/analytics/referrers', async (request) => {
    const { from = '-7d', to = 'now' } = request.query;
    const [fromTs, toTs] = resolveRange(from, to);
    const res = await query(`
      SELECT referrer, COUNT(*) AS sessions
      FROM sessions
      WHERE started_at BETWEEN $1 AND $2
        AND referrer IS NOT NULL AND referrer != ''
      GROUP BY referrer
      ORDER BY sessions DESC
      LIMIT 20
    `, [fromTs, toTs]);
    return { referrers: res.rows };
  });

  // Event type breakdown
  fastify.get('/analytics/events/breakdown', async (request) => {
    const { from = '-24h', to = 'now' } = request.query;
    const [fromTs, toTs] = resolveRange(from, to);
    const res = await query(`
      SELECT event_type, COUNT(*) AS count
      FROM events
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY event_type
      ORDER BY count DESC
    `, [fromTs, toTs]);
    return { breakdown: res.rows };
  });

  // Live count: events in last N seconds (for real-time widget)
  fastify.get('/analytics/live', async (request) => {
    const { seconds = 60 } = request.query;
    const res = await query(`
      SELECT COUNT(*) AS events, COUNT(DISTINCT session_id) AS active_sessions
      FROM events
      WHERE created_at > NOW() - ($1 || ' seconds')::INTERVAL
    `, [Math.min(Number(seconds), 3600)]);
    return res.rows[0];
  });
}

// Parse shorthand like "-24h", "-7d", "now" into ISO timestamps
function resolveRange(from, to) {
  const toTs = to === 'now' ? new Date() : new Date(to);
  let fromTs;
  const m = from.match(/^-(\d+)([hdwm])$/);
  if (m) {
    const n = parseInt(m[1]);
    fromTs = new Date(toTs);
    if (m[2] === 'h') fromTs.setHours(fromTs.getHours() - n);
    else if (m[2] === 'd') fromTs.setDate(fromTs.getDate() - n);
    else if (m[2] === 'w') fromTs.setDate(fromTs.getDate() - n * 7);
    else if (m[2] === 'm') fromTs.setMonth(fromTs.getMonth() - n);
  } else {
    fromTs = new Date(from);
  }
  return [fromTs.toISOString(), toTs.toISOString()];
}
