# GalamseyGuard — Prototype Project Vision

## 1. Project Overview

**Project Name:** GalamseyGuard

**Project Type:** IoT-Based Environmental Activity Monitoring Prototype

**Primary Goal:** Build a simple working prototype that demonstrates how environmental sensor data can be collected, analyzed, stored, and visualized to identify activity patterns that may be associated with heavy machinery.

**Prototype Edge Device:** Raspberry Pi

**Prototype Backend / Database:** Supabase

**Prototype Web Application:** React + TypeScript

**Prototype Backend API:** Python / FastAPI, introduced when needed

**Prototype Data Source:** Simulated sensor data first, followed by Raspberry Pi sensor data

---

# 2. Prototype Vision

> **To demonstrate a simple IoT monitoring system that uses environmental sound, vibration, weather, and location data to identify unusual activity patterns and present them through an interactive web dashboard.**

The prototype is intended to demonstrate the **technical concept**, not provide a complete real-world galamsey detection solution.

The demonstration should clearly show:

```text
Sensor Data
     ↓
Data Processing
     ↓
Activity Analysis
     ↓
Database
     ↓
Web Dashboard
     ↓
Alert / Human Review
```

---

# 3. Why We Are Building a Prototype

The first objective is to answer a simple question:

> **Can we demonstrate an end-to-end system that detects unusual environmental activity from multiple sensor signals and presents the result clearly to a user?**

We do not need to solve every challenge associated with real-world illegal mining detection at this stage.

Instead, we need to prove that the main components can work together.

---

# 4. What the Prototype Should Demonstrate

The prototype should demonstrate five major capabilities.

## 4.1 Sensor Monitoring

The system should represent measurements from sensors such as:

- Sound
- Vibration
- Temperature
- Humidity
- Rain
- GPS location

Initially, these values can be simulated.

Later, they can come from the Raspberry Pi.

---

## 4.2 Activity Detection

The prototype should analyze the sensor values and determine whether the current conditions appear:

- Normal
- Elevated
- High activity

For example:

```text
Low sound
+
Low vibration
+
Normal environmental conditions
        ↓
NORMAL
```

While:

```text
High sound
+
High vibration
+
No rain
        ↓
HIGH ACTIVITY INDICATOR
```

The system should not claim that this proves illegal mining.

---

# 5. Prototype Demonstration Scenario

The demonstration should use a small number of virtual monitoring stations.

For example:

```text
GG-001 — River Area
GG-002 — Forest Area
GG-003 — Community Area
```

Each station will have:

- Location
- Sensor readings
- Activity level
- Device status
- Recent activity history

The dashboard should allow a user to select a station and see what is happening there.

---

# 6. Prototype Architecture

The initial prototype should be intentionally simple.

```text
             SIMULATED SENSOR DATA
                      |
                      v
              Activity Analysis
                      |
                      v
                  Supabase
                      |
                      v
              React Dashboard
                      |
        +-------------+-------------+
        |             |             |
        v             v             v
       MAP          CHARTS        ALERTS
```

Once the dashboard works, the simulated data source can be replaced by the Raspberry Pi.

```text
             RASPBERRY PI
                   |
             +-----+------+
             |            |
             v            v
          Sensors      Processing
             |            |
             +-----+------+
                   |
                   v
               Supabase
                   |
                   v
            React Dashboard
```

---

# 7. Prototype Components

The prototype consists of four main components.

## 7.1 Raspberry Pi / Sensor Layer

The Raspberry Pi represents the physical monitoring station.

Potential sensors:

### INMP441

Used to represent environmental sound.

Prototype measurements:

- Sound level
- Dominant frequency

### MPU6050

Used to represent vibration.

Prototype measurement:

- Vibration level

### BME280

Used for:

- Temperature
- Humidity
- Pressure

### Rain Sensor

Used to determine whether rain is present.

### GPS

Used to provide:

- Latitude
- Longitude

For the first software demonstration, these values can be simulated.

---

# 8. Prototype Data Model

