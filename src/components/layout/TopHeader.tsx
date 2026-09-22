import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import type { Station } from '../../types';

interface TopHeaderProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  isConnected: boolean;
  activeTabTitle?: string;
  onOpenAddStation?: () => void;
}

export const TopHeader: FC<TopHeaderProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  isConnected,
  activeTabTitle = 'Overview',
  onOpenAddStation,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStation =
    stations.find((s) => s.id === selectedStationId) || stations[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between">
      {/* Left: View Title & Station Selector */}
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight capitalize">
          {activeTabTitle}
        </h1>

        {/* Station Selector Dropdown Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>
              {selectedStation?.id} {selectedStation?.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 p-1.5 animate-scale-up">
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Switch Monitoring Station
              </div>
              {stations.map((st) => {
                const isSelected = st.id === selectedStationId;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      onSelectStation(st.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-[#123c28] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          st.status === 'ONLINE'
                            ? 'bg-emerald-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span>
                        {st.id} — {st.name}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#123c28]" />}
                  </button>
                );
              })}
              <div className="pt-1.5 mt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenAddStation?.();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#123c28] hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add New Station</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Station Button */}
        {onOpenAddStation && (
          <button
            onClick={onOpenAddStation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#123c28] hover:bg-[#0e2f20] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Deploy new physical monitoring station"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Station</span>
          </button>
        )}
      </div>

      {/* Right: Live Stream Status & User Profile */}
      <div className="flex items-center gap-5">
        {/* Live Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-xs font-medium text-emerald-800">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="font-semibold">Live Telemetry Active</span>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-[#123c28] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            FC
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              Field Commander
            </div>
            <div className="text-[11px] text-slate-400 leading-tight">
              Taskforce Bravo
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
