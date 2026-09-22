/**
 * GalamseyGuard — Frontend API Client
 * Connects React UI to the FastAPI Ingestion Gateway (http://localhost:8000)
 */

import type {
  Station,
  SensorReading,
  Alert,
  AlertStatus,
  DeviceHealth,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface SystemStatusResponse {
  status: string;
  version: string;
  backend: string;
  database: string;
  supabase_connected: boolean;
  registered_stations: number;
  timestamp: string;
}

export interface IngestResponse {
  success: boolean;
  station_id: string;
  activity_score: number;
  risk_level: string;
  timestamp: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    // If running in dev with Vite proxy, use /api; otherwise use direct URL or relative
    this.baseUrl = API_BASE ? API_BASE.replace(/\/+$/, '') : '';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error [${response.status}] ${endpoint}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Health and system connection check
   */
  public async getSystemStatus(): Promise<SystemStatusResponse> {
    return this.request<SystemStatusResponse>('/api/v1/system/status');
  }

  /**
   * Fetch all registered telemetry monitoring stations
   */
  public async getStations(): Promise<Station[]> {
    return this.request<Station[]>('/api/v1/stations');
  }

  /**
   * Fetch historical sensor readings for a station
   */
  public async getReadings(
    stationId?: string,
    limit: number = 50
  ): Promise<SensorReading[]> {
    const query = new URLSearchParams();
    if (stationId) query.append('station_id', stationId);
    if (limit) query.append('limit', limit.toString());

    return this.request<SensorReading[]>(`/api/v1/readings?${query.toString()}`);
  }

  /**
   * Fetch logged alerts
   */
  public async getAlerts(
    statusFilter?: string,
    limit: number = 50
  ): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') query.append('status_filter', statusFilter);
    if (limit) query.append('limit', limit.toString());

    const data = await this.request<any[]>(`/api/v1/alerts?${query.toString()}`);
    return data.map((row) => ({
      ...row,
      snapshot_readings: {
        sound_rms: Number(row.snapshot_sound_rms || 0),
        dominant_frequency: Number(row.snapshot_dominant_freq || 0),
        vibration_rms: Number(row.snapshot_vibration_rms || 0),
        rain_detected: Boolean(row.snapshot_rain),
        temperature: 28,
      },
    }));
  }

  /**
   * Update alert review status (Human verification)
   */
  public async updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    reviewerNotes?: string
  ): Promise<{ success: boolean; alert_id: string }> {
    return this.request<{ success: boolean; alert_id: string }>(
      `/api/v1/alerts/${alertId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          reviewer_notes: reviewerNotes || null,
        }),
      }
    );
  }

  /**
   * Fetch station hardware telemetry (battery, solar, network)
   */
  public async getStationHealth(stationId: string): Promise<DeviceHealth> {
    return this.request<DeviceHealth>(`/api/v1/health/${stationId}`);
  }

  /**
   * Send live sensor reading packet to FastAPI gateway
   */
  public async sendTelemetryPacket(
    payload: {
      station_id: string;
      sound_rms: number;
      dominant_frequency: number;
      vibration_rms: number;
      temperature: number;
      humidity: number;
      pressure: number;
      rain_detected: boolean;
      latitude: number;
      longitude: number;
    }
  ): Promise<IngestResponse> {
    return this.request<IngestResponse>('/api/v1/telemetry', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const apiService = new ApiService();
