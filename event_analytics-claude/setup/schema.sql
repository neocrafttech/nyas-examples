-- Event Analytics Schema for nyas.io (PostgreSQL)

-- Core events table with time-based partitioning support
CREATE TABLE IF NOT EXISTS events (
  id            BIGSERIAL PRIMARY KEY,
  event_id      UUID NOT NULL DEFAULT gen_random_uuid(),
  event_type    VARCHAR(100) NOT NULL,
  session_id    UUID NOT NULL,
  user_id       VARCHAR(255),
  page_url      TEXT,
  referrer      TEXT,
  properties    JSONB DEFAULT '{}',
  device_type   VARCHAR(20),  -- desktop, mobile, tablet
  browser       VARCHAR(50),
  os            VARCHAR(50),
  country       VARCHAR(2),
  ip_hash       VARCHAR(64),  -- hashed for privacy
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(255),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_count    INT DEFAULT 1,
  event_count   INT DEFAULT 1,
  entry_page    TEXT,
  exit_page     TEXT,
  referrer      TEXT,
  device_type   VARCHAR(20),
  browser       VARCHAR(50),
  os            VARCHAR(50),
  country       VARCHAR(2),
  duration_sec  INT GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (last_seen_at - started_at))::INT
  ) STORED
);

-- Page views aggregated hourly (for fast dashboard queries)
CREATE TABLE IF NOT EXISTS pageviews_hourly (
  hour          TIMESTAMPTZ NOT NULL,
  page_url      TEXT NOT NULL,
  views         INT DEFAULT 0,
  unique_sessions INT DEFAULT 0,
  PRIMARY KEY (hour, page_url)
);

-- Event type aggregates per hour
CREATE TABLE IF NOT EXISTS events_hourly (
  hour          TIMESTAMPTZ NOT NULL,
  event_type    VARCHAR(100) NOT NULL,
  count         INT DEFAULT 0,
  PRIMARY KEY (hour, event_type)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session    ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_type_time  ON events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_page_time  ON events (page_url, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_props      ON events USING gin (properties);
CREATE INDEX IF NOT EXISTS idx_sessions_started  ON sessions (started_at DESC);

-- Function to upsert hourly aggregates (called by batch writer)
CREATE OR REPLACE FUNCTION upsert_hourly_aggregates(
  p_hour      TIMESTAMPTZ,
  p_page_url  TEXT,
  p_event_type VARCHAR(100),
  p_sessions  INT,
  p_events    INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO pageviews_hourly (hour, page_url, views, unique_sessions)
  VALUES (p_hour, p_page_url, p_events, p_sessions)
  ON CONFLICT (hour, page_url)
  DO UPDATE SET
    views           = pageviews_hourly.views + EXCLUDED.views,
    unique_sessions = pageviews_hourly.unique_sessions + EXCLUDED.unique_sessions;

  INSERT INTO events_hourly (hour, event_type, count)
  VALUES (p_hour, p_event_type, p_events)
  ON CONFLICT (hour, event_type)
  DO UPDATE SET count = events_hourly.count + EXCLUDED.count;
END;
$$ LANGUAGE plpgsql;
