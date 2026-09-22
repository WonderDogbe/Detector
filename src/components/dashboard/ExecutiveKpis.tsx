import type { FC } from 'react';
import type { Station, SensorReading, Alert, DeviceHealth } from '../../types';

interface ExecutiveKpisProps {
  stations: Station[];
  allLatestReadings: Record<string, SensorReading | undefined>;
  alerts: Alert[];
  health?: DeviceHealth;
  selectedStationId: string;
  selectedReading?: SensorReading;
  selectedStation?: Station;
}

export const ExecutiveKpis: FC<ExecutiveKpisProps> = ({
  stations,
  allLatestReadings,
  alerts,
  health,
  selectedStationId,
  selectedReading,
  selectedStation,
}) => {
  // 1. Online stations calculation
  const totalStations = stations.length;
  const onlineStations = stations.filter((s) => s.status === 'ONLINE').length;
  const onlinePercent = totalStations > 0 ? Math.round((onlineStations / totalStations) * 100) : 100;

  // 2. Active incident calculation
  const unreviewedAlerts = alerts.filter(
    (a) => a.status === 'UNREVIEWED' || a.status === 'UNDER REVIEW'
  );
  const activeIncidentCount = unreviewedAlerts.length;
  const formattedIncidentCount = String(activeIncidentCount).padStart(2, '0');

  // Find the highest score reading or alert
  const topAlert = unreviewedAlerts[0] || alerts[0];
  let highestScore = 0;
  let highestScoreStation = selectedStation?.name || 'Pra River';

  Object.entries(allLatestReadings).forEach(([stationId, r]) => {
    if (r && (r.activity_score || 0) > highestScore) {
      highestScore = r.activity_score || 0;
      const st = stations.find((s) => s.id === stationId);
      if (st) highestScoreStation = st.name;
    }
  });

  if (topAlert && topAlert.risk_score > highestScore) {
    highestScore = topAlert.risk_score;
    const st = stations.find((s) => s.id === topAlert.station_id);
    if (st) highestScoreStation = st.name;
  }

  // 3. Sound metrics for selected station
  const soundRmsPct = Math.round((selectedReading?.sound_rms ?? 0) * 100);
  const dominantFreq = selectedReading?.dominant_frequency
    ? selectedReading.dominant_frequency.toFixed(1)
    : '0.0';

  let soundBadge = { text: 'Normal Baseline', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (soundRmsPct >= 65) {
    soundBadge = { text: 'Heavy Signature', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  } else if (soundRmsPct >= 40) {
    soundBadge = { text: 'Elevated Audio', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  // 4. Battery & Health calculation
  const batteryLevel = health?.battery_level ?? 98;
  const isCharging = health?.solar_charging ?? true;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: ONLINE STATIONS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Online Stations
          </span>
        </div>
        <div className="my-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-bold text-slate-900">
              {onlineStations}
            </span>
            <span className="text-slate-400 font-semibold text-lg">/ {totalStations}</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {onlinePercent}% Operational
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {onlineStations === totalStations
            ? 'All field telemetry nodes responding'
            : `${totalStations - onlineStations} node(s) require inspection`}
        </p>
      </div>

      {/* KPI 2: ACTIVE INCIDENT */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Incident
          </span>
        </div>
        <div className="my-3 flex items-baseline justify-between">
          <span className={`text-3xl font-display font-bold ${activeIncidentCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formattedIncidentCount}
          </span>
          {activeIncidentCount > 0 ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              High Activity
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              All Clear
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 font-medium truncate">
          {highestScore > 0
            ? `${selectedStationId} ${highestScoreStation} (Score: ${highestScore})`
            : 'No anomalous activity detected'}
        </p>
      </div>

      {/* KPI 3: AVERAGE SOUND */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
            Average Sound ({selectedStationId})
          </span>
        </div>
        <div className="my-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-display font-bold text-slate-900">
              {soundRmsPct}%
            </span>
            <span className="text-slate-400 font-medium text-xs uppercase">RMS</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${soundBadge.bg}`}>
            {soundBadge.text}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Dominant frequency: {dominantFreq} Hz
        </p>
      </div>

      {/* KPI 4: BATTERY & HEALTH */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Battery & Health
          </span>
        </div>
        <div className="my-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-display font-bold text-slate-900">
              {batteryLevel}%
            </span>
            <span className="text-slate-400 font-medium text-xs">Avg</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Normal Health
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          {isCharging ? 'Solar backup charge stable' : 'Battery discharging'}
        </p>
      </div>
    </div>
  );
};
