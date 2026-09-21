import type { Station, SensorReading, Alert, DeviceHealth } from '../types';
import { calculateActivityScore } from '../utils/scoringEngine';

export const INITIAL_STATIONS: Station[] = [
  {
    id: 'GG-001',
    device_id: 'RPI4-GG-PRABASIN',
    name: 'Pra River Sector Alpha',
    location_name: 'Pra River Basin — Lower Reach',
    latitude: 5.4120,
    longitude: -1.6210,
    status: 'ONLINE',
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'GG-002',
    device_id: 'RPI4-GG-ATEWAFST',
    name: 'Atewa Forest Fringe',
    location_name: 'Atewa Range Forest Reserve',
    latitude: 6.2310,
    longitude: -0.5820,
    status: 'ONLINE',
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'GG-003',
    device_id: 'RPI4-GG-TARKCOMM',
    name: 'Tarkwa Community Perimeter',
    location_name: 'Tarkwa North Buffer Zone',
    latitude: 5.3120,
    longitude: -1.9880,
    status: 'ONLINE',
    created_at: '2026-09-01T00:00:00Z',
  },
];

export const INITIAL_HEALTH: Record<string, DeviceHealth> = {
  'GG-001': {
    station_id: 'GG-001',
    timestamp: new Date().toISOString(),
    device_status: 'HEALTHY',
    network_status: '4G LTE',
    battery_level: 92,
    solar_charging: true,
    uptime_seconds: 432000,
  },
  'GG-002': {
    station_id: 'GG-002',
    timestamp: new Date().toISOString(),
    device_status: 'HEALTHY',
    network_status: 'LoRa',
    battery_level: 86,
    solar_charging: true,
    uptime_seconds: 604800,
  },
  'GG-003': {
    station_id: 'GG-003',
    timestamp: new Date().toISOString(),
    device_status: 'HEALTHY',
    network_status: 'Wi-Fi',
    battery_level: 98,
    solar_charging: false,
    uptime_seconds: 1209600,
  },
};

/**
 * Generates initial realistic historical data points for the past 2 hours
 */
export function generateInitialReadings(stationId: string, count: number = 24): SensorReading[] {
  const readings: SensorReading[] = [];
  const now = Date.now();
  const stepMs = 5 * 60 * 1000; // 5 min interval

  const station = INITIAL_STATIONS.find((s) => s.id === stationId) || INITIAL_STATIONS[0];

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs).toISOString();
    
    // Baseline fluctuation
    let sound_rms = 0.12 + Math.sin(i * 0.4) * 0.05 + (Math.random() * 0.04 - 0.02);
    let vibration_rms = 0.04 + Math.cos(i * 0.3) * 0.02 + (Math.random() * 0.02 - 0.01);
    let dominant_frequency = 420 + Math.random() * 150; // High ambient frequency (birds, wind)
    let rain_detected = false;

    // For GG-001, simulate an elevated bump 15 mins ago to demonstrate historical spike
    if (stationId === 'GG-001' && i >= 1 && i <= 3) {
      sound_rms = 0.58 + (Math.random() * 0.1);
      vibration_rms = 0.44 + (Math.random() * 0.08);
      dominant_frequency = 112 + Math.random() * 20; // low frequency diesel band
    }

    // Environmental readings
    const temperature = 26.5 + Math.sin(i * 0.2) * 1.5 + (Math.random() * 0.4 - 0.2);
    const humidity = 78 - Math.sin(i * 0.2) * 4 + (Math.random() * 1.5);
    const pressure = 1012.0 + Math.cos(i * 0.1) * 1.2;

    sound_rms = Math.max(0.05, Math.min(0.99, sound_rms));
    vibration_rms = Math.max(0.02, Math.min(0.95, vibration_rms));

    const scored = calculateActivityScore({
      sound_rms,
      dominant_frequency,
      vibration_rms,
      rain_detected,
    });

    readings.push({
      station_id: stationId,
      timestamp,
      sound_rms: Number(sound_rms.toFixed(3)),
      sound_db: scored.soundDb,
      dominant_frequency: Number(dominant_frequency.toFixed(1)),
      vibration_rms: Number(vibration_rms.toFixed(3)),
      temperature: Number(temperature.toFixed(1)),
      humidity: Number(humidity.toFixed(1)),
      pressure: Number(pressure.toFixed(1)),
      rain_detected,
      latitude: station.latitude,
      longitude: station.longitude,
      activity_score: scored.score,
      risk_level: scored.riskLevel,
    });
  }

  return readings;
}

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-2026-0091',
    station_id: 'GG-001',
    station_name: 'Pra River Sector Alpha',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    risk_score: 74,
    risk_level: 'HIGH',
    alert_type: 'MACHINERY_SUSPECTED',
    description: 'Possible machinery-related activity detected. Human verification required.',
    status: 'UNREVIEWED',
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    snapshot_readings: {
      sound_rms: 0.68,
      dominant_frequency: 114.2,
      vibration_rms: 0.52,
      rain_detected: false,
      temperature: 27.8,
    },
  },
  {
    id: 'ALT-2026-0084',
    station_id: 'GG-003',
    station_name: 'Tarkwa Community Perimeter',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    risk_score: 52,
    risk_level: 'ELEVATED',
    alert_type: 'ACOUSTIC_ANOMALY',
    description: 'Possible machinery-related activity detected. Human verification required.',
    status: 'RESOLVED',
    reviewer_notes: 'Verified via forestry ranger post: Local municipal road grader passing boundary road.',
    reviewed_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    snapshot_readings: {
      sound_rms: 0.55,
      dominant_frequency: 240.0,
      vibration_rms: 0.28,
      rain_detected: false,
      temperature: 29.1,
    },
  },
];
