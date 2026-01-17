#!/bin/bash

# Quick Start Script for LearnJoy on macOS (Apple Silicon M1/M2/M3)
# Double-click this file or run: ./start-learnjoy-mac.command

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Make the main script executable
chmod +x "$SCRIPT_DIR/ngrok-manager-mac.sh"

# Run the main script with default settings
# Arguments: [port] [region] [restart_hours]
# Default: port=3000, region=ap (Asia Pacific), restart=12 hours

cd "$SCRIPT_DIR"
./ngrok-manager-mac.sh 8080 ap 12
