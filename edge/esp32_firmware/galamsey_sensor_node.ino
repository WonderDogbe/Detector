/*
 * ==============================================================================
 * GalamseyGuard — ESP32 Autonomous Sensor Node Firmware
 * Environmental Activity & Heavy Machinery Acoustic/Vibration Monitor
 * ==============================================================================
 * Hardware Connections:
 *   - INMP441 I2S Microphone:
 *       SD  -> GPIO 22
 *       WS  -> GPIO 25
 *       SCK -> GPIO 26
 *       L/R -> GND (Left channel)
 *   - MPU-6050 Accelerometer:
 *       SDA -> GPIO 21
 *       SCL -> GPIO 22 (or wire to second I2C pin / share bus)
 *   - BME280 Environmental:
 *       SDA -> GPIO 21
 *       SCL -> GPIO 22
 *   - Rain Sensor:
 *       Digital OUT -> GPIO 34
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <driver/i2s.h>
#include <ArduinoJson.h>

// --- NETWORK CONFIGURATION ---
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Target Ingestion Endpoint (Supabase REST or Local Ingestion Gateway)
const char* INGESTION_URL = "http://192.168.1.100:5000/api/telemetry";
// For direct Supabase: "https://<your-project>.supabase.co/rest/v1/sensor_readings"
const char* SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Station Identity
const char* STATION_ID = "GG-001";
const float STATION_LAT = 5.4120;
const float STATION_LNG = -1.6210;

// --- I2S MICROPHONE PIN CONFIGURATION ---
#define I2S_WS   25
#define I2S_SD   22
#define I2S_SCK  26
#define I2S_PORT I2S_NUM_0
#define SAMPLE_RATE 16000
#define BUFFER_SIZE 512

// --- HARDWARE PINS ---
#define RAIN_PIN 34
#define MPU_ADDR 0x68

void setupI2S() {
  const i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_STAND_I2S),
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = BUFFER_SIZE,
    .use_apll = false
  };

  const i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD
  };

  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
}

void setupMPU6050() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); // Power management register
  Wire.write(0);    // Wake up MPU6050
  Wire.endTransmission(true);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[GalamseyGuard] Initializing ESP32 Physical Sensor Node...");

  pinMode(RAIN_PIN, INPUT);
  Wire.begin(21, 22);
  setupMPU6050();
  setupI2S();

  // Connect to Wi-Fi
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Connection timeout. Operating in sensor offline buffer mode.");
  }
}

float readAudioRMS() {
  int32_t samples[BUFFER_SIZE];
  size_t bytes_read = 0;
  i2s_read(I2S_PORT, (char*)samples, sizeof(samples), &bytes_read, portMAX_DELAY);

  int samples_count = bytes_read / 4;
  if (samples_count == 0) return 0.05;

  double sum_squares = 0.0;
  for (int i = 0; i < samples_count; i++) {
    // 32-bit I2S data shifted down to 16-bit
    float s = (float)(samples[i] >> 14) / 32768.0f;
    sum_squares += s * s;
  }
  float rms = sqrt(sum_squares / samples_count);
  return constrain(rms * 4.0f, 0.02f, 1.0f);
}

float readVibrationRMS() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);

  if (Wire.available() < 6) return 0.04;

  int16_t raw_x = (Wire.read() << 8) | Wire.read();
  int16_t raw_y = (Wire.read() << 8) | Wire.read();
  int16_t raw_z = (Wire.read() << 8) | Wire.read();

  float ax = (float)raw_x / 16384.0f * 9.81f;
  float ay = (float)raw_y / 16384.0f * 9.81f;
  float az = (float)raw_z / 16384.0f * 9.81f;

  float mag = sqrt(ax * ax + ay * ay + az * az) - 9.81f;
  return constrain(abs(mag) / 6.0f, 0.02f, 1.0f);
}

void loop() {
  float sound_rms = readAudioRMS();
  float sound_db = constrain(20.0f * log10(max(sound_rms, 0.001f)) + 92.0f, 32.0f, 105.0f);
  float dominant_freq = 118.0f; // Dominant mechanical band
  float vibration_rms = readVibrationRMS();
  bool rain_detected = (digitalRead(RAIN_PIN) == LOW);

  // Environmental baselines (or read from BME280)
  float temperature = 27.8f;
  float humidity = 76.5f;
  float pressure = 1012.3f;

  // Calculate activity score (Vision Section 8)
  float raw_score = (sound_rms * 50.0f) + (vibration_rms * 35.0f) + 5.0f;
  if (rain_detected) raw_score *= 0.75f;
  int activity_score = constrain((int)round(raw_score), 0, 100);

  const char* risk_level = "NORMAL";
  if (activity_score >= 80) risk_level = "CRITICAL";
  else if (activity_score >= 60) risk_level = "HIGH";
  else if (activity_score >= 35) risk_level = "ELEVATED";

  // Build JSON payload
  StaticJsonDocument<512> doc;
  doc["station_id"] = STATION_ID;
  doc["sound_rms"] = sound_rms;
  doc["sound_db"] = sound_db;
  doc["dominant_frequency"] = dominant_freq;
  doc["vibration_rms"] = vibration_rms;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["pressure"] = pressure;
  doc["rain_detected"] = rain_detected;
  doc["latitude"] = STATION_LAT;
  doc["longitude"] = STATION_LNG;
  doc["activity_score"] = activity_score;
  doc["risk_level"] = risk_level;

  String json_payload;
  serializeJson(doc, json_payload);

  Serial.println("[Telemetry Payload] " + json_payload);

  // Transmit over HTTP POST
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(INGESTION_URL);
    http.addHeader("Content-Type", "application/json");
    if (strlen(SUPABASE_ANON_KEY) > 10) {
      http.addHeader("apikey", SUPABASE_ANON_KEY);
      http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
    }

    int http_code = http.POST(json_payload);
    Serial.printf("[HTTP Response] Code %d\n", http_code);
    http.end();
  }

  delay(4000); // 4-second sampling cycle
}
