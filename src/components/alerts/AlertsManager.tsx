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
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            UNREVIEWED
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ACKNOWLEDGED
          </span>
        );
      case 'UNDER REVIEW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            UNDER REVIEW
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            RESOLVED
          </span>
        );
      case 'FALSE POSITIVE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600">
            FALSE POSITIVE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Human Verification & Incident Audit Console
          </h3>
          <p className="text-xs text-slate-400">
            Automated alerts requiring human operator triage, investigation, and disposition.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          {['ALL', 'UNREVIEWED', 'ACKNOWLEDGED', 'UNDER REVIEW', 'RESOLVED', 'FALSE POSITIVE'].map(
            (st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  filterStatus === st
                    ? 'bg-slate-700 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Alerts Table / Feed */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-60" />
            <p className="text-sm font-medium text-slate-300">
              No alerts matching the selected filter.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              All stations currently operating within normal parameters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
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
                  className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-400 font-medium">
                        {alert.id}
                      </span>
                      <span className="font-bold text-sm text-slate-200">
                        {alert.station_id}: {alert.station_name || 'Station'}
                      </span>
                      {getStatusBadge(alert.status)}
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        Score: {alert.risk_score}
                      </span>
                    </div>

                    {/* Standardized vision text */}
                    <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                      "{alert.description}"
                    </p>

                    {/* Contributing Sensor Snapshot Pill */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {formattedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Sound RMS:{' '}
                        <span className="font-mono text-slate-200">
                          {alert.snapshot_readings.sound_rms}
                        </span>{' '}
                        ({alert.snapshot_readings.dominant_frequency} Hz)
                      </span>
                      <span className="flex items-center gap-1">
                        <Waves className="w-3.5 h-3.5 text-amber-400" /> Vibration RMS:{' '}
                        <span className="font-mono text-slate-200">
                          {alert.snapshot_readings.vibration_rms}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rain:{' '}
                        <span className="text-slate-200">
                          {alert.snapshot_readings.rain_detected ? 'YES' : 'NO'}
                        </span>
                      </span>
                    </div>

                    {alert.reviewer_notes && (
                      <div className="mt-2 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                        <span className="font-semibold text-emerald-400">Reviewer Note: </span>
                        {alert.reviewer_notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenReview(alert)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Review & Update</span>
                    </button>
                    <button
                      onClick={() => onSelectStation(alert.station_id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-400 font-semibold">
                {selectedAlert.id}
              </span>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                Score {selectedAlert.risk_score} — {selectedAlert.risk_level}
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-100 font-display">
              Human Review: {selectedAlert.station_id} ({selectedAlert.station_name})
            </h4>

            <p className="text-xs text-slate-400 mt-1">
              Recorded at: {new Date(selectedAlert.timestamp).toLocaleString()}
            </p>

            {/* Snapshot metrics box */}
            <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="text-slate-300 font-semibold mb-1">
                Telemetry Snapshot at Trigger:
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>Sound RMS: <span className="text-slate-200 font-mono">{selectedAlert.snapshot_readings.sound_rms}</span></div>
                <div>Acoustic Freq: <span className="text-slate-200 font-mono">{selectedAlert.snapshot_readings.dominant_frequency} Hz</span></div>
                <div>Vibration RMS: <span className="text-slate-200 font-mono">{selectedAlert.snapshot_readings.vibration_rms}</span></div>
                <div>Precipitation: <span className="text-slate-200 font-semibold">{selectedAlert.snapshot_readings.rain_detected ? 'RAIN' : 'NO RAIN'}</span></div>
              </div>
            </div>

            {/* Status Change Selector */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
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
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      actionStatus === status
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Operator Review Notes */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Investigation / Reviewer Field Notes:
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="E.g., Contacted district ranger post. Sound confirmed as authorized road maintenance bulldozer or requires dispatch of inspection team..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReview}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-1.5 cursor-pointer"
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
