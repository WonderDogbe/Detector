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

const CACHE_STORAGE_KEY = 'galamseyguard_telemetry_cache_v3';

class RealSensorService {
  private stations: Station[] = []; // Populated exclusively from DB — never hardcoded
  private readingsByStation: Map<string, SensorReading[]> = new Map();
  private alerts: Alert[] = [];
  private healthByStation: Map<string, DeviceHealth> = new Map();
  private listeners: Set<Listener> = new Set();
  private realtimeChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
  private isConnected: boolean = false;
  private isApiConnected: boolean = false;
  private hasInitialData: boolean = false;
  private lastPacketTimestamp: string | null = null;
  private syncIntervalId: any = null;

  constructor() {
    // No hardcoded stations — all data comes from Supabase/FastAPI

    // 1. Immediately restore cached snapshot from localStorage so page refresh has zero delay & zero mock flash
    this.restoreFromCache();

    // 2. Launch Realtime WebSocket (non-blocking)
    if (isSupabaseConfigured && supabase) {
      this.initRealtimeWebSocket();
    }

    // 3. Initial rapid aggregated data sync
    this.syncFast();

    // 4. Fast high-frequency background sync (every 2.5 seconds)
    this.syncIntervalId = setInterval(() => {
      this.syncFast();
    }, 2500);
  }

