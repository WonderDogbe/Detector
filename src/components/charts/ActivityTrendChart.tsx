import type { FC } from 'react';
import type { SensorReading } from '../../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface ActivityTrendChartProps {
  historicalReadings: SensorReading[];
  stationId: string;
}

export const ActivityTrendChart: FC<ActivityTrendChartProps> = ({
  historicalReadings,
  stationId,
}) => {
  // Format real readings for chart
  const chartData = historicalReadings.length > 0
    ? historicalReadings.slice(-15).map((r, i) => {
        const timeStr = r.timestamp
          ? new Date(r.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : `${i * 10}m`;
        
        const compositeScore = r.activity_score ?? Math.round(
          (r.sound_rms * 0.45 + r.vibration_rms * 0.45) * 100
        );
        const sensorAvg = Math.round(
          ((r.sound_rms + r.vibration_rms) / 2) * 60 + 10
        );

        return {
          time: timeStr,
          compositeScore: Math.min(100, Math.max(0, compositeScore)),
          sensorAvg: Math.min(100, Math.max(0, sensorAvg)),
        };
      })
    : [
        { time: '10:00', compositeScore: 18, sensorAvg: 20 },
        { time: '11:00', compositeScore: 22, sensorAvg: 21 },
        { time: '12:00', compositeScore: 25, sensorAvg: 23 },
        { time: '13:00', compositeScore: 35, sensorAvg: 28 },
        { time: '14:00', compositeScore: 54, sensorAvg: 38 },
        { time: 'Live', compositeScore: 76, sensorAvg: 46 },
      ];

  const currentScore =
    chartData.length > 0
      ? chartData[chartData.length - 1].compositeScore
      : 76;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-display font-bold text-slate-900 tracking-tight">
            6-Hour Activity Trend
          </h2>
          <p className="text-xs text-slate-500">
            Correlated acoustic and vibration machine curve ({stationId})
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 rounded-full" />
            <span className="text-slate-700">Composite Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400 rounded-full" />
            <span className="text-slate-500">Sensor Average</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full h-[180px]">
        {/* Floating current score badge in top right of chart like screenshot */}
        <div className="absolute top-2 right-4 z-10">
          <div className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-mono font-bold shadow-sm">
            Score: {currentScore}
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -25, bottom: 0 }}
          >
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 600, color: '#0f172a' }}
            />
            {/* Machinery Threshold line at 70 */}
            <ReferenceLine
              y={70}
              stroke="#f43f5e"
              strokeDasharray="3 3"
              label={{
                value: 'Heavy Machinery',
                position: 'insideBottomRight',
                fill: '#e11d48',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Line
              type="monotone"
              dataKey="sensorAvg"
              stroke="#94a3b8"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="compositeScore"
              stroke="#e11d48"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#e11d48', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#be123c' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
