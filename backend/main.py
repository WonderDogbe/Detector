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


# ==============================================================================
# AUTHENTICATION DEPENDENCY
# ==============================================================================
def verify_device_token(x_device_token: Optional[str] = Header(None)):
    """Verifies device token if DEVICE_SECRET_TOKEN is configured."""
    if DEVICE_SECRET_TOKEN and x_device_token != DEVICE_SECRET_TOKEN:
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
