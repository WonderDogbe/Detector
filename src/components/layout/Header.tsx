import type { FC } from 'react';
import {
  ShieldAlert,
  Cpu,
  MapPin,
} from 'lucide-react';
import type { Station } from '../../types';

interface HeaderProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  unreviewedAlertsCount: number;
  isRunning?: boolean;
  isConnected?: boolean;
  onToggleSimulation?: () => void;
  onOpenScenarios?: () => void;
  onOpenHardware: () => void;
  onOpenTour?: () => void;
  activeTab: 'overview' | 'map' | 'stations' | 'alerts';
  setActiveTab: (tab: 'overview' | 'map' | 'stations' | 'alerts') => void;
}

export const Header: FC<HeaderProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  unreviewedAlertsCount,
  isConnected = true,
  onOpenHardware,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Project Identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-4 h-4 text-zinc-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base tracking-tight text-white">
                  Galamsey<span className="text-zinc-400">Guard</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium tracking-wide uppercase rounded-md bg-zinc-900 text-zinc-300 border border-zinc-700/60">
                  Prototype MVP
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                IoT Environmental Activity & Machinery Pattern Monitor
              </p>
            </div>
          </div>

          {/* Mobile Hardware Trigger */}
          <button
            onClick={onOpenHardware}
            className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
            title="Hardware & Sensor Console"
          >
            <Cpu className="w-4 h-4" />
          </button>
        </div>

        {/* View Navigation Tabs - Natural Monochrome Segmented Control */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/90">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
            }`}
          >
            Fleet Hub
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
            }`}
          >
            Geospatial Map
          </button>
          <button
            onClick={() => setActiveTab('stations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'stations'
                ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
            }`}
          >
            Station View
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
            }`}
          >
            <span>Alerts</span>
            {unreviewedAlertsCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-rose-950 text-rose-300 border border-rose-800/80">
                {unreviewedAlertsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Global Controls & Station Selector */}
        <div className="flex items-center gap-2">
          {/* Station Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 hover:border-zinc-700 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              aria-label="Select Monitoring Station"
              className="bg-transparent text-xs text-zinc-200 font-medium focus:outline-none cursor-pointer"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id} className="bg-zinc-900 text-zinc-200">
                  {st.id} — {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Stream Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-zinc-900 border-zinc-800 transition-colors`}
            title={
              isConnected
                ? 'Listening for physical sensor telemetry packets'
                : 'Connecting to edge ingestion stream'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="hidden sm:inline text-zinc-300">
              {isConnected ? 'Stream Active' : 'Connecting'}
            </span>
          </div>

          {/* Physical Hardware & Edge Console Trigger Button */}
          <button
            onClick={onOpenHardware}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 shadow-sm transition-all cursor-pointer"
            title="Open Physical Hardware & Edge Gateway Console"
          >
            <Cpu className="w-3.5 h-3.5 text-zinc-950" />
            <span>Hardware & Sensors</span>
          </button>
        </div>
      </div>
    </header>
  );
};
