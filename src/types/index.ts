export type RiskLevel = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export type AlertStatus =
  | 'UNREVIEWED'
  | 'ACKNOWLEDGED'
  | 'UNDER REVIEW'
  | 'RESOLVED'
  | 'FALSE POSITIVE';

export type AlertType =
  | 'MACHINERY_SUSPECTED'
  | 'ELEVATED_VIBRATION'
  | 'ACOUSTIC_ANOMALY'
  | 'WEATHER_DISTURBANCE';

export interface Station {
  id: string; // e.g., 'GG-001'
  device_id: string;
  name: string; // e.g., 'River Basin Station'
  location_name: string; // e.g., 'Pra River Basin — Sector Alpha'
  latitude: number;
  longitude: number;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  created_at: string;
}

export interface SensorReading {
  id?: string | number;
  station_id: string;
  timestamp: string; // ISO 8601 string
  sound_rms: number; // 0.0 to 1.0 (normalized acoustic RMS)
  sound_db?: number; // Decibel representation (~30 to 105 dB)
  dominant_frequency: number; // in Hz (e.g., 118.4 Hz)
  vibration_rms: number; // 0.0 to 1.0 (tri-axial acceleration magnitude)
  temperature: number; // in °C (e.g., 27.4)
  humidity: number; // in % (e.g., 78)
  pressure: number; // in hPa (e.g., 1012.2)
  rain_detected: boolean; // boolean
  latitude: number;
  longitude: number;
  created_at?: string;
  
  // Evaluated attributes computed by scoring engine
  activity_score?: number; // 0 - 100
  risk_level?: RiskLevel;
}

export interface Alert {
  id: string;
  station_id: string;
  station_name?: string;
  timestamp: string;
  risk_score: number;
  risk_level: RiskLevel;
  alert_type: AlertType;
  description: string;
  status: AlertStatus;
  reviewer_notes?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  snapshot_readings: {
    sound_rms: number;
    dominant_frequency: number;
    vibration_rms: number;
    rain_detected: boolean;
    temperature: number;
  };
}

export interface DeviceHealth {
  station_id: string;
  timestamp: string;
  device_status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  network_status: '4G LTE' | 'LoRa' | 'Wi-Fi' | 'DEGRADED';
  battery_level: number; // 0 - 100 %
  solar_charging: boolean;
  uptime_seconds: number;
}

export type SimulationScenario =
  | 'NORMAL'
  | 'RAIN'
  | 'VEHICLE'
  | 'MACHINERY'
  | 'CONSTRUCTION';

export interface ScenarioDefinition {
  id: SimulationScenario;
  title: string;
  description: string;
  sound_range: [number, number];
  freq_range: [number, number];
  vibration_range: [number, number];
  rain: boolean;
  expected_score: [number, number];
  expected_level: RiskLevel;
}
