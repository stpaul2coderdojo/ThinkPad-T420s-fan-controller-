import React from 'react';
import { Bot, Sparkles, Activity, Shield, Sliders, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { AgentDecision, AgentConfig, FanLevel } from '../types/thermal';

interface AntigravityAgentPanelProps {
  config: AgentConfig;
  onUpdateConfig: (newConfig: Partial<AgentConfig>) => void;
  decisions: AgentDecision[];
  isActive: boolean;
  onToggleActive: () => void;
  currentGradient: number;
  currentTemp: number;
  currentFanLevel: FanLevel;
}

export const AntigravityAgentPanel: React.FC<AntigravityAgentPanelProps> = ({
  config,
  onUpdateConfig,
  decisions,
  isActive,
  onToggleActive,
  currentGradient,
  currentTemp,
  currentFanLevel,
}) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950/70 border border-red-800/50 text-red-500">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
                  Antigravity Agentic Engine
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                    : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                }`}>
                  {isActive ? 'Autonomous Loop: ON' : 'Paused / Manual'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Zero-G Thermal Inertia Model & Anti-Hunting Predictive PID
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleActive}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition cursor-pointer border ${
              isActive
                ? 'bg-emerald-900/40 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-red-900/40 border-red-700 text-red-300 hover:bg-red-900/60'
            }`}
          >
            {isActive ? 'Disengage Agent' : 'Engage Antigravity Agent'}
          </button>
        </div>

        {/* Live Vector & Tuning Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 bg-zinc-950/70 border border-zinc-800/60 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Target Temp Ceiling</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-zinc-100">{config.targetTempCeiling}</span>
              <span className="text-xs font-mono text-zinc-400">°C</span>
            </div>
            <input
              type="range"
              min="55"
              max="85"
              step="1"
              value={config.targetTempCeiling}
              onChange={(e) => onUpdateConfig({ targetTempCeiling: Number(e.target.value) })}
              className="w-full mt-2 accent-red-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>

          <div className="p-3 bg-zinc-950/70 border border-zinc-800/60 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Acoustic Ceiling</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-zinc-100">{config.acousticLimitDba}</span>
              <span className="text-xs font-mono text-zinc-400">dBA</span>
            </div>
            <input
              type="range"
              min="28"
              max="50"
              step="1"
              value={config.acousticLimitDba}
              onChange={(e) => onUpdateConfig({ acousticLimitDba: Number(e.target.value) })}
              className="w-full mt-2 accent-red-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>

          <div className="p-3 bg-zinc-950/70 border border-zinc-800/60 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Anti-Hunting Window</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold text-zinc-100">{config.antiHuntingWindowSec}</span>
              <span className="text-xs font-mono text-zinc-400">sec</span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              step="1"
              value={config.antiHuntingWindowSec}
              onChange={(e) => onUpdateConfig({ antiHuntingWindowSec: Number(e.target.value) })}
              className="w-full mt-2 accent-red-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>

          <div className="p-3 bg-zinc-950/70 border border-zinc-800/60 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Cooling Policy</span>
            <select
              value={config.aggressiveness}
              onChange={(e) => onUpdateConfig({ aggressiveness: e.target.value as any })}
              className="w-full mt-1 bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 rounded-lg p-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="silent">Silent Acoustic</option>
              <option value="balanced">Balanced Zero-G</option>
              <option value="aggressive">Aggressive Chill</option>
              <option value="extreme">Cold Sustained AVX</option>
            </select>
            <div className="text-[10px] font-mono text-zinc-400 mt-1">
              PID + Feedforward
            </div>
          </div>
        </div>

        {/* Live Agent Reasoning Feed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-500" />
              Agent Real-Time Inference Stream
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Predictive rate: 5 Hz (200ms)
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {decisions.slice(0, 4).map((dec, index) => (
              <div
                key={dec.id}
                className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                  index === 0
                    ? 'bg-zinc-950/90 border-red-800/50 shadow-sm'
                    : 'bg-zinc-950/40 border-zinc-800/60 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-400 flex items-center gap-1">
                    {index === 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                    {dec.action}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span>Target: {dec.rpm} RPM</span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-emerald-400 font-semibold">{Math.round(dec.confidence * 100)}% conf</span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                  {dec.reason}
                </p>
              </div>
            ))}
            {decisions.length === 0 && (
              <div className="p-4 text-center text-xs font-mono text-zinc-400 bg-zinc-950/40 rounded-xl border border-zinc-800">
                Awaiting telemetry frames...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Feature Callout */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span className="flex items-center gap-1 text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Anti-Oscillation Hysteresis: Active (Eliminates T420s fan whine hunting)
        </span>
        <span className="text-zinc-400">
          dT/dt: {currentGradient >= 0 ? `+${currentGradient.toFixed(2)}` : currentGradient.toFixed(2)}°C/s
        </span>
      </div>
    </div>
  );
};
