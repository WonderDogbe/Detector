import { useState } from 'react';
import type { FC } from 'react';
import type { Alert, AlertStatus, SensorReading } from '../../types';
import { Volume2, Activity, Droplets, CheckCircle2 } from 'lucide-react';

interface PriorityIncidentCardProps {
  alerts: Alert[];
  latestReading?: SensorReading;
  onUpdateStatus: (
    alertId: string,
    status: AlertStatus,
    notes?: string
  ) => Promise<boolean> | void;
}

export const PriorityIncidentCard: FC<PriorityIncidentCardProps> = ({
  alerts,
  latestReading,
  onUpdateStatus,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find priority alert (unreviewed high risk first)
  const priorityAlert =
    alerts.find((a) => a.status === 'UNREVIEWED' || a.status === 'UNDER REVIEW') ||
    alerts[0];

  const handleAction = async (status: AlertStatus) => {
    if (!priorityAlert) return;
    setIsSubmitting(true);
    try {
      await onUpdateStatus(priorityAlert.id, status);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract snapshot factors or live readings
  const soundVal = priorityAlert?.snapshot_readings?.sound_rms !== undefined
    ? Math.round(priorityAlert.snapshot_readings.sound_rms * 100)
    : Math.round((latestReading?.sound_rms ?? 0.72) * 100);

  const vibVal = priorityAlert?.snapshot_readings?.vibration_rms !== undefined
    ? Math.round(priorityAlert.snapshot_readings.vibration_rms * 100)
    : Math.round((latestReading?.vibration_rms ?? 0.43) * 100);

  const hasRain = priorityAlert?.snapshot_readings?.rain_detected !== undefined
    ? priorityAlert.snapshot_readings.rain_detected
    : latestReading?.rain_detected ?? false;

  const alertCode = priorityAlert?.id
    ? `#${priorityAlert.id}`
    : '#ALT-2026-0921';

  const currentStatus = priorityAlert?.status || 'UNREVIEWED';

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Card Header: Tag & ID */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Priority Incident</span>
        </div>
        <span className="text-xs font-mono font-medium text-slate-400">
          {alertCode}
        </span>
      </div>

      {/* Main Title & Subtitle */}
      <div>
        <h3 className="text-lg font-display font-bold text-slate-900 leading-snug">
          {priorityAlert?.description || 'Possible machinery-related activity detected'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Human verification required before dispatch
        </p>
      </div>

      {/* Contributing Factors Container */}
      <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60 space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Contributing Factors
        </div>

        {/* Factor 1: Sound */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-600 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-slate-700">Sound Threshold</span>
          </div>
          <span className="font-semibold text-slate-900">
            {soundVal}% RMS <span className="text-rose-600 font-bold">(High)</span>
          </span>
        </div>

        {/* Factor 2: Vibration */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-600 font-medium">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-slate-700">Ground Vibration</span>
          </div>
          <span className="font-semibold text-slate-900">
            {vibVal}% RMS <span className="text-amber-600 font-bold">(Elevated)</span>
          </span>
        </div>

        {/* Factor 3: Rain Masking */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <Droplets className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-700">Rain Masking</span>
          </div>
          <span className="font-semibold text-slate-900">
            {hasRain ? (
              <span className="text-blue-600 font-bold">Rain Active (Masked)</span>
            ) : (
              'No Rain (0 mm)'
            )}
          </span>
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-semibold text-slate-500">Current Status</span>
        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            currentStatus === 'UNREVIEWED'
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : currentStatus === 'UNDER REVIEW'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : currentStatus === 'ACKNOWLEDGED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {currentStatus}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {/* Primary Action Button */}
        <button
          disabled={isSubmitting || !priorityAlert}
          onClick={() => handleAction('ACKNOWLEDGED')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#123c28] hover:bg-[#0e2f20] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Acknowledge Alert</span>
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={isSubmitting || !priorityAlert}
            onClick={() => handleAction('UNDER REVIEW')}
            className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            Under Review
          </button>
          <button
            disabled={isSubmitting || !priorityAlert}
            onClick={() => handleAction('FALSE POSITIVE')}
            className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            Flag False Positive
          </button>
        </div>
      </div>
    </div>
  );
};
