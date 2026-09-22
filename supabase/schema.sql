-- ==============================================================================
-- GalamseyGuard — PostgreSQL / Supabase Schema Definition
-- IoT Environmental Activity & Machinery Pattern Detection System
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==============================================================================

   pressure NUMERIC(6, 1) NOT NULL, -- In hPa (e.g. 1012.2)
    rain_detected BOOLEAN DEFAULT FALSE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    activity_score INTEGER CHECK (activity_score >= 0 AND activity_score <= 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('NORMAL', 'ELEVATED', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for rapid historical queries by station and time
CREATE INDEX IF NOT EXISTS idx_sensor_readings_station_time 
ON public.sensor_readings (station_id, timestamp DESC);

-- 3. ALERTS TABLE (Human Verification Workflow)
CREATE TABLE IF NOT EXISTS public.alerts (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'ALT-2026-0091'
    station_id VARCHAR(50) REFERENCES public.stations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('NORMAL', 'ELEVATED', 'HIGH', 'CRITICAL')),
    alert_type VARCHAR(100) NOT NULL DEFAULT 'MACHINERY_SUSPECTED',
    description TEXT NOT NULL DEFAULT 'Possible machinery-related activity detected. Human verification required.',
    status VARCHAR(50) NOT NULL DEFAULT 'UNREVIEWED' 
        CHECK (status IN ('UNREVIEWED', 'ACKNOWLEDGED', 'UNDER REVIEW', 'RESOLVED', 'FALSE POSITIVE')),
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    snapshot_sound_rms NUMERIC(6, 3),
    snapshot_dominant_freq NUMERIC(6, 1),
    snapshot_vibration_rms NUMERIC(6, 3),
    snapshot_rain BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_alerts_station_status 
ON public.alerts (station_id, status);

-- 4. DEVICE HEALTH TABLE
CREATE TABLE IF NOT EXISTS public.device_health (
    id BIGSERIAL PRIMARY KEY,
    station_id VARCHAR(50) REFERENCES public.stations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_status VARCHAR(50) DEFAULT 'HEALTHY',
    network_status VARCHAR(50) DEFAULT '4G LTE',
    battery_level NUMERIC(4, 1) DEFAULT 100.0,
    solar_charging BOOLEAN DEFAULT TRUE,
    uptime_seconds BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SEED DATA FOR INITIAL PROTOTYPE STATIONS
INSERT INTO public.stations (id, device_id, name, location_name, latitude, longitude, status)
VALUES
    ('GG-001', 'RPI4-GG-PRABASIN', 'Pra River Sector Alpha', 'Pra River Basin — Lower Reach', 5.4120, -1.6210, 'ONLINE'),
    ('GG-002', 'RPI4-GG-ATEWAFST', 'Atewa Forest Fringe', 'Atewa Range Forest Reserve', 6.2310, -0.5820, 'ONLINE'),
    ('GG-003', 'RPI4-GG-TARKCOMM', 'Tarkwa Community Perimeter', 'Tarkwa North Buffer Zone', 5.3120, -1.9880, 'ONLINE')
ON CONFLICT (id) DO NOTHING;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_health ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon key) for dashboard display
DROP POLICY IF EXISTS "Allow public read access on stations" ON public.stations;
CREATE POLICY "Allow public read access on stations" ON public.stations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on stations" ON public.stations;
CREATE POLICY "Allow public insert on stations" ON public.stations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on stations" ON public.stations;
CREATE POLICY "Allow public update on stations" ON public.stations FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access on sensor_readings" ON public.sensor_readings;
CREATE POLICY "Allow public read access on sensor_readings" ON public.sensor_readings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on alerts" ON public.alerts;
CREATE POLICY "Allow public read access on alerts" ON public.alerts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on device_health" ON public.device_health;
CREATE POLICY "Allow public read access on device_health" ON public.device_health FOR SELECT USING (true);

-- Allow telemetry insertion (from FastAPI gateway or Raspberry Pi)
DROP POLICY IF EXISTS "Allow telemetry insert on sensor_readings" ON public.sensor_readings;
CREATE POLICY "Allow telemetry insert on sensor_readings" ON public.sensor_readings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow device health insert on device_health" ON public.device_health;
CREATE POLICY "Allow device health insert on device_health" ON public.device_health FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow alert insert on alerts" ON public.alerts;
CREATE POLICY "Allow alert insert on alerts" ON public.alerts FOR INSERT WITH CHECK (true);

-- Allow operators to update alert verification status
DROP POLICY IF EXISTS "Allow alert update on alerts" ON public.alerts;
CREATE POLICY "Allow alert update on alerts" ON public.alerts FOR UPDATE USING (true) WITH CHECK (true);

-- 7. ENABLE REALTIME BROADCASTS IN SUPABASE REPLICATION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'stations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.stations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sensor_readings'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'device_health'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.device_health;
    END IF;
END $$;