Each sensor reading should look conceptually like:

```json
{
  "station_id": "GG-001",
  "timestamp": "2026-09-21T14:30:00Z",
  "sound_rms": 0.72,
  "dominant_frequency": 118.4,
  "vibration_rms": 0.43,
  "temperature": 27.4,
  "humidity": 78,
  "pressure": 1012.2,
  "rain_detected": false,
  "latitude": 5.6037,
  "longitude": -0.1870
}
```

The exact values are not important initially.

The important thing is demonstrating the complete data flow.

---

# 9. Activity Indicator

The prototype will use a simple rule-based activity indicator.

For example:

```text
Sound level
      +
Vibration level
      +
Rain condition
      +
Time
      |
      v
Activity Score
```

A simple prototype scale can be:

```text
0–30     NORMAL
31–60    ELEVATED
61–80    HIGH
81–100   CRITICAL
```

These values are **demonstration thresholds only**.

They are not scientifically validated thresholds and must not be presented as evidence that illegal mining has occurred.

---

# 10. Example Demonstration

The dashboard could show:

### Station GG-001

```text
Sound             HIGH
Vibration         HIGH
Temperature       27.4°C
Humidity          78%
Rain              NO

Activity Score    76
Status            HIGH ACTIVITY
```

The system could generate:

> **Possible machinery-related activity detected. Human verification required.**

This wording is intentional.

The system should not display:

> "Galamsey detected."

or:

> "Illegal mining confirmed."

---

# 11. Dashboard Vision

The dashboard is the main demonstration interface.

The first version should focus on **clarity rather than complexity**.

The dashboard should contain:

## Overview

Display:

- Total stations
- Online stations
- Offline stations
- Normal stations
- Elevated stations
- High-activity stations
- Recent alerts

---

# 12. Map

The dashboard should contain an interactive map.

Example:

```text
       MAP

   ● GG-001
        |
        |
              ● GG-002

                    ● GG-003
```

Each marker should represent a monitoring station.

Selecting a marker should show:

- Station name
- Location
- Current activity level
- Latest reading
- Last update

---

# 13. Sensor Cards

When a station is selected, display cards such as:

```text
┌─────────────────┐
│ SOUND           │
│                 │
│ 72%             │
│ HIGH            │
└─────────────────┘

┌─────────────────┐
│ VIBRATION       │
│                 │
│ 43%             │
│ ELEVATED        │
└─────────────────┘

┌─────────────────┐
│ TEMPERATURE     │
│                 │
│ 27.4°C          │
└─────────────────┘

┌─────────────────┐
│ HUMIDITY        │
│                 │
│ 78%             │
└─────────────────┘
```

---

# 14. Historical Charts

The prototype should demonstrate that the system can store and visualize historical information.

For example:

```text
Sound Level
100 |             *
 80 |          *  *
 60 |     *   *     *
 40 | *  *
 20 |
    +-------------------
       10  11  12  13
             Time
```

Additional charts:

- Vibration over time
- Sound over time
- Temperature over time
- Activity score over time

The goal is to show that the system can identify changes rather than only display one instantaneous reading.

---

# 15. Alerts

The prototype should generate alerts when the activity score crosses a threshold.

Example:

```text
ALERT

Station: GG-001
Time: 14:32

Activity Level:
HIGH

Sound: HIGH
Vibration: HIGH
Rain: NO

Possible machinery-related activity.

Status:
UNREVIEWED
```

The user should be able to change the alert status.

Possible statuses:

```text
UNREVIEWED
ACKNOWLEDGED
UNDER REVIEW
RESOLVED
FALSE POSITIVE
```

---

# 16. Human Verification

Human verification is an important part of the demonstration.

The system should show:

```text
AUTOMATED SYSTEM
       ↓
Detects unusual pattern
       ↓
Creates alert
       ↓
Human reviews information
       ↓
Human records outcome
```

This demonstrates responsible use of the technology.

The prototype does not make a legal determination.

---

# 17. Simulated Data

