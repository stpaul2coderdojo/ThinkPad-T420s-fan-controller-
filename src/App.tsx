/**
 * @license MIT
 * Copyright (c) 2026 Dr. Bheemaiah Anil K, Director, Synergy Robotics Seattle
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Fan,
  Cpu,
  Flame,
  Zap,
  Activity,
  Sliders,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Sparkles,
  Info,
} from 'lucide-react';
import { CircularGauge } from './components/CircularGauge';
import { FanController } from './components/FanController';
import { AntigravityAgentPanel } from './components/AntigravityAgentPanel';
import { ThermalChart } from './components/ThermalChart';
import { WorkloadSimulator } from './components/WorkloadSimulator';
import { HardwareBridgeModal } from './components/HardwareBridgeModal';
import {
  FanLevel,
  FanControlMode,
  ThermalSensorData,
  FanStatus,
  AgentDecision,
  AgentConfig,
  TelemetryPoint,
  WorkloadPreset,
} from './types/thermal';

export default function App() {
  // Temperature units: Celsius or Fahrenheit
  const [unit, setUnit] = useState<'C' | 'F'>('C');

  // Control mode: 'antigravity_agent' | 'auto_ec' | 'manual'
  const [controlMode, setControlMode] = useState<FanControlMode>('antigravity_agent');

  // Active fan level
  const [fanLevel, setFanLevel] = useState<FanLevel>(3);

  // Agent configuration
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    targetTempCeiling: 72,
    acousticLimitDba: 38,
    antiHuntingWindowSec: 8,
    aggressiveness: 'balanced',
    preemptiveSurgeProtection: true,
  });

  // Hardware bridge modal state
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isHardwareConnected, setIsHardwareConnected] = useState(false);

  // Workload simulator settings
  const [workloadPreset, setWorkloadPreset] = useState<WorkloadPreset>('balanced');
  const [cpuLoad, setCpuLoad] = useState<number>(32);
  const [ambientTemp, setAmbientTemp] = useState<number>(23);
  const [thermalPasteQuality, setThermalPasteQuality] = useState<'fresh' | 'aged' | 'dry'>('fresh');

  // Thermal state
  const [currentTemp, setCurrentTemp] = useState<number>(49.5);
  const [minTemp, setMinTemp] = useState<number>(42.0);
  const [maxTemp, setMaxTemp] = useState<number>(68.5);
  const [gradientRate, setGradientRate] = useState<number>(0.12); // °C / sec

  // Multi-sensor matrix
  const [sensors, setSensors] = useState<ThermalSensorData>({
    cpuPackage: 49.5,
    cpuCore0: 50.2,
    cpuCore1: 48.8,
    gpu: 47.1,
    pch: 45.3,
    miniPcie: 39.8,
    ambient: 24.2,
  });

  // Fan status
  const [fanStatus, setFanStatus] = useState<FanStatus>({
    level: 3,
    rpm: 3520,
    targetRpm: 3540,
    pwmPercent: 55,
    soundDba: 33.2,
    isSpinning: true,
  });

  // Telemetry buffer for charts
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  // Agent decisions log
  const [decisions, setDecisions] = useState<AgentDecision[]>([
    {
      id: 'init-1',
      timestamp: Date.now() - 6000,
      action: 'Zero-G Coast Down to Level 3',
      reason: 'Negative thermal gradient (-0.35°C/s) sustained. Holding Level 3 for acoustic silence.',
      level: 3,
      rpm: 3540,
      gradient: -0.35,
      confidence: 0.94,
    },
    {
      id: 'init-2',
      timestamp: Date.now() - 15000,
      action: 'Surge Pre-emption to Level 4',
      reason: 'Detected compilation burst. Ramping fan before heatsink copper saturation.',
      level: 4,
      rpm: 3780,
      gradient: 0.88,
      confidence: 0.97,
    },
  ]);

  // Refs for tracking physics & agent hysteresis
  const tempRef = useRef<number>(currentTemp);
  const fanRpmRef = useRef<number>(fanStatus.rpm);
  const fanLevelRef = useRef<FanLevel>(fanLevel);
  const lastLevelChangeTime = useRef<number>(Date.now());
  const prevTempSample = useRef<{ temp: number; time: number }>({ temp: currentTemp, time: Date.now() });

  // Preset load mappings
  const handleSelectPreset = (preset: WorkloadPreset) => {
    setWorkloadPreset(preset);
    let targetLoad = 32;
    if (preset === 'idle') targetLoad = 5;
    if (preset === 'balanced') targetLoad = 35;
    if (preset === 'kernel_compile') targetLoad = 85;
    if (preset === 'video_render') targetLoad = 95;
    if (preset === 'thermal_burnin') targetLoad = 100;
    setCpuLoad(targetLoad);
  };

  const handleSetCustomLoad = (load: number) => {
    setCpuLoad(load);
    if (load <= 10) setWorkloadPreset('idle');
    else if (load <= 50) setWorkloadPreset('balanced');
    else if (load <= 85) setWorkloadPreset('kernel_compile');
    else if (load <= 95) setWorkloadPreset('video_render');
    else setWorkloadPreset('thermal_burnin');
  };

  // Convert level to target RPM and dBA
  const getFanMetrics = (level: FanLevel): { rpm: number; dba: number; pwm: number } => {
    switch (level) {
      case 0:
        return { rpm: 0, dba: 18.0, pwm: 0 };
      case 1:
        return { rpm: 1980, dba: 23.5, pwm: 25 };
      case 2:
        return { rpm: 3150, dba: 28.8, pwm: 40 };
      case 3:
        return { rpm: 3540, dba: 33.2, pwm: 55 };
      case 4:
        return { rpm: 3780, dba: 36.4, pwm: 68 };
      case 5:
        return { rpm: 4050, dba: 40.2, pwm: 78 };
      case 6:
        return { rpm: 4320, dba: 44.1, pwm: 88 };
      case 7:
        return { rpm: 4550, dba: 47.3, pwm: 95 };
      case 'disengaged':
        return { rpm: 5180, dba: 52.0, pwm: 100 };
      case 'auto':
      default:
        return { rpm: 3200, dba: 29.5, pwm: 45 };
    }
  };

  // Switch fan manual level
  const handleSetLevel = (lvl: FanLevel) => {
    setFanLevel(lvl);
    fanLevelRef.current = lvl;
    lastLevelChangeTime.current = Date.now();
  };

  // Update agent config
  const handleUpdateConfig = (newConfig: Partial<AgentConfig>) => {
    setAgentConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Master physics and agent loop (Runs every 250ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // Thermal Resistance based on TIM paste condition
      const timMultiplier =
        thermalPasteQuality === 'fresh' ? 1.0 : thermalPasteQuality === 'aged' ? 1.25 : 1.55;

      // Heat generation proportional to CPU load (Core i7-2640M 35W TDP)
      // Base heat flux
      const heatFluxWatts = 6 + (cpuLoad / 100) * 29 * timMultiplier;

      // Current fan cooling effectiveness
      const effectiveRpm = fanRpmRef.current;
      const coolingPower = (effectiveRpm / 4500) * 38; // Max cooling at 4550 RPM is ~38W

      // Steady state target temp
      const thermalDelta = (heatFluxWatts - coolingPower) * 0.45;
      const targetEquilibrium = ambientTemp + Math.max(8, 14 + heatFluxWatts * 1.35 - (effectiveRpm / 5000) * 18);

      // Approach equilibrium with chassis thermal mass inertia (T420s slim copper heatpipe)
      const current = tempRef.current;
      const smoothingFactor = 0.045; // thermal time constant
      const noise = (Math.random() - 0.5) * 0.15; // small sensor jitter
      const nextTemp = Math.max(
        ambientTemp + 5,
        current + (targetEquilibrium - current) * smoothingFactor + noise
      );

      // Compute gradient (°C/sec)
      const timeElapsedSec = (now - prevTempSample.current.time) / 1000;
      let calculatedGradient = 0;
      if (timeElapsedSec >= 0.8) {
        calculatedGradient = (nextTemp - prevTempSample.current.temp) / timeElapsedSec;
        prevTempSample.current = { temp: nextTemp, time: now };
        setGradientRate(calculatedGradient);
      }

      tempRef.current = nextTemp;
      setCurrentTemp(nextTemp);

      // Track min/max
      setMinTemp((m) => Math.min(m, nextTemp));
      setMaxTemp((m) => Math.max(m, nextTemp));

      // Multi-zone updates
      setSensors({
        cpuPackage: nextTemp,
        cpuCore0: nextTemp + 0.7 + (Math.random() * 0.4 - 0.2),
        cpuCore1: nextTemp - 0.9 + (Math.random() * 0.4 - 0.2),
        gpu: nextTemp * 0.85 + (cpuLoad > 60 ? 8 : 4),
        pch: ambientTemp + 21 + (cpuLoad > 50 ? 5 : 2),
        miniPcie: ambientTemp + 15 + (Math.random() * 0.2),
        ambient: ambientTemp + (nextTemp > 75 ? 2.5 : 1.0),
      });

      // ==========================================
      // CONTROL MODE GOVERNOR
      // ==========================================
      let chosenLevel = fanLevelRef.current;

      if (controlMode === 'antigravity_agent') {
        const timeSinceChange = (now - lastLevelChangeTime.current) / 1000;
        const targetCeiling = agentConfig.targetTempCeiling;
        const antiHuntingWindow = agentConfig.antiHuntingWindowSec;

        // AGENT DECISION ENGINE:
        // Evaluates current temperature, predictive trajectory, and thermal inertia
        let proposedLevel: FanLevel = 3;
        let actionDesc = '';
        let reasonDesc = '';
        let confidence = 0.92;

        if (nextTemp >= 88) {
          // Emergency ceiling protection
          proposedLevel = 'disengaged';
          actionDesc = 'Overheat Disengage Override';
          reasonDesc = `Core DTS at ${nextTemp.toFixed(1)}°C exceeds critical threshold. Max EC fan bypass initiated.`;
          confidence = 0.99;
        } else if (nextTemp >= 80 || (nextTemp >= 74 && calculatedGradient > 0.6)) {
          proposedLevel = 7;
          actionDesc = 'Full High-CFM Surge Containment';
          reasonDesc = `Approaching ceiling (${targetCeiling}°C) with positive delta (+${calculatedGradient.toFixed(2)}°C/s). Level 7 locked.`;
          confidence = 0.96;
        } else if (nextTemp >= 73 || (nextTemp >= 67 && calculatedGradient > 0.4)) {
          proposedLevel = 5;
          actionDesc = 'Pre-emptive Heatpipe Compensation';
          reasonDesc = `Sustained load detected. Ramping to Level 5 before copper pipe saturates.`;
          confidence = 0.94;
        } else if (nextTemp >= 65 || (nextTemp >= 60 && calculatedGradient > 0.25)) {
          proposedLevel = 4;
          actionDesc = 'Acoustic Balanced Equilibrium';
          reasonDesc = `Maintaining optimal cooling while honoring ${agentConfig.acousticLimitDba} dBA sound budget.`;
          confidence = 0.91;
        } else if (nextTemp >= 56) {
          proposedLevel = 3;
          actionDesc = 'Low-Acoustic Thermal Hold';
          reasonDesc = `Temperature in nominal envelope. Operating at steady 3540 RPM.`;
          confidence = 0.95;
        } else if (nextTemp >= 47) {
          proposedLevel = 2;
          actionDesc = 'Whisper Low Flow Flow';
          reasonDesc = `Core cool (${nextTemp.toFixed(1)}°C). Holding Level 2 for stealth acoustics.`;
          confidence = 0.93;
        } else {
          // Cold / Idle
          proposedLevel = 1;
          actionDesc = 'Silent Passive-Assisted Fan';
          reasonDesc = `Core DTS idling at ${nextTemp.toFixed(1)}°C. Minimal 1980 RPM airflow.`;
          confidence = 0.98;
        }

        // Apply Antigravity Zero-G Hysteresis:
        // Prevent rapid downward step-downs if within anti-hunting window to eliminate T420s fan whine hunting!
        const isDownStep =
          typeof proposedLevel === 'number' &&
          typeof chosenLevel === 'number' &&
          proposedLevel < chosenLevel;

        if (isDownStep && timeSinceChange < antiHuntingWindow) {
          // Hold level to damp oscillation
          actionDesc = `Antigravity Zero-G Hold (Level ${chosenLevel})`;
          reasonDesc = `Suppressing premature down-throttle. Anti-hunting window active (${Math.round(antiHuntingWindow - timeSinceChange)}s remaining).`;
        } else if (proposedLevel !== chosenLevel) {
          chosenLevel = proposedLevel;
          fanLevelRef.current = proposedLevel;
          setFanLevel(proposedLevel);
          lastLevelChangeTime.current = now;

          // Record new agent decision
          const newDecision: AgentDecision = {
            id: `dec-${now}`,
            timestamp: now,
            action: actionDesc,
            reason: reasonDesc,
            level: proposedLevel,
            rpm: getFanMetrics(proposedLevel).rpm,
            gradient: calculatedGradient,
            confidence: confidence,
          };
          setDecisions((prev) => [newDecision, ...prev.slice(0, 7)]);
        }
      } else if (controlMode === 'auto_ec') {
        // Standard ThinkPad BIOS EC curve (notorious for step jumping)
        let biosLevel: FanLevel = 1;
        if (nextTemp >= 82) biosLevel = 7;
        else if (nextTemp >= 70) biosLevel = 4;
        else if (nextTemp >= 58) biosLevel = 2;
        else biosLevel = 1;

        if (biosLevel !== chosenLevel) {
          chosenLevel = biosLevel;
          fanLevelRef.current = biosLevel;
          setFanLevel(biosLevel);
        }
      }

      // Smooth RPM transition toward target
      const metrics = getFanMetrics(chosenLevel);
      const rpmDelta = metrics.rpm - fanRpmRef.current;
      const rpmStep = Math.abs(rpmDelta) < 60 ? rpmDelta : Math.sign(rpmDelta) * 110;
      const nextRpm = Math.max(0, fanRpmRef.current + rpmStep);
      fanRpmRef.current = nextRpm;

      setFanStatus({
        level: chosenLevel,
        rpm: nextRpm,
        targetRpm: metrics.rpm,
        pwmPercent: metrics.pwm,
        soundDba: metrics.dba * (nextRpm > 0 ? nextRpm / (metrics.rpm || 1) : 0),
        isSpinning: nextRpm > 0,
      });

      // Update telemetry history buffer (keep 60 points)
      setTelemetryHistory((prev) => {
        const point: TelemetryPoint = {
          time: new Date(now).toLocaleTimeString(),
          timestamp: now,
          temp: nextTemp,
          fanRpm: nextRpm,
          fanLevel: typeof chosenLevel === 'number' ? chosenLevel : 8,
          targetTemp: agentConfig.targetTempCeiling,
          cpuLoad: cpuLoad,
        };
        const updated = [...prev, point];
        return updated.length > 60 ? updated.slice(updated.length - 60) : updated;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [controlMode, cpuLoad, ambientTemp, thermalPasteQuality, agentConfig]);

  // Reset Min/Max
  const handleResetMetrics = () => {
    setMinTemp(currentTemp);
    setMaxTemp(currentTemp);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-zinc-100 flex flex-col font-sans selection:bg-red-900 selection:text-white pb-12">
      {/* ThinkPad Classic Heritage Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Model */}
          <div className="flex items-center gap-3">
            {/* ThinkPad Logo with signature glowing red TrackPoint dot */}
            <div className="flex items-center tracking-tight font-black text-xl italic select-none">
              <span className="text-zinc-100">Think</span>
              <span className="text-zinc-100 relative">
                P
                <span className="absolute -top-1 right-[2px] w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.9)] animate-pulse" />
              </span>
              <span className="text-zinc-100">ad</span>
              <span className="ml-2 not-italic text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-red-500 border border-zinc-700">
                T420s
              </span>
            </div>

            <div className="hidden md:block h-4 w-[1px] bg-zinc-800 mx-1" />

            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span>Intel Core i7-2640M</span>
              <span className="text-zinc-600">•</span>
              <span>Sandy Bridge 32nm</span>
              <span className="text-zinc-600">•</span>
              <span>TjMax 105°C</span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>EC TELEMETRY 5Hz</span>
            </div>

            {/* Hardware Bridge Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsHardwareModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-medium text-zinc-200 border border-zinc-700 transition cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-red-500" />
              <span>Real Hardware ACPI</span>
            </button>

            {/* Reset Stats */}
            <button
              type="button"
              onClick={handleResetMetrics}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
              title="Reset Min / Max Records"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 w-full space-y-6">
        {/* Top Feature Banner: Antigravity Agent Active Notification */}
        {controlMode === 'antigravity_agent' && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-zinc-950/40 border border-red-900/40 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-red-600/20 text-red-500 border border-red-600/40">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-zinc-200">Antigravity Agent Active:</span>{' '}
                <span className="text-zinc-400">
                  Closed-loop zero-G predictive thermal governor is optimizing RPM against Core 0 DTS gradient. Hunting oscillation eliminated.
                </span>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-3 text-zinc-400">
              <span>Acoustic Ceiling: {agentConfig.acousticLimitDba} dBA</span>
              <span className="text-zinc-700">|</span>
              <span>Target: &le;{agentConfig.targetTempCeiling}°C</span>
            </div>
          </div>
        )}

        {/* Primary Dashboard Grid: Circular Gauge (Prominent) + Fan Controller */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Prominent Circular Gauge Component with Live Readout */}
          <div className="lg:col-span-5 flex flex-col">
            <CircularGauge
              temperature={currentTemp}
              unit={unit}
              onToggleUnit={() => setUnit((u) => (u === 'C' ? 'F' : 'C'))}
              gradientRate={gradientRate}
              minTemp={minTemp}
              maxTemp={maxTemp}
              tjMax={105}
              targetCeiling={agentConfig.targetTempCeiling}
              agentActive={controlMode === 'antigravity_agent'}
            />
          </div>

          {/* Right: Fan Controller & Tachometer */}
          <div className="lg:col-span-7 flex flex-col">
            <FanController
              fanStatus={fanStatus}
              mode={controlMode}
              onSetMode={setControlMode}
              onSetLevel={handleSetLevel}
              isAgentActive={controlMode === 'antigravity_agent'}
            />
          </div>
        </div>

        {/* Secondary Row: Antigravity Agent Panel & Live Telemetry Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Antigravity Agentic Reasoning Stream & Tuning */}
          <div className="lg:col-span-6 flex flex-col">
            <AntigravityAgentPanel
              config={agentConfig}
              onUpdateConfig={handleUpdateConfig}
              decisions={decisions}
              isActive={controlMode === 'antigravity_agent'}
              onToggleActive={() =>
                setControlMode((m) => (m === 'antigravity_agent' ? 'auto_ec' : 'antigravity_agent'))
              }
              currentGradient={gradientRate}
              currentTemp={currentTemp}
              currentFanLevel={fanLevel}
            />
          </div>

          {/* 60-Second Real-Time Thermal Timeline Chart */}
          <div className="lg:col-span-6 flex flex-col">
            <ThermalChart
              data={telemetryHistory}
              unit={unit}
              targetCeiling={agentConfig.targetTempCeiling}
            />
          </div>
        </div>

        {/* Bottom Row: Workload Simulator & Multi-Sensor Matrix */}
        <div>
          <WorkloadSimulator
            currentPreset={workloadPreset}
            onSelectPreset={handleSelectPreset}
            cpuLoad={cpuLoad}
            onSetCustomLoad={handleSetCustomLoad}
            ambientTemp={ambientTemp}
            onSetAmbientTemp={setAmbientTemp}
            thermalPasteQuality={thermalPasteQuality}
            onSetPasteQuality={setThermalPasteQuality}
            sensors={sensors}
            unit={unit}
          />
        </div>

        {/* Footer with Author and MIT License */}
        <footer className="pt-6 pb-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-200">Author:</span>
            <span className="text-zinc-300">Dr. Bheemaiah Anil K</span>
            <span className="text-zinc-600">•</span>
            <span className="text-red-400 font-medium">Director, Synergy Robotics Seattle</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px]">
              MIT License
            </span>
            <span className="text-zinc-400 text-[11px]">
              Lenovo ThinkPad T420s Architecture
            </span>
          </div>
        </footer>
      </main>

      {/* Hardware Bridge Modal for Real ThinkPad T420s Linux Machines */}
      <HardwareBridgeModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        isHardwareConnected={isHardwareConnected}
        onConnectHardware={() => {
          setIsHardwareConnected((c) => !c);
        }}
      />
    </div>
  );
}
