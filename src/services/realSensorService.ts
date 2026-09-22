import { supabase, isSupabaseConfigured } from '../config/supabase';
import { apiService } from './apiService';
import type {
  Station,
  SensorReading,
  Alert,
  DeviceHealth,
  AlertStatus,
} from '../types';

type Listener = () => void;

// Pre-registered station blueprints matching supabase/schema.sql
export const REGISTERED_STATIONS: Station[] = [
  {
    id: 'GG-001',
    device_id: 'RPI4-GG-PRABASIN',
    name: 'Pra River Sector Alpha',
    location_name: 'Pra River Basin — Lower Reach',
    latitude: 5.4120,
    longitude: -1.6210,
    status: 'ONLINE',
    created_at: new Date().toISOString(),
  },
  {
    id: 'GG-002',
    device_id: 'RPI4-GG-ATEWAFST',
    name: 'Atewa Forest Fringe',
    location_name: 'Atewa Range Forest Reserve',
    latitude: 6.2310,
    longitude: -0.5820,
    status: 'ONLINE',
    created_at: new Date().toISOString(),
  },
  {
    id: 'GG-003',
    device_id: 'RPI4-GG-TARKCOMM',
    name: 'Tarkwa Community Perimeter',
    location_name: 'Tarkwa North Buffer Zone',
    latitude: 5.3120,
    longitude: -1.9880,
    status: 'ONLINE',
    created_at: new Date().toISOString(),
  },
];

class RealSensorService {
  private stations: Station[] = [...REGISTERED_STATIONS];
  private readingsByStation: Map<string, SensorReading[]> = new Map();
  private alerts: Alert[] = [];
  private healthByStation: Map<string, DeviceHealth> = new Map();
  private listeners: Set<Listener> = new Set();
  private realtimeChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
  private isConnected: boolean = false;
  private isApiConnected: boolean = false;
  private lastPacketTimestamp: string | null = null;

