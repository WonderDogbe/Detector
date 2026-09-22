#!/usr/bin/env python3
"""
==============================================================================
GalamseyGuard — FastAPI Device Ingestion Gateway
Decoupled Cloud Bridge between Raspberry Pi & Supabase
==============================================================================

Responsibilities:
  - Ingests HTTPS sensor telemetry from remote Raspberry Pi units
  - Validates payload schemas using Pydantic
  - Authenticates device requests (via X-Device-Token or API Key)
  - Inserts validated records into Supabase PostgreSQL tables
  - Automatically evaluates risk score and generates human verification alerts
  - Relays device health telemetry (battery, solar charging, network, uptime)
"""

import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY", "")
DEVICE_SECRET_TOKEN = os.getenv("DEVICE_SECRET_TOKEN", "")

app = FastAPI(
    title="GalamseyGuard Device Ingestion API",
    description="FastAPI ingestion bridge between Raspberry Pi edge devices and Supabase PostgreSQL",
    version="1.0.0",
)

# Enable CORS for React dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_client: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"[Supabase] Connected to {SUPABASE_URL}")
    except Exception as err:
        print(f"[Supabase Warning] Could not initialize client: {err}")
else:
    print("[Supabase Warning] Credentials not configured. Telemetry will be validated in memory.")


# ==============================================================================
# PYDANTIC DATA SCHEMAS (SECTION 8 COMPLIANT)
# ==============================================================================
class SensorReadingPayload(BaseModel):
    station_id: str = Field(..., description="Unique station ID (e.g., GG-001)")
    sound_rms: float = Field(..., ge=0.0, le=1.0, description="Normalized acoustic RMS amplitude")
    sound_db: Optional[float] = Field(None, description="Sound level in Decibels")
    dominant_frequency: float = Field(..., ge=0.0, description="FFT spectral peak in Hertz")
    vibration_rms: float = Field(..., ge=0.0, le=1.0, description="Tri-axial resultant vibration RMS")
    temperature: float = Field(..., description="Ambient temperature in °C")
    humidity: float = Field(..., ge=0.0, le=100.0, description="Relative humidity %")
    pressure: float = Field(..., description="Barometric pressure in hPa")
    rain_detected: bool = Field(False, description="Rain sensor digital detection state")
    latitude: float = Field(..., description="GPS Latitude")
    longitude: float = Field(..., description="GPS Longitude")
    activity_score: Optional[int] = Field(None, ge=0, le=100, description="Multi-signal activity score")
    risk_level: Optional[str] = Field(None, description="NORMAL | ELEVATED | HIGH | CRITICAL")
    timestamp: Optional[str] = Field(None, description="ISO 8601 UTC timestamp")


class DeviceHealthPayload(BaseModel):
    station_id: str = Field(..., description="Station ID")
    battery_level: float = Field(..., ge=0.0, le=100.0, description="Battery level %")
    solar_charging: bool = Field(True, description="Solar charging state")
    device_status: str = Field("HEALTHY", description="HEALTHY | DEGRADED | CRITICAL")
    network_status: str = Field("4G LTE", description="4G LTE | LoRa | Wi-Fi")
    uptime_seconds: int = Field(0, description="Uptime in seconds")


class UpdateAlertPayload(BaseModel):
    status: str = Field(..., description="UNREVIEWED | ACKNOWLEDGED | UNDER REVIEW | RESOLVED | FALSE POSITIVE")
    reviewer_notes: Optional[str] = Field(None, description="Operator review notes")


class CreateStationPayload(BaseModel):
    id: str = Field(..., description="Unique Station ID (e.g. GG-004)")
    device_id: str = Field(..., description="Hardware Identifier (e.g. RPI4-GG-ANKOBRA)")
    name: str = Field(..., description="Display Name (e.g. Ankobra River Confluence)")
    location_name: str = Field(..., description="Geographic Basin / Sector")
    latitude: float = Field(..., description="Station Latitude Coordinate")
    longitude: float = Field(..., description="Station Longitude Coordinate")
    status: str = Field("ONLINE", description="ONLINE | OFFLINE | MAINTENANCE")


