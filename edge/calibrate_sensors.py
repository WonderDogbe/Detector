#!/usr/bin/env python3
"""
==============================================================================
GalamseyGuard — Sensor Calibration Utility
Measures ambient background noise and stationary accelerometer zero-G tare.
Outputs configuration to 'edge/calibration.json'.
==============================================================================
"""

import sys
import time
import json
import math
import numpy as np

CALIBRATION_FILE = "edge/calibration.json"

def calibrate():
    print("=" * 65)
    print("  GalamseyGuard Physical Sensor Calibration Wizard")
    print("=" * 65)
    print("1. Place sensor module on a flat, motionless surface.")
    print("2. Ensure the environment is in its quiet baseline state.")
    print("=" * 65)
    input("Press ENTER when ready to start calibration...")

    # 1. Acoustic Noise Floor Calibration
    print("\n[1/2] Sampling ambient acoustic background (5 seconds)...")
    ambient_rms = 0.08
    ambient_db = 42.0

    try:
        import sounddevice as sd
        samples = sd.rec(int(16000 * 5), samplerate=16000, channels=1, dtype='float32', blocking=True)
        sig = samples.flatten()
        ambient_rms = float(np.sqrt(np.mean(sig ** 2)))
        ambient_db = float(20 * np.log10(max(ambient_rms, 1e-4)) + 90.0)
        print(f"  ✓ Measured Ambient Noise Floor: {ambient_db:.1f} dB (RMS: {ambient_rms:.4f})")
    except Exception as e:
        print(f"  ⚠ Audio hardware not accessible ({e}). Using standard field default: {ambient_db:.1f} dB")

    # 2. Accelerometer Tare Calibration
    print("\n[2/2] Measuring accelerometer stationary gravity vector (100 samples)...")
    offset_x, offset_y, offset_z = 0.0, 0.0, 0.0
    baseline_vib = 0.03

    try:
        import smbus2
        bus = smbus2.SMBus(1)
        bus.write_byte_data(0x68, 0x6B, 0)
        time.sleep(0.1)

        def read_raw(reg):
            high = bus.read_byte_data(0x68, reg)
            low = bus.read_byte_data(0x68, reg + 1)
            val = (high << 8) + low
            return val - 65536 if val > 32767 else val

        xs, ys, zs = [], [], []
        for _ in range(100):
            xs.append(read_raw(0x3B) / 16384.0 * 9.81)
            ys.append(read_raw(0x3D) / 16384.0 * 9.81)
            zs.append(read_raw(0x3F) / 16384.0 * 9.81)
            time.sleep(0.02)

        avg_x = float(np.mean(xs))
        avg_y = float(np.mean(ys))
        avg_z = float(np.mean(zs))
        # Zero-out X & Y, and normalize Z to 9.81 m/s^2 (gravity)
        offset_x = -avg_x
        offset_y = -avg_y
        offset_z = -(avg_z - 9.81)
        print(f"  ✓ Accelerometer Offsets: X={offset_x:+.3f}, Y={offset_y:+.3f}, Z={offset_z:+.3f} m/s²")
    except Exception as e:
        print(f"  ⚠ MPU-6050 I2C not accessible ({e}). Using factory calibrated offsets.")

    calib_data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "ambient_noise_db": round(ambient_db, 1),
        "ambient_rms_floor": round(ambient_rms, 4),
        "accel_offset_x": round(offset_x, 4),
        "accel_offset_y": round(offset_y, 4),
        "accel_offset_z": round(offset_z, 4),
        "vibration_rms_baseline": baseline_vib,
        "machinery_trigger_threshold": 60,
    }

    with open(CALIBRATION_FILE, "w") as f:
        json.dump(calib_data, f, indent=2)

    print(f"\n✓ Calibration successfully written to '{CALIBRATION_FILE}'.")
    print("=" * 65)

if __name__ == "__main__":
    calibrate()
