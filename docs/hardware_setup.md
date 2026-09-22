# GalamseyGuard — Physical Sensor Wiring & Hardware Blueprint

> **Complete hardware specification, pinout diagrams, and integration guide for the GalamseyGuard physical sensor suite.**

---

## 1. Physical Hardware Bill of Materials (BOM)

| Component | Function | Protocol / Interface | Recommended Part |
|---|---|---|---|
| **Digital Audio Microphone** | Acoustic RMS & FFT Dominant Frequency | I2S Digital Bus | **INMP441** (Omnidirectional MEMS) |
| **Tri-Axial Accelerometer** | Dynamic Vibration Magnitude ($V_{\text{RMS}}$) | I2C (Address `0x68`) | **MPU-6050** (GY-521 Breakout) |
| **Barometer / Temp / Humidity** | Environmental Context Telemetry | I2C (Address `0x76` / `0x77`) | **Bosch BME280** (3.3V Breakout) |
| **Rain Detection Module** | Weather Dampening Threshold | Digital GPIO (Active LOW) / ADC | **FC-37 Rain Drop Sensor** |
| **Geospatial Satellite Receiver** | GPS Coordinates & UTC Time | UART Serial (9600 baud) | **u-blox NEO-6M / NEO-8M** |
| **Edge Compute Unit** | Edge Agent & Ingestion Gateway | Linux SBC / MCU | **Raspberry Pi 4 / 3B+** or **ESP32 DevKit** |

---

## 2. Raspberry Pi 4 / 3B+ Pinout Connection Table

All sensors operate safely at **3.3V Logic Level**.

```text
Raspberry Pi 40-Pin Header
┌───────────────────────────────┐
│ Pin 1  (3.3V PWR)  ═══════════╬═══> VCC on INMP441, MPU-6050, BME280, Rain Sensor
│ Pin 3  (GPIO 2 - I2C SDA) ════╬═══> SDA on MPU-6050 & BME280 (shared I2C bus)
│ Pin 5  (GPIO 3 - I2C SCL) ════╬═══> SCL on MPU-6050 & BME280 (shared I2C bus)
│ Pin 6  (GND)      ════════════╬═══> GND on all sensors & INMP441 L/R pin
│ Pin 8  (GPIO 14 - UART TX) ═══╬═══> RX on NEO-6M GPS
│ Pin 10 (GPIO 15 - UART RX) ═══╬═══> TX on NEO-6M GPS
│ Pin 11 (GPIO 17 - Digital) ═══╬═══> DO (Digital Out) on Rain Sensor FC-37
│ Pin 12 (GPIO 18 - I2S CLK) ═══╬═══> SCK on INMP441
│ Pin 35 (GPIO 19 - I2S FS)  ═══╬═══> WS (Word Select) on INMP441
│ Pin 38 (GPIO 20 - I2S DIN) ═══╬═══> SD (Serial Data) on INMP441
└───────────────────────────────┘
```

### 2.1 Enabling Hardware Interfaces on Raspberry Pi
Open the terminal on the Raspberry Pi:
```bash
# 1. Enable I2C, I2S, and Serial UART via raspi-config
sudo raspi-config
# Navigate to: Interface Options -> Enable I2C, SPI, Serial Port

# 2. Verify I2C devices are detected on the bus
sudo apt-get install -y i2c-tools
i2cdetect -y 1
# Expected output:
#   0x68 (MPU-6050)
#   0x76 or 0x77 (BME280)
```

---

## 3. ESP32 DevKit Pinout Connection Table

For autonomous, low-power battery & solar nodes deployed across forest fringes:

| Sensor Pin | ESP32 Pin | Signal Type | Notes |
|---|---|---|---|
| **INMP441 SCK** | GPIO 26 | I2S Serial Clock | Bit clock |
| **INMP441 WS** | GPIO 25 | I2S Word Select | Left / Right audio framing |
| **INMP441 SD** | GPIO 22 | I2S Serial Data | 24-bit audio stream |
| **INMP441 L/R** | GND | Channel Select | Pull to GND for Left channel |
| **MPU-6050 SDA** | GPIO 21 | I2C Data | Shared bus with BME280 |
| **MPU-6050 SCL** | GPIO 22 | I2C Clock | Shared bus |
| **BME280 SDA** | GPIO 21 | I2C Data | Shared bus |
| **BME280 SCL** | GPIO 22 | I2C Clock | Shared bus |
| **Rain Sensor DO** | GPIO 34 | Digital Input | Active LOW (0 = Rain, 1 = Dry) |
| **NEO-6M TX** | GPIO 16 | Hardware Serial RX2 | Serial2 interface |
| **NEO-6M RX** | GPIO 17 | Hardware Serial TX2 | Serial2 interface |

---

## 4. Signal Processing & Analysis Pipeline

### 4.1 Acoustic Processing (`INMP441`)
- **Sampling**: Continuous $16\text{ kHz}$ PCM audio frames.
- **Root-Mean-Square (RMS)**:
  $$\text{Sound}_{\text{RMS}} = \sqrt{\frac{1}{N}\sum_{i=1}^{N} x_i^2}$$
- **Fast Fourier Transform (FFT)**: Real FFT applied to Hanning-windowed frames to isolate the **$50\text{–}200\text{ Hz}$ heavy diesel engine band** (excavators, bulldozers, water pump diesel engines).

### 4.2 Dynamic Vibration Processing (`MPU-6050`)
- **Sampling**: Tri-axial acceleration $(a_x, a_y, a_z)$ at $50\text{ Hz}$.
- **Resultant Acceleration & Gravity Subtraction**:
  $$a_{\text{dynamic}} = \left|\sqrt{a_x^2 + a_y^2 + a_z^2} - 9.81\right|$$
- **Vibration RMS**:
  $$V_{\text{RMS}} = \sqrt{\frac{1}{M}\sum_{k=1}^{M} a_{\text{dynamic}, k}^2}$$

### 4.3 Multi-Signal Activity Score
$$S_{\text{raw}} = 0.50 \times S_{\text{acoustic}} + 0.35 \times S_{\text{vibration}} + 0.15 \times S_{\text{baseline}}$$
$$\text{If Rain Detected: } S_{\text{final}} = S_{\text{raw}} \times 0.75$$

---

## 5. Quickstart Execution Guide

### Step 1: Install Python Dependencies
```bash
cd edge
pip install -r requirements.txt
```

### Step 2: Calibrate Sensor Baselines
Place the sensor assembly on a flat surface in the target ambient environment:
```bash
python edge/calibrate_sensors.py
```
This writes zero-G gravity offsets and background acoustic noise floors to `edge/calibration.json`.

### Step 3: Run the Physical Telemetry Daemon
```bash
python edge/sensor_agent.py --station GG-001
```
The agent immediately starts transmitting physical readings directly to the web dashboard and Supabase!
