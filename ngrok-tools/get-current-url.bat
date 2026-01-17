@echo off
REM Quick script to display current ngrok URL

set SCRIPT_DIR=%~dp0
set URL_FILE=%SCRIPT_DIR%current-ngrok-url.txt

if exist "%URL_FILE%" (
    echo.
    echo Current LearnJoy URL:
    echo =========================================
    type "%URL_FILE%"
    echo.
    echo =========================================
) else (
    echo No ngrok URL found. Please start the ngrok manager first.
)

pause
