import { useState } from 'react';
import type { FC } from 'react';
import { Radio, X, Plus, AlertCircle } from 'lucide-react';
import type { Station } from '../../types';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  onCreateStation: (station: {
    id: string;
    device_id: string;
    name: string;
    location_name: string;
    latitude: number;
    longitude: number;
  }) => Promise<any>;
  onSelectStation: (id: string) => void;
}

export const AddStationModal: FC<AddStationModalProps> = ({
  isOpen,
  onClose,
  stations,
  onCreateStation,
  onSelectStation,
}) => {
  // Suggest next available station ID
  const nextNumber = stations.length + 1;
  const suggestedId = `GG-${String(nextNumber).padStart(3, '0')}`;

  const [id, setId] = useState(suggestedId);
  const [deviceId, setDeviceId] = useState(`RPI4-GG-NODE${nextNumber}`);
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('5.2140');
  const [longitude, setLongitude] = useState('-2.1520');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = id.trim().toUpperCase();
    if (!cleanId) {
      setError('Station ID is required');
      return;
    }
    if (stations.some((s) => s.id === cleanId)) {
      setError(`Station with ID '${cleanId}' already exists`);
      return;
    }
    if (!name.trim()) {
      setError('Station name is required');
      return;
    }
    if (!locationName.trim()) {
      setError('Geographic location/basin is required');
      return;
    }

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lonNum)) {
      setError('Please provide valid decimal coordinates for Latitude and Longitude');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateStation({
        id: cleanId,
        device_id: deviceId.trim() || `RPI-NODE-${cleanId}`,
        name: name.trim(),
        location_name: locationName.trim(),
        latitude: latNum,
        longitude: lonNum,
      });

      onSelectStation(cleanId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create station');
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
            <div className="w-9 h-9 rounded-xl bg-[#123c28] text-white flex items-center justify-center shadow-xs">
              <Radio className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Deploy New Monitoring Node
              </h3>
              <p className="text-xs text-slate-500">
                Register a telemetry station into the database and fleet grid
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
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Presets Row */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Quick Catchment Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    name: 'Ankobra River Confluence',
                    location: 'Ankobra Basin — Sector Beta',
                    lat: '5.2140',
                    lon: '-2.1520',
                  })
                }
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Ankobra River
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    name: 'Birim River Upstream',
                    location: 'Birim Catchment — Sector Delta',
                    lat: '6.1200',
                    lon: '-0.9800',
                  })
                }
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Birim River
              </button>
              <button
                type="button"
                onClick={() =>
                  applyPreset({
                    name: 'Tano Basin Perimeter',
                    location: 'Tano Forest Reserve Buffer',
                    lat: '5.8500',
                    lon: '-2.4100',
                  })
                }
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Tano Forest
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Station ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Station ID *
              </label>
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. GG-004"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
              />
            </div>

            {/* Hardware Device ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hardware Device ID
              </label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g. RPI4-GG-ANKOBRA"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Station Display Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ankobra River Confluence"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
            />
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Geographic Area / Sector Basin *
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Ankobra Basin — Sector Beta"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Latitude (°N) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="5.2140"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Longitude (°W) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-2.1520"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#123c28]/20 focus:border-[#123c28]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#123c28] hover:bg-[#0e2f20] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Register Station</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