# ==============================================================================
# AUTHENTICATION DEPENDENCY
# ==============================================================================
def verify_device_token(x_device_token: Optional[str] = Header(None)):
    """Verifies device token if a custom non-default DEVICE_SECRET_TOKEN is configured."""
    if DEVICE_SECRET_TOKEN and DEVICE_SECRET_TOKEN not in ("device_secret_token_optional", ""):
        if x_device_token != DEVICE_SECRET_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing X-Device-Token header",
            )
    return True


# ==============================================================================
# INGESTION & DATA LOGIC
# ==============================================================================
def compute_server_score(reading: SensorReadingPayload) -> tuple[int, str]:
    """Computes/validates activity score adhering to Section 8 multi-signal fusion."""
    acoustic_score = min(100.0, reading.sound_rms * 100.0)
    if 50.0 <= reading.dominant_frequency <= 220.0 and reading.sound_rms > 0.35:
        acoustic_score = min(100.0, acoustic_score * 1.35)

    vibration_score = min(100.0, reading.vibration_rms * 100.0)
    raw = (acoustic_score * 0.50) + (vibration_score * 0.35) + 5.0
    if reading.rain_detected:
        raw *= 0.75

    score = int(max(0, min(100, round(raw))))
    if score >= 80:
        level = "CRITICAL"
    elif score >= 60:
        level = "HIGH"
    elif score >= 35:
        level = "ELEVATED"
    else:
        level = "NORMAL"

    return score, level


