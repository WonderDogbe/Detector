import { useState, useEffect, useMemo, useCallback } from 'react';
import { simulatorService } from '../services/simulatorService';
import type {
  SensorReading,
  SimulationScenario,
  AlertStatus,
} from '../types';

export function useSimulator(initialStationId?: string) {
  const [, setVersion] = useState(0);
  const [selectedStationId, setSelectedStationId] = useState<string>(
    initialStationId || 'GG-001'
  );

  useEffect(() => {
    const unsubscribe = simulatorService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  const stations = useMemo(() => simulatorService.getStations(), []);

  const selectedStation = useMemo(
    () => simulatorService.getStation(selectedStationId) || stations[0],
    [stations, selectedStationId]
  );

  const latestReading = useMemo(
    () => simulatorService.getLatestReading(selectedStationId),
    [selectedStationId]
  );

  const historicalReadings = useMemo(
    () => simulatorService.getHistoricalReadings(selectedStationId),
    [selectedStationId]
  );

  const allLatestReadings = useMemo(() => {
    const map: Record<string, SensorReading | undefined> = {};
    stations.forEach((s) => {
      map[s.id] = simulatorService.getLatestReading(s.id);
    });
    return map;
  }, [stations]);

  const alerts = useMemo(() => simulatorService.getAlerts(), []);

  const unreviewedAlertsCount = useMemo(
    () => alerts.filter((a) => a.status === 'UNREVIEWED').length,
    [alerts]
  );

  const health = useMemo(
    () => simulatorService.getHealth(selectedStationId),
    [selectedStationId]
  );

  const activeScenario = useMemo(
    () => simulatorService.getActiveScenario(selectedStationId),
    [selectedStationId]
  );

  const isRunning = useMemo(() => simulatorService.isRunning(), []);

  const triggerScenario = useCallback(
    (scenario: SimulationScenario, stationId?: string, durationSeconds?: number) => {
      simulatorService.triggerScenario(scenario, stationId, durationSeconds);
    },
    []
  );

  const resetToNormal = useCallback(() => {
    simulatorService.resetToNormal();
  }, []);

  const updateAlertStatus = useCallback(
    (alertId: string, status: AlertStatus, reviewerNotes?: string) => {
      return simulatorService.updateAlertStatus(alertId, status, reviewerNotes);
    },
    []
  );

  const toggleSimulation = useCallback(() => {
    if (simulatorService.isRunning()) {
      simulatorService.stopAutoTick();
    } else {
      simulatorService.startAutoTick();
    }
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
    activeScenario,
    isRunning,
    triggerScenario,
    resetToNormal,
    updateAlertStatus,
    toggleSimulation,
  };
}
