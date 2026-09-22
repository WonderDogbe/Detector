import { useState } from 'react';
import { useSimulator } from './hooks/useSimulator';
import { Header } from './components/layout/Header';
import { MetricsBar } from './components/dashboard/MetricsBar';
import { StationFleetList } from './components/stations/StationFleetList';
import { StationDetailDashboard } from './components/stations/StationDetailDashboard';
import { StationMap } from './components/map/StationMap';
import { AlertsManager } from './components/alerts/AlertsManager';
import { ScenarioBar } from './components/simulator/ScenarioBar';
import { DemoTourModal } from './components/common/DemoTourModal';
import { Sliders } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'fleet' | 'station'>('fleet');
  const [isScenarioBarOpen, setIsScenarioBarOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Trigger machinery demo shortcut
  const handleTriggerMachineryDemo = () => {
    setSelectedStationId('GG-001');
    setViewMode('station');
    triggerScenario('MACHINERY', 'GG-001', 60);
  };

  // Open single station dashboard
  const handleOpenStationDashboard = (stationId: string) => {
    setSelectedStationId(stationId);
    setViewMode('station');
  };

  const handleHeaderSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
    setViewMode('station');
  };

  const handleTabChange = (tab: 'overview' | 'map' | 'stations' | 'alerts') => {
    setActiveTab(tab);
    if (tab === 'overview') {
      setViewMode('fleet');
    } else if (tab === 'stations') {
      setViewMode('station');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-700 selection:text-white">
      {/* 1. Global Navigation & Top Header */}
      <Header
        stations={stations}
        selectedStationId={selectedStationId}
        onSelectStation={handleHeaderSelectStation}
        unreviewedAlertsCount={unreviewedAlertsCount}
        isRunning={isRunning}
        onToggleSimulation={toggleSimulation}
        onOpenScenarios={() => setIsScenarioBarOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      {/* 2. Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* OVERVIEW / FLEET VIEW: Exact 2 cards + All Online Stations grid */}
        {activeTab === 'overview' && viewMode === 'fleet' && (
          <div className="space-y-6 animate-fade-in">
            {/* The 2 Hero Cards: Stations Online Card & Alerts Card */}
            <MetricsBar
              stations={stations}
              allLatestReadings={allLatestReadings}
              alerts={alerts}
              unreviewedAlertsCount={unreviewedAlertsCount}
              onViewAlerts={() => setActiveTab('alerts')}
            />

            {/* All Online Stations Grid with "View Station Dashboard" */}
            <StationFleetList
              stations={stations}
              allLatestReadings={allLatestReadings}
              onSelectAndOpenStation={handleOpenStationDashboard}
            />
          </div>
        )}

        {/* DEDICATED STATION DASHBOARD VIEW */}
        {(activeTab === 'stations' || (activeTab === 'overview' && viewMode === 'station')) && (
          <StationDetailDashboard
            station={selectedStation}
            stations={stations}
            reading={latestReading}
            health={health}
            historicalReadings={historicalReadings}
            allLatestReadings={allLatestReadings}
            alerts={alerts}
            onBackToFleet={() => {
              setViewMode('fleet');
              setActiveTab('overview');
            }}
            onSelectStation={(id) => setSelectedStationId(id)}
            onOpenScenarios={() => setIsScenarioBarOpen(true)}
          />
        )}

        {/* FULL GEOSPATIAL MAP VIEW */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between border border-zinc-800 bg-zinc-900/60">
              <div>
                <h2 className="font-display font-bold text-base text-white tracking-tight">
                  Full Geospatial Sensor Grid — Southern Ghana
                </h2>
                <p className="text-xs text-zinc-400">
                  Real-time telemetry overlays mapped across Pra River, Atewa Forest, and Tarkwa mining peripheries
                </p>
              </div>
              <button
                onClick={() => setIsScenarioBarOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-zinc-200 text-zinc-950 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inject Scenario</span>
              </button>
            </div>
            <StationMap
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={(id) => {
                setSelectedStationId(id);
                setViewMode('station');
              }}
              allLatestReadings={allLatestReadings}
            />
          </div>
        )}

        {/* INCIDENT AUDIT & HUMAN VERIFICATION CONSOLE */}
        {activeTab === 'alerts' && (
          <div className="animate-fade-in">
            <AlertsManager
              alerts={alerts}
              onUpdateStatus={updateAlertStatus}
              onSelectStation={(id) => {
                setSelectedStationId(id);
                setViewMode('station');
              }}
            />
          </div>
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
      <footer className="mt-12 border-t border-zinc-800/80 py-4 px-6 text-center text-xs text-zinc-500 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-zinc-400 font-mono text-[11px]">
            GalamseyGuard Prototype • IoT Environmental Sensor & Heavy Machinery Detection Framework
          </span>
          <span className="text-zinc-500">
            Compliant with Section 10: Human Verification Standard
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
