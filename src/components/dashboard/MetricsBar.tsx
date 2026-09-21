import type { FC } from 'react';
import {
  Radio,
  Activity,
  AlertTriangle,
  CloudRain,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import type { Station, SensorReading, Alert } from '../../types';

interface MetricsBarProps {
  stations: Station[];
  allLatestReadings: Record<string, SensorReading | undefined>;
  alerts: Alert[];
  unreviewedAlertsCount: number;
}

export const MetricsBar: FC<MetricsBarProps> = ({
  stations,
  allLatestReadings,
  alerts,
  unreviewedAlertsCount,
}) => {
  const totalStations = stations.length;
  const onlineStations = stations.filter((s) => s.status === 'ONLINE').length;

  let normalCount = 0;
  let elevatedCount = 0;
  let highCount = 0;
  let rainActiveCount = 0;
  let highestScore = 0;

  stations.forEach((s) => {
    const reading = allLatestReadings[s.id];
    if (reading) {
      const score = reading.activity_score || 0;
      if (score > highestScore) highestScore = score;
      if (score >= 61) highCount++;
      else if (score >= 31) elevatedCount++;
      else normalCount++;

      if (reading.rain_detected) rainActiveCount++;
    } else {
      normalCount++;
    }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Active Stations */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Monitoring Stations</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Radio className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-display font-bold text-slate-100">
            {onlineStations}
          </span>
          <span className="text-xs text-slate-400">/ {totalStations} Online</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>All edge nodes operational</span>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Network Threat & Activity Level */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Peak Activity Score</span>
          <div
            className={`p-2 rounded-lg ${
              highestScore >= 61
                ? 'bg-rose-500/10 text-rose-400'
                : highestScore >= 31
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-display font-bold ${
              highestScore >= 61
                ? 'text-rose-400'
                : highestScore >= 31
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {highestScore}
          </span>
          <span className="text-xs text-slate-400">/ 100 max</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          {highCount > 0 ? (
            <span className="text-rose-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {highCount} station in High Activity
            </span>
          ) : elevatedCount > 0 ? (
            <span className="text-amber-400 font-medium">
              {elevatedCount} station in Elevated Range
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Normal environmental baseline
            </span>
          )}
        </div>
        <div
          className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
            highestScore >= 61 ? 'bg-rose-500/10' : 'bg-emerald-500/5'
          }`}
        />
      </div>

      {/* Human Verification Alerts */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Human Verification</span>
          <div
            className={`p-2 rounded-lg ${
              unreviewedAlertsCount > 0
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-display font-bold ${
              unreviewedAlertsCount > 0 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {unreviewedAlertsCount}
          </span>
          <span className="text-xs text-slate-400">Pending Review</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Total incidents logged: <span className="text-slate-200 font-semibold">{alerts.length}</span>
        </div>
      </div>

      {/* Weather & Rain Context */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Weather & Rain Dampening</span>
          <div
            className={`p-2 rounded-lg ${
              rainActiveCount > 0
                ? 'bg-cyan-500/15 text-cyan-400'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <CloudRain className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-display font-bold text-slate-100">
            {rainActiveCount > 0 ? `${rainActiveCount} Rain` : 'Dry'}
          </span>
          <span className="text-xs text-slate-400">
            {rainActiveCount > 0 ? 'Sensors Triggered' : 'Conditions'}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-cyan-400/90 truncate">
          {rainActiveCount > 0
            ? 'Acoustic dampening active'
            : 'Clear atmospheric profile'}
        </div>
      </div>
    </div>
  );
};
