import { useState } from 'react';
import type { FC } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { SensorReading, Station } from '../../types';
import { Activity, Volume2, Thermometer, Clock } from 'lucide-react';

interface StationChartsProps {
  station: Station;
  readings: SensorReading[];
}

export const StationCharts: FC<StationChartsProps> = ({
  readings,
}) => {
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | 'all'>('all');

  // Format data for Recharts
  const chartData = readings.map((r) => {
    const d = new Date(r.timestamp);
    const timeStr = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      time: timeStr,
      fullTimestamp: r.timestamp,
      activityScore: r.activity_score || 0,
      soundPercent: Math.round(r.sound_rms * 100),
      soundDb: r.sound_db || Math.round(30 + r.sound_rms * 75),
      vibrationPercent: Math.round(r.vibration_rms * 100),
      dominantFreq: r.dominant_frequency,
      temp: r.temperature,
      humidity: r.humidity,
      rain: r.rain_detected ? 1 : 0,
    };
  });

  const displayedData =
    timeRange === '15m'
      ? chartData.slice(-10)
      : timeRange === '1h'
      ? chartData.slice(-20)
      : chartData;

  const currentScore =
    chartData.length > 0 ? chartData[chartData.length - 1].activityScore : 0;

  if (readings.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center border border-zinc-800 bg-zinc-900/60 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
          <Activity className="w-6 h-6 animate-pulse text-zinc-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">
            Awaiting Physical Sensor Telemetry
          </h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
            No readings recorded yet for this station. Connect your physical sensors (INMP441, MPU-6050, BME280) and run the edge client to stream live telemetry.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <span>Command:</span>
          <span className="text-emerald-400 font-semibold">python edge/sensor_agent.py</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Charts Header with Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2 tracking-tight">
            <Activity className="w-4 h-4 text-zinc-300" />
            Historical Telemetry & Activity Progression
          </h3>
          <p className="text-xs text-zinc-400">
            Real-time trend analysis demonstrating transient vs. sustained machinery signatures
          </p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-zinc-400 ml-1.5" />
          <button
            onClick={() => setTimeRange('15m')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              timeRange === '15m'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Live (15m)
          </button>
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              timeRange === '1h'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1 Hour
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              timeRange === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Full Buffer
          </button>
        </div>
      </div>

      {/* 1. PRIMARY CHART: ACTIVITY RISK SCORE PROGRESSION (0-100) */}
      <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-200">
                Environmental Activity Score (Multi-Sensor Fusion)
              </span>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  currentScore >= 61
                    ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                    : currentScore >= 31
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                }`}
              >
                Score: {currentScore} / 100
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Evaluated using Sound RMS, Diesel Frequency bands, Vibration RMS, and Rain Dampening
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreMonochromeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141417',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#ffffff',
                }}
                formatter={(value: any) => [`${value} / 100`, 'Activity Score']}
              />
              {/* Threshold lines with natural subtle styling */}
              <ReferenceLine
                y={30}
                stroke="#a1a1aa"
                strokeDasharray="3 3"
                label={{ value: 'Elevated (30)', fill: '#a1a1aa', fontSize: 10, position: 'insideTopRight' }}
              />
              <ReferenceLine
                y={60}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                label={{ value: 'High Machinery Alert (60)', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }}
              />
              <Area
                type="monotone"
                dataKey="activityScore"
                stroke="#ffffff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#scoreMonochromeGradient)"
                name="Activity Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. DUAL CHART: SOUND RMS vs VIBRATION RMS */}
      <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm font-semibold text-zinc-200">
              Acoustic Intensity vs. Ground Vibration Correlation
            </span>
            <p className="text-xs text-zinc-400 mt-0.5">
              Demonstrating how mechanical machinery creates concurrent peaks in both sound and vibration
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-white" /> Sound RMS (%)
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-zinc-500" /> Vibration RMS (%)
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141417',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#ffffff',
                }}
              />
              <Line
                type="monotone"
                dataKey="soundPercent"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
                name="Sound RMS (%)"
              />
              <Line
                type="monotone"
                dataKey="vibrationPercent"
                stroke="#71717a"
                strokeWidth={2}
                dot={false}
                name="Vibration RMS (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. CLIMATE & ENVIRONMENTAL TRENDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Temperature Trend */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-zinc-300" /> Temperature Trend (°C)
            </span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayedData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141417', borderColor: 'rgba(255,255,255,0.12)', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                />
                <Line type="monotone" dataKey="temp" stroke="#e4e4e7" strokeWidth={2} dot={false} name="Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dominant Frequency Trend */}
        <div className="glass-panel p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-zinc-300" /> Dominant Frequency (Hz)
            </span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141417', borderColor: 'rgba(255,255,255,0.12)', borderRadius: '0.5rem', fontSize: '11px', color: '#ffffff' }}
                />
                <ReferenceLine y={220} stroke="#71717a" strokeDasharray="2 2" />
                <Line type="monotone" dataKey="dominantFreq" stroke="#ffffff" strokeWidth={2} dot={false} name="Peak Freq (Hz)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
