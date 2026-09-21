# GalamseyGuard — Environmental Activity Monitoring Prototype

> **IoT-Based Environmental Activity & Machinery Pattern Monitoring Framework**

GalamseyGuard is a prototype IoT platform designed to demonstrate how multi-sensor environmental telemetry (sound, vibration, weather, and geospatial location) can be collected, scored, and visualized to identify activity patterns potentially associated with heavy machinery.

In compliance with the project vision:
- **Responsible Language**: The system flags *"Possible machinery-related activity detected. Human verification required."* rather than making definitive or legal claims.
- **Human-in-the-Loop**: Automated alerts transition through an operational verification lifecycle (`UNREVIEWED` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `UNDER REVIEW` $\rightarrow$ `RESOLVED` / `FALSE POSITIVE`).
- **Software & Simulation First**: Enables complete end-to-end demonstrations of the dashboard, analytics, and alerting without requiring physical edge devices immediately.

---

## Key Features

1. **Executive Overview & KPI Bar**:
   - Live monitoring of virtual edge nodes across Ghana (`GG-001` Pra River Basin, `GG-002` Atewa Forest Fringe, `GG-003` Tarkwa Community Perimeter).
   - Real-time network threat index, peak activity scores, and active rain dampening status.

2. **Interactive Geospatial Map**:
   - High-contrast dark matter map powered by Leaflet.
   - Color-coded pulsing radar markers (Green = Normal, Amber = Elevated, Red = High Activity).
   - Marker popup with instant telemetry inspection and direct station focus.

3. **Multi-Modal Sensor Telemetry**:
   - **Acoustic Sensor (INMP441)**: Sound RMS %, estimated dB (~30 to 105 dB), and dominant frequency (Hz) with low-frequency diesel engine resonance indicator (50–220 Hz).
   - **Vibration Sensor (MPU6050)**: Ground agitation and acceleration magnitude RMS %.
   - **Precipitation Sensor**: Precipitation status and automatic acoustic dampening filter (-55% acoustic weight during rain) to prevent false positives.
   - **Atmospheric Barometer (BME280)**: Temperature (°C), Relative Humidity (%), and Pressure (hPa).

4. **Historical Analytics (Recharts)**:
   - Environmental Activity Score trend (0–100) with threshold reference lines (Elevated: 30, High: 60).
   - Acoustic vs. Vibration correlation chart showing concurrent mechanical signatures.
   - Temperature and peak dominant frequency trends over time.

5. **Human Verification Console**:
   - Audit trail of all triggered alerts.
   - Snapshot of sensor values at trigger moment.
   - Modal drawer to update verification status and submit operator field notes.

6. **Live Scenario Injector**:
   - Simulate 5 standardized environmental scenarios on-demand:
     - **1. Normal Ambient**: Baseline forest/river acoustics and seismic quiescence.
     - **2. Rainstorm**: High sound + rain detected; activates dampening filter so scores remain below alert threshold.
     - **3. Passing Vehicle**: Elevated sound + moderate vibration; transient score ~50.
     - **4. Heavy Machinery**: High sound + high vibration + 118 Hz diesel rumble; surges score $\ge 75$ and creates an unreviewed alert!
     - **5. Baseline Reset**: Instantly resets all stations.

7. **10-Step Guided Walkthrough**:
   - Interactive modal tour walking stakeholders through the demonstration flow from Section 23 of `project_vision.md`.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open in your browser:
# http://127.0.0.1:5173/
```

### Building for Production
```bash
npm run build
```

---

## Project Structure
```text
├── src/
│   ├── components/
│   │   ├── alerts/          # AlertsManager.tsx (Human verification console & modal)
│   │   ├── charts/          # StationCharts.tsx (Recharts historical trends)
│   │   ├── common/          # DemoTourModal.tsx (Guided tour)
│   │   ├── dashboard/       # MetricsBar.tsx (KPIs & network health)
│   │   ├── layout/          # Header.tsx (Branding, navigation, station switcher)
│   │   ├── map/             # StationMap.tsx (Native Leaflet dark map & markers)
│   │   ├── simulator/       # ScenarioBar.tsx (One-click scenario injection drawer)
│   │   └── stations/        # SensorCards.tsx (Gauges for 6 environmental sensors)
│   ├── hooks/
│   │   └── useSimulator.ts  # Reactive hook for simulation state & subscriptions
│   ├── services/
│   │   ├── mockData.ts      # Initial stations, baseline readings & alerts
│   │   └── simulatorService.ts # Continuous telemetry generator & alert trigger
│   ├── types/               # TypeScript interfaces for Stations, Telemetry & Alerts
│   ├── utils/
│   │   └── scoringEngine.ts # Rule-based multi-sensor fusion & rain dampening
│   ├── App.tsx              # Main dashboard application layout
│   ├── index.css            # Dark theme, glassmorphism & radar pulse animations
│   └── main.tsx
├── supabase/
│   └── schema.sql           # Complete PostgreSQL schema for live Supabase deployment
├── plan.md                  # Detailed phase-by-phase implementation master plan
└── project_vision.md        # Original project vision and specifications
```

---

## Database Deployment (Supabase)
When ready to connect to a live Supabase backend:
1. Open the **SQL Editor** in your Supabase project dashboard.
2. Copy and run the contents of [supabase/schema.sql](file:///c:/Users/VhimBoss/Desktop/Galamsey%20Activity%20Detector/supabase/schema.sql).
3. The schema includes tables for `stations`, `sensor_readings`, `alerts`, and `device_health`, with indexing and Realtime replication publications enabled.
