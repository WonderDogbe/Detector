import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import L from 'leaflet';
import type { Station, SensorReading } from '../../types';
import { Radio } from 'lucide-react';

interface StationMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  allLatestReadings: Record<string, SensorReading | undefined>;
}

export const StationMap: FC<StationMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  allLatestReadings,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const selectedStation =
    stations.find((s) => s.id === selectedStationId) || stations[0];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedStation?.latitude || 5.8;
    const initialLng = selectedStation?.longitude || -1.2;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 8,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    // Dark Matter tile layer
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center when selected station changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStation) return;

    map.flyTo([selectedStation.latitude, selectedStation.longitude], 10, {
      duration: 1.2,
    });
  }, [selectedStationId, selectedStation]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    stations.forEach((station) => {
      const reading = allLatestReadings[station.id];
      const score = reading?.activity_score || 0;
      const riskLevel = reading?.risk_level || 'NORMAL';
      const isSelected = station.id === selectedStationId;

      let colorClass = 'bg-emerald-500 border-emerald-300';
      let pulseClass = 'pulse-radar-normal';

      if (score >= 61) {
        colorClass = 'bg-rose-500 border-rose-300';
        pulseClass = 'pulse-radar-alert';
      } else if (score >= 31) {
        colorClass = 'bg-amber-500 border-amber-300';
        pulseClass = 'pulse-radar-normal';
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-8 h-8 rounded-full ${colorClass} ${pulseClass} opacity-75"></div>
          <div class="relative z-10 flex items-center justify-center w-7 h-7 rounded-full ${colorClass} text-white font-bold text-[10px] border-2 shadow-lg shadow-black/60 transition-transform duration-200 group-hover:scale-125 ${
        isSelected ? 'ring-4 ring-cyan-400 scale-110' : ''
      }">
            ${station.id.replace('GG-', '')}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-station-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const popupHtml = `
        <div class="w-60 p-1 font-sans">
          <div class="flex items-center justify-between pb-2 border-b border-slate-700">
            <span class="font-bold text-sm text-slate-100">
              ${station.id}: ${station.name}
            </span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
              score >= 61
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : score >= 31
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }">
              ${riskLevel} (${score})
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1 mb-2">${station.location_name}</p>
          ${
            reading
              ? `
            <div class="space-y-1 text-xs text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div class="flex justify-between">
                <span class="text-slate-400">Sound RMS:</span>
                <span class="font-mono font-medium">${(reading.sound_rms * 100).toFixed(0)}% (~${reading.sound_db} dB)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Vibration RMS:</span>
                <span class="font-mono font-medium">${(reading.vibration_rms * 100).toFixed(0)}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Rain Status:</span>
                <span class="font-bold ${reading.rain_detected ? 'text-blue-400' : 'text-slate-400'}">
                  ${reading.rain_detected ? 'ACTIVE RAIN' : 'DRY'}
                </span>
              </div>
            </div>
          `
              : '<p class="text-xs text-slate-400 italic">No telemetry</p>'
          }
          <button
            id="select-station-btn-${station.id}"
            class="w-full mt-2.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
          >
            Select & Focus Station
          </button>
        </div>
      `;

      let marker = markersRef.current.get(station.id);
      if (!marker) {
        marker = L.marker([station.latitude, station.longitude], {
          icon: customIcon,
        }).addTo(map);

        marker.on('click', () => {
          onSelectStation(station.id);
        });

        marker.bindPopup(popupHtml);
        marker.on('popupopen', () => {
          const btn = document.getElementById(`select-station-btn-${station.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectStation(station.id);
              marker?.closePopup();
            };
          }
        });

        markersRef.current.set(station.id, marker);
      } else {
        marker.setIcon(customIcon);
        marker.setPopupContent(popupHtml);
      }
    });
  }, [stations, allLatestReadings, selectedStationId, onSelectStation]);

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl glass-panel">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-[#0A0F1D]/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800/80 shadow-lg flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-display font-semibold text-slate-200">
            Geospatial Sensor Grid — Southern Ghana
          </span>
        </div>
        <span className="text-[11px] text-slate-400 border-l border-slate-700 pl-3">
          3 Virtual Edge Nodes
        </span>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#0A0F1D]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800/80 shadow-lg text-[11px] flex items-center gap-3.5 text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Normal (0–30)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Elevated (31–60)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span>High (61–100)</span>
        </div>
      </div>

      {/* The Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
