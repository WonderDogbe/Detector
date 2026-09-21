# GalamseyGuard — Implementation Master Plan

> **Systematic, Phase-by-Phase Roadmap for the GalamseyGuard IoT Environmental Activity Monitoring Prototype**

---

## Executive Summary

**GalamseyGuard** is an IoT-based environmental monitoring platform designed to demonstrate how multi-sensor environmental telemetry (acoustic, vibration, meteorological, and geospatial data) can be aggregated, analyzed, and visualized to identify activity patterns associated with heavy machinery.

In strict adherence to the [project_vision.md](file:///c:/Users/VhimBoss/Desktop/Galamsey%20Activity%20Detector/project_vision.md), the system:
1. **Prioritizes Software & Simulation First**: We prove the complete pipeline—from data ingestion and multi-signal scoring to real-time maps, trend charts, and alert escalation—using realistic simulated telemetry before integrating physical Raspberry Pi hardware.
2. **Maintains Responsible Language**: The system flags *"Possible machinery-related activity detected. Human verification required."* rather than making definitive or legal claims of illegal mining.
3. **Ensures Human-in-the-Loop Governance**: Automated risk scores trigger an operational alert workflow (`UNREVIEWED` $\rightarrow$ `ACKNOWLEDGED` $\rightarrow$ `UNDER REVIEW` $\rightarrow$ `RESOLVED` / `FALSE POSITIVE`).

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA PRODUCER LAYER                             │
│                                                                        │
│   [Phase 1-3: Telemetry Simulator]      [Phase 5: Physical Hardware]   │
│   - Realistic Noise & Baseline Drift    - Raspberry Pi Model 4 / 3B+   │
│   - Multi-Station (GG-001, GG-002, ...) - INMP441 (I2S Microphone)     │
│   - Scenario Injector (Rain, Machine)   - MPU6050 (I2C Accelerometer)  │
│                                         - BME280 (I2C Weather)         │
│                                         - Rain Sensor & NEO-6M GPS     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / Realtime WebSockets
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND & STORAGE LAYER                         │
│                                                                        │
│   Supabase (PostgreSQL 15+)                                            │
│   ├── Tables: stations, sensor_readings, alerts, device_health         │
│   ├── Realtime Replication (Change Data Capture over WebSockets)       │
│   ├── Row-Level Security (RLS) & Supabase Authentication               │
│   └── Edge Functions / Python Scoring Worker (Threshold & Fusion Logic)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Realtime State Sync & REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND DEMONSTRATION DASHBOARD                     │
│                                                                        │
│   React 19 + TypeScript + Vite + Tailwind CSS                          │
│   ├── Executive Overview KPI Cards (Active Stations, Alerts, Health)   │
│   ├── Geospatial Map (Leaflet / React Leaflet with Status Badges)     │
│   ├── Real-Time Telemetry Panels (Gauges, Cards, Waveform/Level meters)│
│   ├── Historical Trends (Recharts: Sound RMS, Vibration, Temperature) │
│   ├── Alert Management & Verification Console (Audit Log & Notes)     │
│   └── Interactive Scenario Simulator Bar (Live Event Demo Trigger)    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

```mermaid
flowchart TD
    P1[Phase 1: Project Scaffolding & Design Foundation] --> P2[Phase 2: Database Schema & Supabase Services]
    P2 --> P3[Phase 3: Telemetry Simulation & Multi-Sensor Fusion Engine]
    P3 --> P4[Phase 4: Interactive Web Dashboard & Realtime UI]
    P4 --> P5[Phase 5: Alert Lifecycle & Verification Workflow]
    P5 --> P6[Phase 6: Live Scenario Injection & Presentation Mode]
    P6 --> P7[Phase 7: Hardware & Edge Gateway Integration (Raspberry Pi)]
    P7 --> P8[Phase 8: Polish, Production Hardening & Future Scaling]
```

---

### Phase 1: Project Scaffolding & Design Foundation

**Goal:** Establish a modern, high-performance web application foundation with rich dark-mode aesthetics, TypeScript safety, and responsive design systems.

#### 1.1 Technical Stack Setup
- **Framework:** React 19 + Vite (TypeScript template).
- **Styling:** Tailwind CSS + PostCSS + Autoprefixer.
- **Iconography & UI Tokens:** Lucide React icons, Tailwind custom theme (dark slate `#0B0F19`, high-contrast emerald `#10B981`, alert amber `#F59E0B`, critical crimson `#EF4444`).
- **State Management & Data Fetching:** Zustand or lightweight React Context for real-time station state; TanStack Query or native Supabase SDK hooks.

#### 1.2 Directory Structure
```text
galamsey-guard/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/         # Buttons, Modals, Badges, Tabs, StatCards
│   │   ├── dashboard/      # Overview metrics, quick filters, health summary
│   │   ├── map/            # Leaflet map, custom station markers, popup modals
│   │   ├── stations/       # Station list, detail view, real-time gauges
│   │   ├── charts/         # Recharts historical trends & comparison
│   │   ├── alerts/         # Alert table, review drawer, status updater
│   │   └── simulator/      # Scenario injection control drawer
│   ├── config/             # Supabase client, environment configuration
│   ├── hooks/              # useStations, useRealtimeReadings, useAlerts
│   ├── services/           # Supabase queries, mock fallback service
│   ├── types/              # Database models, telemetry schemas, alert enums
│   ├── utils/              # Scoring formula, formatters, coordinate helpers
│   ├── App.tsx             # Root layout with sidebar navigation & header
│   ├── main.tsx
│   └── index.css           # Custom scrollbars, glassmorphism, radar animations
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

#### Deliverables & Acceptance Criteria
- [ ] Vite + React + TypeScript project compiles cleanly with zero lint errors.
- [ ] Custom dark glassmorphism theme and typography loaded.
- [ ] Core layout with responsive navigation sidebar, header status indicators, and view switcher.

---

### Phase 2: Database Schema & Supabase Services

**Goal:** Define the relational PostgreSQL schema in Supabase with indexes, constraints, and real-time subscription support, alongside a robust local offline fallback.

#### 2.1 Database Models (`schema.sql`)
1. **`stations`**:
   - `id` (UUID / text, Primary Key, e.g. `GG-001`)
   - `name` (`VARCHAR(100)`)
   - `location_name` (`VARCHAR(255)`, e.g. *"Pra River Basin — Sector Alpha"*)
   - `latitude` (`DOUBLE PRECISION`), `longitude` (`DOUBLE PRECISION`)
   - `status` (`'ONLINE' | 'OFFLINE' | 'MAINTENANCE'`)
   - `created_at` (`TIMESTAMPTZ`)
2. **`sensor_readings`**:
   - `id` (`BIGSERIAL` / UUID)
   - `station_id` (`REFERENCES stations(id) ON DELETE CASCADE`)
   - `timestamp` (`TIMESTAMPTZ`, indexed)
   - `sound_rms` (`NUMERIC(6,3)`), `dominant_frequency` (`NUMERIC(6,1)`)
   - `vibration_rms` (`NUMERIC(6,3)`)
   - `temperature` (`NUMERIC(4,1)`), `humidity` (`NUMERIC(4,1)`), `pressure` (`NUMERIC(6,1)`)
   - `rain_detected` (`BOOLEAN`)
   - `latitude` (`DOUBLE PRECISION`), `longitude` (`DOUBLE PRECISION`)
   - `created_at` (`TIMESTAMPTZ DEFAULT NOW()`)
3. **`alerts`**:
   - `id` (UUID Primary Key)
   - `station_id` (`REFERENCES stations(id)`)
   - `timestamp` (`TIMESTAMPTZ`)
   - `risk_score` (`INTEGER` from 0 to 100)
   - `risk_level` (`'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL'`)
   - `alert_type` (`'MACHINERY_SUSPECTED' | 'ELEVATED_VIBRATION' | 'ACOUSTIC_ANOMALY'`)
   - `description` (`TEXT`)
   - `status` (`'UNREVIEWED' | 'ACKNOWLEDGED' | 'UNDER REVIEW' | 'RESOLVED' | 'FALSE POSITIVE'`)
   - `reviewer_notes` (`TEXT`)
   - `updated_at` (`TIMESTAMPTZ`)
4. **`device_health`**:
   - `id` (UUID)
   - `station_id` (`REFERENCES stations(id)`)
   - `timestamp` (`TIMESTAMPTZ`)
   - `battery_level` (`NUMERIC(4,1)` %), `solar_charging` (`BOOLEAN`)
   - `network_status` (`'4G' | 'WIFI' | 'LORA' | 'DEGRADED'`)
   - `uptime_seconds` (`BIGINT`)

#### 2.2 Dual-Mode Architecture (Supabase + Offline Memory Mode)
- Provide a `SupabaseService` that talks to live Supabase when `.env` keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are present.
- Provide a seamless `MockDataService` with identical interfaces that runs client-side in the browser or via memory storage when Supabase keys are not configured yet, ensuring the app is 100% interactive out-of-the-box.

#### Deliverables & Acceptance Criteria
- [ ] SQL schema script created with appropriate indexing on `station_id` and `timestamp`.
- [ ] TypeScript interfaces generated and aligned with the DB schema.
- [ ] Service abstraction layer operating seamlessly in both live Supabase and offline mock mode.

---

### Phase 3: Telemetry Simulation & Multi-Sensor Fusion Engine

**Goal:** Implement the rule-based activity scoring algorithm and a realistic multi-station telemetry generator supporting key operational scenarios.

#### 3.1 Multi-Sensor Scoring Algorithm (`scoringEngine.ts`)
The activity indicator uses multi-sensor feature fusion:
1. **Acoustic Index ($S_a \in [0, 100]$)**:
   - Evaluates `sound_rms` normalized against ambient background baseline.
   - Low-frequency penalty: Heavy diesel engines, excavators, and wash plants generate prominent low-frequency signatures ($50 \text{ Hz} - 250 \text{ Hz}$). If `dominant_frequency` is within this band, an acoustic multiplier applies.
2. **Vibration Index ($S_v \in [0, 100]$)**:
   - Evaluates `vibration_rms` representing ground displacement/acceleration from mechanical earth-moving or hydraulic pumping.
3. **Environmental Cancellation (Rain Filter)**:
   - Heavy rain causes elevated ambient acoustic noise without ground vibration.
   - If `rain_detected = true` and `vibration_rms` is low, acoustic weight is dampened, preventing false rain alerts.
4. **Composite Risk Score ($0 - 100$)**:
   $$\text{Score} = \min(100, \text{round}(0.45 \cdot S_a + 0.45 \cdot S_v + \text{ContextBonus}))$$
   - `0 - 30`: **NORMAL** (Ambient forest/river background)
   - `31 - 60`: **ELEVATED** (Transient activity or heavy vehicular transit)
   - `61 - 80`: **HIGH** (Sustained acoustic + seismic activity — Potential machinery)
   - `81 - 100`: **CRITICAL** (Intense multi-signal convergence)

#### 3.2 Standard Scenarios Supported by Simulator
- **Scenario 1 (Normal Ambient):** Low sound (~25–35 dB / 0.15 RMS), low vibration (~0.05 RMS), no rain $\rightarrow$ Score ~10–22.
- **Scenario 2 (Tropical Rainstorm):** High sound (~65–75 dB / 0.65 RMS), low vibration (~0.08 RMS), rain detected $\rightarrow$ Score ~28–38 (Rain filter active).
- **Scenario 3 (Passing Vehicle):** High sound spike, medium vibration, short duration $\rightarrow$ Score ~45–55.
- **Scenario 4 (Possible Heavy Machinery):** High sound (0.75+ RMS), low-freq peak (110–140 Hz), high vibration (0.55+ RMS), no rain $\rightarrow$ Score 75–88 (Trigger alert).
- **Scenario 5 (Civil / Road Construction):** High sound, periodic vibration, daytime $\rightarrow$ Score 60–70.

#### Deliverables & Acceptance Criteria
- [ ] Scoring engine produces deterministic scores matching the specification in Section 9 of the vision.
- [ ] Scenario generator simulates continuous time-series stream for 3 default stations:
  - `GG-001`: Pra River Basin
  - `GG-002`: Atewa Forest Fringe
  - `GG-003`: Tarkwa Community Border
- [ ] Unit tests confirming rain filter dampening and machinery score escalation.

---

### Phase 4: Interactive Web Dashboard & Realtime UI

**Goal:** Construct an intuitive, high-aesthetic dashboard featuring real-time maps, sensor gauges, and historical trend charts.

#### 4.1 UI Views & Components
1. **Executive Stats Bar:**
   - Active Stations counter (e.g., 3/3 Online).
   - Elevated / High Activity indicator badge.
   - Open Alerts count requiring human verification.
   - Network connectivity health status.
2. **Interactive Station Map (`StationMap.tsx`):**
   - Leaflet satellite/terrain toggle with dark tile overlay.
   - Color-coded pulsing markers (Green = Normal, Amber = Elevated, Red = High Activity).
   - Marker click opens quick telemetry inspection drawer with direct station drill-down.
3. **Real-Time Sensor Telemetry Cards (`SensorCards.tsx`):**
   - Sound Level gauge (RMS & estimated dB with dominant Hz).
   - Vibration Level meter (RMS with seismic indicator).
   - Temperature (°C), Relative Humidity (%), Atmospheric Pressure (hPa).
   - Rain Status badge (Clear vs Rain Detected).
4. **Historical Analytics Suite (`StationCharts.tsx`):**
   - Dual-axis time-series chart showing Sound RMS & Vibration RMS over time.
   - Activity Risk Score trend line with threshold markings (30, 60, 80).
   - Microclimate correlation graph (Temp/Humidity vs Acoustic levels).
   - Time-range selector: Last 15 minutes (live), Last 1 hour, Last 24 hours.

#### Deliverables & Acceptance Criteria
- [ ] Map renders properly with customized markers and interactive popups.
- [ ] Real-time cards animate smoothly as new telemetry ticks arrive.
- [ ] Charts dynamically refresh without flickering or layout shift.

---

### Phase 5: Alert Lifecycle & Verification Workflow

**Goal:** Implement the human-in-the-loop operational workflow allowing operators to review anomalies, inspect contributing sensor signals, and record review decisions.

#### 5.1 Alert Workflow Engine
- When a station's activity score crosses $\ge 61$, an alert record is automatically created in `UNREVIEWED` status.
- Alert Notification Banner and audio chime (optional toggle) appears on the dashboard.

#### 5.2 Verification Drawer & Audit Actions
- **Detailed Alert Inspector:**
  - Station name, GPS coordinates, timestamp.
  - Snapshot of sensor values at trigger moment (`sound_rms`, `vibration_rms`, `dominant_frequency`, `rain`).
  - Standardized system description:
    > *"Possible machinery-related activity detected. Human verification required."*
- **State Transition Buttons:**
  - `[Acknowledge]` $\rightarrow$ changes state to `ACKNOWLEDGED`.
  - `[Investigate]` $\rightarrow$ changes state to `UNDER REVIEW` (adds field notes input).
  - `[Resolve]` $\rightarrow$ marks `RESOLVED` (incident logged or addressed).
  - `[Mark False Positive]` $\rightarrow$ flags `FALSE POSITIVE` (allows operator to note cause, e.g. "Known roadwork grader").
- **Historical Audit Trail:** Complete changelog of reviewer timestamps and status changes.

#### Deliverables & Acceptance Criteria
- [ ] Alerts list with status filters (`All`, `Unreviewed`, `In Review`, `Resolved`).
- [ ] Operator can update alert statuses with state persisting in database / mock store.
- [ ] Explicit compliance with the responsible phrasing guidelines.

---

### Phase 6: Live Scenario Injection & Presentation Mode

**Goal:** Provide an interactive demonstration control bar enabling live demonstrations for stakeholders, lecturers, or reviewers with zero friction.

#### 6.1 Demonstration Control Panel
- Floating or collapsible bottom/sidebar drawer: **"Demo Scenario Injector"**.
- One-click triggers:
  - `[Normal Ambient]` $\rightarrow$ Sends calm river/forest telemetry to all stations.
  - `[Simulate Rainstorm]` $\rightarrow$ Injects rain sensor `true` + high sound + low vibration; shows score staying below alert threshold.
  - `[Trigger Machinery Event on GG-001]` $\rightarrow$ Gradually ramps Sound RMS to 0.78, Vibration RMS to 0.62, dominant frequency to 118 Hz over 10 seconds.
  - `[Reset Simulation]` $\rightarrow$ Restores baseline conditions.
- Step-by-step Guided Tour modal explaining the 10-step MVP demonstration flow from Section 23 of the vision.

#### Deliverables & Acceptance Criteria
- [ ] Demo controller triggers immediate visual response on dashboard, map, and charts.
- [ ] Live demo transitions seamlessly from Normal $\rightarrow$ Alert $\rightarrow$ Human Verification $\rightarrow$ Resolution.

---

### Phase 7: Hardware & Edge Gateway Integration (Raspberry Pi)

**Goal:** Connect physical sensors and a Raspberry Pi edge gateway pushing real telemetry to the cloud backend.

#### 7.1 Hardware Bill of Materials & Wiring Blueprint
| Component | Interface | Measurement | Raspberry Pi GPIO |
|---|---|---|---|
| **Raspberry Pi 4 / 3B+** | Host | Edge computation & processing | Linux OS |
| **INMP441** | I2S (Digital Audio) | Sound RMS, FFT Dominant Frequency | GPIO 18 (CLK), 19 (FS), 20 (DIN) |
| **MPU6050** | I2C | 3-Axis Acceleration & Vibration RMS | GPIO 2 (SDA), GPIO 3 (SCL) |
| **BME280** | I2C | Temperature, Humidity, Barometric Pressure | GPIO 2 (SDA), GPIO 3 (SCL) |
| **Rain Sensor Module** | Digital / ADC | Rain presence detection | GPIO 17 (Digital IN) |
| **NEO-6M GPS** | UART | Latitude, Longitude, UTC timestamp | GPIO 14 (TX), GPIO 15 (RX) |

#### 7.2 Edge Client Software (`edge/`)
- Lightweight Python daemon (`galamsey_agent.py`):
  - Samples audio stream over I2S, calculates RMS amplitude and FFT spectral peak.
  - Reads accelerometer at 50 Hz, computes root-mean-square vibration magnitude.
  - Reads BME280 and rain sensor state every 5 seconds.
  - Packages JSON payload matching the prototype data schema (Section 8).
  - Posts telemetry to Supabase REST API via HTTPS (`/rest/v1/sensor_readings`) or local FastAPI broker.
  - Implements offline disk queueing (SQLite / JSON buffer) to survive cellular/Wi-Fi drops.

#### Deliverables & Acceptance Criteria
- [ ] Complete Python edge collection scripts with error handling and retry logic.
- [ ] Hardware wiring schematic diagram and setup instructions in `docs/hardware_setup.md`.
- [ ] Seamless handover: Web dashboard receives real Pi telemetry using the exact same schema as simulated data.

---

### Phase 8: Polish, Production Hardening & Future Scaling

**Goal:** Prepare the system for presentation, field hardening, and technical handoff.

#### 8.1 Polish & Documentation
- Comprehensive `README.md` with quick-start instructions for running both local mock mode and live Supabase mode.
- System demo video recording / screenshot walkthrough.
- Performance optimization: Lazy-loading map tiles, memoized chart rendering, WebSocket throttling.

#### 8.2 Future Roadmap (Post-MVP)
- On-device Edge ML (TensorFlow Lite / Edge Impulse) for acoustic classification of excavator diesel vs chainsaws vs thunder.
- LoRaWAN long-range low-power mesh connectivity for remote forest canopies without cellular coverage.
- Solar PV + LiFePO4 battery power management telemetry.

---

## Detailed Task Checklist & Milestones

| Phase | Task Description | Status | Target Files |
|---|---|---|---|
| **1** | Initialize React 19 + TypeScript + Tailwind CSS | Pending | `package.json`, `vite.config.ts`, `tailwind.config.js` |
| **1** | Build application shell, layout, theme tokens, navigation | Pending | `src/App.tsx`, `src/index.css`, `src/components/layout/*` |
| **2** | Create PostgreSQL database schema & migrations | Pending | `supabase/schema.sql` |
| **2** | Implement Supabase client & dual-mode mock data fallback | Pending | `src/config/supabase.ts`, `src/services/*` |
| **3** | Implement multi-sensor scoring & rain dampening engine | Pending | `src/utils/scoringEngine.ts`, `src/types/index.ts` |
| **3** | Implement realistic multi-station telemetry generator | Pending | `src/services/simulatorService.ts` |
| **4** | Build Interactive Station Map with status markers | Pending | `src/components/map/StationMap.tsx` |
| **4** | Build Real-time Sensor Metric Cards & gauges | Pending | `src/components/stations/SensorCards.tsx` |
| **4** | Build Recharts historical trend & multi-metric charts | Pending | `src/components/charts/StationCharts.tsx` |
| **5** | Build Alert Management Console & Verification Drawer | Pending | `src/components/alerts/AlertsManager.tsx` |
| **5** | Implement audit trail & status update actions | Pending | `src/components/alerts/AlertReviewModal.tsx` |
| **6** | Build Scenario Injection Controller for live demonstration | Pending | `src/components/simulator/ScenarioBar.tsx` |
| **6** | Add 10-Step Guided Walkthrough Mode | Pending | `src/components/common/DemoTourModal.tsx` |
| **7** | Develop Python edge telemetry client for Raspberry Pi | Pending | `edge/galamsey_agent.py`, `edge/requirements.txt` |
| **7** | Author Raspberry Pi sensor wiring guide & hardware docs | Pending | `docs/hardware_setup.md` |
| **8** | End-to-end verification, responsive testing & final docs | Pending | `README.md`, `walkthrough.md` |

---

## Next Action

With the plan finalized, we will proceed immediately to **Phase 1 (Project Scaffolding & Design Foundation)** and **Phase 2 (Database Schema & Service Layer)**.
