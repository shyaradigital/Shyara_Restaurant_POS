@echo off
echo ========================================
echo   QR Order System - Starting Servers
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Kill any existing Node processes on ports 5000 and 3000
echo Checking for existing servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    echo Stopping existing backend process on port 5000...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping existing frontend process on port 3000...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Starting Backend Server (Port 5000)...
cd /d %~dp0backend
if not exist .env (
    echo Creating .env file...
    copy env.example .env >nul
)
start "Backend Server - Port 5000" cmd /k "cd /d %~dp0backend && echo Backend Server Starting... && node server.js"

timeout /t 4 /nobreak >nul

echo Starting Frontend Server (Port 3000)...
cd /d %~dp0frontend
if not exist .env.local (
    echo Creating .env.local file...
    copy env.example .env.local >nul
)
start "Frontend Server - Port 3000" cmd /k "cd /d %~dp0frontend && echo Frontend Server Starting... && npm run dev"

echo.
echo ========================================
echo   Servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo IMPORTANT:
echo - Two windows will open (one for each server)
echo - Keep BOTH windows open!
echo - Closing a window will stop that server
echo.
echo Wait 10-15 seconds for servers to fully start.
echo Then open http://localhost:3000 in your browser.
echo.
echo Press any key to exit this window...
pause >nul

