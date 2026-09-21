import { useState } from 'react';
import type { FC } from 'react';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Radio,
  Sliders,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface DemoTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerMachineryDemo: () => void;
  onNavigateToAlerts: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: '1. Dashboard Overview & Network Status',
    description:
      'The GalamseyGuard dashboard displays virtual IoT stations located across sensitive river basins, forest reserves, and community boundaries in Ghana.',
    highlight: 'Notice the top stats bar tracking active stations, peak threat score, and rain dampening status.',
    icon: Radio,
  },
  {
    step: 2,
    title: '2. Multi-Station Geospatial Grid',
    description:
      'View monitoring nodes (GG-001 River Area, GG-002 Forest Area, GG-003 Community Area) on the interactive map. Markers glow and pulse according to their real-time activity level.',
    highlight: 'Click any marker on the map to inspect instant telemetry and switch station focus.',
    icon: ShieldAlert,
  },
  {
    step: 3,
    title: '3. Multi-Modal Sensor Telemetry',
    description:
      'Each station captures 6 core environmental signals: Acoustic Sound RMS & Dominant Frequency (INMP441), Ground Vibration RMS (MPU6050), Rain Presence, Temperature, Humidity, and Pressure (BME280).',
    highlight: 'Inspect the live progress bars and frequency badges in the Telemetry section.',
    icon: Sparkles,
  },
  {
    step: 4,
    title: '4. Multi-Sensor Fusion & Rain Dampening',
    description:
      'The scoring engine differentiates causes. For example, tropical rainstorms generate loud acoustic noise without vibration; the rain filter automatically dampens the acoustic index to prevent false alarms.',
    highlight: 'Try injecting Scenario 2 (Rainstorm) to see rain dampening in action!',
    icon: Sliders,
  },
  {
    step: 5,
    title: '5. Machinery Pattern Identification',
    description:
      'Heavy machinery (excavators, diesel generators, wash plants) produces high sound and low-frequency vibration (50–220 Hz) concurrently with no rain.',
    highlight: 'Click "Trigger Machinery Demo" below to simulate an acute surge on Station GG-001.',
    actionButton: true,
    icon: AlertTriangle,
  },
  {
    step: 6,
    title: '6. Human Verification & Audit Lifecycle',
    description:
      'Responsible deployment: The system never declares "Galamsey confirmed." Instead, it creates an alert: "Possible machinery-related activity detected. Human verification required."',
    highlight: 'A human reviewer inspects sensor snapshots and logs field decisions (Acknowledge, Investigate, Resolve, False Positive).',
    actionNavigateAlerts: true,
    icon: UserCheck,
  },
];

export const DemoTourModal: FC<DemoTourModalProps> = ({
  isOpen,
  onClose,
  onTriggerMachineryDemo,
  onNavigateToAlerts,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-cyan-500/40 p-6 shadow-2xl relative bg-[#0B1120]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
            <StepIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Prototype Demonstration Walkthrough
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {TOUR_STEPS.map((s, idx) => (
                <div
                  key={s.step}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-6 bg-cyan-400'
                      : idx < currentStepIndex
                      ? 'w-2.5 bg-emerald-500'
                      : 'w-2.5 bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Step Title & Details */}
        <div className="mt-4">
          <h3 className="font-display font-bold text-lg text-slate-100">
            {currentStep.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-amber-300/90 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{currentStep.highlight}</span>
          </div>

          {/* Interactive Trigger Button inside modal for Step 5 */}
          {currentStep.actionButton && (
            <div className="mt-4 pt-2">
              <button
                onClick={() => {
                  onTriggerMachineryDemo();
                  handleNext();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simulate Heavy Machinery Anomaly on GG-001</span>
              </button>
            </div>
          )}

          {/* Navigate to Alerts Button for Step 6 */}
          {currentStep.actionNavigateAlerts && (
            <div className="mt-4 pt-2">
              <button
                onClick={() => {
                  onNavigateToAlerts();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Open Human Verification Console</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
              currentStepIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {currentStepIndex + 1} / {TOUR_STEPS.length}
          </span>

          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-cyan-900/30"
          >
            <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
