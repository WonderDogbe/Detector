import { useState } from 'react';
import type { FC } from 'react';
import { ArrowRight, X, Cpu, Sparkles } from 'lucide-react';
import type { Station } from '../../types';

interface DetectedStationBannerProps {
  stations: Station[];
  onConfigureStation: (station: Station) => void;
}

export const DetectedStationBanner: FC<DetectedStationBannerProps> = ({
  stations,
  onConfigureStation,
}) => {
  const [dismissedStationIds, setDismissedStationIds] = useState<Set<string>>(new Set());

  // Detect any stations that have default auto-generated names from edge telemetry
  const unconfiguredStation = stations.find(
    (s) =>
      !dismissedStationIds.has(s.id) &&
      (s.name.startsWith('New Station') ||
        s.location_name.includes('Awaiting Location') ||
        s.location_name.includes('Auto-detected'))
  );

  if (!unconfiguredStation) return null;

  const handleDismiss = () => {
    setDismissedStationIds((prev) => new Set(prev).add(unconfiguredStation.id));
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#123c28] via-[#1b5037] to-[#123c28] text-white p-4 sm:p-5 shadow-lg border border-emerald-600/30 animate-scale-up">
      {/* Subtle background glow decorative elements */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute left-1/2 -bottom-10 w-48 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Icon & Station Information */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                NEW EDGE HARDWARE DETECTED
              </span>
              <span className="font-mono text-xs font-bold text-white bg-black/30 px-2 py-0.5 rounded border border-white/10">
                {unconfiguredStation.id}
              </span>
            </div>

            <h4 className="text-sm font-display font-bold text-white">
              Raspberry Pi connected to fleet stream!
            </h4>
            <p className="text-xs text-emerald-100/80">
              Live telemetry is transmitting from device{' '}
              <code className="font-mono font-semibold text-white bg-white/10 px-1 py-0.5 rounded text-[11px]">
                {unconfiguredStation.device_id}
              </code>
              . Give this station a permanent name and river basin to complete setup.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:self-center shrink-0">
          <button
            onClick={() => onConfigureStation(unconfiguredStation)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#123c28] hover:bg-emerald-50 shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-95"
          >
            <span>Name & Configure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-xl text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
