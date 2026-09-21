-- ==============================================================================
-- GalamseyGuard — PostgreSQL / Supabase Schema Definition
-- IoT-Based Environmental Activity Monitoring Prototype
-- ==============================================================================

-- 1. STATIONS TABLE
CREATE TABLE IF NOT EXISTS public.stations (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'GG-001'
    device_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SENSOR READINGS TABLE (Timescale / Time-series Telemetry)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    station_id VARCHAR(50) REFERENCES public.stations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sound_rms NUMERIC(6, 3) NOT NULL, -- 0.000 to 1.000
    dominant_frequency NUMERIC(6, 1) NOT NULL, -- In Hertz (e.g. 118.4 Hz)
    vibration_rms NUMERIC(6, 3) NOT NULL, -- 0.000 to 1.000
    temperature NUMERIC(4, 1) NOT NULL, -- In °C (e.g. 27.4)
    humidity NUMERIC(4, 1) NOT NULL, -- In % (e.g. 78.0)
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

-- Seed Data for Initial Prototype Stations
INSERT INTO public.stations (id, device_id, name, location_name, latitude, longitude, status)
VALUES
    ('GG-001', 'RPI4-GG-PRABASIN', 'Pra River Sector Alpha', 'Pra River Basin — Lower Reach', 5.4120, -1.6210, 'ONLINE'),
    ('GG-002', 'RPI4-GG-ATEWAFST', 'Atewa Forest Fringe', 'Atewa Range Forest Reserve', 6.2310, -0.5820, 'ONLINE'),
    ('GG-003', 'RPI4-GG-TARKCOMM', 'Tarkwa Community Perimeter', 'Tarkwa North Buffer Zone', 5.3120, -1.9880, 'ONLINE')
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime for all tables in Supabase replication publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.stations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_health;
