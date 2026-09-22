import { useState } from 'react';
import type { FC } from 'react';
import {
  Sliders,
  CloudRain,
  Truck,
  AlertOctagon,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import type { SimulationScenario, Station } from '../../types';

interface ScenarioBarProps {
  isOpen: boolean;
  onClose: () => void;
  stations?: Station[];
  selectedStationId: string;
  onSelectStation?: (id: string) => void;
  activeScenario: SimulationScenario;
  onTriggerScenario: (scenario: SimulationScenario, stationId?: string, duration?: number) => void;
  onResetToNormal: () => void;
}

export const ScenarioBar: FC<ScenarioBarProps> = ({
  isOpen,
  onClose,
  selectedStationId,
  activeScenario,
  onTriggerScenario,
  onResetToNormal,
}) => {
  const [targetScope, setTargetScope] = useState<'selected' | 'all'>('selected');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrigger = (scenario: SimulationScenario, label: string) => {
    const stationId = targetScope === 'selected' ? selectedStationId : undefined;
    onTriggerScenario(scenario, stationId, 60);

    setFeedbackMsg(
      `Injected "${label}" on ${
        targetScope === 'selected' ? selectedStationId : 'ALL stations'
      }`
    );
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleReset = () => {
    onResetToNormal();
    setFeedbackMsg('Reset all stations to Normal Ambient baseline.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[480px] z-50 animate-slide-up">
      <div className="p-5 rounded-2xl border border-zinc-700 shadow-2xl shadow-black/80 bg-zinc-950/95 backdrop-blur-xl">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white tracking-tight">
                Live Scenario Injector
              </h4>
              <p className="text-[11px] text-zinc-400">
                Simulate environmental conditions & observe telemetry response
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Selector */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Apply scenario to:</span>
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setTargetScope('selected')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                targetScope === 'selected'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Current ({selectedStationId})
            </button>
            <button
              onClick={() => setTargetScope('all')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                targetScope === 'all'
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All 3 Stations
            </button>
          </div>
        </div>

        {/* Feedback banner */}
        {feedbackMsg && (
          <div className="mt-2 py-1.5 px-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 animate-fade-in font-mono">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{feedbackMsg}</span>
          </div>
        )}

        {/* Scenario Action Buttons */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {/* Scenario 1: Normal */}
          <button
            onClick={() => handleTrigger('NORMAL', 'Scenario 1: Normal Ambient')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeScenario === 'NORMAL'
                ? 'bg-zinc-850 border-zinc-400 text-white shadow-sm ring-1 ring-white/10'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display text-white">1. Normal Ambient</span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Low Sound + Low Vibration (Score: 10-25)
            </p>
          </button>

          {/* Scenario 2: Rain */}
          <button
            onClick={() => handleTrigger('RAIN', 'Scenario 2: Heavy Rainstorm')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeScenario === 'RAIN'
                ? 'bg-zinc-850 border-zinc-400 text-white shadow-sm ring-1 ring-white/10'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display flex items-center gap-1 text-white">
                <CloudRain className="w-3.5 h-3.5 text-zinc-300" /> 2. Rainstorm
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              High Sound + Rain Filter engaged
            </p>
          </button>

          {/* Scenario 3: Vehicle */}
          <button
            onClick={() => handleTrigger('VEHICLE', 'Scenario 3: Passing Vehicle')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeScenario === 'VEHICLE'
                ? 'bg-zinc-850 border-zinc-400 text-white shadow-sm ring-1 ring-white/10'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display flex items-center gap-1 text-white">
                <Truck className="w-3.5 h-3.5 text-zinc-300" /> 3. Vehicle Transit
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Elevated sound + moderate vibration (Score ~50)
            </p>
          </button>

          {/* Scenario 4: Possible Heavy Machinery */}
          <button
            onClick={() => handleTrigger('MACHINERY', 'Scenario 4: Possible Heavy Machinery')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeScenario === 'MACHINERY'
                ? 'bg-rose-950/60 border-rose-500 text-white ring-1 ring-rose-500'
                : 'bg-zinc-900 border-rose-900/60 text-rose-300 hover:bg-zinc-850 hover:border-rose-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display flex items-center gap-1 text-rose-300">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> 4. Heavy Machinery
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              High Sound + Vibration + 118Hz (Alert)
            </p>
          </button>
        </div>

        {/* Bottom Actions: Reset */}
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] text-zinc-400">
            Active mode: <span className="font-mono text-white font-semibold">{activeScenario}</span>
          </span>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
