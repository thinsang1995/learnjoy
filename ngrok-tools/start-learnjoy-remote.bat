@echo off
REM LearnJoy with Remote Redirect Server
REM This script starts Docker Compose, Ngrok and pushes URL to remote server

echo =========================================
echo   LearnJoy with Remote Redirect Server
echo =========================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: ngrok is not installed or not in PATH
    echo Please install ngrok from https://ngrok.com/download
    echo After installing, run: ngrok config add-authtoken YOUR_TOKEN
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not running
    echo Please start Docker Desktop first
    pause
    exit /b 1
)

REM Configuration - EDIT THESE VALUES
set REDIRECT_SERVER_URL=https://your-redirect-server.com
set UPDATE_KEY=learnjoy-secret
set NGROK_PORT=8080
set RESTART_HOURS=12

echo Configuration:
echo   Redirect Server: %REDIRECT_SERVER_URL%
echo   Port: %NGROK_PORT%
echo   Restart Every: %RESTART_HOURS% hours
echo.
echo Starting...
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%ngrok-manager-remote.ps1" -NgrokPort %NGROK_PORT% -RestartIntervalHours %RESTART_HOURS% -RedirectServerUrl %REDIRECT_SERVER_URL% -UpdateKey %UPDATE_KEY%

pause
