import type { FC } from 'react';
import {
  ShieldAlert,
  Pause,
  Sliders,
  Sparkles,
  MapPin,
} from 'lucide-react';
import type { Station } from '../../types';

interface HeaderProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  unreviewedAlertsCount: number;
  isRunning: boolean;
  onToggleSimulation: () => void;
  onOpenScenarios: () => void;
  onOpenTour: () => void;
  activeTab: 'overview' | 'map' | 'stations' | 'alerts';
  setActiveTab: (tab: 'overview' | 'map' | 'stations' | 'alerts') => void;
}

export const Header: FC<HeaderProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  unreviewedAlertsCount,
  isRunning,
  onToggleSimulation,
  onOpenScenarios,
  onOpenTour,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0A0F1D]/90 backdrop-blur-md px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Project Identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0B111D] rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-slate-100 tracking-tight">
                  Galamsey<span className="text-emerald-400">Guard</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Prototype MVP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                IoT Environmental Activity & Machinery Pattern Monitor
              </p>
            </div>
          </div>

          {/* Mobile Tour Trigger */}
          <button
            onClick={onOpenTour}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700"
            title="Demo Guide"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* View Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'map'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Geospatial Map
          </button>
          <button
            onClick={() => setActiveTab('stations')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'stations'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Telemetry & Charts
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Alerts</span>
            {unreviewedAlertsCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                {unreviewedAlertsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Global Controls & Station Selector */}
        <div className="flex items-center gap-2.5">
          {/* Station Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              aria-label="Select Monitoring Station"
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id} className="bg-slate-900 text-slate-200">
                  {st.id} — {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Simulator Play/Pause Status */}
          <button
            onClick={onToggleSimulation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isRunning
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={isRunning ? 'Simulation running automatically' : 'Simulation paused'}
          >
            {isRunning ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="hidden sm:inline">Telemetry Live</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Paused</span>
              </>
            )}
          </button>

          {/* Demo Scenario Trigger Button */}
          <button
            onClick={onOpenScenarios}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Scenario Injector</span>
          </button>

          {/* Guided Tour Modal Trigger */}
          <button
            onClick={onOpenTour}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
            title="10-Step MVP Demo Guide"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
