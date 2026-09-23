import React from 'react';
import { Flame, ShieldAlert, Sparkles, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface CircularGaugeProps {
  temperature: number; // in Celsius
  unit: 'C' | 'F';
  onToggleUnit: () => void;
  gradientRate: number; // °C per second
  minTemp: number;
  maxTemp: number;
  tjMax?: number;
  targetCeiling?: number;
  agentActive?: boolean;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  temperature,
  unit,
  onToggleUnit,
  gradientRate,
  minTemp,
  maxTemp,
  tjMax = 105,
  targetCeiling = 72,
  agentActive = true,
}) => {
  // Convert display value based on unit
  const displayTemp = unit === 'C' ? temperature : (temperature * 9) / 5 + 32;
  const displayMin = unit === 'C' ? minTemp : (minTemp * 9) / 5 + 32;
  const displayMax = unit === 'C' ? maxTemp : (maxTemp * 9) / 5 + 32;
  const displayCeiling = unit === 'C' ? targetCeiling : (targetCeiling * 9) / 5 + 32;

  // Gauge range: 30°C to 105°C
  const minRange = 30;
  const maxRange = tjMax;
  const clampedTemp = Math.min(Math.max(temperature, minRange), maxRange);
  const percentage = (clampedTemp - minRange) / (maxRange - minRange);

  // SVG circular arc calculation
  // Radius and stroke setup
  const radius = 110;
  const strokeWidth = 14;
  const center = 140;
  // Arc angle: 260 degrees total, starting at 140 degrees (bottom-left) to 400 degrees (bottom-right)
  const arcLengthDeg = 260;
  const startAngleDeg = 140;
  const currentAngleDeg = startAngleDeg + percentage * arcLengthDeg;

  // Arc math in radians
  const startAngleRad = (startAngleDeg * Math.PI) / 180;
  const endAngleRad = ((startAngleDeg + arcLengthDeg) * Math.PI) / 180;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;

  // Polar to cartesian
  const polarToCartesian = (cx: number, cy: number, r: number, angleInRadians: number) => {
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const bgStart = polarToCartesian(center, center, radius, startAngleRad);
  const bgEnd = polarToCartesian(center, center, radius, endAngleRad);
  const activeEnd = polarToCartesian(center, center, radius, currentAngleRad);

  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;
  const largeArcFlag = percentage * arcLengthDeg > 180 ? 1 : 0;
  const activePath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${activeEnd.x} ${activeEnd.y}`;

  // Color mapping based on temperature
  let statusColor = '#10b981'; // emerald (< 55°C)
  let statusGlow = 'rgba(16, 185, 129, 0.35)';
  let statusLabel = 'COOL / OPTIMAL';
  let badgeClass = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50';

  if (temperature >= 85) {
    statusColor = '#ef4444'; // critical red
    statusGlow = 'rgba(239, 68, 68, 0.45)';
    statusLabel = 'CRITICAL THERMAL LIMIT';
    badgeClass = 'text-rose-400 bg-rose-950/70 border-rose-700/60 animate-pulse';
  } else if (temperature >= 75) {
    statusColor = '#f97316'; // orange
    statusGlow = 'rgba(249, 115, 22, 0.4)';
    statusLabel = 'HIGH WORKLOAD';
    badgeClass = 'text-amber-400 bg-amber-950/60 border-amber-800/50';
  } else if (temperature >= 60) {
    statusColor = '#eab308'; // yellow/amber
    statusGlow = 'rgba(234, 179, 8, 0.35)';
    statusLabel = 'WARM / ACTIVE LOAD';
    badgeClass = 'text-yellow-400 bg-yellow-950/60 border-yellow-800/50';
  } else if (temperature < 42) {
    statusColor = '#06b6d4'; // cyan
    statusGlow = 'rgba(6, 182, 212, 0.35)';
    statusLabel = 'IDLE CHILLED';
    badgeClass = 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50';
  }

  const marginToTjMax = Math.max(0, tjMax - temperature);

  return (
    <div className="relative bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 flex flex-col items-center justify-between shadow-2xl backdrop-blur-md overflow-hidden group">
      {/* Background ambient radial glow */}
      <div
        className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-colors duration-700 opacity-20"
        style={{ backgroundColor: statusColor }}
      />

      {/* Header bar within the card */}
      <div className="w-full flex items-center justify-between z-10 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Core 0 / Package DTS
          </span>
        </div>

        {/* Unit Toggle Button */}
        <button
          type="button"
          onClick={onToggleUnit}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-medium text-zinc-300 border border-zinc-700 transition cursor-pointer"
          title="Toggle Celsius / Fahrenheit"
        >
          <span className={unit === 'C' ? 'text-red-500 font-bold' : 'text-zinc-400'}>°C</span>
          <span className="text-zinc-600">/</span>
          <span className={unit === 'F' ? 'text-red-500 font-bold' : 'text-zinc-400'}>°F</span>
        </button>
      </div>

      {/* Circular Gauge Canvas */}
      <div className="relative w-[280px] h-[260px] flex items-center justify-center">
        <svg
          className="w-full h-full transform transition-all duration-300"
          viewBox="0 0 280 280"
          fill="none"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="35%" stopColor="#10b981" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d={bgPath}
            stroke="#27272a"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Tick marks around track */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const angle = startAngleDeg + pct * arcLengthDeg;
            const rad = (angle * Math.PI) / 180;
            const tickInner = polarToCartesian(center, center, radius - 14, rad);
            const tickOuter = polarToCartesian(center, center, radius - 6, rad);
            const tempVal = Math.round(minRange + pct * (maxRange - minRange));
            return (
              <g key={i}>
                <line
                  x1={tickInner.x}
                  y1={tickInner.y}
                  x2={tickOuter.x}
                  y2={tickOuter.y}
                  stroke="#52525b"
                  strokeWidth="2"
                />
                <text
                  x={polarToCartesian(center, center, radius - 24, rad).x}
                  y={polarToCartesian(center, center, radius - 24, rad).y + 3}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[9px] font-mono select-none"
                >
                  {tempVal}°
                </text>
              </g>
            );
          })}

          {/* Active progress arc */}
          {percentage > 0.01 && (
            <path
              d={activePath}
              stroke="url(#gaugeGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#glow)"
              className="transition-all duration-300 ease-out"
            />
          )}

          {/* Needle / Indicator Point at the tip */}
          <circle
            cx={activeEnd.x}
            cy={activeEnd.y}
            r={strokeWidth / 2 + 1}
            fill="#ffffff"
            stroke={statusColor}
            strokeWidth="3"
            className="transition-all duration-300 shadow-lg"
          />

          {/* Target ceiling marker line */}
          {(() => {
            const ceilingPct = (targetCeiling - minRange) / (maxRange - minRange);
            const ceilingAngle = startAngleDeg + ceilingPct * arcLengthDeg;
            const ceilingRad = (ceilingAngle * Math.PI) / 180;
            const markerP1 = polarToCartesian(center, center, radius - 10, ceilingRad);
            const markerP2 = polarToCartesian(center, center, radius + 10, ceilingRad);
            return (
              <line
                key="ceiling-marker"
                x1={markerP1.x}
                y1={markerP1.y}
                x2={markerP2.x}
                y2={markerP2.y}
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="2,2"
              >
                <title>{`Agent Target Ceiling: ${targetCeiling}°C`}</title>
              </line>
            );
          })()}
        </svg>

        {/* Center Live Text Readout (Prominent and Crisp) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 select-none pointer-events-none">
          <div className="flex items-baseline justify-center gap-1">
            <span
              className="text-6xl font-black tracking-tight font-mono transition-colors duration-300 drop-shadow-md"
              style={{ color: statusColor }}
            >
              {displayTemp.toFixed(1)}
            </span>
            <span className="text-2xl font-bold font-mono text-zinc-400">
              °{unit}
            </span>
          </div>

          {/* Status badge pill */}
          <div className={`mt-2 px-3 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border ${badgeClass} transition-colors duration-300 flex items-center gap-1.5`}>
            {temperature >= 85 ? (
              <ShieldAlert className="w-3 h-3 text-rose-400" />
            ) : temperature >= 65 ? (
              <Flame className="w-3 h-3 text-amber-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-emerald-400" />
            )}
            <span>{statusLabel}</span>
          </div>

          {/* Thermal Gradient (dT/dt) readout */}
          <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            {gradientRate > 0.05 ? (
              <span className="text-rose-400 flex items-center font-semibold">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{gradientRate.toFixed(2)} °C/s
              </span>
            ) : gradientRate < -0.05 ? (
              <span className="text-emerald-400 flex items-center font-semibold">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                {gradientRate.toFixed(2)} °C/s
              </span>
            ) : (
              <span className="text-zinc-400 flex items-center">
                <Minus className="w-3.5 h-3.5 mr-0.5 text-zinc-500" />
                Stable (±0.0°/s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer telemetry cards inside gauge container */}
      <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800/80 z-10">
        <div className="flex flex-col items-center bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/50">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Recorded Min</span>
          <span className="text-xs font-mono font-bold text-zinc-200 mt-0.5">
            {displayMin.toFixed(1)}°{unit}
          </span>
        </div>

        <div className="flex flex-col items-center bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/50">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Recorded Max</span>
          <span className="text-xs font-mono font-bold text-zinc-200 mt-0.5">
            {displayMax.toFixed(1)}°{unit}
          </span>
        </div>

        <div className="flex flex-col items-center bg-zinc-950/60 rounded-lg p-2 border border-zinc-800/50">
          <span className="text-[10px] uppercase font-mono text-zinc-400">TjMax Margin</span>
          <span className={`text-xs font-mono font-bold mt-0.5 ${marginToTjMax < 18 ? 'text-rose-400' : 'text-emerald-400'}`}>
            -{marginToTjMax.toFixed(1)}°C
          </span>
        </div>
      </div>
    </div>
  );
};
