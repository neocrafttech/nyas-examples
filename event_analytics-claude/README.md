# Event Analytics — nyas.io + Fastify + React

High-traffic event analytics system backed by nyas.io managed PostgreSQL.

## Architecture

```
Website / App
  └─ tracker.js (client snippet, batched sendBeacon)
       └─ POST /events/batch ──► Fastify Backend
                                   └─ In-memory buffer (500 events / 2s flush)
                                         └─ Bulk INSERT → nyas.io PostgreSQL
                                                └─ React Dashboard ← GET /analytics/*
```

## Quick Start

### 1. Create nyas.io project & apply schema

```bash
export NYAS_TOKEN=<your token from app.nyas.io>
cd setup
chmod +x setup.sh
./setup.sh
```

This creates the project, writes `.env` files, and runs `schema.sql`.

### 2. Start backend

```bash
cd backend
npm install
npm run dev        # http://localhost:3001
```

### 3. Start frontend dashboard

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### 4. Add tracker to your website

```html
<script src="http://localhost:3001/tracker.js" data-api="http://localhost:3001"></script>
<script>
  // Custom events anywhere
  nyas('signup', { plan: 'pro' });
  nyas('purchase', { value: 49.99 });
</script>
```

## Backend API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/event` | Single event ingestion |
| POST | `/events/batch` | Batch ingestion (up to 500) |
| GET | `/beacon` | Pixel beacon for no-JS tracking |
| GET | `/analytics/overview` | KPIs: events, sessions, bounce rate |
| GET | `/analytics/timeseries` | Hourly/daily time series |
| GET | `/analytics/events/breakdown` | Count by event type |
| GET | `/analytics/referrers` | Top traffic sources |
| POST | `/analytics/funnel` | Funnel conversion analysis |
| GET | `/analytics/live` | Last-60s active sessions |

### Query Parameters

Most analytics endpoints accept:
- `from` — e.g. `-1h`, `-24h`, `-7d`, `-30d`, or ISO timestamp
- `to` — `now` (default) or ISO timestamp

## High-Traffic Design Decisions

- **Batch writes**: events are buffered in-memory and flushed every 2 seconds in bulk `INSERT`, reducing DB round trips by ~100×
- **Connection pooling**: pg Pool capped at 10 connections (nyas.io sandbox-safe), prefer transaction-mode pooler URI
- **Rate limiting**: 2000 req/min per IP via @fastify/rate-limit
- **Overflow protection**: buffer capped at 50,000 events; excess dropped and counted
- **Privacy**: IP addresses are SHA-256 hashed (first 16 chars only)
- **Beacon API**: tracker.js uses `sendBeacon` for reliable unload-time flushing

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | nyas.io postgres URI |
| `PORT` | 3001 | Server port |
| `BATCH_SIZE` | 500 | Flush threshold |
| `BATCH_INTERVAL_MS` | 2000 | Flush interval |
| `CORS_ORIGIN` | * | Allowed origin |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | (proxy) | Backend URL |
