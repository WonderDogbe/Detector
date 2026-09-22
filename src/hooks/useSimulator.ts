import { useState, useEffect, useMemo, useCallback } from 'react';
import { simulatorService } from '../services/simulatorService';
import type {
  SensorReading,
  AlertStatus,
} from '../types';

export function useSensorFleet(initialStationId?: string) {
  const [version, setVersion] = useState(0);
  const [selectedStationId, setSelectedStationId] = useState<string>(
    initialStationId || 'GG-001'
  );

  useEffect(() => {
    const unsubscribe = simulatorService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  const stations = useMemo(
    () => simulatorService.getStations(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  const selectedStation = useMemo(
    () => simulatorService.getStation(selectedStationId) || stations[0],
    [stations, selectedStationId]
  );

  const latestReading = useMemo(
    () => simulatorService.getLatestReading(selectedStationId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStationId, version]
  );

  const historicalReadings = useMemo(
    () => simulatorService.getHistoricalReadings(selectedStationId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStationId, version]
  );

  const allLatestReadings = useMemo(() => {
    const map: Record<string, SensorReading | undefined> = {};
    stations.forEach((s) => {
      map[s.id] = simulatorService.getLatestReading(s.id);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, version]);

  const alerts = useMemo(
    () => simulatorService.getAlerts(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  const unreviewedAlertsCount = useMemo(
    () => alerts.filter((a) => a.status === 'UNREVIEWED').length,
    [alerts]
  );

  const health = useMemo(
    () => simulatorService.getHealth(selectedStationId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStationId, version]
  );

  const isConnected = useMemo(
    () => simulatorService.isRunning(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  const lastPacketTime = useMemo(
    () => simulatorService.getLastPacketTimestamp(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version]
  );

  const updateAlertStatus = useCallback(
    (alertId: string, status: AlertStatus, reviewerNotes?: string) => {
      return simulatorService.updateAlertStatus(alertId, status, reviewerNotes);
    },
    []
  );

  const createStation = useCallback(
    (stationData: {
      id: string;
      device_id: string;
      name: string;
      location_name: string;
      latitude: number;
      longitude: number;
    }) => {
      return simulatorService.createStation(stationData);
    },
    []
  );

  const ingestRealReading = useCallback((reading: SensorReading) => {
    simulatorService.ingestRealReading(reading);
  }, []);

  return {
    stations,
    selectedStationId,
    setSelectedStationId,
    selectedStation,
    latestReading,
    historicalReadings,
    allLatestReadings,
    alerts,
    unreviewedAlertsCount,
    health,
    isConnected,
    lastPacketTime,
    updateAlertStatus,
    ingestRealReading,
    createStation,
    // Backward compatibility aliases
    isRunning: isConnected,
    activeScenario: 'NORMAL' as const,
    triggerScenario: () => {},
    resetToNormal: () => {},
    toggleSimulation: () => {},
  };
}

// Alias for backwards compatibility across existing components
export const useSimulator = useSensorFleet;
