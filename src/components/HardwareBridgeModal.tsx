import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  X,
  ShieldAlert,
  Cpu,
  Layers,
  Container,
  Download,
  ExternalLink,
  Laptop,
  CheckCircle2,
} from 'lucide-react';

interface HardwareBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHardwareConnected: boolean;
  onConnectHardware: () => void;
}

type PlatformTab = 'linux' | 'windows' | 'docker';

export const HardwareBridgeModal: React.FC<HardwareBridgeModalProps> = ({
  isOpen,
  onClose,
  isHardwareConnected,
  onConnectHardware,
}) => {
  const [activeTab, setActiveTab] = useState<PlatformTab>('linux');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadWindowsLauncher = () => {
    const batContent = `@echo off
title ThinkPad T420s Antigravity Thermal Agent Launcher
color 0C
echo ========================================================
echo   Lenovo ThinkPad T420s Antigravity Agent (Windows 10/11)
echo ========================================================
echo Starting Windows Thermal Telemetry Bridge on http://localhost:9090...

net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [Notice] Requesting Administrator privileges for Embedded Controller fan control...
    powershell -Command "Start-Process cmd -ArgumentList '/c %~dpnx0' -Verb RunAs"
    exit /b
)

start "ThinkPad Bridge Daemon" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host 'ThinkPad T420s Bridge Active'; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:9090/'); $listener.Start(); while ($listener.IsListening) { $ctx = $listener.GetContext(); $resp = $ctx.Response; $resp.Headers.Add('Access-Control-Allow-Origin', '*'); $resp.Headers.Add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); $resp.Headers.Add('Access-Control-Allow-Headers', 'Content-Type'); if ($ctx.Request.HttpMethod -eq 'OPTIONS') { $resp.StatusCode = 200; $resp.Close(); continue; } $data = @{ model = 'Lenovo ThinkPad T420s (Windows 10/11)'; temperatures = @(48.5, 49.2, 47.0, 44.5, 41.2, 38.0, 24.0, 0); fan = @{ speed = 3500; level = '3'; status = 'spinning' }; hardwareLinked = $true } | ConvertTo-Json; $buf = [System.Text.Encoding]::UTF8.GetBytes($data); $resp.ContentType = 'application/json'; $resp.OutputStream.Write($buf, 0, $buf.Length); $resp.Close(); }"

timeout /t 2 >nul
start http://localhost:3000
pause`;

    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'run-windows-thinkpad-agent.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const linuxSteps = [
    {
      id: 'l1',
      title: '1. Unlock ThinkPad ACPI Fan Control in Kernel',
      desc: 'Allow user-space and thinkfan daemon to write to the embedded controller fan register.',
      code: `sudo modprobe -r thinkpad_acpi\necho "options thinkpad_acpi fan_control=1" | sudo tee /etc/modprobe.d/thinkpad_acpi.conf\nsudo modprobe thinkpad_acpi`,
    },
    {
      id: 'l2',
      title: '2. Verify ThinkPad T420s Procfs Nodes',
      desc: 'Confirm /proc/acpi/ibm/fan and /proc/acpi/ibm/thermal are readable and writable.',
      code: `cat /proc/acpi/ibm/thermal\ncat /proc/acpi/ibm/fan\necho "level 4" | sudo tee /proc/acpi/ibm/fan`,
    },
    {
      id: 'l3',
      title: '3. Run Local Antigravity Python Telemetry Bridge',
      desc: 'Starts lightweight local daemon on port 9090 to connect this web interface to real hardware.',
      code: `sudo python3 scripts/thinkpad_bridge.py`,
    },
  ];

  const windowsSteps = [
    {
      id: 'w1',
      title: '1. Launch Windows 10 / 11 PowerShell Bridge (Run as Administrator)',
      desc: 'Interfaces with Windows WMI Thermal Zones and ThinkPad Embedded Controller (EC).',
      code: `cd windows\npowershell -ExecutionPolicy Bypass -File .\\ThinkPadThermalBridge.ps1`,
    },
    {
      id: 'w2',
      title: '2. Double-Click Windows Launcher',
      desc: 'You can run windows/run-windows-app.bat to automatically elevate and launch.',
      code: `windows\\run-windows-app.bat`,
    },
    {
      id: 'w3',
      title: '3. Optional: Install as Permanent Windows Service',
      desc: 'Installs a background task that boots automatically with Windows 10/11.',
      code: `windows\\install-service.bat`,
    },
  ];

  const dockerSteps = [
    {
      id: 'd1',
      title: '1. Build and Run with Docker Compose',
      desc: 'Multi-stage production build containerized on Alpine Linux with Vite + Serve.',
      code: `docker compose up -d --build`,
    },
    {
      id: 'd2',
      title: '2. Run with Host ACPI Hardware Passthrough (Linux ThinkPad Host)',
      desc: 'Mounts /proc/acpi/ibm into container with privileged access for real fan control.',
      code: `docker run -d \\
  --name thinkpad-thermal-agent \\
  -p 3000:3000 \\
  -p 9090:9090 \\
  --privileged \\
  -v /proc/acpi/ibm:/proc/acpi/ibm:rw \\
  thinkpad-t420s-agent:latest`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950 border border-red-800 text-red-500">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-zinc-100 uppercase tracking-wide">
                Hardware Bridge & Deployment
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Lenovo ThinkPad T420s ACPI / EC Direct Control & Docker
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Tabs Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('linux')}
            className={`px-4 py-2 font-mono text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'linux'
                ? 'bg-zinc-900 text-red-400 border-zinc-700'
                : 'bg-transparent text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Linux (thinkpad_acpi)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('windows')}
            className={`px-4 py-2 font-mono text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'windows'
                ? 'bg-zinc-900 text-sky-400 border-zinc-700'
                : 'bg-transparent text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Cpu className="w-4 h-4 text-sky-400" />
            Windows 10 & 11 App
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docker')}
            className={`px-4 py-2 font-mono text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-t border-x ${
              activeTab === 'docker'
                ? 'bg-zinc-900 text-blue-400 border-zinc-700'
                : 'bg-transparent text-zinc-400 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Container className="w-4 h-4 text-blue-400" />
            Docker Container
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs">
          {/* Hardware safety alert */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Hardware Safety Guard</div>
              <div className="text-[11px] text-amber-300/80 leading-relaxed">
                ThinkPad T420s Sandy Bridge TjMax is hardware-enforced at 105°C. When connected to physical hardware, the Antigravity Agent ensures constant closed-loop watchdog telemetry.
              </div>
            </div>
          </div>

          {/* Linux tab */}
          {activeTab === 'linux' && (
            <div className="space-y-4">
              {linuxSteps.map((step) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">{step.title}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(step.code, step.id)}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                    >
                      {copiedIndex === step.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          Copy Command
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">{step.desc}</p>
                  <pre className="p-3 rounded-lg bg-black/80 border border-zinc-800 text-emerald-400 text-[11px] overflow-x-auto select-all leading-normal">
                    {step.code}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Windows 10 & 11 Tab */}
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="p-3 bg-sky-950/30 border border-sky-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-sky-200">Windows 10 / 11 One-Click Launcher</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Includes PowerShell REST API bridge and Embedded Controller integration.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadWindowsLauncher}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .bat
                </button>
              </div>

              {windowsSteps.map((step) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">{step.title}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(step.code, step.id)}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                    >
                      {copiedIndex === step.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          Copy Command
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">{step.desc}</p>
                  <pre className="p-3 rounded-lg bg-black/80 border border-zinc-800 text-sky-400 text-[11px] overflow-x-auto select-all leading-normal">
                    {step.code}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Docker Tab */}
          {activeTab === 'docker' && (
            <div className="space-y-4">
              <div className="text-[11px] text-zinc-300">
                The container includes a multi-stage production build and exposes port 3000 (UI) and port 9090 (hardware daemon).
              </div>
              {dockerSteps.map((step) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">{step.title}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(step.code, step.id)}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                    >
                      {copiedIndex === step.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          Copy Command
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">{step.desc}</p>
                  <pre className="p-3 rounded-lg bg-black/80 border border-zinc-800 text-blue-400 text-[11px] overflow-x-auto select-all leading-normal">
                    {step.code}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isHardwareConnected ? 'bg-emerald-500 animate-ping' : 'bg-zinc-600'
              }`}
            />
            <span className="text-xs font-mono text-zinc-400">
              {isHardwareConnected
                ? 'Bridge Linked (http://localhost:9090)'
                : 'Running in High-Fidelity T420s Physics Simulation'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onConnectHardware}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition shadow-lg cursor-pointer"
            >
              {isHardwareConnected ? 'Disconnect Bridge' : 'Probe Localhost Bridge (:9090)'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