Before connecting physical sensors, the project will use simulated data.

This allows development to begin immediately.

The simulator should create several scenarios.

## Scenario 1 — Normal Environment

```text
Sound: Low
Vibration: Low
Rain: No
Activity: Normal
```

## Scenario 2 — Rain

```text
Sound: Medium
Vibration: Low
Rain: Yes
Activity: Normal/Elevated
```

## Scenario 3 — Vehicle

```text
Sound: High
Vibration: Medium
Rain: No
Activity: Elevated
```

## Scenario 4 — Possible Heavy Machinery

```text
Sound: High
Vibration: High
Rain: No
Activity: High
```

## Scenario 5 — Construction

```text
Sound: High
Vibration: High
Rain: No
Activity: Elevated/High
```

These scenarios are important because the prototype should demonstrate that **similar sensor patterns can have different possible causes**.

---

# 18. Supabase Role

Supabase will initially provide the cloud data layer.

The prototype database should contain:

### Stations

```text
id
device_id
name
location_name
latitude
longitude
status
created_at
```

### Sensor Readings

```text
id
station_id
timestamp
sound_rms
dominant_frequency
vibration_rms
temperature
humidity
pressure
rain_detected
latitude
longitude
created_at
```

### Alerts

```text
id
station_id
timestamp
risk_score
risk_level
alert_type
description
status
created_at
updated_at
```

### Device Health

```text
id
station_id
timestamp
device_status
network_status
battery_level
created_at
```

---

# 19. React Dashboard Role

React will provide the user interface.

The initial application should contain:

```text
/login
/dashboard
/stations
/stations/:id
/alerts
/alerts/:id
/history
/settings
```

However, the prototype does not need every page to be highly complex.

Priority should be:

1. Dashboard
2. Station details
3. Map
4. Charts
5. Alerts

---

# 20. Prototype Technology Stack

| Component | Technology |
|---|---|
| Edge Computer | Raspberry Pi |
| Programming Language | Python |
| Frontend | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| Backend Platform | Supabase |
| Authentication | Supabase Auth |
| Maps | Leaflet / React Leaflet |
| Charts | Recharts |
| API | FastAPI |
| Communication | HTTP initially |
| Version Control | Git / GitHub |

The prototype should avoid unnecessary technologies until they are needed.

---

# 21. Prototype Development Order

The project should be built in this order:

```text
1. Project setup
       ↓
2. React dashboard
       ↓
3. Supabase database
       ↓
4. Simulated stations
       ↓
5. Simulated readings
       ↓
6. Activity scoring
       ↓
7. Dashboard cards
       ↓
8. Station map
       ↓
9. Historical charts
       ↓
10. Alerts
       ↓
11. Authentication
       ↓
12. Realtime updates
       ↓
13. Raspberry Pi
       ↓
14. Real sensors
```

This order prevents the team from becoming blocked by hardware.

---

# 22. MVP Definition

The prototype is considered complete when a user can:

### Step 1

Log into the dashboard.

### Step 2

See several monitoring stations.

### Step 3

View the stations on a map.

### Step 4

Select a station.

### Step 5

View current sensor values.

### Step 6

View the station's historical data.

### Step 7

See an activity score.

### Step 8

Receive a simulated alert.

### Step 9

Open the alert.

### Step 10

Acknowledge or review the alert.

### Step 11

See the system update in near real time.

---

# 23. Prototype Demonstration Flow

The final demonstration should be simple and easy to understand.

## Demonstration

### 1. Open the dashboard

Show:

```text
GalamseyGuard
Environmental Activity Monitoring
```

### 2. Show monitoring stations

Display three stations on the map.

### 3. Select a station

Show its current sensor values.

### 4. Simulate an activity event

Increase:

```text
Sound ↑
Vibration ↑
```

while keeping:

```text
Rain = NO
```

### 5. Activity score increases

For example:

```text
42 → 68 → 76
```

### 6. Alert appears

```text
HIGH ACTIVITY

Possible machinery-related activity.

Human verification required.
```

