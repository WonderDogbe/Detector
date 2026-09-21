import type { FC } from 'react';
import {
  Volume2,
  Waves,
  Thermometer,
  Droplets,
  Gauge,
  CloudRain,
  Sun,
  Cpu,
  Radio,
  Zap,
} from 'lucide-react';
import type { SensorReading, Station, DeviceHealth } from '../../types';

interface SensorCardsProps {
  station: Station;
  reading: SensorReading | undefined;
  health: DeviceHealth | undefined;
}

export const SensorCards: FC<SensorCardsProps> = ({
  station,
  reading,
  health,
}) => {
  if (!reading) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">
        <Radio className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-spin" />
        <p>Awaiting incoming telemetry packet for {station.name}...</p>
      </div>
    );
  }

  const soundPercent = Math.round(reading.sound_rms * 100);
  const vibrationPercent = Math.round(reading.vibration_rms * 100);

  // Frequency categorization
  const isDieselBand =
    reading.dominant_frequency >= 50 && reading.dominant_frequency <= 220;

  return (
    <div className="space-y-4">
      {/* Station Summary Header Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-slate-100">
              {station.id}: {station.name}
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ONLINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {station.location_name} • GPS: {station.latitude.toFixed(4)}°N,{' '}
            {station.longitude.toFixed(4)}°W
          </p>
        </div>

        {/* Edge Hardware Context */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Raspberry Pi Node: {station.device_id}</span>
          </div>
          {health && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Battery: {health.battery_level}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 6 Primary Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. SOUND SENSOR CARD (INMP441) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Acoustic Sensor (INMP441)
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                soundPercent >= 65
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : soundPercent >= 35
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {soundPercent >= 65 ? 'HIGH' : soundPercent >= 35 ? 'ELEVATED' : 'NORMAL'}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-display font-extrabold text-slate-100">
                {soundPercent}%
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                RMS: <span className="font-mono text-cyan-400 font-semibold">{reading.sound_rms}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-display font-bold text-slate-200">
                ~{reading.sound_db} dB
              </div>
              <div className="text-xs text-slate-400">Est. Sound Pressure</div>
            </div>
          </div>

          {/* Sound Progress Bar */}
          <div className="mt-3 w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                soundPercent >= 65
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-400'
              }`}
              style={{ width: `${soundPercent}%` }}
            />
          </div>

          {/* Spectral Frequency Analysis */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Peak Spectral Freq:</span>
            <span
              className={`font-mono font-bold flex items-center gap-1 ${
                isDieselBand ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {reading.dominant_frequency} Hz
              {isDieselBand && (
                <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.2 rounded">
                  Low-Freq Diesel Band
                </span>
              )}
            </span>
          </div>
        </div>

        {/* 2. VIBRATION SENSOR CARD (MPU6050) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-amber-400" />
              Vibration Sensor (MPU6050)
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                vibrationPercent >= 55
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : vibrationPercent >= 25
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {vibrationPercent >= 55
                ? 'HIGH'
                : vibrationPercent >= 25
                ? 'ELEVATED'
                : 'NORMAL'}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-display font-extrabold text-slate-100">
                {vibrationPercent}%
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                RMS: <span className="font-mono text-amber-400 font-semibold">{reading.vibration_rms}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-300">Tri-Axial IMU</div>
              <div className="text-xs text-slate-400">Ground Motion Accel</div>
            </div>
          </div>

          {/* Vibration Progress Bar */}
          <div className="mt-3 w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                vibrationPercent >= 55
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-400'
              }`}
              style={{ width: `${vibrationPercent}%` }}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Mechanical Ground Agitation:</span>
            <span className="font-mono font-medium text-slate-300">
              {vibrationPercent >= 55
                ? 'High Earth Displacement'
                : vibrationPercent >= 25
                ? 'Intermittent Motion'
                : 'Seismically Quiescent'}
            </span>
          </div>
        </div>

        {/* 3. RAIN SENSOR CARD */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-blue-500/40 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-blue-400" />
              Precipitation Sensor
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                reading.rain_detected
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {reading.rain_detected ? 'ACTIVE RAIN' : 'DRY SURFACE'}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-display font-extrabold text-slate-100 flex items-center gap-2">
                {reading.rain_detected ? (
                  <>
                    <CloudRain className="w-6 h-6 text-blue-400" />
                    <span>Rain Detected</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-6 h-6 text-amber-400" />
                    <span>No Precipitation</span>
                  </>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Acoustic Dampening:{' '}
                <span
                  className={
                    reading.rain_detected
                      ? 'text-blue-400 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {reading.rain_detected ? 'ENGAGED (-55% noise)' : 'BYPASS'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            {reading.rain_detected
              ? 'Rain noise accounted for; false positive machinery alerts prevented.'
              : 'Dry environmental acoustic transmission.'}
          </div>
        </div>

        {/* 4. TEMPERATURE (BME280) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-400" />
              Temperature (BME280)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Ambient</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-display font-extrabold text-slate-100">
              {reading.temperature}°C
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Microclimate canopy thermal measurement
            </p>
          </div>
        </div>

        {/* 5. RELATIVE HUMIDITY (BME280) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-teal-400" />
              Relative Humidity (BME280)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">RH</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-display font-extrabold text-slate-100">
              {reading.humidity}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tropical atmospheric saturation index
            </p>
          </div>
        </div>

        {/* 6. BAROMETRIC PRESSURE (BME280) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-purple-400" />
              Barometric Pressure
            </span>
            <span className="text-[10px] text-slate-400 font-mono">hPa</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-display font-extrabold text-slate-100">
              {reading.pressure}{' '}
              <span className="text-base font-normal text-slate-400">hPa</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Atmospheric barometer altitude calibration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
