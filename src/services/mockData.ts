import type { Station, DeviceHealth } from '../types';

/**
 * Default station registry definitions matching the database schema.
 * Note: All mock telemetry generators and simulated sine waves have been removed.
 * Telemetry is now populated exclusively by physical sensor nodes and live Supabase queries.
 */
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
    battery_level: 100,
    solar_charging: true,
    uptime_seconds: 0,
  },
  'GG-002': {
    station_id: 'GG-002',
    timestamp: new Date().toISOString(),
    device_status: 'HEALTHY',
    network_status: 'LoRa',
    battery_level: 100,
    solar_charging: true,
    uptime_seconds: 0,
  },
  'GG-003': {
    station_id: 'GG-003',
    timestamp: new Date().toISOString(),
    device_status: 'HEALTHY',
    network_status: 'Wi-Fi',
    battery_level: 100,
    solar_charging: true,
    uptime_seconds: 0,
  },
};
