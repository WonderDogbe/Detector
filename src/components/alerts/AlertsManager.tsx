import { useState } from 'react';
import type { FC } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ShieldCheck,
  UserCheck,
  Eye,
  X,
  Volume2,
  Waves,
  CloudRain,
} from 'lucide-react';
import type { Alert, AlertStatus } from '../../types';

interface AlertsManagerProps {
  alerts: Alert[];
  onUpdateStatus: (alertId: string, status: AlertStatus, reviewerNotes?: string) => void;
  onSelectStation: (stationId: string) => void;
}

export const AlertsManager: FC<AlertsManagerProps> = ({
  alerts,
  onUpdateStatus,
  onSelectStation,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [actionStatus, setActionStatus] = useState<AlertStatus>('ACKNOWLEDGED');

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const handleOpenReview = (alert: Alert) => {
    setSelectedAlert(alert);
    setReviewNotes(alert.reviewer_notes || '');
    setActionStatus(alert.status === 'UNREVIEWED' ? 'ACKNOWLEDGED' : alert.status);
  };

  const handleSaveReview = () => {
    if (selectedAlert) {
      onUpdateStatus(selectedAlert.id, actionStatus, reviewNotes);
      setSelectedAlert(null);
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'UNREVIEWED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-950 text-rose-300 border border-rose-800/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            UNREVIEWED
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            ACKNOWLEDGED
          </span>
        );
      case 'UNDER REVIEW':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 text-white border border-zinc-600">
            UNDER REVIEW
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            RESOLVED
          </span>
        );
      case 'FALSE POSITIVE':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
            FALSE POSITIVE
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2 tracking-tight">
            <AlertTriangle className="w-4 h-4 text-zinc-300" />
            Human Verification & Incident Audit Console
          </h3>
          <p className="text-xs text-zinc-400">
            Automated alerts requiring human operator triage, investigation, and field disposition.
          </p>
        </div>

        {/* Status Filters - Sleek monochrome segmented control */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-400 ml-2" />
          {['ALL', 'UNREVIEWED', 'ACKNOWLEDGED', 'UNDER REVIEW', 'RESOLVED', 'FALSE POSITIVE'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Alerts Table / Feed */}
      <div className="glass-panel rounded-2xl border border-zinc-800/80 bg-zinc-900/60 overflow-hidden shadow-xl">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-zinc-500 opacity-60" />
            <p className="text-sm font-medium text-zinc-200">
              No alerts matching the selected filter.
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              All stations currently operating within normal parameters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredAlerts.map((alert) => {
              const d = new Date(alert.timestamp);
              const formattedTime = d.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={alert.id}
                  className="p-4 sm:p-5 hover:bg-zinc-850/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-zinc-400 font-medium">
                        {alert.id}
                      </span>
                      <span className="font-bold text-sm text-white">
                        {alert.station_id}: {alert.station_name || 'Station'}
                      </span>
                      {getStatusBadge(alert.status)}
                      <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800/80">
                        Score: {alert.risk_score}
                      </span>
                    </div>

                    {/* Standardized vision text */}
                    <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
                      "{alert.description}"
                    </p>

                    {/* Contributing Sensor Snapshot Pill */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap pt-1">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" /> {formattedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-zinc-300" /> Sound RMS:{' '}
                        <span className="font-mono text-zinc-200 font-medium">
                          {alert.snapshot_readings.sound_rms}
                        </span>{' '}
                        ({alert.snapshot_readings.dominant_frequency} Hz)
                      </span>
                      <span className="flex items-center gap-1">
                        <Waves className="w-3.5 h-3.5 text-zinc-300" /> Vibration RMS:{' '}
                        <span className="font-mono text-zinc-200 font-medium">
                          {alert.snapshot_readings.vibration_rms}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CloudRain className="w-3.5 h-3.5 text-zinc-300" /> Rain:{' '}
                        <span className="text-zinc-200 font-mono font-medium">
                          {alert.snapshot_readings.rain_detected ? 'YES' : 'NO'}
                        </span>
                      </span>
                    </div>

                    {alert.reviewer_notes && (
                      <div className="mt-2 text-xs bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-zinc-300">
                        <span className="font-semibold text-zinc-100">Reviewer Note: </span>
                        {alert.reviewer_notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenReview(alert)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Review & Update</span>
                    </button>
                    <button
                      onClick={() => onSelectStation(alert.station_id)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
                      title="Inspect station telemetry"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Human Review Modal / Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-zinc-400 font-semibold">
                {selectedAlert.id}
              </span>
              <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800/80">
                Score {selectedAlert.risk_score} — {selectedAlert.risk_level}
              </span>
            </div>

            <h4 className="text-base font-bold text-white font-display">
              Human Review: {selectedAlert.station_id} ({selectedAlert.station_name})
            </h4>

            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Recorded at: {new Date(selectedAlert.timestamp).toLocaleString()}
            </p>

            {/* Snapshot metrics box */}
            <div className="mt-4 p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs space-y-1.5">
              <div className="text-zinc-200 font-semibold mb-1">
                Telemetry Snapshot at Trigger:
              </div>
              <div className="grid grid-cols-2 gap-2 text-zinc-400">
                <div>Sound RMS: <span className="text-zinc-100 font-mono">{selectedAlert.snapshot_readings.sound_rms}</span></div>
                <div>Acoustic Freq: <span className="text-zinc-100 font-mono">{selectedAlert.snapshot_readings.dominant_frequency} Hz</span></div>
                <div>Vibration RMS: <span className="text-zinc-100 font-mono">{selectedAlert.snapshot_readings.vibration_rms}</span></div>
                <div>Precipitation: <span className="text-zinc-100 font-mono font-semibold">{selectedAlert.snapshot_readings.rain_detected ? 'RAIN' : 'NO RAIN'}</span></div>
              </div>
            </div>

            {/* Status Change Selector */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-zinc-300 mb-2">
                Set Verification Status:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(
                  [
                    'UNREVIEWED',
                    'ACKNOWLEDGED',
                    'UNDER REVIEW',
                    'RESOLVED',
                    'FALSE POSITIVE',
                  ] as AlertStatus[]
                ).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setActionStatus(status)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      actionStatus === status
                        ? 'bg-white text-zinc-950 font-bold border-white shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850 hover:text-zinc-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Operator Review Notes */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Investigation / Reviewer Field Notes:
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="E.g., Contacted district ranger post. Sound confirmed as authorized road maintenance bulldozer or requires dispatch of inspection team..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReview}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-zinc-200 text-zinc-950 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Verification Decision</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
