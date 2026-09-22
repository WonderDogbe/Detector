import type {
  Station,
  SensorReading,
  Alert,
  DeviceHealth,
  AlertStatus,
} from '../types';
import { realSensorService } from './realSensorService';

type Listener = () => void;

/**
 * SensorService Proxy (formerly SimulatorService)
 * All mock data, fake periodic auto-ticks, and synthetic sine waves have been REMOVED.
 * This service now operates exclusively with real physical sensor readings and live Supabase queries.
 */
class LiveSensorProxyService {
  public subscribe(listener: Listener): () => void {
    return realSensorService.subscribe(listener);
  }

  public getStations(): Station[] {
    return realSensorService.getStations();
  }

  public getStation(id: string): Station | undefined {
    return realSensorService.getStation(id);
  }

  public getLatestReading(stationId: string): SensorReading | undefined {
    return realSensorService.getLatestReading(stationId);
  }

  public getHistoricalReadings(stationId: string): SensorReading[] {
    return realSensorService.getHistoricalReadings(stationId);
  }

  public getAlerts(): Alert[] {
    return realSensorService.getAlerts();
  }

  public getHealth(stationId: string): DeviceHealth | undefined {
    return realSensorService.getHealth(stationId);
  }

  public isRunning(): boolean {
    return realSensorService.isConnectedToStream();
  }

  public updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    reviewerNotes?: string
  ): Promise<boolean> {
    return realSensorService.updateAlertStatus(alertId, status, reviewerNotes);
  }

  public ingestRealReading(reading: SensorReading): void {
    realSensorService.ingestRealReading(reading);
  }

  public createStation(station: {
    id: string;
    device_id: string;
    name: string;
    location_name: string;
    latitude: number;
    longitude: number;
  }): Promise<Station> {
    return realSensorService.createStation(station);
  }

  public getLastPacketTimestamp(): string | null {
    return realSensorService.getLastPacketTimestamp();
  }
}

export const simulatorService = new LiveSensorProxyService();
export const liveSensorService = simulatorService;
