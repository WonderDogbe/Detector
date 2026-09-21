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

  return (
    <div className="space-y-6">
      {/* Charts Header with Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Historical Telemetry & Activity Progression
          </h3>
          <p className="text-xs text-slate-400">
            Real-time trend analysis demonstrating transient vs. sustained machinery signatures
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          <button
            onClick={() => setTimeRange('15m')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              timeRange === '15m'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live (15m)
          </button>
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              timeRange === '1h'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1 Hour
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
              timeRange === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Buffer
          </button>
        </div>
      </div>

      {/* 1. PRIMARY CHART: ACTIVITY RISK SCORE PROGRESSION (0-100) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">
                Environmental Activity Score (Multi-Sensor Fusion)
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  currentScore >= 61
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : currentScore >= 31
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                Score: {currentScore} / 100
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated using Sound RMS, Diesel Frequency bands, Vibration RMS, and Rain Dampening
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`${value} / 100`, 'Activity Score']}
              />
              {/* Threshold lines from project_vision.md Section 9 */}
              <ReferenceLine
                y={30}
                stroke="#F59E0B"
                strokeDasharray="3 3"
                label={{ value: 'Elevated (30)', fill: '#F59E0B', fontSize: 10, position: 'insideTopRight' }}
              />
              <ReferenceLine
                y={60}
                stroke="#EF4444"
                strokeDasharray="3 3"
                label={{ value: 'High Machinery Alert (60)', fill: '#EF4444', fontSize: 10, position: 'insideTopRight' }}
              />
              <Area
                type="monotone"
                dataKey="activityScore"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#scoreGradient)"
                name="Activity Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. DUAL CHART: SOUND RMS vs VIBRATION RMS */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm font-semibold text-slate-200">
              Acoustic Intensity vs. Ground Vibration Correlation
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Demonstrating how mechanical machinery creates concurrent peaks in both sound and vibration
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Sound RMS (%)
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Vibration RMS (%)
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="soundPercent"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={false}
                name="Sound RMS (%)"
              />
              <Line
                type="monotone"
                dataKey="vibrationPercent"
                stroke="#F59E0B"
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
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Temperature Trend (°C)
            </span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayedData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="temp" stroke="#F43F5E" strokeWidth={2} dot={false} name="Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dominant Frequency Trend */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Dominant Acoustic Frequency (Hz)
            </span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
                />
                <ReferenceLine y={220} stroke="#F59E0B" strokeDasharray="2 2" />
                <Line type="monotone" dataKey="dominantFreq" stroke="#818CF8" strokeWidth={2} dot={false} name="Peak Freq (Hz)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
