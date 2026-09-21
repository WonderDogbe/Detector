import type { RiskLevel, SensorReading } from '../types';

export interface ScoringResult {
  score: number; // 0 - 100
  riskLevel: RiskLevel;
  soundDb: number;
  acousticIndex: number;
  vibrationIndex: number;
  rainDampened: boolean;
  isMachinerySuspicion: boolean;
  recommendation: string;
}

/**
 * Calculates environmental activity score (0-100) based on multi-sensor telemetry fusion.
 * Implements rain acoustic dampening and low-frequency mechanical vibration correlation.
 */
export function calculateActivityScore(
  reading: Pick<
    SensorReading,
    'sound_rms' | 'dominant_frequency' | 'vibration_rms' | 'rain_detected'
  >
): ScoringResult {
  const { sound_rms, dominant_frequency, vibration_rms, rain_detected } = reading;

  // 1. Calculate approximate Decibel (dB) from normalized Sound RMS (0.0 - 1.0)
  // Ambient floor ~30dB, Maximum scale ~105dB
  const soundDb = Math.round(30 + sound_rms * 75);

  // 2. Acoustic Index (0 - 100)
  let rawAcoustic = sound_rms * 100;

  // Characteristic heavy diesel/excavator low-frequency boost (50Hz - 220Hz)
  const isDieselAcousticBand = dominant_frequency >= 50 && dominant_frequency <= 220;
  if (isDieselAcousticBand && rawAcoustic > 40) {
    rawAcoustic *= 1.2; // 20% amplification for low-frequency rumble
  }

  // 3. Rain Acoustic Dampening Filter
  // Rain generates high acoustic sound without corresponding ground seismic vibration.
  let rainDampened = false;
  if (rain_detected && vibration_rms < 0.2) {
    // Dampen acoustic contribution by 55% because noise is meteorological, not mechanical
    rawAcoustic *= 0.45;
    rainDampened = true;
  }
  const acousticIndex = Math.min(100, Math.max(0, Math.round(rawAcoustic)));

  // 4. Vibration Index (0 - 100)
  // Vibration RMS directly measures mechanical agitation/earth-moving
  const vibrationIndex = Math.min(100, Math.max(0, Math.round(vibration_rms * 100)));

  // 5. Multi-Sensor Convergence Fusion
  let compositeScore = 0;

  if (rain_detected && vibration_rms < 0.15) {
    // Pure rain event: Sound is high, but vibration is near-zero
    compositeScore = 0.25 * acousticIndex + 0.75 * vibrationIndex;
  } else if (acousticIndex > 50 && vibrationIndex > 40) {
    // Both Acoustic AND Vibration elevated: Strong mechanical signature
    // Co-occurrence multiplier
    const harmonicSynergy = 10;
    compositeScore = 0.48 * acousticIndex + 0.48 * vibrationIndex + harmonicSynergy;
  } else {
    // General ambient / transient noise
    compositeScore = 0.5 * acousticIndex + 0.5 * vibrationIndex;
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(compositeScore)));

  // 6. Threshold Mapping (Section 9 of Vision Document)
  let riskLevel: RiskLevel = 'NORMAL';
  if (finalScore >= 81) {
    riskLevel = 'CRITICAL';
  } else if (finalScore >= 61) {
    riskLevel = 'HIGH';
  } else if (finalScore >= 31) {
    riskLevel = 'ELEVATED';
  } else {
    riskLevel = 'NORMAL';
  }

  // Mandatory compliant phrasing from project vision
  const isMachinerySuspicion = finalScore >= 61;
  const recommendation = isMachinerySuspicion
    ? 'Possible machinery-related activity detected. Human verification required.'
    : finalScore >= 31
    ? 'Elevated environmental fluctuations. Continue baseline monitoring.'
    : 'Normal environmental background readings.';

  return {
    score: finalScore,
    riskLevel,
    soundDb,
    acousticIndex,
    vibrationIndex,
    rainDampened,
    isMachinerySuspicion,
    recommendation,
  };
}
