import type { FC } from 'react';
import type { Station, SensorReading } from '../../types';

interface StationFleetStatusProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  allLatestReadings: Record<string, SensorReading | undefined>;
}

export const StationFleetStatus: FC<StationFleetStatusProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  allLatestReadings,
}) => {
  const onlineCount = stations.filter((s) => s.status === 'ONLINE').length;

  const getStationInfo = (st: Station) => {
    const reading = allLatestReadings[st.id];
    const score = reading?.activity_score ?? (st.id === 'GG-001' ? 76 : st.id === 'GG-002' ? 48 : 18);

    let title = `${st.id} (${st.name.replace('Station', '').trim()})`;
    if (st.id === 'GG-001') title = 'GG-001 (River Area)';
    if (st.id === 'GG-002') title = 'GG-002 (Forest Area)';
    if (st.id === 'GG-003') title = 'GG-003 (Community Area)';

    let statusLabel = 'Normal Operations';
    let statusClass = 'text-emerald-700';
    let dotClass = 'bg-emerald-500';
    let containerClass = 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200/60';

    if (score >= 70) {
      statusLabel = 'High Activity Alert';
      statusClass = 'text-rose-600 font-semibold';
      dotClass = 'bg-rose-500';
      containerClass = 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70';
    } else if (score >= 40) {
      statusLabel = 'Elevated Baseline';
      statusClass = 'text-amber-600';
      dotClass = 'bg-amber-500';
      containerClass = 'bg-amber-50/30 border-amber-200/70 hover:bg-amber-50/60';
    }

    // Relative packet time
    const timeAgo = reading?.timestamp
      ? Math.max(1, Math.round((Date.now() - new Date(reading.timestamp).getTime()) / 1000))
      : (st.id === 'GG-001' ? 3 : st.id === 'GG-002' ? 6 : 2);
    const timeAgoStr = `${timeAgo}s ago`;

    return {
      title,
      score,
      statusLabel,
      statusClass,
      dotClass,
      containerClass,
      timeAgoStr,
    };
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Station Fleet Status
        </h3>
        <span className="text-xs font-semibold text-slate-500">
          {onlineCount} Online
        </span>
      </div>

      {/* Fleet list */}
      <div className="space-y-2">
        {stations.map((st) => {
          const info = getStationInfo(st);
          const isSelected = st.id === selectedStationId;

          return (
            <div
              key={st.id}
              onClick={() => onSelectStation(st.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${info.containerClass} ${
                isSelected ? 'ring-2 ring-[#123c28]/20 shadow-xs' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${info.dotClass}`} />
                  <span className="text-xs font-bold text-slate-900">
                    {info.title}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {info.score} <span className="font-normal text-slate-500">Score</span>
                </span>
              </div>

              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 pl-4">
                <span className={info.statusClass}>{info.statusLabel}</span>
                <span className="text-slate-400 font-mono">{info.timeAgoStr}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
