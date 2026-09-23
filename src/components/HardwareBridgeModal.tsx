import React, { useState } from 'react';
import { Terminal, Copy, Check, X, ShieldAlert, Cpu, ExternalLink } from 'lucide-react';

interface HardwareBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHardwareConnected: boolean;
  onConnectHardware: () => void;
}

export const HardwareBridgeModal: React.FC<HardwareBridgeModalProps> = ({
  isOpen,
  onClose,
  isHardwareConnected,
  onConnectHardware,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: 'Step 1: Enable ACPI Fan Control in Linux Kernel',
      desc: 'Allow user-space and thinkfan daemon to write to the embedded controller fan register.',
      code: `sudo modprobe -r thinkpad_acpi\necho "options thinkpad_acpi fan_control=1" | sudo tee /etc/modprobe.d/thinkpad_acpi.conf\nsudo modprobe thinkpad_acpi`,
    },
    {
      title: 'Step 2: Verify ThinkPad T420s Thermal & Fan ACPI files',
      desc: 'Verify that /proc/acpi/ibm/fan and /proc/acpi/ibm/thermal are readable and writable.',
      code: `cat /proc/acpi/ibm/thermal\ncat /proc/acpi/ibm/fan\necho "level 4" | sudo tee /proc/acpi/ibm/fan`,
    },
    {
      title: 'Step 3: Run Local Antigravity Python Telemetry Bridge Daemon',
      desc: 'This lightweight local daemon reads temperatures from /proc/acpi/ibm/thermal and listens on localhost:9090 for fan speed commands from this dashboard.',
      code: `cat << 'EOF' > thinkpad_bridge.py
import http.server, socketserver, json, os

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        try:
            with open('/proc/acpi/ibm/thermal') as f:
                temps = [int(x) for x in f.read().split()[1:] if x.isdigit()]
            with open('/proc/acpi/ibm/fan') as f:
                fan_info = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'temps': temps, 'fan': fan_info}).encode())
        except Exception as e:
            self.send_response(500)
            self.end_headers()

    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len)
        data = json.loads(post_body.decode())
        level = data.get('level', 'auto')
        os.system(f'echo "level {level}" > /proc/acpi/ibm/fan')
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')

print("ThinkPad T420s Antigravity Bridge running on :9090")
socketserver.TCPServer(("", 9090), Handler).serve_forever()
EOF
sudo python3 thinkpad_bridge.py`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950 border border-red-800 text-red-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-zinc-100 uppercase tracking-wide">
                Connect Real ThinkPad T420s Hardware
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Linux thinkpad_acpi EC Direct Kernel Interface
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Hardware Safety Guard</div>
              <div className="text-[11px] text-amber-300/80 leading-relaxed">
                Lenovo ThinkPad T420s thermal cutoff (TjMax) is hardcoded into the Sandy Bridge silicon at 105°C. This app simulates complete thermal physics and communicates directly with the Linux EC kernel driver.
              </div>
            </div>
          </div>

          {/* Steps */}
          {steps.map((step, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200">{step.title}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(step.code, idx)}
                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      Copy Script
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isHardwareConnected ? 'bg-emerald-500 animate-ping' : 'bg-zinc-600'}`} />
            <span className="text-xs font-mono text-zinc-400">
              {isHardwareConnected ? 'Bridge Linked (http://localhost:9090)' : 'Running in High-Fidelity T420s Physics Simulation'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onConnectHardware}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition shadow-lg cursor-pointer"
            >
              {isHardwareConnected ? 'Disconnect Bridge' : 'Probe Localhost Bridge'}
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
