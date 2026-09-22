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
      <div className="glass-panel p-8 rounded-2xl text-center text-zinc-400 border border-zinc-800">
        <Radio className="w-8 h-8 mx-auto mb-2 text-zinc-600 animate-spin" />
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
    <div className="space-y-3.5">
      {/* Station Summary Header Bar */}
      <div className="glass-panel p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-zinc-800/80 bg-zinc-900/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-base text-white tracking-tight">
              {station.id}: {station.name}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ONLINE
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {station.location_name} • GPS: {station.latitude.toFixed(4)}°N,{' '}
            {station.longitude.toFixed(4)}°W
          </p>
        </div>

        {/* Edge Hardware Context */}
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono text-[11px]">Node: {station.device_id}</span>
          </div>
          {health && (
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
              <Zap className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-mono text-[11px]">Battery: {health.battery_level}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 6 Primary Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* 1. SOUND SENSOR CARD (INMP441) */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700/80 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
              Acoustic (INMP441)
            </span>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                soundPercent >= 65
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                  : soundPercent >= 35
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {soundPercent >= 65 ? 'HIGH' : soundPercent >= 35 ? 'ELEVATED' : 'NORMAL'}
            </span>
          </div>

          <div className="mt-3.5 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-display font-extrabold text-white tracking-tight">
                {soundPercent}%
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                RMS: <span className="font-mono text-zinc-200 font-medium">{reading.sound_rms}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-display font-bold text-zinc-200">
                ~{reading.sound_db} dB
              </div>
              <div className="text-[11px] text-zinc-400">Sound Pressure</div>
            </div>
          </div>

          {/* Sound Progress Bar - Crisp monochrome */}
          <div className="mt-3 w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                soundPercent >= 65
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-zinc-400 to-white'
              }`}
              style={{ width: `${soundPercent}%` }}
            />
          </div>

          {/* Spectral Frequency Analysis */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Peak Frequency:</span>
            <span
              className={`font-mono font-medium flex items-center gap-1.5 ${
                isDieselBand ? 'text-amber-300' : 'text-zinc-200'
              }`}
            >
              {reading.dominant_frequency} Hz
              {isDieselBand && (
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-1.5 py-0.2 rounded font-sans">
                  Diesel Band
                </span>
              )}
            </span>
          </div>
        </div>

        {/* 2. VIBRATION SENSOR CARD (MPU6050) */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700/80 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-zinc-300" />
              Vibration (MPU6050)
            </span>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                vibrationPercent >= 55
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                  : vibrationPercent >= 25
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {vibrationPercent >= 55
                ? 'HIGH'
                : vibrationPercent >= 25
                ? 'ELEVATED'
                : 'NORMAL'}
            </span>
          </div>

          <div className="mt-3.5 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-display font-extrabold text-white tracking-tight">
                {vibrationPercent}%
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                RMS: <span className="font-mono text-zinc-200 font-medium">{reading.vibration_rms}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-zinc-200 font-mono">Tri-Axial</div>
              <div className="text-[11px] text-zinc-400">Ground Accel</div>
            </div>
          </div>

          {/* Vibration Progress Bar */}
          <div className="mt-3 w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                vibrationPercent >= 55
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-zinc-400 to-white'
              }`}
              style={{ width: `${vibrationPercent}%` }}
            />
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Ground Status:</span>
            <span className="font-mono text-xs text-zinc-200">
              {vibrationPercent >= 55
                ? 'High Earth Agitation'
                : vibrationPercent >= 25
                ? 'Intermittent Motion'
                : 'Seismically Stable'}
            </span>
          </div>
        </div>

        {/* 3. RAIN SENSOR CARD */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700/80 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-zinc-300" />
              Precipitation
            </span>
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                reading.rain_detected
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
              }`}
            >
              {reading.rain_detected ? 'ACTIVE RAIN' : 'DRY SURFACE'}
            </span>
          </div>

          <div className="mt-3.5 flex items-center justify-between">
            <div>
              <div className="text-2xl font-display font-extrabold text-white flex items-center gap-2">
                {reading.rain_detected ? (
                  <>
                    <CloudRain className="w-5 h-5 text-zinc-300" />
                    <span>Rain Detected</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-5 h-5 text-zinc-400" />
                    <span>No Rain</span>
                  </>
                )}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Acoustic Filter:{' '}
                <span
                  className={
                    reading.rain_detected
                      ? 'text-white font-mono font-bold'
                      : 'text-zinc-400 font-mono'
                  }
                >
                  {reading.rain_detected ? 'ENGAGED (-55% noise)' : 'BYPASS'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 text-xs text-zinc-400 leading-relaxed">
            {reading.rain_detected
              ? 'Rain acoustic noise filtered to prevent false positive machinery alarms.'
              : 'Standard dry atmospheric acoustic transmission.'}
          </div>
        </div>

        {/* 4. TEMPERATURE (BME280) */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-zinc-300" />
              Ambient Temp (BME280)
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">°C</span>
          </div>
          <div className="mt-3.5">
            <div className="text-3xl font-display font-extrabold text-white tracking-tight">
              {reading.temperature}°C
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Microclimate canopy thermal level
            </p>
          </div>
        </div>

        {/* 5. RELATIVE HUMIDITY (BME280) */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-zinc-300" />
              Relative Humidity (BME280)
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">RH</span>
          </div>
          <div className="mt-3.5">
            <div className="text-3xl font-display font-extrabold text-white tracking-tight">
              {reading.humidity}%
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Atmospheric vapor saturation index
            </p>
          </div>
        </div>

        {/* 6. BAROMETRIC PRESSURE (BME280) */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-zinc-300" />
              Barometer (BME280)
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">hPa</span>
          </div>
          <div className="mt-3.5">
            <div className="text-3xl font-display font-extrabold text-white tracking-tight">
              {reading.pressure}{' '}
              <span className="text-base font-normal text-zinc-400 font-mono">hPa</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Altitude calibrated barometric profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