  private restoreFromCache(): void {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(CACHE_STORAGE_KEY) : null;
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (cached && cached.stations && Array.isArray(cached.stations) && cached.stations.length > 0) {
        this.stations = cached.stations;
        if (cached.readings) {
          Object.entries(cached.readings).forEach(([stId, list]: [string, any]) => {
            if (Array.isArray(list)) {
              this.readingsByStation.set(stId, list);
            }
          });
        }
        if (Array.isArray(cached.alerts)) {
          this.alerts = cached.alerts;
        }
        if (cached.health) {
          Object.entries(cached.health).forEach(([stId, h]: [string, any]) => {
            this.healthByStation.set(stId, h);
          });
        }
        if (cached.lastPacketTimestamp) {
          this.lastPacketTimestamp = cached.lastPacketTimestamp;
        }
        this.hasInitialData = true;
        this.isConnected = true;
      }
    } catch (e) {
      console.warn('[GalamseyGuard] Cache restore notice:', e);
    }
  }

  private saveToCache(): void {
    try {
      if (typeof window === 'undefined') return;
      const readingsObj: Record<string, SensorReading[]> = {};
      this.readingsByStation.forEach((readings, id) => {
        readingsObj[id] = readings.slice(-50);
      });
      const healthObj: Record<string, DeviceHealth> = {};
      this.healthByStation.forEach((h, id) => {
        healthObj[id] = h;
      });
      const snapshot = {
        stations: this.stations,
        readings: readingsObj,
        alerts: this.alerts,
        health: healthObj,
        lastPacketTimestamp: this.lastPacketTimestamp,
        savedAt: Date.now(),
      };
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage errors (quota/incognito)
    }
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

  private lastApiAttemptTime: number = 0;
  private isApiDown: boolean = false;

  /**
   * Ultra-fast aggregated telemetry synchronization
   */
  public async syncFast(): Promise<void> {
    // If backend is known to be down, wait 10s before retrying to avoid ECONNREFUSED terminal noise
    if (this.isApiDown && Date.now() - this.lastApiAttemptTime < 10000) {
      await this.initDirectSupabaseSync();
      return;
    }

    try {
      this.lastApiAttemptTime = Date.now();
      const syncData = await apiService.getDashboardSync();
      if (syncData && syncData.status === 'ONLINE') {
        this.isApiConnected = true;
        this.isApiDown = false;

        // 1. Stations — always replace from DB (even if empty, to clear stale data)
        {
          const uniqueMap = new Map<string, Station>();
          (syncData.stations || []).forEach((st) => {
            if (!uniqueMap.has(st.id)) uniqueMap.set(st.id, st);
          });
          this.stations = Array.from(uniqueMap.values());
        }

        // 2. Recent readings grouped by station
        const newMap = new Map<string, SensorReading[]>();
        this.stations.forEach((st) => newMap.set(st.id, []));
        if (syncData.readings && syncData.readings.length > 0) {
          syncData.readings.forEach((r) => {
            const list = newMap.get(r.station_id) || [];
            list.push(r);
            newMap.set(r.station_id, list);
          });
          this.lastPacketTimestamp =
            syncData.readings[syncData.readings.length - 1].timestamp;
        } else {
          this.lastPacketTimestamp = null;
        }
        newMap.forEach((readings, stId) => {
          this.readingsByStation.set(stId, readings);
        });

        // 3. Alerts
        if (syncData.alerts) {
          this.alerts = syncData.alerts.map((row: any) => ({
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

        // 4. Device Health
        if (syncData.health) {
          syncData.health.forEach((h: DeviceHealth) => {
            this.healthByStation.set(h.station_id, h);
          });
        }

        this.isConnected = true;
        this.hasInitialData = true;
        this.saveToCache();
        this.notify();
        return;
      }
    } catch {
      this.isApiDown = true;
      this.isApiConnected = false;
      // Fall back directly to Supabase sync
      await this.initDirectSupabaseSync();
    }
  }

  /**
   * Fallback to direct Supabase REST client
   */
  private async initDirectSupabaseSync(): Promise<void> {
    if (!supabase) return;
    try {
      const { data: stationsData } = await supabase.from('stations').select('*').order('id');
      // Always replace stations from DB — even empty response clears stale in-memory data
      {
        const uniqueMap = new Map<string, Station>();
        (stationsData as Station[] || []).forEach((st) => {
          if (!uniqueMap.has(st.id)) uniqueMap.set(st.id, st);
        });
        this.stations = Array.from(uniqueMap.values());
        // Reset readings map to match current station list exactly
        const newReadingsMap = new Map<string, SensorReading[]>();
        this.stations.forEach((st) => {
          newReadingsMap.set(st.id, this.readingsByStation.get(st.id) || []);
        });
        this.readingsByStation = newReadingsMap;
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
        } else {
          this.readingsByStation.set(st.id, []);
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
      this.hasInitialData = true;
      this.saveToCache();
      this.notify();
    } catch (err) {
      console.error('[GalamseyGuard] Direct Supabase sync error:', err);
    }
  }

  public hasLoaded(): boolean {
    return this.hasInitialData;
  }

  /**
   * Subscribes to Supabase Realtime WebSocket changes
   */
  private initRealtimeWebSocket(): void {
    if (!supabase) return;
    if (this.realtimeChannel) {
      return; // Channel already subscribed
    }

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
        { event: 'INSERT', schema: 'public', table: 'stations' },
        (payload) => {
          const newStation = payload.new as Station;
          if (!this.stations.some((s) => s.id === newStation.id)) {
            this.stations = [...this.stations, newStation];
            this.readingsByStation.set(newStation.id, []);
            this.notify();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stations' },
        (payload) => {
          const updated = payload.new as Station;
          this.stations = this.stations.map((s) => (s.id === updated.id ? { ...s, ...updated } : s));
          this.saveToCache();
          this.notify();
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
   * Create and register a new station
   */
  public async createStation(station: {
    id: string;
    device_id: string;
    name: string;
    location_name: string;
    latitude: number;
    longitude: number;
  }): Promise<Station> {
    const newStation: Station = {
      ...station,
      id: station.id.trim().toUpperCase(),
      status: 'ONLINE',
      created_at: new Date().toISOString(),
    };

    // Optimistically update in memory
    if (!this.stations.some((s) => s.id === newStation.id)) {
      this.stations = [...this.stations, newStation];
      this.readingsByStation.set(newStation.id, []);
      this.healthByStation.set(newStation.id, {
        station_id: newStation.id,
        timestamp: new Date().toISOString(),
        device_status: 'HEALTHY',
        network_status: '4G LTE',
        battery_level: 100,
        solar_charging: true,
        uptime_seconds: 0,
      });
      this.saveToCache();
      this.notify();
    }

    try {
      const created = await apiService.createStation(newStation);
      await this.syncFast();
      this.saveToCache();
      return created;
    } catch (err) {
      console.warn('[GalamseyGuard] FastAPI station creation warning:', err);
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.from('stations').insert(newStation).select();
        if (data && data.length > 0) {
          this.saveToCache();
          return data[0] as Station;
        }
      }
      return newStation;
    }
  }

  /**
   * Update station information (name, location, coordinates, status)
   */
  public async updateStation(
    stationId: string,
    updates: {
      name?: string;
      location_name?: string;
      latitude?: number;
      longitude?: number;
      status?: string;
    }
  ): Promise<Station | null> {
    // Optimistically update in memory
    let updatedStation: Station | null = null;
    this.stations = this.stations.map((s) => {
      if (s.id === stationId) {
        const merged: Station = {
          ...s,
          ...updates,
          status: (updates.status as Station['status']) || s.status,
        };
        updatedStation = merged;
        return merged;
      }
      return s;
    });

    this.saveToCache();
    this.notify();

    // Call API service
    try {
      const res = await apiService.updateStation(stationId, updates);
      if (res) {
        this.stations = this.stations.map((s) => (s.id === stationId ? { ...s, ...res } : s));
        this.saveToCache();
        this.notify();
        return res;
      }
    } catch (err) {
      console.warn('[GalamseyGuard] FastAPI updateStation warning, attempting Supabase direct:', err);
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('stations')
          .update(updates)
          .eq('id', stationId)
          .select();
        if (!error && data && data.length > 0) {
          const directUpdated = data[0] as Station;
          this.stations = this.stations.map((s) => (s.id === stationId ? directUpdated : s));
          this.saveToCache();
          this.notify();
          return directUpdated;
        }
      }
    }
    return updatedStation;
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
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    if (this.realtimeChannel && supabase) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}

export const realSensorService = new RealSensorService();