### 7. Open alert

Show the sensor values that contributed to the alert.

### 8. Review the historical chart

Demonstrate the increase in activity.

### 9. Acknowledge the alert

Change:

```text
UNREVIEWED
       ↓
ACKNOWLEDGED
```

This provides a clear end-to-end demonstration.

---

# 24. What We Are NOT Trying to Prove

The prototype does not attempt to prove:

- That every high-activity event is illegal mining.
- That the system can detect every mining operation.
- That the selected sensors are sufficient for permanent deployment.
- That the risk score represents a legal probability.
- That the system can replace field inspections.
- That the system can operate reliably in all remote environments.

The prototype only demonstrates the feasibility of the **monitoring and alerting concept**.

---

# 25. Prototype Success Criteria

The prototype should satisfy the following:

### Technical

- React dashboard works.
- Supabase database works.
- Simulated data is stored.
- Data is retrieved successfully.
- Map displays stations.
- Charts display historical readings.
- Activity score is calculated.
- Alerts are generated.
- Alert status can be updated.
- Authentication works.

### Demonstration

A user can understand the system within a few minutes.

The demonstration should clearly communicate:

```text
WHAT
The system monitors environmental signals.

HOW
Multiple sensor readings are analyzed.

RESULT
Unusual patterns produce activity indicators.

ACTION
A human reviews the resulting alert.
```

---

# 26. Prototype Design Philosophy

The prototype should follow a **simple first, sophisticated later** approach.

### First

```text
Simple sensors
Simple rules
Simple database
Simple dashboard
```

### Later

```text
Better sensors
Better signal processing
Machine learning
Multiple stations
Advanced analytics
Field deployment
```

This prevents the project from becoming unnecessarily complicated before the core concept is demonstrated.

---

# 27. Future Evolution

After the prototype has been successfully demonstrated, the project can evolve into:

```text
PROTOTYPE
    ↓
CONTROLLED TESTING
    ↓
REAL SENSOR DATA
    ↓
DATASET CREATION
    ↓
MODEL DEVELOPMENT
    ↓
FIELD TESTING
    ↓
MULTI-STATION SYSTEM
```

Potential future capabilities include:

- Machine-learning classification
- Improved acoustic analysis
- Better vibration sensors
- Solar power
- 4G connectivity
- LoRa
- Multiple monitoring stations
- Advanced analytics
- Long-term field deployment

These are **future stages**, not requirements for the first demonstration.

---

# 28. Final Prototype Vision

GalamseyGuard's first goal is not to build a complete national monitoring network.

Its first goal is to build a **small but convincing working demonstration**.

The prototype should show:

```text
       SENSOR DATA
            ↓
      RASPBERRY PI
            ↓
       PROCESS DATA
            ↓
         SUPABASE
            ↓
      WEB DASHBOARD
            ↓
    ┌───────┼────────┐
    ↓       ↓        ↓
   MAP    CHARTS   ALERTS
                    ↓
              HUMAN REVIEW
```

The final demonstration should make the concept easy to understand:

> **GalamseyGuard monitors environmental signals, identifies unusual activity patterns, and presents them to a human through a web dashboard for further investigation.**

That is the core idea the prototype needs to prove.

Everything else—advanced AI, large-scale deployment, specialized sensors, solar systems, advanced communication networks, and extensive field testing—comes after this foundation has been demonstrated successfully.

---

# 29. Immediate Project Goal

The immediate goal is therefore:

> **Build the GalamseyGuard web prototype using simulated sensor data and Supabase, demonstrate monitoring of multiple stations, visualize sensor activity on a map and charts, calculate a simple activity indicator, and generate a human-review alert.**

Only after this software prototype is working will the team integrate the Raspberry Pi and physical sensors.

---

# 30. One-Sentence Project Definition

> **GalamseyGuard is a prototype IoT monitoring platform that combines environmental sensor data and a web dashboard to demonstrate early identification of activity patterns potentially associated with heavy machinery, with human verification remaining essential.**