@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies, please wait...
  call npm install --no-fund --no-audit
)
echo Building...
call npm run build
echo.
echo Starting server. Open on PC:   http://localhost:4173
echo On phone (same Wi-Fi): use the "Network" address printed below.
echo Press Ctrl+C to stop.
echo.
call npm run preview -- --host
pause
