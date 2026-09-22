#!/usr/bin/env python3
"""
==============================================================================
GalamseyGuard — Local Edge Ingestion Gateway
Lightweight HTTP Ingestion Server for ESP32 / Raspberry Pi / Local Sensor Nodes
==============================================================================

Listens for HTTP POST requests containing Section 8 JSON sensor packets from
physical microcontrollers on the local network (e.g., ESP32 over Wi-Fi).
Relays packets to Supabase if configured, or serves them locally over REST/CORS.
Zero external dependencies required (built with Python standard library).
"""

import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import requests

PORT = int(os.getenv("GATEWAY_PORT", "5000"))
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")

# In-memory buffer of latest readings by station
latest_readings = {}

class IngestionHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()

        if parsed.path in ("/api/latest", "/api/telemetry"):
            self.wfile.write(json.dumps(latest_readings).encode("utf-8"))
        elif parsed.path == "/api/health":
            self.wfile.write(json.dumps({
                "status": "ONLINE",
                "active_stations": list(latest_readings.keys()),
                "total_stations_tracked": len(latest_readings),
            }).encode("utf-8"))
        else:
            self.wfile.write(json.dumps({"message": "GalamseyGuard Ingestion Gateway Active"}).encode("utf-8"))

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/api/telemetry", "/api/readings", "/rest/v1/sensor_readings"):
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)

            try:
                data = json.loads(post_body.decode("utf-8"))
                station_id = data.get("station_id", "UNKNOWN")
                latest_readings[station_id] = data

                print(f"[Gateway Ingest] Station {station_id} -> Sound: {data.get('sound_rms', 0):.2f}, Vib: {data.get('vibration_rms', 0):.2f}, Score: {data.get('activity_score', 0)}")

                # Relay to Supabase if configured
                if SUPABASE_URL and SUPABASE_KEY:
                    try:
                        headers = {
                            "apikey": SUPABASE_KEY,
                            "Authorization": f"Bearer {SUPABASE_KEY}",
                            "Content-Type": "application/json",
                        }
                        requests.post(f"{SUPABASE_URL}/rest/v1/sensor_readings", headers=headers, json=data, timeout=3)
                    except Exception as relay_err:
                        print(f"[Relay Warning] Supabase relay error: {relay_err}")

                self.send_response(201)
                self.send_header("Content-Type", "application/json")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "station_id": station_id}).encode("utf-8"))

            except Exception as err:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(err)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def run():
    server_address = ("0.0.0.0", PORT)
    httpd = HTTPServer(server_address, IngestionHandler)
    print("=" * 65)
    print(f"  GalamseyGuard Local Edge Ingestion Server Running on port {PORT}")
    print(f"  Ingestion Endpoint: http://localhost:{PORT}/api/telemetry")
    print(f"  CORS Enabled for React Frontend (http://localhost:5173)")
    print("=" * 65)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Gateway] Shutting down.")
        httpd.server_close()

if __name__ == "__main__":
    run()
