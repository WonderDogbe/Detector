import { useState } from 'react';
import { useSensorFleet } from './hooks/useSimulator';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { ExecutiveKpis } from './components/dashboard/ExecutiveKpis';
import { SpatialTelemetryMap } from './components/map/SpatialTelemetryMap';
import { LiveSensorStream } from './components/stations/LiveSensorStream';
import { ActivityTrendChart } from './components/charts/ActivityTrendChart';
import { PriorityIncidentCard } from './components/alerts/PriorityIncidentCard';
import { StationFleetStatus } from './components/stations/StationFleetStatus';
import { StationDetailDashboard } from './components/stations/StationDetailDashboard';
import { AlertsManager } from './components/alerts/AlertsManager';
import { HardwareStatusModal } from './components/hardware/HardwareStatusModal';
import { Clock, ShieldCheck, Database, Radio, Server } from 'lucide-react';

export function App() {
  const {
    stations,
    selectedStationId,
    setSelectedStationId,
    selectedStation,
    latestReading,
    historicalReadings,
    allLatestReadings,
    alerts,
    unreviewedAlertsCount,
    health,
    isConnected,
    lastPacketTime,
    updateAlertStatus,
  } = useSensorFleet();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'stations' | 'alerts' | 'history' | 'settings'
  >('overview');
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex font-sans antialiased selection:bg-emerald-800 selection:text-white">
      {/* 1. Left Sidebar Navigation (Matching Screenshot) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreviewedAlertsCount={unreviewedAlertsCount}
        onOpenHardware={() => setIsHardwareModalOpen(true)}
        isConnected={isConnected}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <TopHeader
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={setSelectedStationId}
          isConnected={isConnected}
          activeTabTitle={activeTab}
        />

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-6 sm:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* TAB 1: OVERVIEW — Exact Format from User's Screenshot */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Row 1: 4 Executive KPI Cards */}
              <ExecutiveKpis
                stations={stations}
                allLatestReadings={allLatestReadings}
                alerts={alerts}
                health={health}
                selectedStationId={selectedStationId}
                selectedReading={latestReading}
                selectedStation={selectedStation}
              />

              {/* Row 2: 2-Column Grid (Left ~65%, Right ~35%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (8 cols): Map + Sensor Stream + Trend */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Spatial Telemetry Map */}
                  <SpatialTelemetryMap
                    stations={stations}
                    selectedStationId={selectedStationId}
                    onSelectStation={setSelectedStationId}
                    allLatestReadings={allLatestReadings}
                  />

                  {/* Live Sensor Stream (4 Instrument Cards) */}
                  <LiveSensorStream
                    station={selectedStation}
                    reading={latestReading}
                  />

                  {/* 6-Hour Activity Trend Chart */}
                  <ActivityTrendChart
                    historicalReadings={historicalReadings}
                    stationId={selectedStationId}
                  />
                </div>

                {/* Right Column (4 cols): Priority Incident + Fleet Status */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Priority Incident Card with Live Supabase Actions */}
                  <PriorityIncidentCard
                    alerts={alerts}
                    latestReading={latestReading}
                    onUpdateStatus={updateAlertStatus}
                  />

                  {/* Station Fleet Status List */}
                  <StationFleetStatus
                    stations={stations}
                    selectedStationId={selectedStationId}
                    onSelectStation={setSelectedStationId}
                    allLatestReadings={allLatestReadings}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEDICATED STATIONS DETAIL */}
          {activeTab === 'stations' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs animate-fade-in">
              <StationDetailDashboard
                station={selectedStation}
                stations={stations}
                reading={latestReading}
                health={health}
                historicalReadings={historicalReadings}
                allLatestReadings={allLatestReadings}
                alerts={alerts}
                onBackToFleet={() => setActiveTab('overview')}
                onSelectStation={(id) => setSelectedStationId(id)}
                onOpenHardware={() => setIsHardwareModalOpen(true)}
              />
            </div>
          )}

          {/* TAB 3: ALERTS CONSOLE */}
          {activeTab === 'alerts' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs animate-fade-in">
              <AlertsManager
                alerts={alerts}
                onUpdateStatus={updateAlertStatus}
                onSelectStation={(id) => {
                  setSelectedStationId(id);
                  setActiveTab('overview');
                }}
              />
            </div>
          )}

          {/* TAB 4: TELEMETRY HISTORY FROM SUPABASE */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900">
                    Live Telemetry History Log
                  </h2>
                  <p className="text-xs text-slate-500">
                    Immutable audit records fetched directly from Supabase (<code className="font-mono text-[11px] text-slate-600">sensor_readings</code> table)
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>{historicalReadings.length} records loaded</span>
                </div>
              </div>

              {historicalReadings.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-medium">Awaiting physical sensor packets in database</p>
                  <p className="text-xs text-slate-400">Run the edge telemetry agent or execute a sample packet to view records here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Station</th>
                        <th className="py-2.5 px-3">Sound RMS</th>
                        <th className="py-2.5 px-3">Dominant Freq</th>
                        <th className="py-2.5 px-3">Vibration RMS</th>
                        <th className="py-2.5 px-3">Weather</th>
                        <th className="py-2.5 px-3">Rain</th>
                        <th className="py-2.5 px-3">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {historicalReadings.slice(-30).reverse().map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-slate-500">
                            {r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'Just now'}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{r.station_id}</td>
                          <td className="py-2 px-3">{(r.sound_rms * 100).toFixed(1)}%</td>
                          <td className="py-2 px-3">{r.dominant_frequency ? r.dominant_frequency.toFixed(1) : 0} Hz</td>
                          <td className="py-2 px-3">{(r.vibration_rms * 100).toFixed(1)}%</td>
                          <td className="py-2 px-3">{r.temperature}°C / {r.humidity}%</td>
                          <td className="py-2 px-3">
                            {r.rain_detected ? (
                              <span className="text-blue-600 font-semibold">Yes</span>
                            ) : (
                              <span className="text-slate-400">No</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold">
                            <span className={
                              (r.activity_score ?? 0) >= 70
                                ? 'text-rose-600 font-bold'
                                : (r.activity_score ?? 0) >= 40
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }>
                              {r.activity_score ?? 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SETTINGS & SYSTEM CONFIGURATION */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6 animate-fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-display font-bold text-slate-900">
                  System Architecture & Settings
                </h2>
                <p className="text-xs text-slate-500">
                  Active connection endpoints, machine detection weights, and physical gateway status
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supabase Database Status */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Supabase Cloud Database</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <p><span className="font-semibold text-slate-800">Endpoint:</span> https://swioffxylqjoqwfvplos.supabase.co</p>
                    <p><span className="font-semibold text-slate-800">Realtime Channel:</span> postgres_changes (enabled)</p>
                    <p><span className="font-semibold text-slate-800">Tables:</span> stations, sensor_readings, alerts, device_health</p>
                    <p><span className="font-semibold text-slate-800">Status:</span> <span className="text-emerald-600 font-bold">Connected & Operational</span></p>
                  </div>
                </div>

                {/* Edge Ingestion Gateway */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    <Server className="w-4 h-4 text-emerald-600" />
                    <span>FastAPI Ingestion Gateway</span>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <p><span className="font-semibold text-slate-800">Local URL:</span> http://localhost:8000</p>
                    <p><span className="font-semibold text-slate-800">API Documentation:</span> http://localhost:8000/docs</p>
                    <p><span className="font-semibold text-slate-800">Endpoint:</span> POST /api/telemetry/packet</p>
                    <p><span className="font-semibold text-slate-800">Authentication:</span> Bearer gg-device-secret-key-pra-basin</p>
                  </div>
                </div>

                {/* Algorithmic Scoring Parameters */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <span>Scoring Formula Weights</span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <p><span className="font-semibold text-slate-800">Audio RMS:</span> 45% (Bandpass 80Hz - 250Hz)</p>
                    <p><span className="font-semibold text-slate-800">Vibration RMS:</span> 45% (Tri-axial peak-to-peak)</p>
                    <p><span className="font-semibold text-slate-800">Machinery Frequency Range:</span> 90 Hz – 180 Hz</p>
                    <p><span className="font-semibold text-slate-800">Rain Attenuation Factor:</span> -35% (prevents false positives)</p>
                  </div>
                </div>

                {/* Physical Hardware Diagnostics */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Physical Hardware Diagnostic</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      View sensor pinout diagrams, calibration utilities, and raw packet inspector for Raspberry Pi / ESP32 nodes.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsHardwareModalOpen(true)}
                    className="w-full py-2 px-3 rounded-xl bg-[#123c28] hover:bg-[#0e2f20] text-white text-xs font-semibold transition-all cursor-pointer text-center shadow-xs"
                  >
                    Open Diagnostic Console
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 3. Physical Hardware Diagnostics Modal */}
      <HardwareStatusModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={setSelectedStationId}
        lastPacketTime={lastPacketTime}
        isConnected={isConnected}
      />
    </div>
  );
}

export default App;
