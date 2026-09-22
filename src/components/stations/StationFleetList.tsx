import type { FC } from 'react';
import {
  MapPin,
  Cpu,
  Volume2,
  Waves,
  CloudRain,
  ArrowRight,
  Battery,
  Activity,
} from 'lucide-react';
import type { Station, SensorReading } from '../../types';

interface StationFleetListProps {
  stations: Station[];
  allLatestReadings: Record<string, SensorReading | undefined>;
  onSelectAndOpenStation: (stationId: string) => void;
}

export const StationFleetList: FC<StationFleetListProps> = ({
  stations,
  allLatestReadings,
  onSelectAndOpenStation,
}) => {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-white tracking-tight">
              Operational Monitoring Stations
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {stations.length} Online
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select any active edge station below to launch its live sensor telemetry, geospatial mapping, and diagnostic suite.
          </p>
        </div>
      </div>

      {/* Grid of Online Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {stations.map((st) => {
          const reading = allLatestReadings[st.id];
          const score = reading?.activity_score || 0;
          const soundPercent = reading ? Math.round(reading.sound_rms * 100) : 0;
          const vibrationPercent = reading ? Math.round(reading.vibration_rms * 100) : 0;

          return (
            <div
              key={st.id}
              className="glass-panel rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 p-5 flex flex-col justify-between transition-all hover:shadow-xl group"
            >
              <div>
                {/* Station Top Status Bar */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-white">
                      {st.id}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                      score >= 61
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/80 animate-pulse'
                        : score >= 31
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    Score: {score}/100
                  </span>
                </div>

                {/* Station Name & Geographic Basin */}
                <div className="mt-3.5">
                  <h3 className="font-display font-bold text-base text-white group-hover:text-zinc-100 transition-colors">
                    {st.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{st.location_name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                    GPS: {st.latitude.toFixed(4)}°N, {st.longitude.toFixed(4)}°W
                  </div>
                </div>

                {/* Live Telemetry Snapshot Strip */}
                {reading ? (
                  <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2 text-xs">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center justify-between">
                      <span>Live Telemetry Packet</span>
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-zinc-400" /> Real-time
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <div>
                          <div className="text-[10px] text-zinc-400">Acoustic</div>
                          <div className="font-mono text-xs font-semibold text-white">
                            {soundPercent}% (~{reading.sound_db}dB)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Waves className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <div>
                          <div className="text-[10px] text-zinc-400">Vibration</div>
                          <div className="font-mono text-xs font-semibold text-white">
                            {vibrationPercent}% Accel
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-zinc-400">
                        <CloudRain className="w-3 h-3 text-zinc-400" />
                        <span>{reading.rain_detected ? 'Rain Active (Filtered)' : 'Dry Surface'}</span>
                      </div>
                      <div className="font-mono text-zinc-400">
                        {reading.dominant_frequency} Hz
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-500 italic">
                    Awaiting telemetry packet...
                  </div>
                )}

                {/* Hardware Context */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-zinc-500" />
                    <span className="truncate max-w-[140px]">{st.device_id}</span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Battery className="w-3 h-3 text-zinc-500" />
                    <span>Battery 92%</span>
                  </div>
                </div>
              </div>

              {/* View Station Dashboard Action Button */}
              <div className="mt-5 pt-3 border-t border-zinc-800/80">
                <button
                  onClick={() => onSelectAndOpenStation(st.id)}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-white hover:bg-zinc-200 text-zinc-950 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all group-hover:bg-zinc-100"
                >
                  <span>View Station Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