# Pre-registered stations fallback
REGISTERED_STATIONS = [
    {
        "id": "GG-001",
        "device_id": "RPI4-GG-PRABASIN",
        "name": "Pra River Sector Alpha",
        "location_name": "Pra River Basin — Lower Reach",
        "latitude": 5.4120,
        "longitude": -1.6210,
        "status": "ONLINE",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "GG-002",
        "device_id": "RPI4-GG-ATEWAFST",
        "name": "Atewa Forest Fringe",
        "location_name": "Atewa Range Forest Reserve",
        "latitude": 6.2310,
        "longitude": -0.5820,
        "status": "ONLINE",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "GG-003",
        "device_id": "RPI4-GG-TARKCOMM",
        "name": "Tarkwa Community Perimeter",
        "location_name": "Tarkwa North Buffer Zone",
        "latitude": 5.3120,
        "longitude": -1.9880,
        "status": "ONLINE",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]


# ==============================================================================
# API ENDPOINTS
# ==============================================================================
@app.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "GalamseyGuard FastAPI Ingestion Gateway",
        "supabase_connected": supabase_client is not None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/system/status")
def system_status():
    """Returns gateway status, active nodes, and connectivity telemetry."""
    return {
        "status": "ONLINE",
        "version": "1.0.0",
        "backend": "FastAPI (Python 3.11+)",
        "database": "Supabase PostgreSQL (Realtime enabled)",
        "supabase_connected": supabase_client is not None,
        "registered_stations": len(REGISTERED_STATIONS),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/dashboard/sync")
async def get_dashboard_sync():
    """Ultra-fast aggregated dashboard telemetry payload in a single query."""
    stations = REGISTERED_STATIONS
    readings = []
    alerts = []
    health = []

    if supabase_client:
        try:
            st_res = supabase_client.table("stations").select("*").order("id").execute()
            if st_res.data and len(st_res.data) > 0:
                stations = st_res.data
        except Exception as err:
            print(f"[Sync Stations Error] {err}")

        try:
            r_res = supabase_client.table("sensor_readings").select("*").order("timestamp", desc=True).limit(60).execute()
            readings = r_res.data or []
            readings.reverse()
        except Exception as err:
            print(f"[Sync Readings Error] {err}")

        try:
            a_res = supabase_client.table("alerts").select("*").order("timestamp", desc=True).limit(50).execute()
            alerts = a_res.data or []
        except Exception as err:
            print(f"[Sync Alerts Error] {err}")

        try:
            h_res = supabase_client.table("device_health").select("*").order("timestamp", desc=True).limit(20).execute()
            health = h_res.data or []
        except Exception as err:
            print(f"[Sync Health Error] {err}")

    return {
        "status": "ONLINE",
        "stations": stations,
        "readings": readings,
        "alerts": alerts,
        "health": health,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/stations")
async def get_stations():
    """Returns all registered monitoring stations."""
    if supabase_client:
        try:
            res = supabase_client.table("stations").select("*").order("id").execute()
            if res.data and len(res.data) > 0:
                return res.data
        except Exception as err:
            print(f"[Supabase Stations Error] {err}")
    return REGISTERED_STATIONS


@app.post("/api/v1/stations", status_code=status.HTTP_201_CREATED)
async def create_station(payload: CreateStationPayload):
    """Registers a new physical sensor monitoring station in Supabase."""
    station_id = payload.id.strip().upper()
    station_data = {
        "id": station_id,
        "device_id": payload.device_id.strip(),
        "name": payload.name.strip(),
        "location_name": payload.location_name.strip(),
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "status": payload.status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if supabase_client:
        try:
            # Check for conflict
            existing = supabase_client.table("stations").select("id").eq("id", station_id).execute()
            if existing.data and len(existing.data) > 0:
                raise HTTPException(status_code=400, detail=f"Station with ID '{station_id}' already exists")

            res = supabase_client.table("stations").insert(station_data).execute()
            if res.data and len(res.data) > 0:
                print(f"[STATION REGISTERED] {station_id} — {station_data['name']}")
                return res.data[0]
        except HTTPException:
            raise
        except Exception as err:
            print(f"[Supabase Create Station Error] {err}")
            raise HTTPException(status_code=500, detail=f"Failed to register station: {err}")

    # Fallback to in-memory list
    REGISTERED_STATIONS.append(station_data)
    return station_data


@app.get("/api/v1/readings")
async def get_readings(station_id: Optional[str] = None, limit: int = 50):
    """Returns historical sensor readings with optional station filter."""
    if not supabase_client:
        return []
    try:
        query = supabase_client.table("sensor_readings").select("*")
        if station_id:
            query = query.eq("station_id", station_id)
        res = query.order("timestamp", desc=True).limit(limit).execute()
        # Return sorted chronologically (ascending) for time-series charts
        data = res.data or []
        data.reverse()
        return data
    except Exception as err:
        print(f"[Supabase Readings Error] {err}")
        return []


@app.get("/api/v1/alerts")
async def get_alerts(status_filter: Optional[str] = None, limit: int = 50):
    """Returns logged security and anomaly alerts."""
    if not supabase_client:
        return []
    try:
        query = supabase_client.table("alerts").select("*")
        if status_filter and status_filter != "ALL":
            query = query.eq("status", status_filter)
        res = query.order("timestamp", desc=True).limit(limit).execute()
        return res.data or []
    except Exception as err:
        print(f"[Supabase Alerts Error] {err}")
        return []


@app.patch("/api/v1/alerts/{alert_id}")
async def update_alert_status(alert_id: str, payload: UpdateAlertPayload):
    """Human verification status update for an alert."""
    if not supabase_client:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        update_data = {
            "status": payload.status,
            "updated_at": now_iso,
        }
        if payload.reviewer_notes:
            update_data["reviewer_notes"] = payload.reviewer_notes
            update_data["reviewed_at"] = now_iso

        res = supabase_client.table("alerts").update(update_data).eq("id", alert_id).execute()
        return {"success": True, "alert_id": alert_id, "updated": res.data}
    except Exception as err:
        print(f"[Supabase Alert Update Error] {err}")
        raise HTTPException(status_code=500, detail=f"Failed to update alert: {err}")


@app.get("/api/v1/health/{station_id}")
async def get_station_health(station_id: str):
    """Returns latest battery and network telemetry for a station."""
    if not supabase_client:
        return {
            "station_id": station_id,
            "battery_level": 98.0,
            "solar_charging": True,
            "device_status": "HEALTHY",
            "network_status": "4G LTE",
            "uptime_seconds": 3600,
        }
    try:
        res = supabase_client.table("device_health").select("*").eq("station_id", station_id).order("timestamp", desc=True).limit(1).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return {
            "station_id": station_id,
            "battery_level": 98.0,
            "solar_charging": True,
            "device_status": "HEALTHY",
            "network_status": "4G LTE",
            "uptime_seconds": 0,
        }
    except Exception as err:
        print(f"[Supabase Health Error] {err}")
        return {}


@app.post("/api/v1/telemetry", status_code=status.HTTP_201_CREATED)
async def ingest_sensor_reading(
    payload: SensorReadingPayload,
    authorized: bool = Depends(verify_device_token),
):
    """
    Ingests physical sensor reading from Raspberry Pi.
    Validates payload, writes to Supabase, and generates alerts if score >= 60.
    """
    now_iso = payload.timestamp or datetime.now(timezone.utc).isoformat()
    score, level = compute_server_score(payload)

    reading_dict = {
        "station_id": payload.station_id,
        "timestamp": now_iso,
        "sound_rms": round(payload.sound_rms, 3),
        "dominant_frequency": round(payload.dominant_frequency, 1),
        "vibration_rms": round(payload.vibration_rms, 3),
        "temperature": round(payload.temperature, 1),
        "humidity": round(payload.humidity, 1),
        "pressure": round(payload.pressure, 1),
        "rain_detected": payload.rain_detected,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "activity_score": score,
        "risk_level": level,
    }

    # Insert into Supabase
    if supabase_client:
        try:
            res = supabase_client.table("sensor_readings").insert(reading_dict).execute()
        except Exception as err:
            print(f"[Supabase Error] Ingestion failed: {err}")
            raise HTTPException(status_code=500, detail=f"Database write error: {err}")

        # Automated alert trigger if risk score is high
        if score >= 60:
            alert_id = f"ALT-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
            alert_payload = {
                "id": alert_id,
                "station_id": payload.station_id,
                "timestamp": now_iso,
                "risk_score": score,
                "risk_level": level,
                "alert_type": "MACHINERY_SUSPECTED" if payload.vibration_rms > 0.3 else "ACOUSTIC_ANOMALY",
                "description": "Possible machinery-related activity detected. Human verification required.",
                "status": "UNREVIEWED",
                "snapshot_sound_rms": payload.sound_rms,
                "snapshot_dominant_freq": payload.dominant_frequency,
                "snapshot_vibration_rms": payload.vibration_rms,
                "snapshot_rain": payload.rain_detected,
            }
            try:
                supabase_client.table("alerts").insert(alert_payload).execute()
                print(f"[ALERT CREATED] {alert_id} for station {payload.station_id} (Score: {score})")
            except Exception as alert_err:
                print(f"[Alert Error] Failed to insert alert: {alert_err}")

    return {
        "success": True,
        "station_id": payload.station_id,
        "activity_score": score,
        "risk_level": level,
        "timestamp": now_iso,
    }


@app.post("/api/v1/health", status_code=status.HTTP_201_CREATED)
async def ingest_device_health(
    payload: DeviceHealthPayload,
    authorized: bool = Depends(verify_device_token),
):
    """Ingests battery, network, and uptime diagnostics from Raspberry Pi."""
    now_iso = datetime.now(timezone.utc).isoformat()
    health_dict = {
        "station_id": payload.station_id,
        "timestamp": now_iso,
        "device_status": payload.device_status,
        "network_status": payload.network_status,
        "battery_level": payload.battery_level,
        "solar_charging": payload.solar_charging,
        "uptime_seconds": payload.uptime_seconds,
    }

    if supabase_client:
        try:
            supabase_client.table("device_health").insert(health_dict).execute()
        except Exception as err:
            raise HTTPException(status_code=500, detail=f"Database write error: {err}")

    return {"success": True, "station_id": payload.station_id, "timestamp": now_iso}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print(f"Starting GalamseyGuard FastAPI Gateway on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

