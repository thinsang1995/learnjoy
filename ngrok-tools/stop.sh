#!/bin/bash

# Stop Script for LearnJoy
# Usage: ./ngrok-tools/stop.sh

# Get directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🛑 Stopping LearnJoy..."

cd "$PROJECT_DIR"

# 1. Backup Data
echo "📦 Backing up database..."
if docker compose exec backend npm run db:backup; then
    echo "✅ Backup successful (data saved to backend/prisma/seeds/data.json)"
else
    echo "⚠️ Backup failed (or database was empty/uninitialized). Proceeding with shutdown..."
fi

# 2. Stop Docker Containers
echo "🐳 Stopping containers..."
docker compose down

# 3. Stop Ngrok
echo "🛑 Stopping ngrok..."
pkill -f ngrok 2>/dev/null

echo "✅ LearnJoy stopped successfully."
