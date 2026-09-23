import React from 'react';
import { TelemetryPoint } from '../types/thermal';
import { TrendingUp, Layers, Thermometer, Wind } from 'lucide-react';

interface ThermalChartProps {
  data: TelemetryPoint[];
  unit: 'C' | 'F';
  targetCeiling: number;
}

export const ThermalChart: React.FC<ThermalChartProps> = ({ data, unit, targetCeiling }) => {
  if (data.length < 2) {
    return (
      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex items-center justify-center h-64 font-mono text-xs text-zinc-500">
        Accumulating real-time telemetry buffer...
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const padding = { top: 20, right: 40, bottom: 25, left: 40 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const minTemp = 30;
  const maxTemp = 100;
  const maxRpm = 5500;

  // Coordinate mapping functions
  const getX = (index: number) => {
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  const getYTemp = (tempC: number) => {
    const clamped = Math.min(Math.max(tempC, minTemp), maxTemp);
    const pct = (clamped - minTemp) / (maxTemp - minTemp);
    return padding.top + plotHeight - pct * plotHeight;
  };

  const getYRpm = (rpm: number) => {
    const clamped = Math.min(Math.max(rpm, 0), maxRpm);
    const pct = clamped / maxRpm;
    return padding.top + plotHeight - pct * plotHeight;
  };

  // Generate path string for CPU Temperature
  const tempPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYTemp(d.temp)}`)
    .join(' ');

  // Gradient area path for CPU temperature
  const tempAreaPath = `${tempPath} L ${getX(data.length - 1)} ${padding.top + plotHeight} L ${getX(0)} ${padding.top + plotHeight} Z`;

  // Path for Fan RPM
  const rpmPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYRpm(d.fanRpm)}`)
    .join(' ');

  // Target ceiling line Y
  const ceilingY = getYTemp(targetCeiling);

  // Latest values for badge
  const latest = data[data.length - 1];
  const displayLatestTemp = unit === 'C' ? latest.temp : (latest.temp * 9) / 5 + 32;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold font-mono text-zinc-100 uppercase tracking-wider">
            Live Telemetry Timeline (Last 60 Seconds)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-red-500 rounded-full" />
            <span className="text-zinc-300">CPU Core Temp ({displayLatestTemp.toFixed(1)}°{unit})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 bg-blue-400 rounded-full" />
            <span className="text-zinc-300">Fan Speed ({latest.fanRpm} RPM)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-sky-400 border-b border-dashed border-sky-400" />
            <span className="text-zinc-400">Agent Ceiling ({unit === 'C' ? targetCeiling : (targetCeiling * 9) / 5 + 32}°{unit})</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="tempAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[30, 50, 70, 90].map((t) => {
            const y = getYTemp(t);
            const valDisplay = unit === 'C' ? `${t}°C` : `${Math.round((t * 9) / 5 + 32)}°F`;
            return (
              <g key={t}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-zinc-500 text-[9px] font-mono"
                >
                  {valDisplay}
                </text>
              </g>
            );
          })}

          {/* Target ceiling dashed line */}
          <line
            x1={padding.left}
            y1={ceilingY}
            x2={width - padding.right}
            y2={ceilingY}
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity="0.8"
          />

          {/* Temperature Area fill */}
          <path d={tempAreaPath} fill="url(#tempAreaGradient)" />

          {/* Fan Speed Line (Cyan/Blue) */}
          <path
            d={rpmPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* CPU Temperature Line (Red/Amber) */}
          <path
            d={tempPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Temperature Point Marker */}
          <circle
            cx={getX(data.length - 1)}
            cy={getYTemp(latest.temp)}
            r="4.5"
            fill="#ffffff"
            stroke="#ef4444"
            strokeWidth="2.5"
            className="animate-pulse"
          />

          {/* Current RPM Point Marker */}
          <circle
            cx={getX(data.length - 1)}
            cy={getYRpm(latest.fanRpm)}
            r="3.5"
            fill="#ffffff"
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* X axis baseline */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={width - padding.right}
            y2={padding.top + plotHeight}
            stroke="#3f3f46"
            strokeWidth="1"
          />

          <text
            x={padding.left}
            y={height - 6}
            className="fill-zinc-500 text-[9px] font-mono"
          >
            -60s
          </text>
          <text
            x={width - padding.right}
            y={height - 6}
            textAnchor="end"
            className="fill-zinc-400 text-[9px] font-mono font-bold"
          >
            LIVE NOW
          </text>
        </svg>
      </div>
    </div>
  );
};
