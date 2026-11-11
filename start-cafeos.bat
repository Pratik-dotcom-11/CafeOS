@echo off
title CafeOS Restaurant Cloud Dev Server
cd /d "%~dp0"
echo ========================================================
echo    Starting CafeOS - Modern Restaurant Operating System
echo    Local URL: http://localhost:5173/
echo ========================================================
npm run dev -- --host 0.0.0.0 --port 5173
pause