  constructor() {
    this.stations.forEach((st) => {
      this.readingsByStation.set(st.id, []);
      this.healthByStation.set(st.id, {
        station_id: st.id,
        timestamp: new Date().toISOString(),
        device_status: 'HEALTHY',
        network_status: '4G LTE',
        battery_level: 100,
        solar_charging: true,
        uptime_seconds: 0,
      });
    });

    // Initialize FastAPI and Supabase synchronization
    this.initDataSync();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in real sensor service listener:', err);
      }
    });
  }

  /**
   * Initializes data synchronization from FastAPI Gateway and Supabase Realtime
   */
  private async initDataSync(): Promise<void> {
    // 1. First attempt to load initial data via FastAPI Gateway
    try {
      const statusRes = await apiService.getSystemStatus();
      if (statusRes && statusRes.status === 'ONLINE') {
        this.isApiConnected = true;
        console.info('[GalamseyGuard] Connected to FastAPI Gateway:', statusRes.version);
      }

      // Fetch live stations via FastAPI
      const stationsData = await apiService.getStations();
      if (stationsData && stationsData.length > 0) {
        this.stations = stationsData;
        this.stations.forEach((st) => {
          if (!this.readingsByStation.has(st.id)) {
            this.readingsByStation.set(st.id, []);
          }
        });
      }

      // Fetch historical readings for each station via FastAPI
      for (const st of this.stations) {
        const readingsData = await apiService.getReadings(st.id, 50);
        if (readingsData && readingsData.length > 0) {
          this.readingsByStation.set(st.id, readingsData);
          this.lastPacketTimestamp = readingsData[readingsData.length - 1].timestamp;
        }
      }

      // Fetch alerts via FastAPI
      const alertsData = await apiService.getAlerts();
      if (alertsData && alertsData.length > 0) {
        this.alerts = alertsData;
      }

      // Fetch health via FastAPI
      for (const st of this.stations) {
        const healthData = await apiService.getStationHealth(st.id);
        if (healthData && healthData.battery_level !== undefined) {
          this.healthByStation.set(st.id, healthData);
        }
      }

      this.isConnected = true;
      this.notify();
    } catch (apiErr) {
      console.warn('[GalamseyGuard] FastAPI initial sync warning (falling back to direct Supabase):', apiErr);
      await this.initDirectSupabaseSync();
    }

    // 2. Connect Supabase Realtime WebSocket for instant streaming updates
    if (isSupabaseConfigured && supabase) {
      this.initRealtimeWebSocket();
    }
  }

  /**
   * Fallback to direct Supabase REST client if FastAPI is unavailable
   */
  private async initDirectSupabaseSync(): Promise<void> {
    if (!supabase) return;
    try {
      const { data: stationsData } = await supabase.from('stations').select('*').order('id');
      if (stationsData && stationsData.length > 0) {
        this.stations = stationsData as Station[];
        this.stations.forEach((st) => {
          if (!this.readingsByStation.has(st.id)) {
            this.readingsByStation.set(st.id, []);
          }
        });
      }

      for (const st of this.stations) {
        const { data: readingsData } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('station_id', st.id)
          .order('timestamp', { ascending: true })
          .limit(50);
        if (readingsData && readingsData.length > 0) {
          this.readingsByStation.set(st.id, readingsData as SensorReading[]);
          this.lastPacketTimestamp = readingsData[readingsData.length - 1].timestamp;
        }
      }

      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (alertsData) {
        this.alerts = alertsData.map((row: any) => ({
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

      this.isConnected = true;
      this.notify();
    } catch (err) {
      console.error('[GalamseyGuard] Direct Supabase sync error:', err);
    }
  }

  /**
   * Subscribes to Supabase Realtime WebSocket changes
   */
  private initRealtimeWebSocket(): void {
    if (!supabase) return;

    this.realtimeChannel = supabase
      .channel('realtime:galamsey-guard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          this.handleIncomingReading(payload.new as SensorReading);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          this.handleIncomingAlert(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'alerts' },
        (payload) => {
          this.handleUpdatedAlert(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'device_health' },
        (payload) => {
          const h = payload.new as DeviceHealth;
          this.healthByStation.set(h.station_id, h);
          this.notify();
        }
      )
      .subscribe((status) => {
        this.isConnected = status === 'SUBSCRIBED' || this.isApiConnected;
        this.notify();
      });
  }

  /**
   * Directly ingest a real sensor packet
   */
  public ingestRealReading(reading: SensorReading): void {
    this.handleIncomingReading(reading);
  }

  private handleIncomingReading(reading: SensorReading): void {
    const list = this.readingsByStation.get(reading.station_id) || [];
    const updated = [...list, reading].slice(-100);
    this.readingsByStation.set(reading.station_id, updated);
    this.lastPacketTimestamp = reading.timestamp;
    this.notify();
  }

  private handleIncomingAlert(raw: any): void {
    const alert: Alert = {
      id: raw.id,
      station_id: raw.station_id,
      station_name: this.getStation(raw.station_id)?.name || raw.station_id,
      timestamp: raw.timestamp,
      risk_score: Number(raw.risk_score),
      risk_level: raw.risk_level,
      alert_type: raw.alert_type,
      description: raw.description,
      status: raw.status,
      reviewer_notes: raw.reviewer_notes,
      reviewed_at: raw.reviewed_at,
      created_at: raw.created_at || raw.timestamp,
      updated_at: raw.updated_at || raw.timestamp,
      snapshot_readings: {
        sound_rms: Number(raw.snapshot_sound_rms || 0),
        dominant_frequency: Number(raw.snapshot_dominant_freq || 0),
        vibration_rms: Number(raw.snapshot_vibration_rms || 0),
        rain_detected: Boolean(raw.snapshot_rain),
        temperature: 28,
      },
    };

    this.alerts = [alert, ...this.alerts.filter((a) => a.id !== alert.id)];
    this.notify();
  }

  private handleUpdatedAlert(raw: any): void {
    this.alerts = this.alerts.map((a) => {
      if (a.id === raw.id) {
        return {
          ...a,
          status: raw.status,
          reviewer_notes: raw.reviewer_notes,
          reviewed_at: raw.reviewed_at,
          updated_at: raw.updated_at,
        };
      }
      return a;
    });
    this.notify();
  }

  public getStations(): Station[] {
    return [...this.stations];
  }

  public getStation(id: string): Station | undefined {
    return this.stations.find((s) => s.id === id);
  }

  public getLatestReading(stationId: string): SensorReading | undefined {
    const list = this.readingsByStation.get(stationId);
    return list && list.length > 0 ? list[list.length - 1] : undefined;
  }

  public getHistoricalReadings(stationId: string): SensorReading[] {
    return this.readingsByStation.get(stationId) || [];
  }

  public getAlerts(): Alert[] {
    return [...this.alerts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getHealth(stationId: string): DeviceHealth | undefined {
    return this.healthByStation.get(stationId);
  }

  /**
   * Update alert status via FastAPI backend (with fallback to Supabase)
   */
  public async updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    reviewerNotes?: string
  ): Promise<boolean> {
    const now = new Date().toISOString();

    // Optimistic local update
    this.alerts = this.alerts.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status,
          reviewer_notes: reviewerNotes || a.reviewer_notes,
          reviewed_at: now,
          updated_at: now,
        };
      }
      return a;
    });
    this.notify();

    // Send through FastAPI backend
    try {
      await apiService.updateAlertStatus(alertId, status, reviewerNotes);
      return true;
    } catch (apiErr) {
      console.warn('[GalamseyGuard] FastAPI update alert warning, attempting Supabase direct:', apiErr);
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase
            .from('alerts')
            .update({
              status,
              reviewer_notes: reviewerNotes,
              reviewed_at: now,
              updated_at: now,
            })
            .eq('id', alertId);
          return !error;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  public isConnectedToStream(): boolean {
    return this.isConnected || this.isApiConnected;
  }

  public isFastApiConnected(): boolean {
    return this.isApiConnected;
  }

  public getLastPacketTimestamp(): string | null {
    return this.lastPacketTimestamp;
  }

  public cleanup(): void {
    if (this.realtimeChannel && supabase) {
      supabase.removeChannel(this.realtimeChannel);
    }
  }
}

export const realSensorService = new RealSensorService();
