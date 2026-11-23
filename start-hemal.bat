@echo off
title Hemal Trainer System - Starting...

:: Change to project directory
cd /d "C:\Users\User\hemal-trainer-system"

:: Start backend server (serves both API + frontend on port 5000)
echo Starting Hemal Trainer backend server...
start "Hemal-Backend" /min cmd /c "node backend/server.js >> backend-log.txt 2>&1"

:: Ensure Tailscale Funnel is active on port 5000 for Online Mobile/Laptop access
if exist "C:\Program Files\Tailscale\tailscale.exe" (
    "C:\Program Files\Tailscale\tailscale.exe" funnel --bg 5000 > nul 2>&1
)

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak > nul

echo.
echo =======================================================
echo  Hemal Trainer System is running!
echo  Desktop Local URL:   http://localhost:5000
echo  Wi-Fi Network URL:   http://192.168.43.154:5000
echo  Online / Mobile URL:  https://xlcmrn.tailc45dc7.ts.net
echo =======================================================
echo.
