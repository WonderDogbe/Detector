import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Cpu, X, Save, AlertCircle, MapPin, CheckCircle2, Navigation } from 'lucide-react';
import type { Station } from '../../types';

interface ConfigureStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
  onUpdateStation: (
    stationId: string,
    updates: {
      name?: string;
      location_name?: string;
      latitude?: number;
      longitude?: number;
      status?: string;
    }
  ) => Promise<any>;
}

export const ConfigureStationModal: FC<ConfigureStationModalProps> = ({
  isOpen,
  onClose,
  station,
  onUpdateStation,
}) => {
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [status, setStatus] = useState<string>('ONLINE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (station && isOpen) {
      setName(station.name || '');
      setLocationName(station.location_name || '');
      setLatitude(station.latitude !== undefined ? station.latitude.toString() : '5.4120');
      setLongitude(station.longitude !== undefined ? station.longitude.toString() : '-1.6210');
      setStatus(station.status || 'ONLINE');
      setError(null);
      setSuccess(false);
    }
  }, [station, isOpen]);

  if (!isOpen || !station) return null;

  const isAutoDetected =
    station.name.startsWith('New Station') ||
    station.location_name.includes('Awaiting') ||
    station.location_name.includes('Auto-detected');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Station name cannot be empty');
      return;
    }

    if (!locationName.trim()) {
      setError('Location / River basin name cannot be empty');
      return;
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lonNum)) {
      setError('Please enter valid decimal numbers for Latitude and Longitude');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateStation(station.id, {
        name: name.trim(),
        location_name: locationName.trim(),
        latitude: latNum,
        longitude: lonNum,
        status,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to update station');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyPreset = (preset: {
    name: string;
    location: string;
    lat: string;
    lon: string;
  }) => {
    setName(preset.name);
    setLocationName(preset.location);
    setLatitude(preset.lat);
    setLongitude(preset.lon);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#123c28] text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-slate-900">
                  Configure Station {station.id}
                </h3>
                {isAutoDetected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Auto-Detected Hardware
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isAutoDetected
                  ? 'Hardware detected live from Raspberry Pi! Assign a custom name and location below.'
                  : 'Update station identity, location metadata, and coordinates.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Station metadata successfully saved!</span>
            </div>
          )}

          {/* Station & Device Hardware IDs (Read-Only) */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                Station ID
              </label>
              <div className="font-mono text-xs font-bold text-slate-800">
                {station.id}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                Hardware Device ID
              </label>
              <div className="font-mono text-xs font-semibold text-slate-700 truncate" title={station.device_id}>
                {station.device_id}
              </div>
            </div>
          </div>

          {/* Station Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Station Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ankobra River Sector Charlie"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
              required
            />
          </div>

          {/* Location / Catchment Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Location / Basin Description <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Ankobra Basin — Prestea Infiltration Zone"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
                required
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Latitude (°N)</span>
                <span className="text-[10px] font-normal text-slate-400 font-mono">GPS</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="5.2140"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
                  required
                />
                <Navigation className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Longitude (°W)</span>
                <span className="text-[10px] font-normal text-slate-400 font-mono">GPS</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-2.1520"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
                  required
                />
                <Navigation className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Station Operational Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ONLINE', label: 'Online' },
                { id: 'MAINTENANCE', label: 'Maintenance' },
                { id: 'OFFLINE', label: 'Offline' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setStatus(item.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    status === item.id
                      ? 'bg-[#123c28] text-white border-[#123c28] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Ghanaian Mining Hotspot Presets */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              Quick Ghanaian Basin Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  label: 'Ankobra Basin',
                  name: 'Ankobra River Sector',
                  location: 'Ankobra River Basin — Prestea Sector',
                  lat: '5.2140',
                  lon: '-2.1520',
                },
                {
                  label: 'Birim Basin',
                  name: 'Birim River Sector',
                  location: 'Birim River Basin — Eastern Region',
                  lat: '6.2310',
                  lon: '-0.5820',
                },
                {
                  label: 'Tano Basin',
                  name: 'Tano River Corridor',
                  location: 'Tano Basin — Western North Fringe',
                  lat: '5.7520',
                  lon: '-2.5410',
                },
                {
                  label: 'Offin River',
                  name: 'Offin River Station',
                  location: 'Offin River Basin — Dunkwa Enclave',
                  lat: '5.9650',
                  lon: '-1.7820',
                },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-[#123c28] text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200/60"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#123c28] hover:bg-[#0e2f20] text-white shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
