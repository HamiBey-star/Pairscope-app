@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)
node scripts\track.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
node scripts\pack.mjs
echo.
echo Next: upload pairscope-upload.zip to your site.
pause
