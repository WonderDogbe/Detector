import type { FC } from 'react';
import type { SensorReading, Station } from '../../types';
import { Volume2, Activity, Thermometer, Compass } from 'lucide-react';

interface LiveSensorStreamProps {
  station: Station;
  reading?: SensorReading;
}

export const LiveSensorStream: FC<LiveSensorStreamProps> = ({
  station,
  reading,
}) => {
  // Sound metrics
  const soundRmsPct = Math.round((reading?.sound_rms ?? 0.72) * 100);
  let soundBadge = { text: 'Normal', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (soundRmsPct >= 65) {
    soundBadge = { text: 'High', bg: 'bg-rose-50 text-rose-600 border-rose-200' };
  } else if (soundRmsPct >= 40) {
    soundBadge = { text: 'Elevated', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  // Vibration metrics
  const vibRmsPct = Math.round((reading?.vibration_rms ?? 0.43) * 100);
  let vibBadge = { text: 'Low', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (vibRmsPct >= 50) {
    vibBadge = { text: 'Critical', bg: 'bg-rose-50 text-rose-600 border-rose-200' };
  } else if (vibRmsPct >= 25) {
    vibBadge = { text: 'Elevated', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  }

  // Weather metrics
  const temp = reading?.temperature ? reading.temperature.toFixed(1) : '27.4';
  const humidity = reading?.humidity ? Math.round(reading.humidity) : 78;
  const isRain = reading?.rain_detected ?? false;

  // GPS metrics
  const lat = reading?.latitude
    ? `${reading.latitude.toFixed(4)}° N`
    : `${station.latitude.toFixed(4)}° N`;
  const lon = reading?.longitude
    ? `${Math.abs(reading.longitude).toFixed(4)}° W`
    : `${Math.abs(station.longitude).toFixed(4)}° W`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Live Sensor Stream ({station.id})
        </h3>
        <span className="text-[11px] font-medium text-slate-400">
          Raw Edge Telemetry (INMP441 • MPU6050 • BME280)
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Sensor 1: Sound */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Volume2 className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">graphic_eq</span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${soundBadge.bg}`}>
              {soundBadge.text}
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-slate-900">
                {soundRmsPct}%
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase">RMS</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sound (INMP441)
            </p>
          </div>
        </div>

        {/* Sensor 2: Vibration */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Activity className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">vibration</span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${vibBadge.bg}`}>
              {vibBadge.text}
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-slate-900">
                {vibRmsPct}%
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase">RMS</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vibration (MPU6050)
            </p>
          </div>
        </div>

        {/* Sensor 3: Weather */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Thermometer className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">thermostat</span>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isRain
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isRain ? 'Rain Active' : 'No Rain'}
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-slate-900">
                {temp}°C
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {humidity}% RH (BME280)
            </p>
          </div>
        </div>

        {/* Sensor 4: Location */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Compass className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-600">location_on</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              3D Fix
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold text-slate-900">
                {lat}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lon} (GPS)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
