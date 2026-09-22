# Raspberry Pi & Physical Sensor Setup Guide: Connecting a New Station

This guide walks you through the step-by-step procedure to connect a physical **Raspberry Pi** equipped with sensors and register it as an active station reading live telemetry into the **GalamseyGuard Dashboard**.

---

## 1. Physical Hardware Wiring (Raspberry Pi 4 / 3B+)

All sensors connect safely to the **3.3V Logic Level** pins on the Raspberry Pi's 40-pin GPIO header:

```text
Raspberry Pi 40-Pin Header
┌─────────────────────────────────┐
│ Pin 1  (3.3V PWR)  ═════════════╬═══> VCC on INMP441, MPU-6050, BME280, Rain Sensor
│ Pin 3  (GPIO 2  - I2C SDA) ═════╬═══> SDA on MPU-6050 & BME280 (Shared I2C bus)
│ Pin 5  (GPIO 3  - I2C SCL) ═════╬═══> SCL on MPU-6050 & BME280 (Shared I2C bus)
│ Pin 6  (GND)       ═════════════╬═══> GND on all sensors & INMP441 L/R pin
│ Pin 8  (GPIO 14 - UART TX) ═════╬═══> RX on NEO-6M GPS Module
│ Pin 10 (GPIO 15 - UART RX) ═════╬═══> TX on NEO-6M GPS Module
│ Pin 11 (GPIO 17 - Digital) ═════╬═══> DO (Digital Out) on Rain Sensor (FC-37)
│ Pin 12 (GPIO 18 - I2S CLK) ═════╬═══> SCK on INMP441 Microphone
│ Pin 35 (GPIO 19 - I2S FS/WS) ═══╬═══> WS (Word Select) on INMP441
│ Pin 38 (GPIO 20 - I2S DIN) ═════╬═══> SD (Serial Data) on INMP441
└─────────────────────────────────┘
```

### Enable Raspberry Pi Hardware Interfaces
On the Raspberry Pi terminal, enable I2C, SPI, and Serial:
```bash
sudo raspi-config
# Select Interface Options -> Enable I2C, SPI, Serial Port
```

Verify your I2C sensors are detected:
```bash
sudo apt-get install -y i2c-tools
i2cdetect -y 1
```
*(You will see `0x68` for the MPU-6050 accelerometer and `0x76` or `0x77` for the BME280 environment sensor).*

---

## 2. Register the New Station on the Dashboard

Before starting the sensor stream on the Pi, register the station so the database and dashboard recognize it:

1. Open the dashboard at `http://localhost:5173/` (or your production URL).
2. Click **`+ Add Station`** in the top header or **`+ Deploy New Station`** on the **Station Fleet Status** card.
3. Fill in the station deployment form:
   - **Station ID**: e.g., `GG-004` (automatically suggested by the modal).
   - **Hardware Device ID**: e.g., `RPI4-GG-ANKOBRA` (or leave the default).
   - **Station Name**: e.g., `Ankobra River Confluence`.
   - **Geographic Area / Basin**: e.g., `Ankobra Basin — Sector Beta`.
   - **Coordinates**: e.g., `5.2140` Latitude, `-2.1520` Longitude (or click one of the quick presets).
4. Click **`Register Station`**.
   - The station is saved to the Supabase database table `stations`.
   - The dashboard immediately renders the station on the Spatial Telemetry Map, Executive KPIs, and Fleet Status list.

---

## 3. Configure & Launch the Edge Agent on the Raspberry Pi

### Step 3.1: Install Dependencies
On the Raspberry Pi:
```bash
cd "Galamsey Activity Detector/edge"
pip install -r requirements.txt
```

### Step 3.2: Set the Environment Variables
Create or edit the `.env` file on the Raspberry Pi:
```env
VITE_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Step 3.3: Launch the Telemetry Daemon
Run the edge agent, specifying the **Station ID** you registered in Step 2:
```bash
python sensor_agent.py --station GG-004 --lat 5.2140 --lng -2.1520
```

*(Optional: If your Raspberry Pi and Dashboard are on the same local network and you prefer running through the FastAPI gateway, add `--gateway` or set `FASTAPI_GATEWAY_URL=http://<YOUR_PC_IP>:8000/api/v1/telemetry`).*

---

## 4. How the Dashboard Reads Live Telemetry (Automatic)

As soon as `sensor_agent.py` starts transmitting:
1. **Telemetry Sampling**: Every 4 seconds, the Raspberry Pi calculates:
   - Sound RMS & dominant diesel FFT frequency ($50\text{–}200\text{ Hz}$).
   - 3-axis vibration magnitude ($V_{\text{RMS}}$).
   - Ambient temperature, humidity, pressure, and rain status.
   - Composite risk score ($0\text{–}100$).
2. **Real-time Ingestion**: The packet is tagged with `"station_id": "GG-004"` and saved into Supabase table `sensor_readings`.
3. **Instant Live Stream**:
   - Supabase Realtime WebSocket broadcasts the packet immediately to the dashboard.
   - The **Live Sensor Stream** gauges for `GG-004` start animating with real physical values.
   - The **Spatial Telemetry Map** updates the halo aura ring (Green for Baseline, Amber for Elevated, Red Pulse for High Risk).
   - The **6-Hour Activity Trend** chart automatically begins plotting the physical curve.
   - If machinery vibration or heavy acoustic signatures exceed thresholds (score $\ge 60$), an alert automatically generates in the **Priority Incident Card** for human operator review!
