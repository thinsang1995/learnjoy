@echo off
REM LearnJoy Quick Start Script for Windows
REM This script starts Docker Compose and Ngrok manager

echo =========================================
echo       LearnJoy Quick Start
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

echo Starting LearnJoy with ngrok...
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%ngrok-manager.ps1" -NgrokPort 8080 -RestartIntervalHours 12

pause
