import type { FC } from 'react';
import {
  Radio,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import type { Station, SensorReading, Alert } from '../../types';

interface MetricsBarProps {
  stations: Station[];
  allLatestReadings: Record<string, SensorReading | undefined>;
  alerts: Alert[];
  unreviewedAlertsCount: number;
  onViewAlerts?: () => void;
}

export const MetricsBar: FC<MetricsBarProps> = ({
  stations,
  allLatestReadings,
  alerts,
  unreviewedAlertsCount,
  onViewAlerts,
}) => {
  const totalStations = stations.length;
  const onlineStations = stations.filter((s) => s.status === 'ONLINE').length;

  let highCount = 0;
  let elevatedCount = 0;
  let highestScore = 0;

  stations.forEach((s) => {
    const reading = allLatestReadings[s.id];
    if (reading) {
      const score = reading.activity_score || 0;
      if (score > highestScore) highestScore = score;
      if (score >= 61) highCount++;
      else if (score >= 31) elevatedCount++;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* CARD 1: STATIONS ONLINE */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200">
                <Radio className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400">
                  Network Coverage
                </span>
                <h3 className="font-display font-bold text-lg text-white">
                  Stations Online
                </h3>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
              {onlineStations}
            </span>
            <span className="text-sm font-mono text-zinc-400">
              / {totalStations} Edge Nodes Active
            </span>
          </div>

          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            All virtual sensor stations in the Pra River basin, Atewa Forest, and Tarkwa mining perimeter are actively streaming multi-modal telemetry.
          </p>
        </div>

        {/* Station tags preview */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap gap-2 items-center">
          {stations.map((st) => (
            <div
              key={st.id}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-white">{st.id}</span>
              <span className="text-zinc-500">•</span>
              <span className="truncate max-w-[120px]">{st.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 2: ACTIVE ALERTS & HUMAN VERIFICATION */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700/80 transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <span className="text-xs font-mono font-semibold tracking-wider uppercase text-zinc-400">
                  Verification Protocol
                </span>
                <h3 className="font-display font-bold text-lg text-white">
                  Threat Alerts & Incidents
                </h3>
              </div>
            </div>

            {unreviewedAlertsCount > 0 ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/80 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Action Required
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                Baseline Normal
              </span>
            )}
          </div>

          <div className="mt-4 flex items-baseline gap-2.5">
            <span
              className={`text-4xl sm:text-5xl font-display font-extrabold tracking-tight ${
                unreviewedAlertsCount > 0 ? 'text-rose-400' : 'text-white'
              }`}
            >
              {unreviewedAlertsCount}
            </span>
            <span className="text-sm font-mono text-zinc-400">
              Pending Human Verification
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400">
            {highCount > 0 ? (
              <span className="text-rose-400 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                {highCount} node showing acute heavy machinery acoustic pattern
              </span>
            ) : elevatedCount > 0 ? (
              <span className="text-amber-300 font-medium flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                {elevatedCount} node showing elevated environmental readings
              </span>
            ) : (
              <span>
                System operating at normal baseline (Peak score: <span className="font-mono text-zinc-200 font-medium">{highestScore}/100</span>)
              </span>
            )}
          </div>
        </div>

        {/* Footer with quick action */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">
            Total logged incidents: <span className="text-white font-bold">{alerts.length}</span>
          </span>

          {onViewAlerts && (
            <button
              onClick={onViewAlerts}
              className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 transition-colors cursor-pointer"
            >
              <span>View Audit Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
