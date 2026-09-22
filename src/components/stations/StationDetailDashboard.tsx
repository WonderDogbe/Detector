import type { FC } from 'react';
import {
  ArrowLeft,
  MapPin,
  Radio,
  Cpu,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import type {
  Station,
  SensorReading,
  DeviceHealth,
  Alert,
} from '../../types';
import { SensorCards } from './SensorCards';
import { StationMap } from '../map/StationMap';
import { StationCharts } from '../charts/StationCharts';

interface StationDetailDashboardProps {
  station: Station;
  stations: Station[];
  reading: SensorReading | undefined;
  health: DeviceHealth | undefined;
  historicalReadings: SensorReading[];
  allLatestReadings: Record<string, SensorReading | undefined>;
  alerts: Alert[];
  onBackToFleet: () => void;
  onSelectStation: (stationId: string) => void;
  onOpenScenarios?: () => void;
  onOpenHardware?: () => void;
  onOpenConfigure?: () => void;
}

export const StationDetailDashboard: FC<StationDetailDashboardProps> = ({
  station,
  stations,
  reading,
  health,
  historicalReadings,
  allLatestReadings,
  alerts,
  onBackToFleet,
  onSelectStation,
  onOpenHardware,
  onOpenConfigure,
}) => {
  const stationAlerts = alerts.filter((a) => a.station_id === station.id);
  const score = reading?.activity_score || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Breadcrumb & Navigation Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 glass-panel">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToFleet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Stations</span>
          </button>

          <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
              {station.id}
            </span>
            <h1 className="font-display font-bold text-base text-white truncate max-w-[240px] sm:max-w-none">
              {station.name}
            </h1>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                score >= 61
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                  : score >= 31
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              Score: {score}/100
            </span>
          </div>
        </div>

        {/* Station switcher & quick actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Quick station dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={station.id}
              onChange={(e) => onSelectStation(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 font-medium focus:outline-none cursor-pointer"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-200">
                  Switch: {s.id}
                </option>
              ))}
            </select>
          </div>

          {/* Configure Station button */}
          {onOpenConfigure && (
            <button
              onClick={onOpenConfigure}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors cursor-pointer"
              title="Configure station name, coordinates, and location"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Configure Station</span>
            </button>
          )}

          {/* Hardware Diagnostics modal trigger */}
          <button
            onClick={onOpenHardware}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition-colors cursor-pointer shadow-sm"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Hardware Diagnostics</span>
          </button>
        </div>
      </div>

      {/* 2. Sensor Telemetry Suite (The 6 Instruments) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base text-white flex items-center gap-2 tracking-tight">
            <Radio className="w-4 h-4 text-zinc-300" />
            Live Sensor Telemetry Instruments
          </h2>
          <span className="text-xs font-mono text-zinc-400">
            Node: {station.device_id} • GPS: {station.latitude.toFixed(4)}°N, {station.longitude.toFixed(4)}°W
          </span>
        </div>

        <SensorCards
          station={station}
          reading={reading}
          health={health}
        />
      </div>

      {/* 3. Split View: Geospatial Positioning Map + Live Station Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Column */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 tracking-tight">
              <MapPin className="w-4 h-4 text-zinc-300" />
              Node Deployment Coordinates
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              {station.location_name}
            </span>
          </div>

          <StationMap
            stations={stations}
            selectedStationId={station.id}
            onSelectStation={onSelectStation}
            allLatestReadings={allLatestReadings}
          />
        </div>

        {/* Station Incident / Human Verification Summary */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 tracking-tight">
              <AlertTriangle className="w-4 h-4 text-zinc-300" />
              Station Incident Log ({stationAlerts.length})
            </h3>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60">
            {stationAlerts.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 space-y-2">
                <div className="w-9 h-9 mx-auto rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400">
                  <Radio className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-white">
                  No active incidents on {station.id}
                </p>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Acoustic sound pressure and vibration signatures are currently within natural forest and river baselines.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stationAlerts.slice(0, 2).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-zinc-300">{a.id}</span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        Score: {a.risk_score}
                      </span>
                    </div>
                    <p className="text-zinc-200 leading-relaxed font-medium">
                      "{a.description}"
                    </p>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {new Date(a.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Historical Telemetry & Activity Progression Charts */}
      <div className="pt-2 border-t border-zinc-850">
        <StationCharts
          station={station}
          readings={historicalReadings}
        />
      </div>
    </div>
  );
};
