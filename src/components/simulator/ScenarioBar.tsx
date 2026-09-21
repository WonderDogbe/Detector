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
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/40 shadow-2xl shadow-black/80 bg-[#0A0F1E]/95 backdrop-blur-xl">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-slate-100">
                Live Scenario Injector
              </h4>
              <p className="text-[11px] text-slate-400">
                Simulate environmental conditions & trigger live alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Selector */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Apply scenario to:</span>
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setTargetScope('selected')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                targetScope === 'selected'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Current ({selectedStationId})
            </button>
            <button
              onClick={() => setTargetScope('all')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                targetScope === 'all'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All 3 Stations
            </button>
          </div>
        </div>

        {/* Feedback banner */}
        {feedbackMsg && (
          <div className="mt-2 py-1.5 px-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-1.5 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{feedbackMsg}</span>
          </div>
        )}

        {/* Scenario Action Buttons (Section 17 of project vision) */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {/* Scenario 1: Normal */}
          <button
            onClick={() => handleTrigger('NORMAL', 'Scenario 1: Normal Ambient')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeScenario === 'NORMAL'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display">1. Normal Ambient</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Low Sound + Low Vibration (Score: 12-25)
            </p>
          </button>

          {/* Scenario 2: Rain */}
          <button
            onClick={() => handleTrigger('RAIN', 'Scenario 2: Heavy Rainstorm')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeScenario === 'RAIN'
                ? 'bg-blue-500/20 border-blue-400 text-blue-200'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" /> 2. Rainstorm
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              High Sound + Rain Detected (Filter dampens score)
            </p>
          </button>

          {/* Scenario 3: Vehicle */}
          <button
            onClick={() => handleTrigger('VEHICLE', 'Scenario 3: Passing Vehicle')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeScenario === 'VEHICLE'
                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-400" /> 3. Vehicle Transit
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Elevated sound + moderate vibration (Score ~50)
            </p>
          </button>

          {/* Scenario 4: Possible Heavy Machinery */}
          <button
            onClick={() => handleTrigger('MACHINERY', 'Scenario 4: Possible Heavy Machinery')}
            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
              activeScenario === 'MACHINERY'
                ? 'bg-rose-500/25 border-rose-400 text-rose-200 ring-2 ring-rose-500/50'
                : 'bg-rose-950/30 border-rose-800/60 text-rose-300 hover:bg-rose-900/40 hover:border-rose-500/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-display flex items-center gap-1 text-rose-300">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> 4. Heavy Machinery
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </div>
            <p className="text-[10px] text-rose-400/80 mt-1 font-semibold">
              High Sound + High Vibration + 118Hz (Triggers Alert)
            </p>
          </button>
        </div>

        {/* Bottom Actions: Reset */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Active mode: <span className="font-mono text-cyan-400 font-semibold">{activeScenario}</span>
          </span>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
};
