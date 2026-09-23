#!/usr/bin/env python3
"""
ThinkPad T420s Antigravity Thermal Bridge Daemon
Connects Linux thinkpad_acpi (/proc/acpi/ibm/fan and /proc/acpi/ibm/thermal)
to the Antigravity Agent web dashboard over HTTP REST API on port 9090.
"""

import http.server
import socketserver
import json
import os
import sys

PORT = int(os.environ.get('BRIDGE_PORT', 9090))
THERMAL_PROC = '/proc/acpi/ibm/thermal'
FAN_PROC = '/proc/acpi/ibm/fan'

class ThinkPadBridgeHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/thermal' or self.path == '/api/status':
            temps = [45, 46, 42, 44, 38, 0, 36, 0]
            fan_info = {"status": "simulated", "speed": 3500, "level": "3"}
            
            # Read real hardware if available
            if os.path.exists(THERMAL_PROC):
                try:
                    with open(THERMAL_PROC, 'r') as f:
                        line = f.read().strip()
                        parts = line.split()
                        if len(parts) > 1 and parts[0] == 'temperatures:':
                            temps = [int(p) for p in parts[1:] if p.lstrip('-').isdigit()]
                except Exception as e:
                    print(f"Error reading {THERMAL_PROC}: {e}", file=sys.stderr)

            if os.path.exists(FAN_PROC):
                try:
                    with open(FAN_PROC, 'r') as f:
                        lines = f.readlines()
                        for l in lines:
                            if 'speed:' in l:
                                fan_info['speed'] = int(l.split(':')[1].strip())
                            elif 'level:' in l:
                                fan_info['level'] = l.split(':')[1].strip()
                            elif 'status:' in l:
                                fan_info['status'] = l.split(':')[1].strip()
                except Exception as e:
                    print(f"Error reading {FAN_PROC}: {e}", file=sys.stderr)

            response_data = {
                "temperatures": temps,
                "fan": fan_info,
                "model": "Lenovo ThinkPad T420s",
                "hardwareLinked": os.path.exists(FAN_PROC) and os.path.exists(THERMAL_PROC)
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/api/fan':
            content_len = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_len)
            try:
                data = json.loads(post_body.decode('utf-8'))
                level = str(data.get('level', 'auto')).lower()
                
                # Sanitize level
                allowed = ['0', '1', '2', '3', '4', '5', '6', '7', 'disengaged', 'auto', 'full-speed']
                if level in allowed:
                    if os.path.exists(FAN_PROC):
                        with open(FAN_PROC, 'w') as f:
                            f.write(f"level {level}\n")
                    print(f"Fan level updated to: {level}")
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success", "level": level}).encode('utf-8'))
                    return
                else:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error": "Invalid fan level"}')
                    return
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    print(f"Starting ThinkPad T420s Thermal Bridge on port {PORT}...")
    with socketserver.TCPServer(("", PORT), ThinkPadBridgeHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down bridge daemon...")
