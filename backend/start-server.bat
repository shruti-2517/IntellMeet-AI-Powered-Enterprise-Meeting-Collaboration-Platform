@echo off
title IntellMeet Backend - Server
echo.
echo  ====================================
echo   IntellMeet Backend Starting...
echo  ====================================
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
  echo  node_modules not found. Running npm install first...
  call npm install
  if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: npm install failed!
    pause
    exit /b 1
  )
)

echo  Starting server at http://localhost:5000
echo  Press Ctrl+C to stop.
echo.

call npm run dev

pause
