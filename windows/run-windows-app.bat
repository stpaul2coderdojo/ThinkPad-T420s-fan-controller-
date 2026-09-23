@echo off
title ThinkPad T420s Antigravity Thermal Agent Launcher
color 0C
echo ========================================================
echo   Lenovo ThinkPad T420s Antigravity Agent (Windows 10/11)
echo ========================================================
echo.
echo Starting Windows Thermal Telemetry Bridge on http://localhost:9090...
echo.

:: Check for admin rights and request elevation if needed
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [Notice] Requesting Administrator privileges for Embedded Controller fan control...
    powershell -Command "Start-Process cmd -ArgumentList '/c %~dpnx0' -Verb RunAs"
    exit /b
)

:: Launch PowerShell background daemon
start "ThinkPad Bridge Daemon" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ThinkPadThermalBridge.ps1"

echo Bridge started! Launching browser dashboard...
timeout /t 2 >nul
start http://localhost:3000

echo.
echo Dashboard running. Keep this window or the minimized background bridge open.
pause
