import { useState } from 'react';
import type { FC } from 'react';
import type { Station, SensorReading } from '../../types';
import { MapPin, Layers } from 'lucide-react';
import { StationMap } from './StationMap';

interface SpatialTelemetryMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  allLatestReadings: Record<string, SensorReading | undefined>;
}

export const SpatialTelemetryMap: FC<SpatialTelemetryMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  allLatestReadings,
}) => {
  const [useGeoLeaflet, setUseGeoLeaflet] = useState(false);

  const selectedStation =
    stations.find((s) => s.id === selectedStationId) || stations[0];
  const selectedReading = selectedStation
    ? allLatestReadings[selectedStation.id]
    : undefined;

  // Short labels matching the screenshot
  const getShortName = (st: Station) => {
    if (st.id === 'GG-001') return 'GG-001 (River)';
    if (st.id === 'GG-002') return 'GG-002 (Forest)';
    if (st.id === 'GG-003') return 'GG-003 (Community)';
    return st.name.slice(0, 14);
  };

  const getNodeScore = (stationId: string) => {
    const r = allLatestReadings[stationId];
    return r?.activity_score ?? 0;
  };

  const getNodeColor = (score: number) => {
    if (score >= 70) return { dot: 'bg-rose-500', text: 'text-rose-600', ring: 'rgba(244, 63, 94, 0.15)' };
    if (score >= 40) return { dot: 'bg-amber-500', text: 'text-amber-600', ring: 'rgba(245, 158, 11, 0.15)' };
    return { dot: 'bg-emerald-500', text: 'text-emerald-600', ring: 'rgba(16, 185, 129, 0.15)' };
  };

  // Coords display
  const latDisplay = selectedReading?.latitude
    ? `${selectedReading.latitude.toFixed(4)}° N`
    : selectedStation
    ? `${selectedStation.latitude.toFixed(4)}° N`
    : '5.6037° N';
  const lonDisplay = selectedReading?.longitude
    ? `${Math.abs(selectedReading.longitude).toFixed(4)}° W`
    : selectedStation
    ? `${Math.abs(selectedStation.longitude).toFixed(4)}° W`
    : '-0.1870° W';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-display font-bold text-slate-900 tracking-tight">
            Spatial Telemetry Map
          </h2>
          <p className="text-xs text-slate-500">
            Ghana Basin Sector • Offin & Pra Catchments
          </p>
        </div>

        {/* Station Filter Tabs & Layer Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200/80 rounded-xl">
            {stations.map((st) => {
              const score = getNodeScore(st.id);
              const color = getNodeColor(score);
              const isSelected = st.id === selectedStationId;

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStation(st.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                  <span>{getShortName(st)}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setUseGeoLeaflet(!useGeoLeaflet)}
            title="Toggle Satellite / Schematic view"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Content View */}
      {useGeoLeaflet ? (
        <div className="p-4">
          <StationMap
            stations={stations}
            selectedStationId={selectedStationId}
            onSelectStation={onSelectStation}
            allLatestReadings={allLatestReadings}
          />
        </div>
      ) : (
        <div className="relative w-full h-[320px] bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 overflow-hidden flex items-center justify-center select-none">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Stylized River Winding SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 800 320"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="riverGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.15" />
                <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="70%" stopColor="#0284c7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            {/* River Outer Ribbon */}
            <path
              d="M 0 145 C 180 140, 240 215, 410 190 C 580 165, 660 190, 800 180"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="38"
              strokeLinecap="round"
            />
            {/* River Main Stream */}
            <path
              d="M 0 145 C 180 140, 240 215, 410 190 C 580 165, 660 190, 800 180"
              fill="none"
              stroke="url(#riverGlow)"
              strokeWidth="20"
              strokeLinecap="round"
            />
            {/* Dashed Navigation centerline */}
            <path
              d="M 0 145 C 180 140, 240 215, 410 190 C 580 165, 660 190, 800 180"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              strokeOpacity="0.5"
            />
          </svg>

          {/* STATION NODES (Interactive Pins with Halo Aura) */}

          {/* Node 2: GG-002 (Forest) */}
          <div
            style={{ left: '60%', top: '35%' }}
            onClick={() => onSelectStation('GG-002')}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 ${
              selectedStationId === 'GG-002' ? 'scale-110 z-20' : 'hover:scale-105 z-10'
            }`}
          >
            {/* Soft Greenish Circular Range Aura */}
            <div className="absolute -inset-10 rounded-full bg-emerald-100/50 blur-[2px] pointer-events-none" />
            <div className="relative flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full border border-amber-200/80 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-800">
                GG-002 (Forest)
              </span>
              <span className="text-xs font-bold text-amber-600">
                {getNodeScore('GG-002') || 48}
              </span>
            </div>
          </div>

          {/* Node 1: GG-001 (River) - High Activity with glowing red aura */}
          <div
            style={{ left: '44%', top: '58%' }}
            onClick={() => onSelectStation('GG-001')}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 ${
              selectedStationId === 'GG-001' ? 'scale-110 z-30' : 'hover:scale-105 z-20'
            }`}
          >
            {/* Red Risk Detection Aura */}
            <div className="absolute -inset-8 -inset-x-14 rounded-full bg-rose-200/50 blur-[3px] pointer-events-none animate-pulse" />
            <div className="relative flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-rose-300 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-xs font-bold text-slate-900">
                GG-001 (River)
              </span>
              <span className="text-xs font-extrabold text-rose-600">
                {getNodeScore('GG-001') || 76} pts
              </span>
            </div>
          </div>

          {/* Node 3: GG-003 (Community) */}
          <div
            style={{ left: '26%', top: '68%' }}
            onClick={() => onSelectStation('GG-003')}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-300 ${
              selectedStationId === 'GG-003' ? 'scale-110 z-20' : 'hover:scale-105 z-10'
            }`}
          >
            <div className="relative flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-200/80 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-800">
                GG-003 (Community)
              </span>
              <span className="text-xs font-bold text-emerald-600">
                {getNodeScore('GG-003') || 18}
              </span>
            </div>
          </div>

          {/* Bottom Right Coordinates Pill */}
          <div className="absolute bottom-3 right-4 px-3 py-1 bg-white/90 backdrop-blur-xs rounded-full border border-slate-200/80 text-[11px] font-mono text-slate-500 shadow-2xs flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>
              Lat: {latDisplay} • Lon: {lonDisplay}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
