-- =============================================================================
-- Migration: 000001_init_schema.up.sql
-- Description: Core relational schema for Rider Boda platform (PostgreSQL + PostGIS)
-- Reference: docs/DATABASE.md v1.0
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Identity & Credentials
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL UNIQUE,
  phone_verified_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (phone_e164 ~ '^\+[1-9][0-9]{1,14}$')
);

CREATE TABLE IF NOT EXISTS credentials (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  password_hash text NOT NULL,
  password_updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  token_hash bytea NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS sessions_user_active_idx ON sessions(user_id, expires_at)
  WHERE revoked_at IS NULL;

-- 2. Profiles
CREATE TABLE IF NOT EXISTS passenger_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rider_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  display_name text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','under_review','approved','rejected')),
  account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS motorbikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES rider_profiles(user_id) ON DELETE RESTRICT,
  plate_number text NOT NULL,
  model text NOT NULL DEFAULT 'Bajaj Boxer 150',
  helmet_included boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plate_number)
);

-- 3. Document Verification
CREATE TABLE IF NOT EXISTS verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES rider_profiles(user_id) ON DELETE RESTRICT,
  doc_type text NOT NULL CHECK (doc_type IN ('national_id','driving_license','police_clearance','logbook','insurance')),
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES rider_profiles(user_id) ON DELETE RESTRICT,
  reviewer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decision text NOT NULL CHECK (decision IN ('approved','rejected','needs_info')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Location & Presence (PostGIS)
CREATE TABLE IF NOT EXISTS rider_locations (
  rider_id uuid PRIMARY KEY REFERENCES rider_profiles(user_id) ON DELETE RESTRICT,
  location geography(Point, 4326) NOT NULL,
  heading numeric(5,2),
  speed_kmh numeric(5,2),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rider_locations_geo_idx ON rider_locations USING GIST (location);

CREATE TABLE IF NOT EXISTS rider_presence (
  rider_id uuid PRIMARY KEY REFERENCES rider_profiles(user_id) ON DELETE RESTRICT,
  is_online boolean NOT NULL DEFAULT false,
  last_heartbeat_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Pricing & Fare Quotes
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL DEFAULT 'KES',
  base_fare_minor bigint NOT NULL DEFAULT 5000, -- KSh 50.00
  per_km_minor bigint NOT NULL DEFAULT 3500,     -- KSh 35.00 / km
  per_min_minor bigint NOT NULL DEFAULT 200,     -- KSh 2.00 / min
  min_fare_minor bigint NOT NULL DEFAULT 10000,  -- KSh 100.00 minimum
  version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fare_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL REFERENCES passenger_profiles(user_id) ON DELETE RESTRICT,
  pickup_lat numeric(9,6) NOT NULL,
  pickup_lng numeric(9,6) NOT NULL,
  dest_lat numeric(9,6) NOT NULL,
  dest_lng numeric(9,6) NOT NULL,
  distance_meters integer NOT NULL,
  duration_seconds integer NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  fare_minor bigint NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Trips, Offers & Events
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id uuid NOT NULL REFERENCES passenger_profiles(user_id) ON DELETE RESTRICT,
  rider_id uuid REFERENCES rider_profiles(user_id) ON DELETE RESTRICT,
  fare_quote_id uuid REFERENCES fare_quotes(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','searching','assigned','arriving','arrived','in_progress','completed','cancelled','unavailable')),
  pickup_address text NOT NULL,
  dest_address text NOT NULL,
  fare_minor bigint NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trip_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  rider_id uuid NOT NULL REFERENCES rider_profiles(user_id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'dispatched'
    CHECK (status IN ('dispatched','accepted','rejected','expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trip_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  from_status text,
  to_status text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Subscriptions (0% Commission Model)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price_minor bigint NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  period_days integer NOT NULL,
  trial_days integer NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rider_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES rider_profiles(user_id) ON DELETE RESTRICT,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial','active','expired','suspended','cancelled')),
  starts_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Safety & Incident Management
CREATE TABLE IF NOT EXISTS safety_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE RESTRICT,
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category text NOT NULL CHECK (category IN ('emergency_sos','helmet_missing','reckless_driving','harassment','fare_dispute','other')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Audit Logging
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
