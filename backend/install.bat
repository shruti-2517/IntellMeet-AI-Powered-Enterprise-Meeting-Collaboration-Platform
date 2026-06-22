@echo off
title IntellMeet Backend - Installing...
echo.
echo  ====================================
echo   IntellMeet Backend - npm install
echo  ====================================
echo.

cd /d "%~dp0"

echo [1/2] Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo  ERROR: npm install failed!
  echo  Make sure Node.js is installed: https://nodejs.org
  pause
  exit /b 1
)

echo.
echo  [2/2] Dependencies installed successfully!
echo.
echo  Now run: start-server.bat
echo.
pause
