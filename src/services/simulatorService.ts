import type {
  Station,
  SensorReading,
  Alert,
  DeviceHealth,
  SimulationScenario,
} from '../types';
import {
  INITIAL_STATIONS,
  INITIAL_HEALTH,
  INITIAL_ALERTS,
  generateInitialReadings,
} from './mockData';
import { calculateActivityScore } from '../utils/scoringEngine';

type Listener = () => void;

class SimulatorService {
  private stations: Station[] = [...INITIAL_STATIONS];
  private readingsByStation: Map<string, SensorReading[]> = new Map();
  private alerts: Alert[] = [...INITIAL_ALERTS];
  private healthByStation: Map<string, DeviceHealth> = new Map();
  private listeners: Set<Listener> = new Set();
  private intervalId: number | null = null;
  private activeScenarioByStation: Map<string, SimulationScenario> = new Map();
  private scenarioExpiry: Map<string, number> = new Map();
  private isAutoTicking: boolean = true;

  constructor() {
    // Initialize historical readings
    this.stations.forEach((station) => {
      this.readingsByStation.set(station.id, generateInitialReadings(station.id, 20));
      this.activeScenarioByStation.set(station.id, 'NORMAL');
      if (INITIAL_HEALTH[station.id]) {
        this.healthByStation.set(station.id, { ...INITIAL_HEALTH[station.id] });
      }
    });

    // Start auto tick interval (every 3.5 seconds)
    this.startAutoTick();
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
        console.error('Error in simulator listener:', err);
      }
    });
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
    // Sort descending by timestamp
    return [...this.alerts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getHealth(stationId: string): DeviceHealth | undefined {
    return this.healthByStation.get(stationId);
  }

  public getActiveScenario(stationId: string): SimulationScenario {
    return this.activeScenarioByStation.get(stationId) || 'NORMAL';
  }

  public startAutoTick(): void {
    if (this.intervalId !== null) return;
    this.isAutoTicking = true;
    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 3500);
  }

  public stopAutoTick(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isAutoTicking = false;
    this.notify();
  }

  public isRunning(): boolean {
    return this.isAutoTicking;
  }

  /**
   * Triggers a specific scenario on a station (or all stations)
   */
  public triggerScenario(
    scenario: SimulationScenario,
    stationId?: string,
    durationSeconds: number = 45
  ): void {
    const targetStations = stationId
      ? [stationId]
      : this.stations.map((s) => s.id);

    const expiryTime = Date.now() + durationSeconds * 1000;

    targetStations.forEach((id) => {
      this.activeScenarioByStation.set(id, scenario);
      this.scenarioExpiry.set(id, expiryTime);
    });

    // Execute immediate tick to reflect changes right away
    this.tick();
  }

  /**
   * Reset all stations to Normal Ambient
   */
  public resetToNormal(): void {
    this.stations.forEach((s) => {
      this.activeScenarioByStation.set(s.id, 'NORMAL');
      this.scenarioExpiry.delete(s.id);
    });
    this.tick();
  }

  /**
   * Advances simulation time by one step
   */
  public tick(): void {
    const now = new Date();
    const nowIso = now.toISOString();

    this.stations.forEach((station) => {
      const expiry = this.scenarioExpiry.get(station.id);

      // Check if scenario expired
      if (expiry && Date.now() > expiry) {
        this.activeScenarioByStation.set(station.id, 'NORMAL');
        this.scenarioExpiry.delete(station.id);
      }

      const reading = this.generateReadingForScenario(
        station,
        nowIso,
        this.activeScenarioByStation.get(station.id) || 'NORMAL'
      );

      // Append to historical list
      const history = this.readingsByStation.get(station.id) || [];
      const updatedHistory = [...history, reading].slice(-35); // Keep last 35 points
      this.readingsByStation.set(station.id, updatedHistory);

      // Check if alert needs to be generated
      if (reading.activity_score && reading.activity_score >= 61) {
        this.evaluateAlertTrigger(station, reading);
      }
    });

    this.notify();
  }

  private generateReadingForScenario(
    station: Station,
    timestamp: string,
    scenario: SimulationScenario
  ): SensorReading {
    let sound_rms = 0.14;
    let dominant_frequency = 410;
    let vibration_rms = 0.04;
    let rain_detected = false;
    let temperature = 27.2;
    let humidity = 76;
    let pressure = 1012.4;

    const jitter = (range: number) => (Math.random() * 2 - 1) * range;

    switch (scenario) {
      case 'RAIN':
        // Scenario 2: Rain (High sound, low vibration, rain true)
        sound_rms = 0.62 + jitter(0.06);
        dominant_frequency = 780 + jitter(120); // Rain hiss
        vibration_rms = 0.05 + jitter(0.02);
        rain_detected = true;
        temperature = 24.5 + jitter(0.5);
        humidity = 94 + jitter(2);
        pressure = 1008.2 + jitter(0.8);
        break;

      case 'VEHICLE':
        // Scenario 3: Passing Vehicle (High sound, medium vibration, no rain)
        sound_rms = 0.52 + jitter(0.08);
        dominant_frequency = 260 + jitter(40);
        vibration_rms = 0.32 + jitter(0.06);
        rain_detected = false;
        temperature = 27.6 + jitter(0.4);
        humidity = 74 + jitter(2);
        pressure = 1012.0 + jitter(0.5);
        break;

      case 'MACHINERY':
        // Scenario 4: Possible Heavy Machinery (High sound, high vibration, low freq, no rain)
        sound_rms = 0.76 + jitter(0.07);
        dominant_frequency = 118 + jitter(18); // Characteristic excavator / diesel 118Hz rumble
        vibration_rms = 0.58 + jitter(0.08);
        rain_detected = false;
        temperature = 28.5 + jitter(0.5);
        humidity = 72 + jitter(3);
        pressure = 1011.8 + jitter(0.6);
        break;

      case 'CONSTRUCTION':
        // Scenario 5: Construction activity
        sound_rms = 0.65 + jitter(0.07);
        dominant_frequency = 180 + jitter(35);
        vibration_rms = 0.48 + jitter(0.07);
        rain_detected = false;
        temperature = 27.9 + jitter(0.5);
        humidity = 75 + jitter(2);
        pressure = 1012.1 + jitter(0.4);
        break;

      case 'NORMAL':
      default:
        // Scenario 1: Normal Environment
        sound_rms = 0.15 + jitter(0.04);
        dominant_frequency = 420 + jitter(90);
        vibration_rms = 0.05 + jitter(0.02);
        rain_detected = false;
        temperature = 26.8 + jitter(0.6);
        humidity = 77 + jitter(2);
        pressure = 1012.5 + jitter(0.5);
        break;
    }

    sound_rms = Math.max(0.04, Math.min(0.99, sound_rms));
    vibration_rms = Math.max(0.02, Math.min(0.98, vibration_rms));

    const scored = calculateActivityScore({
      sound_rms,
      dominant_frequency,
      vibration_rms,
      rain_detected,
    });

    return {
      station_id: station.id,
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
    };
  }

  private evaluateAlertTrigger(station: Station, reading: SensorReading): void {
    const recentAlert = this.alerts.find(
      (a) =>
        a.station_id === station.id &&
        a.status === 'UNREVIEWED' &&
        Date.now() - new Date(a.timestamp).getTime() < 45 * 1000 // deduplicate within 45s
    );

    if (!recentAlert && reading.activity_score && reading.activity_score >= 61) {
      const newAlert: Alert = {
        id: `ALT-${Date.now().toString().slice(-6)}`,
        station_id: station.id,
        station_name: station.name,
        timestamp: reading.timestamp,
        risk_score: reading.activity_score,
        risk_level: reading.risk_level || 'HIGH',
        alert_type: 'MACHINERY_SUSPECTED',
        description: 'Possible machinery-related activity detected. Human verification required.',
        status: 'UNREVIEWED',
        created_at: reading.timestamp,
        updated_at: reading.timestamp,
        snapshot_readings: {
          sound_rms: reading.sound_rms,
          dominant_frequency: reading.dominant_frequency,
          vibration_rms: reading.vibration_rms,
          rain_detected: reading.rain_detected,
          temperature: reading.temperature,
        },
      };

      this.alerts = [newAlert, ...this.alerts];
    }
  }

  /**
   * Updates the status of an alert (human verification workflow)
   */
  public updateAlertStatus(
    alertId: string,
    status: Alert['status'],
    reviewerNotes?: string
  ): boolean {
    const index = this.alerts.findIndex((a) => a.id === alertId);
    if (index === -1) return false;

    this.alerts[index] = {
      ...this.alerts[index],
      status,
      reviewer_notes: reviewerNotes !== undefined ? reviewerNotes : this.alerts[index].reviewer_notes,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.notify();
    return true;
  }
}

export const simulatorService = new SimulatorService();
