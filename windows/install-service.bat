@echo off
title Install ThinkPad Antigravity Windows Background Service
color 0B
echo ===============================================================
echo   Install ThinkPad T420s Agent as Windows 10/11 Background Task
echo ===============================================================
echo.

net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [Error] Please right-click this script and select 'Run as administrator'!
    pause
    exit /b 1
)

echo Registering Windows Scheduled Task for startup...
schtasks /create /tn "ThinkPadThermalAgent" /tr "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%~dp0ThinkPadThermalBridge.ps1\"" /sc onstart /ru SYSTEM /f

if %errorLevel% EQU 0 (
    echo.
    echo [SUCCESS] ThinkPadThermalAgent successfully scheduled to start at Windows boot!
    echo To manually start now, run: schtasks /run /tn "ThinkPadThermalAgent"
) else (
    echo.
    echo [Failed] Error registering task.
)

pause
