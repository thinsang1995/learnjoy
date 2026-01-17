#!/bin/bash

# Display current ngrok URL for macOS

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
URL_FILE="$SCRIPT_DIR/current-ngrok-url.txt"

echo ""
if [ -f "$URL_FILE" ]; then
    echo "Current LearnJoy URL:"
    echo "========================================="
    cat "$URL_FILE"
    echo ""
    echo "========================================="
    
    # Copy to clipboard on macOS
    cat "$URL_FILE" | pbcopy
    echo "(URL copied to clipboard!)"
else
    echo "No ngrok URL found. Please start the ngrok manager first."
    echo "Run: ./start-learnjoy-mac.command"
fi
echo ""
