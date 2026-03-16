-- FolderFinder Database Schema
-- Run once on Neon: psql $DATABASE_URL -f sql/schema.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================
-- NextAuth required tables
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id             TEXT NOT NULL PRIMARY KEY,
  name           TEXT,
  email          TEXT NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  image          TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id                  TEXT NOT NULL PRIMARY KEY,
  "userId"            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  provider            TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          BIGINT,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id             TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId"       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token      TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================================
-- Supermarkets
-- ============================================================

CREATE TABLE IF NOT EXISTS supermarkets (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(50)  UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  logo_url    TEXT,
  website_url TEXT,
  color       VARCHAR(7)   NOT NULL DEFAULT '#6B7280',  -- hex color for UI
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Deals (weekly folder items)
-- ============================================================

CREATE TABLE IF NOT EXISTS deals (
  id               SERIAL PRIMARY KEY,
  supermarket_id   INTEGER REFERENCES supermarkets(id) ON DELETE CASCADE,
  external_id      VARCHAR(255),
  product_name     VARCHAR(500) NOT NULL,
  normalized_name  VARCHAR(500) NOT NULL,
  brand            VARCHAR(200),
  category         VARCHAR(200),
  normal_price     DECIMAL(8,2),
  deal_price       DECIMAL(8,2) NOT NULL,
  discount_percent DECIMAL(5,2),
  discount_label   VARCHAR(500),
  unit_size        VARCHAR(100),
  price_per_unit   DECIMAL(10,4),
  image_url        TEXT,
  valid_from       DATE NOT NULL,
  valid_until      DATE NOT NULL,
  week_number      INTEGER NOT NULL,
  year             INTEGER NOT NULL,
  barcode          VARCHAR(50),
  raw_data         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (supermarket_id, external_id, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_deals_week        ON deals(year, week_number);
CREATE INDEX IF NOT EXISTS idx_deals_supermarket ON deals(supermarket_id);
CREATE INDEX IF NOT EXISTS idx_deals_barcode     ON deals(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_valid       ON deals(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_deals_discount    ON deals(discount_percent DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_deals_name_trgm   ON deals USING GIN (normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_deals_fullname_trgm ON deals USING GIN (product_name gin_trgm_ops);

-- ============================================================
-- User favorite products (top 15)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_products (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_query VARCHAR(255) NOT NULL,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_query)
);

CREATE INDEX IF NOT EXISTS idx_user_products_user ON user_products(user_id);

-- ============================================================
-- Price history (for trend charts)
-- ============================================================

CREATE TABLE IF NOT EXISTS price_history (
  id             SERIAL PRIMARY KEY,
  supermarket_id INTEGER REFERENCES supermarkets(id) ON DELETE CASCADE,
  barcode        VARCHAR(50),
  product_name   VARCHAR(500) NOT NULL,
  normal_price   DECIMAL(8,2),
  deal_price     DECIMAL(8,2),
  discount_percent DECIMAL(5,2),
  week_number    INTEGER NOT NULL,
  year           INTEGER NOT NULL,
  recorded_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_barcode ON price_history(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_price_history_week    ON price_history(year, week_number);
CREATE INDEX IF NOT EXISTS idx_price_history_super   ON price_history(supermarket_id);

-- ============================================================
-- Scrape log (track when data was last fetched)
-- ============================================================

CREATE TABLE IF NOT EXISTS scrape_log (
  id             SERIAL PRIMARY KEY,
  supermarket_id INTEGER REFERENCES supermarkets(id),
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  finished_at    TIMESTAMPTZ,
  deals_inserted INTEGER DEFAULT 0,
  deals_updated  INTEGER DEFAULT 0,
  status         VARCHAR(20) DEFAULT 'running',  -- running, success, error
  error_message  TEXT,
  week_number    INTEGER,
  year           INTEGER
);

-- ============================================================
-- Cleanup old deals (keep 4 weeks)
-- Run this as a cron or call from scraper
-- ============================================================
-- DELETE FROM deals WHERE valid_until < NOW() - INTERVAL '28 days';
-- DELETE FROM price_history WHERE recorded_at < NOW() - INTERVAL '90 days';
