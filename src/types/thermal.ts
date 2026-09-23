export type FanLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'disengaged' | 'auto';

export type FanControlMode = 'manual' | 'auto_ec' | 'antigravity_agent';

export interface ThermalSensorData {
  cpuPackage: number;
  cpuCore0: number;
  cpuCore1: number;
  gpu: number;
  pch: number;
  miniPcie: number;
  ambient: number;
}

export interface FanStatus {
  level: FanLevel;
  rpm: number;
  targetRpm: number;
  pwmPercent: number;
  soundDba: number;
  isSpinning: boolean;
}

export interface AgentDecision {
  id: string;
  timestamp: number;
  action: string;
  reason: string;
  level: FanLevel;
  rpm: number;
  gradient: number; // deg C per second
  confidence: number;
}

export interface AgentConfig {
  targetTempCeiling: number; // default ~72°C
  acousticLimitDba: number; // default ~38 dBA
  antiHuntingWindowSec: number; // default 8s
  aggressiveness: 'silent' | 'balanced' | 'aggressive' | 'extreme';
  preemptiveSurgeProtection: boolean;
}

export interface TelemetryPoint {
  time: string;
  timestamp: number;
  temp: number;
  fanRpm: number;
  fanLevel: number;
  targetTemp: number;
  cpuLoad: number;
}

export type WorkloadPreset = 'idle' | 'balanced' | 'kernel_compile' | 'video_render' | 'thermal_burnin';
