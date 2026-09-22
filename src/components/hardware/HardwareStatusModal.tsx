import { useState } from 'react';
import type { FC } from 'react';
import {
  Cpu,
  Radio,
  Volume2,
  Waves,
  Thermometer,
  CloudRain,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  Server,
  Zap,
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { getSupabaseStatus } from '../../config/supabase';
import type { Station } from '../../types';

interface HardwareStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  lastPacketTime: string | null;
  isConnected: boolean;
}

export const HardwareStatusModal: FC<HardwareStatusModalProps> = ({
  isOpen,
  onClose,
  stations,
  selectedStationId,
  onSelectStation,
  lastPacketTime,
  isConnected,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'api' | 'pinouts' | 'firmware'>('status');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const dbStatus = getSupabaseStatus();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">
                  Physical Sensor & Edge Gateway Console
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  REAL SENSORS READY
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Hardware interface configuration, edge daemon commands, and pinout telemetry mapping
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-zinc-800/60 bg-zinc-950">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'status'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Live Ingestion Status
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'api'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            API Gateway & Ingestion
          </button>
          <button
            onClick={() => setActiveTab('pinouts')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pinouts'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Hardware Pinout & Sensors
          </button>
          <button
            onClick={() => setActiveTab('firmware')}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'firmware'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Edge Deployment Commands
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-300">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Connection Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Telemetry Stream</span>
                    <Radio className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span className="font-display font-bold text-sm text-white">
                      {isConnected ? 'Active & Listening' : 'Disconnected'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Backend Pipeline</span>
                    <Server className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dbStatus.configured ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="font-display font-bold text-sm text-white truncate">
                      {dbStatus.configured ? 'Supabase Live' : 'Local Edge Bridge'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span>Last Ingested Packet</span>
                    <Zap className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <span className="font-mono text-xs text-zinc-200">
                    {lastPacketTime
                      ? new Date(lastPacketTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      : 'Awaiting first packet'}
                  </span>
                </div>
              </div>

              {/* Station Deployment Target */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-2">
                <span className="text-xs font-semibold text-zinc-200">
                  Target Station Assignment
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStationId}
                    onChange={(e) => onSelectStation(e.target.value)}
                    aria-label="Target Station for Edge Ingestion"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none"
                  >
                    {stations.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.id} — {st.name} ({st.location_name})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Physical sensors transmitting with station ID{' '}
                  <code className="text-emerald-400">{selectedStationId}</code> will route
                  their telemetry directly into this station dashboard.
                </p>
              </div>

              {/* Ingestion Pipeline Note */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Zero-Mock Environment Confirmation
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  All synthetic sine-wave loops and fake alert generators have been removed from the application. The system is strictly waiting for real telemetry transmissions from the physical sensor suite.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      FastAPI Gateway Integration
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    PORT 8000
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-zinc-400">
                  <p><span className="text-zinc-200 font-semibold">Endpoint:</span> <code className="text-emerald-400 font-mono">POST /api/v1/telemetry</code></p>
                  <p><span className="text-zinc-200 font-semibold">CORS:</span> Enabled for React Dashboard</p>
                  <p><span className="text-zinc-200 font-semibold">Proxy Route:</span> <code className="text-zinc-300 font-mono">/api/v1/*</code> routes to <code className="text-zinc-300 font-mono">http://localhost:8000/api/v1/*</code></p>
                  <p><span className="text-zinc-200 font-semibold">Database:</span> Supabase PostgreSQL (Automatic Alert Generation & Realtime Streaming)</p>
                </div>
              </div>

              {/* Interactive Test Triggers */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Send Test Telemetry Packet via API</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Dispatch a real HTTP POST request to the FastAPI server. The backend will validate the schema, evaluate the risk score, write to Supabase, and stream back into this dashboard.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* High Risk Machinery Packet */}
                  <button
                    disabled={isSendingTest}
                    onClick={async () => {
                      setIsSendingTest(true);
                      setTestResult(null);
                      try {
                        const res = await apiService.sendTelemetryPacket({
                          station_id: selectedStationId,
                          sound_rms: 0.86,
                          dominant_frequency: 114.5,
                          vibration_rms: 0.78,
                          temperature: 29.5,
                          humidity: 65.0,
                          pressure: 1011.0,
                          rain_detected: false,
                          latitude: 5.4120,
                          longitude: -1.6210,
                        });
                        setTestResult(JSON.stringify(res, null, 2));
                      } catch (err: any) {
                        setTestResult(`Error: ${err.message}`);
                      } finally {
                        setIsSendingTest(false);
                      }
                    }}
                    className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800 text-left transition-all cursor-pointer disabled:opacity-50 group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-rose-300">
                        Machinery Detection Packet
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900 text-rose-200">
                        Score ~85
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Sound: 86% RMS (114Hz) • Vibration: 78% RMS • Rain: None
                    </p>
                  </button>

                  {/* Calm Normal Baseline Packet */}
                  <button
                    disabled={isSendingTest}
                    onClick={async () => {
                      setIsSendingTest(true);
                      setTestResult(null);
                      try {
                        const res = await apiService.sendTelemetryPacket({
                          station_id: selectedStationId,
                          sound_rms: 0.18,
                          dominant_frequency: 240.0,
                          vibration_rms: 0.05,
                          temperature: 27.2,
                          humidity: 79.0,
                          pressure: 1012.8,
                          rain_detected: false,
                          latitude: 5.4120,
                          longitude: -1.6210,
                        });
                        setTestResult(JSON.stringify(res, null, 2));
                      } catch (err: any) {
                        setTestResult(`Error: ${err.message}`);
                      } finally {
                        setIsSendingTest(false);
                      }
                    }}
                    className="p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800 text-left transition-all cursor-pointer disabled:opacity-50 group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-300">
                        Calm Baseline Packet
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200">
                        Score ~18
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Sound: 18% RMS • Vibration: 5% RMS • Rain: None
                    </p>
                  </button>
                </div>

                {/* Response Viewer */}
                {testResult && (
                  <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-[11px] space-y-1">
                    <span className="text-zinc-400 block font-sans text-[10px] font-semibold uppercase tracking-wider">
                      FastAPI Server Response:
                    </span>
                    <pre className="text-emerald-400 whitespace-pre-wrap overflow-x-auto">
                      {testResult}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pinouts' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400">
                Connect your available physical sensors according to the pinout map below. Both Raspberry Pi 4 / 3B+ and ESP32 pinouts are supported.
              </div>

              {/* Sensors Table */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-zinc-900 text-zinc-300 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Sensor</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Bus / Protocol</th>
                      <th className="p-3">Raspberry Pi Pin</th>
                      <th className="p-3">ESP32 Pin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/60">
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        INMP441
                      </td>
                      <td className="p-3 text-zinc-300">Acoustic RMS & Diesel FFT Peak</td>
                      <td className="p-3 font-mono text-zinc-400">I2S Digital</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 18(CLK), 19(WS), 20(SD)</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 25(WS), 26(SCK), 22(SD)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                        <Waves className="w-3.5 h-3.5 text-emerald-400" />
                        MPU-6050
                      </td>
                      <td className="p-3 text-zinc-300">Tri-axial Vibration RMS</td>
                      <td className="p-3 font-mono text-zinc-400">I2C (0x68)</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 2(SDA), GPIO 3(SCL)</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 21(SDA), GPIO 22(SCL)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                        BME280
                      </td>
                      <td className="p-3 text-zinc-300">Temp, Humidity, Barometer</td>
                      <td className="p-3 font-mono text-zinc-400">I2C (0x76)</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 2(SDA), GPIO 3(SCL)</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 21(SDA), GPIO 22(SCL)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                        <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                        Rain Sensor
                      </td>
                      <td className="p-3 text-zinc-300">Rain Dampening Flag</td>
                      <td className="p-3 font-mono text-zinc-400">Digital / GPIO</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 17</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 34 (ADC/Digital)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        NEO-6M GPS
                      </td>
                      <td className="p-3 text-zinc-300">Geospatial Fix & UTC Time</td>
                      <td className="p-3 font-mono text-zinc-400">UART Serial</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 14(TX), 15(RX)</td>
                      <td className="p-3 font-mono text-zinc-300">GPIO 16(RX2), 17(TX2)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'firmware' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-200">
                  1. Launch Physical Sensor Daemon (Python)
                </span>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-xs text-zinc-200">
                  <code>python edge/sensor_agent.py --station {selectedStationId}</code>
                  <button
                    onClick={() =>
                      handleCopy(
                        `python edge/sensor_agent.py --station ${selectedStationId}`,
                        'cmd1'
                      )
                    }
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    {copiedCmd === 'cmd1' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-200">
                  2. Calibrate Sensor Baselines (Noise floor & Accelerometer Zero-G)
                </span>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-xs text-zinc-200">
                  <code>python edge/calibrate_sensors.py</code>
                  <button
                    onClick={() => handleCopy('python edge/calibrate_sensors.py', 'cmd2')}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    {copiedCmd === 'cmd2' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-200">
                  3. ESP32 Wireless Node Firmware
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  For standalone battery/solar nodes with ESP32 microcontrollers, open and flash{' '}
                  <code className="text-emerald-400 font-mono">edge/esp32_firmware/galamsey_sensor_node.ino</code> using Arduino IDE or PlatformIO. It directly samples the INMP441 and MPU-6050 and transmits JSON over Wi-Fi.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Terminal className="w-3.5 h-3.5 text-zinc-500" />
            <span>Telemetry payload schema: Section 8 Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
