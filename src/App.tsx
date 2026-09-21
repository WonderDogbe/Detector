import { useState } from 'react';
import { useSimulator } from './hooks/useSimulator';
import { Header } from './components/layout/Header';
import { MetricsBar } from './components/dashboard/MetricsBar';
import { StationMap } from './components/map/StationMap';
import { SensorCards } from './components/stations/SensorCards';
import { StationCharts } from './components/charts/StationCharts';
import { AlertsManager } from './components/alerts/AlertsManager';
import { ScenarioBar } from './components/simulator/ScenarioBar';
import { DemoTourModal } from './components/common/DemoTourModal';
import { MapPin, Activity, ArrowRight, Sliders } from 'lucide-react';

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
    activeScenario,
    isRunning,
    triggerScenario,
    resetToNormal,
    updateAlertStatus,
    toggleSimulation,
  } = useSimulator();

  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'stations' | 'alerts'>(
    'overview'
  );
  const [isScenarioBarOpen, setIsScenarioBarOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Trigger machinery demo shortcut
  const handleTriggerMachineryDemo = () => {
    setSelectedStationId('GG-001');
    triggerScenario('MACHINERY', 'GG-001', 60);
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col font-sans">
      {/* 1. Global Navigation & Top Header */}
      <Header
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={setSelectedStationId}
        unreviewedAlertsCount={unreviewedAlertsCount}
        isRunning={isRunning}
        onToggleSimulation={toggleSimulation}
        onOpenScenarios={() => setIsScenarioBarOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Global KPI Metrics Bar */}
        <MetricsBar
          stations={stations}
          allLatestReadings={allLatestReadings}
          alerts={alerts}
          unreviewedAlertsCount={unreviewedAlertsCount}
        />

        {/* Dynamic View Tab Rendering */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Station Quick Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stations.map((st) => {
                const reading = allLatestReadings[st.id];
                const score = reading?.activity_score || 0;
                const isSelected = st.id === selectedStationId;

                return (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStationId(st.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all glass-panel cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400/80 ring-2 ring-cyan-500/30 bg-slate-800/80 shadow-lg'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {st.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          score >= 61
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                            : score >= 31
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        Score: {score}
                      </span>
                    </div>
                    <div className="text-sm font-display font-semibold text-slate-100 mt-1 truncate">
                      {st.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      {st.location_name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Split Grid: Interactive Map + Real-time Sensor Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Map Column */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Geospatial Deployment Map
                  </h3>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Expand Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <StationMap
                  stations={stations}
                  selectedStationId={selectedStationId}
                  onSelectStation={setSelectedStationId}
                  allLatestReadings={allLatestReadings}
                />
              </div>

              {/* Active Station Summary Telemetry */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Live Edge Telemetry ({selectedStation.id})
                  </h3>
                  <button
                    onClick={() => setActiveTab('stations')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Analytics</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <SensorCards
                  station={selectedStation}
                  reading={latestReading}
                  health={health}
                />
              </div>
            </div>

            {/* Historical Charts for Selected Station */}
            <div className="pt-2">
              <StationCharts
                station={selectedStation}
                readings={historicalReadings}
              />
            </div>

            {/* Quick Alerts Section */}
            <div className="pt-4">
              <AlertsManager
                alerts={alerts.slice(0, 3)}
                onUpdateStatus={updateAlertStatus}
                onSelectStation={(id) => {
                  setSelectedStationId(id);
                  setActiveTab('stations');
                }}
              />
              {alerts.length > 3 && (
                <div className="text-center mt-3">
                  <button
                    onClick={() => setActiveTab('alerts')}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
                  >
                    View All {alerts.length} Incidents in Audit Console →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-base text-slate-100">
                  Full Geospatial Sensor Grid
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time telemetry overlays mapped across Pra River, Atewa Forest, and Tarkwa mining peripheries
                </p>
              </div>
              <button
                onClick={() => setIsScenarioBarOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inject Scenario</span>
              </button>
            </div>
            <StationMap
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={setSelectedStationId}
              allLatestReadings={allLatestReadings}
            />
          </div>
        )}

        {activeTab === 'stations' && (
          <div className="space-y-6">
            <SensorCards
              station={selectedStation}
              reading={latestReading}
              health={health}
            />
            <StationCharts
              station={selectedStation}
              readings={historicalReadings}
            />
          </div>
        )}

        {activeTab === 'alerts' && (
          <AlertsManager
            alerts={alerts}
            onUpdateStatus={updateAlertStatus}
            onSelectStation={(id) => {
              setSelectedStationId(id);
              setActiveTab('stations');
            }}
          />
        )}
      </main>

      {/* 3. Live Scenario Injector Drawer */}
      <ScenarioBar
        isOpen={isScenarioBarOpen}
        onClose={() => setIsScenarioBarOpen(false)}
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={setSelectedStationId}
        activeScenario={activeScenario}
        onTriggerScenario={triggerScenario}
        onResetToNormal={resetToNormal}
      />

      {/* 4. Guided Demo Tour Modal */}
      <DemoTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onTriggerMachineryDemo={handleTriggerMachineryDemo}
        onNavigateToAlerts={() => setActiveTab('alerts')}
      />

      {/* 5. Minimal Global Footer */}
      <footer className="mt-12 border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 bg-[#060911]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            GalamseyGuard Prototype • IoT Environmental Sensor & Heavy Machinery Detection Framework
          </span>
          <span className="text-slate-400">
            Compliant with Section 10: "Human verification required"
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
