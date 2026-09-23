import React from 'react';
import { Fan, Gauge, Volume2, Cpu, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { FanLevel, FanControlMode, FanStatus } from '../types/thermal';

interface FanControllerProps {
  fanStatus: FanStatus;
  mode: FanControlMode;
  onSetMode: (mode: FanControlMode) => void;
  onSetLevel: (level: FanLevel) => void;
  isAgentActive: boolean;
}

const FAN_LEVELS: { level: FanLevel; label: string; typicalRpm: string; dba: number; desc: string }[] = [
  { level: 0, label: '0', typicalRpm: '0 RPM', dba: 0, desc: 'Passive / Silent' },
  { level: 1, label: '1', typicalRpm: '~1980 RPM', dba: 23, desc: 'Whisper Quiet' },
  { level: 2, label: '2', typicalRpm: '~3150 RPM', dba: 29, desc: 'Low Flow' },
  { level: 3, label: '3', typicalRpm: '~3540 RPM', dba: 33, desc: 'Moderate' },
  { level: 4, label: '4', typicalRpm: '~3780 RPM', dba: 36, desc: 'Workload' },
  { level: 5, label: '5', typicalRpm: '~4050 RPM', dba: 40, desc: 'High Cooling' },
  { level: 6, label: '6', typicalRpm: '~4320 RPM', dba: 44, desc: 'Heavy Load' },
  { level: 7, label: '7', typicalRpm: '~4550 RPM', dba: 47, desc: 'Maximum Regulated' },
  { level: 'disengaged', label: 'MAX', typicalRpm: '~5150+ RPM', dba: 52, desc: 'Disengaged Boost' },
];

export const FanController: React.FC<FanControllerProps> = ({
  fanStatus,
  mode,
  onSetMode,
  onSetLevel,
}) => {
  // Calculate spin animation duration based on RPM (faster RPM = smaller duration)
  const rotationDuration = fanStatus.rpm > 0 ? Math.max(0.12, 60 / fanStatus.rpm) : 0;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      {/* Title & Mode Switcher */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-red-500">
              <Fan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
                ThinkPad T420s ACPI Fan Control
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                FRU 04W1617 / Sunon MagLev EC Interface
              </p>
            </div>
          </div>

          {/* Mode Pill Badges */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => onSetMode('antigravity_agent')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'antigravity_agent'
                  ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Antigravity Agent
            </button>
            <button
              type="button"
              onClick={() => onSetMode('auto_ec')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'auto_ec'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              BIOS EC Auto
            </button>
            <button
              type="button"
              onClick={() => onSetMode('manual')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'manual'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              Manual
            </button>
          </div>
        </div>

        {/* Live Tachometer Visual & Sound Profile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5 items-center">
          {/* Fan Rotor Animation */}
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/70 border border-zinc-800/60 rounded-xl relative overflow-hidden">
            <div className="relative flex items-center justify-center w-24 h-24">
              {/* Outer shroud */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-zinc-700/70 animate-[spin_30s_linear_infinite]" />
              
              {/* Spinning Fan Blades */}
              <div
                className="w-20 h-20 flex items-center justify-center text-zinc-300 transition-transform"
                style={{
                  animation: fanStatus.rpm > 0 ? `spin ${rotationDuration}s linear infinite` : 'none',
                }}
              >
                <Fan className={`w-18 h-18 ${fanStatus.rpm > 4200 ? 'text-red-400' : fanStatus.rpm > 3000 ? 'text-amber-300' : 'text-zinc-300'}`} />
              </div>

              {/* Center ThinkPad red hub button */}
              <div className="absolute w-4 h-4 rounded-full bg-red-600 border border-zinc-900 shadow-md" />
            </div>

            <div className="mt-2 text-center">
              <span className="text-[11px] font-mono uppercase text-zinc-400">Current Level</span>
              <div className="text-sm font-mono font-bold text-zinc-100">
                {fanStatus.level === 'disengaged'
                  ? 'DISENGAGED (64/128)'
                  : fanStatus.level === 'auto'
                  ? 'BIOS AUTO'
                  : `LEVEL ${fanStatus.level}`}
              </div>
            </div>
          </div>

          {/* RPM Readout & Tachometer */}
          <div className="flex flex-col justify-between p-4 bg-zinc-950/70 border border-zinc-800/60 rounded-xl h-full">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span>Tachometer</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                /proc/acpi/ibm/fan
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black font-mono text-zinc-100 tracking-tight">
                  {fanStatus.rpm}
                </span>
                <span className="text-sm font-mono text-zinc-400">RPM</span>
              </div>
              {/* RPM Bar */}
              <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (fanStatus.rpm / 5200) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
              <span>PWM Duty: {fanStatus.pwmPercent}%</span>
              <span>Target: {fanStatus.targetRpm} RPM</span>
            </div>
          </div>

          {/* Acoustic & Thermal Dissipation */}
          <div className="flex flex-col justify-between p-4 bg-zinc-950/70 border border-zinc-800/60 rounded-xl h-full">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                Acoustic SPL
              </span>
              <span className="text-zinc-400 font-mono text-[10px]">T420s Chassis</span>
            </div>

            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black font-mono text-zinc-100 tracking-tight">
                  {fanStatus.soundDba.toFixed(1)}
                </span>
                <span className="text-sm font-mono text-zinc-400">dBA</span>
              </div>
              {/* dB Bar */}
              <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    fanStatus.soundDba > 45
                      ? 'bg-rose-500'
                      : fanStatus.soundDba > 35
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (fanStatus.soundDba / 55) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
              <span>Airflow: {Math.round((fanStatus.rpm / 5000) * 8.8 * 10) / 10} CFM</span>
              <span>Status: {fanStatus.rpm === 0 ? 'Silent' : fanStatus.rpm > 4000 ? 'High Turb' : 'Linear'}</span>
            </div>
          </div>
        </div>

        {/* Manual Speed Step Buttons */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1">
              Manual Speed Select (ACPI levels)
              {mode === 'antigravity_agent' && (
                <span className="text-[10px] text-amber-400 font-normal ml-2">
                  (Overriding switches to Manual mode)
                </span>
              )}
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Sandy Bridge EC 0x0093
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
            {FAN_LEVELS.map((item) => {
              const isSelected = fanStatus.level === item.level;
              return (
                <button
                  key={String(item.level)}
                  type="button"
                  onClick={() => {
                    onSetMode('manual');
                    onSetLevel(item.level);
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/80 border-red-500 text-red-200 shadow-[0_0_10px_rgba(220,38,38,0.4)]'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                  title={`${item.desc} (${item.typicalRpm})`}
                >
                  <span className="text-xs font-black font-mono">
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400 mt-0.5">
                    {item.level === 'disengaged' ? '5.1k' : item.level === 0 ? '0' : `${item.dba}dB`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Emergency Overheat Disengage Action */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Need rapid heat flush?</span>
        </div>

        <button
          type="button"
          onClick={() => {
            onSetMode('manual');
            onSetLevel('disengaged');
          }}
          className="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-700/60 text-red-200 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-red-400" />
          Emergency Flush (Level Disengaged)
        </button>
      </div>
    </div>
  );
};
