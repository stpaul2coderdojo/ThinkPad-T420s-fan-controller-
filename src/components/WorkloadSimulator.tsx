import React from 'react';
import { Play, Pause, Flame, Sparkles, Code, Film, Zap, Layers, RefreshCw } from 'lucide-react';
import { WorkloadPreset, ThermalSensorData } from '../types/thermal';

interface WorkloadSimulatorProps {
  currentPreset: WorkloadPreset;
  onSelectPreset: (preset: WorkloadPreset) => void;
  cpuLoad: number;
  onSetCustomLoad: (load: number) => void;
  ambientTemp: number;
  onSetAmbientTemp: (temp: number) => void;
  thermalPasteQuality: 'fresh' | 'aged' | 'dry';
  onSetPasteQuality: (quality: 'fresh' | 'aged' | 'dry') => void;
  sensors: ThermalSensorData;
  unit: 'C' | 'F';
}

const PRESETS: { id: WorkloadPreset; label: string; load: number; icon: React.ReactNode; desc: string }[] = [
  { id: 'idle', label: 'Idle / Terminal', load: 4, icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />, desc: 'Minimal background OS tasks (~38-44°C)' },
  { id: 'balanced', label: 'Web & Office', load: 32, icon: <Code className="w-3.5 h-3.5 text-emerald-400" />, desc: 'Chrome tabs, VS Code, Slack (~50-58°C)' },
  { id: 'kernel_compile', label: 'make -j4 Kernel', load: 88, icon: <Layers className="w-3.5 h-3.5 text-amber-400" />, desc: 'Sustained 4-thread gcc compilation (~72-82°C)' },
  { id: 'video_render', label: 'FFmpeg Transcode', load: 96, icon: <Film className="w-3.5 h-3.5 text-orange-400" />, desc: 'x264 high-profile encoding (~78-86°C)' },
  { id: 'thermal_burnin', label: 'AVX Stress Spike', load: 100, icon: <Flame className="w-3.5 h-3.5 text-red-400" />, desc: 'Prime95 / mprime thermal stress test (~88-96°C)' },
];

export const WorkloadSimulator: React.FC<WorkloadSimulatorProps> = ({
  currentPreset,
  onSelectPreset,
  cpuLoad,
  onSetCustomLoad,
  ambientTemp,
  onSetAmbientTemp,
  thermalPasteQuality,
  onSetPasteQuality,
  sensors,
  unit,
}) => {
  const formatTemp = (valC: number) => {
    return unit === 'C' ? `${valC.toFixed(1)}°C` : `${((valC * 9) / 5 + 32).toFixed(1)}°F`;
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-zinc-100 uppercase tracking-wider">
              T420s Thermal Load Simulator & Sensor Matrix
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Simulates Sandy Bridge 32nm TDP (35W) heat dissipation and heatsink saturation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">CPU Load:</span>
          <span className="text-xs font-mono font-bold text-zinc-100 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
            {cpuLoad}%
          </span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {PRESETS.map((preset) => {
          const isActive = currentPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.id)}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-zinc-800 border-red-500 shadow-md'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                  {preset.icon}
                  {preset.label}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">{preset.load}%</span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 leading-tight">
                {preset.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Thermal & Physical Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl mb-4 font-mono text-xs">
        <div>
          <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
            <span>Synthetic Load Injection</span>
            <span className="text-zinc-200 font-bold">{cpuLoad}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={cpuLoad}
            onChange={(e) => onSetCustomLoad(Number(e.target.value))}
            className="w-full accent-red-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
          />
        </div>

        <div>
          <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
            <span>Ambient Room Temperature</span>
            <span className="text-zinc-200 font-bold">{ambientTemp}°C</span>
          </div>
          <input
            type="range"
            min="16"
            max="35"
            value={ambientTemp}
            onChange={(e) => onSetAmbientTemp(Number(e.target.value))}
            className="w-full accent-red-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
          />
        </div>

        <div>
          <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
            <span>Thermal Interface Material (TIM)</span>
            <span className="text-zinc-200 font-bold capitalize">{thermalPasteQuality}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['fresh', 'aged', 'dry'] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSetPasteQuality(q)}
                className={`py-1 text-[10px] uppercase rounded border transition cursor-pointer ${
                  thermalPasteQuality === q
                    ? 'bg-zinc-800 border-red-500 text-zinc-100 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ThinkPad T420s Sensor Array Strip */}
      <div>
        <div className="text-[11px] font-mono uppercase text-zinc-400 mb-2 flex items-center justify-between">
          <span>ThinkPad Sensor Zone Matrix (/proc/acpi/ibm/thermal)</span>
          <span className="text-zinc-400 text-[10px]">T420s 8-Zone Embedded Controller</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800 flex flex-col">
            <span className="text-[9px] font-mono text-zinc-400 uppercase">Core 0</span>
            <span className="text-xs font-mono font-bold text-red-400 mt-0.5">{formatTemp(sensors.cpuCore0)}</span>
          </div>
          <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800 flex flex-col">
            <span className="text-[9px] font-mono text-zinc-400 uppercase">Core 1</span>
            <span className="text-xs font-mono font-bold text-amber-400 mt-0.5">{formatTemp(sensors.cpuCore1)}</span>
          </div>
          <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800 flex flex-col">
            <span className="text-[9px] font-mono text-zinc-400 uppercase">GPU / NVS</span>
            <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{formatTemp(sensors.gpu)}</span>
          </div>
          <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800 flex flex-col">
            <span className="text-[9px] font-mono text-zinc-400 uppercase">PCH Chipset</span>
            <span className="text-xs font-mono font-bold text-zinc-200 mt-0.5">{formatTemp(sensors.pch)}</span>
          </div>
          <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800 flex flex-col">
            <span className="text-[9px] font-mono text-zinc-400 uppercase">MiniPCIe WLAN</span>
            <span className="text-xs font-mono font-bold text-zinc-300 mt-0.5">{formatTemp(sensors.miniPcie)}</span>
          </div>
          <div className="p-2 bg-zinc-950/80 rounded-lg border border-zinc-800 flex flex-col">
            <span className="text-[9px] font-mono text-zinc-400 uppercase">Chassis Air</span>
            <span className="text-xs font-mono font-bold text-cyan-400 mt-0.5">{formatTemp(sensors.ambient)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
