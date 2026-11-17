@echo off
cd /d "%~dp0"
start "IdeaPilot Local Server" /min cmd.exe /k "npm.cmd run dev -- --port 5500 --strictPort"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5500/"
