# Windows 10 & Windows 11 Companion Guide 🪟

This folder contains the Windows 10 & Windows 11 companion bridge for the **Lenovo ThinkPad T420s Antigravity Thermal Agent**.

## Requirements
- Windows 10 (Build 1809+) or Windows 11
- PowerShell 5.1+ (Built-in to Windows)
- Administrator privileges (required to interact with ThinkPad ACPI/EC registers)

## Quick Start
1. Right-click `run-windows-app.bat` and select **Run as administrator**.
2. This launches the local REST API server at `http://localhost:9090` and opens the web dashboard in your default browser.
3. The Antigravity Agent will automatically detect the localhost connection and start streaming real hardware temperatures and fan telemetry.

## Running at System Boot
If you want the thermal agent bridge to run automatically whenever you turn on your ThinkPad T420s:
1. Right-click `install-service.bat` and select **Run as administrator**.
2. A Windows Scheduled Task named `ThinkPadThermalAgent` will be created with `SYSTEM` privileges.
3. To uninstall, run:
   ```cmd
   schtasks /delete /tn "ThinkPadThermalAgent" /f
   ```

## Coexisting with TPFanControl
If you already use classic `TPFanControl.exe`:
- Switch TPFanControl to `Manual=1` or `Smart=0` in `TPFanControl.ini` so it does not conflict with the Antigravity Agent's dynamic predictive hysteresis curve.
