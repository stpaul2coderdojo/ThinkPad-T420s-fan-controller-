# ThinkPad T420s Antigravity Thermal Agent 🌡️🛸

[![Author](https://img.shields.io/badge/Author-Dr.%20Bheemaiah%20Anil%20K-red.svg)](mailto:bheemaiah@alumni.iitm.ac.in)
[![Organization](https://img.shields.io/badge/Synergy%20Robotics-Seattle-blueviolet.svg)](#author)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![ThinkPad](https://img.shields.io/badge/ThinkPad-T420s-red.svg)](https://www.thinkwiki.org/wiki/Category:T420s)
[![Kernel](https://img.shields.io/badge/Linux-thinkpad__acpi-blue.svg)](https://www.kernel.org/doc/Documentation/laptops/thinkpad-acpi.txt)
[![Windows](https://img.shields.io/badge/Windows-10%20%2F%2011-0078d4.svg)](https://microsoft.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)

An agentic CPU temperature telemetry monitor, ACPI fan governor, and **Antigravity Zero-G predictive thermal curve controller** designed specifically for the **Lenovo ThinkPad T420s** (Intel Core i5-2520M / i7-2620M / i7-2640M Sandy Bridge).

---

## 🚀 Key Features

- **Precision Circular Temperature Gauge**: High-contrast, dynamic-colored SVG radial arc with live $dT/dt$ thermal gradient vector, margin to $T_{\text{jMax}}$ (105°C), and instantaneous °C / °F conversion.
- **Lenovo ACPI Fan Governor**: Full control of the 8 EC fan levels:
  - `Level 0`: Passive / Stopped (0 RPM)
  - `Level 1`: Whisper Quiet (~1980 RPM, 23.5 dBA)
  - `Level 2`: Low Airflow (~3150 RPM, 28.8 dBA)
  - `Level 3`: Moderate Office (~3540 RPM, 33.2 dBA)
  - `Level 4`: Active Compile (~3780 RPM, 36.4 dBA)
  - `Level 5`: High Thermal (~4050 RPM, 40.2 dBA)
  - `Level 6`: Heavy Stress (~4320 RPM, 44.1 dBA)
  - `Level 7`: Maximum Standard (~4550 RPM, 47.3 dBA)
  - `Level Disengaged`: Full 128-byte EC PWM bypass (~5180+ RPM, 52.0 dBA)
  - `Level Auto`: ThinkPad BIOS EC native curve
- **Antigravity Agentic Engine**:
  - **Zero-G Hysteresis Dampening**: Solves the infamous T420s "fan whine oscillation / hunting" problem by dampening erratic down-shifts.
  - **Feedforward Predictive Gradient Detection**: Proactively spins up the fan when thermal surge ($dT/dt > +0.6^\circ\text{C/s}$) is detected, preventing heatsink copper saturation.
  - **Acoustic SPL Budgeting**: Balances cooling power against target decibel limits (e.g. $\le 38\text{ dBA}$).
- **Multi-Sensor 8-Zone Matrix**: CPU Core 0, Core 1, GPU (Intel HD 3000 / NVIDIA NVS 4200M), Southbridge PCH, MiniPCIe WLAN, and Ambient chassis air.
- **Cross-Platform Bridge Support**:
  - **Linux**: Native `thinkpad_acpi` sysfs / procfs bridge.
  - **Windows 10 & 11**: Direct Embedded Controller (EC I/O Ports `0x66`/`0x62`) PowerShell & LibreHardwareMonitor bridge.
  - **Docker**: Containerized deployment with `--privileged` ACPI device passthrough.

---

## 💻 Running the Web App Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build production bundle
npm run build
```

Open `http://localhost:3000` (or `http://localhost:5173`) in any modern browser.

---

## 🐧 Linux Setup (ThinkPad T420s Native)

### 1. Enable User-Space Fan Control in Linux Kernel

By default, the `thinkpad_acpi` kernel module locks fan control for safety. Enable it:

```bash
# Unload current module
sudo modprobe -r thinkpad_acpi

# Create configuration file to unlock fan control
echo "options thinkpad_acpi fan_control=1" | sudo tee /etc/modprobe.d/thinkpad_acpi.conf

# Reload module
sudo modprobe thinkpad_acpi
```

### 2. Verify ACPI Procfs Nodes

```bash
# Check current temperatures
cat /proc/acpi/ibm/thermal

# Check fan speed & level
cat /proc/acpi/ibm/fan

# Test manual fan speed (Level 4)
echo "level 4" | sudo tee /proc/acpi/ibm/fan

# Revert to automatic BIOS control
echo "level auto" | sudo tee /proc/acpi/ibm/fan
```

### 3. Run the Companion Daemon

Run the Python telemetry bridge (included in the app's Hardware Bridge dialog):

```bash
sudo python3 scripts/thinkpad_bridge.py
```

The web dashboard will automatically connect to `http://localhost:9090` and govern the actual physical fan in real-time.

---

## 🪟 Windows 10 & Windows 11 App Setup

On Windows 10 and 11, Lenovo ThinkPads route fan commands to the Embedded Controller (EC) through I/O ports `0x62` (Data) and `0x66` (Command/Status).

### Method 1: Using the PowerShell Bridge (Recommended)

1. Open PowerShell **as Administrator**.
2. Navigate to the `windows/` folder:
   ```powershell
   cd windows
   powershell -ExecutionPolicy Bypass -File .\ThinkPadThermalBridge.ps1
   ```
3. Or double click `windows\run-windows-app.bat`.

### Method 2: Running as a Windows Background Service

To run automatically when Windows 10 / 11 boots:
```bat
cd windows
install-service.bat
```

### Method 3: Using TPFanControl / LibreHardwareMonitor Integration

If you already have `TPFanControl.exe` (classic utility for ThinkPads):
- Set `Manual=1` in `TPFanControl.ini`.
- The bridge daemon communicates directly with the shared memory pipe or TCP port `2323`.

---

## 🐳 Docker Deployment

You can run the web dashboard and ACPI bridge in a Docker container.

### Using Docker Compose:

```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f
```

### Running with Direct Host Hardware Passthrough on Linux:

```bash
docker run -d \
  --name thinkpad-thermal-agent \
  -p 3000:3000 \
  -p 9090:9090 \
  --privileged \
  -v /proc/acpi/ibm:/proc/acpi/ibm:rw \
  -v /sys/devices/platform/thinkpad_hwmon:/sys/devices/platform/thinkpad_hwmon:ro \
  thinkpad-t420s-thermal-agent:latest
```

---

## ⚙️ REST API Endpoints (Local Bridge Daemon)

When the bridge is running on `http://localhost:9090`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/thermal` | Returns JSON of all 8 EC temperature zones + fan RPM. |
| `POST` | `/api/fan` | Sets fan level `{"level": 0..7 \| "disengaged" \| "auto"}`. |
| `GET` | `/api/status` | Hardware health, ACPI driver status, and fan tachometer. |

---

## 🛡️ Hardware Safety Safeguards

1. **Sandy Bridge Silicon $T_{\text{jMax}}$**: Hard-coded in Intel Core i5/i7 microcode at 105°C.
2. **Failsafe Watchdog**: If the bridge daemon disconnects or experiences a crash, the ThinkPad Embedded Controller automatically returns to `auto` BIOS safety curve within 10 seconds.
3. **Emergency Disengage**: Pressing `Emergency Flush` locks Level Disengaged (~5180 RPM) for immediate thermal relief.

---

## 👨‍🔬 Author

**Dr. Bheemaiah Anil K**  
Director, Synergy Robotics Seattle  
Email: [bheemaiah@alumni.iitm.ac.in](mailto:bheemaiah@alumni.iitm.ac.in)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.  
Copyright (c) 2026 Dr. Bheemaiah Anil K, Director, Synergy Robotics Seattle.
